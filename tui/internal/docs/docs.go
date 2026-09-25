package docs

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"sort"
	"strconv"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/Masterminds/semver/v3"
	"github.com/UNSAReport/tui/internal/check"
	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/lock"
	"github.com/UNSAReport/tui/internal/pkg"
	"github.com/UNSAReport/tui/internal/project"
	"github.com/UNSAReport/tui/internal/registry"
	"github.com/UNSAReport/tui/internal/scripts"
)

const (
	PromptReplaceFiles   = "Do you want to continue and replace these files? [y/N]:"
	WarnConflictingFiles = "Warning: The following files already exist and will be replaced:"
	ErrInitCancelled     = "init cancelled"
	ErrNonTTYRequiresYes = "init aborted: conflicting files exist; rerun with --yes to overwrite"
)

func isTTY() bool {
	fi, err := os.Stdin.Stat()
	if err != nil {
		return false
	}
	return fi.Mode()&os.ModeCharDevice != 0
}

func resolveRoot(start string) (string, project.SpecConfig, error) {
	root, err := project.FindRoot(start)
	if err != nil {
		return "", project.SpecConfig{}, err
	}
	cfg, err := project.Load(filepath.Join(root, config.ConfigFileName))
	if err != nil {
		return "", project.SpecConfig{}, err
	}
	return root, cfg, nil
}

func saveConfig(root string, cfg project.SpecConfig) error {
	cfg = cfg.RootOnly()
	f, err := os.Create(filepath.Join(root, config.ConfigFileName))
	if err != nil {
		return fmt.Errorf("write %s: %w", config.ConfigFileName, err)
	}
	if err := toml.NewEncoder(f).Encode(cfg); err != nil {
		_ = f.Close()
		return fmt.Errorf("encode %s: %w", config.ConfigFileName, err)
	}
	return f.Close()
}

func runCheck(root string) error {
	findings := check.Run(root)
	if len(findings) > 0 {
		var sb strings.Builder
		for _, f := range findings {
			sb.WriteString(f.Error() + "\n")
		}
		return fmt.Errorf("check failed:\n%s", sb.String())
	}
	return nil
}

func parseNameRange(arg string) (name, rng string) {
	if idx := strings.LastIndex(arg, "@"); idx > 0 {
		return arg[:idx], arg[idx+1:]
	}
	return arg, "*"
}

func installComponentTree(ctx context.Context, root, name, version string) (pkg.PkgToml, error) {
	visited := map[string]bool{name: true}
	return installComponentTreeRecursive(ctx, root, name, version, visited)
}

