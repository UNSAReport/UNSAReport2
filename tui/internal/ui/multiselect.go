package ui

import (
	"io"
	"slices"

	"github.com/charmbracelet/bubbles/key"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/huh"
)

const (
	KeyAll      = "a"
	KeyDefaults = "d"
	KeyNone     = "n"
	KeyToggle   = "x"

	HelpAll      = "all"
	HelpDefaults = "defaults"
	HelpNone     = "none"
	HelpToggle   = "toggle"
)

type MultiSelect[T comparable] struct {
	huh.Field
	inner    *huh.MultiSelect[T]
	options  []huh.Option[T]
	defaults []T
	value    *[]T

	keySelectAll      key.Binding
	keySelectDefaults key.Binding
	keySelectNone     key.Binding
	keyToggle         key.Binding
}

func NewMultiSelect[T comparable]() *MultiSelect[T] {
	inner := huh.NewMultiSelect[T]()
	return &MultiSelect[T]{
		Field: inner,
		inner: inner,
		keySelectAll: key.NewBinding(
			key.WithKeys(KeyAll, "A", "ctrl+a"),
			key.WithHelp(KeyAll, HelpAll),
		),
		keySelectDefaults: key.NewBinding(
			key.WithKeys(KeyDefaults, "D"),
			key.WithHelp(KeyDefaults, HelpDefaults),
		),
		keySelectNone: key.NewBinding(
			key.WithKeys(KeyNone, "N"),
			key.WithHelp(KeyNone, HelpNone),
		),
		keyToggle: key.NewBinding(
			key.WithKeys(" ", KeyToggle, "X"),
			key.WithHelp(KeyToggle, HelpToggle),
		),
	}
}

func (m *MultiSelect[T]) Title(title string) *MultiSelect[T] {
	m.inner.Title(title)
	return m
}

func (m *MultiSelect[T]) Description(desc string) *MultiSelect[T] {
	m.inner.Description(desc)
	return m
}

func (m *MultiSelect[T]) Filterable(filterable bool) *MultiSelect[T] {
	m.inner.Filterable(filterable)
	return m
}

func (m *MultiSelect[T]) Value(value *[]T) *MultiSelect[T] {
	m.value = value
	m.inner.Value(value)
	return m
}

func (m *MultiSelect[T]) Key(k string) *MultiSelect[T] {
	m.inner.Key(k)
	return m
}

func (m *MultiSelect[T]) Validate(fn func([]T) error) *MultiSelect[T] {
	m.inner.Validate(fn)
	return m
}

func (m *MultiSelect[T]) Options(options ...huh.Option[T]) *MultiSelect[T] {
	m.options = options
	m.syncOptions()
	return m
}

func (m *MultiSelect[T]) Defaults(defaults ...T) *MultiSelect[T] {
	m.defaults = append([]T(nil), defaults...)
	if m.value != nil && len(*m.value) == 0 && len(defaults) > 0 {
		*m.value = append([]T(nil), defaults...)
		m.syncOptions()
	}
	return m
}

func (m *MultiSelect[T]) syncOptions() {
	if len(m.options) == 0 {
		return
	}
	cleanOpts := make([]huh.Option[T], len(m.options))
	for i, opt := range m.options {
		cleanOpts[i] = huh.NewOption(opt.Key, opt.Value)
	}
	m.inner.Options(cleanOpts...)
}

func (m *MultiSelect[T]) Init() tea.Cmd {
	return m.inner.Init()
}

func (m *MultiSelect[T]) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	if keyMsg, ok := msg.(tea.KeyMsg); ok && !m.inner.GetFiltering() {
		switch {
		case key.Matches(keyMsg, m.keySelectAll):
			if m.value != nil {
				allVals := make([]T, 0, len(m.options))
				for _, opt := range m.options {
					allVals = append(allVals, opt.Value)
				}
				*m.value = allVals
				m.syncOptions()
			}
			return m, nil
		case key.Matches(keyMsg, m.keySelectDefaults):
			if m.value != nil {
				*m.value = append([]T(nil), m.defaults...)
				m.syncOptions()
			}
			return m, nil
		case key.Matches(keyMsg, m.keySelectNone):
			if m.value != nil {
				*m.value = []T{}
				m.syncOptions()
			}
			return m, nil
		}
	}

	newModel, cmd := m.inner.Update(msg)
	if ms, ok := newModel.(*huh.MultiSelect[T]); ok {
		m.inner = ms
	}
	return m, cmd
}

func (m *MultiSelect[T]) View() string {
	return m.inner.View()
}

func (m *MultiSelect[T]) Blur() tea.Cmd {
	return m.inner.Blur()
}

func (m *MultiSelect[T]) Focus() tea.Cmd {
	return m.inner.Focus()
}

func (m *MultiSelect[T]) Error() error {
	return m.inner.Error()
}

func (m *MultiSelect[T]) Run() error {
	return huh.Run(m)
}

func (m *MultiSelect[T]) RunAccessible(w io.Writer, r io.Reader) error {
	return m.inner.RunAccessible(w, r)
}

func (m *MultiSelect[T]) Skip() bool {
	return m.inner.Skip()
}

func (m *MultiSelect[T]) Zoom() bool {
	return m.inner.Zoom()
}

func (m *MultiSelect[T]) KeyBinds() []key.Binding {
	filtering := m.inner.GetFiltering()
	m.keySelectAll.SetEnabled(!filtering)
	m.keySelectDefaults.SetEnabled(!filtering)
	m.keySelectNone.SetEnabled(!filtering)
	m.keyToggle.SetEnabled(!filtering)

	binds := []key.Binding{
		m.keyToggle,
		m.keySelectAll,
		m.keySelectDefaults,
		m.keySelectNone,
	}

	innerBinds := m.inner.KeyBinds()
	for _, b := range innerBinds {
		helpKey := b.Help().Key
		if helpKey == KeyToggle || helpKey == "ctrl+a" || helpKey == " " {
			continue
		}
		binds = append(binds, b)
	}
	return binds
}

func (m *MultiSelect[T]) WithTheme(theme *huh.Theme) huh.Field {
	m.inner.WithTheme(theme)
	return m
}

func (m *MultiSelect[T]) WithKeyMap(k *huh.KeyMap) huh.Field {
	if k != nil {
		kCopy := *k
		kCopy.MultiSelect.SelectAll.SetEnabled(false)
		kCopy.MultiSelect.SelectNone.SetEnabled(false)
		m.inner.WithKeyMap(&kCopy)
	}
	return m
}

func (m *MultiSelect[T]) WithWidth(width int) huh.Field {
	m.inner.WithWidth(width)
	return m
}

func (m *MultiSelect[T]) WithHeight(height int) huh.Field {
	m.inner.WithHeight(height)
	return m
}

func (m *MultiSelect[T]) WithPosition(p huh.FieldPosition) huh.Field {
	m.inner.WithPosition(p)
	return m
}

func (m *MultiSelect[T]) GetKey() string {
	return m.inner.GetKey()
}

func (m *MultiSelect[T]) GetValue() any {
	return m.inner.GetValue()
}

var _ huh.Field = (*MultiSelect[string])(nil)

func Contains[T comparable](slice []T, item T) bool {
	return slices.Contains(slice, item)
}
