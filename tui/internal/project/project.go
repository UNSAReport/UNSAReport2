package project

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/Masterminds/semver/v3"
	"github.com/UNSAReport/tui/internal/config"
)

// OSCommands maps an OS key (any|linux|windows|macos) to shell lines.
// This is the published pkg.toml shape; local scripts use ScriptCommands.
type OSCommands map[string][]string

// ScriptCommands maps an OS key (any|linux|windows|macos) to one shell
// command. Selection order is fixed: the any command runs first, then the
// matching-OS command. Multi-line shell goes in one string.
type ScriptCommands map[string]string

// JoinCommands flattens published per-OS shell lines into one command per
// OS, dropping blank lines and OS keys left empty.
func JoinCommands(cmds OSCommands) ScriptCommands {
	out := ScriptCommands{}
	for key, lines := range cmds {
		var kept []string
		for _, l := range lines {
			if strings.TrimSpace(l) != "" {
				kept = append(kept, l)
			}
		}
		if len(kept) > 0 {
			out[key] = strings.Join(kept, "\n")
		}
	}
	return out
}

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
	TypstEntry    string `toml:"typst_entry"`
	ConfigVersion int    `toml:"config_version"`
}

type ScriptDef struct {
	Commands    ScriptCommands `toml:"commands"`
	Description string         `toml:"description"`
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
	Project      ProjectDef            `toml:"project"`
	Scripts      map[string]ScriptDef  `toml:"scripts"`
	Hooks        map[string]HookTiming `toml:"hooks"`
	Package      *PackageDecl          `toml:"package"`
	Dependencies map[string]string     `toml:"dependencies"`
	// PackageConfig holds installed per-package config values keyed by
	// package origin. Fragment-owned (unsareport.d/config/); never
	// persisted to the root file (see RootOnly).
	PackageConfig map[string]PackageValues `toml:"-"`

	provenance map[string]string
}

// ScriptSource returns the fragment path (relative to root) that contributed
// alias, or "" when it comes from unsareport.toml itself.
func (c SpecConfig) ScriptSource(alias string) string {
	return c.provenance["script:"+alias]
}

// ScriptFragment is one unsareport.d/scripts/*.toml file: a single script.
type ScriptFragment struct {
	Alias       string         `toml:"alias"`
	Description string         `toml:"description"`
	Origin      string         `toml:"origin"`
	Commands    ScriptCommands `toml:"commands"`
}

// HookFragment is one unsareport.d/hooks/*.toml file: bindings for one standard.
type HookFragment struct {
	Standard string   `toml:"standard"`
	Before   []string `toml:"before"`
	After    []string `toml:"after"`
	Origin   string   `toml:"origin"`
}

// ConfigFragment is one unsareport.d/config/*.toml file: installed
// per-package config values for the package named by Origin.
type ConfigFragment struct {
	Origin    string            `toml:"origin"`
	EnvPrefix string            `toml:"env_prefix"`
	Values    map[string]string `toml:"values"`
}

// PackageValues is the merged in-memory view of one ConfigFragment.
type PackageValues struct {
	EnvPrefix string
	Values    map[string]string
}

// ConfigFileName returns the config fragment filename for a package origin.
func ConfigFileName(origin string) string {
	r := strings.NewReplacer("@", "", "/", "-", ":", "-")
	return r.Replace(origin) + ".toml"
}

const (
	HookBefore = "before"
	HookAfter  = "after"
)