func installComponentTreeRecursive(ctx context.Context, root, name, version string, visited map[string]bool) (pkg.PkgToml, error) {
	client, err := registry.NewClient()
	if err != nil {
		return pkg.PkgToml{}, err
	}
	files, err := client.DownloadSection(ctx, name, version, "components")
	if err != nil {
		return pkg.PkgToml{}, err
	}
	raw, ok := files[config.ConfigFileName]
	if !ok {
		return pkg.PkgToml{}, fmt.Errorf("%s missing in %s components archive", config.ConfigFileName, name)
	}
	p, err := pkg.Parse(string(raw))
	if err != nil {
		return pkg.PkgToml{}, err
	}
	if err := pkg.Validate(p); err != nil {
		return pkg.PkgToml{}, err
	}

	l, err := lock.Load(root)
	if err != nil {
		return pkg.PkgToml{}, err
	}

	if strings.HasPrefix(name, "@") {
		parts := strings.SplitN(name, "/", 2)
		if len(parts) == 2 {
			scopeName := parts[0]
			if _, ok := l.FindScope(scopeName); !ok {
				scopeFiles, sErr := client.DownloadScopeArchive(ctx, scopeName)
				if sErr == nil && len(scopeFiles) > 0 {
					scopeDest := filepath.Join(root, "components", scopeName)
					var scopeEntries []lock.FileEntry
					sNames := make([]string, 0, len(scopeFiles))
					for sf := range scopeFiles {
						if sf == config.ConfigFileName {
							continue
						}
						sNames = append(sNames, sf)
					}
					sort.Strings(sNames)
					for _, sf := range sNames {
						if strings.Contains(sf, "..") || filepath.IsAbs(sf) {
							return pkg.PkgToml{}, fmt.Errorf("illegal path %q in scope archive %s", sf, scopeName)
						}
						sTarget := filepath.Join(scopeDest, filepath.FromSlash(sf))
						if !strings.HasPrefix(filepath.Clean(sTarget), filepath.Clean(scopeDest)) {
							return pkg.PkgToml{}, fmt.Errorf("illegal path %q in scope archive %s", sf, scopeName)
						}
						if err := os.MkdirAll(filepath.Dir(sTarget), config.PermDirPublic); err != nil {
							return pkg.PkgToml{}, err
						}
						if err := os.WriteFile(sTarget, scopeFiles[sf], config.PermFilePublic); err != nil {
							return pkg.PkgToml{}, err
						}
						scopeEntries = append(scopeEntries, lock.FileEntry{Path: sf, SHA256: lock.SHA256Hex(scopeFiles[sf])})
					}
					l.UpsertScope(lock.ScopeEntry{Name: scopeName, Files: scopeEntries})
				}
			}
		}
	}

	dest := filepath.Join(root, "components", name)
	var entries []lock.FileEntry
	names := make([]string, 0, len(files))
	for n := range files {
		if n == config.ConfigFileName {
			continue
		}
		names = append(names, n)
	}
	sort.Strings(names)
	for _, n := range names {
		if strings.Contains(n, "..") || filepath.IsAbs(n) {
			return pkg.PkgToml{}, fmt.Errorf("illegal path %q in %s archive", n, name)
		}
		target := filepath.Join(dest, filepath.FromSlash(n))
		if !strings.HasPrefix(filepath.Clean(target), filepath.Clean(dest)) {
			return pkg.PkgToml{}, fmt.Errorf("illegal path %q in %s archive", n, name)
		}
		if err := os.MkdirAll(filepath.Dir(target), config.PermDirPublic); err != nil {
			return pkg.PkgToml{}, err
		}
		if err := os.WriteFile(target, files[n], config.PermFilePublic); err != nil {
			return pkg.PkgToml{}, err
		}
		entries = append(entries, lock.FileEntry{Path: n, SHA256: lock.SHA256Hex(files[n])})
	}
	var deps []string
	for depName, depRange := range p.Dependencies {
		deps = append(deps, strings.TrimSpace(depName)+" "+strings.TrimSpace(depRange))
	}
	sort.Strings(deps)
	l.Upsert(lock.PkgEntry{Name: name, Version: version, Files: entries, DependsOn: deps})
	if err := lock.Write(root, l); err != nil {
		return pkg.PkgToml{}, err
	}

	for depName, depRange := range p.Dependencies {
		depName = strings.TrimSpace(depName)
		depRange = strings.TrimSpace(depRange)
		if depName == "" {
			continue
		}
		if visited[depName] {
			continue
		}
		visited[depName] = true

		if existing, ok := l.Find(depName); ok {
			compDir := filepath.Join(root, "components", depName)
			if _, statErr := os.Stat(compDir); statErr == nil {
				c, cErr := semver.NewConstraint(depRange)
				v, vErr := semver.StrictNewVersion(existing.Version)
				if cErr == nil && vErr == nil && c.Check(v) {
					continue
				}
			}
		}

		depVersion, err := client.ResolveVersion(ctx, depName, depRange)
		if err != nil {
			return pkg.PkgToml{}, fmt.Errorf("resolve dependency %q (%s): %w", depName, depRange, err)
		}
		if _, err := installComponentTreeRecursive(ctx, root, depName, depVersion, visited); err != nil {
			return pkg.PkgToml{}, fmt.Errorf("install dependency %q: %w", depName, err)
		}
	}

	return p, nil
}

func selectMode(flags []string) (mode string, err error) {
	for _, f := range flags {
		switch f {
		case "--yes":
			return "yes", nil
		case "--all":
			return "all", nil
		case "--none":
			return "none", nil
		}
	}
	if !isTTY() {
		return "", fmt.Errorf("non-TTY requires one of --yes|--all|--none")
	}
	return "ask", nil
}

func promptLine(prompt string) (string, error) {
	fmt.Printf("%s ", prompt)
	r := bufio.NewReader(os.Stdin)
	line, err := r.ReadString('\n')
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(line), nil
}

type InitOptions struct {
	Template string
	Report   string
	Yes      bool
	Flags    []string
	Confirm  func(conflicts []string) (bool, error)
}

func normalizeTemplateFiles(files map[string][]byte) (map[string][]byte, error) {
	if len(files) == 0 {
		return map[string][]byte{}, nil
	}

	cleaned := make(map[string][]byte, len(files))
	for rawPath, data := range files {
		clean := filepath.ToSlash(rawPath)
		clean = strings.TrimPrefix(clean, "./")
		clean = strings.TrimPrefix(clean, "/")
		if clean == "" || clean == "." {
			continue
		}
		if strings.Contains(clean, "..") || filepath.IsAbs(clean) {
			return nil, fmt.Errorf("illegal template path %q", rawPath)
		}
		cleaned[clean] = data
	}
	if len(cleaned) == 0 {
		return cleaned, nil
	}

	var topDir string
	hasSingleTopDir := true
	for p := range cleaned {
		parts := strings.Split(p, "/")
		if len(parts) <= 1 {
			hasSingleTopDir = false
			break
		} else if topDir == "" {
			topDir = parts[0]
		} else if parts[0] != topDir {
			hasSingleTopDir = false
			break
		}
	}

	if hasSingleTopDir && topDir != "" {
		prefix := topDir + "/"
		out := make(map[string][]byte, len(cleaned))
		for p, data := range cleaned {
			stripped := strings.TrimPrefix(p, prefix)
			if stripped == "" || stripped == "." {
				continue
			}
			if _, exists := out[stripped]; exists {
				return nil, fmt.Errorf("duplicate template file destination %q", stripped)
			}
			out[stripped] = data
		}
		return out, nil
	}

	return cleaned, nil
}

