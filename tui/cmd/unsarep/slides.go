package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/UNSAReport/tui/internal/auth"
	"github.com/UNSAReport/tui/internal/slides"
	"github.com/charmbracelet/huh"
	"github.com/spf13/cobra"
)

func newSlidesCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "slides",
		Short: "Author, preview, and deploy slide decks",
	}
	cmd.AddCommand(
		newSlidesInitCmd(),
		newSlidesDevCmd(),
		newSlidesLoginCmd(),
		newSlidesLinkCmd(),
		newSlidesDeployCmd(),
		newSlidesWhoamiCmd(),
	)
	return cmd
}

func slidesCwd() string {
	dir, err := os.Getwd()
	if err != nil {
		return "."
	}
	return dir
}

func newSlidesInitCmd() *cobra.Command {
	var nameFlag string
	cmd := &cobra.Command{
		Use:   "init [name]",
		Short: "Scaffold a new slide deck",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			pos := ""
			if len(args) > 0 {
				pos = args[0]
			}
			name, err := resolvePosOrFlag(cmd, "name", pos, "name", nameFlag)
			if err != nil {
				return err
			}
			if name == "" {
				if !canPrompt() {
					return usagef(cmd, "slides init: presentation name is required")
				}
				form := huh.NewForm(huh.NewGroup(
					huh.NewInput().
						Title("Presentation name").
						Value(&name).
						Validate(func(s string) error {
							if strings.TrimSpace(s) == "" {
								return fmt.Errorf("presentation name is required")
							}
							return nil
						}),
				))
				if err := runForm(form); err != nil {
					return err
				}
			}
			target := filepath.Join(slidesCwd(), name)
			if _, err := os.Stat(target); err == nil {
				return fmt.Errorf("slides init: %s already exists", target)
			}
			for _, f := range slides.StarterTemplate(name) {
				full := filepath.Join(target, f.Path)
				if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
					return fmt.Errorf("slides init: %w", err)
				}
				if err := os.WriteFile(full, []byte(f.Content), 0o644); err != nil {
					return fmt.Errorf("slides init: %w", err)
				}
			}
			fmt.Printf("Created presentation project at ./%s\n", name)
			fmt.Printf("Next: cd %s && unsarep slides dev  # preview | unsarep slides deploy  # publish\n", name)
			return nil
		},
	}
	cmd.Flags().StringVar(&nameFlag, "name", "", "Presentation name, same as positional")
	return cmd
}

func newSlidesDevCmd() *cobra.Command {
	var port int
	cmd := &cobra.Command{
		Use:   "dev",
		Short: "Serve a local live preview",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			dir := slidesCwd()
			title := "UNSA Slides Preview"
			if cfg, err := slides.LoadProjectConfig(dir); err == nil && cfg.Title != "" {
				title = cfg.Title
			} else if m, _, err := slides.LoadManifest(dir); err == nil && m.Title != "" {
				title = m.Title
			}
			addr := fmt.Sprintf("127.0.0.1:%d", port)
			fmt.Printf("Deck: %s\nLocal server: http://localhost:%d\nPress Ctrl+C to stop.\n", title, port)
			return slides.ServePreview(addr, dir, title)
		},
	}
	cmd.Flags().IntVar(&port, "port", 4000, "Preview server port")
	return cmd
}

func newSlidesLoginCmd() *cobra.Command {
	var noBrowser bool
	var token string
	cmd := &cobra.Command{
		Use:   "login",
		Short: "Authenticate via the ecosystem IdP account",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			cred, err := doLogin(cmd, noBrowser, cmd.Flags().Changed("no-browser"), token)
			if err != nil {
				return err
			}
			printCred(cred)
			if role, ok := cred.Roles["slides"]; ok {
				fmt.Printf("Slides role: %s\n", role)
			} else {
				fmt.Println("Note: no 'slides' role assigned yet — ask an admin to grant it via the IdP roles flow.")
			}
			return nil
		},
	}
	cmd.Flags().BoolVar(&noBrowser, "no-browser", false, "Don't open browser, print URL only")
	cmd.Flags().StringVar(&token, "token", "", "PAT token (unsareport_pat_...)")
	return cmd
}

