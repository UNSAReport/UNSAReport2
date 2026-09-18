package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/UNSAReport/tui/internal/docs"
	"github.com/UNSAReport/tui/internal/registry"
	"github.com/charmbracelet/huh"
)

// boolFlags are flags that take no value; everything else starting with --
// consumes the next token. Go's flag package stops at the first positional,
// so reorderArgs moves flags first to support interspersed flag placement.
var boolFlags = map[string]bool{"yes": true, "all": true, "none": true}

func reorderArgs(args []string) []string {
	var flags, pos []string
	i := 0
	for i < len(args) {
		a := args[i]
		if a == "--" {
			pos = append(pos, args[i:]...)
			break
		}
		if strings.HasPrefix(a, "--") && len(a) > 2 {
			name := strings.TrimPrefix(a, "--")
			if strings.Contains(name, "=") || boolFlags[name] {
				flags = append(flags, a)
				i++
				continue
			}
			flags = append(flags, a)
			if i+1 < len(args) {
				flags = append(flags, args[i+1])
				i += 2
			} else {
				i++
			}
			continue
		}
		pos = append(pos, a)
		i++
	}
	return append(flags, pos...)
}

func handleDocs(args []string) {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "usage: unsarep docs <init|add|update|remove|check|build|watch|run> ...")
		os.Exit(2)
	}
	ctx := context.Background()
	cwd, _ := os.Getwd()
	switch args[0] {
	case "init":
		fs := flag.NewFlagSet("docs init", flag.ExitOnError)
		report := fs.String("report", "t1", "Report dir")
		_ = fs.Parse(reorderArgs(args[1:]))
		rest := fs.Args()
		if len(rest) == 0 {
			fmt.Fprintln(os.Stderr, "usage: unsarep docs init <template-pkg>[@<range>] [--report R]")
			os.Exit(2)
		}
		if err := docs.Init(ctx, cwd, docs.InitOptions{Template: rest[0], Report: *report}); err != nil {
			fmt.Fprintf(os.Stderr, "init failed: %v\n", err)
			os.Exit(1)
		}
	case "add":
		fs := flag.NewFlagSet("docs add", flag.ExitOnError)
		yes := fs.Bool("yes", false, "Select defaults only")
		all := fs.Bool("all", false, "Select defaults+all")
		none := fs.Bool("none", false, "Select none")
		_ = fs.Parse(reorderArgs(args[1:]))
		rest := fs.Args()
		if len(rest) == 0 {
			fmt.Fprintln(os.Stderr, "usage: unsarep docs add <pkg>@<ver-req> [--yes|--all|--none]")
			os.Exit(2)
		}
		var flags []string
		if *yes {
			flags = append(flags, "--yes")
		}
		if *all {
			flags = append(flags, "--all")
		}
		if *none {
			flags = append(flags, "--none")
		}
		if err := docs.Add(ctx, cwd, docs.AddOptions{Package: rest[0], Flags: flags}); err != nil {
			fmt.Fprintf(os.Stderr, "add failed: %v\n", err)
			os.Exit(1)
		}
	case "update":
		fs := flag.NewFlagSet("docs update", flag.ExitOnError)
		yes := fs.Bool("yes", false, "Apply all")
		all := fs.Bool("all", false, "Apply all")
		none := fs.Bool("none", false, "Apply none")
		_ = fs.Parse(reorderArgs(args[1:]))
		rest := fs.Args()
		pkg := ""
		if len(rest) > 0 {
			pkg = rest[0]
		}
		if err := docs.Update(ctx, cwd, docs.UpdateOptions{Package: pkg, Flags: selectFlags(*yes, *all, *none)}); err != nil {
			fmt.Fprintf(os.Stderr, "update failed: %v\n", err)
			os.Exit(1)
		}
	case "remove":
		if len(args) < 2 {
			fmt.Fprintln(os.Stderr, "usage: unsarep docs remove <pkg>")
			os.Exit(2)
		}
		if err := docs.Remove(cwd, args[1]); err != nil {
			fmt.Fprintf(os.Stderr, "remove failed: %v\n", err)
			os.Exit(1)
		}
	case "check":
		if err := docs.Check(cwd); err != nil {
			fmt.Fprintf(os.Stderr, "%v\n", err)
			os.Exit(1)
		}
		fmt.Println("check passed: no findings.")
	case "build":
		if len(args) < 2 {
			fmt.Fprintln(os.Stderr, "usage: unsarep docs build <report-dir>")
			os.Exit(2)
		}
		if err := docs.Build(cwd, args[1]); err != nil {
			fmt.Fprintf(os.Stderr, "build failed: %v\n", err)
			os.Exit(1)
		}
	case "watch":
		if len(args) < 2 {
			fmt.Fprintln(os.Stderr, "usage: unsarep docs watch <report-dir>")
			os.Exit(2)
		}
		if err := docs.Watch(cwd, args[1]); err != nil {
			fmt.Fprintf(os.Stderr, "watch failed: %v\n", err)
			os.Exit(1)
		}
	case "run":
		if len(args) < 2 {
			fmt.Fprintln(os.Stderr, "usage: unsarep docs run <alias> [-- <args...>]")
			os.Exit(2)
		}
		alias := args[1]
		var extra []string
		for i, a := range args[2:] {
			if a == "--" {
				extra = args[2+i+1:]
				break
			}
		}
		if err := docs.Run(cwd, alias, extra); err != nil {
			fmt.Fprintf(os.Stderr, "run failed: %v\n", err)
			os.Exit(1)
		}
	default:
		fmt.Fprintf(os.Stderr, "unknown docs command %q\n", args[0])
		os.Exit(2)
	}
}

