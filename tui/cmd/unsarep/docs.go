package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"github.com/UNSAReport/tui/internal/docs"
	"github.com/UNSAReport/tui/internal/registry"
)

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
		name := fs.String("name", "", "Project name")
		report := fs.String("report", "t1", "Report dir")
		_ = fs.Parse(args[1:])
		rest := fs.Args()
		if len(rest) == 0 {
			fmt.Fprintln(os.Stderr, "usage: unsarep docs init <template-pkg>[@<range>] [--name N --report R]")
			os.Exit(2)
		}
		if err := docs.Init(ctx, cwd, docs.InitOptions{Template: rest[0], Name: *name, Report: *report}); err != nil {
			fmt.Fprintf(os.Stderr, "init failed: %v\n", err)
			os.Exit(1)
		}
	case "add":
		fs := flag.NewFlagSet("docs add", flag.ExitOnError)
		yes := fs.Bool("yes", false, "Select defaults only")
		all := fs.Bool("all", false, "Select defaults+all")
		none := fs.Bool("none", false, "Select none")
		_ = fs.Parse(args[1:])
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
		_ = fs.Parse(args[1:])
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
		fmt.Fprintln(os.Stderr, "usage: unsarep registry <check|publish> ...")
		os.Exit(2)
	}
	ctx := context.Background()
	switch args[0] {
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