func seedLinkConfig(dir string) *slides.ProjectConfig {
	if current, err := slides.LoadProjectConfig(dir); err == nil && current != nil {
		return current
	}
	return &slides.ProjectConfig{Slug: "my-slides", Title: "My Presentation"}
}

func validateLinkConfig(cmd *cobra.Command, current *slides.ProjectConfig) error {
	if strings.TrimSpace(current.Title) == "" {
		return usagef(cmd, "slides link: title is required (--title)")
	}
	if !slides.ValidateSlug(current.Slug) {
		return usagef(cmd, "slides link: slug must match [a-z0-9-]{2,100} (--slug)")
	}
	switch current.Visibility {
	case "", "private", "org", "unlisted", "public":
	default:
		return usagef(cmd, "slides link: visibility must be private|org|unlisted|public")
	}
	if current.Visibility == "" {
		current.Visibility = "private"
	}
	return nil
}

func newSlidesLinkCmd() *cobra.Command {
	var titleFlag, slugFlag, orgFlag, visFlag string
	cmd := &cobra.Command{
		Use:   "link",
		Short: "Link directory to a cloud presentation",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			dir := slidesCwd()
			current := seedLinkConfig(dir)
			changed := cmd.Flags().Changed("title") || cmd.Flags().Changed("slug") ||
				cmd.Flags().Changed("org") || cmd.Flags().Changed("visibility")
			if titleFlag != "" {
				current.Title = titleFlag
			}
			if slugFlag != "" {
				current.Slug = slugFlag
			}
			if orgFlag != "" {
				current.OrgSlug = orgFlag
			}
			if visFlag != "" {
				current.Visibility = visFlag
			}
			if !changed {
				if !canPrompt() {
					if err := validateLinkConfig(cmd, current); err != nil {
						return err
					}
					if err := slides.SaveProjectConfig(dir, current); err != nil {
						return fmt.Errorf("slides link: %w", err)
					}
					fmt.Printf("Linked to slug %q (org: %s, visibility: %s) in %s\n",
						current.Slug, orDash(current.OrgSlug), current.Visibility, slides.ProjectConfigFile)
					return nil
				}
				form := huh.NewForm(huh.NewGroup(
					huh.NewInput().
						Title("Presentation title").
						Value(&current.Title).
						Validate(func(s string) error {
							if strings.TrimSpace(s) == "" {
								return fmt.Errorf("title is required")
							}
							return nil
						}),
					huh.NewInput().
						Title("Slug").
						Description("URL-friendly identifier [a-z0-9-]{2,100}; empty derives from title").
						Value(&current.Slug).
						Validate(func(s string) error {
							v := strings.TrimSpace(s)
							if v == "" {
								return nil
							}
							if !slides.ValidateSlug(v) {
								return fmt.Errorf("slug must match [a-z0-9-]{2,100}")
							}
							return nil
						}),
					huh.NewInput().
						Title("Organization slug").
						Description("Empty for personal").
						Value(&current.OrgSlug),
					huh.NewSelect[string]().
						Title("Visibility").
						Options(
							huh.NewOption("private", "private"),
							huh.NewOption("org", "org"),
							huh.NewOption("unlisted", "unlisted"),
							huh.NewOption("public", "public"),
						).
						Value(&current.Visibility),
				))
				if err := runForm(form); err != nil {
					return err
				}
				if strings.TrimSpace(current.Slug) == "" {
					current.Slug = slides.Slugify(current.Title)
				}
			}
			if err := validateLinkConfig(cmd, current); err != nil {
				return err
			}
			if err := slides.SaveProjectConfig(dir, current); err != nil {
				return fmt.Errorf("slides link: %w", err)
			}
			fmt.Printf("Linked to slug %q (org: %s, visibility: %s) in %s\n",
				current.Slug, orDash(current.OrgSlug), current.Visibility, slides.ProjectConfigFile)
			return nil
		},
	}
	cmd.Flags().StringVar(&titleFlag, "title", "", "Presentation title")
	cmd.Flags().StringVar(&slugFlag, "slug", "", "URL-friendly identifier")
	cmd.Flags().StringVar(&orgFlag, "org", "", "Organization slug (empty for personal)")
	cmd.Flags().StringVar(&visFlag, "visibility", "", "private|org|unlisted|public")
	return cmd
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

