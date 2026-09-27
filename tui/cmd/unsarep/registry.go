package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/Masterminds/semver/v3"
	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/registry"
	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"
	"github.com/spf13/cobra"
)

var initNameRe = regexp.MustCompile(`^(@[a-z0-9][a-z0-9._~-]*/)?[a-z0-9][a-z0-9._~-]*$`)

func newRegistryCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "registry",
		Short: "Validate, publish, scaffold, and list packages",
	}
	cmd.AddCommand(
		newRegistryInitCmd(),
		newRegistryPublishCmd(),
		newRegistryCheckCmd(),
		newRegistryListCmd(),
		newRegistryScopeCmd(),
		newRegistrySyncCmd(),
		newRegistryBuildCmd(),
		newRegistryWatchCmd(),
	)
	return cmd
}

func newRegistryInitCmd() *cobra.Command {
	var opt registry.InitOptions
	cmd := &cobra.Command{
		Use:   "init",
		Short: "Scaffold a new package dir",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			if opt.Name == "" {
				if !canPrompt() {
					return usagef(cmd, "registry init requires --name outside a terminal")
				}
				form := huh.NewForm(huh.NewGroup(
					huh.NewInput().
						Title("Directory").
						Description("Target dir (default ./name)").
						Value(&opt.Dir),
					huh.NewInput().
						Title("Name").
						Description("Package name [a-z0-9._~-], optionally \"@scope/name\", 3-64 chars").
						Value(&opt.Name).
						Validate(func(s string) error {
							n := strings.TrimSpace(s)
							if len(n) < 3 || len(n) > 64 || !initNameRe.MatchString(n) {
								return fmt.Errorf("name must match [a-z0-9._~-], optionally \"@scope/name\", 3-64 chars")
							}
							return nil
						}),
					huh.NewInput().
						Title("Description").
						Value(&opt.Description),
					huh.NewInput().
						Title("Version").
						Value(&opt.Version).
						Validate(func(s string) error {
							if _, err := semver.StrictNewVersion(strings.TrimSpace(s)); err != nil {
								return fmt.Errorf("invalid version: %w", err)
							}
							return nil
						}),
					huh.NewInput().
						Title("Command prefix").
						Description("Default: name").
						Value(&opt.CommandPrefix),
				))
				if err := runForm(form); err != nil {
					return err
				}
			}
			if err := registry.InitPackage(opt); err != nil {
				return err
			}
			printOK("package scaffolded.")
			return nil
		},
	}
	cmd.Flags().StringVar(&opt.Dir, "dir", "", "Target directory (default ./name)")
	cmd.Flags().StringVar(&opt.Name, "name", "", "Package name")
	cmd.Flags().StringVar(&opt.Description, "description", "", "Package description")
	cmd.Flags().StringVar(&opt.Version, "version", "0.1.0", "Initial version")
	cmd.Flags().StringVar(&opt.CommandPrefix, "prefix", "", "Command prefix (default name)")
	return cmd
}

func resolvePkgDir(cmd *cobra.Command, args []string, dirFlag string) (string, error) {
	pos := ""
	if len(args) > 0 {
		pos = args[0]
	}
	dir, err := resolvePosOrFlag(cmd, "package dir", pos, "dir", dirFlag)
	if err != nil {
		return "", err
	}
	if dir == "" {
		if !canPrompt() {
			return ".", nil
		}
		dir = "."
		form := huh.NewForm(huh.NewGroup(
			huh.NewInput().Title("Package directory").Value(&dir),
		))
		if err := runForm(form); err != nil {
			return "", err
		}
		if strings.TrimSpace(dir) == "" {
			dir = "."
		}
	}
	return dir, nil
}

func newRegistryPublishCmd() *cobra.Command {
	var dirFlag string
	cmd := &cobra.Command{
		Use:   "publish [pkg-dir]",
		Short: "Publish a package version",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			dir, err := resolvePkgDir(cmd, args, dirFlag)
			if err != nil {
				return err
			}
			ctx := context.Background()
			client, err := registry.NewClient()
			if err != nil {
				return err
			}
			if err := client.Publish(ctx, dir, "", ""); err != nil {
				return err
			}
			printOK("published.")
			return nil
		},
	}
	cmd.Flags().StringVar(&dirFlag, "dir", "", "Package directory (default .), same as positional")
	return cmd
}

func newRegistryCheckCmd() *cobra.Command {
	var dirFlag string
	cmd := &cobra.Command{
		Use:   "check [pkg-dir]",
		Short: "Validate a package dir (unsareport.toml)",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			pos := ""
			if len(args) > 0 {
				pos = args[0]
			}
			dir, err := resolvePosOrFlag(cmd, "package dir", pos, "dir", dirFlag)
			if err != nil {
				return err
			}
			if dir == "" {
				dir = "."
			}
			if err := registry.CheckPackageDir(dir); err != nil {
				return err
			}
			printOK("package check passed.")
			return nil
		},
	}
	cmd.Flags().StringVar(&dirFlag, "dir", ".", "Package directory, same as positional")
	return cmd
}

func newRegistryScopeCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "scope",
		Short: "Manage and push scope configurations",
	}
	cmd.AddCommand(newRegistryScopePushCmd())
	return cmd
}

func newRegistryScopePushCmd() *cobra.Command {
	var dirFlag string
	cmd := &cobra.Command{
		Use:   "push [dir]",
		Short: "Push scope configuration and files to registry",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			pos := ""
			if len(args) > 0 {
				pos = args[0]
			}
			dir, err := resolvePosOrFlag(cmd, "directory", pos, "dir", dirFlag)
			if err != nil {
				return err
			}
			if dir == "" {
				dir = "."
			}
			ctx := context.Background()
			client, err := registry.NewClient()
			if err != nil {
				return err
			}
			if err := client.PushScope(ctx, dir); err != nil {
				return err
			}
			printOK("scope pushed successfully.")
			return nil
		},
	}
	cmd.Flags().StringVar(&dirFlag, "dir", ".", "Directory containing unsareport.toml with [scope]")
	return cmd
}

func newRegistryListCmd() *cobra.Command {
	var limit int
	var jsonOut bool
	cmd := &cobra.Command{
		Use:   "list",
		Short: "List registry packages",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			if limit < 0 {
				return usagef(cmd, "--limit must not be negative")
			}
			ctx := context.Background()
			client, err := registry.NewClient()
			if err != nil {
				return err
			}
			pkgs, err := client.ListPackages(ctx)
			if err != nil {
				return err
			}
			if limit > 0 && len(pkgs) > limit {
				pkgs = pkgs[:limit]
			}
			if jsonOut {
				b, _ := json.MarshalIndent(pkgs, "", "  ")
				fmt.Println(string(b))
				return nil
			}
			t := table.New().
				Border(lipgloss.RoundedBorder()).
				Headers("NAME", "DESCRIPTION", "VERSION")
			for _, p := range pkgs {
				t.Row(p.Name, p.Description, p.Version)
			}
			fmt.Println(t)
			fmt.Println(styleMuted.Render(fmt.Sprintf("%d package(s) — server caps results at %d", len(pkgs), config.DefaultRegistryLimit)))
			return nil
		},
	}
	cmd.Flags().IntVar(&limit, "limit", config.DefaultRegistryLimit, "Max packages to show (server caps at 100)")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "JSON output")
	return cmd
}

func newRegistrySyncCmd() *cobra.Command {
	var opt registry.SyncOptions
	var localDirs []string
	var jsonOut bool
	cmd := &cobra.Command{
		Use:   "sync [dir]",
		Short: "Synchronize local components directory for package development and testing",
		Long: `sync inspects unsareport.toml files in the workspace, links local packages
and scopes into a root components/ directory using relative symlinks, and downloads
external dependencies from the registry (or links them from --local paths).`,
		Args: cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			dir := "."
			if len(args) > 0 {
				dir = args[0]
			}
			opt.LocalDirs = localDirs
			ctx := context.Background()
			client, err := registry.NewClient()
			if err != nil {
				return err
			}
			res, err := registry.SyncWorkspace(ctx, client, dir, opt)
			if err != nil {
				return err
			}
			if opt.Clean {
				printOK("components directory cleaned.")
				return nil
			}
			if jsonOut {
				b, _ := json.MarshalIndent(res, "", "  ")
				fmt.Println(string(b))
				return nil
			}
			t := table.New().
				Border(lipgloss.RoundedBorder()).
				Headers("PACKAGE", "VERSION", "SOURCE", "TARGET/PATH")
			for _, p := range res.Packages {
				t.Row(p.Name, p.Version, p.Source, p.Path)
			}
			fmt.Println(t)
			printOK("components synchronized successfully (%d package(s)).", len(res.Packages))
			return nil
		},
	}
	cmd.Flags().BoolVar(&opt.Clean, "clean", false, "Remove the generated components directory")
	cmd.Flags().BoolVar(&opt.Check, "check", false, "Verify dependency resolution without modifying files")
	cmd.Flags().StringSliceVar(&localDirs, "local", nil, "Path(s) to sibling local package repositories")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "Output results in JSON format")
	return cmd
}

