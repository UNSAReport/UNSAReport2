package docs

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"sort"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/UNSAReport/tui/internal/check"
	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/lock"
	"github.com/UNSAReport/tui/internal/pkg"
	"github.com/UNSAReport/tui/internal/project"
	"github.com/UNSAReport/tui/internal/registry"
	"github.com/UNSAReport/tui/internal/scripts"
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
	client := registry.NewClient()
	files, err := client.DownloadSection(ctx, name, version, "components")
	if err != nil {
		return pkg.PkgToml{}, err
	}
	raw, ok := files["pkg.toml"]
	if !ok {
		return pkg.PkgToml{}, fmt.Errorf("pkg.toml missing in %s components archive", name)
	}
	p, err := pkg.Parse(string(raw))
	if err != nil {
		return pkg.PkgToml{}, err
	}
	if err := pkg.Validate(p); err != nil {
		return pkg.PkgToml{}, err
	}
	dest := filepath.Join(root, "components", name)
	var entries []lock.FileEntry
	names := make([]string, 0, len(files))
	for n := range files {
		if n == "pkg.toml" {
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
	l, err := lock.Load(root)
	if err != nil {
		return pkg.PkgToml{}, err
	}
	var deps []string
	for _, d := range p.Components.DependsOn {
		deps = append(deps, strings.TrimSpace(d))
	}
	l.Upsert(lock.PkgEntry{Name: name, Version: version, Files: entries, DependsOn: deps})
	if err := lock.Write(root, l); err != nil {
		return pkg.PkgToml{}, err
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
		if _, err := os.Stat(filepath.Join(r, report)); err == nil {
			entries, _ := os.ReadDir(filepath.Join(r, report))
			if len(entries) > 0 {
				return fmt.Errorf("report dir %s non-empty; refusing", filepath.Join(r, report))
			}
		}
		root = r
		existing = &cfg
		_ = existing
	} else {
		entries, err := os.ReadDir(cwd)
		if err != nil {
			return err
		}
		if len(entries) > 0 {
			return fmt.Errorf("init requires an empty directory; %q is not empty", cwd)
		}
		cfg := project.SpecConfig{}
		cfg.Project.TypstEntry = config.DefaultTypstEntry
		cfg.Project.RootMarkerVersion = config.RootMarkerVersion
		cfg.Scripts = map[string]project.ScriptDef{}
		cfg.Hooks = map[string][]string{}
		cfg.Dependencies = map[string]string{}
		if err := saveConfig(cwd, cfg); err != nil {
			return err
		}
	}
	cfg, err := project.Load(filepath.Join(root, config.ConfigFileName))
	if err != nil {
		return err
	}
	client := registry.NewClient()
	version, err := client.ResolveVersion(ctx, name, rng)
	if err != nil {
		return err
	}
	tplFiles, err := client.DownloadSection(ctx, name, version, "templates")
	if err != nil {
		return err
	}
	reportDir := filepath.Join(root, report)
	if err := os.MkdirAll(reportDir, config.PermDirPublic); err != nil {
		return err
	}
	for n, b := range tplFiles {
		target := filepath.Join(reportDir, filepath.FromSlash(n))
		if !strings.HasPrefix(filepath.Clean(target), filepath.Clean(reportDir)) {
			return fmt.Errorf("illegal template path %q", n)
		}
		if _, err := os.Stat(target); err == nil {
			continue
		}
		if err := os.MkdirAll(filepath.Dir(target), config.PermDirPublic); err != nil {
			return err
		}
		if err := os.WriteFile(target, b, config.PermFilePublic); err != nil {
			return err
		}
	}
	l, err := lock.Load(root)
	if err != nil {
		return err
	}
	if _, ok := l.Find(name); !ok {
		if _, err := installComponentTree(ctx, root, name, version); err != nil {
			return err
		}
	}
	_ = cfg
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
	client := registry.NewClient()
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
		prefix = p.Package.Name
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
		if existing, ok := cfg.Scripts[alias]; ok {
			if !reflect.DeepEqual(existing.Commands, def.Commands) {
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
		frag := project.ScriptFragment{Alias: alias, Description: def.Description, Origin: p.Package.Name, Commands: def.Commands}
		var buf strings.Builder
		if err := toml.NewEncoder(&buf).Encode(frag); err != nil {
			return fmt.Errorf("encode script fragment: %w", err)
		}
		name := strings.ReplaceAll(alias, ":", "-")
		if err := os.WriteFile(filepath.Join(fragDir, name+".toml"), []byte(buf.String()), config.PermFilePublic); err != nil {
			return err
		}
	}
	bound := map[string][]string{}
	for std, suggestions := range p.HooksSuggest {
		if !scripts.HookStandards[std] {
			return fmt.Errorf("package suggests unknown hook standard %q", std)
		}
		for _, s := range suggestions {
			alias := prefix + ":" + s
			if mode == "ask" {
				line, err := promptLine(fmt.Sprintf("Bind %q to [hooks.%s]? [y/N]:", alias, std))
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
			bound[std] = append(bound[std], alias)
		}
	}
	if len(bound) > 0 {
		hookDir := filepath.Join(root, config.ConfigDirName, "hooks")
		if err := os.MkdirAll(hookDir, config.PermDirPublic); err != nil {
			return err
		}
		for std, aliases := range bound {
			if err := mergeHookFragment(root, hookDir, std, prefix, p.Package.Name, aliases, cfg.Hooks[std]); err != nil {
				return err
			}
		}
	}
	return nil
}

// mergeHookFragment unions aliases into unsareport.d/hooks/<std>-<prefix>.toml.
func mergeHookFragment(root, hookDir, std, prefix, origin string, aliases, already []string) error {
	path := filepath.Join(hookDir, std+"-"+prefix+".toml")
	owned := map[string]bool{}
	for _, a := range already {
		owned[stripHookAlias(a)] = true
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
		for _, a := range frag.Aliases {
			owned[stripHookAlias(a)] = true
		}
	}
	for _, a := range aliases {
		if owned[stripHookAlias(a)] {
			continue
		}
		owned[stripHookAlias(a)] = true
		frag.Aliases = append(frag.Aliases, a)
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
	if strings.HasPrefix(a, "[") {
		if idx := strings.Index(a, "]"); idx >= 0 {
			return strings.TrimSpace(a[idx+1:])
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

func runHooks(root, std string, cfg project.SpecConfig) error {
	aliases, ok := cfg.Hooks[std]
	if !ok {
		return nil
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
		lines, err := scripts.Select(s.Commands, name, "")
		if err != nil {
			return fmt.Errorf("[hooks.%s] %w", std, err)
		}
		if err := scripts.RunLines(root, lines, ""); err != nil {
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
	client := registry.NewClient()
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
			if n == "pkg.toml" {
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
		raw, ok := files["pkg.toml"]
		var deps []string
		if ok {
			if p, err := pkg.Parse(string(raw)); err == nil {
				for _, d := range p.Components.DependsOn {
					deps = append(deps, strings.TrimSpace(d))
				}
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
	for _, aliases := range cfg.Hooks {
		for _, a := range aliases {
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
	return runCheck(root)
}

// originScriptAliases lists merged script aliases contributed by package origin.
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

// removeOriginFragments deletes script and hook fragments owned by origin.
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
	root, err := project.FindRoot(cwd)
	if err != nil {
		return err
	}
	return runCheck(root)
}

func typstBin() (string, error) {
	p, err := exec.LookPath("typst")
	if err != nil {
		return "", fmt.Errorf("typst not found on PATH (install via nix run nixpkgs#typst)")
	}
	return p, nil
}

func Build(cwd, report string) error {
	root, cfg, err := resolveRoot(cwd)
	if err != nil {
		return err
	}
	if err := runCheck(root); err != nil {
		return err
	}
	if err := runHooks(root, "build", cfg); err != nil {
		return err
	}
	bin, err := typstBin()
	if err != nil {
		return err
	}
	reportDir := filepath.Join(root, report)
	in := filepath.Join(reportDir, cfg.Project.TypstEntry)
	out := filepath.Join(reportDir, "report.pdf")
	cmd := exec.Command(bin, "compile", "--root", root, in, out)
	cmd.Dir = root
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("typst compile failed: %w", err)
	}
	return nil
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
	in := filepath.Join(reportDir, cfg.Project.TypstEntry)
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
	lines, err := scripts.Select(s.Commands, alias, "")
	if err != nil {
		return err
	}
	return scripts.RunLines(root, lines, extra)
}