func selectFlags(yes, all, none bool) []string {
	var out []string
	if yes {
		out = append(out, "--yes")
	}
	if all {
		out = append(out, "--all")
	}
	if none {
		out = append(out, "--none")
	}
	return out
}

func handleRegistry(args []string) {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "usage: unsarep registry <check|publish|init> ...")
		os.Exit(2)
	}
	ctx := context.Background()
	switch args[0] {
	case "init":
		fs := flag.NewFlagSet("registry init", flag.ContinueOnError)
		dir := fs.String("dir", "", "Target directory (default ./name)")
		name := fs.String("name", "", "Package name")
		description := fs.String("description", "", "Package description")
		version := fs.String("version", "0.1.0", "Initial version")
		prefix := fs.String("prefix", "", "Command prefix (default name)")
		_ = fs.Parse(reorderArgs(args[1:]))
		opt := registry.InitOptions{Dir: *dir, Name: *name, Description: *description, Version: *version, CommandPrefix: *prefix}
		if opt.Name == "" {
			if !isTerm() {
				fmt.Fprintln(os.Stderr, "registry init requires --name outside a terminal")
				os.Exit(2)
			}
			var err error
			opt, err = registryInitForm(opt)
			if err != nil {
				fmt.Fprintf(os.Stderr, "init cancelled: %v\n", err)
				os.Exit(1)
			}
		}
		if err := registry.InitPackage(opt); err != nil {
			fmt.Fprintf(os.Stderr, "init failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("package scaffolded.")
	case "publish":
		if len(args) < 2 {
			fmt.Fprintln(os.Stderr, "usage: unsarep registry publish <pkg-dir>")
			os.Exit(2)
		}
		client := registry.NewClient()
		if err := client.Publish(ctx, args[1], "", ""); err != nil {
			fmt.Fprintf(os.Stderr, "publish failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("published.")
	case "check":
		dir := "."
		if len(args) > 1 {
			dir = args[1]
		}
		if err := registry.CheckPackageDir(dir); err != nil {
			fmt.Fprintf(os.Stderr, "%v\n", err)
			os.Exit(1)
		}
		fmt.Println("package check passed.")
	default:
		fmt.Fprintf(os.Stderr, "unknown registry command %q\n", args[0])
		os.Exit(2)
	}
}

func isTerm() bool {
	fi, err := os.Stdin.Stat()
	if err != nil {
		return false
	}
	return fi.Mode()&os.ModeCharDevice != 0
}

func registryInitForm(opt registry.InitOptions) (registry.InitOptions, error) {
	form := huh.NewForm(
		huh.NewGroup(
			huh.NewInput().Title("Directory").Description("Target dir (default ./name)").Value(&opt.Dir),
			huh.NewInput().Title("Name").Description("Package name [a-z0-9-]").Value(&opt.Name).Validate(func(s string) error {
				if strings.TrimSpace(s) == "" {
					return fmt.Errorf("name is required")
				}
				return nil
			}),
			huh.NewInput().Title("Description").Value(&opt.Description),
			huh.NewInput().Title("Version").Value(&opt.Version),
			huh.NewInput().Title("Command prefix").Description("Default: name").Value(&opt.CommandPrefix),
		),
	)
	if err := form.Run(); err != nil {
		return opt, err
	}
	return opt, nil
}
