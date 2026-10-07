package docs

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/pmezard/go-difflib/difflib"
	"github.com/sergi/go-diff/diffmatchpatch"
)

const (
	DiffContextLines = 3
	DiffColorHeader  = "220"
	DiffColorHunk    = "39"
	DiffColorAdd     = "42"
	DiffColorDel     = "197"
	DiffColorGutter   = "240"
)

var (
	diffHeaderStyle = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color(DiffColorHeader))
	diffHunkStyle   = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color(DiffColorHunk))
	diffAddStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color(DiffColorAdd))
	diffDelStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color(DiffColorDel))
	diffGutterStyle = lipgloss.NewStyle().Foreground(lipgloss.Color(DiffColorGutter))
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

func generateInlineDiff(oldContent, newContent string) string {
	dmp := diffmatchpatch.New()
	diffs := dmp.DiffMain(oldContent, newContent, false)
	diffs = dmp.DiffCleanupSemantic(diffs)
	return dmp.DiffPrettyText(diffs)
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
			prefix := diffAddStyle.Render("+ ")
			content := diffAddStyle.Render(strings.TrimPrefix(l, "+"))
			out = append(out, prefix+content)
		} else if strings.HasPrefix(l, "-") {
			prefix := diffDelStyle.Render("- ")
			content := diffDelStyle.Render(strings.TrimPrefix(l, "-"))
			out = append(out, prefix+content)
		} else if strings.HasPrefix(l, " ") {
			gutter := diffGutterStyle.Render("  ")
			out = append(out, gutter+strings.TrimPrefix(l, " "))
		} else {
			out = append(out, l)
		}
	}
	return strings.Join(out, "\n")
}