func newSlidesDeployCmd() *cobra.Command {
	var tokenFlag string
	var yes bool
	cmd := &cobra.Command{
		Use:   "deploy",
		Short: "Bundle and deploy to the slides service",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			client, err := slides.NewClient()
			if err != nil {
				return err
			}
			dir := slidesCwd()
			project, err := slides.LoadProjectConfig(dir)
			if err != nil {
				return fmt.Errorf("slides deploy: no .slidesrc.json found — run 'unsarep slides link' or 'unsarep slides init' first")
			}
			_, rawManifest, err := slides.LoadManifest(dir)
			if err != nil {
				return fmt.Errorf("slides deploy: %w", err)
			}
			bundle, err := slides.BundleFile(dir)
			if err != nil {
				return fmt.Errorf("slides deploy: %w", err)
			}
			token := slides.ResolveToken(tokenFlag)
			if token == "" {
				return fmt.Errorf("slides deploy: not logged in — run 'unsarep slides login' first")
			}
			if !yes && canPrompt() {
				var confirm bool
				form := huh.NewForm(huh.NewGroup(
					huh.NewConfirm().
						Title(fmt.Sprintf("Deploy %q (%s, %s)?", project.Title, project.Slug, valueOr(project.Visibility, "private"))).
						Value(&confirm),
				))
				if err := runForm(form); err != nil {
					return err
				}
				if !confirm {
					return fmt.Errorf("deploy cancelled")
				}
			}
			fmt.Println("Bundling presentation assets...")
			resp, err := client.Deploy(ctx, token, &slides.DeployRequest{
				Slug:        project.Slug,
				Title:       project.Title,
				Description: project.Description,
				OrgSlug:     project.OrgSlug,
				Visibility:  valueOr(project.Visibility, "private"),
				Manifest:    rawManifest,
				Bundle:      bundle,
			})
			if err != nil {
				return fmt.Errorf("slides deploy: %w", err)
			}
			fmt.Printf("Deployment complete! Version v%d\nViewer URL: %s\n", resp.Version, resp.URL)
			return nil
		},
	}
	cmd.Flags().StringVar(&tokenFlag, "token", "", "PAT token override (default: stored credential)")
	cmd.Flags().BoolVarP(&yes, "yes", "y", false, "Skip deploy confirmation")
	return cmd
}

func newSlidesWhoamiCmd() *cobra.Command {
	var tokenFlag string
	var jsonOut bool
	cmd := &cobra.Command{
		Use:   "whoami",
		Short: "Show user and slides service status",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			client, err := slides.NewClient()
			if err != nil {
				return err
			}
			authClient, err := auth.NewClient()
			if err != nil {
				return err
			}
			cred, user, err := authClient.Status(ctx)
			if err != nil {
				return fmt.Errorf("slides whoami: %w", err)
			}
			if rerr := client.Reachable(ctx, slides.ResolveToken(tokenFlag)); rerr != nil {
				if !jsonOut {
					printWhoami(cred, user)
				}
				return fmt.Errorf("slides service: %w", rerr)
			}
			if jsonOut {
				out := map[string]any{
					"credentials": cred,
					"user":        user,
					"slides":      map[string]any{"baseURL": client.BaseURL, "reachable": true},
				}
				b, _ := json.MarshalIndent(out, "", "  ")
				fmt.Println(string(b))
				return nil
			}
			printWhoami(cred, user)
			fmt.Printf("Slides service: reachable (%s)\n", client.BaseURL)
			return nil
		},
	}
	cmd.Flags().StringVar(&tokenFlag, "token", "", "PAT token override (default: stored credential)")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "JSON output")
	return cmd
}

func printWhoami(cred *auth.Credentials, user *auth.UserInfo) {
	if user != nil {
		fmt.Printf("Logged in as %s <%s>\n", user.Name, user.Email)
	} else if cred != nil {
		fmt.Printf("Logged in as %s <%s>\n", cred.Name, cred.Email)
	}
}
