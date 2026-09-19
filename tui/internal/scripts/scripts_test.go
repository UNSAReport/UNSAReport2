package scripts

import (
	"runtime"
	"strings"
	"testing"

	"github.com/UNSAReport/tui/internal/project"
)

func currentKey(t *testing.T) string {
	t.Helper()
	k, err := osKey("")
	if err != nil {
		t.Fatal(err)
	}
	return k
}

func TestSelectOsMap(t *testing.T) {
	cmds := project.ScriptCommands{
		"any":     "base echo",
		"linux":   "linux echo",
		"windows": "windows echo",
		"macos":   "macos echo",
	}
	sel, err := Select(cmds, "zip:make", runtime.GOOS)
	if err != nil {
		t.Fatal(err)
	}
	parts := strings.Split(sel, "\n")
	if len(parts) != 2 || parts[0] != "base echo" {
		t.Fatalf("selected %q", sel)
	}
	want := map[string]string{"linux": "linux echo", "darwin": "macos echo", "windows": "windows echo"}[runtime.GOOS]
	if parts[1] != want {
		t.Fatalf("selected %q want second %q", sel, want)
	}
}

func TestSelectAnyOnly(t *testing.T) {
	sel, err := Select(project.ScriptCommands{"any": "base echo"}, "zip:make", "")
	if err != nil {
		t.Fatal(err)
	}
	if sel != "base echo" {
		t.Fatalf("selected %q", sel)
	}
}

func TestSelectUnknownKey(t *testing.T) {
	cmds := project.ScriptCommands{"plan9": "echo hi"}
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
	cmds := project.ScriptCommands{other: "echo hi"}
	if _, err := Select(cmds, "zip:make", ""); err == nil {
		t.Fatal("expected zero-selected error")
	}
	if _, err := Select(project.ScriptCommands{"any": "  \n "}, "zip:make", ""); err == nil {
		t.Fatal("expected blank-command error")
	}
}

func TestSplitPrefix(t *testing.T) {
	p, rest, err := SplitPrefix("os:linux zip:make")
	if err != nil || p != "linux" || rest != "zip:make" {
		t.Fatalf("got %q %q %v", p, rest, err)
	}
	p, rest, err = SplitPrefix("zip:make")
	if err != nil || p != "" || rest != "zip:make" {
		t.Fatalf("got %q %q %v", p, rest, err)
	}
	p, rest, err = SplitPrefix("os:linux")
	if err != nil || p != "" || rest != "os:linux" {
		t.Fatalf("key without alias stays bare: %q %q %v", p, rest, err)
	}
	if _, _, err := SplitPrefix("os:plan9 zip:make"); err == nil {
		t.Fatal("expected unknown-prefix error")
	}
	if _, _, err := SplitPrefix("[linux:] zip:make"); err == nil {
		t.Fatal("expected retired-bracket error")
	}
}

func TestHookApplies(t *testing.T) {
	cur := currentKey(t)
	for _, k := range []string{"", "any", cur} {
		ok, err := HookApplies(k)
		if err != nil || !ok {
			t.Fatalf("key %q must apply: %v", k, err)
		}
	}
	other := "linux"
	if cur == "linux" {
		other = "windows"
	}
	if ok, err := HookApplies(other); err != nil || ok {
		t.Fatalf("key %q must not apply here: %v", other, err)
	}
	if _, err := HookApplies("plan9"); err == nil {
		t.Fatal("expected unknown-key error")
	}
}

func TestRunScriptBlank(t *testing.T) {
	if err := RunScript(t.TempDir(), "", ""); err == nil {
		t.Fatal("expected blank-command error")
	}
	if err := RunScript(t.TempDir(), "  \n\t\n", ""); err == nil {
		t.Fatal("expected blank-command error")
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
