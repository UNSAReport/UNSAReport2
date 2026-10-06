package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
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
		Long: `Author, preview, and deploy UNSA slide decks.

End-to-end: slides init <name> | slides dev | slides link | slides deploy.
Publish a deck then open /presentations/<slug>?present=1 in the web app;
append ?print-pdf (via the viewer PDF button) for the PDF export.`,
		Example: `  unsarep slides init mi-charla --install
  unsarep slides dev --port 4000
  unsarep slides layouts --category bento
  unsarep slides import deck.pptx --print
  unsarep slides link --title "Mi charla" --visibility public
  unsarep slides deploy --yes`,
	}
	cmd.AddCommand(
		newSlidesInitCmd(),
		newSlidesDevCmd(),
		newSlidesLayoutsCmd(),
		newSlidesThemesCmd(),
		newSlidesImportCmd(),
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
	var installFlag bool
	cmd := &cobra.Command{
		Use:   "init [name]",
		Short: "Scaffold a new slide deck",
		Long: `Scaffold a new slides-kit deck (deck.config.ts, src/slides.tsx, manifest.json, .slidesrc.json).

Pick a starting theme with the 'theme' key in deck.config.ts (unsa-dark,
unsa-classic, epis-tech, fips-light, epis-night); there is no --theme flag.`,
		Example: `  unsarep slides init mi-charla
  unsarep slides init mi-charla --install
  unsarep slides init --name mi-charla`,
		Args: cobra.MaximumNArgs(1),
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
			files, err := slides.StarterTemplate(name)
			if err != nil {
				return fmt.Errorf("slides init: %w", err)
			}
			for _, f := range files {
				full := filepath.Join(target, f.Path)
				if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
					return fmt.Errorf("slides init: %w", err)
				}
				var bytes []byte
				if len(f.Data) > 0 {
					bytes = f.Data
				} else {
					bytes = []byte(f.Content)
				}
				if err := os.WriteFile(full, bytes, 0o644); err != nil {
					return fmt.Errorf("slides init: %w", err)
				}
			}
			fmt.Printf("Created presentation project at ./%s\n", name)

			var installDeps bool
			if installFlag {
				installDeps = true
			} else if canPrompt() {
				confirm := false
				form := huh.NewForm(huh.NewGroup(
					huh.NewConfirm().
						Title("¿Instalar dependencias ahora?").
						Description("Ejecutará el gestor de paquetes detectado (bun / npm) en el nuevo proyecto").
						Value(&confirm),
				))
				if err := runForm(form); err == nil && confirm {
					installDeps = true
				}
			}

			if installDeps {
				pm := "bun"
				if _, err := exec.LookPath("bun"); err != nil {
					if _, err := exec.LookPath("npm"); err == nil {
						pm = "npm"
					} else if _, err := exec.LookPath("pnpm"); err == nil {
						pm = "pnpm"
					} else {
						pm = ""
					}
				}

				if pm != "" {
					fmt.Printf("Instalando dependencias con %s...\n", pm)
					installCmd := exec.Command(pm, "install")
					installCmd.Dir = target
					installCmd.Stdout = os.Stdout
					installCmd.Stderr = os.Stderr
					if err := installCmd.Run(); err != nil {
						fmt.Printf("Aviso: No se pudieron instalar las dependencias automáticamente: %v\n", err)
						fmt.Printf("Puedes instalarlas manualmente ejecutando: cd %s && %s install\n", name, pm)
					} else {
						fmt.Println("Dependencias instaladas con éxito.")
					}
				} else {
					fmt.Println("Aviso: No se detectó bun, npm o pnpm en el PATH. Instala las dependencias manualmente.")
				}
			}

			fmt.Printf("Next: cd %s && unsarep slides dev  # preview | unsarep slides deploy  # publish\n", name)
			return nil
		},
	}
	cmd.Flags().StringVar(&nameFlag, "name", "", "Presentation name, same as positional")
	cmd.Flags().BoolVar(&installFlag, "install", false, "Install dependencies automatically after scaffolding")
	return cmd
}

func newSlidesDevCmd() *cobra.Command {
	var port int
	cmd := &cobra.Command{
		Use:   "dev",
		Short: "Serve a local live preview",
		Long: `Serve a local live preview of the deck in the current directory.

Uses package.json + Vite when present, otherwise a built-in static server.
Default port is 4000 (override with --port).`,
		Example: `  unsarep slides dev
  unsarep slides dev --port 4000`,
		Args: cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			dir := slidesCwd()
			title := "UNSA Slides Preview"
			if cfg, err := slides.LoadProjectConfig(dir); err == nil && cfg.Title != "" {
				title = cfg.Title
			} else if m, _, err := slides.LoadManifest(dir); err == nil && m.Title != "" {
				title = m.Title
			}
			fmt.Printf("Deck: %s\nLocal dev server on port %d\nPress Ctrl+C to stop.\n", title, port)
			return slides.StartDev(dir, port)
		},
	}
	cmd.Flags().IntVar(&port, "port", 4000, "Preview server port")
	return cmd
}

