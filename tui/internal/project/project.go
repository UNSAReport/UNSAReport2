package project

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/Masterminds/semver/v3"
	"github.com/UNSAReport/tui/internal/config"
)

// OSCommands maps an OS key (any|linux|windows|macos) to shell lines.
// Selection order is fixed: [any] lines first, then the matching-OS lines.
type OSCommands map[string][]string

var OSKeys = map[string]bool{
	"any": true, "linux": true, "windows": true, "macos": true,
}

// HookStandards is the expandable set of hookable standards. Adding a key
// here plus a trigger is the whole cost of a new standard.
var HookStandards = map[string]bool{
	"build": true,
	"check": true,
}

var pkgNameRe = regexp.MustCompile(`^(@[a-z0-9][a-z0-9._~-]*/)?[a-z0-9][a-z0-9._~-]*$`)

type ProjectDef struct {
	TypstEntry        string `toml:"typst_entry"`
	RootMarkerVersion int    `toml:"root_marker_version"`
}

type ScriptDef struct {
	Commands    OSCommands `toml:"commands"`
	Description string     `toml:"description"`
}

// PackageDecl is the optional package-declaration side of unsareport.toml.
// Present only when the project root itself is publishable as a package.
type PackageDecl struct {
	Name          string   `toml:"name"`
	Version       string   `toml:"version"`
	Description   string   `toml:"description"`
	DisplayName   string   `toml:"displayName"`
	Tags          []string `toml:"tags"`
	CommandPrefix string   `toml:"command_prefix"`
}
type SpecConfig struct {
	Project      ProjectDef               `toml:"project"`
	Scripts      map[string]ScriptDef     `toml:"scripts"`
	Hooks        map[string][]HookBinding `toml:"hooks"`
	Package      *PackageDecl             `toml:"package"`
	Dependencies map[string]string        `toml:"dependencies"`

	provenance map[string]string
}

// ScriptSource returns the fragment path (relative to root) that contributed
// alias, or "" when it comes from unsareport.toml itself.
func (c SpecConfig) ScriptSource(alias string) string {
	return c.provenance["script:"+alias]
}

// ScriptFragment is one unsareport.d/scripts/*.toml file: a single script.
type ScriptFragment struct {
	Alias       string     `toml:"alias"`
	Description string     `toml:"description"`
	Origin      string     `toml:"origin"`
	Commands    OSCommands `toml:"commands"`
}

// HookFragment is one unsareport.d/hooks/*.toml file: bindings for one standard.
type HookFragment struct {
	Standard string        `toml:"standard"`
	Aliases  []HookBinding `toml:"aliases"`
	Origin   string        `toml:"origin"`
}

const (
	HookBefore = "before"
	HookAfter  = "after"
)

type HookBinding struct {
	Alias string
	Time  string
}

func (b HookBinding) When() string {
	if b.Time == HookAfter {
		return HookAfter
	}
	return HookBefore
}

func (b *HookBinding) UnmarshalTOML(v any) error {
	switch t := v.(type) {
	case string:
		if strings.TrimSpace(t) == "" {
			return fmt.Errorf("hook alias must not be empty")
		}
		b.Alias = t
		b.Time = HookBefore
		return nil
	case map[string]any:
		for k := range t {
			if k != "alias" && k != "time" {
				return fmt.Errorf("unknown field %q in hook binding", k)
			}
		}
		raw, ok := t["alias"]
		s, sok := raw.(string)
		if !ok || !sok || strings.TrimSpace(s) == "" {
			return fmt.Errorf("hook alias must not be empty")
		}
		b.Alias = s
		b.Time = HookBefore
		if tv, present := t["time"]; present {
			ts, tok := tv.(string)
			if !tok || (ts != "" && ts != HookBefore && ts != HookAfter) {
				return fmt.Errorf("unknown hook time %q (want before|after)", fmt.Sprintf("%v", tv))
			}
			if ts == HookAfter {
				b.Time = HookAfter
			}
		}
		return nil
	default:
		return fmt.Errorf("hook binding must be a string or { alias, time } table")
	}
}

func (b HookBinding) MarshalTOML() ([]byte, error) {
	if b.When() == HookAfter {
		return []byte(fmt.Sprintf(`{ alias = %q, time = "after" }`, b.Alias)), nil
	}
	return []byte(fmt.Sprintf(`%q`, b.Alias)), nil
}

type Context struct {
	Root      string
	Config    SpecConfig
	IsProject bool
}

