package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/docs"
	"github.com/UNSAReport/tui/internal/lock"
	"github.com/UNSAReport/tui/internal/project"
	"github.com/UNSAReport/tui/internal/registry"
	"github.com/charmbracelet/huh"
	"github.com/spf13/cobra"
)

func newDocsCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "docs",
		Short: "Scaffold, manage, check, and build report projects",
	}
	cmd.AddCommand(
		newDocsInitCmd(),
		newDocsAddCmd(),
		newDocsUpdateCmd(),
		newDocsRemoveCmd(),
		newDocsCheckCmd(),
		newDocsBuildCmd(),
		newDocsWatchCmd(),
		newDocsRunCmd(),
	)
	return cmd
}

func newDocsInitCmd() *cobra.Command {
	var templateFlag, report, searchFlag string
	var yesFlag, allFlag, noneFlag bool
	cmd := &cobra.Command{
		Use:   "init [template[@range]]",
		Short: "Scaffold a project or add a report dir",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := exclusiveMode(cmd, yesFlag, allFlag, noneFlag); err != nil {
				return err
			}
			pos := ""
			if len(args) > 0 {
				pos = args[0]
			}
			template, err := resolvePosOrFlag(cmd, "template", pos, "template", templateFlag)
			if err != nil {
				return err
			}
			ctx := context.Background()
			client, err := registry.NewClient()
			if err != nil {
				return err
			}
			if searchFlag != "" && template == "" {
				pkgs, sErr := client.SearchPackages(ctx, searchFlag, config.DefaultSearchLimit)
				if sErr != nil {
					return sErr
				}
				if len(pkgs) == 0 {
					return fmt.Errorf("no packages found matching %q", searchFlag)
				}
				if !canPrompt() {
					template = pkgs[0].Name
				} else {
					chosen, pErr := selectPackageFromList("Matching template packages", pkgs, client, ctx)
					if pErr != nil {
						return pErr
					}
					template = chosen
				}
			}
			if template == "" {
				if !canPrompt() {
					return usagef(cmd, "usage: unsarep docs init <template-pkg>[@<range>] [--report R] [--yes|--all|--none]")
				}
				chosen, pErr := promptSelectTemplate(ctx, client)
				if pErr != nil {
					return pErr
				}
				template = chosen
				reportVal := report
				form := huh.NewForm(huh.NewGroup(
					huh.NewInput().
						Title("Report dir").
						Value(&reportVal),
				))
				if err := runForm(form); err != nil {
					return err
				}
				report = reportVal
			}
			if !yesFlag && !allFlag && !noneFlag && canPrompt() {
				y, a, n, perr := promptMode(cmd)
				if perr != nil {
					return perr
				}
				yesFlag, allFlag, noneFlag = y, a, n
			}
			flags := selectFlags(yesFlag, allFlag, noneFlag)
			cwd, _ := os.Getwd()
			if err := docs.Init(ctx, cwd, docs.InitOptions{
				Template: template,
				Report:   report,
				Yes:      yesFlag,
				Flags:    flags,
			}); err != nil {
				return err
			}
			printOK("Project initialized.")
			return nil
		},
	}
	cmd.Flags().StringVar(&templateFlag, "template", "", "Template package [name[@range]], same as positional")
	cmd.Flags().StringVarP(&searchFlag, "search", "s", "", "Search query for template packages in registry")
	cmd.Flags().StringVar(&report, "report", "t1", "Report dir")
	cmd.Flags().BoolVarP(&yesFlag, "yes", "y", false, "Confirm file replacement and accept default commands without prompt")
	cmd.Flags().BoolVar(&allFlag, "all", false, "Accept all commands and hooks without prompt")
	cmd.Flags().BoolVar(&noneFlag, "none", false, "Skip commands and hooks without prompt")
	return cmd
}

