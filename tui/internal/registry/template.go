package registry

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/pkg"
	"github.com/UNSAReport/tui/internal/project"
	"github.com/UNSAReport/tui/internal/scripts"
)

type TemplateTarget struct {
	WorkspaceRoot string
	PkgDir        string
	PkgName       string
	PkgToml       pkg.PkgToml
	TemplateDir   string
	TypstEntry    string
	EntryPath     string
	OutputPath    string
}

type DiscoveredTemplate struct {
	Name        string
	Dir         string
	Description string
	EntryPath   string
}

type BuildOptions struct {
	Target  string
	Output  string
	NoHooks bool
}

type WatchOptions struct {
	Target string
	Open   bool
}

type BuildResult struct {
	Target     *TemplateTarget
	OutputPath string
}

func FindWorkspaceRoot(start string) (string, error) {
	abs, err := filepath.Abs(start)
	if err != nil {
		abs = start
	}
	cur := abs
	for {
		metaFile := filepath.Join(cur, ComponentsDirName, SyncMetaFileName)
		if _, statErr := os.Stat(metaFile); statErr == nil {
			return cur, nil
		}
		compDir := filepath.Join(cur, ComponentsDirName)
		if fi, statErr := os.Stat(compDir); statErr == nil && fi.IsDir() {
			return cur, nil
		}
		parent := filepath.Dir(cur)
		if parent == cur {
			return "", fmt.Errorf("no synced workspace found walking up from %q (run 'unsarep registry sync' first)", start)
		}
		cur = parent
	}
}

func ListTemplatePackages(wsRoot string) ([]DiscoveredTemplate, error) {
	pkgs, _, err := discoverWorkspace(wsRoot)
	if err != nil {
		return nil, fmt.Errorf("discover workspace: %w", err)
	}

	var results []DiscoveredTemplate
	for name, dp := range pkgs {
		hasTemplates := len(dp.decl.Templates.Files) > 0
		tmplDir := filepath.Join(dp.dir, "template")
		if !hasTemplates {
			if fi, sErr := os.Stat(tmplDir); sErr == nil && fi.IsDir() {
				hasTemplates = true
			}
		}
		if !hasTemplates {
			continue
		}

		entryFile, rErr := resolvePackageTemplateEntry(dp.dir, dp.decl)
		if rErr != nil {
			continue
		}

		relDir, _ := filepath.Rel(wsRoot, dp.dir)
		results = append(results, DiscoveredTemplate{
			Name:        name,
			Dir:         relDir,
			Description: dp.decl.Package.Description,
			EntryPath:   entryFile,
		})
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Name < results[j].Name
	})

	return results, nil
}

func resolvePackageTemplateEntry(pkgDir string, decl pkg.PkgToml) (string, error) {
	candidateDirs := []string{
		filepath.Join(pkgDir, "template"),
		pkgDir,
	}

	preferredEntry := config.DefaultTypstEntry
	if decl.Project.TypstEntry != "" {
		preferredEntry = decl.Project.TypstEntry
	}

	for _, cDir := range candidateDirs {
		fi, err := os.Stat(cDir)
		if err != nil || !fi.IsDir() {
			continue
		}
		preferredPath := filepath.Join(cDir, preferredEntry)
		if _, statErr := os.Stat(preferredPath); statErr == nil {
			return preferredPath, nil
		}

		entries, readErr := os.ReadDir(cDir)
		if readErr != nil {
			continue
		}
		for _, e := range entries {
			if !e.IsDir() && strings.HasSuffix(e.Name(), config.ExtTypst) {
				return filepath.Join(cDir, e.Name()), nil
			}
		}
	}

	return "", fmt.Errorf("no %s file found in package %s", config.ExtTypst, pkgDir)
}

