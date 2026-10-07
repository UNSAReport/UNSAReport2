package main

import (
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/spf13/cobra"
)

func testCmd(changed string) *cobra.Command {
	c := &cobra.Command{Use: "test"}
	c.Flags().String("package", "", "")
	c.Flags().String("report", "", "")
	if changed != "" {
		_ = c.Flags().Set(changed, "flagval")
	}
	return c
}

func TestExclusiveMode(t *testing.T) {
	cmd := testCmd("")
	if err := exclusiveMode(cmd, false, false, false); err != nil {
		t.Fatalf("none set: %v", err)
	}
	for _, tc := range [][3]bool{{true, false, false}, {false, true, false}, {false, false, true}} {
		if err := exclusiveMode(cmd, tc[0], tc[1], tc[2]); err != nil {
			t.Fatalf("single set %v: %v", tc, err)
		}
	}
	if err := exclusiveMode(cmd, true, true, false); err == nil {
		t.Fatal("two modes set must fail")
	} else {
		var ue *usageError
		if !errors.As(err, &ue) {
			t.Fatalf("exclusivity violation must be a usage error: %T", err)
		}
	}
	if err := exclusiveMode(cmd, true, true, true); err == nil {
		t.Fatal("three modes set must fail")
	}
}

func TestResolvePosOrFlag(t *testing.T) {
	cmd := testCmd("")
	got, err := resolvePosOrFlag(cmd, "package", "pos", "package", "")
	if err != nil || got != "pos" {
		t.Fatalf("positional wins when flag untouched: %q %v", got, err)
	}
	got, err = resolvePosOrFlag(cmd, "package", "", "package", "flagval")
	if err != nil || got != "flagval" {
		t.Fatalf("flag value used when no positional: %q %v", got, err)
	}
	cmd = testCmd("package")
	if _, err := resolvePosOrFlag(cmd, "package", "pos", "package", "flagval"); err == nil {
		t.Fatal("conflicting positional and flag must fail")
	} else {
		var ue *usageError
		if !errors.As(err, &ue) {
			t.Fatalf("conflict must be a usage error: %T", err)
		}
	}
	cmd = testCmd("package")
	if err := cmd.Flags().Set("package", "same"); err != nil {
		t.Fatal(err)
	}
	got, err = resolvePosOrFlag(cmd, "package", "same", "package", "same")
	if err != nil || got != "same" {
		t.Fatalf("identical positional and flag agree: %q %v", got, err)
	}
}

func TestUsageErrorMapping(t *testing.T) {
	var err error = &usageError{err: errors.New("boom")}
	var ue *usageError
	if !errors.As(err, &ue) {
		t.Fatal("usageError must match errors.As for exit-2 mapping in main")
	}
	if plain := errors.New("boom"); errors.As(plain, &ue) {
		t.Fatal("plain errors must not map to exit 2")
	}
}

func TestSelectFlags(t *testing.T) {
	if got := selectFlags(false, false, false); len(got) != 0 {
		t.Fatalf("empty: %v", got)
	}
	got := selectFlags(false, true, false)
	if len(got) != 1 || got[0] != "--all" {
		t.Fatalf("all: %v", got)
	}
}

func TestDocsUpdateCmdFlags(t *testing.T) {
	cmd := newDocsUpdateCmd()
	if f := cmd.Flags().Lookup("deps"); f == nil {
		t.Fatal("expected --deps flag on update command")
	} else if f.Shorthand != "d" {
		t.Fatalf("expected -d shorthand for deps, got %q", f.Shorthand)
	}
}

func TestDocsWatchCmdFlags(t *testing.T) {
	cmd := newDocsWatchCmd()
	f := cmd.Flags().Lookup("open")
	if f == nil {
		t.Fatal("expected --open flag on watch command")
	}
	if f.DefValue != "true" {
		t.Fatalf("expected --open default value to be 'true', got %q", f.DefValue)
	}
}

