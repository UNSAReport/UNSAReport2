package pkg

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/Masterminds/semver/v3"
	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/project"
)

var nameRe = regexp.MustCompile(`^@[a-z0-9][a-z0-9._~-]*/[a-z0-9][a-z0-9._~-]*$`)
var scopeRe = regexp.MustCompile(`^@[a-z0-9][a-z0-9._~-]*$`)
var prefixRe = regexp.MustCompile(`^[a-z0-9][a-z0-9._~-]*$`)

type ProjectDef struct {
	ConfigVersion int    `toml:"config_version"`
	TypstEntry    string `toml:"typst_entry,omitempty"`
}

type WorkspaceDef = project.WorkspaceDef
type ScopeDef = project.ScopeDef
type PackageDef = project.PackageDecl
type ComponentsDef = project.ComponentsDef
type TemplatesDef = project.TemplatesDef
type RootFilesDef = project.RootFilesDef
type CommandDef = project.CommandDef
type ConfigSchemaEntry = project.ConfigSchemaEntry

type PkgToml struct {
	Project      ProjectDef                    `toml:"project"`
	Workspace    *WorkspaceDef                 `toml:"workspace,omitempty"`
	Scope        *ScopeDef                     `toml:"scope,omitempty"`
	Package      PackageDef                    `toml:"package"`
	Dependencies map[string]string             `toml:"dependencies,omitempty"`
	Components   ComponentsDef                 `toml:"components"`
	Templates    TemplatesDef                  `toml:"templates"`
	RootFiles    *RootFilesDef                 `toml:"root-files,omitempty"`
	Commands     map[string]CommandDef         `toml:"commands,omitempty"`
	Hooks        map[string]project.HookTiming `toml:"hooks,omitempty"`
	ConfigSchema map[string]ConfigSchemaEntry  `toml:"config-schema,omitempty"`
}

var configTypes = map[string]bool{
	"string": true, "bool": true, "int": true, "path": true, "path-list": true,
}

func Parse(text string) (PkgToml, error) {
	var p PkgToml
	md, err := toml.Decode(text, &p)
	if err != nil {
		return PkgToml{}, fmt.Errorf("parse %s: %w", config.ConfigFileName, err)
	}
	if undecoded := md.Undecoded(); len(undecoded) > 0 {
		return PkgToml{}, fmt.Errorf("unknown field %q in %s", undecoded[0].String(), config.ConfigFileName)
	}
	if p.Project.ConfigVersion == 0 {
		return PkgToml{}, fmt.Errorf("missing config_version in %s (want %d)", config.ConfigFileName, config.ConfigVersion)
	}
	if p.Project.ConfigVersion != config.ConfigVersion {
		return PkgToml{}, fmt.Errorf("unsupported config_version %d in %s (supported %d)", p.Project.ConfigVersion, config.ConfigFileName, config.ConfigVersion)
	}
	return p, nil
}

func Encode(doc PkgToml) (string, error) {
	if doc.Project.ConfigVersion == 0 {
		doc.Project.ConfigVersion = config.ConfigVersion
	}
	var buf strings.Builder
	if err := toml.NewEncoder(&buf).Encode(doc); err != nil {
		return "", fmt.Errorf("encode %s: %w", config.ConfigFileName, err)
	}
	var out []string
	for _, line := range strings.Split(buf.String(), "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == `description = ""` || trimmed == `displayName = ""` {
			continue
		}
		out = append(out, line)
	}
	return strings.Join(out, "\n"), nil
}