func newRegistryBuildCmd() *cobra.Command {
	var targetFlag string
	var outputFlag string
	var noHooks bool

	cmd := &cobra.Command{
		Use:   "build [target]",
		Short: "Compile a package template within a synced workspace",
		Long: `build compiles a package template (e.g. main.typ) using the synced workspace
root as the Typst --root directory. It runs package pre- and post-build hooks with
injected environment variables.`,
		Args: cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			pos := ""
			if len(args) > 0 {
				pos = args[0]
			}
			target, err := resolvePosOrFlag(cmd, "target", pos, "target", targetFlag)
			if err != nil {
				return err
			}

			cwd, err := os.Getwd()
			if err != nil {
				return fmt.Errorf("get working directory: %w", err)
			}

			wsRoot, err := registry.FindWorkspaceRoot(cwd)
			if err != nil {
				return err
			}

			if target == "" {
				tmplList, lErr := registry.ListTemplatePackages(wsRoot)
				if lErr == nil && len(tmplList) > 1 && canPrompt() {
					inPackage := false
					for _, tmpl := range tmplList {
						pkgFull := filepath.Join(wsRoot, tmpl.Dir)
						if cwd == pkgFull || strings.HasPrefix(cwd, pkgFull+string(os.PathSeparator)) {
							inPackage = true
							break
						}
					}
					if !inPackage {
						var options []huh.Option[string]
						for _, t := range tmplList {
							desc := t.Description
							if desc != "" {
								desc = " — " + desc
							}
							label := fmt.Sprintf("%s (%s)%s", t.Name, t.Dir, desc)
							options = append(options, huh.NewOption(label, t.Name))
						}
						var chosen string
						form := huh.NewForm(huh.NewGroup(
							huh.NewSelect[string]().
								Title("Select package template to build").
								Options(options...).
								Value(&chosen),
						))
						if err := runForm(form); err != nil {
							return err
						}
						target = chosen
					}
				}
			}

			ctx := context.Background()
			res, err := registry.BuildTemplate(ctx, wsRoot, registry.BuildOptions{
				Target:  target,
				Output:  outputFlag,
				NoHooks: noHooks,
			}, cwd)
			if err != nil {
				return err
			}

			relOut, _ := filepath.Rel(wsRoot, res.OutputPath)
			printOK("Compiled %s template -> %s", res.Target.PkgName, relOut)
			return nil
		},
	}
	cmd.Flags().StringVar(&targetFlag, "target", "", "Target package name, directory, or typst file")
	cmd.Flags().StringVarP(&outputFlag, "output", "o", "", "Custom output PDF path")
	cmd.Flags().BoolVar(&noHooks, "no-hooks", false, "Skip package hooks")
	return cmd
}

func newRegistryWatchCmd() *cobra.Command {
	var targetFlag string
	var openFlag bool

	cmd := &cobra.Command{
		Use:   "watch [target]",
		Short: "Watch a package template for live preview within a synced workspace",
		Long: `watch compiles and watches a package template with Typst, using the synced
workspace root as the Typst --root directory.`,
		Args: cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			pos := ""
			if len(args) > 0 {
				pos = args[0]
			}
			target, err := resolvePosOrFlag(cmd, "target", pos, "target", targetFlag)
			if err != nil {
				return err
			}

			cwd, err := os.Getwd()
			if err != nil {
				return fmt.Errorf("get working directory: %w", err)
			}

			wsRoot, err := registry.FindWorkspaceRoot(cwd)
			if err != nil {
				return err
			}

			if target == "" {
				tmplList, lErr := registry.ListTemplatePackages(wsRoot)
				if lErr == nil && len(tmplList) > 1 && canPrompt() {
					inPackage := false
					for _, tmpl := range tmplList {
						pkgFull := filepath.Join(wsRoot, tmpl.Dir)
						if cwd == pkgFull || strings.HasPrefix(cwd, pkgFull+string(os.PathSeparator)) {
							inPackage = true
							break
						}
					}
					if !inPackage {
						var options []huh.Option[string]
						for _, t := range tmplList {
							desc := t.Description
							if desc != "" {
								desc = " — " + desc
							}
							label := fmt.Sprintf("%s (%s)%s", t.Name, t.Dir, desc)
							options = append(options, huh.NewOption(label, t.Name))
						}
						var chosen string
						form := huh.NewForm(huh.NewGroup(
							huh.NewSelect[string]().
								Title("Select package template to watch").
								Options(options...).
								Value(&chosen),
						))
						if err := runForm(form); err != nil {
							return err
						}
						target = chosen
					}
				}
			}

			ctx := context.Background()
			return registry.WatchTemplate(ctx, wsRoot, registry.WatchOptions{
				Target: target,
				Open:   openFlag,
			}, cwd)
		},
	}
	cmd.Flags().StringVar(&targetFlag, "target", "", "Target package name, directory, or typst file")
	cmd.Flags().BoolVar(&openFlag, "open", true, "Open the PDF file with the system default viewer after compilation")
	return cmd
}

