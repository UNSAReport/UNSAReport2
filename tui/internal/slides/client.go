package slides

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/charmbracelet/log"

	"github.com/UNSAReport/tui/internal/config"
)

type DeployRequest struct {
	Slug        string         `json:"slug"`
	Title       string         `json:"title"`
	Description string         `json:"description,omitempty"`
	OrgSlug     string         `json:"orgSlug,omitempty"`
	Visibility  string         `json:"visibility,omitempty"`
	Manifest    map[string]any `json:"manifest"`
	Bundle      string         `json:"bundle"`
}

type DeployResponse struct {
	Success        bool   `json:"success"`
	PresentationID string `json:"presentationId"`
	Slug           string `json:"slug"`
	Version        int    `json:"version"`
	URL            string `json:"url"`
	Message        string `json:"message"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewClient() (*Client, error) {
	base, err := config.ResolveSlidesURL()
	if err != nil {
		return nil, fmt.Errorf("slides configuration error: %w", err)
	}
	return &Client{
		BaseURL:    base,
		HTTPClient: &http.Client{Timeout: config.RegistryTimeout},
	}, nil
}

func (c *Client) authToken() string {
	return ResolveToken("")
}

func (c *Client) setAuth(req *http.Request, token string) {
	tok := token
	if tok == "" {
		tok = c.authToken()
	}
	if tok != "" {
		req.Header.Set("Authorization", "Bearer "+tok)
	}
}

func (c *Client) doJSON(ctx context.Context, method, path, token string, payload any, out any) error {
	var body *bytes.Reader
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		body = bytes.NewReader(b)
	} else {
		body = bytes.NewReader(nil)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.BaseURL+path, body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "unsarep-tui")
	c.setAuth(req, token)
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		log.Error("slides request failed", "err", err, "path", path)
		return fmt.Errorf("slides service unreachable at %s: %w", c.BaseURL, err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Warn("slides request failed", "status", resp.StatusCode, "path", path)
		var apiErr ErrorResponse
		if json.NewDecoder(resp.Body).Decode(&apiErr) == nil && apiErr.Message != "" {
			return fmt.Errorf("slides service error (%d %s): %s", resp.StatusCode, apiErr.Error, apiErr.Message)
		}
		return fmt.Errorf("slides service error: %s", resp.Status)
	}
	if out != nil {
		if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
			return fmt.Errorf("decode slides response: %w", err)
		}
	}
	return nil
}

func (c *Client) Deploy(ctx context.Context, token string, req *DeployRequest) (*DeployResponse, error) {
	var out DeployResponse
	if err := c.doJSON(ctx, "POST", "/presentations/deploy", token, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) Reachable(ctx context.Context, token string) error {
	var out map[string]any
	return c.doJSON(ctx, "GET", "/orgs", token, nil, &out)
}
