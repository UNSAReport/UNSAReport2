package tui

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/UNSAReport/tui/internal/i18n"
	"github.com/UNSAReport/tui/internal/registry"
	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type registryItem struct {
	title, desc string
	info        registry.PackageInfo
}

func (i registryItem) Title() string       { return i.title }
func (i registryItem) Description() string { return i.desc }
func (i registryItem) FilterValue() string { return i.title + " " + i.desc }

type registryFetchedMsg struct {
	templates []registry.PackageInfo
	err       error
}

type registryMode int

const (
	registryBrowse registryMode = iota
	registrySearch
	registryDetails
)

type RegistryModel struct {
	mode          registryMode
	client        *registry.Client
	spinner       spinner.Model
	list          list.Model
	textInput     textinput.Model
	details       viewport.Model
	templates     []registry.PackageInfo
	filtered      []registry.PackageInfo
	selected      *registry.PackageInfo
	loading       bool
	err           string
	width, height int
	focusSearch   bool
	styles        Styles
}

func NewRegistryModel() RegistryModel {
	s := spinner.New()
	s.Spinner = spinner.Dot
	ti := textinput.New()
	ti.Placeholder = "Search templates..."
	ti.CharLimit = 50
	delegate := list.NewDefaultDelegate()
	l := list.New(nil, delegate, 40, 15)
	l.Title = i18n.T("category.templates") + " — " + i18n.T("function.browse")
	l.SetShowHelp(false)
	l.SetFilteringEnabled(false)
	vp := viewport.New(36, 10)
	return RegistryModel{
		client:    registry.NewClient(),
		spinner:   s,
		list:      l,
		textInput: ti,
		details:   vp,
		loading:   true,
		mode:      registryBrowse,
		styles:    newStyles(defaultTheme()),
	}
}

func (m RegistryModel) Init() tea.Cmd {
	return tea.Batch(m.spinner.Tick, m.fetchCmd())
}

func (m RegistryModel) fetchCmd() tea.Cmd {
	return func() tea.Msg {
		ctx := context.Background()
		templates, err := m.client.ListPackages(ctx)
		return registryFetchedMsg{templates: templates, err: err}
	}
}

// InputCaptured reports whether the search input owns the keyboard.
func (m RegistryModel) InputCaptured() bool {
	return m.mode == registrySearch && m.focusSearch
}

// EnterSearch moves the model into search mode and focuses the input.
func (m *RegistryModel) EnterSearch() {
	m.mode = registrySearch
	m.focusSearch = true
	m.textInput.Focus()
}

// ExitToBrowse leaves search or details and returns to the browse list.
func (m *RegistryModel) ExitToBrowse() {
	m.mode = registryBrowse
	m.focusSearch = false
	m.selected = nil
	m.textInput.Blur()
}

func (m RegistryModel) Update(msg tea.Msg) (RegistryModel, tea.Cmd) {
	var cmds []tea.Cmd
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.SetSize(m.width, m.height)
	case registryFetchedMsg:
		m.loading = false
		if msg.err != nil {
			m.err = msg.err.Error()
			return m, nil
		}
		m.err = ""
		m.templates = msg.templates
		m.filtered = msg.templates
		m.setItems(msg.templates)
		if m.mode == registryDetails && m.selected != nil {
			m.refreshDetails()
		}
		return m, nil
	case tea.KeyMsg:
		if m.mode == registrySearch {
			switch msg.String() {
			case "esc":
				m.textInput.SetValue("")
				m.filtered = m.templates
				m.setItems(m.templates)
				m.ExitToBrowse()
				return m, nil
			case "enter":
				m.ExitToBrowse()
				return m, nil
			}
		}
		switch msg.String() {
		case "r":
			if m.err != "" || len(m.templates) == 0 {
				m.loading = true
				m.err = ""
				return m, tea.Batch(m.spinner.Tick, m.fetchCmd())
			}
		case "/":
			if m.mode == registryBrowse {
				m.EnterSearch()
				return m, textinput.Blink
			}
		case "enter":
			if m.mode == registryBrowse && !m.loading && m.err == "" {
				if it, ok := m.list.SelectedItem().(registryItem); ok {
					m.selected = &it.info
					m.mode = registryDetails
					m.refreshDetails()
					return m, nil
				}
			}
		case "esc", "b":
			if m.mode == registryDetails {
				m.ExitToBrowse()
				return m, nil
			}
		}
	}

	if m.loading {
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		cmds = append(cmds, cmd)
		return m, tea.Batch(cmds...)
	}
	if m.mode == registrySearch {
		var cmd tea.Cmd
		m.textInput, cmd = m.textInput.Update(msg)
		cmds = append(cmds, cmd)
		q := strings.ToLower(m.textInput.Value())
		if q == "" {
			m.filtered = m.templates
		} else {
			var out []registry.PackageInfo
			for _, t := range m.templates {
				if strings.Contains(strings.ToLower(t.Name), q) || strings.Contains(strings.ToLower(t.Description), q) {
					out = append(out, t)
				}
			}
			m.filtered = out
		}
		m.setItems(m.filtered)
		return m, tea.Batch(cmds...)
	}
	if m.mode == registryDetails {
		var cmd tea.Cmd
		m.details, cmd = m.details.Update(msg)
		cmds = append(cmds, cmd)
		return m, tea.Batch(cmds...)
	}
	if m.mode == registryBrowse {
		var cmd tea.Cmd
		m.list, cmd = m.list.Update(msg)
		cmds = append(cmds, cmd)
		return m, tea.Batch(cmds...)
	}
	return m, tea.Batch(cmds...)
}