func selectPackageFromList(title string, pkgs []registry.PackageInfo, client *registry.Client, ctx context.Context) (string, error) {
	for {
		var options []huh.Option[string]
		options = append(options, huh.NewOption("Search registry by keyword...", config.ActionSearchRegistry))
		options = append(options, huh.NewOption("Enter package name manually...", config.ActionManualPackage))

		for _, p := range pkgs {
			desc := p.Description
			if desc != "" {
				desc = " — " + desc
			}
			label := fmt.Sprintf("%s (v%s)%s", p.Name, p.Version, desc)
			options = append(options, huh.NewOption(label, p.Name))
		}

		var selected string
		form := huh.NewForm(huh.NewGroup(
			huh.NewSelect[string]().
				Title(title).
				Description("Type to filter, or choose search / manual").
				Filtering(true).
				Options(options...).
				Value(&selected),
		))
		if err := runForm(form); err != nil {
			return "", err
		}

		switch selected {
		case config.ActionSearchRegistry:
			var query string
			queryForm := huh.NewForm(huh.NewGroup(
				huh.NewInput().
					Title("Search packages").
					Description("Enter search terms for registry packages").
					Value(&query).
					Validate(func(s string) error {
						if strings.TrimSpace(s) == "" {
							return fmt.Errorf("search query cannot be empty")
						}
						return nil
					}),
			))
			if err := runForm(queryForm); err != nil {
				return "", err
			}
			matched, err := client.SearchPackages(ctx, query, config.DefaultSearchLimit)
			if err != nil {
				return "", err
			}
			if len(matched) == 0 {
				fmt.Printf("No packages matched %q.\n", query)
				continue
			}
			pkgs = matched
			title = fmt.Sprintf("Search results for %q", query)
			continue

		case config.ActionManualPackage:
			var manual string
			manualForm := huh.NewForm(huh.NewGroup(
				huh.NewInput().
					Title("Template package").
					Description("Name[@version-range] from the registry").
					Value(&manual).
					Validate(func(s string) error {
						if strings.TrimSpace(s) == "" {
							return fmt.Errorf("template is required")
						}
						return nil
					}),
			))
			if err := runForm(manualForm); err != nil {
				return "", err
			}
			return manual, nil

		default:
			return selected, nil
		}
	}
}

func promptSelectTemplate(ctx context.Context, client *registry.Client) (string, error) {
	pkgs, err := client.ListPackagesCached(ctx)
	if err != nil {
		return "", err
	}
	return selectPackageFromList("Select template package", pkgs, client, ctx)
}

func promptMode(cmd *cobra.Command) (yes, all, none bool, err error) {
	var mode string
	form := huh.NewForm(huh.NewGroup(
		huh.NewSelect[string]().
			Title("Component selection").
			Options(
				huh.NewOption("Defaults only (--yes)", "yes"),
				huh.NewOption("Defaults and all (--all)", "all"),
				huh.NewOption("None (--none)", "none"),
			).
			Value(&mode),
	))
	if err := runForm(form); err != nil {
		return false, false, false, err
	}
	switch mode {
	case "yes":
		return true, false, false, nil
	case "all":
		return false, true, false, nil
	case "none":
		return false, false, true, nil
	}
	return false, false, false, usagef(cmd, "select one of --yes, --all, --none")
}
func newDocsAddCmd() *cobra.Command {
	var pkgFlag string
	var yes, all, none bool
	cmd := &cobra.Command{
		Use:   "add [pkg@range]",
		Short: "Install a component package",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := exclusiveMode(cmd, yes, all, none); err != nil {
				return err
			}
			pos := ""
			if len(args) > 0 {
				pos = args[0]
			}
			pkg, err := resolvePosOrFlag(cmd, "package", pos, "package", pkgFlag)
			if err != nil {
				return err
			}
			fromForm := pkg == ""
			if pkg == "" {
				if !canPrompt() {
					return usagef(cmd, "usage: unsarep docs add <pkg>@<ver-req> [--yes|--all|--none]")
				}
				form := huh.NewForm(huh.NewGroup(
					huh.NewInput().
						Title("Package").
						Description("Name@version-range from the registry").
						Value(&pkg).
						Validate(func(s string) error {
							if strings.TrimSpace(s) == "" {
								return fmt.Errorf("package is required")
							}
							return nil
						}),
				))
				if err := runForm(form); err != nil {
					return err
				}
			}
			if fromForm && !yes && !all && !none {
				yes, all, none, err = promptMode(cmd)
				if err != nil {
					return err
				}
			}
			ctx := context.Background()
			cwd, _ := os.Getwd()
			if err := docs.Add(ctx, cwd, docs.AddOptions{Package: pkg, Flags: selectFlags(yes, all, none)}); err != nil {
				return err
			}
			printOK("Package %s added.", pkg)
			return nil
		},
	}
	cmd.Flags().StringVar(&pkgFlag, "package", "", "Package [name@range], same as positional")
	cmd.Flags().BoolVar(&yes, "yes", false, "Select defaults only")
	cmd.Flags().BoolVar(&all, "all", false, "Select defaults+all")
	cmd.Flags().BoolVar(&none, "none", false, "Select none")
	return cmd
}

