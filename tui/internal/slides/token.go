package slides

import (
	"os"
	"strings"

	"github.com/UNSAReport/tui/internal/auth"
	"github.com/UNSAReport/tui/internal/config"
)

// Token precedence: explicit flag value -> UNSAREP_TOKEN env var ->
// auth-client store -> config file. The env var beats a stale auth-store
// token so CI/operator overrides always win over cached credentials.
func ResolveToken(explicit string) string {
	token, _ := TokenSource(explicit)
	return token
}

// TokenSource resolves the deploy token and reports where it came from:
// "flag" (explicit argument), "env" (UNSAREP_TOKEN), "auth-store"
// (auth-client credentials), "config-file" (config file), or "" when no
// token is configured. Useful for error messages that tell the operator
// which credential to refresh.
func TokenSource(explicit string) (token, source string) {
	if v := strings.TrimSpace(explicit); v != "" {
		return v, "flag"
	}
	if v := strings.TrimSpace(os.Getenv(config.EnvToken)); v != "" {
		return v, "env"
	}
	if client, err := auth.NewClient(); err == nil && client != nil {
		if tok := strings.TrimSpace(client.GetToken()); tok != "" {
			return tok, "auth-store"
		}
	}
	if v := strings.TrimSpace(config.GetToken()); v != "" {
		return v, "config-file"
	}
	return "", ""
}
