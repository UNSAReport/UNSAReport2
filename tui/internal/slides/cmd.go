package slides

import (
	"context"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/UNSAReport/tui/internal/auth"
)

// Run dispatches `unsarep slides <command> [flags]`.
func Run(args []string) {
	if len(args) == 0 {
		printUsage()
		os.Exit(2)
	}
	ctx := context.Background()
	client := NewClient()
	switch args[0] {
	case "init":
		runInit(args[1:])
	case "dev":
		runDev(args[1:])
	case "login":
		runLogin(ctx, args[1:])
	case "link":
		runLink(args[1:])
	case "deploy":
		runDeploy(ctx, client, args[1:])
	case "whoami":
		runWhoami(ctx, client, args[1:])
	case "help", "--help", "-h":
		printUsage()
	default:
		fmt.Fprintf(os.Stderr, "unknown slides command %q\n\n", args[0])
		printUsage()
		os.Exit(2)
	}
}

func printUsage() {
	fmt.Println(`unsarep slides — author, preview, and deploy slide decks

Usage:
  unsarep slides <command> [flags]

Commands:
  init <name>                          Scaffold a new slide deck
  dev [--port 4000]                    Serve a local live preview
  login [--no-browser] [--token <PAT>] Authenticate via the ecosystem IdP account
  link [--title --slug --org --visibility]  Link directory to a cloud presentation
  deploy                               Bundle and deploy to the slides service
  whoami                               Show user and slides service status`)
}

func runInit(args []string) {
	fs := flag.NewFlagSet("slides init", flag.ExitOnError)
	_ = fs.Parse(args)
	rest := fs.Args()
	if len(rest) == 0 {
		fmt.Fprintln(os.Stderr, "slides init: presentation name is required")
		os.Exit(2)
	}
	name := rest[0]
	target := filepath.Join(cwd(), name)
	if _, err := os.Stat(target); err == nil {
		fmt.Fprintf(os.Stderr, "slides init: %s already exists\n", target)
		os.Exit(1)
	}
	for _, f := range StarterTemplate(name) {
		full := filepath.Join(target, f.Path)
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			fmt.Fprintf(os.Stderr, "slides init: %v\n", err)
			os.Exit(1)
		}
		if err := os.WriteFile(full, []byte(f.Content), 0o644); err != nil {
			fmt.Fprintf(os.Stderr, "slides init: %v\n", err)
			os.Exit(1)
		}
	}
	fmt.Printf("Created presentation project at ./%s\n", name)
	fmt.Printf("Next: cd %s && unsarep slides dev  # preview | unsarep slides deploy  # publish\n", name)
}

func runDev(args []string) {
	fs := flag.NewFlagSet("slides dev", flag.ExitOnError)
	port := fs.Int("port", 4000, "Preview server port")
	_ = fs.Parse(args)
	dir := cwd()
	title := "UNSA Slides Preview"
	if cfg, err := LoadProjectConfig(dir); err == nil && cfg.Title != "" {
		title = cfg.Title
	} else if m, _, err := LoadManifest(dir); err == nil && m.Title != "" {
		title = m.Title
	}
	addr := fmt.Sprintf("127.0.0.1:%d", *port)
	fmt.Printf("Deck: %s\nLocal server: http://localhost:%d\nPress Ctrl+C to stop.\n", title, *port)
	if err := ServePreview(addr, dir, title); err != nil {
		fmt.Fprintf(os.Stderr, "slides dev: %v\n", err)
		os.Exit(1)
	}
}

