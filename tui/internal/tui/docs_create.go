package tui

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/UNSAReport/tui/internal/install"
	"github.com/UNSAReport/tui/internal/registry"
	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
)

type docsCreateFetchedMsg struct {
	templates []registry.TemplateInfo
	err       error
}

type DocsCreateModel struct {
	templates     []registry.TemplateInfo
	loading       bool
	loaded        bool
	err           string
	spinner       spinner.Model
	form          *huh.Form
	formVP        viewport.Model
	templateArg   string
	version       string
	dest          string
	local         string
	useLocal      bool
	session       string
	showForm      bool
	result        string
	project       *ProjectContext
	width, height int
	styles        Styles
}

func NewDocsCreateModel(project *ProjectContext) DocsCreateModel {
	s := spinner.New()
	s.Spinner = spinner.Dot
	cwd, _ := os.Getwd()
	dest := cwd
	if project != nil && project.IsProject {
		dest = project.Root
	}
	return DocsCreateModel{
		spinner: s,
		formVP:  viewport.New(40, 10),
		dest:    dest,
		project: project,
		styles:  newStyles(defaultTheme()),
	}
}

func (m DocsCreateModel) Init() tea.Cmd { return nil }

// FetchCmd loads templates on first navigation (see RootModel.Init).
func (m DocsCreateModel) FetchCmd() tea.Cmd {
	m.loading = true
	return tea.Batch(m.spinner.Tick, m.fetchTemplates())
}

// NeedsLoad reports whether templates have never been requested.
func (m DocsCreateModel) NeedsLoad() bool {
	return !m.loaded && !m.loading && m.err == "" && m.form == nil && m.result == ""
}

// InputCaptured reports whether the huh form owns the keyboard.
func (m DocsCreateModel) InputCaptured() bool {
	return m.showForm && m.form != nil
}

func (m *DocsCreateModel) SetSize(w, h int) {
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

func (m DocsCreateModel) fetchTemplates() tea.Cmd {
	return func() tea.Msg {
		client := registry.NewClient()
		templates, err := client.ListTemplates(context.Background())
		return docsCreateFetchedMsg{templates: templates, err: err}
	}
}

func (m DocsCreateModel) Update(msg tea.Msg) (DocsCreateModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.SetSize(msg.Width, msg.Height)
		return m, nil
	case docsCreateFetchedMsg:
		m.loading = false
		m.loaded = true
		if msg.err != nil {
			m.err = msg.err.Error()
			return m, nil
		}
		if len(msg.templates) == 0 {
			m.err = "No templates available"
			return m, nil
		}
		m.templates = msg.templates
		m.buildForm()
		m.showForm = true
		if m.form != nil {
			return m, m.form.Init()
		}
		return m, nil
	case tea.KeyMsg:
		if m.err != "" && msg.String() == "r" {
			m.loading = true
			m.err = ""
			return m, tea.Batch(m.spinner.Tick, m.fetchTemplates())
		}
		if m.result != "" && (msg.String() == "esc" || msg.String() == "b") {
			m.result = ""
			m.showForm = len(m.templates) > 0 && m.form != nil
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
	if m.loading {
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}
	if m.showForm && m.form != nil {
		form, cmd := m.form.Update(msg)
		if f, ok := form.(*huh.Form); ok {
			m.form = f
			if m.form.State == huh.StateCompleted {
				templateArg := m.templateArg
				if m.version != "" {
					if idx := strings.LastIndex(templateArg, "@"); idx != -1 {
						templateArg = templateArg[:idx] + "@" + m.version
					} else {
						templateArg = templateArg + "@" + m.version
					}
				}
				local := ""
				if m.useLocal {
					local = m.local
				}
				opts := install.Options{
					TemplateArg: templateArg,
					Dest:        m.dest,
					Session:     m.session,
					Local:       local,
				}
				err := install.Execute(context.Background(), opts)
				if err != nil {
					m.result = "Error: " + err.Error()
				} else {
					m.result = "Installed " + templateArg + " to " + m.dest
				}
				m.showForm = false
				return m, nil
			}
			if m.form.State == huh.StateAborted {
				m.showForm = false
				m.result = "Cancelled"
				return m, nil
			}
		}
		return m, cmd
	}
	return m, nil
}

func (m *DocsCreateModel) buildForm() {
	if len(m.templates) == 0 {
		return
	}
	opts := make([]huh.Option[string], len(m.templates))
	for i, t := range m.templates {
		opts[i] = huh.NewOption(t.Name+" - "+t.Description, t.Name)
	}
	isMulti := m.project != nil && m.project.IsProject && m.project.Config.Mode == "multi"
	var sessionField huh.Field
	if isMulti {
		sOpts := make([]huh.Option[string], len(m.project.Config.Sessions))
		for i, s := range m.project.Config.Sessions {
			sOpts[i] = huh.NewOption(s, s)
		}
		sessionField = huh.NewSelect[string]().Title("Session").Options(sOpts...).Value(&m.session).Validate(func(s string) error {
			if strings.TrimSpace(s) == "" {
				return fmt.Errorf("pick a session")
			}
			return nil
		})
	} else {
		sessionField = huh.NewInput().Title("Session (only for multi)").Value(&m.session).Placeholder("Leave empty for single")
	}
	m.templateArg = m.templates[0].Name
	m.form = huh.NewForm(
		huh.NewGroup(
			huh.NewSelect[string]().Title("Template").Options(opts...).Value(&m.templateArg),
			huh.NewInput().Title("Version (semver constraint or empty = latest)").Placeholder("^1.0.0").Value(&m.version).Validate(func(s string) error {
				if s == "" {
					return nil
				}
				if strings.ContainsAny(s, " @") || strings.Trim(s, "^~ ") == "" {
					return fmt.Errorf("invalid version")
				}
				return nil
			}),
			huh.NewInput().Title("Destination").Value(&m.dest).Validate(func(s string) error {
				if strings.TrimSpace(s) == "" {
					return fmt.Errorf("destination is required")
				}
				return nil
			}),
			huh.NewConfirm().Title("Use local directory?").Value(&m.useLocal),
			huh.NewInput().Title("Local path (if use local)").Value(&m.local).Validate(func(s string) error {
				if m.useLocal && strings.TrimSpace(s) == "" {
					return fmt.Errorf("local path is required when using a local directory")
				}
				return nil
			}),
			sessionField,
		),
	)
	if m.project != nil && m.project.IsProject {
		m.dest = m.project.Root
	}
}

func (m DocsCreateModel) View() string {
	if m.loading {
		return lipgloss.NewStyle().Padding(1).Render(m.spinner.View() + " Loading templates...")
	}
	if m.err != "" {
		return lipgloss.NewStyle().Foreground(m.styles.Theme.Error).Padding(1).Render(fmt.Sprintf("Error: %s\nPress r to retry", m.err))
	}
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

func (m *DocsCreateModel) SetProject(p *ProjectContext) { m.project = p }
