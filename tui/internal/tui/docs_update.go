package tui

import (
	"fmt"

	"github.com/UNSAReport/tui/internal/docs"
	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type docsCheckDoneMsg struct {
	err error
}

type DocsUpdateModel struct {
	list          list.Model
	viewport      viewport.Model
	project       *ProjectContext
	checked       bool
	width, height int
	styles        Styles
}

func NewDocsUpdateModel() DocsUpdateModel {
	l := list.New(nil, list.NewDefaultDelegate(), 30, 10)
	l.Title = "Update — Check"
	l.SetShowHelp(false)
	l.SetFilteringEnabled(false)
	vp := viewport.New(40, 10)
	vp.SetContent("Press enter to run check.")
	return DocsUpdateModel{list: l, viewport: vp, styles: newStyles(defaultTheme())}
}

func (m *DocsUpdateModel) SetProject(p *ProjectContext) { m.project = p }

func (m DocsUpdateModel) CheckCmd() tea.Cmd {
	return func() tea.Msg {
		if m.project == nil || !m.project.IsProject {
			return docsCheckDoneMsg{err: fmt.Errorf("not in a project (no unsareport.toml found)")}
		}
		return docsCheckDoneMsg{err: docs.Check(m.project.Root)}
	}
}

func (m DocsUpdateModel) Init() tea.Cmd { return nil }

func (m DocsUpdateModel) Update(msg tea.Msg) (DocsUpdateModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.list.SetSize(m.width/2, m.height-6)
		m.viewport.Width = m.width / 2
		m.viewport.Height = m.height - 6
		return m, nil
	case docsCheckDoneMsg:
		m.checked = true
		if msg.err != nil {
			m.viewport.SetContent("check failed:\n" + msg.err.Error())
		} else {
			m.viewport.SetContent("check passed: no findings.")
		}
		return m, nil
	case tea.KeyMsg:
		if msg.String() == "enter" {
			m.viewport.SetContent("Running check…")
			return m, m.CheckCmd()
		}
		var vcmd tea.Cmd
		m.viewport, vcmd = m.viewport.Update(msg)
		var lcmd tea.Cmd
		m.list, lcmd = m.list.Update(msg)
		return m, tea.Batch(vcmd, lcmd)
	}
	var cmd tea.Cmd
	m.list, cmd = m.list.Update(msg)
	return m, cmd
}
func (m DocsUpdateModel) View() string {
	help := lipgloss.NewStyle().Foreground(m.styles.Theme.Muted).Render("tab back to menu · 1-3 apps")
	return lipgloss.JoinHorizontal(lipgloss.Top,
		lipgloss.NewStyle().Width(m.width/2).Render(m.list.View()),
		lipgloss.JoinVertical(lipgloss.Left, m.viewport.View(), help),
	)
}

func (m *DocsUpdateModel) SetSize(w, h int) {
	m.width = w
	m.height = h
	m.list.SetSize(w/2, h-6)
	m.viewport.Width = w / 2
	m.viewport.Height = h - 6
}
