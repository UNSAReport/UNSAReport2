package updater

import (
	"os"

	"github.com/UNSAReport/tui/internal/config"
)

const ReasonUpdatesDisabled = "automatic updates are disabled"

func IsAutoUpdateDisabled() (bool, string) {
	if os.Getenv(config.EnvDisableAutoUpdate) == "1" {
		return true, ReasonUpdatesDisabled
	}

	return false, ""
}
