package slides

import (
	"os"
	"strings"

	"github.com/UNSAReport/tui/internal/auth"
	"github.com/UNSAReport/tui/internal/config"
)

func ResolveToken(explicit string) string {
	if v := strings.TrimSpace(explicit); v != "" {
		return v
	}
	if client, err := auth.NewClient(); err == nil && client != nil {
		if tok := strings.TrimSpace(client.GetToken()); tok != "" {
			return tok
		}
	}
	if v := strings.TrimSpace(os.Getenv(config.EnvToken)); v != "" {
		return v
	}
	return strings.TrimSpace(config.GetToken())
}
