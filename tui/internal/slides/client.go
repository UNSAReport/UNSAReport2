package slides

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"

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
	ZipBytes    []byte         `json:"-"`
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

// truncateSnippet collapses s to a single line and truncates it to n
// runes, appending "..." when truncated. It keeps service errors readable
// when the server returns a non-JSON body (e.g. an HTML error page).
func truncateSnippet(s string, n int) string {
	s = strings.Join(strings.Fields(s), " ")
	if r := []rune(s); len(r) > n {
		return string(r[:n]) + "..."
	}
	return s
}

// authHint annotates 401/403 slides errors: 401 means not logged in (bad,
// expired or missing token) while 403 means the token is valid but lacks
// the slides role. It names the TokenSource (flag/env/auth-store/config-file)
// so the operator knows which credential to refresh.
func authHint(statusCode int, token string) string {
	_, src := TokenSource(token)
	if src == "" {
		src = "none"
	}
	switch statusCode {
	case http.StatusUnauthorized:
		return fmt.Sprintf(" (not logged in? token source: %s)", src)
	case http.StatusForbidden:
		return fmt.Sprintf(" (missing slides role? token source: %s)", src)
	default:
		return ""
	}
}

// serviceError maps a non-2xx slides response to an error. JSON API errors
// keep their message; non-JSON bodies surface as a truncated 200-char raw
// snippet instead of being dropped.
func serviceError(statusCode int, status string, raw []byte, token string) error {
	var apiErr ErrorResponse
	if json.Unmarshal(raw, &apiErr) == nil && apiErr.Message != "" {
		return fmt.Errorf("slides service error (%d %s): %s%s", statusCode, apiErr.Error, apiErr.Message, authHint(statusCode, token))
	}
	if s := truncateSnippet(string(raw), 200); s != "" {
		return fmt.Errorf("slides service error: %s — body: %s%s", status, s, authHint(statusCode, token))
	}
	return fmt.Errorf("slides service error: %s%s", status, authHint(statusCode, token))
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
		raw, _ := io.ReadAll(io.LimitReader(resp.Body, 8<<10))
		return serviceError(resp.StatusCode, resp.Status, raw, token)
	}
	if out != nil {
		if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
			return fmt.Errorf("decode slides response: %w", err)
		}
	}
	return nil
}

func (c *Client) Deploy(ctx context.Context, token string, req *DeployRequest) (*DeployResponse, error) {
	if len(req.Slug) == 0 || len(req.Slug) > 100 || !slugRe.MatchString(req.Slug) {
		return nil, fmt.Errorf("invalid slug %q", req.Slug)
	}
	if len(req.ZipBytes) > 0 {
		return c.DeployMultipart(ctx, token, req, req.ZipBytes)
	}
	var out DeployResponse
	if err := c.doJSON(ctx, "POST", "/presentations/deploy", token, req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) DeployMultipart(ctx context.Context, token string, req *DeployRequest, zipBytes []byte) (*DeployResponse, error) {
	bodyBuf := new(bytes.Buffer)
	writer := multipart.NewWriter(bodyBuf)

	filePart, err := writer.CreateFormFile("bundle", "bundle.zip")
	if err != nil {
		return nil, fmt.Errorf("create bundle form field: %w", err)
	}
	if _, err := io.Copy(filePart, bytes.NewReader(zipBytes)); err != nil {
		return nil, fmt.Errorf("write bundle data: %w", err)
	}

	if err := writer.WriteField("slug", req.Slug); err != nil {
		return nil, fmt.Errorf("write slug field: %w", err)
	}
	if err := writer.WriteField("title", req.Title); err != nil {
		return nil, fmt.Errorf("write title field: %w", err)
	}
	if req.Description != "" {
		if err := writer.WriteField("description", req.Description); err != nil {
			return nil, fmt.Errorf("write description field: %w", err)
		}
	}
	if req.OrgSlug != "" {
		if err := writer.WriteField("orgSlug", req.OrgSlug); err != nil {
			return nil, fmt.Errorf("write orgSlug field: %w", err)
		}
	}
	if req.Visibility != "" {
		if err := writer.WriteField("visibility", req.Visibility); err != nil {
			return nil, fmt.Errorf("write visibility field: %w", err)
		}
	}
	if req.Manifest != nil {
		manifestBytes, err := json.Marshal(req.Manifest)
		if err != nil {
			return nil, fmt.Errorf("marshal manifest: %w", err)
		}
		if err := writer.WriteField("manifest", string(manifestBytes)); err != nil {
			return nil, fmt.Errorf("write manifest field: %w", err)
		}
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("close multipart writer: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.BaseURL+"/presentations/deploy", bodyBuf)
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", writer.FormDataContentType())
	httpReq.Header.Set("User-Agent", "unsarep-tui")
	c.setAuth(httpReq, token)

	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		log.Error("slides deploy request failed", "err", err)
		return nil, fmt.Errorf("slides service unreachable at %s: %w", c.BaseURL, err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Warn("slides deploy failed", "status", resp.StatusCode)
		raw, _ := io.ReadAll(io.LimitReader(resp.Body, 8<<10))
		return nil, serviceError(resp.StatusCode, resp.Status, raw, token)
	}

	var out DeployResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("decode slides deploy response: %w", err)
	}

	return &out, nil
}

func (c *Client) Reachable(ctx context.Context, token string) error {
	var out map[string]any
	return c.doJSON(ctx, "GET", "/orgs", token, nil, &out)
}