func Validate(p PkgToml) error {
	if p.Project.ConfigVersion != config.ConfigVersion {
		return fmt.Errorf("invalid or missing [project] config_version in %s (want %d)", config.ConfigFileName, config.ConfigVersion)
	}
	if p.Scope != nil {
		sn := strings.TrimSpace(p.Scope.Name)
		if !scopeRe.MatchString(sn) {
			return fmt.Errorf("invalid [scope] name %q (want @scope, e.g. @unsareport)", p.Scope.Name)
		}
		if len(p.Scope.Files) == 0 && p.Workspace == nil {
			return fmt.Errorf("[scope] files must list at least one glob")
		}
		for _, g := range p.Scope.Files {
			if strings.TrimSpace(g) == "" || strings.HasPrefix(g, "/") || g == ".." || strings.HasPrefix(g, "../") || strings.Contains(g, "\\") {
				return fmt.Errorf("invalid [scope] glob %q", g)
			}
		}
	}

	if p.RootFiles != nil {
		if p.Package.Name == "" {
			return fmt.Errorf("[root-files] is only allowed in packages, not scopes")
		}
		if len(p.RootFiles.Files) == 0 {
			return fmt.Errorf("[root-files] files must list at least one glob")
		}
		for _, g := range p.RootFiles.Files {
			if strings.TrimSpace(g) == "" || strings.HasPrefix(g, "/") || g == ".." || strings.HasPrefix(g, "../") || strings.Contains(g, "\\") {
				return fmt.Errorf("invalid [root-files] glob %q", g)
			}
		}
	}

	if p.Package.Name == "" && p.Scope == nil && p.Workspace == nil {
		return fmt.Errorf("%s requires a [package], [scope], or [workspace] table", config.ConfigFileName)
	}

	if p.Workspace != nil {
		for _, m := range p.Workspace.Members {
			if strings.TrimSpace(m) == "" || strings.HasPrefix(m, "/") || strings.Contains(m, "\\") || m == ".." || strings.HasPrefix(m, "../") {
				return fmt.Errorf("invalid [workspace] members pattern %q", m)
			}
		}
		for _, pkgPattern := range p.Workspace.Packages {
			if strings.TrimSpace(pkgPattern) == "" || strings.HasPrefix(pkgPattern, "/") || strings.Contains(pkgPattern, "\\") || pkgPattern == ".." || strings.HasPrefix(pkgPattern, "../") {
				return fmt.Errorf("invalid [workspace] packages pattern %q", pkgPattern)
			}
		}
	}

	if p.Package.Name != "" {
		n := strings.TrimSpace(p.Package.Name)
		if !strings.HasPrefix(n, "@") {
			return fmt.Errorf("unscoped packages are not allowed: please publish under your personal scope (@<slug>) or request a custom scope")
		}
		if len(n) < 3 || len(n) > 64 || !nameRe.MatchString(n) {
			return fmt.Errorf("invalid [package] name %q (want scoped @scope/name, 3-64 chars)", p.Package.Name)
		}
		if _, err := semver.StrictNewVersion(strings.TrimSpace(p.Package.Version)); err != nil {
			return fmt.Errorf("invalid [package] version %q: %w", p.Package.Version, err)
		}
		if p.Package.CommandPrefix != "" && !prefixRe.MatchString(p.Package.CommandPrefix) {
			return fmt.Errorf("invalid [package] command_prefix %q (want [a-z0-9._~-], 3-64 chars)", p.Package.CommandPrefix)
		}
		if len(p.Components.Files) == 0 {
			return fmt.Errorf("[components] files must list at least one glob")
		}
		for _, g := range p.Components.Files {
			if strings.TrimSpace(g) == "" || strings.HasPrefix(g, "/") || g == ".." || strings.HasPrefix(g, "../") || strings.Contains(g, "\\") {
				return fmt.Errorf("invalid [components] glob %q", g)
			}
		}
		for name, rng := range p.Dependencies {
			if strings.TrimSpace(name) == "" {
				return fmt.Errorf("empty package name in [dependencies]")
			}
			if !nameRe.MatchString(strings.TrimSpace(name)) {
				return fmt.Errorf("invalid package name %q in [dependencies] (want @scope/name)", name)
			}
			if _, err := semver.NewConstraint(strings.TrimSpace(rng)); err != nil {
				return fmt.Errorf("invalid [dependencies] range for %q: %w", name, err)
			}
		}
		for _, g := range p.Templates.Files {
			if strings.TrimSpace(g) == "" || strings.HasPrefix(g, "/") || g == ".." || strings.HasPrefix(g, "../") {
				return fmt.Errorf("invalid [templates] glob %q", g)
			}
		}
		for cmd, c := range p.Commands {
			if strings.TrimSpace(cmd) == "" {
				return fmt.Errorf("empty [commands] key")
			}
			total := 0
			for key, lines := range c.Commands {
				if !project.OSKeys[key] {
					return fmt.Errorf("[commands.%s] unknown os key %q (want any|linux|windows|macos)", cmd, key)
				}
				total += len(lines)
			}
			if total == 0 {
				return fmt.Errorf("[commands.%s] commands must not be empty", cmd)
			}
		}
		for std, timing := range p.Hooks {
			if std == "init" {
				return fmt.Errorf("[hooks] must not target init")
			}
			for _, c := range timing.Before {
				if strings.TrimSpace(c) == "" {
					return fmt.Errorf("[hooks.%s.before] has empty command", std)
				}
			}
			for _, c := range timing.After {
				if strings.TrimSpace(c) == "" {
					return fmt.Errorf("[hooks.%s.after] has empty command", std)
				}
			}
		}
		for key, e := range p.ConfigSchema {
			if !configTypes[e.Type] {
				return fmt.Errorf("[config-schema.%s] unknown type %q", key, e.Type)
			}
		}
	}
	return nil
}
