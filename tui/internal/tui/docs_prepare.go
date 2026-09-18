package tui

import (
	"fmt"
	"strings"

	"github.com/UNSAReport/tui/internal/docs"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
)

type PrepareModel struct {
	project       *ProjectContext
	report        string
	action        string
	alias         string
	form          *huh.Form
	formVP        viewport.Model
	showForm      bool
	loaded        bool
	result        string
	width, height int
	styles        Styles
}

func NewPrepareModel(project *ProjectContext) PrepareModel {
	return PrepareModel{
		project: project,
		report:  "t1",
		action:  "build",
		formVP:  viewport.New(40, 10),
		styles:  newStyles(defaultTheme()),
	}
}

func (m PrepareModel) Init() tea.Cmd {
	return m.loadContext()
}

func (m PrepareModel) loadContext() tea.Cmd {
	return func() tea.Msg {
		return prepareLoadedMsg{}
	}
}

type prepareLoadedMsg struct{}

func (m PrepareModel) LoadCmd() tea.Cmd {
	return m.loadContext()
}

func (m PrepareModel) NeedsLoad() bool {
	return !m.loaded && m.form == nil && m.result == ""
}

func (m PrepareModel) InputCaptured() bool {
	return m.showForm && m.form != nil
}

func (m *PrepareModel) SetSize(w, h int) {
	m.width = w
	m.height = h
	vw := w - 4
	if vw < 20 {
		vw = 20
	}
	vh := h - 2
	if vh < 5 {
		vh = 5
	}
	m.formVP.Width = vw
	m.formVP.Height = vh
}

func (m PrepareModel) Update(msg tea.Msg) (PrepareModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.SetSize(msg.Width, msg.Height)
		return m, nil
	case prepareLoadedMsg:
		m.loaded = true
		m.buildForm()
		m.showForm = true
		if m.form != nil {
			return m, m.form.Init()
		}
		return m, nil
	case tea.KeyMsg:
		if m.result != "" && (msg.String() == "esc" || msg.String() == "b") {
			m.result = ""
			m.showForm = m.form != nil
			if m.showForm {
				return m, m.form.Init()
			}
			return m, nil
		}
		if msg.String() == "pgup" || msg.String() == "pgdown" {
			var cmd tea.Cmd
			m.formVP, cmd = m.formVP.Update(msg)
			return m, cmd
		}
	}
	if m.showForm && m.form != nil {
		form, cmd := m.form.Update(msg)
		if f, ok := form.(*huh.Form); ok {
			m.form = f
			if m.form.State == huh.StateCompleted {
				if m.project == nil || !m.project.IsProject {
					m.result = "Not in a project (no unsareport.toml found)"
				} else {
					var err error
					switch m.action {
					case "build":
						err = docs.Build(m.project.Root, m.report)
					case "watch":
						err = docs.Watch(m.project.Root, m.report)
					case "check":
						err = docs.Check(m.project.Root)
					case "run":
						if strings.TrimSpace(m.alias) == "" {
							err = fmt.Errorf("alias is required for run")
						} else {
							err = docs.Run(m.project.Root, m.alias, nil)
						}
					default:
						err = fmt.Errorf("unknown action %q", m.action)
					}
					if err != nil {
						m.result = "Error: " + err.Error()
					} else {
						m.result = "Done: " + m.action + " " + m.report
					}
				}
				m.showForm = false
				return m, nil
			}
			if m.form.State == huh.StateAborted {
				m.showForm = false
				m.result = ""
				return m, nil
			}
		}
		return m, cmd
	}
	return m, nil
}

func (m *PrepareModel) buildForm() {
	m.form = huh.NewForm(
		huh.NewGroup(
			huh.NewInput().Title("Report dir").Value(&m.report).Validate(func(s string) error {
				if strings.TrimSpace(s) == "" {
					return fmt.Errorf("report dir is required")
				}
				return nil
			}),
			huh.NewSelect[string]().Title("Action").Options(
				huh.NewOption("build", "build"),
				huh.NewOption("watch", "watch"),
				huh.NewOption("check", "check"),
				huh.NewOption("run", "run"),
			).Value(&m.action),
			huh.NewInput().Title("Alias (for run only)").Value(&m.alias),
		),
	)
}

func (m PrepareModel) View() string {
	if m.result != "" {
		return lipgloss.NewStyle().Padding(1).Render(m.result + "\n\nPress esc to back")
	}
	if m.showForm && m.form != nil {
		formView := m.form.View()
		if m.height > 0 && lipgloss.Height(formView) > m.height-2 {
			m.formVP.SetContent(formView)
			return m.formVP.View()
		}
		return lipgloss.NewStyle().Padding(1).Render(formView)
	}
	return lipgloss.NewStyle().Padding(1).Render("Press enter to load.")
}

func (m *PrepareModel) SetProject(p *ProjectContext) { m.project = p }