func Init(ctx context.Context, cwd string, opt InitOptions) error {
	name, rng := parseNameRange(opt.Template)
	if name == "" {
		return fmt.Errorf("template name must not be empty")
	}
	report := opt.Report
	if report == "" {
		report = "t1"
	}
	root := cwd
	var existing *project.SpecConfig
	if r, cfg, err := resolveRoot(cwd); err == nil {
		root = r
		existing = &cfg
	}

	client, err := registry.NewClient()
	if err != nil {
		return err
	}
	version, err := client.ResolveVersion(ctx, name, rng)
	if err != nil {
		return err
	}
	tplFiles, err := client.DownloadSection(ctx, name, version, "templates")
	if err != nil {
		return err
	}

	reportDir := filepath.Join(root, report)

	normalizedTplFiles, err := normalizeTemplateFiles(tplFiles)
	if err != nil {
		return err
	}

	var conflicts []string
	if existing == nil {
		cfgPath := filepath.Join(root, config.ConfigFileName)
		if _, err := os.Stat(cfgPath); err == nil {
			conflicts = append(conflicts, config.ConfigFileName)
		}
	}
	for n := range normalizedTplFiles {
		target := filepath.Join(reportDir, filepath.FromSlash(n))
		if _, err := os.Stat(target); err == nil {
			rel, err := filepath.Rel(root, target)
			if err != nil {
				rel = target
			}
			conflicts = append(conflicts, filepath.ToSlash(rel))
		}
	}
	sort.Strings(conflicts)

	if len(conflicts) > 0 {
		if opt.Confirm != nil {
			confirmed, err := opt.Confirm(conflicts)
			if err != nil {
				return err
			}
			if !confirmed {
				return errors.New(ErrInitCancelled)
			}
		} else if opt.Yes {
			fmt.Println(WarnConflictingFiles)
			for _, f := range conflicts {
				fmt.Printf("  - %s\n", f)
			}
		} else {
			fmt.Println(WarnConflictingFiles)
			for _, f := range conflicts {
				fmt.Printf("  - %s\n", f)
			}
			if !isTTY() {
				return errors.New(ErrNonTTYRequiresYes)
			}
			ans, err := promptLine(PromptReplaceFiles)
			if err != nil {
				return err
			}
			if strings.ToLower(ans) != "y" && strings.ToLower(ans) != "yes" {
				return errors.New(ErrInitCancelled)
			}
		}
	}

	if existing == nil {
		cfg := project.SpecConfig{}
		cfg.Project.TypstEntry = config.DefaultTypstEntry
		cfg.Project.ConfigVersion = config.ConfigVersion
		cfg.Scripts = map[string]project.ScriptDef{}
		cfg.Hooks = map[string]project.HookTiming{}
		cfg.Dependencies = map[string]string{}
		if err := saveConfig(root, cfg); err != nil {
			return err
		}
	}

	if err := os.MkdirAll(reportDir, config.PermDirPublic); err != nil {
		return err
	}
	for n, b := range normalizedTplFiles {
		target := filepath.Join(reportDir, filepath.FromSlash(n))
		if !strings.HasPrefix(filepath.Clean(target), filepath.Clean(reportDir)) {
			return fmt.Errorf("illegal template path %q", n)
		}
		if err := os.MkdirAll(filepath.Dir(target), config.PermDirPublic); err != nil {
			return err
		}
		if err := os.WriteFile(target, b, config.PermFilePublic); err != nil {
			return err
		}
	}

	p, err := installComponentTree(ctx, root, name, version)
	if err != nil {
		return err
	}

	cfg, err := project.Load(filepath.Join(root, config.ConfigFileName))
	if err != nil {
		return err
	}
	if cfg.Dependencies == nil {
		cfg.Dependencies = map[string]string{}
	}
	if _, ok := cfg.Dependencies[name]; !ok {
		depRng := rng
		if depRng == "" || depRng == "*" {
			depRng = "^" + version
		}
		cfg.Dependencies[name] = depRng
		if err := saveConfig(root, cfg); err != nil {
			return err
		}
	}

	if len(opt.Flags) > 0 {
		mode, mErr := selectMode(opt.Flags)
		if mErr != nil {
			return mErr
		}
		if mode != "" && mode != "none" {
			if err := copyCommands(root, &cfg, p, mode); err != nil {
				return err
			}
		}
	} else if opt.Yes {
		if err := copyCommands(root, &cfg, p, "all"); err != nil {
			return err
		}
	}

	return runCheck(root)
}

type AddOptions struct {
	Package string
	Flags   []string
}

func Add(ctx context.Context, cwd string, opt AddOptions) error {
	root, cfg, err := resolveRoot(cwd)
	if err != nil {
		return err
	}
	name, rng := parseNameRange(opt.Package)
	if name == "" {
		return fmt.Errorf("package name must not be empty")
	}
	mode, err := selectMode(opt.Flags)
	if err != nil {
		return err
	}
	client, err := registry.NewClient()
	if err != nil {
		return err
	}
	version, err := client.ResolveVersion(ctx, name, rng)
	if err != nil {
		return err
	}
	p, err := installComponentTree(ctx, root, name, version)
	if err != nil {
		return err
	}
	if err := copyCommands(root, &cfg, p, mode); err != nil {
		return err
	}
	if cfg.Dependencies == nil {
		cfg.Dependencies = map[string]string{}
	}
	if rng == "" {
		rng = version
	}
	cfg.Dependencies[name] = rng
	if err := saveConfig(root, cfg); err != nil {
		return err
	}
	return runCheck(root)
}

