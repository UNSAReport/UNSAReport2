package main

import (
	"errors"
	"testing"

	"github.com/spf13/cobra"
)

func TestInvalidSelectFlagsCombos(t *testing.T) {
	cases := []struct {
		yes, all, none bool
		want           []string
	}{
		{false, false, false, nil},
		{true, false, false, []string{"--yes"}},
		{false, true, false, []string{"--all"}},
		{false, false, true, []string{"--none"}},
		{true, true, false, []string{"--yes", "--all"}},
		{false, true, true, []string{"--all", "--none"}},
		{true, false, true, []string{"--yes", "--none"}},
		{true, true, true, []string{"--yes", "--all", "--none"}},
	}
	for _, tc := range cases {
		got := selectFlags(tc.yes, tc.all, tc.none)
		if len(got) != len(tc.want) {
			t.Fatalf("selectFlags(%v,%v,%v) = %v, want %v", tc.yes, tc.all, tc.none, got, tc.want)
		}
		for i := range got {
			if got[i] != tc.want[i] {
				t.Fatalf("selectFlags(%v,%v,%v) = %v, want %v", tc.yes, tc.all, tc.none, got, tc.want)
			}
		}
	}
}

func TestInvalidChangedFlagFalse(t *testing.T) {
	cmd := testCmd("")
	if err := exclusiveMode(cmd, false, false, false); err != nil {
		t.Fatalf("no mode set must pass, got %v", err)
	}
	got, err := resolvePosOrFlag(cmd, "package", "pos", "package", "ignored")
	if err != nil || got != "pos" {
		t.Fatalf("unchanged flag must defer to positional, got %q %v", got, err)
	}
}

func TestInvalidBothEmpty(t *testing.T) {
	cmd := testCmd("")
	got, err := resolvePosOrFlag(cmd, "package", "", "package", "")
	if err != nil || got != "" {
		t.Fatalf("both empty must stay empty, got %q %v", got, err)
	}
	if err := exclusiveMode(cmd, true, true, false); err == nil {
		t.Fatal("two modes must fail")
	} else {
		var ue *usageError
		if !errors.As(err, &ue) {
			t.Fatalf("exclusivity violation must be a usage error: %T", err)
		}
	}
}

func TestInvalidWrapChain(t *testing.T) {
	inner := &usageError{err: errors.New("inner")}
	outer := &usageError{cmd: &cobra.Command{}, err: inner}
	var ue *usageError
	if !errors.As(outer, &ue) {
		t.Fatal("wrapped usageError must match errors.As")
	}
	if outer.Error() != "inner" {
		t.Fatalf("Error() must delegate, got %q", outer.Error())
	}
	if !errors.Is(outer, inner) {
		t.Fatal("Unwrap chain must expose inner usageError")
	}
}