func FindRoot(start string) (string, error) {
	abs, err := filepath.Abs(start)
	if err != nil {
		abs = start
	}
	cur := abs
	for {
		if _, err := os.Stat(filepath.Join(cur, config.ConfigFileName)); err == nil {
			return cur, nil
		} else if !os.IsNotExist(err) {
			return "", fmt.Errorf("stat %s: %w", config.ConfigFileName, err)
		}
		parent := filepath.Dir(cur)
		if parent == cur {
			return "", fmt.Errorf("no %s found walking up from %q", config.ConfigFileName, start)
		}
		cur = parent
	}
}

func validatePackageDecl(p *PackageDecl) error {
	n := strings.TrimSpace(p.Name)
	if len(n) < 3 || len(n) > 64 {
		return fmt.Errorf("invalid [package] name %q (want 3-64 chars)", p.Name)
	}
	if !pkgNameRe.MatchString(n) {
		return fmt.Errorf("invalid [package] name %q (want [a-z0-9._~-], optionally \"@scope/name\", 3-64 chars)", p.Name)
	}
	if _, err := semver.StrictNewVersion(strings.TrimSpace(p.Version)); err != nil {
		return fmt.Errorf("invalid [package] version %q: %w", p.Version, err)
	}
	return nil
}

func Load(path string) (SpecConfig, error) {
	var cfg SpecConfig
	md, err := toml.DecodeFile(path, &cfg)
	if err != nil {
		return SpecConfig{}, fmt.Errorf("parse %s: %w", config.ConfigFileName, err)
	}
	if undecoded := FilterHookBindingUndecoded(md.Undecoded()); len(undecoded) > 0 {
		return SpecConfig{}, fmt.Errorf("unknown field %q in %s", undecoded[0].String(), config.ConfigFileName)
	}
	if cfg.Project.TypstEntry == "" {
		cfg.Project.TypstEntry = config.DefaultTypstEntry
	}
	if cfg.Project.RootMarkerVersion != config.RootMarkerVersion {
		return SpecConfig{}, fmt.Errorf("unsupported root_marker_version %d in %s (want %d)", cfg.Project.RootMarkerVersion, config.ConfigFileName, config.RootMarkerVersion)
	}
	if cfg.Scripts == nil {
		cfg.Scripts = map[string]ScriptDef{}
	}
	if cfg.Hooks == nil {
		cfg.Hooks = map[string][]HookBinding{}
	}
	if cfg.Dependencies == nil {
		cfg.Dependencies = map[string]string{}
	}
	if cfg.Package != nil {
		if err := validatePackageDecl(cfg.Package); err != nil {
			return SpecConfig{}, err
		}
	}
	for name, rng := range cfg.Dependencies {
		if strings.TrimSpace(name) == "" {
			return SpecConfig{}, fmt.Errorf("empty package name in [dependencies]")
		}
		if !pkgNameRe.MatchString(strings.TrimSpace(name)) {
			return SpecConfig{}, fmt.Errorf("invalid package name %q in [dependencies]", name)
		}
		if _, err := semver.NewConstraint(strings.TrimSpace(rng)); err != nil {
			return SpecConfig{}, fmt.Errorf("invalid [dependencies] range for %q: %w", name, err)
		}
	}
	if err := mergeFragments(filepath.Dir(path), &cfg); err != nil {
		return SpecConfig{}, err
	}
	return cfg, nil
}

