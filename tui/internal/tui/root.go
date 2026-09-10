package tui

import (
	"fmt"
	"os"
	"strings"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/i18n"
	"github.com/charmbracelet/bubbles/help"
	"github.com/charmbracelet/bubbles/key"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type AppID int

const (
	AppRegistry AppID = iota
	AppDocs
	AppAuth
	AppSlides
)

func (a AppID) String() string {
	switch a {
	case AppRegistry:
		return "Registry"
	case AppDocs:
		return "Docs"
	case AppAuth:
		return "Auth"
	case AppSlides:
		return "Slides"
	default:
		return "Unknown"
	}
}

type FunctionDef struct {
	ID    string
	Label string
}

type Category struct {
	Name      string
	Functions []FunctionDef
}

type AppDef struct {
	ID         AppID
	Name       string
	Categories []Category
}

const (
	NavRegistryBrowse = "registry.browse"
	NavRegistrySearch = "registry.search"
	NavDocsNewProject = "docs.new_project"
	NavDocsCheck      = "docs.check"
	NavDocsConfigure  = "docs.configure"
	NavAuthStatus     = "auth.status"
	NavAuthLogin      = "auth.login"
	NavAuthLogout     = "auth.logout"
)

func appDefs() []AppDef {
	return []AppDef{
		{ID: AppRegistry, Name: i18n.T("app.registry"), Categories: []Category{{Name: i18n.T("category.templates"), Functions: []FunctionDef{
			{ID: NavRegistryBrowse, Label: i18n.T("function.browse")},
			{ID: NavRegistrySearch, Label: i18n.T("function.search")},
		}}}},
		{ID: AppDocs, Name: i18n.T("app.docs"), Categories: []Category{
			{Name: i18n.T("category.create"), Functions: []FunctionDef{{ID: NavDocsNewProject, Label: i18n.T("function.new_project")}}},
			{Name: i18n.T("category.update"), Functions: []FunctionDef{{ID: NavDocsCheck, Label: i18n.T("function.check")}}},
			{Name: i18n.T("category.prepare"), Functions: []FunctionDef{{ID: NavDocsConfigure, Label: i18n.T("function.configure")}}},
		}},
		{ID: AppAuth, Name: i18n.T("app.auth"), Categories: []Category{{Name: i18n.T("category.account"), Functions: []FunctionDef{
			{ID: NavAuthStatus, Label: i18n.T("function.status")},
			{ID: NavAuthLogin, Label: i18n.T("function.login")},
			{ID: NavAuthLogout, Label: i18n.T("function.logout")},
		}}}},
	}
}

func visibleApps() []AppID {
	return []AppID{AppRegistry, AppDocs, AppAuth}
}

type ProjectContext = config.ProjectContext

type RootOptions struct {
	Project *ProjectContext
}

type navItem struct {
	ID       string
	Category string
	Function string
	App      AppID
}

type RootModel struct {
	activeApp     AppID
	apps          []AppDef
	nav           []navItem
	cursor        int
	sidebarFocus  bool
	width, height int
	showHelp      bool
	project       *ProjectContext
	styles        Styles
	keys          KeyMap
	help          help.Model
	registry      RegistryModel
	docsCreate    DocsCreateModel
	docsUpdate    DocsUpdateModel
	docsPrepare   PrepareModel
	auth          AuthModel
}

func NewRootModel(opts RootOptions) RootModel {
	i18n.Init()
	apps := appDefs()
	m := RootModel{
		activeApp:    AppRegistry,
		apps:         apps,
		sidebarFocus: true,
		styles:       newStyles(defaultTheme()),
		keys:         DefaultKeyMap(),
		help:         help.New(),
		project:      opts.Project,
		registry:     NewRegistryModel(),
		docsCreate:   NewDocsCreateModel(nil),
		docsUpdate:   NewDocsUpdateModel(),
		docsPrepare:  NewPrepareModel(nil),
		auth:         NewAuthModel(),
	}
	m.rebuildNav()
	if m.project == nil {
		cwd, _ := os.Getwd()
		if pc, err := config.DetectProject(cwd); err == nil {
			m.project = pc
		} else {
			m.project = &ProjectContext{IsProject: false}
		}
	}
	m.docsCreate.SetProject(m.project)
	m.docsPrepare.SetProject(m.project)
	return m
}
func (m *RootModel) rebuildNav() {
	m.nav = nil
	for _, a := range m.apps {
		if a.ID != m.activeApp {
			continue
		}
		for _, c := range a.Categories {
			for _, f := range c.Functions {
				m.nav = append(m.nav, navItem{ID: f.ID, Category: c.Name, Function: f.Label, App: a.ID})
			}
		}
	}
	if m.cursor >= len(m.nav) {
		m.cursor = 0
	}
}

func (m RootModel) Init() tea.Cmd {
	return tea.Batch(
		m.registry.Init(),
		m.auth.Init(),
	)
}

func appendCmd(cmds []tea.Cmd, cmd tea.Cmd) []tea.Cmd {
	if cmd != nil {
		return append(cmds, cmd)
	}
	return cmds
}

// inputCaptured reports whether a focused child owns the keyboard.
func (m RootModel) inputCaptured() bool {
	if m.showHelp {
		return true
	}
	if m.sidebarFocus {
		return false
	}
	return m.registry.InputCaptured() ||
		m.docsCreate.InputCaptured() ||
		m.docsPrepare.InputCaptured() ||
		m.auth.InputCaptured()
}

func (m RootModel) curNav() navItem {
	if len(m.nav) > 0 && m.cursor < len(m.nav) {
		return m.nav[m.cursor]
	}
	return navItem{}
}

func (m RootModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.help.Width = msg.Width
		var cmds []tea.Cmd
		var cmd tea.Cmd
		m.registry, cmd = m.registry.Update(msg)
		cmds = appendCmd(cmds, cmd)
		m.docsCreate, cmd = m.docsCreate.Update(msg)
		cmds = appendCmd(cmds, cmd)
		m.docsUpdate, cmd = m.docsUpdate.Update(msg)
		cmds = appendCmd(cmds, cmd)
		m.docsPrepare, cmd = m.docsPrepare.Update(msg)
		cmds = appendCmd(cmds, cmd)
		m.auth, cmd = m.auth.Update(msg)
		cmds = appendCmd(cmds, cmd)
		return m, tea.Batch(cmds...)
	case docsCreateFetchedMsg, prepareLoadedMsg, authStatusMsg, registryFetchedMsg:
		var cmds []tea.Cmd
		var cmd tea.Cmd
		m.registry, cmd = m.registry.Update(msg)
		cmds = appendCmd(cmds, cmd)
		m.docsCreate, cmd = m.docsCreate.Update(msg)
		cmds = appendCmd(cmds, cmd)
		m.docsPrepare, cmd = m.docsPrepare.Update(msg)
		cmds = appendCmd(cmds, cmd)
		m.auth, cmd = m.auth.Update(msg)
		cmds = appendCmd(cmds, cmd)
		m.docsUpdate, cmd = m.docsUpdate.Update(msg)
		cmds = appendCmd(cmds, cmd)
		return m, tea.Batch(cmds...)
	case tea.KeyMsg:
		if m.inputCaptured() {
			return m.updateCaptured(msg)
		}
		switch {
		case key.Matches(msg, m.keys.Quit):
			return m, tea.Quit
		case key.Matches(msg, m.keys.Help):
			m.showHelp = !m.showHelp
			return m, nil
		case key.Matches(msg, m.keys.Tab):
			m.sidebarFocus = !m.sidebarFocus
			return m, nil
		case key.Matches(msg, m.keys.Back):
			if m.showHelp {
				m.showHelp = false
				return m, nil
			}
			return m.updateBack(msg)
		}
		switch msg.String() {
		case "1":
			m.switchApp(AppRegistry)
			return m, nil
		case "2":
			m.switchApp(AppDocs)
			return m, nil
		case "3":
			m.switchApp(AppAuth)
			return m, nil
		case "h", "left":
			m.cycleApp(-1)
			return m, nil
		case "l", "right":
			m.cycleApp(1)
			return m, nil
		}
		if !m.sidebarFocus {
			return m.forwardToFocused(msg)
		}
		switch msg.String() {
		case "up", "k":
			if len(m.nav) > 0 && m.cursor > 0 {
				m.cursor--
			}
			return m, nil
		case "down", "j":
			if len(m.nav) > 0 && m.cursor < len(m.nav)-1 {
				m.cursor++
			}
			return m, nil
		case "enter":
			return m.enterSelected()
		case "r":
			return m.retryFocused()
		}
		return m, nil
	}
	return m.forwardToFocused(msg)
}

