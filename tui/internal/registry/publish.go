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

// resolvePublishSource returns the pkg.toml document and the components dir to
// zip. Standalone package dirs (pkg.toml present) publish as-is. Project roots
// with a [package] declaration in unsareport.toml publish the authored subtree
// components/<name>/ with an explicit file list and depends_on synthesized
// from [dependencies].
func resolvePublishSource(dir string) (pkgText, compDir string, err error) {
	if raw, rerr := os.ReadFile(filepath.Join(dir, "pkg.toml")); rerr == nil {
		return string(raw), dir, nil
	}
	cfg, cerr := project.Load(filepath.Join(dir, config.ConfigFileName))
	if cerr != nil {
		return "", "", fmt.Errorf("no pkg.toml and no publishable [package] in %s: %v", dir, cerr)
	}
	if cfg.Package == nil {
		return "", "", fmt.Errorf("no pkg.toml in %s and unsareport.toml has no [package] declaration", dir)
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
	var deps []string
	for name, rng := range cfg.Dependencies {
		deps = append(deps, name+" "+rng)
	}
	sort.Strings(deps)
	synth := pkg.PkgToml{
		Package: pkg.PackageDef{
			Name:          cfg.Package.Name,
			Version:       cfg.Package.Version,
			Description:   cfg.Package.Description,
			DisplayName:   cfg.Package.DisplayName,
			Tags:          cfg.Package.Tags,
			CommandPrefix: cfg.Package.CommandPrefix,
		},
		Components: pkg.ComponentsDef{Files: files, DependsOn: deps},
		Templates:  pkg.TemplatesDef{Files: []string{}},
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