func newSlidesLayoutsCmd() *cobra.Command {
	var category string
	var search string
	cmd := &cobra.Command{
		Use:   "layouts",
		Short: "Explore and search official slide layouts",
		Long: `List the 120 official slides-kit layouts in 9 families
(hero, split, bento, stats, process, code, list, quote, closing).
Mirrors packages/slides-kit/src/layouts/catalog.ts (kit is the source of truth).`,
		Example: `  unsarep slides layouts
  unsarep slides layouts --category bento
  unsarep slides layouts --search kpi`,
		Args: cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			layouts := slides.ListLayouts(category, search)
			if len(layouts) == 0 {
				fmt.Println("No se encontraron layouts con los criterios indicados.")
				return nil
			}

			if category != "" {
				fmt.Printf("\n  %s (%d layouts disponibles)\n", strings.ToUpper(category), len(layouts))
				for _, l := range layouts {
					fmt.Printf("    %-24s %s\n", l.ID, l.Description)
				}
				fmt.Println("\n  Usa --search <término> para buscar por descripción.")
				return nil
			}

			fmt.Printf("\n  LAYOUTS DISPONIBLES EN @unsa/slides-kit (%d en total):\n\n", len(layouts))
			byCategory := make(map[string][]slides.LayoutInfo)
			for _, l := range layouts {
				byCategory[l.Category] = append(byCategory[l.Category], l)
			}
			for _, cat := range slides.ListCategories() {
				items := byCategory[cat]
				if len(items) == 0 {
					continue
				}
				fmt.Printf("  [%s] (%d layouts)\n", strings.ToUpper(cat), len(items))
				for _, l := range items {
					fmt.Printf("    %-24s %s\n", l.ID, l.Description)
				}
				fmt.Println()
			}
			fmt.Println("  Usa --category <nombre> o --search <término> para filtrar.")
			return nil
		},
	}
	cmd.Flags().StringVarP(&category, "category", "c", "", "Filtrar por categoría (hero, split, bento, stats, process, code, list, quote, closing)")
	cmd.Flags().StringVarP(&search, "search", "s", "", "Buscar por nombre o descripción")
	return cmd
}

func newSlidesThemesCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "themes",
		Short: "List official themes for UNSA slides",
		Long: `List the 8 official slides-kit themes
	(unsa-dark, unsa-classic, epis-tech, fips-light, epis-night, cloudlet-pitch, azul-proposal, harper-minimal).
Mirrors packages/slides-kit/src/themes/catalog.ts (kit is the source of truth).`,
		Example: `  unsarep slides themes`,
		Args:    cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			themes := slides.ListThemes()
			fmt.Println("\n  TEMAS DISPONIBLES EN @unsa/slides-kit:")
			for _, t := range themes {
				prefix := "   "
				if t.Default {
					prefix = " * "
				}
				fmt.Printf(" %s%-14s %s\n", prefix, t.ID, t.Description)
			}
			fmt.Println()
			return nil
		},
	}
	return cmd
}