// updateCaptured handles keys while a child input owns the keyboard.
func (m RootModel) updateCaptured(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	if msg.String() == "ctrl+c" {
		return m, tea.Quit
	}
	if key.Matches(msg, m.keys.Back) {
		if m.showHelp {
			m.showHelp = false
			return m, nil
		}
		return m.forwardToFocused(msg)
	}
	if m.showHelp && key.Matches(msg, m.keys.Help) {
		m.showHelp = false
		return m, nil
	}
	return m.forwardToFocused(msg)
}

// updateBack handles b/esc when no input is captured.
func (m RootModel) updateBack(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	if m.sidebarFocus {
		return m, nil
	}
	if m.activeApp == AppRegistry {
		if m.registry.mode == registryDetails {
			m.registry.mode = registryBrowse
			m.registry.selected = nil
			return m, nil
		}
		if m.registry.mode == registrySearch {
			var cmd tea.Cmd
			m.registry, cmd = m.registry.Update(msg)
			return m, cmd
		}
		m.sidebarFocus = true
		return m, nil
	}
	if m.activeApp == AppAuth {
		if m.auth.form != nil {
			var cmd tea.Cmd
			m.auth, cmd = m.auth.Update(msg)
			return m, cmd
		}
		m.sidebarFocus = true
		return m, nil
	}
	if m.activeApp == AppDocs {
		switch m.curNav().ID {
		case NavDocsNewProject:
			if m.docsCreate.result != "" || m.docsCreate.showForm {
				var cmd tea.Cmd
				m.docsCreate, cmd = m.docsCreate.Update(msg)
				if m.docsCreate.result == "" && !m.docsCreate.showForm {
					m.sidebarFocus = true
				}
				return m, cmd
			}
		case NavDocsConfigure:
			if m.docsPrepare.result != "" || m.docsPrepare.showForm {
				var cmd tea.Cmd
				m.docsPrepare, cmd = m.docsPrepare.Update(msg)
				if m.docsPrepare.result == "" && !m.docsPrepare.showForm {
					m.sidebarFocus = true
				}
				return m, cmd
			}
		}
		m.sidebarFocus = true
		return m, nil
	}
	m.sidebarFocus = true
	return m, nil
}