func runLogin(ctx context.Context, args []string) {
	fs := flag.NewFlagSet("slides login", flag.ExitOnError)
	noBrowser := fs.Bool("no-browser", false, "Don't open browser, print URL only")
	tokenFlag := fs.String("token", "", "PAT token (unsareport_pat_...)")
	_ = fs.Parse(args)

	client := auth.NewClient()
	var (
		cred *auth.Credentials
		err  error
	)
	if *tokenFlag != "" {
		cred, err = client.LoginWithToken(ctx, *tokenFlag)
	} else {
		cred, err = client.Login(ctx, *noBrowser)
	}
	if err != nil {
		fmt.Fprintf(os.Stderr, "slides login failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Logged in as %s <%s>\n", cred.Name, cred.Email)
	if role, ok := cred.Roles["slides"]; ok {
		fmt.Printf("Slides role: %s\n", role)
	} else {
		fmt.Println("Note: no 'slides' role assigned yet — ask an admin to grant it via the IdP roles flow.")
	}
}

func runLink(args []string) {
	fs := flag.NewFlagSet("slides link", flag.ExitOnError)
	titleFlag := fs.String("title", "", "Presentation title")
	slugFlag := fs.String("slug", "", "URL-friendly identifier")
	orgFlag := fs.String("org", "", "Organization slug (empty for personal)")
	visFlag := fs.String("visibility", "", "private|org|unlisted|public")
	_ = fs.Parse(args)

	dir := cwd()
	current, _ := LoadProjectConfig(dir)
	if current == nil {
		current = &ProjectConfig{Slug: "my-slides", Title: "My Presentation"}
	}
	if *titleFlag != "" {
		current.Title = *titleFlag
	}
	if strings.TrimSpace(current.Title) == "" {
		fmt.Fprintln(os.Stderr, "slides link: title is required (--title)")
		os.Exit(2)
	}
	if *slugFlag != "" {
		current.Slug = *slugFlag
	}
	if !ValidateSlug(current.Slug) {
		fmt.Fprintln(os.Stderr, "slides link: slug must match [a-z0-9-]{2,100} (--slug)")
		os.Exit(2)
	}
	if *orgFlag != "" {
		current.OrgSlug = *orgFlag
	}
	if *visFlag != "" {
		switch *visFlag {
		case "private", "org", "unlisted", "public":
			current.Visibility = *visFlag
		default:
			fmt.Fprintln(os.Stderr, "slides link: visibility must be private|org|unlisted|public")
			os.Exit(2)
		}
	}
	if current.Visibility == "" {
		current.Visibility = "private"
	}
	if err := SaveProjectConfig(dir, current); err != nil {
		fmt.Fprintf(os.Stderr, "slides link: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Linked to slug %q (org: %s, visibility: %s) in %s\n",
		current.Slug, orDash(current.OrgSlug), current.Visibility, ProjectConfigFile)
}

func runDeploy(ctx context.Context, client *Client, args []string) {
	fs := flag.NewFlagSet("slides deploy", flag.ExitOnError)
	tokenFlag := fs.String("token", "", "PAT token override (default: stored credential)")
	_ = fs.Parse(args)

	dir := cwd()
	project, err := LoadProjectConfig(dir)
	if err != nil {
		fmt.Fprintln(os.Stderr, "slides deploy: no .slidesrc.json found. Run 'unsarep slides link' or 'unsarep slides init' first.")
		os.Exit(1)
	}
	_, rawManifest, err := LoadManifest(dir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "slides deploy: %v\n", err)
		os.Exit(1)
	}
	bundle, err := BundleFile(dir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "slides deploy: %v\n", err)
		os.Exit(1)
	}
	token := ResolveToken(*tokenFlag)
	if token == "" {
		fmt.Fprintln(os.Stderr, "slides deploy: not logged in. Run 'unsarep slides login' first.")
		os.Exit(1)
	}
	fmt.Println("Bundling presentation assets...")
	resp, err := client.Deploy(ctx, token, &DeployRequest{
		Slug:        project.Slug,
		Title:       project.Title,
		Description: project.Description,
		OrgSlug:     project.OrgSlug,
		Visibility:  valueOr(project.Visibility, "private"),
		Manifest:    rawManifest,
		Bundle:      bundle,
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "slides deploy: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Deployment complete! Version v%d\nViewer URL: %s\n", resp.Version, resp.URL)
}

func runWhoami(ctx context.Context, client *Client, args []string) {
	fs := flag.NewFlagSet("slides whoami", flag.ExitOnError)
	tokenFlag := fs.String("token", "", "PAT token override (default: stored credential)")
	_ = fs.Parse(args)

	authClient := auth.NewClient()
	cred, user, err := authClient.Status(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "slides whoami: %v\n", err)
		os.Exit(1)
	}
	if user != nil {
		fmt.Printf("Logged in as %s <%s>\n", user.Name, user.Email)
	} else if cred != nil {
		fmt.Printf("Logged in as %s <%s>\n", cred.Name, cred.Email)
	}
	if err := client.Reachable(ctx, ResolveToken(*tokenFlag)); err != nil {
		fmt.Fprintf(os.Stderr, "slides service: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Slides service: reachable (%s)\n", client.BaseURL)
}

func cwd() string {
	dir, err := os.Getwd()
	if err != nil {
		return "."
	}
	return dir
}

func orDash(s string) string {
	if s == "" {
		return "-"
	}
	return s
}

func valueOr(s, def string) string {
	if s == "" {
		return def
	}
	return s
}
