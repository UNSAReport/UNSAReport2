package scripts

import (
	"runtime"
	"testing"

	"github.com/UNSAReport/tui/internal/project"
)

func TestSelectOsMap(t *testing.T) {
	cmds := project.OSCommands{
		"any":     {"base echo"},
		"linux":   {"linux echo"},
		"windows": {"windows echo"},
		"macos":   {"macos echo"},
	}
	sel, err := Select(cmds, "zip:make", runtime.GOOS)
	if err != nil {
		t.Fatal(err)
	}
	if len(sel) != 2 || sel[0] != "base echo" {
		t.Fatalf("selected %q", sel)
	}
}

func TestSelectUnknownKey(t *testing.T) {
	cmds := project.OSCommands{"plan9": {"echo hi"}}
	if _, err := Select(cmds, "zip:make", ""); err == nil {
		t.Fatal("expected unknown-key error")
	}
}

func TestSelectZero(t *testing.T) {
	var other string
	switch runtime.GOOS {
	case "windows":
		other = "linux"
	case "darwin":
		other = "windows"
	default:
		other = "windows"
	}
	cmds := project.OSCommands{other: {"echo hi"}}
	if _, err := Select(cmds, "zip:make", ""); err == nil {
		t.Fatal("expected zero-selected error")
	}
}

func TestSplitPrefix(t *testing.T) {
	p, rest, err := SplitPrefix("[linux:] zip:make")
	if err != nil || p != "[linux:]" || rest != "zip:make" {
		t.Fatalf("got %q %q %v", p, rest, err)
	}
	p, rest, err = SplitPrefix("zip:make")
	if err != nil || p != "" || rest != "zip:make" {
		t.Fatalf("got %q %q %v", p, rest, err)
	}
	if _, _, err := SplitPrefix("[plan9:] zip:make"); err == nil {
		t.Fatal("expected unknown-prefix error")
	}
	if _, _, err := SplitPrefix("[linux: zip:make"); err == nil {
		t.Fatal("expected malformed-prefix error")
	}
}

func TestRunLinesZeroSelected(t *testing.T) {
	if err := RunLines(t.TempDir(), nil, ""); err == nil {
		t.Fatal("expected zero-selected error")
	}
}

func TestHookStandards(t *testing.T) {
	if !HookStandards["build"] || !HookStandards["check"] {
		t.Fatal("build/check must be hookable")
	}
	if HookStandards["init"] {
		t.Fatal("init must not be hookable")
	}
}