func (m *RootModel) switchApp(app AppID) {
	m.activeApp = app
	m.cursor = 0
	m.rebuildNav()
}

func (m *RootModel) cycleApp(dir int) {
	order := visibleApps()
	idx := 0
	for i, a := range order {
		if a == m.activeApp {
			idx = i
			break
		}
	}
	idx = (idx + dir + len(order)) % len(order)
	m.activeApp = order[idx]
	m.cursor = 0
	m.rebuildNav()
}

// enterSelected activates the highlighted sidebar row.
func (m RootModel) enterSelected() (tea.Model, tea.Cmd) {
	if len(m.nav) == 0 {
		return m, nil
	}
	cur := m.nav[m.cursor]
	var cmd tea.Cmd
	switch cur.ID {
	case NavRegistrySearch:
		m.registry.EnterSearch()
	case NavRegistryBrowse:
		m.registry.ExitToBrowse()
	case NavAuthStatus, NavAuthLogin, NavAuthLogout:
		switch cur.ID {
		case NavAuthLogin:
			cmd = m.auth.SetMode(authLogin)
		case NavAuthLogout:
			cmd = m.auth.SetMode(authLogout)
		default:
			cmd = m.auth.SetMode(authStatus)
		}
	case NavDocsNewProject:
		if m.docsCreate.NeedsLoad() {
			cmd = m.docsCreate.FetchCmd()
		}
	case NavDocsConfigure:
		if m.docsPrepare.NeedsLoad() {
			cmd = m.docsPrepare.LoadCmd()
		}
	}
	m.sidebarFocus = false
	return m, cmd
}

// retryFocused forwards r to children that support it.
func (m RootModel) retryFocused() (tea.Model, tea.Cmd) {
	if m.activeApp == AppRegistry {
		var cmd tea.Cmd
		m.registry, cmd = m.registry.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'r'}})
		return m, cmd
	}
	if m.activeApp == AppAuth {
		var cmd tea.Cmd
		m.auth, cmd = m.auth.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'r'}})
		return m, cmd
	}
	return m, nil
}