func newSlidesLoginCmd() *cobra.Command {
	var noBrowser bool
	var token string
	cmd := &cobra.Command{
		Use:   "login",
		Short: "Authenticate via the ecosystem IdP account",
		Long: `Authenticate against the ecosystem IdP and store the credential for slides commands.

Deploy requires a stored credential (or --token / UNSAREP_TOKEN) AND the
'slides' role on your account — without the role the API rejects the deploy.`,
		Example: `  unsarep slides login
  unsarep slides login --no-browser
  unsarep slides login --token unsareport_pat_...`,
		Args: cobra.NoArgs,
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
		Long: `Write .slidesrc.json linking this directory to a cloud presentation
(slug, title, org, visibility). deck.config.ts values win; .slidesrc.json
fills gaps (config-overlay precedence). Run before 'slides deploy'.`,
		Example: `  unsarep slides link --title "Mi charla" --slug mi-charla
  unsarep slides link --title "Mi charla" --org mi-facultad --visibility org
  unsarep slides link --title "Mi charla" --visibility public`,
		Args: cobra.NoArgs,
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
		Long: `Build the deck, zip dist/, and POST it to the slides service.

Requires: linked project ('slides link'), a stored credential or --token /
UNSAREP_TOKEN ('slides login'), and the 'slides' role. Bundle limit is
50 MiB (server rejects larger archives). Service URL comes from
UNSAREP_SLIDES_URL (default https://unsareport.ynoacamino.tech/api/slides,
local dev http://localhost:9876/api/slides).`,
		Example: `  unsarep slides deploy
  unsarep slides deploy --yes
  unsarep slides deploy --token unsareport_pat_...`,
		Args: cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			client, err := slides.NewClient()
			if err != nil {
				return fmt.Errorf("slides deploy: %w\n\nCheck UNSAREP_SLIDES_URL (local dev: http://localhost:9876/api/slides)", err)
			}
			dir := slidesCwd()
			project, err := slides.LoadProjectConfig(dir)
			if err != nil {
				return fmt.Errorf("slides deploy: no deck.config.ts or .slidesrc.json found — run 'unsarep slides link' or 'unsarep slides init' first")
			}
			_, rawManifest, err := slides.LoadManifest(dir)
			if err != nil {
				return fmt.Errorf("slides deploy: %w", err)
			}
			token := slides.ResolveToken(tokenFlag)
			if token == "" {
				return fmt.Errorf("slides deploy: not logged in — run 'unsarep slides login' first (or pass --token / set UNSAREP_TOKEN)")
			}
			if !yes && canPrompt() {
				var action string
				vis := valueOr(project.Visibility, "private")
				org := "(personal)"
				if project.OrgSlug != "" {
					org = project.OrgSlug
				}
				form := huh.NewForm(huh.NewGroup(
					huh.NewNote().
						Title("Presentation Deployment Summary").
						Description(fmt.Sprintf("Title: %s\nSlug: %s\nVisibility: %s\nTarget: %s\nFiles: %d manifest items",
							project.Title, project.Slug, vis, org, len(rawManifest))),
					huh.NewSelect[string]().
						Title("Deploy Action").
						Options(
							huh.NewOption(fmt.Sprintf("Deploy with current settings (%s)", vis), vis),
							huh.NewOption("Change visibility to private and deploy", "private"),
							huh.NewOption("Change visibility to org and deploy", "org"),
							huh.NewOption("Change visibility to unlisted and deploy", "unlisted"),
							huh.NewOption("Change visibility to public and deploy", "public"),
							huh.NewOption("Cancel deployment", "cancel"),
						).
						Value(&action),
				))
				if err := runForm(form); err != nil || action == "cancel" {
					return fmt.Errorf("deploy cancelled")
				}
				project.Visibility = action
			}
			fmt.Println("Building and bundling presentation assets...")
			zipBytes, _, err := slides.BuildAndZip(dir)
			if err != nil {
				return fmt.Errorf("slides deploy: %w", err)
			}
			bundle, _ := slides.BundleFile(dir)
			if bundle == "" && len(zipBytes) > 0 {
				bundle = base64.StdEncoding.EncodeToString(zipBytes)
			}
			resp, err := client.Deploy(ctx, token, &slides.DeployRequest{
				Slug:        project.Slug,
				Title:       project.Title,
				Description: project.Description,
				OrgSlug:     project.OrgSlug,
				Visibility:  valueOr(project.Visibility, "private"),
				Manifest:    rawManifest,
				Bundle:      bundle,
				ZipBytes:    zipBytes,
			})
			if err != nil {
				return fmt.Errorf("slides deploy: %w\n\nIf unauthorized: run 'unsarep slides login' and ask an admin for the 'slides' role. If unreachable: check UNSAREP_SLIDES_URL", err)
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
		Long: `Show the logged-in user and whether the slides service is reachable.

--token overrides the stored credential; --json prints machine-readable output.`,
		Example: `  unsarep slides whoami
  unsarep slides whoami --json
  unsarep slides whoami --token unsareport_pat_...`,
		Args: cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			client, err := slides.NewClient()
			if err != nil {
				return fmt.Errorf("slides whoami: %w\n\nCheck UNSAREP_SLIDES_URL (local dev: http://localhost:9876/api/slides)", err)
			}
			authClient, err := auth.NewClient()
			if err != nil {
				return err
			}
			cred, user, err := authClient.Status(ctx)
			if err != nil {
				return fmt.Errorf("slides whoami: %w\n\nRun 'unsarep slides login' first (or pass --token / set UNSAREP_TOKEN)", err)
			}
			if rerr := client.Reachable(ctx, slides.ResolveToken(tokenFlag)); rerr != nil {
				if !jsonOut {
					printWhoami(cred, user)
				}
				return fmt.Errorf("slides service: %w\n\nCheck UNSAREP_SLIDES_URL (local dev: http://localhost:9876/api/slides)", rerr)
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
