package pkg

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/Masterminds/semver/v3"
)

var nameRe = regexp.MustCompile(`^[a-z0-9-]+$`)
var prefixRe = regexp.MustCompile(`^[a-z0-9-]+$`)

type PackageDef struct {
	Name          string   `toml:"name"`
	Version       string   `toml:"version"`
	Entrypoint    string   `toml:"entrypoint"`
	Description   string   `toml:"description"`
	DisplayName   string   `toml:"displayName"`
	Tags          []string `toml:"tags"`
	CommandPrefix string   `toml:"command_prefix"`
}

type ComponentsDef struct {
	Files     []string `toml:"files"`
	DependsOn []string `toml:"depends_on"`
}

type TemplatesDef struct {
	Files []string `toml:"files"`
}

type CommandDef struct {
	Description   string   `toml:"description"`
	Commands      []string `toml:"commands"`
	DefaultSelect bool     `toml:"default_select"`
}

type ConfigSchemaEntry struct {
	Type     string `toml:"type"`
	Required bool   `toml:"required"`
	Default  any    `toml:"default"`
	Doc      string `toml:"doc"`
}

type PkgToml struct {
	Package      PackageDef                   `toml:"package"`
	Components   ComponentsDef                `toml:"components"`
	Templates    TemplatesDef                 `toml:"templates"`
	Commands     map[string]CommandDef        `toml:"commands"`
	HooksSuggest map[string][]string          `toml:"hooks-suggest"`
	ConfigSchema map[string]ConfigSchemaEntry `toml:"config-schema"`
}

var configTypes = map[string]bool{
	"string": true, "bool": true, "int": true, "path": true, "path-list": true,
}

func Parse(text string) (PkgToml, error) {
	var p PkgToml
	md, err := toml.Decode(text, &p)
	if err != nil {
		return PkgToml{}, fmt.Errorf("parse pkg.toml: %w", err)
	}
	if undecoded := md.Undecoded(); len(undecoded) > 0 {
		return PkgToml{}, fmt.Errorf("unknown field %q in pkg.toml", undecoded[0].String())
	}
	return p, nil
}

func Validate(p PkgToml) error {
	n := strings.TrimSpace(p.Package.Name)
	if len(n) < 3 || len(n) > 64 || !nameRe.MatchString(n) {
		return fmt.Errorf("invalid [package] name %q (want [a-z0-9-], 3-64 chars)", p.Package.Name)
	}
	if _, err := semver.StrictNewVersion(strings.TrimSpace(p.Package.Version)); err != nil {
		return fmt.Errorf("invalid [package] version %q: %w", p.Package.Version, err)
	}
	ep := strings.TrimSpace(p.Package.Entrypoint)
	if ep == "" || strings.HasPrefix(ep, "/") || ep == ".." || strings.HasPrefix(ep, "../") || strings.Contains(ep, "\\") {
		return fmt.Errorf("invalid [package] entrypoint %q", p.Package.Entrypoint)
	}
	if p.Package.CommandPrefix != "" && !prefixRe.MatchString(p.Package.CommandPrefix) {
		return fmt.Errorf("invalid [package] command_prefix %q", p.Package.CommandPrefix)
	}
	if len(p.Components.Files) == 0 {
		return fmt.Errorf("[components] files must list at least one glob")
	}
	for _, g := range p.Components.Files {
		if strings.TrimSpace(g) == "" || strings.HasPrefix(g, "/") || g == ".." || strings.HasPrefix(g, "../") || strings.Contains(g, "\\") {
			return fmt.Errorf("invalid [components] glob %q", g)
		}
	}
	for _, d := range p.Components.DependsOn {
		name, rng, ok := strings.Cut(d, " ")
		if !ok || strings.TrimSpace(name) == "" || strings.TrimSpace(rng) == "" {
			return fmt.Errorf("invalid depends_on entry %q (want \"name range\")", d)
		}
		if _, err := semver.NewConstraint(strings.TrimSpace(rng)); err != nil {
			return fmt.Errorf("invalid depends_on range %q: %w", d, err)
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
		if len(c.Commands) == 0 {
			return fmt.Errorf("[commands.%s] commands must not be empty", cmd)
		}
	}
	for std, cmds := range p.HooksSuggest {
		if std == "init" {
			return fmt.Errorf("[hooks-suggest] must not target init")
		}
		for _, c := range cmds {
			if strings.TrimSpace(c) == "" {
				return fmt.Errorf("[hooks-suggest.%s] has empty command", std)
			}
		}
	}
	for key, e := range p.ConfigSchema {
		if !configTypes[e.Type] {
			return fmt.Errorf("[config-schema.%s] unknown type %q", key, e.Type)
		}
	}
	return nil
}
