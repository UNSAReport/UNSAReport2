package auth

import (
	"context"
	"errors"
	"os"

	"github.com/UNSAReport/tui/internal/config"
)

var ErrAuthRequired = errors.New("not authenticated — run 'unsarep auth login'")

func RequireAuth(ctx context.Context, c *Client, prompt bool) (*Credentials, error) {
	tok := ""
	if v := os.Getenv(config.EnvToken); v != "" {
		tok = v
	} else if c != nil {
		tok = c.GetToken()
	}
	if tok != "" {
		if cred, _, err := c.Status(ctx); err == nil {
			return cred, nil
		}
		if c.Store != nil {
			if cred, err := c.Store.Get(); err == nil {
				return cred, nil
			}
		}
		return &Credentials{PAT: tok}, nil
	}
	_ = prompt
	return nil, ErrAuthRequired
}