func copyCommands(root string, cfg *project.SpecConfig, p pkg.PkgToml, mode string) error {
	prefix := p.Package.CommandPrefix
	if prefix == "" {
		prefix = p.Package.Name[strings.LastIndex(p.Package.Name, "/")+1:]
	}
	cmds := make([]string, 0, len(p.Commands))
	for c := range p.Commands {
		cmds = append(cmds, c)
	}
	sort.Strings(cmds)
	selected := map[string]bool{}
	switch mode {
	case "none":
	case "yes", "all":
		for _, c := range cmds {
			selected[c] = true
		}
	case "ask":
		fmt.Println("Commands:")
		for i, c := range cmds {
			fmt.Printf("  %d. %s:%s — %s\n", i+1, prefix, c, p.Commands[c].Description)
		}
		line, err := promptLine("Select [numbers/all/none, default=all]:")
		if err != nil {
			return err
		}
		line = strings.ToLower(strings.TrimSpace(line))
		switch line {
		case "", "all":
			for _, c := range cmds {
				selected[c] = true
			}
		case "none":
		default:
			for _, part := range strings.Split(line, ",") {
				part = strings.TrimSpace(part)
				var idx int
				if _, err := fmt.Sscanf(part, "%d", &idx); err != nil || idx < 1 || idx > len(cmds) {
					return fmt.Errorf("invalid selection %q", part)
				}
				selected[cmds[idx-1]] = true
			}
		}
	default:
		return fmt.Errorf("unknown command-select mode %q", mode)
	}
	fragDir := filepath.Join(root, config.ConfigDirName, "scripts")
	if err := os.MkdirAll(fragDir, config.PermDirPublic); err != nil {
		return err
	}
	for c := range selected {
		alias := prefix + ":" + c
		def := p.Commands[c]
		converted := project.JoinCommands(def.Commands)
		if len(converted) == 0 {
			return fmt.Errorf("package command %q has no runnable lines", c)
		}
		if existing, ok := cfg.Scripts[alias]; ok {
			if !reflect.DeepEqual(existing.Commands, converted) {
				if mode != "ask" {
					return fmt.Errorf("alias collision on %q; aborted", alias)
				}
				line, err := promptLine(fmt.Sprintf("alias %q exists with different body; new alias name (empty aborts):", alias))
				if err != nil {
					return err
				}
				if strings.TrimSpace(line) == "" {
					return fmt.Errorf("alias collision on %q; aborted", alias)
				}
				alias = strings.TrimSpace(line)
			} else if src := cfg.ScriptSource(alias); src == "" {
				continue
			}
		}
		frag := project.ScriptFragment{Alias: alias, Description: def.Description, Origin: p.Package.Name, Commands: converted}
		var buf strings.Builder
		if err := toml.NewEncoder(&buf).Encode(frag); err != nil {
			return fmt.Errorf("encode script fragment: %w", err)
		}
		name := strings.ReplaceAll(alias, ":", "-")
		if err := os.WriteFile(filepath.Join(fragDir, name+".toml"), []byte(buf.String()), config.PermFilePublic); err != nil {
			return err
		}
	}
	bound := map[string]project.HookTiming{}
	for std, timing := range p.Hooks {
		if !scripts.HookStandards[std] {
			return fmt.Errorf("package suggests unknown hook standard %q", std)
		}
		var current project.HookTiming
		for _, s := range timing.Before {
			alias := prefix + ":" + s
			if mode == "ask" {
				line, err := promptLine(fmt.Sprintf("Bind %q to [hooks.%s.before]? [y/N]:", alias, std))
				if err != nil {
					return err
				}
				if strings.ToLower(line) != "y" && strings.ToLower(line) != "yes" {
					continue
				}
			} else if mode == "yes" || mode == "all" {
				if _, ok := p.Commands[s]; !ok {
					continue
				}
			} else if mode == "none" {
				continue
			} else {
				return fmt.Errorf("unknown command-select mode %q", mode)
			}
			current.Before = append(current.Before, alias)
		}
		for _, s := range timing.After {
			alias := prefix + ":" + s
			if mode == "ask" {
				line, err := promptLine(fmt.Sprintf("Bind %q to [hooks.%s.after]? [y/N]:", alias, std))
				if err != nil {
					return err
				}
				if strings.ToLower(line) != "y" && strings.ToLower(line) != "yes" {
					continue
				}
			} else if mode == "yes" || mode == "all" {
				if _, ok := p.Commands[s]; !ok {
					continue
				}
			} else if mode == "none" {
				continue
			} else {
				return fmt.Errorf("unknown command-select mode %q", mode)
			}
			current.After = append(current.After, alias)
		}
		if len(current.Before) > 0 || len(current.After) > 0 {
			bound[std] = current
		}
	}
	if len(bound) > 0 {
		hookDir := filepath.Join(root, config.ConfigDirName, "hooks")
		if err := os.MkdirAll(hookDir, config.PermDirPublic); err != nil {
			return err
		}
		for std, timing := range bound {
			if err := mergeHookFragment(root, hookDir, std, prefix, p.Package.Name, timing, cfg.Hooks[std]); err != nil {
				return err
			}
		}
	}
	if len(p.ConfigSchema) > 0 && (len(selected) > 0 || len(bound) > 0) {
		if err := collectPackageConfig(root, cfg, p, prefix, mode); err != nil {
			return err
		}
	}
	return nil
}

