package tui

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/UNSAReport/tui/internal/docs"
	"github.com/UNSAReport/tui/internal/registry"
	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
)

type docsCreateFetchedMsg struct {
	packages []registry.PackageInfo
	err      error
}

type DocsCreateModel struct {
	packages      []registry.PackageInfo
	loading       bool
	loaded        bool
	err           string
	spinner       spinner.Model
	form          *huh.Form
	formVP        viewport.Model
	templateArg   string
	version       string
	dest          string
	report        string
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
		report:  "t1",
		project: project,
		styles:  newStyles(defaultTheme()),
	}
}

func (m DocsCreateModel) Init() tea.Cmd { return nil }

func (m DocsCreateModel) FetchCmd() tea.Cmd {
	m.loading = true
	return tea.Batch(m.spinner.Tick, m.fetchPackages())
}

func (m DocsCreateModel) NeedsLoad() bool {
	return !m.loaded && !m.loading && m.err == "" && m.form == nil && m.result == ""
}

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

func (m DocsCreateModel) fetchPackages() tea.Cmd {
	return func() tea.Msg {
		client := registry.NewClient()
		pkgs, err := client.ListPackages(context.Background())
		return docsCreateFetchedMsg{packages: pkgs, err: err}
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
		if len(msg.packages) == 0 {
			m.err = "No packages available"
			return m, nil
		}
		m.packages = msg.packages
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
			return m, tea.Batch(m.spinner.Tick, m.fetchPackages())
		}
		if m.result != "" && (msg.String() == "esc" || msg.String() == "b") {
			m.result = ""
			m.showForm = len(m.packages) > 0 && m.form != nil
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
					templateArg = templateArg + "@" + m.version
				}
				err := docs.Init(context.Background(), m.dest, docs.InitOptions{
					Template: templateArg,
					Report:   m.report,
				})
				if err != nil {
					m.result = "Error: " + err.Error()
				} else {
					m.result = "Initialized " + templateArg + " in " + m.dest
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
	if len(m.packages) == 0 {
		return
	}
	opts := make([]huh.Option[string], len(m.packages))
	for i, t := range m.packages {
		opts[i] = huh.NewOption(t.Name+" - "+t.Description, t.Name)
	}
	m.templateArg = m.packages[0].Name
	m.form = huh.NewForm(
		huh.NewGroup(
			huh.NewSelect[string]().Title("Template").Options(opts...).Value(&m.templateArg),
			huh.NewInput().Title("Version (semver range or empty = latest)").Placeholder("*").Value(&m.version),
			huh.NewInput().Title("Report dir").Value(&m.report).Validate(func(s string) error {
				if strings.TrimSpace(s) == "" {
					return fmt.Errorf("report dir is required")
				}
				return nil
			}),
			huh.NewInput().Title("Destination").Value(&m.dest).Validate(func(s string) error {
				if strings.TrimSpace(s) == "" {
					return fmt.Errorf("destination is required")
				}
				return nil
			}),
		),
	)
	if m.project != nil && m.project.IsProject {
		m.dest = m.project.Root
	}
}

func (m DocsCreateModel) View() string {
	if m.loading {
		return lipgloss.NewStyle().Padding(1).Render(m.spinner.View() + " Loading packages...")
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