// mergeFragments merges unsareport.d/scripts/*.toml and unsareport.d/hooks/*.toml
// into cfg. Any alias defined twice (root file vs fragment, or fragment vs
// fragment) is a hard error naming both sources.
func mergeFragments(root string, cfg *SpecConfig) error {
	cfg.provenance = map[string]string{}
	scripts, err := fragmentFiles(filepath.Join(root, config.ConfigDirName, "scripts"))
	if err != nil {
		return err
	}
	for _, f := range scripts {
		var frag ScriptFragment
		if err := decodeFragment(f, &frag); err != nil {
			return err
		}
		if strings.TrimSpace(frag.Alias) == "" {
			return fmt.Errorf("%s: fragment alias must not be empty", relRoot(root, f))
		}
		total := 0
		for key, lines := range frag.Commands {
			if !OSKeys[key] {
				return fmt.Errorf("%s: unknown os key %q (want any|linux|windows|macos)", relRoot(root, f), key)
			}
			total += len(lines)
		}
		if total == 0 {
			return fmt.Errorf("%s: fragment commands must not be empty", relRoot(root, f))
		}
		if existing, ok := cfg.Scripts[frag.Alias]; ok {
			_ = existing
			src := config.ConfigFileName
			if p := cfg.provenance["script:"+frag.Alias]; p != "" {
				src = p
			}
			return fmt.Errorf("duplicate script alias %q (%s vs %s)", frag.Alias, src, relRoot(root, f))
		}
		cfg.Scripts[frag.Alias] = ScriptDef{Commands: frag.Commands, Description: frag.Description}
		cfg.provenance["script:"+frag.Alias] = relRoot(root, f)
	}
	hooks, err := fragmentFiles(filepath.Join(root, config.ConfigDirName, "hooks"))
	if err != nil {
		return err
	}
	for _, f := range hooks {
		var frag HookFragment
		if err := decodeFragment(f, &frag); err != nil {
			return err
		}
		if !HookStandards[frag.Standard] {
			return fmt.Errorf("%s: unknown hook standard %q (hookable: build, check)", relRoot(root, f), frag.Standard)
		}
		seen := map[string]bool{}
		for _, b := range cfg.Hooks[frag.Standard] {
			seen[stripHookPrefix(b.Alias)+"\x00"+b.When()] = true
		}
		for _, b := range frag.Aliases {
			name := stripHookPrefix(b.Alias)
			if seen[name+"\x00"+b.When()] {
				return fmt.Errorf("duplicate alias %q in [hooks.%s] (%s)", name, frag.Standard, relRoot(root, f))
			}
			seen[name+"\x00"+b.When()] = true
			cfg.Hooks[frag.Standard] = append(cfg.Hooks[frag.Standard], b)
		}
	}
	return nil
}

func fragmentFiles(dir string) ([]string, error) {
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
		out = append(out, filepath.Join(dir, e.Name()))
	}
	return out, nil
}

func decodeFragment(path string, v any) error {
	md, err := toml.DecodeFile(path, v)
	if err != nil {
		return fmt.Errorf("parse %s: %w", path, err)
	}
	if undecoded := FilterHookBindingUndecoded(md.Undecoded()); len(undecoded) > 0 {
		return fmt.Errorf("unknown field %q in %s", undecoded[0].String(), path)
	}
	return nil
}

// FilterHookBindingUndecoded drops the two scalar leaves of table-form hook
// bindings ({ alias, time }) from an Undecoded key list.
//
// BurntSushi/toml v1.4.0 short-circuits unify() into UnmarshalTOML without
// marking any keys decoded, so table-form bindings surface as e.g.
// "hooks.build.alias" or "aliases.time". Upstream fixed this in v1.5.0
// (markDecodedRecursive); until the pin moves, filter those leaves here. No
// strictness is lost: unknown fields inside binding tables are rejected by
// HookBinding.UnmarshalTOML itself, and these exact paths cannot arise from
// any other document shape (anything else is a decode-time type mismatch,
// never an undecoded key).
func FilterHookBindingUndecoded(keys []toml.Key) []toml.Key {
	out := make([]toml.Key, 0, len(keys))
	for _, k := range keys {
		if !isHookBindingLeaf(k.String()) {
			out = append(out, k)
		}
	}
	return out
}

func isHookBindingLeaf(path string) bool {
	i := strings.LastIndex(path, ".")
	if i < 0 {
		return false
	}
	leaf, rest := path[i+1:], path[:i]
	if leaf != "alias" && leaf != "time" {
		return false
	}
	// Fragment files: "aliases.alias" / "aliases.time".
	if rest == "aliases" {
		return true
	}
	// Root config: "hooks.<std>.alias" / "hooks.<std>.time".
	if j := strings.LastIndex(rest, "."); j >= 0 {
		return rest[:j] == "hooks" && rest[j+1:] != ""
	}
	return false
}

func relRoot(root, path string) string {
	if rel, err := filepath.Rel(root, path); err == nil {
		return filepath.ToSlash(rel)
	}
	return path
}

func stripHookPrefix(a string) string {
	a = strings.TrimSpace(a)
	if strings.HasPrefix(a, "[") {
		if idx := strings.Index(a, "]"); idx >= 0 {
			return strings.TrimSpace(a[idx+1:])
		}
	}
	return a
}
func Detect(start string) (*Context, error) {
	abs, _ := filepath.Abs(start)
	root, err := FindRoot(abs)
	if err != nil {
		return &Context{IsProject: false, Root: abs}, nil
	}
	cfg, err := Load(filepath.Join(root, config.ConfigFileName))
	if err != nil {
		return nil, err
	}
	return &Context{Root: root, Config: cfg, IsProject: true}, nil
}