func collectPackageConfig(root string, cfg *project.SpecConfig, p pkg.PkgToml, prefix, mode string) error {
	origin := p.Package.Name
	keys := make([]string, 0, len(p.ConfigSchema))
	for k := range p.ConfigSchema {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	vals := map[string]string{}
	if cfg.PackageConfig != nil {
		for k, v := range cfg.PackageConfig[origin].Values {
			vals[k] = v
		}
	}
	for _, k := range keys {
		e := p.ConfigSchema[k]
		if v, ok := vals[k]; ok {
			if err := checkConfigType(k, e.Type, v); err != nil {
				return err
			}
			continue
		}
		def, hasDef := configDefault(e)
		var val string
		switch mode {
		case "ask":
			prompt := fmt.Sprintf("package %q config %q", origin, k)
			if e.Doc != "" {
				prompt += fmt.Sprintf(" (%s)", e.Doc)
			}
			if hasDef {
				prompt += fmt.Sprintf(" [default %s]:", def)
			} else {
				prompt += " (required):"
			}
			line, err := promptLine(prompt)
			if err != nil {
				return err
			}
			val = strings.TrimSpace(line)
			if val == "" {
				val = def
			}
			if val == "" {
				if e.Required {
					return fmt.Errorf("package %q requires config %q (no default); aborting", origin, k)
				}
				continue
			}
		case "yes", "all":
			if !hasDef {
				if e.Required {
					return fmt.Errorf("package %q requires config %q with no default; re-run with prompts", origin, k)
				}
				continue
			}
			val = def
		default:
			return fmt.Errorf("unknown command-select mode %q", mode)
		}
		if err := checkConfigType(k, e.Type, val); err != nil {
			return err
		}
		vals[k] = val
	}
	if len(vals) == 0 {
		return nil
	}
	envPrefix := project.SanitizeEnvPart(prefix)
	if envPrefix == "" {
		return fmt.Errorf("package %q yields an empty config env prefix", origin)
	}
	frag := project.ConfigFragment{Origin: origin, EnvPrefix: envPrefix, Values: vals}
	dir := filepath.Join(root, config.ConfigDirName, "config")
	if err := os.MkdirAll(dir, config.PermDirPublic); err != nil {
		return err
	}
	var buf strings.Builder
	if err := toml.NewEncoder(&buf).Encode(frag); err != nil {
		return fmt.Errorf("encode config fragment: %w", err)
	}
	if err := os.WriteFile(filepath.Join(dir, project.ConfigFileName(origin)), []byte(buf.String()), config.PermFilePublic); err != nil {
		return err
	}
	if cfg.PackageConfig == nil {
		cfg.PackageConfig = map[string]project.PackageValues{}
	}
	cfg.PackageConfig[origin] = project.PackageValues{EnvPrefix: envPrefix, Values: vals}
	return nil
}

func configDefault(e pkg.ConfigSchemaEntry) (string, bool) {
	if e.Default == nil {
		return "", false
	}
	switch v := e.Default.(type) {
	case string:
		return v, true
	case bool:
		return strconv.FormatBool(v), true
	case int64:
		return strconv.FormatInt(v, 10), true
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64), true
	default:
		return fmt.Sprintf("%v", v), true
	}
}

func checkConfigType(key, typ, val string) error {
	switch typ {
	case "bool":
		if _, err := strconv.ParseBool(val); err != nil {
			return fmt.Errorf("config %q must be bool, got %q", key, val)
		}
	case "int":
		if _, err := strconv.Atoi(val); err != nil {
			return fmt.Errorf("config %q must be int, got %q", key, val)
		}
	}
	return nil
}

