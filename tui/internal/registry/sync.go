package registry

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/pkg"
)

const (
	SyncSourceInternal = "internal"
	SyncSourceLocal    = "local"
	SyncSourceRegistry = "registry"

	ComponentsDirName = "components"
	GitignoreFileName = ".gitignore"
	SyncMetaFileName  = ".unsarep-sync.json"

	SectionComponents = "components"
)

type SyncOptions struct {
	Clean     bool
	Check     bool
	LocalDirs []string
}

type SyncedPackage struct {
	Name    string `json:"name"`
	Version string `json:"version"`
	Source  string `json:"source"`
	Path    string `json:"path"`
}

type SyncResult struct {
	WorkspaceDir string          `json:"workspace_dir"`
	Cleaned      bool            `json:"cleaned"`
	Packages     []SyncedPackage `json:"packages"`
}

type discoveredPkg struct {
	dir  string
	decl pkg.PkgToml
}

type discoveredScope struct {
	dir   string
	name  string
	files []string
}

func SyncWorkspace(ctx context.Context, client *Client, workspaceDir string, opts SyncOptions) (*SyncResult, error) {
	absRoot, err := filepath.Abs(workspaceDir)
	if err != nil {
		return nil, fmt.Errorf("resolve workspace dir: %w", err)
	}

	componentsDir := filepath.Join(absRoot, ComponentsDirName)

	if opts.Clean {
		if _, statErr := os.Stat(componentsDir); statErr == nil {
			if rErr := os.RemoveAll(componentsDir); rErr != nil {
				return nil, fmt.Errorf("clean components dir: %w", rErr)
			}
		} else if !os.IsNotExist(statErr) {
			return nil, fmt.Errorf("stat components dir: %w", statErr)
		}
		return &SyncResult{
			WorkspaceDir: absRoot,
			Cleaned:      true,
			Packages:     []SyncedPackage{},
		}, nil
	}

	localPkgs, localScopes, err := discoverWorkspace(absRoot)
	if err != nil {
		return nil, fmt.Errorf("discover workspace: %w", err)
	}

	siblingPkgs := make(map[string]discoveredPkg)
	for _, lDir := range opts.LocalDirs {
		absLocal, lErr := filepath.Abs(lDir)
		if lErr != nil {
			return nil, fmt.Errorf("resolve local dir %q: %w", lDir, lErr)
		}
		sPkgs, _, sErr := discoverWorkspace(absLocal)
		if sErr != nil {
			return nil, fmt.Errorf("discover sibling dir %q: %w", absLocal, sErr)
		}
		for name, p := range sPkgs {
			siblingPkgs[name] = p
		}
	}

	allDeps := make(map[string]string)
	for _, dp := range localPkgs {
		for depName, depRange := range dp.decl.Dependencies {
			depName = strings.TrimSpace(depName)
			depRange = strings.TrimSpace(depRange)
			if depName != "" {
				allDeps[depName] = depRange
			}
		}
	}

	type planItem struct {
		name    string
		version string
		source  string
		srcPath string
	}
	var plans []planItem

	for name, dp := range localPkgs {
		plans = append(plans, planItem{
			name:    name,
			version: dp.decl.Package.Version,
			source:  SyncSourceInternal,
			srcPath: dp.dir,
		})
	}

	for depName, depRange := range allDeps {
		if _, ok := localPkgs[depName]; ok {
			continue
		}
		if sib, ok := siblingPkgs[depName]; ok {
			plans = append(plans, planItem{
				name:    depName,
				version: sib.decl.Package.Version,
				source:  SyncSourceLocal,
				srcPath: sib.dir,
			})
			continue
		}
		if client == nil {
			return nil, fmt.Errorf("external dependency %q required but registry client is not configured", depName)
		}
		resolvedVer, rErr := client.ResolveVersion(ctx, depName, depRange)
		if rErr != nil {
			return nil, fmt.Errorf("resolve external dependency %q (%s): %w", depName, depRange, rErr)
		}
		plans = append(plans, planItem{
			name:    depName,
			version: resolvedVer,
			source:  SyncSourceRegistry,
			srcPath: "",
		})
	}

	sort.Slice(plans, func(i, j int) bool {
		return plans[i].name < plans[j].name
	})

	if opts.Check {
		var checkPkgs []SyncedPackage
		for _, pl := range plans {
			checkPkgs = append(checkPkgs, SyncedPackage{
				Name:    pl.name,
				Version: pl.version,
				Source:  pl.source,
				Path:    pl.srcPath,
			})
		}
		return &SyncResult{
			WorkspaceDir: absRoot,
			Cleaned:      false,
			Packages:     checkPkgs,
		}, nil
	}

	if err := os.MkdirAll(componentsDir, config.PermDirPublic); err != nil {
		return nil, fmt.Errorf("create components dir: %w", err)
	}

	for _, sc := range localScopes {
		scopeTarget := filepath.Join(componentsDir, sc.name)
		if err := os.MkdirAll(scopeTarget, config.PermDirPublic); err != nil {
			return nil, fmt.Errorf("create scope dir %q: %w", scopeTarget, err)
		}
		for _, sf := range sc.files {
			srcFile := filepath.Join(sc.dir, sf)
			if _, statErr := os.Stat(srcFile); statErr == nil {
				dstFile := filepath.Join(scopeTarget, sf)
				if err := os.MkdirAll(filepath.Dir(dstFile), config.PermDirPublic); err != nil {
					return nil, fmt.Errorf("create scope file dir: %w", err)
				}
				relSrc, relErr := filepath.Rel(filepath.Dir(dstFile), srcFile)
				if relErr != nil {
					return nil, fmt.Errorf("compute relative path for %q: %w", srcFile, relErr)
				}
				_ = os.Remove(dstFile)
				if err := os.Symlink(relSrc, dstFile); err != nil {
					return nil, fmt.Errorf("symlink scope file %q -> %q: %w", dstFile, relSrc, err)
				}
			}
		}
	}

	var syncedPkgs []SyncedPackage
	downloadedScopeSet := make(map[string]bool)

	for _, pl := range plans {
		targetPkgDir := filepath.Join(componentsDir, pl.name)
		if err := os.MkdirAll(filepath.Dir(targetPkgDir), config.PermDirPublic); err != nil {
			return nil, fmt.Errorf("create parent dir for %q: %w", targetPkgDir, err)
		}

		if pl.source == SyncSourceInternal || pl.source == SyncSourceLocal {
			relSrc, relErr := filepath.Rel(filepath.Dir(targetPkgDir), pl.srcPath)
			if relErr != nil {
				return nil, fmt.Errorf("compute relative path for %q: %w", pl.srcPath, relErr)
			}
			_ = os.Remove(targetPkgDir)
			_ = os.RemoveAll(targetPkgDir)
			if err := os.Symlink(relSrc, targetPkgDir); err != nil {
				return nil, fmt.Errorf("symlink package %q -> %q: %w", targetPkgDir, relSrc, err)
			}
			syncedPkgs = append(syncedPkgs, SyncedPackage{
				Name:    pl.name,
				Version: pl.version,
				Source:  pl.source,
				Path:    relSrc,
			})
		} else if pl.source == SyncSourceRegistry {
			if strings.HasPrefix(pl.name, "@") {
				parts := strings.SplitN(pl.name, "/", 2)
				if len(parts) == 2 {
					scopeName := parts[0]
					if !downloadedScopeSet[scopeName] {
						scopeFiles, sErr := client.DownloadScopeArchive(ctx, scopeName)
						if sErr == nil && len(scopeFiles) > 0 {
							scopeDest := filepath.Join(componentsDir, scopeName)
							for sf, content := range scopeFiles {
								if sf == config.ConfigFileName {
									continue
								}
								sTarget := filepath.Join(scopeDest, filepath.FromSlash(sf))
								if err := os.MkdirAll(filepath.Dir(sTarget), config.PermDirPublic); err != nil {
									return nil, fmt.Errorf("create scope dir: %w", err)
								}
								if err := os.WriteFile(sTarget, content, config.PermFilePublic); err != nil {
									return nil, fmt.Errorf("write scope file: %w", err)
								}
							}
							downloadedScopeSet[scopeName] = true
						}
					}
				}
			}

			files, dErr := client.DownloadSection(ctx, pl.name, pl.version, SectionComponents)
			if dErr != nil {
				return nil, fmt.Errorf("download components for %q: %w", pl.name, dErr)
			}
			_ = os.Remove(targetPkgDir)
			_ = os.RemoveAll(targetPkgDir)
			if err := os.MkdirAll(targetPkgDir, config.PermDirPublic); err != nil {
				return nil, fmt.Errorf("create target dir %q: %w", targetPkgDir, err)
			}
			for fname, content := range files {
				fTarget := filepath.Join(targetPkgDir, filepath.FromSlash(fname))
				if err := os.MkdirAll(filepath.Dir(fTarget), config.PermDirPublic); err != nil {
					return nil, fmt.Errorf("create parent dir for %q: %w", fTarget, err)
				}
				if err := os.WriteFile(fTarget, content, config.PermFilePublic); err != nil {
					return nil, fmt.Errorf("write file %q: %w", fTarget, err)
				}
			}

			relTarget, _ := filepath.Rel(absRoot, targetPkgDir)
			syncedPkgs = append(syncedPkgs, SyncedPackage{
				Name:    pl.name,
				Version: pl.version,
				Source:  pl.source,
				Path:    relTarget,
			})
		}
	}

	metaPath := filepath.Join(componentsDir, SyncMetaFileName)
	metaBytes, _ := json.MarshalIndent(syncedPkgs, "", "  ")
	_ = os.WriteFile(metaPath, metaBytes, config.PermFilePublic)

	if err := ensureGitignore(absRoot); err != nil {
		return nil, fmt.Errorf("update gitignore: %w", err)
	}

	return &SyncResult{
		WorkspaceDir: absRoot,
		Cleaned:      false,
		Packages:     syncedPkgs,
	}, nil
}

