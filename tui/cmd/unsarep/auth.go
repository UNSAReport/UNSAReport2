package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/UNSAReport/tui/internal/auth"
	"github.com/charmbracelet/huh"
	"github.com/spf13/cobra"
)

func newLoginCmd() *cobra.Command {
	var noBrowser bool
	var token string
	cmd := &cobra.Command{
		Use:   "login",
		Short: "Log in via browser flow or PAT token",
		Long: `Authenticate via the website provider picker (loopback 127.0.0.1 callback).
Run without flags on a terminal for a guided form.`,
		Args: cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			return runLogin(cmd, noBrowser, cmd.Flags().Changed("no-browser"), token)
		},
	}
	cmd.Flags().BoolVarP(&noBrowser, "no-browser", "n", false, "Don't open browser, print URL only")
	cmd.Flags().StringVar(&token, "token", "", "PAT token (unsareport_pat_...)")
	return cmd
}

func runLogin(cmd *cobra.Command, noBrowser, noBrowserChanged bool, token string) error {
	cred, err := doLogin(cmd, noBrowser, noBrowserChanged, token)
	if err != nil {
		return err
	}
	printCred(cred)
	return nil
}

func doLogin(cmd *cobra.Command, noBrowser, noBrowserChanged bool, token string) (*auth.Credentials, error) {
	ctx := context.Background()
	client, err := auth.NewClient()
	if err != nil {
		return nil, err
	}
	if token != "" {
		return client.LoginWithToken(ctx, token)
	}
	if !noBrowserChanged && canPrompt() {
		var method string
		form := huh.NewForm(huh.NewGroup(
			huh.NewSelect[string]().
				Title("How do you want to log in?").
				Options(huh.NewOptions("Browser", "Paste PAT token")...).
				Value(&method),
		))
		if err := runForm(form); err != nil {
			return nil, err
		}
		if method == "Paste PAT token" {
			form := huh.NewForm(huh.NewGroup(
				huh.NewInput().
					Title("PAT token").
					Description("unsareport_pat_... (transient, stored in keychain)").
					EchoMode(huh.EchoModePassword).
					Value(&token).
					Validate(func(s string) error {
						if strings.TrimSpace(s) == "" {
							return fmt.Errorf("token is required")
						}
						return nil
					}),
				huh.NewConfirm().
					Title("Skip opening the browser?").
					Description("Only relevant for browser login; ignored for tokens").
					Value(&noBrowser),
			))
			if err := runForm(form); err != nil {
				return nil, err
			}
			return client.LoginWithToken(ctx, token)
		}
	}
	return client.Login(ctx, noBrowser)
}

func printCred(cred *auth.Credentials) {
	if cred.Email != "" {
		printOK("Logged in as %s <%s>", cred.Name, cred.Email)
		return
	}
	if cred.UserID != "" {
		printOK("Logged in as %s", cred.UserID)
		return
	}
	n := cred.PAT
	if len(n) > 10 {
		n = n[:10]
	}
	printOK("Token stored (%s...)", n)
}

func newLogoutCmd() *cobra.Command {
	var yes bool
	cmd := &cobra.Command{
		Use:   "logout",
		Short: "Clear stored credentials",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			if !yes && canPrompt() {
				var confirm bool
				form := huh.NewForm(huh.NewGroup(
					huh.NewConfirm().Title("Log out?").Value(&confirm),
				))
				if err := runForm(form); err != nil {
					return err
				}
				if !confirm {
					return fmt.Errorf("logout cancelled")
				}
			}
			client, err := auth.NewClient()
			if err != nil {
				return err
			}
			if err := client.Logout(); err != nil {
				return err
			}
			printOK("Logged out")
			return nil
		},
	}
	cmd.Flags().BoolVarP(&yes, "yes", "y", false, "Skip confirmation")
	return cmd
}

func newWhoamiCmd() *cobra.Command {
	var jsonOut bool
	cmd := &cobra.Command{
		Use:     "whoami",
		Aliases: []string{"status"},
		Short:   "Show authenticated user",
		Args:    cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			return runWhoami(jsonOut)
		},
	}
	cmd.Flags().BoolVar(&jsonOut, "json", false, "JSON output")
	return cmd
}

func newAuthCmd() *cobra.Command {
	authCmd := &cobra.Command{
		Use:   "auth",
		Short: "Log in, log out, and inspect credentials",
	}
	authCmd.AddCommand(newLoginCmd(), newLogoutCmd(), newWhoamiCmd())
	return authCmd
}

func runWhoami(jsonOut bool) error {
	ctx := context.Background()
	client, err := auth.NewClient()
	if err != nil {
		return err
	}
	cred, user, err := client.Status(ctx)
	if err != nil {
		if cred != nil && strings.Contains(err.Error(), "offline") {
			if jsonOut {
				b, _ := json.MarshalIndent(cred, "", "  ")
				fmt.Println(string(b))
				return nil
			}
			n := cred.PAT
			if len(n) > 10 {
				n = n[:10]
			}
			fmt.Printf("Logged in (offline) — token %s...\n", n)
			if cred.Email != "" {
				fmt.Printf("Email: %s\nName: %s\n", cred.Email, cred.Name)
			}
			return nil
		}
		return err
	}
	if jsonOut {
		out := map[string]any{"credentials": cred, "user": user}
		b, _ := json.MarshalIndent(out, "", "  ")
		fmt.Println(string(b))
		return nil
	}
	if user != nil {
		fmt.Printf("Logged in as %s <%s>\n", user.Name, user.Email)
		if len(user.Roles) > 0 {
			fmt.Printf("Roles: %v\n", user.Roles)
		}
	} else if cred != nil {
		fmt.Printf("Logged in as %s <%s>\n", cred.Name, cred.Email)
	}
	if cred != nil && cred.PAT != "" {
		n := cred.PAT
		if len(n) > 10 {
			n = n[:10]
		}
		fmt.Printf("PAT: %s...\n", n)
	}
	return nil
}
