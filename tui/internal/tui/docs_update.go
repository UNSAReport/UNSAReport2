package tui

import (
	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)


type DocsUpdateModel struct {
	list          list.Model
	viewport      viewport.Model
	width, height int
	styles        Styles
}

func NewDocsUpdateModel() DocsUpdateModel {
	l := list.New(nil, list.NewDefaultDelegate(), 30, 10)
	l.Title = "Update — Check"
	l.SetShowHelp(false)
	l.SetFilteringEnabled(false)
	vp := viewport.New(40, 10)
	vp.SetContent("Check is unavailable in this build.\nDiff/apply/rollback land with the update backend.\n\nPress tab to return to the sidebar.")
	return DocsUpdateModel{list: l, viewport: vp, styles: newStyles(defaultTheme())}
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
	case tea.KeyMsg:
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
