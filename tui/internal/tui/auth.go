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
	authLoginToken
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
	browserURL     string
	loginFlow      *auth.LoginFlow
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
		client := m.client
		cred, u, err := client.Status(context.Background())
		if err != nil {
			msg := strings.ToLower(err.Error())
			if strings.Contains(msg, "not logged in") {
				return authStatusMsg{loggedIn: false}
			}
			if strings.Contains(msg, "401") || strings.Contains(msg, "unauthorized") {
				return authStatusMsg{loggedIn: false, invalidToken: true}
			}
			if cred != nil {
				name := cred.Name
				if name == "" {
					name = cred.UserID
				}
				userStr := name
				if cred.Email != "" {
					userStr += " <" + cred.Email + ">"
				}
				return authStatusMsg{loggedIn: true, user: userStr, err: err.Error()}
			}
			return authStatusMsg{loggedIn: false, err: err.Error()}
		}
		name := u.Name
		if name == "" {
			name = u.ID
		}
		userStr := name
		if u.Email != "" {
			userStr += " <" + u.Email + ">"
		}
		return authStatusMsg{loggedIn: true, user: userStr}
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

func (m AuthModel) browserLoginCmd(flow *auth.LoginFlow) tea.Cmd {
	client := m.client
	return func() tea.Msg {
		cred, err := client.FinishLoginFlow(context.Background(), flow)
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
			if msg.err != "" {
				m.status += " (" + msg.err + ")"
			}
		}
		return m, nil
	case browserLoginMsg:
		m.waitingBrowser = false
		m.loading = false
		m.loginFlow = nil
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
				m.result = ""
				return m, tea.Batch(m.spinner.Tick, m.fetchStatus())
			}
		case "esc":
			if m.waitingBrowser {
				if m.loginFlow != nil {
					m.loginFlow.CallbackServer.Close()
					m.loginFlow = nil
				}
				m.waitingBrowser = false
				m.loading = false
				m.result = "Cancelled"
				return m, nil
			}
			if m.form != nil {
				m.form = nil
				m.result = "Cancelled"
				m.mode = authStatus
				return m, nil
			}
			if m.result != "" && m.form == nil {
				m.result = ""
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
						flow, err := m.client.StartLoginFlow()
						if err != nil {
							m.result = "Failed to start login: " + err.Error()
							return m, nil
						}
						_ = auth.OpenBrowser(flow.AuthURL)
						m.loginFlow = flow
						m.browserURL = flow.AuthURL
						m.waitingBrowser = true
						m.loading = true
						return m, tea.Batch(m.spinner.Tick, m.browserLoginCmd(flow))
					}
					// Transition to token input form
					m.mode = authLoginToken
					m.tokenInput = ""
					m.form = huh.NewForm(huh.NewGroup(
						huh.NewInput().
							Title("Paste personal access token").
							Placeholder("unsareport_pat_...").
							Value(&m.tokenInput).
							Validate(func(s string) error {
								if len(strings.TrimSpace(s)) < 5 {
									return fmt.Errorf("token too short")
								}
								return nil
							}),
					))
					return m, m.form.Init()
				case authLoginToken:
					tok := strings.TrimSpace(m.tokenInput)
					m.form = nil
					cred, err := m.client.LoginWithToken(context.Background(), tok)
					if err != nil {
						m.result = "Login failed: " + err.Error()
						return m, nil
					}
					m.result = "Login saved"
					if cred.Name != "" {
						m.result += " as " + cred.Name
					}
					m.loading = true
					return m, tea.Batch(m.spinner.Tick, m.fetchStatus())
				case authLogout:
					if !m.confirmLogout {
						m.result = "Cancelled"
						m.form = nil
						return m, nil
					}
					if err := m.client.Logout(); err != nil {
						m.result = "Logout failed: " + err.Error()
						m.form = nil
						return m, nil
					}
					m.result = "Logged out"
					m.user = ""
					m.status = "Not logged in — run Login"
					m.form = nil
					m.loading = true
					return m, tea.Batch(m.spinner.Tick, m.fetchStatus())
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
	m.result = ""
	m.form = nil
	if m.waitingBrowser && m.loginFlow != nil {
		m.loginFlow.CallbackServer.Close()
		m.loginFlow = nil
	}
	m.waitingBrowser = false

	switch mode {
	case authLogin, authLoginToken:
		m.mode = authLogin
		m.loginMethod = loginMethodBrowser
		m.form = huh.NewForm(huh.NewGroup(
			huh.NewSelect[string]().
				Title("Login method").
				Options(
					huh.NewOption("Use browser", loginMethodBrowser),
					huh.NewOption("Paste token", loginMethodToken),
				).
				Value(&m.loginMethod),
		))
	case authLogout:
		m.mode = authLogout
		m.confirmLogout = true
		m.form = huh.NewForm(huh.NewGroup(
			huh.NewConfirm().
				Title("Confirm logout?").
				Affirmative("Yes").
				Negative("No").
				Value(&m.confirmLogout),
		))
	default:
		m.mode = authStatus
	}

	if m.form != nil {
		m.loading = false
		return m.form.Init()
	}
	return nil
}

func (m AuthModel) View() string {
	if m.waitingBrowser {
		urlStyle := lipgloss.NewStyle().Foreground(m.styles.Theme.Primary).Bold(true)
		var s strings.Builder
		s.WriteString(m.spinner.View() + " Waiting for browser authorization... (Press esc to cancel)\n\n")
		s.WriteString("If your browser did not open automatically, visit this URL:\n\n")
		s.WriteString("  " + urlStyle.Render(m.browserURL) + "\n\n")
		s.WriteString("After authorizing in the browser, return to this terminal window.")
		return lipgloss.NewStyle().Padding(1).Render(s.String())
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
	b += "Status:   " + m.status + "\n"
	if m.user != "" {
		b += "User:     " + m.user + "\n"
	}
	token := m.client.GetToken()
	if token != "" {
		b += "Token:    " + token[:min(10, len(token))] + "... (active)\n"
	} else {
		b += "Token:    none\n"
	}
	b += "\nSelect Login/Logout via sidebar, press enter to execute, r to refresh"
	b += "\nOr run: unsarep login  (browser)  |  unsarep login --token <PAT>"
	switch m.mode {
	case authLogin, authLoginToken:
		b += "\n\n[Login form ready - press enter]"
	case authLogout:
		b += "\n\n[Logout confirm ready]"
	}
	return lipgloss.NewStyle().Padding(1).Render(b)
}
