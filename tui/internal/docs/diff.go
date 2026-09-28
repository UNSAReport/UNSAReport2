package docs

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/pmezard/go-difflib/difflib"
)

const (
	DiffContextLines = 3
	DiffColorHeader  = "220"
	DiffColorHunk    = "39"
	DiffColorAdd     = "42"
	DiffColorDel     = "197"
)

var (
	diffHeaderStyle = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color(DiffColorHeader))
	diffHunkStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color(DiffColorHunk))
	diffAddStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color(DiffColorAdd))
	diffDelStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color(DiffColorDel))
)

func generateDiff(oldLabel, newLabel string, oldContent, newContent []byte) (string, error) {
	diff := difflib.UnifiedDiff{
		A:        difflib.SplitLines(string(oldContent)),
		B:        difflib.SplitLines(string(newContent)),
		FromFile: oldLabel,
		ToFile:   newLabel,
		Context:  DiffContextLines,
	}
	text, err := difflib.GetUnifiedDiffString(diff)
	if err != nil {
		return "", fmt.Errorf("generate diff: %w", err)
	}
	return text, nil
}

func colorizeDiff(diffText string) string {
	lines := strings.Split(diffText, "\n")
	out := make([]string, 0, len(lines))
	for _, l := range lines {
		if strings.HasPrefix(l, "---") || strings.HasPrefix(l, "+++") {
			out = append(out, diffHeaderStyle.Render(l))
		} else if strings.HasPrefix(l, "@@") {
			out = append(out, diffHunkStyle.Render(l))
		} else if strings.HasPrefix(l, "+") {
			out = append(out, diffAddStyle.Render(l))
		} else if strings.HasPrefix(l, "-") {
			out = append(out, diffDelStyle.Render(l))
		} else {
			out = append(out, l)
		}
	}
	return strings.Join(out, "\n")
}
