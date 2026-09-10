package tui

import (
	"context"
	"fmt"
	"strings"

	"github.com/UNSAReport/tui/internal/auth"
	"github.com/UNSAReport/tui/internal/config"
	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
)

type authMode int

const (
	authStatus authMode = iota
	authLogin
	authLogout
)

const (
	loginMethodBrowser = "browser"
	loginMethodToken   = "token"
)

type AuthModel struct {
	mode           authMode
	client         *auth.Client
	spinner        spinner.Model
	loading        bool
	waitingBrowser bool
	status         string
	user           string
	form           *huh.Form
	loginMethod    string
	tokenInput     string
	confirmLogout  bool
	result         string
	width, height  int
	styles         Styles
}

func NewAuthModel() AuthModel {
	s := spinner.New()
	s.Spinner = spinner.Dot
	return AuthModel{
		mode:        authStatus,
		client:      auth.NewClient(),
		spinner:     s,
		loading:     true,
		loginMethod: loginMethodBrowser,
		styles:      newStyles(defaultTheme()),
	}
}

func (m AuthModel) Init() tea.Cmd { return tea.Batch(m.spinner.Tick, m.fetchStatus()) }

func (m AuthModel) fetchStatus() tea.Cmd {
	return func() tea.Msg {
		token := config.GetToken()
		if token == "" {
			return authStatusMsg{loggedIn: false}
		}
		client := auth.NewClient()
		u, err := client.Whoami(context.Background())
		if err != nil {
			msg := strings.ToLower(err.Error())
			if strings.Contains(msg, "401") || strings.Contains(msg, "unauthorized") {
				return authStatusMsg{loggedIn: false, invalidToken: true}
			}
			return authStatusMsg{loggedIn: true, user: "unknown (offline)", err: err.Error()}
		}
		return authStatusMsg{loggedIn: true, user: u.Name + " <" + u.Email + ">"}
	}
}

type authStatusMsg struct {
	loggedIn     bool
	invalidToken bool
	user         string
	err          string
}

type browserLoginMsg struct {
	name  string
	email string
	err   error
}

func (m AuthModel) browserLoginCmd() tea.Cmd {
	client := m.client
	return func() tea.Msg {
		cred, err := client.Login(context.Background(), false)
		if err != nil {
			return browserLoginMsg{err: err}
		}
		return browserLoginMsg{name: cred.Name, email: cred.Email}
	}
}

// InputCaptured reports whether the auth form or browser wait owns the keyboard.
func (m AuthModel) InputCaptured() bool {
	return m.form != nil || m.waitingBrowser
}

func (m *AuthModel) SetSize(w, h int) {
	m.width = w
	m.height = h
}

func (m AuthModel) Update(msg tea.Msg) (AuthModel, tea.Cmd) {
	switch msg := msg.(type) {
	case authStatusMsg:
		m.loading = false
		m.waitingBrowser = false
		if msg.invalidToken {
			m.status = "Invalid or expired token — run Login"
			m.user = ""
		} else if msg.loggedIn {
			m.status = "Logged in"
			m.user = msg.user
			if msg.err != "" {
				m.status += " (offline: " + msg.err + ")"
			}
		} else {
			m.status = "Not logged in — run Login"
			m.user = ""
		}
		return m, nil
	case browserLoginMsg:
		m.waitingBrowser = false
		m.loading = false
		if msg.err != nil {
			m.result = "Login failed: " + msg.err.Error()
			return m, nil
		}
		m.result = "Login saved"
		if msg.name != "" {
			m.result += " as " + msg.name
		}
		m.loading = true
		return m, tea.Batch(m.spinner.Tick, m.fetchStatus())
	case tea.KeyMsg:
		switch msg.String() {
		case "r":
			if m.form == nil && !m.waitingBrowser {
				m.loading = true
				return m, tea.Batch(m.spinner.Tick, m.fetchStatus())
			}
		case "esc":
			if m.waitingBrowser {
				m.waitingBrowser = false
				m.loading = false
				m.result = "Cancelled"
				return m, nil
			}
		}
	}
	if m.waitingBrowser {
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}
	if m.loading {
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}
	if m.form != nil {
		form, cmd := m.form.Update(msg)
		if f, ok := form.(*huh.Form); ok {
			m.form = f
			if m.form.State == huh.StateCompleted {
				switch m.mode {
				case authLogin:
					if m.loginMethod == loginMethodBrowser {
						m.form = nil
						m.result = ""
						m.waitingBrowser = true
						m.loading = true
						return m, tea.Batch(m.spinner.Tick, m.browserLoginCmd())
					}
					_, err := m.client.LoginWithToken(context.Background(), m.tokenInput)
					if err != nil {
						m.result = "Login failed: " + err.Error()
						m.form = nil
						return m, nil
					}
					m.result = "Login saved"
				case authLogout:
					if !m.confirmLogout {
						m.result = "Cancelled"
						m.form = nil
						return m, nil
					}
					_ = m.client.Logout()
					m.result = "Logged out"
				}
				m.form = nil
				m.loading = true
				return m, tea.Batch(m.spinner.Tick, m.fetchStatus())
			}
			if m.form.State == huh.StateAborted {
				m.form = nil
				m.result = "Cancelled"
				return m, nil
			}
		}
		return m, cmd
	}
	return m, nil
}