func mergeHookFragment(root, hookDir, std, prefix, origin string, toBind project.HookTiming, already project.HookTiming) error {
	path := filepath.Join(hookDir, std+"-"+prefix+".toml")
	owned := map[string]bool{}
	for _, a := range already.Before {
		owned[stripHookAlias(a)] = true
	}
	for _, a := range already.After {
		owned["after\x00"+stripHookAlias(a)] = true
	}
	frag := project.HookFragment{Standard: std, Origin: origin}
	if raw, err := os.ReadFile(path); err == nil {
		md, derr := toml.Decode(string(raw), &frag)
		if derr != nil {
			return fmt.Errorf("parse %s: %w", relHookPath(root, path), derr)
		}
		if undecoded := md.Undecoded(); len(undecoded) > 0 {
			return fmt.Errorf("unknown field %q in %s", undecoded[0].String(), relHookPath(root, path))
		}
		if frag.Standard != std {
			return fmt.Errorf("%s: standard %q mismatches file", relHookPath(root, path), frag.Standard)
		}
		if frag.Origin != "" && frag.Origin != origin {
			return fmt.Errorf("%s: owned by package %q", relHookPath(root, path), frag.Origin)
		}
		frag.Origin = origin
		for _, a := range frag.Before {
			owned[stripHookAlias(a)] = true
		}
		for _, a := range frag.After {
			owned["after\x00"+stripHookAlias(a)] = true
		}
	}
	for _, a := range toBind.Before {
		if owned[stripHookAlias(a)] {
			continue
		}
		owned[stripHookAlias(a)] = true
		frag.Before = append(frag.Before, a)
	}
	for _, a := range toBind.After {
		if owned["after\x00"+stripHookAlias(a)] {
			continue
		}
		owned["after\x00"+stripHookAlias(a)] = true
		frag.After = append(frag.After, a)
	}
	var buf strings.Builder
	if err := toml.NewEncoder(&buf).Encode(frag); err != nil {
		return fmt.Errorf("encode hook fragment: %w", err)
	}
	if err := os.WriteFile(path, []byte(buf.String()), config.PermFilePublic); err != nil {
		return err
	}
	return nil
}

func stripHookAlias(a string) string {
	a = strings.TrimSpace(a)
	if strings.HasPrefix(a, "os:") {
		if _, rest, err := scripts.SplitPrefix(a); err == nil {
			return rest
		}
	}
	return a
}

func relHookPath(root, path string) string {
	if rel, err := filepath.Rel(root, path); err == nil {
		return filepath.ToSlash(rel)
	}
	return path
}

func runHooks(root, std, when string, cfg project.SpecConfig, env []string) error {
	timing, ok := cfg.Hooks[std]
	if !ok {
		return nil
	}
	aliases := timing.Before
	if when == project.HookAfter {
		aliases = timing.After
	}
	for _, a := range aliases {
		prefix, name, err := scripts.SplitPrefix(strings.TrimSpace(a))
		if err != nil {
			return fmt.Errorf("[hooks.%s] %w", std, err)
		}
		applies, err := scripts.HookApplies(prefix)
		if err != nil {
			return fmt.Errorf("[hooks.%s] %w", std, err)
		}
		if !applies {
			continue
		}
		s, ok := cfg.Scripts[name]
		if !ok {
			return fmt.Errorf("[hooks.%s] unknown alias %q", std, name)
		}
		cmd, err := scripts.Select(s.Commands, name, "")
		if err != nil {
			return fmt.Errorf("[hooks.%s] %w", std, err)
		}
		hookEnv := env
		if origin := cfg.ScriptOrigin(root, name); origin != "" {
			hookEnv = append(append([]string{}, env...), cfg.ConfigEnv(origin)...)
		}
		if err := scripts.RunScript(root, cmd, "", hookEnv); err != nil {
			return fmt.Errorf("[hooks.%s] %w", std, err)
		}
	}
	return nil
}

type UpdateOptions struct {
	Package string
	Flags   []string
}

func Update(ctx context.Context, cwd string, opt UpdateOptions) error {
	root, _, err := resolveRoot(cwd)
	if err != nil {
		return err
	}
	mode, err := selectMode(opt.Flags)
	if err != nil {
		return err
	}
	l, err := lock.Load(root)
	if err != nil {
		return err
	}
	var targets []lock.PkgEntry
	if opt.Package != "" {
		for _, e := range l.Pkg {
			if e.Name == opt.Package {
				targets = append(targets, e)
			}
		}
		if len(targets) == 0 {
			return fmt.Errorf("package %q not in lock", opt.Package)
		}
	} else {
		targets = l.Pkg
	}
	client, err := registry.NewClient()
	if err != nil {
		return err
	}
	for _, t := range targets {
		version, err := client.ResolveVersion(ctx, t.Name, "*")
		if err != nil {
			return err
		}
		if version == t.Version {
			continue
		}
		files, err := client.DownloadSection(ctx, t.Name, version, "components")
		if err != nil {
			return err
		}
		dest := filepath.Join(root, "components", t.Name)
		var names []string
		for n := range files {
			if n == config.ConfigFileName {
				continue
			}
			names = append(names, n)
		}
		sort.Strings(names)
		apply := map[string]bool{}
		switch mode {
		case "all", "yes":
			for _, n := range names {
				apply[n] = true
			}
		case "ask":
			for _, n := range names {
				cur, _ := os.ReadFile(filepath.Join(dest, filepath.FromSlash(n)))
				if string(cur) == string(files[n]) {
					continue
				}
				line, err := promptLine(fmt.Sprintf("Apply update %s/%s? [y/N]:", t.Name, n))
				if err != nil {
					return err
				}
				if strings.ToLower(line) == "y" || strings.ToLower(line) == "yes" {
					apply[n] = true
				}
			}
		case "none":
		}
		var entries []lock.FileEntry
		for _, n := range names {
			target := filepath.Join(dest, filepath.FromSlash(n))
			if apply[n] {
				if err := os.MkdirAll(filepath.Dir(target), config.PermDirPublic); err != nil {
					return err
				}
				if err := os.WriteFile(target, files[n], config.PermFilePublic); err != nil {
					return err
				}
			}
			b, err := os.ReadFile(target)
			if err != nil {
				return err
			}
			entries = append(entries, lock.FileEntry{Path: n, SHA256: lock.SHA256Hex(b)})
		}
		raw, ok := files[config.ConfigFileName]
		var deps []string
		if ok {
			if p, err := pkg.Parse(string(raw)); err == nil {
				for depName, depRange := range p.Dependencies {
					deps = append(deps, strings.TrimSpace(depName)+" "+strings.TrimSpace(depRange))
				}
				sort.Strings(deps)
			}
		}
		l.Upsert(lock.PkgEntry{Name: t.Name, Version: version, Files: entries, DependsOn: deps})
	}
	if err := lock.Write(root, l); err != nil {
		return err
	}
	return runCheck(root)
}