func ResolveTemplateTarget(wsRoot, target string, cwd string) (*TemplateTarget, error) {
	pkgs, _, err := discoverWorkspace(wsRoot)
	if err != nil {
		return nil, fmt.Errorf("discover workspace: %w", err)
	}

	target = strings.TrimSpace(target)

	if target == "" {
		for _, dp := range pkgs {
			if cwd == dp.dir || strings.HasPrefix(cwd, dp.dir+string(os.PathSeparator)) {
				return buildTemplateTarget(wsRoot, dp.dir, dp.decl, "")
			}
		}

		tmplList, lErr := ListTemplatePackages(wsRoot)
		if lErr != nil {
			return nil, lErr
		}
		if len(tmplList) == 0 {
			return nil, fmt.Errorf("no packages with templates found in workspace %q", wsRoot)
		}
		if len(tmplList) == 1 {
			chosen := tmplList[0]
			dp := pkgs[chosen.Name]
			return buildTemplateTarget(wsRoot, dp.dir, dp.decl, "")
		}

		var names []string
		for _, t := range tmplList {
			names = append(names, t.Name)
		}
		return nil, fmt.Errorf("multiple template packages found (%s); specify one as an argument", strings.Join(names, ", "))
	}

	absTarget := target
	if !filepath.IsAbs(absTarget) {
		absTarget = filepath.Join(wsRoot, target)
	}

	if fi, sErr := os.Stat(absTarget); sErr == nil {
		if !fi.IsDir() && strings.HasSuffix(absTarget, config.ExtTypst) {
			pkgDir, decl, pErr := findNearestPackage(absTarget)
			if pErr != nil {
				return nil, pErr
			}
			return buildTemplateTarget(wsRoot, pkgDir, decl, absTarget)
		}
		if fi.IsDir() {
			manifestPath := filepath.Join(absTarget, config.ConfigFileName)
			if _, mErr := os.Stat(manifestPath); mErr == nil {
				raw, rErr := os.ReadFile(manifestPath)
				if rErr != nil {
					return nil, fmt.Errorf("read %s: %w", manifestPath, rErr)
				}
				parsed, pErr := pkg.Parse(string(raw))
				if pErr != nil {
					return nil, fmt.Errorf("parse %s: %w", manifestPath, pErr)
				}
				return buildTemplateTarget(wsRoot, absTarget, parsed, "")
			}

			parentPkgDir, decl, pErr := findNearestPackage(absTarget)
			if pErr == nil {
				return buildTemplateTarget(wsRoot, parentPkgDir, decl, "")
			}
		}
	}

	if dp, ok := pkgs[target]; ok {
		return buildTemplateTarget(wsRoot, dp.dir, dp.decl, "")
	}

	for name, dp := range pkgs {
		if filepath.Base(name) == target || strings.TrimPrefix(name, "@") == strings.TrimPrefix(target, "@") {
			return buildTemplateTarget(wsRoot, dp.dir, dp.decl, "")
		}
		relDir, _ := filepath.Rel(wsRoot, dp.dir)
		if relDir == target || filepath.Base(relDir) == target {
			return buildTemplateTarget(wsRoot, dp.dir, dp.decl, "")
		}
	}

	return nil, fmt.Errorf("cannot resolve template target %q in workspace %s", target, wsRoot)
}

func findNearestPackage(start string) (string, pkg.PkgToml, error) {
	cur := start
	fi, err := os.Stat(cur)
	if err == nil && !fi.IsDir() {
		cur = filepath.Dir(cur)
	}
	for {
		manifestPath := filepath.Join(cur, config.ConfigFileName)
		if _, mErr := os.Stat(manifestPath); mErr == nil {
			raw, rErr := os.ReadFile(manifestPath)
			if rErr != nil {
				return "", pkg.PkgToml{}, fmt.Errorf("read %s: %w", manifestPath, rErr)
			}
			parsed, pErr := pkg.Parse(string(raw))
			if pErr != nil {
				return "", pkg.PkgToml{}, fmt.Errorf("parse %s: %w", manifestPath, pErr)
			}
			return cur, parsed, nil
		}
		parent := filepath.Dir(cur)
		if parent == cur {
			return "", pkg.PkgToml{}, fmt.Errorf("no %s found walking up from %q", config.ConfigFileName, start)
		}
		cur = parent
	}
}

func buildTemplateTarget(wsRoot, pkgDir string, decl pkg.PkgToml, specificEntry string) (*TemplateTarget, error) {
	entryFile := specificEntry
	if entryFile == "" {
		resolved, err := resolvePackageTemplateEntry(pkgDir, decl)
		if err != nil {
			return nil, err
		}
		entryFile = resolved
	}

	tmplDir := filepath.Dir(entryFile)
	typstEntry := filepath.Base(entryFile)
	pdfBase := strings.TrimSuffix(typstEntry, config.ExtTypst) + config.ExtPDF
	outputPath := filepath.Join(tmplDir, pdfBase)

	return &TemplateTarget{
		WorkspaceRoot: wsRoot,
		PkgDir:        pkgDir,
		PkgName:       decl.Package.Name,
		PkgToml:       decl,
		TemplateDir:   tmplDir,
		TypstEntry:    typstEntry,
		EntryPath:     entryFile,
		OutputPath:    outputPath,
	}, nil
}

func typstBin() (string, error) {
	p, err := exec.LookPath("typst")
	if err != nil {
		return "", fmt.Errorf("typst not found on PATH (install via nix run nixpkgs#typst)")
	}
	return p, nil
}

