package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/UNSAReport/tui/internal/slides"
	"github.com/spf13/cobra"
)

func newSlidesImportCmd() *cobra.Command {
	var outFlag string
	var themeName string
	var printOnly bool
	cmd := &cobra.Command{
		Use:   "import <deck.pptx>",
		Short: "Extract theme colors and fonts from a PowerPoint file",
		Long: `Extract the theme color scheme and fonts from a .pptx file and emit a slides-kit theme patch.

Reads ppt/theme/theme1.xml (12-slot clrScheme + major/minor latin fonts) and
slideMaster background fills using only the Go standard library
(archive/zip + encoding/xml), then writes a ready-to-paste
themes/<slug>.ts ThemeDefinition file.

Fidelity ceiling: colors and fonts ONLY. Layouts, text runs, shapes, images,
charts, and animations are NOT imported — rebuild slides with slides-kit
layouts after wiring the theme.`,
		Example: `  # Preview what would be extracted:
  unsarep slides import deck.pptx --print

  # Write the theme patch to a file:
  unsarep slides import deck.pptx --out themes/office-import.ts

  # Control the theme id/filename explicitly:
  unsarep slides import deck.pptx --theme office-import --out themes/office-import.ts`,
		Args: cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			pptxPath := args[0]
			if _, err := os.Stat(pptxPath); err != nil {
				return fmt.Errorf("slides import: cannot read %s: %w\n\nRun 'unsarep slides import --help' for usage.", pptxPath, err)
			}
			theme, err := slides.ParsePptxTheme(pptxPath)
			if err != nil {
				return fmt.Errorf("%w\n\nOnly .pptx files (Office Open XML) are supported — .ppt files cannot be imported.", err)
			}
			slug := themeName
			if slug == "" {
				base := strings.TrimSuffix(filepath.Base(pptxPath), filepath.Ext(pptxPath))
				slug = slides.Slugify(base)
				if slug == "" {
					slug = "imported-theme"
				}
			}
			if !slides.ValidateSlug(slug) {
				return fmt.Errorf("slides import: theme slug %q must match [a-z0-9-]{2,100} (use --theme to override)", slug)
			}
			patch := theme.ToThemePatch(slug)

			if printOnly || outFlag == "" {
				fmt.Printf("Theme colors from %s (12 clrScheme slots):\n", theme.Source)
				for _, slot := range slides.PptxColorSlots {
					if hex, ok := theme.Colors[slot]; ok {
						fmt.Printf("  %-8s %s\n", slot, hex)
					}
				}
				fmt.Printf("Fonts: major=%s minor=%s\n", orDash(theme.MajorFont), orDash(theme.MinorFont))
				if len(theme.MasterBackgrounds) > 0 {
					fmt.Printf("slideMaster background(s): %s\n", strings.Join(theme.MasterBackgrounds, ", "))
				}
				if printOnly {
					fmt.Println("\n--- themes/" + slug + ".ts ---")
					fmt.Println(patch)
					return nil
				}
			}
			if err := os.MkdirAll(filepath.Dir(outFlag), 0o755); err != nil {
				return fmt.Errorf("slides import: create output dir: %w", err)
			}
			if err := os.WriteFile(outFlag, []byte(patch), 0o644); err != nil {
				return fmt.Errorf("slides import: write %s: %w", outFlag, err)
			}
			fmt.Printf("Wrote theme patch to %s\n", outFlag)
			fmt.Printf("Wire it up: copy into packages/slides-kit/src/themes/%s.ts, register in themes/catalog.ts, then set theme: '%s' in deck.config.ts\n", slug, slug)
			return nil
		},
	}
	cmd.Flags().StringVar(&outFlag, "out", "", "Output path for the themes/<slug>.ts patch (default: print to stdout)")
	cmd.Flags().StringVar(&themeName, "theme", "", "Theme id slug for the patch (default: derived from file name)")
	cmd.Flags().BoolVar(&printOnly, "print", false, "Print the patch to stdout instead of writing a file")
	return cmd
}
