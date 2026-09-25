package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/charmbracelet/log"
)

type UserInfo struct {
	ID    string            `json:"id"`
	Name  string            `json:"name"`
	Email string            `json:"email"`
	Roles map[string]string `json:"roles,omitempty"`
}

type ClientConfig struct {
	IDPIssuer  string
	HTTPClient *http.Client
	Store      Store
}

type Client struct {
	BaseURL    string
	HTTPClient *http.Client
	Store      Store
}

func NewClient() (*Client, error) {
	iss, err := config.ResolveAuthURL()
	if err != nil {
		return nil, fmt.Errorf("auth configuration error: %w", err)
	}
	return NewClientWithConfig(ClientConfig{
		IDPIssuer:  iss,
		HTTPClient: &http.Client{Timeout: config.AuthTimeout},
		Store:      NewStore(),
	})
}

func NewClientWithConfig(cfg ClientConfig) (*Client, error) {
	iss := cfg.IDPIssuer
	if iss == "" {
		var err error
		iss, err = config.ResolveAuthURL()
		if err != nil {
			return nil, fmt.Errorf("auth configuration error: %w", err)
		}
	} else {
		var err error
		iss, err = config.ValidateURL(iss, "IDPIssuer")
		if err != nil {
			return nil, fmt.Errorf("auth configuration error: %w", err)
		}
	}
	httpc := cfg.HTTPClient
	if httpc == nil {
		httpc = &http.Client{Timeout: config.AuthTimeout}
	}
	store := cfg.Store
	if store == nil {
		store = NewStore()
	}
	return &Client{BaseURL: iss, HTTPClient: httpc, Store: store}, nil
}

func websiteBase() (string, error) {
	return config.ResolveWebsiteURL()
}

func (c *Client) resolveToken() string {
	if v := strings.TrimSpace(os.Getenv(config.EnvToken)); v != "" {
		return v
	}
	if c.Store != nil {
		if cred, err := c.Store.Get(); err == nil && cred != nil && cred.PAT != "" {
			return cred.PAT
		}
	}
	return strings.TrimSpace(config.GetToken())
}

func (c *Client) Whoami(ctx context.Context) (UserInfo, error) {
	u, _, err := c.whoamiWithToken(ctx, c.resolveToken())
	return u, err
}

func (c *Client) whoamiWithToken(ctx context.Context, token string) (UserInfo, map[string]string, error) {
	if strings.TrimSpace(token) == "" {
		return UserInfo{}, nil, fmt.Errorf("not logged in")
	}
	req, err := http.NewRequestWithContext(ctx, "GET", c.BaseURL+"/v1/me", nil)
	if err != nil {
		return UserInfo{}, nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("User-Agent", "unsarep-tui")
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		log.Error("auth request failed", "err", err, "path", "/v1/me")
		return UserInfo{}, nil, fmt.Errorf("auth service unreachable at %s: %w", c.BaseURL, err)
	}
	body, _ := readAll(resp)
	if resp.StatusCode != 200 {
		log.Warn("auth request failed", "status", resp.StatusCode, "path", "/v1/me")
		return UserInfo{}, nil, fmt.Errorf("whoami failed: %d body %s", resp.StatusCode, string(body))
	}
	var env struct {
		User  *UserInfo         `json:"user"`
		Roles map[string]string `json:"roles"`
		Data  *UserInfo         `json:"data"`
	}
	if err := json.Unmarshal(body, &env); err == nil {
		if env.User != nil && env.User.ID != "" {
			if env.Roles != nil {
				env.User.Roles = env.Roles
			}
			return *env.User, env.User.Roles, nil
		}
		if env.Data != nil && env.Data.ID != "" {
			return *env.Data, env.Data.Roles, nil
		}
	}
	var u UserInfo
	if err := json.Unmarshal(body, &u); err == nil && u.ID != "" {
		return u, u.Roles, nil
	}
	return UserInfo{}, nil, fmt.Errorf("unexpected whoami shape: %s", string(body))
}

func readAll(resp *http.Response) ([]byte, error) {
	defer func() { _ = resp.Body.Close() }()
	buf := make([]byte, 0, 1024)
	tmp := make([]byte, 1024)
	for {
		n, err := resp.Body.Read(tmp)
		if n > 0 {
			buf = append(buf, tmp[:n]...)
		}
		if err != nil {
			break
		}
	}
	return buf, nil
}

func (c *Client) ValidateAndStore(ctx context.Context, pat string) (*Credentials, error) {
	pat = strings.TrimSpace(pat)
	if pat == "" {
		return nil, fmt.Errorf("empty token")
	}
	u, roles, err := c.whoamiWithToken(ctx, pat)
	if err != nil {
		return nil, err
	}
	cred := &Credentials{
		PAT:       pat,
		UserID:    u.ID,
		Email:     u.Email,
		Name:      u.Name,
		Roles:     roles,
		CreatedAt: time.Now(),
	}
	if u.Roles != nil && cred.Roles == nil {
		cred.Roles = u.Roles
	}
	if c.Store != nil {
		if err := c.Store.Set(cred); err != nil {
			return nil, err
		}
	} else if err := config.SaveToken(pat); err != nil {
		return nil, err
	}
	return cred, nil
}

