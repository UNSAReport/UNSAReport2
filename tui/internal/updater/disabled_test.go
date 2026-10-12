package updater

import (
	"os"
	"testing"

	"github.com/UNSAReport/tui/internal/config"
)

func TestIsAutoUpdateDisabled_Env(t *testing.T) {
	orig := os.Getenv(config.EnvDisableAutoUpdate)
	defer os.Setenv(config.EnvDisableAutoUpdate, orig)

	os.Setenv(config.EnvDisableAutoUpdate, "1")
	disabled, reason := IsAutoUpdateDisabled()
	if !disabled {
		t.Errorf("expected disabled=true when %s=1", config.EnvDisableAutoUpdate)
	}
	if reason != "automatic updates are disabled" {
		t.Errorf("expected reason 'automatic updates are disabled', got %q", reason)
	}

	os.Setenv(config.EnvDisableAutoUpdate, "0")
	disabled, _ = IsAutoUpdateDisabled()
	if disabled {
		t.Errorf("expected disabled=false when %s=0", config.EnvDisableAutoUpdate)
	}
}
