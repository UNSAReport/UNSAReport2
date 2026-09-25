package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/i18n"
	"github.com/charmbracelet/glamour"
	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/log"
	"github.com/spf13/cobra"
)

var noInput bool

func init() {
	log.SetOutput(os.Stderr)
	log.SetReportTimestamp(false)
	if lvl, err := log.ParseLevel(strings.ToLower(strings.TrimSpace(os.Getenv("UNSAREP_LOG")))); err == nil {
		log.SetLevel(lvl)
	} else {
		log.SetLevel(log.ErrorLevel)
	}
}

type usageError struct {
	cmd *cobra.Command
	err error
}

func (e *usageError) Error() string { return e.err.Error() }
func (e *usageError) Unwrap() error { return e.err }

func usagef(cmd *cobra.Command, format string, args ...any) error {
	return &usageError{cmd: cmd, err: fmt.Errorf(format, args...)}
}

func isTerm() bool {
	fi, err := os.Stdin.Stat()
	if err != nil {
		return false
	}
	return fi.Mode()&os.ModeCharDevice != 0
}

func canPrompt() bool { return isTerm() && !noInput }

func runForm(f *huh.Form) error {
	if err := f.Run(); err != nil {
		return fmt.Errorf("cancelled: %w", err)
	}
	return nil
}

var (
	styleOK = lipgloss.NewStyle().
		Foreground(lipgloss.AdaptiveColor{Light: "#40a02b", Dark: "#a6e3a1"}).
		Bold(true)
	styleMuted = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "#6c7086", Dark: "#9399b2"})
	styleErr = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "#d20f39", Dark: "#f38ba8"}).
			Bold(true)
)

func printOK(format string, args ...any) {
	fmt.Println(styleOK.Render(fmt.Sprintf(format, args...)))
}

func renderError(err error) {
	msg := err.Error()
	if looksMarkdown(msg) {
		if out, rerr := glamour.Render(msg, "auto"); rerr == nil {
			fmt.Fprintln(os.Stderr, out)
			return
		}
	}
	fmt.Fprintln(os.Stderr, styleErr.Render("Error: "+msg))
}

func looksMarkdown(s string) bool {
	if strings.HasPrefix(s, "#") {
		return true
	}
	return strings.Contains(s, "\n# ")
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

func exclusiveMode(cmd *cobra.Command, yes, all, none bool) error {
	n := 0
	for _, b := range []bool{yes, all, none} {
		if b {
			n++
		}
	}
	if n > 1 {
		return usagef(cmd, "only one of --yes, --all, --none may be given")
	}
	return nil
}

func resolvePosOrFlag(cmd *cobra.Command, what, pos, flagName, flagVal string) (string, error) {
	if pos == "" {
		return flagVal, nil
	}
	if cmd.Flags().Changed(flagName) && flagVal != pos {
		return "", usagef(cmd, "specify %s either as positional or --%s, not both", what, flagName)
	}
	return pos, nil
}

func newRootCmd() *cobra.Command {
	root := &cobra.Command{
		Use:     "unsarep",
		Version: config.Version,
		Short:   "UNSAReport project, package, auth, and slides CLI",
		Long: `unsarep — UNSAReport project, package, auth, and slides CLI.

Run any subcommand without its required args on a terminal to get a guided
form; pass flags for automation. Piped input (or --no-input) never prompts:
missing input fails with usage instead.

Auth:
  Credentials stored in OS keychain (0600 file at $XDG_CONFIG_HOME/unsareport/credentials.json when keychain unavailable).
  Env override: UNSAREP_TOKEN (transient, not persisted), UNSAREP_IDP_ISSUER, UNSAREP_REGISTRY_URL, UNSAREP_SLIDES_URL, UNSAREP_WEBSITE_URL.
  Browser flow: opens website /auth/login?tui_callback=http://127.0.0.1:<port>/callback&state=...
  Headless: prints URL and waits for callback; if no browser, paste PAT via --token.
  Log level: UNSAREP_LOG (debug|info|warn|error, default error).

Project-centric: detects unsareport.toml via walk-up and resolves the project root.`,
		SilenceErrors: true,
		SilenceUsage:  true,
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			i18n.Init()
		},
	}
	root.PersistentFlags().BoolVar(&noInput, "no-input", false, "Fail instead of prompting, even on a terminal")

	root.AddCommand(
		newAuthCmd(),
		newDocsCmd(),
		newRegistryCmd(),
		newSlidesCmd(),
		newVersionCmd(),
	)
	return root
}

func newVersionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Show version",
		Args:  cobra.NoArgs,
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("unsarep %s\n", config.Version)
		},
	}
}
