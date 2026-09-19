package registry

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/UNSAReport/tui/internal/auth"
	"github.com/UNSAReport/tui/internal/config"
)

type PackageInfo struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Version     string   `json:"version"`
	Versions    []string `json:"versions"`
}

type ResolvedPackage struct {
	Name       string   `json:"name"`
	Version    string   `json:"version"`
	ArchiveURL string   `json:"archive_url"`
	Files      []string `json:"files"`
}

type Client struct {
	BaseURL    string
	HTTPClient *http.Client
	CachePath  string
}

func NewClient() *Client {
	base := config.GetRegistryURL()
	base = strings.TrimSuffix(base, "/")
	cache := filepath.Join(xdgCacheDir(), config.CacheFileName)
	return &Client{
		BaseURL:    base,
		HTTPClient: &http.Client{Timeout: config.RegistryTimeout},
		CachePath:  cache,
	}
}

func xdgCacheDir() string {
	if v := os.Getenv(config.EnvXDGCacheHome); v != "" {
		return filepath.Join(v, config.AppDirName)
	}
	if d, err := os.UserCacheDir(); err == nil && d != "" {
		return filepath.Join(d, config.AppDirName)
	}
	if home, _ := os.UserHomeDir(); home != "" {
		return filepath.Join(home, ".cache", config.AppDirName)
	}
	return ""
}

func (c *Client) authToken() string {
	if v := strings.TrimSpace(os.Getenv(config.EnvToken)); v != "" {
		return v
	}
	if tok := strings.TrimSpace(auth.GetTokenResolved(nil)); tok != "" {
		return tok
	}
	if tok := strings.TrimSpace(config.GetToken()); tok != "" {
		return tok
	}
	return ""
}

func (c *Client) setAuth(req *http.Request) {
	if tok := c.authToken(); tok != "" {
		req.Header.Set("Authorization", "Bearer "+tok)
	}
}

func (c *Client) ListPackages(ctx context.Context) ([]PackageInfo, error) {
	base, err := c.base()
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s%s?limit=%d", base, config.RegistryPackagesPath, config.DefaultRegistryLimit), nil)
	if err != nil {
		return nil, fmt.Errorf("registry unavailable: %w", err)
	}
	req.Header.Set("User-Agent", "unsarep-tui")
	c.setAuth(req)
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("registry unavailable: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("registry unavailable: status %d", resp.StatusCode)
	}
	var out struct {
		Packages []PackageInfo `json:"packages"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("registry unavailable: decode %w", err)
	}
	return out.Packages, nil
}

func (c *Client) base() (string, error) {
	if c.BaseURL == "" {
		return "", fmt.Errorf("registry unavailable: no registry URL configured")
	}
	return c.BaseURL, nil
}

func encodePackageName(name string) string {
	segs := strings.Split(name, "/")
	for i, s := range segs {
		segs[i] = url.PathEscape(s)
	}
	return strings.Join(segs, "/")
}

func (c *Client) Resolve(ctx context.Context, reqs map[string]string) ([]ResolvedPackage, error) {
	base, err := c.base()
	if err != nil {
		return nil, err
	}
	body, _ := json.Marshal(map[string]any{"packages": reqs})
	req, err := http.NewRequestWithContext(ctx, "POST", base+"/v1/resolve", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("registry unavailable: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "unsarep-tui")
	c.setAuth(req)
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("registry unavailable: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("registry unavailable: status %d", resp.StatusCode)
	}
	var out struct {
		Resolved []ResolvedPackage `json:"resolved"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("registry unavailable: decode %w", err)
	}
	return out.Resolved, nil
}

func (c *Client) ResolveVersion(ctx context.Context, name, rangeSpec string) (string, error) {
	if rangeSpec == "" {
		rangeSpec = "*"
	}
	resolved, err := c.Resolve(ctx, map[string]string{name: rangeSpec})
	if err != nil {
		return "", err
	}
	for _, r := range resolved {
		if strings.EqualFold(r.Name, name) {
			return r.Version, nil
		}
	}
	if len(resolved) > 0 {
		return resolved[0].Version, nil
	}
	return "", fmt.Errorf("no version resolved for %q", name)
}

