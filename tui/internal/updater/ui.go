package updater

import (
	"fmt"
	"os"

	"github.com/charmbracelet/lipgloss"
)

var (
	styleBox = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.AdaptiveColor{Light: "#1e66f5", Dark: "#89b4fa"}).
			Padding(0, 1).
			MarginTop(0).
			MarginBottom(1)

	styleTitle = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "#1e66f5", Dark: "#89b4fa"}).
			Bold(true)

	styleVersion = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "#df8e1d", Dark: "#f9e2af"}).
			Bold(true)

	styleCommand = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "#40a02b", Dark: "#a6e3a1"}).
			Bold(true)

	styleDim = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "#6c7086", Dark: "#9399b2"})

	styleWarn = lipgloss.NewStyle().
			Foreground(lipgloss.AdaptiveColor{Light: "#df8e1d", Dark: "#f9e2af"}).
			Bold(true)
)

func RenderUpdateNotice(currentVersion, latestVersion, channel, releaseURL string) string {
	var header string
	if channel == "dev" {
		header = styleTitle.Render("Dev update available")
	} else {
		header = styleTitle.Render("Update available")
	}

	versionDiff := fmt.Sprintf("%s -> %s", styleDim.Render(currentVersion), styleVersion.Render(latestVersion))
	cmdHint := fmt.Sprintf("Run %s to update", styleCommand.Render("unsarep upgrade"))

	content := fmt.Sprintf("%s: %s\n%s", header, versionDiff, cmdHint)
	if releaseURL != "" {
		content += "\n" + styleDim.Render(releaseURL)
	}

	return styleBox.Render(content)
}

func PrintWarning(format string, args ...any) {
	msg := fmt.Sprintf(format, args...)
	fmt.Fprintf(os.Stderr, "%s %s\n", styleWarn.Render("[warn]"), msg)
}
