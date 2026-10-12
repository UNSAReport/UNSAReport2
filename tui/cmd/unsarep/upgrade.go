package main

import (
	"errors"
	"fmt"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/updater"
	"github.com/charmbracelet/huh"
	"github.com/spf13/cobra"
)

func newUpgradeCmd() *cobra.Command {
	var (
		checkOnly   bool
		channelFlag string
		yesFlag     bool
		forceFlag   bool
	)

	cmd := &cobra.Command{
		Use:     "upgrade",
		Aliases: []string{"self-update"},
		Short:   "Upgrade unsarep CLI to the latest version",
		Long: `Upgrade unsarep CLI binary in-place to the latest release.

Supports switching between 'stable' and 'dev' release channels:
  unsarep upgrade                  # Update on current channel
  unsarep upgrade --channel dev    # Track latest development build
  unsarep upgrade --channel stable # Track stable release
  unsarep upgrade --check          # Check for updates without installing`,
		SilenceErrors: true,
		SilenceUsage:  true,
		Args:          cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			if disabled, reason := updater.IsAutoUpdateDisabled(); disabled {
				return errors.New(reason)
			}

			channel := updater.ResolveChannel(channelFlag)
			endpoint := updater.ResolveEndpoint()

			manifest, err := updater.QueryManifest(cmd.Context(), endpoint)
			if err != nil {
				return fmt.Errorf("check updates from %s: %w", endpoint, err)
			}

			var target updater.ReleaseInfo
			if channel == config.ChannelDev {
				target = manifest.Dev
			} else {
				target = manifest.Stable
			}

			if target.Version == "" {
				return fmt.Errorf("no release found for channel %q", channel)
			}

			isNewer, err := updater.IsNewer(config.Version, config.GitCommit, channel, target)
			if err != nil {
				return fmt.Errorf("compare versions: %w", err)
			}

			if !isNewer && !forceFlag {
				fmt.Printf("unsarep is already up to date (%s) on channel %s.\n", config.Version, channel)
				return nil
			}

			if checkOnly {
				fmt.Printf("Update available for unsarep on channel %s:\n  Current: %s\n  Latest:  %s\n",
					channel, config.Version, target.Version)
				if target.Commit != "" && target.Commit != "unknown" {
					fmt.Printf("  Commit:  %s\n", target.Commit)
				}
				if target.ReleaseURL != "" {
					fmt.Printf("  Release: %s\n", target.ReleaseURL)
				}
				return nil
			}

			if canPrompt() && !yesFlag {
				var confirm bool
				promptText := fmt.Sprintf("Upgrade unsarep from %s to %s?", config.Version, target.Version)
				form := huh.NewForm(
					huh.NewGroup(
						huh.NewConfirm().
							Title(promptText).
							Value(&confirm),
					),
				)
				if err := runForm(form); err != nil {
					return err
				}
				if !confirm {
					fmt.Println("Upgrade cancelled.")
					return nil
				}
			}

			fmt.Printf("Updating unsarep to %s (%s)...\n", target.Version, channel)
			if err := updater.UpgradeBinary(cmd.Context(), target); err != nil {
				return fmt.Errorf("upgrade failed: %w", err)
			}

			_ = updater.SaveCache(&updater.CacheState{
				LastChecked:     0,
				Channel:         channel,
				UpdateAvailable: false,
				LatestVersion:   target.Version,
				LatestCommit:    target.Commit,
				ReleaseURL:      target.ReleaseURL,
			})

			printOK("Successfully updated unsarep to %s!", target.Version)
			return nil
		},
	}

	cmd.Flags().BoolVar(&checkOnly, "check", false, "Check if an update is available without installing")
	cmd.Flags().StringVar(&channelFlag, "channel", "", "Release channel to track (stable or dev)")
	cmd.Flags().BoolVarP(&yesFlag, "yes", "y", false, "Automatically accept confirmation prompt")
	cmd.Flags().BoolVar(&forceFlag, "force", false, "Force reinstall even if already up to date")

	return cmd
}