func (c *Client) DownloadSection(ctx context.Context, name, version, section string) (map[string][]byte, error) {
	base, err := c.base()
	if err != nil {
		return nil, err
	}
	if section != "components" && section != "templates" {
		return nil, fmt.Errorf("unknown section %q", section)
	}
	u := fmt.Sprintf("%s/v1/%s/%s/archive?section=%s", base, encodePackageName(name), url.PathEscape(version), section)
	req, err := http.NewRequestWithContext(ctx, "GET", u, nil)
	if err != nil {
		return nil, fmt.Errorf("create archive request: %w", err)
	}
	req.Header.Set("User-Agent", "unsarep-tui")
	c.setAuth(req)
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("archive metadata request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("get archive URL failed: status %d", resp.StatusCode)
	}
	var archiveResp struct {
		ArchiveURL string `json:"archive_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&archiveResp); err != nil {
		return nil, fmt.Errorf("decode archive response: %w", err)
	}
	if archiveResp.ArchiveURL == "" {
		return nil, fmt.Errorf("empty archive URL received")
	}
	downReq, err := http.NewRequestWithContext(ctx, "GET", archiveResp.ArchiveURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create download request: %w", err)
	}
	downResp, err := c.HTTPClient.Do(downReq)
	if err != nil {
		return nil, fmt.Errorf("download archive: %w", err)
	}
	defer func() { _ = downResp.Body.Close() }()
	if downResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download archive failed: status %d", downResp.StatusCode)
	}
	archiveBytes, err := io.ReadAll(downResp.Body)
	if err != nil {
		return nil, fmt.Errorf("read archive body: %w", err)
	}
	zr, err := zip.NewReader(bytes.NewReader(archiveBytes), int64(len(archiveBytes)))
	if err != nil {
		return nil, fmt.Errorf("open zip reader: %w", err)
	}
	out := map[string][]byte{}
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		if strings.Contains(f.Name, "..") || filepath.IsAbs(f.Name) {
			return nil, fmt.Errorf("illegal file path in zip: %s", f.Name)
		}
		rc, err := f.Open()
		if err != nil {
			return nil, fmt.Errorf("open zip file %s: %w", f.Name, err)
		}
		b, err := io.ReadAll(rc)
		_ = rc.Close()
		if err != nil {
			return nil, fmt.Errorf("read zip file %s: %w", f.Name, err)
		}
		out[f.Name] = b
	}
	return out, nil
}

func zipAll(pkgDir string) ([]byte, []string, error) {
	var names []string
	err := filepath.WalkDir(pkgDir, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(pkgDir, p)
		if err != nil {
			return err
		}
		if rel == "." {
			return nil
		}
		if strings.HasPrefix(rel, ".git"+string(os.PathSeparator)) || rel == ".git" {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if d.IsDir() {
			return nil
		}
		names = append(names, filepath.ToSlash(rel))
		return nil
	})
	if err != nil {
		return nil, nil, err
	}
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for _, n := range names {
		b, err := os.ReadFile(filepath.Join(pkgDir, filepath.FromSlash(n)))
		if err != nil {
			_ = zw.Close()
			return nil, nil, err
		}
		w, err := zw.Create(n)
		if err != nil {
			_ = zw.Close()
			return nil, nil, err
		}
		if _, err := w.Write(b); err != nil {
			_ = zw.Close()
			return nil, nil, err
		}
	}
	if err := zw.Close(); err != nil {
		return nil, nil, err
	}
	return buf.Bytes(), names, nil
}

func (c *Client) Publish(ctx context.Context, pkgDir, componentsGlob, templatesGlob string) error {
	base, err := c.base()
	if err != nil {
		return err
	}
	pkgText, compDir, err := resolvePublishSource(pkgDir)
	if err != nil {
		return err
	}
	_ = componentsGlob
	_ = templatesGlob
	var reqBody bytes.Buffer
	mw := multipart.NewWriter(&reqBody)
	fw, err := mw.CreateFormField("pkg")
	if err != nil {
		return fmt.Errorf("create pkg field: %w", err)
	}
	if _, err := fw.Write([]byte(pkgText)); err != nil {
		return fmt.Errorf("write pkg field: %w", err)
	}
	compZip, _, err := zipAll(compDir)
	if err != nil {
		return err
	}
	fz, err := mw.CreateFormFile("components", "components.zip")
	if err != nil {
		return fmt.Errorf("create components field: %w", err)
	}
	if _, err := fz.Write(compZip); err != nil {
		return fmt.Errorf("write components zip: %w", err)
	}
	if err := mw.Close(); err != nil {
		return fmt.Errorf("close multipart writer: %w", err)
	}
	u := fmt.Sprintf("%s/v1/packages", base)
	req, err := http.NewRequestWithContext(ctx, "POST", u, &reqBody)
	if err != nil {
		return fmt.Errorf("create upload request: %w", err)
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.Header.Set("User-Agent", "unsarep-tui")
	c.setAuth(req)
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("publish request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		var errObj struct {
			Error   string `json:"error"`
			Message string `json:"message"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&errObj); err == nil && errObj.Message != "" {
			return fmt.Errorf("publish failed (%d): %s", resp.StatusCode, errObj.Message)
		}
		return fmt.Errorf("publish failed: status %d", resp.StatusCode)
	}
	return nil
}