func Remove(cwd, name string) error {
	root, _, err := resolveRoot(cwd)
	if err != nil {
		return err
	}
	l, err := lock.Load(root)
	if err != nil {
		return err
	}
	if strings.HasPrefix(name, "@") && !strings.Contains(name, "/") {
		scopeName := name
		prefix := scopeName + "/"
		for _, e := range l.Pkg {
			if strings.HasPrefix(e.Name, prefix) {
				return fmt.Errorf("cannot remove scope %q: package %q is still installed under this scope", scopeName, e.Name)
			}
		}
		scopeDir := filepath.Join(root, "components", scopeName)
		if err := os.RemoveAll(scopeDir); err != nil {
			return err
		}
		l.RemoveScope(scopeName)
		if err := lock.Write(root, l); err != nil {
			return err
		}
		return runCheck(root)
	}

	for _, e := range l.Pkg {
		for _, d := range e.DependsOn {
			if depName, _, _ := strings.Cut(d, " "); depName == name {
				return fmt.Errorf("cannot remove %q: locked package %q depends_on it", name, e.Name)
			}
		}
	}
	cfg, err := project.Load(filepath.Join(root, config.ConfigFileName))
	if err != nil {
		return err
	}
	hooked := map[string]bool{}
	for _, timing := range cfg.Hooks {
		for _, a := range timing.Before {
			hooked[stripHookAlias(a)] = true
		}
		for _, a := range timing.After {
			hooked[stripHookAlias(a)] = true
		}
	}
	ownScripts, err := originScriptAliases(root, name)
	if err != nil {
		return err
	}
	for _, alias := range ownScripts {
		if hooked[alias] {
			return fmt.Errorf("cannot remove %q: script %q still referenced by [hooks]; unhook first", name, alias)
		}
	}
	for alias := range cfg.Scripts {
		if cfg.ScriptSource(alias) == "" && (strings.HasPrefix(alias, name+":") || strings.Contains(alias, ":"+name)) {
			if hooked[stripHookAlias(alias)] {
				return fmt.Errorf("cannot remove %q: script %q still referenced by [hooks]; unhook first", name, alias)
			}
		}
	}
	if err := os.RemoveAll(filepath.Join(root, "components", name)); err != nil {
		return err
	}
	if err := removeOriginFragments(root, name); err != nil {
		return err
	}
	l.Remove(name)
	if err := lock.Write(root, l); err != nil {
		return err
	}
	if cfg.Dependencies != nil {
		delete(cfg.Dependencies, name)
		if err := saveConfig(root, cfg); err != nil {
			return err
		}
	}

	if strings.HasPrefix(name, "@") && strings.Contains(name, "/") {
		parts := strings.SplitN(name, "/", 2)
		scopeName := parts[0]
		remaining := 0
		scopePrefix := scopeName + "/"
		for _, e := range l.Pkg {
			if strings.HasPrefix(e.Name, scopePrefix) {
				remaining++
			}
		}
		if remaining == 0 {
			if _, ok := l.FindScope(scopeName); ok {
				fmt.Printf("ℹ️ No remaining packages in scope %s. To clean up the scope configuration, run: unsarep docs remove %s\n", scopeName, scopeName)
			}
		}
	}

	return runCheck(root)
}

func originScriptAliases(root, origin string) ([]string, error) {
	dir := filepath.Join(root, config.ConfigDirName, "scripts")
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	var out []string
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".toml") {
			continue
		}
		var frag project.ScriptFragment
		raw, err := os.ReadFile(filepath.Join(dir, e.Name()))
		if err != nil {
			return nil, err
		}
		if _, err := toml.Decode(string(raw), &frag); err != nil {
			return nil, fmt.Errorf("parse %s: %w", filepath.Join(config.ConfigDirName, "scripts", e.Name()), err)
		}
		if frag.Origin == origin {
			out = append(out, frag.Alias)
		}
	}
	return out, nil
}