// forwardToFocused routes a message to the active child by stable nav ID.
func (m RootModel) forwardToFocused(msg tea.Msg) (tea.Model, tea.Cmd) {
	if m.activeApp == AppRegistry {
		var cmd tea.Cmd
		m.registry, cmd = m.registry.Update(msg)
		return m, cmd
	}
	if m.activeApp == AppAuth {
		var cmd tea.Cmd
		m.auth, cmd = m.auth.Update(msg)
		return m, cmd
	}
	if m.activeApp == AppDocs {
		var cmd tea.Cmd
		switch m.curNav().ID {
		case NavDocsNewProject:
			m.docsCreate, cmd = m.docsCreate.Update(msg)
		case NavDocsConfigure:
			m.docsPrepare, cmd = m.docsPrepare.Update(msg)
		default:
			m.docsUpdate, cmd = m.docsUpdate.Update(msg)
		}
		return m, cmd
	}
	return m, nil
}
func appTabNumber(app AppID) int {
	for i, a := range visibleApps() {
		if a == app {
			return i + 1
		}
	}
	return 0
}

func middleTruncate(s string, max int) string {
	if max <= 0 {
		return ""
	}
	if len(s) <= max {
		return s
	}
	if max <= 1 {
		return "…"
	}
	keep := max - 1
	head := keep / 2
	return s[:head] + "…" + s[len(s)-(keep-head):]
}

