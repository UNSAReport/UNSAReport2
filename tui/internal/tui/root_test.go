package tui

import (
	"strings"
	"testing"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/x/exp/teatest"
)

func testRootModel() RootModel {
	return NewRootModel(RootOptions{Project: &ProjectContext{IsProject: false}})
}

func keyMsg(s string) tea.KeyMsg {
	switch s {
	case "enter":
		return tea.KeyMsg{Type: tea.KeyEnter}
	case "esc":
		return tea.KeyMsg{Type: tea.KeyEsc}
	case "tab":
		return tea.KeyMsg{Type: tea.KeyTab}
	default:
		return tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune(s)}
	}
}

func updateRoot(m RootModel, msg tea.Msg) RootModel {
	next, _ := m.Update(msg)
	return next.(RootModel)
}

func navIDs(m RootModel) []string {
	var out []string
	for _, n := range m.nav {
		out = append(out, n.ID)
	}
	return out
}

func TestVisibleNavTree(t *testing.T) {
	m := testRootModel()
	if got := navIDs(m); len(got) != 2 || got[0] != NavRegistryBrowse || got[1] != NavRegistrySearch {
		t.Fatalf("registry nav = %v", got)
	}
	m = updateRoot(m, keyMsg("2"))
	want := []string{NavDocsNewProject, NavDocsCheck, NavDocsConfigure}
	if got := navIDs(m); len(got) != len(want) || got[0] != want[0] || got[1] != want[1] || got[2] != want[2] {
		t.Fatalf("docs nav = %v", got)
	}
	m = updateRoot(m, keyMsg("3"))
	want = []string{NavAuthStatus, NavAuthLogin, NavAuthLogout}
	if got := navIDs(m); len(got) != len(want) || got[0] != want[0] || got[1] != want[1] || got[2] != want[2] {
		t.Fatalf("auth nav = %v", got)
	}
}

func TestSidebarSwallowsStrayKeys(t *testing.T) {
	m := testRootModel()
	if !m.sidebarFocus {
		t.Fatal("expected sidebar focus on boot")
	}
	m = updateRoot(m, keyMsg("/"))
	if m.registry.mode != registryBrowse {
		t.Fatal("/ leaked from sidebar into registry search")
	}
	m = updateRoot(m, keyMsg("q"))
	// q quits via tea.Quit; sidebar isolation concerns other keys only.
	_ = m
}

func TestModalFocusLock(t *testing.T) {
	m := testRootModel()
	m.cursor = 1 // Registry > Search
	m = updateRoot(m, keyMsg("enter"))
	if m.sidebarFocus {
		t.Fatal("enter did not move focus to search")
	}
	if !m.inputCaptured() {
		t.Fatal("search input should capture the keyboard")
	}
	before := m.activeApp
	for _, k := range []string{"1", "2", "3", "q", "?", "h", "l"} {
		m = updateRoot(m, keyMsg(k))
		if m.activeApp != before {
			t.Fatalf("key %q escaped modal search input", k)
		}
	}
	m = updateRoot(m, keyMsg("esc"))
	if m.registry.mode != registryBrowse || m.inputCaptured() {
		t.Fatal("esc did not leave search mode")
	}
}

func TestDocsEnterLazyLoads(t *testing.T) {
	m := testRootModel()
	m = updateRoot(m, keyMsg("2"))
	next, cmd := m.Update(keyMsg("enter"))
	m = next.(RootModel)
	if m.sidebarFocus {
		t.Fatal("enter did not focus docs pane")
	}
	if cmd == nil {
		t.Fatal("first enter on New Project should issue the template fetch")
	}
}

func TestCreateResultEsc(t *testing.T) {
	m := NewDocsCreateModel(nil)
	m.result = "Installed x to y"
	m.templates = nil
	m.form = nil
	next, _ := m.Update(keyMsg("esc"))
	if next.result != "" {
		t.Fatal("esc did not clear the create result")
	}
}

func TestPrepareAbortClearsStaleResult(t *testing.T) {
	m := NewPrepareModel(nil)
	m.result = "Configuration saved"
	m.showForm = true
	m.buildForm()
	next, _ := m.Update(keyMsg("esc"))
	if next.result != "" {
		t.Fatalf("aborted prepare kept stale result = %q", next.result)
	}
}

func TestAuthInvalidTokenStatus(t *testing.T) {
	m := NewAuthModel()
	next, _ := m.Update(authStatusMsg{loggedIn: false, invalidToken: true})
	if !strings.Contains(next.status, "Invalid or expired") {
		t.Fatalf("status = %q", next.status)
	}
}

func drainCmd(m AuthModel, seed tea.Cmd) AuthModel {
	queue := []tea.Cmd{seed}
	for len(queue) > 0 {
		cmd := queue[0]
		queue = queue[1:]
		if cmd == nil {
			continue
		}
		msg := cmd()
		if msg == nil {
			continue
		}
		if batch, ok := msg.(tea.BatchMsg); ok {
			queue = append(queue, batch...)
			continue
		}
		var c2 tea.Cmd
		m, c2 = m.Update(msg)
		queue = append(queue, c2)
	}
	return m
}

func TestAuthLogoutNoCancels(t *testing.T) {
	m := NewAuthModel()
	cmd := m.SetMode(authLogout)
	if cmd == nil {
		t.Fatal("SetMode should return the form init command")
	}
	m = drainCmd(m, cmd)
	next, c := m.Update(keyMsg("enter"))
	next = drainCmd(next, c)
	if next.result != "Cancelled" {
		t.Fatalf("declined logout result = %q", next.result)
	}
}

func TestRootNavigation(t *testing.T) {
	m := NewRootModel(RootOptions{Project: &ProjectContext{IsProject: false}})
	tm := teatest.NewTestModel(t, m, teatest.WithInitialTermSize(100, 30))
	time.Sleep(50 * time.Millisecond)
	tm.Send(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'2'}})
	tm.Send(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'1'}})
	tm.Send(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'k'}})
	tm.Send(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'?'}})
	tm.Send(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'?'}})
	tm.Send(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'q'}})
	tm.WaitFinished(t, teatest.WithFinalTimeout(3*time.Second))
}
