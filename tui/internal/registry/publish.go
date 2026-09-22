package registry

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/pkg"
	"github.com/UNSAReport/tui/internal/project"
)

func resolvePublishSource(dir string) (pkgText, compDir string, err error) {
	configPath := filepath.Join(dir, config.ConfigFileName)
	raw, rerr := os.ReadFile(configPath)
	if rerr != nil {
		return "", "", fmt.Errorf("%s not found in %s: %w", config.ConfigFileName, dir, rerr)
	}

	if p, perr := pkg.Parse(string(raw)); perr == nil && p.Package.Name != "" && len(p.Components.Files) > 0 {
		return string(raw), dir, nil
	}

	cfg, cerr := project.Load(configPath)
	if cerr != nil {
		return "", "", fmt.Errorf("no publishable [package] in %s: %v", dir, cerr)
	}
	if cfg.Package == nil {
		return "", "", fmt.Errorf("%s in %s has no [package] declaration", config.ConfigFileName, dir)
	}
	sub := filepath.Join(dir, "components", cfg.Package.Name)
	st, serr := os.Stat(sub)
	if serr != nil || !st.IsDir() {
		return "", "", fmt.Errorf("publishable root %s needs authored components at components/%s", dir, cfg.Package.Name)
	}
	var files []string
	werr := filepath.WalkDir(sub, func(p string, d os.DirEntry, werr error) error {
		if werr != nil {
			return werr
		}
		if d.IsDir() {
			return nil
		}
		rel, rerr := filepath.Rel(sub, p)
		if rerr != nil {
			return rerr
		}
		files = append(files, filepath.ToSlash(rel))
		return nil
	})
	if werr != nil {
		return "", "", werr
	}
	if len(files) == 0 {
		return "", "", fmt.Errorf("no files under components/%s", cfg.Package.Name)
	}
	sort.Strings(files)
	synth := pkg.PkgToml{
		Project: pkg.ProjectDef{
			ConfigVersion: config.ConfigVersion,
		},
		Package: pkg.PackageDef{
			Name:          cfg.Package.Name,
			Version:       cfg.Package.Version,
			Description:   cfg.Package.Description,
			DisplayName:   cfg.Package.DisplayName,
			Tags:          cfg.Package.Tags,
			CommandPrefix: cfg.Package.CommandPrefix,
		},
		Dependencies: cfg.Dependencies,
		Components:   pkg.ComponentsDef{Files: files},
		Templates:    pkg.TemplatesDef{Files: []string{}},
	}
	if err := pkg.Validate(synth); err != nil {
		return "", "", err
	}
	text, err := pkg.Encode(synth)
	if err != nil {
		return "", "", err
	}
	return text, sub, nil
}