func (m RootModel) View() string {
	if m.width == 0 {
		m.width = 80
	}
	if m.height == 0 {
		m.height = 24
	}

	var tabs []string
	for _, a := range m.apps {
		name := fmt.Sprintf(" %d:%s ", appTabNumber(a.ID), a.Name)
		if a.ID == m.activeApp {
			tabs = append(tabs, m.styles.TopBarActive.Render(name))
		} else {
			tabs = append(tabs, m.styles.TopBar.Render(name))
		}
	}
	var badge string
	if m.project != nil && m.project.IsProject {
		label := middleTruncate(m.project.Root, 24)
		tpl := m.project.Config.Template
		mode := m.project.Config.Mode
		badge = m.styles.TopBarMuted.Render(fmt.Sprintf(" %s [%s %s] ", label, tpl, mode))
	} else {
		badge = m.styles.TopBarMuted.Render(" " + i18n.T("no_project") + " ")
	}
	topBar := lipgloss.JoinHorizontal(lipgloss.Top, strings.Join(tabs, ""), badge)
	topBar = lipgloss.PlaceHorizontal(m.width, lipgloss.Left, topBar, lipgloss.WithWhitespaceChars(" "))

	topH := lipgloss.Height(topBar)
	showHelpBar := m.height >= 12
	helpReserve := 0
	if showHelpBar {
		helpReserve = 1
	}
	availH := m.height - topH - helpReserve
	if availH < 5 {
		availH = 5
	}
	compact := m.width < 60
	sidebarW := 0
	if !compact {
		longest := 0
		for _, a := range m.apps {
			if a.ID != m.activeApp {
				continue
			}
			for _, cat := range a.Categories {
				if len(cat.Name) > longest {
					longest = len(cat.Name)
				}
				for _, fn := range cat.Functions {
					if len(fn.Label)+2 > longest {
						longest = len(fn.Label) + 2
					}
				}
			}
		}
		sidebarW = longest + 6
		if sidebarW < 20 {
			sidebarW = 20
		}
		if sidebarW > 28 {
			sidebarW = 28
		}
	}
	mainW := m.width - 2
	if !compact {
		mainW = m.width - sidebarW - 3
	}
	if mainW < 20 {
		mainW = 20
	}

	cur := m.curNav()
	var sidebarBox string
	if !compact {
		var sb strings.Builder
		for _, a := range m.apps {
			if a.ID != m.activeApp {
				continue
			}
			for _, cat := range a.Categories {
				sb.WriteString(m.styles.SidebarSel.Render(cat.Name) + "\n")
				for _, fn := range cat.Functions {
					idx := -1
					for i, n := range m.nav {
						if n.ID == fn.ID {
							idx = i
							break
						}
					}
					prefix := "  "
					style := lipgloss.NewStyle()
					if idx == m.cursor {
						prefix = "> "
						if m.sidebarFocus {
							style = lipgloss.NewStyle().Bold(true).
								Foreground(lipgloss.Color("#ffffff")).
								Background(m.styles.Theme.Primary)
						} else {
							style = m.styles.SidebarSel
						}
					}
					sb.WriteString(style.Render(prefix+fn.Label) + "\n")
				}
			}
		}
		if m.sidebarFocus {
			sb.WriteString("\n" + m.styles.HelpBar.Render("(menu)"))
		}
		sidebarBox = m.styles.SidebarPlain.Width(sidebarW).Height(availH).Render(sb.String())
	}

	var mainContent string
	switch {
	case m.activeApp == AppRegistry:
		m.registry.SetSize(mainW, availH)
		mainContent = m.registry.View()
	case m.activeApp == AppDocs && cur.ID == NavDocsNewProject:
		m.docsCreate.SetSize(mainW, availH)
		mainContent = m.docsCreate.View()
	case m.activeApp == AppDocs && cur.ID == NavDocsConfigure:
		m.docsPrepare.SetSize(mainW, availH)
		mainContent = m.docsPrepare.View()
	case m.activeApp == AppDocs:
		m.docsUpdate.SetSize(mainW, availH)
		mainContent = m.docsUpdate.View()
	case m.activeApp == AppAuth:
		m.auth.SetSize(mainW, availH)
		mainContent = m.auth.View()
	default:
		mainContent = m.renderMain(cur, mainW, availH)
	}
	if cur.ID != "" {
		crumb := m.styles.SidebarSel.Render(cur.Category + " > " + cur.Function)
		if !m.sidebarFocus {
			crumb += " " + m.styles.HelpBar.Render("(focused)")
		}
		mainContent = crumb + "\n" + mainContent
	} else if compact {
		mainContent = m.styles.HelpBar.Render("1 Registry · 2 Docs · 3 Auth — tab for menu") + "\n" + mainContent
	}
	mainBox := m.styles.Main.Width(mainW).Height(availH).Render(mainContent)
	var body string
	if compact {
		body = mainBox
	} else {
		body = lipgloss.JoinHorizontal(lipgloss.Top, sidebarBox, " ", mainBox)
	}

	helpBar := ""
	if showHelpBar {
		helpBar = m.styles.HelpBar.Render(m.contextHelp())
	}
	if m.showHelp {
		helpView := m.help.View(m.keys)
		overlay := lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(m.styles.Theme.Border).
			Padding(1, 2).
			Width(min(m.width-4, 64)).
			Render("Help\n\n" + helpView + "\n\n?/esc close")
		body = lipgloss.Place(m.width, availH, lipgloss.Center, lipgloss.Center, overlay, lipgloss.WithWhitespaceChars(" "), lipgloss.WithWhitespaceForeground(lipgloss.Color("0")))
		if showHelpBar {
			return lipgloss.JoinVertical(lipgloss.Left, topBar, body, helpBar)
		}
		return lipgloss.JoinVertical(lipgloss.Left, topBar, body)
	}

	if showHelpBar {
		return lipgloss.JoinVertical(lipgloss.Left, topBar, body, helpBar)
	}
	return lipgloss.JoinVertical(lipgloss.Left, topBar, body)
}

// contextHelp returns the one-line footer for the current focus.
func (m RootModel) contextHelp() string {
	if m.sidebarFocus {
		return "j/k move · enter open · 1-3 apps · ? all keys"
	}
	if m.activeApp == AppRegistry {
		switch m.registry.mode {
		case registryDetails:
			return "esc back · pgup/pgdn scroll"
		case registrySearch:
			return "type to filter · esc clear · enter done"
		default:
			return "j/k move · enter details · / search"
		}
	}
	if m.activeApp == AppDocs {
		switch m.curNav().ID {
		case NavDocsNewProject, NavDocsConfigure:
			return "tab next field · enter confirm · esc cancel"
		default:
			return "tab back to menu · 1-3 apps"
		}
	}
	if m.activeApp == AppAuth {
		return "enter confirm · esc cancel · r refresh"
	}
	return "tab back to menu · 1-3 apps"
}

func (m RootModel) renderMain(cur navItem, w, h int) string {
	content := m.styles.HelpBar.Render("Unavailable — hidden until backend lands")
	lines := strings.Split(content, "\n")
	if len(lines) > h-2 {
		lines = lines[:h-2]
		content = strings.Join(lines, "\n")
	}
	return content
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