func (m *AuthModel) SetMode(mode authMode) tea.Cmd {
	m.mode = mode
	m.result = ""
	m.form = nil
	m.waitingBrowser = false
	switch mode {
	case authLogin:
		m.tokenInput = ""
		m.loginMethod = loginMethodBrowser
		m.form = huh.NewForm(huh.NewGroup(
			huh.NewSelect[string]().
				Title("Login method").
				Options(
					huh.NewOption("Use browser", loginMethodBrowser),
					huh.NewOption("Paste token", loginMethodToken),
				).
				Value(&m.loginMethod),
			huh.NewInput().Title("Paste personal access token").Placeholder("unsareport_pat_...").Value(&m.tokenInput).Validate(func(s string) error {
				if m.loginMethod != loginMethodToken {
					return nil
				}
				if len(s) < 5 {
					return fmt.Errorf("token too short")
				}
				return nil
			}),
		))
	case authLogout:
		m.confirmLogout = false
		m.form = huh.NewForm(huh.NewGroup(
			huh.NewConfirm().Title("Confirm logout?").Value(&m.confirmLogout),
		))
	}
	if m.form != nil {
		m.loading = false
		return m.form.Init()
	}
	return nil
}

func (m AuthModel) View() string {
	if m.waitingBrowser {
		return lipgloss.NewStyle().Padding(1).Render(m.spinner.View() + " Waiting for browser... Press esc to cancel")
	}
	if m.loading {
		return lipgloss.NewStyle().Padding(1).Render(m.spinner.View() + " Checking auth...")
	}
	if m.form != nil {
		return lipgloss.NewStyle().Padding(1).Render(m.form.View())
	}
	if m.result != "" {
		return lipgloss.NewStyle().Padding(1).Render(m.result + "\n\nStatus: " + m.status + "\nUser: " + m.user + "\n\nPress r to refresh")
	}
	var b string
	b += "Auth Status\n\n"
	b += "Endpoint: " + config.GetAuthURL() + "\n"
	b += "Status: " + m.status + "\n"
	if m.user != "" {
		b += "User: " + m.user + "\n"
	}
	token := m.client.GetToken()
	if token != "" {
		b += "Token: " + token[:min(10, len(token))] + "... (active)\n"
	} else {
		b += "Token: none\n"
	}
	b += "\nSelect Login/Logout via sidebar, enter to execute, r to refresh"
	b += "\nOr run: unsarep login  (browser, loopback 127.0.0.1)  | unsarep login --token <PAT>"
	switch m.mode {
	case authLogin:
		b += "\n\n[Login form ready - press enter]"
	case authLogout:
		b += "\n\n[Logout confirm ready]"
	}
	return lipgloss.NewStyle().Padding(1).Render(b)
}