// HookTiming is the before/after alias lists bound to one standard.
// Before entries run pre-action in list order, after entries post-action;
type HookTiming struct {
	Before []string `toml:"before"`
	After  []string `toml:"after"`
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
	if undecoded := md.Undecoded(); len(undecoded) > 0 {
		return SpecConfig{}, fmt.Errorf("unknown field %q in %s", undecoded[0].String(), config.ConfigFileName)
	}
	if cfg.Project.TypstEntry == "" {
		cfg.Project.TypstEntry = config.DefaultTypstEntry
	}
	version := cfg.Project.ConfigVersion
	if version == 0 {
		return SpecConfig{}, fmt.Errorf("missing config_version in %s (want %d)", config.ConfigFileName, config.ConfigVersion)
	}
	if version < 1 || version > config.ConfigVersion {
		return SpecConfig{}, fmt.Errorf("unsupported config_version %d in %s (supported 1-%d)", version, config.ConfigFileName, config.ConfigVersion)
	}
	if cfg.Scripts == nil {
		cfg.Scripts = map[string]ScriptDef{}
	}
	if cfg.Hooks == nil {
		cfg.Hooks = map[string]HookTiming{}
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
	if err := checkHookDuplicates(cfg.Hooks); err != nil {
		return SpecConfig{}, err
	}
	return cfg, nil
}

// checkHookDuplicates rejects repeats within one timing list of one
// standard. before+after twins are allowed (the alias runs twice).
func checkHookDuplicates(hooks map[string]HookTiming) error {
	for std, timing := range hooks {
		for _, list := range []struct {
			when    string
			aliases []string
		}{
			{HookBefore, timing.Before},
			{HookAfter, timing.After},
		} {
			seen := map[string]bool{}
			for _, a := range list.aliases {
				name := stripHookPrefix(a)
				if seen[name] {
					return fmt.Errorf("duplicate alias %q in [hooks.%s.%s]", name, std, list.when)
				}
				seen[name] = true
			}
		}
	}
	return nil
}

// hookProvKey identifies one merged hook binding by standard, timing, and
// stripped alias. Root-owned bindings have no provenance entry.
func hookProvKey(std, when, alias string) string {
	return "hook:" + std + "\x00" + when + "\x00" + stripHookPrefix(alias)
}

// RootOnly returns a copy of c with fragment-owned entries removed: scripts
// from unsareport.d/scripts and hook bindings from unsareport.d/hooks. The
// root file holds local config only; saving a merged cfg without stripping
// would inline imports back into it.
func (c SpecConfig) RootOnly() SpecConfig {
	out := c
	out.PackageConfig = nil
	if c.Scripts != nil {
		scripts := make(map[string]ScriptDef, len(c.Scripts))
		for alias, def := range c.Scripts {
			if c.provenance["script:"+alias] == "" {
				scripts[alias] = def
			}
		}
		out.Scripts = scripts
	}
	if c.Hooks != nil {
		hooks := make(map[string]HookTiming, len(c.Hooks))
		for std, timing := range c.Hooks {
			var kept HookTiming
			for _, a := range timing.Before {
				if c.provenance[hookProvKey(std, HookBefore, a)] == "" {
					kept.Before = append(kept.Before, a)
				}
			}
			for _, a := range timing.After {
				if c.provenance[hookProvKey(std, HookAfter, a)] == "" {
					kept.After = append(kept.After, a)
				}
			}
			if len(kept.Before) > 0 || len(kept.After) > 0 {
				hooks[std] = kept
			}
		}
		out.Hooks = hooks
	}
	return out
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
		for key, cmd := range frag.Commands {
			if !OSKeys[key] {
				return fmt.Errorf("%s: unknown os key %q (want any|linux|windows|macos)", relRoot(root, f), key)
			}
			if strings.TrimSpace(cmd) != "" {
				total++
			}
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
		mark := func(when, alias string) { seen[when+"\x00"+stripHookPrefix(alias)] = true }
		for _, a := range cfg.Hooks[frag.Standard].Before {
			mark(HookBefore, a)
		}
		for _, a := range cfg.Hooks[frag.Standard].After {
			mark(HookAfter, a)
		}
		merged := cfg.Hooks[frag.Standard]
		rel := relRoot(root, f)
		merge := func(when string, aliases []string, dst *[]string) error {
			for _, a := range aliases {
				name := stripHookPrefix(a)
				if seen[when+"\x00"+name] {
					return fmt.Errorf("duplicate alias %q in [hooks.%s.%s] (%s)", name, frag.Standard, when, rel)
				}
				seen[when+"\x00"+name] = true
				*dst = append(*dst, a)
				cfg.provenance[hookProvKey(frag.Standard, when, a)] = rel
			}
			return nil
		}
		if err := merge(HookBefore, frag.Before, &merged.Before); err != nil {
			return err
		}
		if err := merge(HookAfter, frag.After, &merged.After); err != nil {
			return err
		}
		cfg.Hooks[frag.Standard] = merged
	}
	confs, err := fragmentFiles(filepath.Join(root, config.ConfigDirName, "config"))
	if err != nil {
		return err
	}
	if cfg.PackageConfig == nil {
		cfg.PackageConfig = map[string]PackageValues{}
	}
	for _, f := range confs {
		var frag ConfigFragment
		if err := decodeFragment(f, &frag); err != nil {
			return err
		}
		rel := relRoot(root, f)
		if strings.TrimSpace(frag.Origin) == "" {
			return fmt.Errorf("%s: fragment origin must not be empty", rel)
		}
		if strings.TrimSpace(frag.EnvPrefix) == "" {
			return fmt.Errorf("%s: fragment env_prefix must not be empty", rel)
		}
		if _, ok := cfg.PackageConfig[frag.Origin]; ok {
			return fmt.Errorf("duplicate config for package %q (%s)", frag.Origin, rel)
		}
		if frag.Values == nil {
			frag.Values = map[string]string{}
		}
		cfg.PackageConfig[frag.Origin] = PackageValues{EnvPrefix: frag.EnvPrefix, Values: frag.Values}
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
	if undecoded := md.Undecoded(); len(undecoded) > 0 {
		return fmt.Errorf("unknown field %q in %s", undecoded[0].String(), path)
	}
	return nil
}

func relRoot(root, path string) string {
	if rel, err := filepath.Rel(root, path); err == nil {
		return filepath.ToSlash(rel)
	}
	return path
}

func stripHookPrefix(a string) string {
	a = strings.TrimSpace(a)
	if rest, ok := cutOSPrefix(a); ok {
		return rest
	}
	return a
}

// cutOSPrefix splits a leading "os:<key> " prefix (see scripts.SplitPrefix).
// Lenient: anything else passes through for validation to reject.
func cutOSPrefix(a string) (string, bool) {
	if !strings.HasPrefix(a, "os:") {
		return "", false
	}
	key, rest, found := strings.Cut(a[len("os:"):], " ")
	if !found {
		return "", false
	}
	if !OSKeys[key] {
		return "", false
	}
	if strings.TrimSpace(rest) == "" {
		return "", false
	}
	return strings.TrimSpace(rest), true
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

// SanitizeEnvPart maps text to [A-Z0-9_]: letters and digits uppercased,
// anything else an underscore. Used for env prefix and key segments.
func SanitizeEnvPart(s string) string {
	var b strings.Builder
	for _, r := range strings.ToUpper(s) {
		if r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' {
			b.WriteRune(r)
		} else {
			b.WriteByte('_')
		}
	}
	return b.String()
}

// ConfigEnv returns UNSAREP_CONFIG_<PREFIX>_<KEY>=value entries for the
// package that owns origin, or nil when it has no installed config.
func (c SpecConfig) ConfigEnv(origin string) []string {
	pc, ok := c.PackageConfig[origin]
	if !ok || len(pc.Values) == 0 {
		return nil
	}
	keys := make([]string, 0, len(pc.Values))
	for k := range pc.Values {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	out := make([]string, 0, len(keys))
	for _, k := range keys {
		out = append(out, config.EnvConfigPrefix+pc.EnvPrefix+"_"+SanitizeEnvPart(k)+"="+pc.Values[k])
	}
	return out
}

// ScriptOrigin returns the package origin that installed alias, or "" when
// the alias is root-owned or its fragment cannot be read.
func (c SpecConfig) ScriptOrigin(root, alias string) string {
	rel := c.provenance["script:"+alias]
	if rel == "" {
		return ""
	}
	raw, err := os.ReadFile(filepath.Join(root, filepath.FromSlash(rel)))
	if err != nil {
		return ""
	}
	var frag ScriptFragment
	if _, err := toml.Decode(string(raw), &frag); err != nil {
		return ""
	}
	return frag.Origin
}
