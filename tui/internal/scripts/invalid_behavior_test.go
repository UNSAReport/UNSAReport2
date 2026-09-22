package scripts

import (
	"strings"
	"testing"

	"github.com/UNSAReport/tui/internal/project"
)

func TestInvalidEmptyMap(t *testing.T) {
	if _, err := Select(project.ScriptCommands{}, "zip:make", ""); err == nil || !strings.Contains(err.Error(), "selects no command") {
		t.Fatalf("expected no-command error, got %v", err)
	}
}

func TestInvalidNonZeroExit(t *testing.T) {
	err := RunScript(t.TempDir(), "exit 3", "", nil)
	if err == nil || !strings.Contains(err.Error(), "exit status 3") {
		t.Fatalf("expected exit-3 error, got %v", err)
	}
}