func (m *RegistryModel) setItems(templates []registry.PackageInfo) {
	items := make([]list.Item, len(templates))
	for i, t := range templates {
		desc := t.Description
		if desc == "" {
			desc = t.Version
		}
		items[i] = registryItem{title: t.Name, desc: desc, info: t}
	}
	m.list.SetItems(items)
}

// refreshDetails rebuilds the scrollable details pane for the selection.
func (m *RegistryModel) refreshDetails() {
	if m.selected == nil {
		return
	}
	width := m.width - 4
	if width < 20 {
		width = 20
	}
	var b strings.Builder
	b.WriteString(lipgloss.NewStyle().Bold(true).Render(m.selected.Name) + "\n\n")
	for _, line := range wrapLines("Description: "+m.selected.Description, width) {
		b.WriteString(line + "\n")
	}
	if m.selected.Version != "" {
		b.WriteString("Latest: " + m.selected.Version + "\n")
	}
	if len(m.selected.Versions) > 0 {
		vers := append([]string{}, m.selected.Versions...)
		sort.Strings(vers)
		b.WriteString("Versions:\n")
		for _, line := range wrapLines("  "+strings.Join(vers, ", "), width) {
			b.WriteString(line + "\n")
		}
	}
	b.WriteString("\nesc/b back")
	m.details.SetContent(b.String())
}

// wrapLines word-wraps s to width columns.
func wrapLines(s string, width int) []string {
	if width < 10 {
		width = 10
	}
	var out []string
	for _, para := range strings.Split(s, "\n") {
		for len(para) > width {
			cut := strings.LastIndex(para[:width], " ")
			if cut <= 0 {
				cut = width
			}
			out = append(out, para[:cut])
			para = strings.TrimLeft(para[cut:], " ")
		}
		out = append(out, para)
	}
	return out
}

func (m RegistryModel) View() string {
	if m.loading {
		return lipgloss.NewStyle().Padding(1).Render(m.spinner.View() + " Loading templates...")
	}
	if m.err != "" {
		return lipgloss.NewStyle().Foreground(m.styles.Theme.Error).Padding(1).Render(fmt.Sprintf("Error: %s\nPress r to retry", m.err))
	}
	if len(m.templates) == 0 {
		return lipgloss.NewStyle().Padding(1).Render("No templates found\nPress / to search · r to retry")
	}
	switch m.mode {
	case registryDetails:
		if m.selected != nil {
			return lipgloss.JoinVertical(lipgloss.Left,
				m.details.View(),
				lipgloss.NewStyle().Foreground(m.styles.Theme.Muted).Render("esc/b back · pgup/pgdn scroll"),
			)
		}
	case registrySearch:
		return lipgloss.JoinVertical(lipgloss.Left,
			lipgloss.NewStyle().Padding(1, 1, 0, 1).Render("Search: "+m.textInput.View()+" (esc clear · enter done)"),
			m.list.View(),
		)
	}
	helpLine := lipgloss.NewStyle().Foreground(m.styles.Theme.Muted).Render("Press / to search, enter for details, r to retry")
	return lipgloss.JoinVertical(lipgloss.Left, m.list.View(), helpLine)
}

func (m RegistryModel) IsLoading() bool { return m.loading }
func (m *RegistryModel) SetSize(w, h int) {
	m.width = w
	m.height = h
	lw := w - 4
	if lw < 20 {
		lw = 20
	}
	lh := h - 4
	if lh < 5 {
		lh = 5
	}
	m.list.SetSize(lw, lh)
	m.details.Width = lw
	m.details.Height = lh
	if m.mode == registryDetails && m.selected != nil {
		m.refreshDetails()
	}
}
