package tui

import (
	"fmt"
	"strings"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/naming"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
)

type PrepareModel struct {
	project       *ProjectContext
	vars          map[string]string
	fileTemplate  string
	submissionDir string
	srcDir        string
	reportFile    string
	reportWord    string
	codeWord      string
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

// LoadCmd loads context on first navigation (see RootModel.Init).
func (m PrepareModel) LoadCmd() tea.Cmd {
	return m.loadContext()
}

// NeedsLoad reports whether context has never been loaded.
func (m PrepareModel) NeedsLoad() bool {
	return !m.loaded && m.form == nil && m.result == ""
}

// InputCaptured reports whether the huh form owns the keyboard.
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
		if m.project != nil && m.project.IsProject {
			cfg := m.project.Config
			m.fileTemplate = cfg.Prepare.Output.FileTemplate
			if m.fileTemplate == "" {
				m.fileTemplate = "{output_type}_{lab_number}"
			}
			m.submissionDir = cfg.Prepare.Output.SubmissionDir
			if m.submissionDir == "" {
				m.submissionDir = "submission"
			}
			m.srcDir = cfg.Prepare.Input.SrcDir
			if m.srcDir == "" {
				m.srcDir = "src"
			}
			m.reportFile = cfg.Prepare.Input.ReportFile
			if m.reportFile == "" {
				m.reportFile = "report.typ"
			}
			m.reportWord = cfg.Prepare.Output.ReportWord
			if m.reportWord == "" {
				m.reportWord = "Informe"
			}
			m.codeWord = cfg.Prepare.Output.CodeWord
			if m.codeWord == "" {
				m.codeWord = "Código Fuente"
			}
			m.vars = map[string]string{
				"lab_number": "01",
				"course":     "Curso",
			}
		} else {
			m.fileTemplate = "{output_type}_{lab_number}"
			m.submissionDir = "submission"
			m.srcDir = "src"
			m.reportFile = "report.typ"
			m.reportWord = "Informe"
			m.codeWord = "Código Fuente"
			m.vars = map[string]string{"lab_number": "01"}
		}
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
				if m.project != nil && m.project.IsProject {
					cfg := m.project.Config
					cfg.Prepare.Output.FileTemplate = m.fileTemplate
					cfg.Prepare.Output.SubmissionDir = m.submissionDir
					cfg.Prepare.Input.SrcDir = m.srcDir
					cfg.Prepare.Input.ReportFile = m.reportFile
					cfg.Prepare.Output.ReportWord = m.reportWord
					cfg.Prepare.Output.CodeWord = m.codeWord
					if err := config.WriteConfig(m.project.Root, cfg); err != nil {
						m.result = "Save failed: " + err.Error()
					} else {
						m.result = "Configuration saved"
					}
				} else {
					if preview, err := naming.ApplyTemplate(m.fileTemplate, m.vars, m.reportWord); err != nil {
						m.result = fmt.Sprintf("template error: %v", err)
					} else {
						m.result = "Preview: " + preview + ".pdf"
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
	nonEmpty := func(field string) func(string) error {
		return func(s string) error {
			if strings.TrimSpace(s) == "" {
				return fmt.Errorf("%s is required", field)
			}
			return nil
		}
	}
	m.form = huh.NewForm(
		huh.NewGroup(
			huh.NewInput().Title("File template").Value(&m.fileTemplate).Placeholder("{output_type}_{lab_number}").Validate(func(s string) error {
				if strings.TrimSpace(s) == "" {
					return fmt.Errorf("file template is required")
				}
				if _, err := naming.ApplyTemplate(s, m.vars, m.reportWord); err != nil {
					return fmt.Errorf("template error: %v", err)
				}
				return nil
			}),
			huh.NewInput().Title("Submission dir").Value(&m.submissionDir).Validate(nonEmpty("submission dir")),
			huh.NewInput().Title("Source dir").Value(&m.srcDir).Validate(nonEmpty("source dir")),
			huh.NewInput().Title("Report file").Value(&m.reportFile).Validate(nonEmpty("report file")),
			huh.NewInput().Title("Report word").Value(&m.reportWord),
			huh.NewInput().Title("Code word").Value(&m.codeWord),
		),
	)
}

func (m PrepareModel) View() string {
	if m.result != "" {
		previewReport, _ := naming.ApplyTemplate(m.fileTemplate, m.vars, m.reportWord)
		previewCode, _ := naming.ApplyTemplate(m.fileTemplate, m.vars, m.codeWord)
		if previewReport == "" {
			previewReport = "invalid template"
		}
		if previewCode == "" {
			previewCode = "invalid template"
		}
		return lipgloss.NewStyle().Padding(1).Render(fmt.Sprintf("Result: %s\n\nExample preview: %s.pdf | %s.zip\n\nPress esc to back", m.result, previewReport, previewCode))
	}
	if m.showForm && m.form != nil {
		previewReport, _ := naming.ApplyTemplate(m.fileTemplate, m.vars, m.reportWord)
		previewCode, _ := naming.ApplyTemplate(m.fileTemplate, m.vars, m.codeWord)
		if previewReport == "" {
			previewReport = "invalid"
		}
		if previewCode == "" {
			previewCode = "invalid"
		}
		preview := fmt.Sprintf("Example preview: %s.pdf | %s.zip", previewReport, previewCode)
		previewView := lipgloss.NewStyle().Padding(0, 1).Foreground(m.styles.Theme.Muted).Render(preview)
		formView := m.form.View()
		if m.height > 0 && lipgloss.Height(formView) > m.height-4 {
			m.formVP.SetContent(formView)
			return lipgloss.JoinVertical(lipgloss.Left, m.formVP.View(), previewView)
		}
		return lipgloss.JoinVertical(lipgloss.Left,
			lipgloss.NewStyle().Padding(1).Render(formView),
			previewView,
		)
	}
	return lipgloss.NewStyle().Padding(1).Render("Press enter to load.")
}

func (m *PrepareModel) SetProject(p *ProjectContext) { m.project = p }