func TestDocsInitCmdFlags(t *testing.T) {
	cmd := newDocsInitCmd()
	f := cmd.Flags().Lookup("search")
	if f == nil {
		t.Fatal("expected --search flag on init command")
	}
	if f.Shorthand != "s" {
		t.Fatalf("expected -s shorthand for search, got %q", f.Shorthand)
	}
}

func TestDocsAddCmdFlags(t *testing.T) {
	cmd := newDocsAddCmd()
	f := cmd.Flags().Lookup("search")
	if f == nil {
		t.Fatal("expected --search flag on add command")
	}
	if f.Shorthand != "s" {
		t.Fatalf("expected -s shorthand for search, got %q", f.Shorthand)
	}
	if p := cmd.Flags().Lookup("package"); p == nil {
		t.Fatal("expected --package flag on add command")
	}
}

func TestRegistryBuildCmdFlags(t *testing.T) {
	cmd := newRegistryBuildCmd()
	if f := cmd.Flags().Lookup("target"); f == nil {
		t.Fatal("expected --target flag on registry build command")
	}
	if f := cmd.Flags().Lookup("output"); f == nil {
		t.Fatal("expected --output flag on registry build command")
	} else if f.Shorthand != "o" {
		t.Fatalf("expected -o shorthand for output, got %q", f.Shorthand)
	}
	if f := cmd.Flags().Lookup("no-hooks"); f == nil {
		t.Fatal("expected --no-hooks flag on registry build command")
	}
}

func TestRegistryWatchCmdFlags(t *testing.T) {
	cmd := newRegistryWatchCmd()
	if f := cmd.Flags().Lookup("target"); f == nil {
		t.Fatal("expected --target flag on registry watch command")
	}
	if f := cmd.Flags().Lookup("open"); f == nil {
		t.Fatal("expected --open flag on registry watch command")
	} else if f.DefValue != "true" {
		t.Fatalf("expected --open default value to be 'true', got %q", f.DefValue)
	}
}
func TestDocsRemoveCmdFlags(t *testing.T) {
	cmd := newDocsRemoveCmd()
	if f := cmd.Flags().Lookup("yes"); f == nil {
		t.Fatal("expected --yes flag on docs remove command")
	} else if f.Shorthand != "y" {
		t.Fatalf("expected -y shorthand for yes, got %q", f.Shorthand)
	}
	if f := cmd.Flags().Lookup("package"); f == nil {
		t.Fatal("expected --package flag on docs remove command")
	}
}

func TestLogoutCmdFlags(t *testing.T) {
	cmd := newLogoutCmd()
	if f := cmd.Flags().Lookup("yes"); f == nil {
		t.Fatal("expected --yes flag on logout command")
	} else if f.Shorthand != "y" {
		t.Fatalf("expected -y shorthand for yes, got %q", f.Shorthand)
	}
}

func TestDocsCheckCmdFlags(t *testing.T) {
	cmd := newDocsCheckCmd()
	if f := cmd.Flags().Lookup("report"); f == nil {
		t.Fatal("expected --report flag on docs check command")
	}
	if cmd.Args == nil {
		t.Fatal("expected docs check command to have Args defined")
	}
}

func TestInferReportFromCwd(t *testing.T) {
	root := t.TempDir()
	_ = os.WriteFile(filepath.Join(root, "unsareport.toml"), []byte("[project]\nconfig_version = 1\n"), 0o644)
	l5Dir := filepath.Join(root, "l5")
	_ = os.MkdirAll(l5Dir, 0o755)
	compDir := filepath.Join(root, "components")
	_ = os.MkdirAll(compDir, 0o755)

	if report, ok := inferReportFromCwd(root); ok || report != "" {
		t.Fatalf("expected no inferred report at root, got: %q, %v", report, ok)
	}

	if report, ok := inferReportFromCwd(l5Dir); !ok || report != "l5" {
		t.Fatalf("expected inferred report 'l5', got: %q, %v", report, ok)
	}

	if report, ok := inferReportFromCwd(compDir); ok || report != "" {
		t.Fatalf("expected no inferred report inside components, got: %q, %v", report, ok)
	}
}
