package scripts

import (
	"runtime"
	"testing"
)

func TestSelectFiltersOS(t *testing.T) {
	lines := []string{
		"bare echo",
		"[any:] any echo",
		"[linux:] linux echo",
		"[windows:] windows echo",
		"[macos:] macos echo",
	}
	sel, err := Select(lines, runtime.GOOS)
	if err != nil {
		t.Fatal(err)
	}
	if len(sel) != 3 {
		t.Fatalf("selected %q", sel)
	}
	if sel[0] != "bare echo" || sel[1] != "any echo" {
		t.Fatalf("order/content %q", sel)
	}
}

func TestSelectUnknownPrefix(t *testing.T) {
	if _, err := Select([]string{"[foo:] x"}, ""); err == nil {
		t.Fatal("expected unknown-prefix error")
	}
}

func TestRunLinesZeroSelected(t *testing.T) {
	var other string
	switch runtime.GOOS {
	case "windows":
		other = "[linux:] echo hi"
	case "darwin":
		other = "[windows:] echo hi"
	default:
		other = "[windows:] echo hi"
	}
	if err := RunLines(t.TempDir(), []string{other}, ""); err == nil {
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