func removeOriginFragments(root, origin string) error {
	for _, sub := range []string{"scripts", "hooks"} {
		dir := filepath.Join(root, config.ConfigDirName, sub)
		entries, err := os.ReadDir(dir)
		if err != nil {
			if os.IsNotExist(err) {
				continue
			}
			return err
		}
		for _, e := range entries {
			if e.IsDir() || !strings.HasSuffix(e.Name(), ".toml") {
				continue
			}
			path := filepath.Join(dir, e.Name())
			raw, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			own := ""
			if sub == "scripts" {
				var frag project.ScriptFragment
				if _, err := toml.Decode(string(raw), &frag); err != nil {
					return fmt.Errorf("parse %s: %w", path, err)
				}
				own = frag.Origin
			} else {
				var frag project.HookFragment
				if _, err := toml.Decode(string(raw), &frag); err != nil {
					return fmt.Errorf("parse %s: %w", path, err)
				}
				own = frag.Origin
			}
			if own == origin {
				if err := os.Remove(path); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func Check(cwd string) error {
	root, cfg, err := resolveRoot(cwd)
	if err != nil {
		return err
	}
	if err := runHooks(root, "check", project.HookBefore, cfg, nil); err != nil {
		return err
	}
	if err := runCheck(root); err != nil {
		return err
	}
	return runHooks(root, "check", project.HookAfter, cfg, nil)
}

func typstBin() (string, error) {
	p, err := exec.LookPath("typst")
	if err != nil {
		return "", fmt.Errorf("typst not found on PATH (install via nix run nixpkgs#typst)")
	}
	return p, nil
}

func resolveTypstEntry(reportDir, configured string, prompt func(string) (string, error)) (string, error) {
	if configured != "" {
		if _, err := os.Stat(filepath.Join(reportDir, configured)); err == nil {
			return configured, nil
		}
	}
	entries, err := os.ReadDir(reportDir)
	if err != nil {
		return "", err
	}
	var cands []string
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".typ") {
			continue
		}
		cands = append(cands, e.Name())
	}
	sort.Strings(cands)
	switch len(cands) {
	case 0:
		if configured != "" {
			return "", fmt.Errorf("typst entry %q not found in %s and no .typ file to fall back to", configured, reportDir)
		}
		return "", fmt.Errorf("no .typ file in %s (want %s or set [project] typst_entry)", reportDir, config.DefaultTypstEntry)
	case 1:
		if configured != "" && cands[0] != configured {
			fmt.Printf("typst entry %q not found; using %q\n", configured, cands[0])
		}
		return cands[0], nil
	default:
		fmt.Println("Typst files:")
		for i, c := range cands {
			fmt.Printf("  %d. %s\n", i+1, c)
		}
		line, err := prompt("Select [number]:")
		if err != nil {
			return "", err
		}
		var idx int
		if _, err := fmt.Sscanf(strings.TrimSpace(line), "%d", &idx); err != nil || idx < 1 || idx > len(cands) {
			return "", fmt.Errorf("invalid selection %q", line)
		}
		return cands[idx-1], nil
	}
}

func Build(cwd, report string) error {
	root, cfg, err := resolveRoot(cwd)
	if err != nil {
		return err
	}
	if err := runCheck(root); err != nil {
		return err
	}
	hookEnvBefore := []string{config.EnvReportDir + "=" + report}
	if err := runHooks(root, "build", project.HookBefore, cfg, hookEnvBefore); err != nil {
		return err
	}
	bin, err := typstBin()
	if err != nil {
		return err
	}
	reportDir := filepath.Join(root, report)
	entry, err := resolveTypstEntry(reportDir, cfg.Project.TypstEntry, promptLine)
	if err != nil {
		return err
	}
	in := filepath.Join(reportDir, entry)
	hookEnvAfter := []string{config.EnvReportDir + "=" + report, config.EnvTypstEntry + "=" + entry}
	out := filepath.Join(reportDir, "report.pdf")
	cmd := exec.Command(bin, "compile", "--root", root, in, out)
	cmd.Dir = root
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("typst compile failed: %w", err)
	}
	return runHooks(root, "build", project.HookAfter, cfg, hookEnvAfter)
}

func Watch(cwd, report string) error {
	root, cfg, err := resolveRoot(cwd)
	if err != nil {
		return err
	}
	bin, err := typstBin()
	if err != nil {
		return err
	}
	reportDir := filepath.Join(root, report)
	entry, err := resolveTypstEntry(reportDir, cfg.Project.TypstEntry, promptLine)
	if err != nil {
		return err
	}
	in := filepath.Join(reportDir, entry)
	out := filepath.Join(reportDir, "report.pdf")
	cmd := exec.Command(bin, "watch", "--root", root, in, out)
	cmd.Dir = root
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("typst watch failed: %w", err)
	}
	return nil
}

func Run(cwd, alias string, args []string) error {
	root, cfg, err := resolveRoot(cwd)
	if err != nil {
		return err
	}
	s, ok := cfg.Scripts[alias]
	if !ok {
		avail := make([]string, 0, len(cfg.Scripts))
		for a := range cfg.Scripts {
			avail = append(avail, a)
		}
		sort.Strings(avail)
		return fmt.Errorf("unknown alias %q (available: %s)", alias, strings.Join(avail, ", "))
	}
	extra := strings.Join(args, " ")
	cmd, err := scripts.Select(s.Commands, alias, "")
	if err != nil {
		return err
	}
	var cfgEnv []string
	if origin := cfg.ScriptOrigin(root, alias); origin != "" {
		cfgEnv = cfg.ConfigEnv(origin)
	}
	return scripts.RunScript(root, cmd, extra, cfgEnv)
}