func newDocsUpdateCmd() *cobra.Command {
	var pkgFlag string
	var yes, all, none, deps bool
	cmd := &cobra.Command{
		Use:   "update [pkg]",
		Short: "Update vendored components",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := exclusiveMode(cmd, yes, all, none); err != nil {
				return err
			}
			pos := ""
			if len(args) > 0 {
				pos = args[0]
			}
			pkg, err := resolvePosOrFlag(cmd, "package", pos, "package", pkgFlag)
			if err != nil {
				return err
			}
			cwd, _ := os.Getwd()
			if len(args) == 0 && !cmd.Flags().Changed("package") && !yes && !all && !none && canPrompt() {
				l, lErr := lock.Load(cwd)
				if lErr == nil && len(l.Pkg) > 0 {
					cfg, _ := project.Load(filepath.Join(cwd, config.ConfigFileName))
					options := make([]huh.Option[string], 0, len(l.Pkg)+1)
					options = append(options, huh.NewOption("All packages (entire project)", ""))
					for _, p := range l.Pkg {
						if _, isDirect := cfg.Dependencies[p.Name]; isDirect {
							options = append(options, huh.NewOption(fmt.Sprintf("%s (direct, v%s)", p.Name, p.Version), p.Name))
						} else {
							options = append(options, huh.NewOption(fmt.Sprintf("%s (dependency, v%s)", p.Name, p.Version), p.Name))
						}
					}
					selectForm := huh.NewForm(huh.NewGroup(
						huh.NewSelect[string]().
							Title("Select package to update").
							Options(options...).
							Value(&pkg),
					))
					if err := runForm(selectForm); err != nil {
						return err
					}
				} else {
					form := huh.NewForm(huh.NewGroup(
						huh.NewInput().
							Title("Package").
							Description("Empty updates every locked package").
							Value(&pkg),
					))
					if err := runForm(form); err != nil {
						return err
					}
				}

				if !cmd.Flags().Changed("deps") {
					depsConfirm := false
					depsForm := huh.NewForm(huh.NewGroup(
						huh.NewConfirm().
							Title("Update dependencies as well?").
							Value(&depsConfirm),
					))
					if err := runForm(depsForm); err != nil {
						return err
					}
					deps = depsConfirm
				}
			}
			ctx := context.Background()
			if err := docs.Update(ctx, cwd, docs.UpdateOptions{Package: pkg, Deps: deps, Flags: selectFlags(yes, all, none)}); err != nil {
				return err
			}
			printOK("Update complete.")
			return nil
		},
	}
	cmd.Flags().StringVar(&pkgFlag, "package", "", "Package name (empty updates all), same as positional")
	cmd.Flags().BoolVarP(&deps, "deps", "d", false, "Update dependencies as well")
	cmd.Flags().BoolVar(&yes, "yes", false, "Apply all")
	cmd.Flags().BoolVar(&all, "all", false, "Apply all")
	cmd.Flags().BoolVar(&none, "none", false, "Apply none")
	return cmd
}

func newDocsRemoveCmd() *cobra.Command {
	var pkgFlag string
	var yes bool
	cmd := &cobra.Command{
		Use:   "remove [pkg]",
		Short: "Remove a component package",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			pos := ""
			if len(args) > 0 {
				pos = args[0]
			}
			pkg, err := resolvePosOrFlag(cmd, "package", pos, "package", pkgFlag)
			if err != nil {
				return err
			}
			if pkg == "" {
				if !canPrompt() {
					return usagef(cmd, "usage: unsarep docs remove <pkg>")
				}
				form := huh.NewForm(huh.NewGroup(
					huh.NewInput().
						Title("Package").
						Description("Installed package to remove").
						Value(&pkg).
						Validate(func(s string) error {
							if strings.TrimSpace(s) == "" {
								return fmt.Errorf("package is required")
							}
							return nil
						}),
				))
				if err := runForm(form); err != nil {
					return err
				}
			}
			if !yes {
				if !canPrompt() {
					return usagef(cmd, "refusing to remove %q without --yes outside a terminal", pkg)
				}
				var confirm bool
				form := huh.NewForm(huh.NewGroup(
					huh.NewConfirm().Title(fmt.Sprintf("Remove package %q?", pkg)).Value(&confirm),
				))
				if err := runForm(form); err != nil {
					return err
				}
				if !confirm {
					return fmt.Errorf("remove cancelled")
				}
			}
			cwd, _ := os.Getwd()
			if err := docs.Remove(cwd, pkg); err != nil {
				return err
			}
			printOK("Package %s removed.", pkg)
			return nil
		},
	}
	cmd.Flags().StringVar(&pkgFlag, "package", "", "Package name, same as positional")
	cmd.Flags().BoolVarP(&yes, "yes", "y", false, "Skip confirmation")
	return cmd
}

func newDocsCheckCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "check",
		Short: "Run project checks",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			cwd, _ := os.Getwd()
			if err := docs.Check(cwd); err != nil {
				return err
			}
			printOK("check passed: no findings.")
			return nil
		},
	}
}

func resolveReport(cmd *cobra.Command, args []string, reportFlag string) (string, error) {
	pos := ""
	if len(args) > 0 {
		pos = args[0]
	}
	report, err := resolvePosOrFlag(cmd, "report dir", pos, "report", reportFlag)
	if err != nil {
		return "", err
	}
	if report == "" {
		if !canPrompt() {
			return "", usagef(cmd, "usage: unsarep docs %s <report-dir> [--report R]", cmd.Name())
		}
		report = "t1"
		form := huh.NewForm(huh.NewGroup(
			huh.NewInput().Title("Report dir").Value(&report),
		))
		if err := runForm(form); err != nil {
			return "", err
		}
		if strings.TrimSpace(report) == "" {
			return "", usagef(cmd, "report dir is required")
		}
	}
	return report, nil
}

func newDocsBuildCmd() *cobra.Command {
	var reportFlag string
	cmd := &cobra.Command{
		Use:   "build [report-dir]",
		Short: "Run hooks + typst compile --root",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			report, err := resolveReport(cmd, args, reportFlag)
			if err != nil {
				return err
			}
			cwd, _ := os.Getwd()
			if err := docs.Build(cwd, report); err != nil {
				return err
			}
			printOK("Build complete.")
			return nil
		},
	}
	cmd.Flags().StringVar(&reportFlag, "report", "", "Report dir, same as positional")
	return cmd
}

func newDocsWatchCmd() *cobra.Command {
	var reportFlag string
	var openFlag bool
	cmd := &cobra.Command{
		Use:   "watch [report-dir]",
		Short: "typst watch with managed --root and default viewer",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			report, err := resolveReport(cmd, args, reportFlag)
			if err != nil {
				return err
			}
			cwd, _ := os.Getwd()
			return docs.Watch(cwd, docs.WatchOptions{
				Report: report,
				Open:   openFlag,
			})
		},
	}
	cmd.Flags().StringVar(&reportFlag, "report", "", "Report dir, same as positional")
	cmd.Flags().BoolVar(&openFlag, "open", true, "Open the PDF file with the system default viewer after compilation")
	return cmd
}

func newDocsRunCmd() *cobra.Command {
	var aliasFlag string
	cmd := &cobra.Command{
		Use:   "run [alias] -- [args...]",
		Short: "Run a project script alias",
		Long:  "Run a project script alias. Extra args must follow a -- separator.",
		Args:  cobra.ArbitraryArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			pos := ""
			var extra []string
			if idx := cmd.Flags().ArgsLenAtDash(); idx >= 0 {
				if idx > 0 {
					pos = args[0]
				}
				extra = args[idx:]
			} else {
				if len(args) > 1 {
					return usagef(cmd, "extra args must follow a -- separator: unsarep docs run <alias> [-- <args...>]")
				}
				if len(args) > 0 {
					pos = args[0]
				}
			}
			alias, err := resolvePosOrFlag(cmd, "alias", pos, "alias", aliasFlag)
			if err != nil {
				return err
			}
			if alias == "" {
				if !canPrompt() {
					return usagef(cmd, "usage: unsarep docs run <alias> [-- <args...>]")
				}
				cwd, _ := os.Getwd()
				if avail := projectAliases(cwd); len(avail) > 0 {
					form := huh.NewForm(huh.NewGroup(
						huh.NewSelect[string]().
							Title("Script alias").
							Options(huh.NewOptions(avail...)...).
							Value(&alias),
					))
					if err := runForm(form); err != nil {
						return err
					}
				} else {
					form := huh.NewForm(huh.NewGroup(
						huh.NewInput().
							Title("Script alias").
							Value(&alias).
							Validate(func(s string) error {
								if strings.TrimSpace(s) == "" {
									return fmt.Errorf("alias is required")
								}
								return nil
							}),
					))
					if err := runForm(form); err != nil {
						return err
					}
				}
			}
			cwd, _ := os.Getwd()
			return docs.Run(cwd, alias, extra)
		},
	}
	cmd.Flags().StringVar(&aliasFlag, "alias", "", "Script alias, same as positional")
	return cmd
}

func projectAliases(cwd string) []string {
	pctx, err := project.Detect(cwd)
	if err != nil || !pctx.IsProject {
		return nil
	}
	var out []string
	for a := range pctx.Config.Scripts {
		out = append(out, a)
	}
	sort.Strings(out)
	return out
}
