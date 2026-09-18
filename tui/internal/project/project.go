package project

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
	"github.com/UNSAReport/tui/internal/config"
)

type ProjectDef struct {
	Name              string `toml:"name"`
	TypstEntry        string `toml:"typst_entry"`
	RootMarkerVersion int    `toml:"root_marker_version"`
}

type ScriptDef struct {
	Commands    []string `toml:"commands"`
	Description string   `toml:"description"`
}

type SpecConfig struct {
	Project ProjectDef           `toml:"project"`
	Scripts map[string]ScriptDef `toml:"scripts"`
	Hooks   map[string][]string  `toml:"hooks"`
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

func Load(path string) (SpecConfig, error) {
	var cfg SpecConfig
	md, err := toml.DecodeFile(path, &cfg)
	if err != nil {
		return SpecConfig{}, fmt.Errorf("parse %s: %w", config.ConfigFileName, err)
	}
	if undecoded := md.Undecoded(); len(undecoded) > 0 {
		return SpecConfig{}, fmt.Errorf("unknown field %q in %s", undecoded[0].String(), config.ConfigFileName)
	}
	if cfg.Project.Name == "" {
		return SpecConfig{}, fmt.Errorf("missing [project] name in %s", config.ConfigFileName)
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
		cfg.Hooks = map[string][]string{}
	}
	return cfg, nil
}

func Detect(start string) (*Context, error) {
	abs, err := filepath.Abs(start)
	if err != nil {
		abs = start
	}
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
