package docs

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
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
	if _, err := os.Stat(filepath.Join(dest, p.Package.Entrypoint)); err != nil {
		return pkg.PkgToml{}, fmt.Errorf("entrypoint %q missing in installed %s", p.Package.Entrypoint, name)
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
	Name     string
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
	projName := opt.Name
	if projName == "" {
		projName = name
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
		cfg.Project.Name = projName
		cfg.Project.TypstEntry = config.DefaultTypstEntry
		cfg.Project.RootMarkerVersion = config.RootMarkerVersion
		cfg.Scripts = map[string]project.ScriptDef{}
		cfg.Hooks = map[string][]string{}
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
	case "yes":
		for _, c := range cmds {
			if p.Commands[c].DefaultSelect {
				selected[c] = true
			}
		}
	case "all":
		for _, c := range cmds {
			selected[c] = true
		}
	case "ask":
		fmt.Println("Commands:")
		for i, c := range cmds {
			d := p.Commands[c]
			fmt.Printf("  %d. %s:%s — %s (default=%v)\n", i+1, prefix, c, d.Description, d.DefaultSelect)
		}
		line, err := promptLine("Select [numbers/all/none, default=yes-defaults]:")
		if err != nil {
			return err
		}
		line = strings.ToLower(strings.TrimSpace(line))
		switch line {
		case "", "yes", "defaults":
			for _, c := range cmds {
				if p.Commands[c].DefaultSelect {
					selected[c] = true
				}
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
	}
	if cfg.Scripts == nil {
		cfg.Scripts = map[string]project.ScriptDef{}
	}
	for c := range selected {
		alias := prefix + ":" + c
		def := p.Commands[c]
		if existing, ok := cfg.Scripts[alias]; ok {
			same := len(existing.Commands) == len(def.Commands)
			if same {
				for i := range existing.Commands {
					if existing.Commands[i] != def.Commands[i] {
						same = false
					}
				}
			}
			if !same {
				line, err := promptLine(fmt.Sprintf("alias %q exists with different body; new alias name (empty aborts):", alias))
				if err != nil {
					return err
				}
				if strings.TrimSpace(line) == "" {
					return fmt.Errorf("alias collision on %q; aborted", alias)
				}
				alias = strings.TrimSpace(line)
			}
		}
		cfg.Scripts[alias] = project.ScriptDef{Commands: def.Commands, Description: def.Description}
	}
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
			} else if mode == "yes" {
				if def, ok := p.Commands[s]; ok && !def.DefaultSelect {
					continue
				}
				if _, ok := p.Commands[s]; !ok {
					continue
				}
			} else if mode == "none" {
				continue
			}
			cfg.Hooks[std] = append(cfg.Hooks[std], alias)
		}
	}
	return nil
}

func runHooks(root, std string, cfg project.SpecConfig) error {
	aliases, ok := cfg.Hooks[std]
	if !ok {
		return nil
	}
	for _, a := range aliases {
		name := strings.TrimSpace(a)
		if strings.HasPrefix(name, "[") {
			idx := strings.Index(name, "]")
			if idx < 0 {
				return fmt.Errorf("[hooks.%s] malformed entry %q", std, a)
			}
			probe, err := scripts.Select([]string{name[:idx+1] + " probe"}, "")
			if err != nil {
				return fmt.Errorf("[hooks.%s] %w", std, err)
			}
			if len(probe) == 0 {
				continue
			}
			name = strings.TrimSpace(name[idx+1:])
		}
		s, ok := cfg.Scripts[name]
		if !ok {
			return fmt.Errorf("[hooks.%s] unknown alias %q", std, name)
		}
		if err := scripts.RunLines(root, s.Commands, ""); err != nil {
			return err
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
			hooked[a] = true
		}
	}
	for alias := range cfg.Scripts {
		if strings.HasPrefix(alias, name+":") || strings.Contains(alias, ":"+name) {
			if hooked[alias] {
				return fmt.Errorf("cannot remove %q: script %q still referenced by [hooks]; unhook first", name, alias)
			}
		}
	}
	if err := os.RemoveAll(filepath.Join(root, "components", name)); err != nil {
		return err
	}
	l.Remove(name)
	if err := lock.Write(root, l); err != nil {
		return err
	}
	return runCheck(root)
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
	if err := scripts.RunLines(root, s.Commands, extra); err != nil {
		if strings.Contains(err.Error(), "zero selected") {
			return fmt.Errorf("alias %q has zero selected lines for current OS", alias)
		}
		return err
	}
	return nil
}
