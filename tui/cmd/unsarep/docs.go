package main

import (
	"context"
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/UNSAReport/tui/internal/docs"
	"github.com/UNSAReport/tui/internal/project"
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
	var templateFlag, report string
	cmd := &cobra.Command{
		Use:   "init [template[@range]]",
		Short: "Scaffold a project or add a report dir",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			pos := ""
			if len(args) > 0 {
				pos = args[0]
			}
			template, err := resolvePosOrFlag(cmd, "template", pos, "template", templateFlag)
			if err != nil {
				return err
			}
			if template == "" {
				if !canPrompt() {
					return usagef(cmd, "usage: unsarep docs init <template-pkg>[@<range>] [--report R]")
				}
				reportVal := report
				form := huh.NewForm(huh.NewGroup(
					huh.NewInput().
						Title("Template package").
						Description("Name[@version-range] from the registry").
						Value(&template).
						Validate(func(s string) error {
							if strings.TrimSpace(s) == "" {
								return fmt.Errorf("template is required")
							}
							return nil
						}),
					huh.NewInput().
						Title("Report dir").
						Value(&reportVal),
				))
				if err := runForm(form); err != nil {
					return err
				}
				report = reportVal
			}
			ctx := context.Background()
			cwd, _ := os.Getwd()
			if err := docs.Init(ctx, cwd, docs.InitOptions{Template: template, Report: report}); err != nil {
				return err
			}
			printOK("Project initialized.")
			return nil
		},
	}
	cmd.Flags().StringVar(&templateFlag, "template", "", "Template package [name[@range]], same as positional")
	cmd.Flags().StringVar(&report, "report", "t1", "Report dir")
	return cmd
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
			// Package came from the form above and no mode flag was given:
			// ask for the mode too. Otherwise the domain ask-mode handles TTYs.
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
	var yes, all, none bool
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
			if len(args) == 0 && !cmd.Flags().Changed("package") && !yes && !all && !none && canPrompt() {
				form := huh.NewForm(huh.NewGroup(
					huh.NewInput().
						Title("Package").
						Description("Empty updates every locked package").
						Value(&pkg),
				))
				if err := runForm(form); err != nil {
					return err
				}
				var err error
				yes, all, none, err = promptMode(cmd)
				if err != nil {
					return err
				}
			}
			ctx := context.Background()
			cwd, _ := os.Getwd()
			if err := docs.Update(ctx, cwd, docs.UpdateOptions{Package: pkg, Flags: selectFlags(yes, all, none)}); err != nil {
				return err
			}
			printOK("Update complete.")
			return nil
		},
	}
	cmd.Flags().StringVar(&pkgFlag, "package", "", "Package name (empty updates all), same as positional")
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
	cmd := &cobra.Command{
		Use:   "watch [report-dir]",
		Short: "typst watch with managed --root",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			report, err := resolveReport(cmd, args, reportFlag)
			if err != nil {
				return err
			}
			cwd, _ := os.Getwd()
			return docs.Watch(cwd, report)
		},
	}
	cmd.Flags().StringVar(&reportFlag, "report", "", "Report dir, same as positional")
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