func buildPackageHookEnv(wsRoot string, target *TemplateTarget) []string {
	relTemplateDir, relErr := filepath.Rel(wsRoot, target.TemplateDir)
	if relErr != nil {
		relTemplateDir = target.TemplateDir
	}

	env := []string{
		config.EnvReportDir + "=" + relTemplateDir,
		config.EnvTypstEntry + "=" + target.TypstEntry,
	}

	prefix := target.PkgToml.Package.CommandPrefix
	if prefix == "" {
		prefix = project.SanitizeEnvPart(target.PkgToml.Package.Name)
	} else {
		prefix = project.SanitizeEnvPart(prefix)
	}

	for k, schema := range target.PkgToml.ConfigSchema {
		if schema.Default != nil {
			envKey := config.EnvConfigPrefix + prefix + "_" + project.SanitizeEnvPart(k)
			envVal := fmt.Sprintf("%v", schema.Default)
			env = append(env, envKey+"="+envVal)
		}
	}

	return env
}

func runPackageHooks(wsRoot string, when string, target *TemplateTarget) error {
	timing, ok := target.PkgToml.Hooks["build"]
	if !ok {
		return nil
	}

	var aliases []string
	switch when {
	case project.HookBefore:
		aliases = timing.Before
	case project.HookAfter:
		aliases = timing.After
	default:
		return fmt.Errorf("invalid hook timing %q", when)
	}

	env := buildPackageHookEnv(wsRoot, target)

	for _, a := range aliases {
		prefix, name, err := scripts.SplitPrefix(strings.TrimSpace(a))
		if err != nil {
			return fmt.Errorf("[hooks.build] %w", err)
		}
		applies, err := scripts.HookApplies(prefix)
		if err != nil {
			return fmt.Errorf("[hooks.build] %w", err)
		}
		if !applies {
			continue
		}

		cmdDef, ok := target.PkgToml.Commands[name]
		if !ok {
			return fmt.Errorf("[hooks.build] unknown command alias %q in package %s", name, target.PkgName)
		}

		cmdStr, sErr := scripts.Select(project.JoinCommands(cmdDef.Commands), name, "")
		if sErr != nil {
			return fmt.Errorf("[hooks.build] %w", sErr)
		}

		if err := scripts.RunScript(wsRoot, cmdStr, "", env); err != nil {
			return fmt.Errorf("[hooks.build] %w", err)
		}
	}

	return nil
}

func BuildTemplate(ctx context.Context, wsRoot string, opts BuildOptions, cwd string) (*BuildResult, error) {
	target, err := ResolveTemplateTarget(wsRoot, opts.Target, cwd)
	if err != nil {
		return nil, err
	}

	outputPath := target.OutputPath
	if opts.Output != "" {
		if filepath.IsAbs(opts.Output) {
			outputPath = opts.Output
		} else {
			outputPath = filepath.Join(wsRoot, opts.Output)
		}
	}

	if !opts.NoHooks {
		if err := runPackageHooks(wsRoot, project.HookBefore, target); err != nil {
			return nil, err
		}
	}

	bin, err := typstBin()
	if err != nil {
		return nil, err
	}

	cmd := exec.CommandContext(ctx, bin, "compile", "--root", wsRoot, target.EntryPath, outputPath)
	cmd.Dir = wsRoot
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("typst compile failed: %w", err)
	}

	reportPdf := filepath.Join(target.TemplateDir, config.DefaultReportPDF)
	if outputPath != reportPdf {
		if _, statErr := os.Stat(reportPdf); os.IsNotExist(statErr) {
			_ = copyFile(outputPath, reportPdf)
		}
	}

	if !opts.NoHooks {
		if err := runPackageHooks(wsRoot, project.HookAfter, target); err != nil {
			return nil, err
		}
	}

	return &BuildResult{
		Target:     target,
		OutputPath: outputPath,
	}, nil
}

func WatchTemplate(ctx context.Context, wsRoot string, opts WatchOptions, cwd string) error {
	target, err := ResolveTemplateTarget(wsRoot, opts.Target, cwd)
	if err != nil {
		return err
	}

	bin, err := typstBin()
	if err != nil {
		return err
	}

	args := []string{"watch", "--root", wsRoot, target.EntryPath, target.OutputPath}
	if opts.Open {
		args = append(args, "--open")
	}

	cmd := exec.CommandContext(ctx, bin, args...)
	cmd.Dir = wsRoot
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("typst watch failed: %w", err)
	}

	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer func() { _ = in.Close() }()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer func() { _ = out.Close() }()

	if _, err := io.Copy(out, in); err != nil {
		return err
	}
	return out.Close()
}