func discoverWorkspace(root string) (map[string]discoveredPkg, []discoveredScope, error) {
	pkgs := make(map[string]discoveredPkg)
	var scopes []discoveredScope

	err := filepath.WalkDir(root, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			name := d.Name()
			if name == ComponentsDirName || name == "node_modules" || strings.HasPrefix(name, ".") {
				return filepath.SkipDir
			}
			return nil
		}
		if d.Name() != config.ConfigFileName {
			return nil
		}

		raw, rErr := os.ReadFile(p)
		if rErr != nil {
			return fmt.Errorf("read %s: %w", p, rErr)
		}

		manifestDir := filepath.Dir(p)
		parsed, pErr := pkg.Parse(string(raw))
		if pErr == nil {
			if parsed.Package.Name != "" {
				pkgs[parsed.Package.Name] = discoveredPkg{
					dir:  manifestDir,
					decl: parsed,
				}
			}
			if parsed.Scope != nil && parsed.Scope.Name != "" {
				scopes = append(scopes, discoveredScope{
					dir:   manifestDir,
					name:  parsed.Scope.Name,
					files: parsed.Scope.Files,
				})
			}
			return nil
		}

		var genericManifest struct {
			Package struct {
				Name    string `toml:"name"`
				Version string `toml:"version"`
			} `toml:"package"`
			Scope struct {
				Name  string   `toml:"name"`
				Files []string `toml:"files"`
			} `toml:"scope"`
			Dependencies map[string]string `toml:"dependencies"`
		}
		if _, tomlErr := toml.Decode(string(raw), &genericManifest); tomlErr == nil {
			if genericManifest.Package.Name != "" {
				pkgs[genericManifest.Package.Name] = discoveredPkg{
					dir: manifestDir,
					decl: pkg.PkgToml{
						Package: pkg.PackageDef{
							Name:    genericManifest.Package.Name,
							Version: genericManifest.Package.Version,
						},
						Dependencies: genericManifest.Dependencies,
					},
				}
			}
			if genericManifest.Scope.Name != "" {
				scopes = append(scopes, discoveredScope{
					dir:   manifestDir,
					name:  genericManifest.Scope.Name,
					files: genericManifest.Scope.Files,
				})
			}
		}

		return nil
	})

	if err != nil {
		return nil, nil, err
	}
	return pkgs, scopes, nil
}

func ensureGitignore(root string) error {
	gitDir := filepath.Join(root, ".git")
	if _, err := os.Stat(gitDir); err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	gitignorePath := filepath.Join(root, GitignoreFileName)
	content, err := os.ReadFile(gitignorePath)
	if err != nil {
		if os.IsNotExist(err) {
			return os.WriteFile(gitignorePath, []byte("/components/\n"), config.PermFilePublic)
		}
		return err
	}

	lines := strings.Split(string(content), "\n")
	hasComponents := false
	for _, l := range lines {
		trimmed := strings.TrimSpace(l)
		if trimmed == "/components" || trimmed == "/components/" || trimmed == "components" || trimmed == "components/" {
			hasComponents = true
			break
		}
	}

	if !hasComponents {
		newContent := string(content)
		if !strings.HasSuffix(newContent, "\n") {
			newContent += "\n"
		}
		newContent += "/components/\n"
		return os.WriteFile(gitignorePath, []byte(newContent), config.PermFilePublic)
	}

	return nil
}
