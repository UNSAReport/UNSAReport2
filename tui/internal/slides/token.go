package slides

import (
	"os"
	"strings"

	"github.com/UNSAReport/tui/internal/auth"
	"github.com/UNSAReport/tui/internal/config"
)

// ResolveToken returns the ecosystem credential for slides API calls:
// explicit token, else the stored auth credential, else UNSAREP_TOKEN.
func ResolveToken(explicit string) string {
	if v := strings.TrimSpace(explicit); v != "" {
		return v
	}
	client := auth.NewClient()
	if tok := strings.TrimSpace(client.GetToken()); tok != "" {
		return tok
	}
	if v := strings.TrimSpace(os.Getenv(config.EnvToken)); v != "" {
		return v
	}
	return strings.TrimSpace(config.GetToken())
}
