package ui

import (
	"testing"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/huh"
)

func TestMultiSelectKeybindings(t *testing.T) {
	var selected []string
	options := []huh.Option[string]{
		huh.NewOption("Option 1", "opt1"),
		huh.NewOption("Option 2", "opt2"),
		huh.NewOption("Option 3", "opt3"),
	}
	defaults := []string{"opt1", "opt3"}

	ms := NewMultiSelect[string]().
		Title("Test Select").
		Options(options...).
		Value(&selected).
		Defaults(defaults...)

	if len(selected) != 2 || selected[0] != "opt1" || selected[1] != "opt3" {
		t.Fatalf("expected defaults [opt1, opt3], got %v", selected)
	}

	_, _ = ms.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'n'}})
	if len(selected) != 0 {
		t.Fatalf("expected empty selection after 'n', got %v", selected)
	}

	_, _ = ms.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'a'}})
	if len(selected) != 3 {
		t.Fatalf("expected 3 items selected after 'a', got %v", selected)
	}

	_, _ = ms.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'d'}})
	if len(selected) != 2 || selected[0] != "opt1" || selected[1] != "opt3" {
		t.Fatalf("expected defaults restored after 'd', got %v", selected)
	}
}

func TestMultiSelectKeyBindsHelp(t *testing.T) {
	var selected []string
	ms := NewMultiSelect[string]().
		Title("Test Help").
		Options(
			huh.NewOption("A", "a"),
			huh.NewOption("B", "b"),
		).
		Value(&selected)

	binds := ms.KeyBinds()
	hasAll := false
	hasDefaults := false
	hasNone := false
	hasToggle := false

	for _, b := range binds {
		switch b.Help().Key {
		case KeyAll:
			hasAll = true
		case KeyDefaults:
			hasDefaults = true
		case KeyNone:
			hasNone = true
		case KeyToggle:
			hasToggle = true
		}
	}

	if !hasAll || !hasDefaults || !hasNone || !hasToggle {
		t.Fatalf("missing expected help keys in binds: all=%v, defaults=%v, none=%v, toggle=%v",
			hasAll, hasDefaults, hasNone, hasToggle)
	}
}

func TestMultiSelectFormIntegration(t *testing.T) {
	var selected []string
	options := []huh.Option[string]{
		huh.NewOption("Alpha", "a"),
		huh.NewOption("Beta", "b"),
	}
	field := NewMultiSelect[string]().
		Title("Alpha Beta").
		Options(options...).
		Value(&selected).
		Defaults("a")

	form := huh.NewForm(huh.NewGroup(field))
	if form == nil {
		t.Fatal("expected non-nil form")
	}

	_, _ = form.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'a'}})
	if len(selected) != 2 {
		t.Fatalf("expected 2 items after 'a' on form, got %v", selected)
	}
}