func (c *Client) Status(ctx context.Context) (*Credentials, *UserInfo, error) {
	tok := c.resolveToken()
	if tok == "" {
		return nil, nil, fmt.Errorf("not logged in")
	}
	var stored *Credentials
	if c.Store != nil {
		if cc, err := c.Store.Get(); err == nil {
			stored = cc
		}
	}
	u, roles, err := c.whoamiWithToken(ctx, tok)
	if err != nil {
		if v := strings.TrimSpace(os.Getenv(config.EnvToken)); v != "" && stored != nil && v == tok && stored.PAT != v {
			return nil, nil, err
		}
		if stored != nil {
			return stored, nil, fmt.Errorf("offline: %w", err)
		}
		return nil, nil, err
	}
	u.Roles = roles
	if stored == nil {
		stored = &Credentials{PAT: tok, UserID: u.ID, Email: u.Email, Name: u.Name, Roles: roles, CreatedAt: time.Now()}
	} else {
		stored.UserID = u.ID
		stored.Email = u.Email
		stored.Name = u.Name
		stored.Roles = roles
	}
	return stored, &u, nil
}

type LoginFlow struct {
	CallbackServer *CallbackServer
	AuthURL        string
	State          string
	CallbackURL    string
}

func (c *Client) StartLoginFlow() (*LoginFlow, error) {
	state, err := GenerateState()
	if err != nil {
		return nil, err
	}
	cb := NewCallbackServer(state)
	cbURL, err := cb.Start()
	if err != nil {
		return nil, err
	}
	website, err := websiteBase()
	if err != nil {
		return nil, fmt.Errorf("auth login configuration error: %w", err)
	}
	authURL := fmt.Sprintf("%s/auth/login?tui_callback=%s&state=%s", website, url.QueryEscape(cbURL), url.QueryEscape(state))
	return &LoginFlow{
		CallbackServer: cb,
		AuthURL:        authURL,
		State:          state,
		CallbackURL:    cbURL,
	}, nil
}

func (c *Client) FinishLoginFlow(ctx context.Context, flow *LoginFlow) (*Credentials, error) {
	defer flow.CallbackServer.Close()
	res, err := flow.CallbackServer.Wait(config.CallbackTimeout)
	if err != nil {
		return nil, err
	}
	if res.PAT == "" {
		return nil, fmt.Errorf("callback did not contain pat")
	}
	return c.ValidateAndStore(ctx, res.PAT)
}

func (c *Client) Login(ctx context.Context, noBrowser bool) (*Credentials, error) {
	flow, err := c.StartLoginFlow()
	if err != nil {
		return nil, err
	}
	defer flow.CallbackServer.Close()

	if noBrowser || IsHeadless() {
		fmt.Printf("Open this URL in your browser:\n  %s\n\nWaiting for callback at %s (timeout 5m)...\n", flow.AuthURL, flow.CallbackURL)
		res, err := flow.CallbackServer.Wait(config.CallbackTimeout)
		if err == nil && res.PAT != "" {
			return c.ValidateAndStore(ctx, res.PAT)
		}
		if err != nil {
			return nil, err
		}
		return nil, fmt.Errorf("no callback received; paste PAT via 'unsarep auth login --token <PAT>'")
	}

	if err := OpenBrowser(flow.AuthURL); err != nil {
		fmt.Printf("Failed to open browser: %v\nOpen this URL:\n  %s\n\n", err, flow.AuthURL)
	}
	fmt.Printf("Opened browser to %s\nWaiting for login (timeout 5m)...\n", flow.AuthURL)

	res, err := flow.CallbackServer.Wait(config.CallbackTimeout)
	if err != nil {
		return nil, err
	}
	if res.PAT == "" {
		return nil, fmt.Errorf("callback did not contain pat")
	}
	return c.ValidateAndStore(ctx, res.PAT)
}

func (c *Client) LoginWithToken(ctx context.Context, token string) (*Credentials, error) {
	return c.ValidateAndStore(ctx, token)
}

func (c *Client) GetToken() string { return c.resolveToken() }
func (c *Client) IsLoggedIn() bool { return c.GetToken() != "" }

func (c *Client) Logout() error {
	tok := c.resolveToken()
	var errs []error
	if tok != "" {
		if err := c.revokePat(tok); err != nil {
			errs = append(errs, err)
		}
	}
	if err := os.Unsetenv(config.EnvToken); err != nil {
		errs = append(errs, err)
	}
	if c.Store != nil {
		if err := c.Store.Clear(); err != nil {
			errs = append(errs, err)
		}
	}
	if err := config.ClearToken(); err != nil {
		errs = append(errs, err)
	}
	return errors.Join(errs...)
}

func (c *Client) revokePat(tok string) error {
	body, _ := json.Marshal(map[string]string{"pat": tok})
	req, err := http.NewRequest("POST", c.BaseURL+"/v1/logout", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+tok)
	req.Header.Set("User-Agent", "unsarep-tui")
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		log.Error("auth request failed", "err", err, "path", "/v1/logout")
		return err
	}
	defer func() {
		if cerr := resp.Body.Close(); cerr != nil {
			log.Error("auth response close failed", "err", cerr, "path", "/v1/logout")
		}
	}()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Warn("auth request failed", "status", resp.StatusCode, "path", "/v1/logout")
		return fmt.Errorf("logout failed with status %d", resp.StatusCode)
	}
	return nil
}
