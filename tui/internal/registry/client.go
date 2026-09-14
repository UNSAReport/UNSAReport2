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

	"github.com/Masterminds/semver/v3"
	"github.com/UNSAReport/tui/internal/auth"
	"github.com/UNSAReport/tui/internal/config"
)

type TemplateInfo struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Version     string            `json:"version"`
	Path        string            `json:"path"`
	DistTags    map[string]string `json:"distTags,omitempty"`
	Versions    map[string]string `json:"versions,omitempty"`
	Tags        []string          `json:"tags,omitempty"`
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

func (c *Client) ListTemplates(ctx context.Context) ([]TemplateInfo, error) {
	if c.BaseURL == "" || strings.Contains(c.BaseURL, "github") {
		return nil, fmt.Errorf("registry unavailable: no registry URL configured")
	}
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s%s?limit=%d", c.BaseURL, config.RegistryPackagesPath, config.DefaultRegistryLimit), nil)
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
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("registry unavailable: status %d", resp.StatusCode)
	}
	var raw map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, fmt.Errorf("registry unavailable: decode %w", err)
	}
	b, _ := json.Marshal(raw)
	var p2 struct {
		Packages []TemplateInfo `json:"packages"`
		Total    int            `json:"total"`
	}
	if err2 := json.Unmarshal(b, &p2); err2 == nil && len(p2.Packages) > 0 {
		_ = os.MkdirAll(filepath.Dir(c.CachePath), config.PermDirPrivate)
		_ = os.WriteFile(c.CachePath, b, config.PermFilePrivate)
		return p2.Packages, nil
	}
	if pkgs, ok := raw["packages"].([]any); ok {
		var out []TemplateInfo
		for _, pa := range pkgs {
			if m, ok := pa.(map[string]any); ok {
				ti := TemplateInfo{}
				if v, ok := m["name"].(string); ok {
					ti.Name = v
				}
				if v, ok := m["description"].(string); ok {
					ti.Description = v
				}
				if v, ok := m["displayName"].(string); ok && ti.Description == "" {
					ti.Description = v
				}
				out = append(out, ti)
			}
		}
		if len(out) > 0 {
			return out, nil
		}
	}
	return nil, fmt.Errorf("registry unavailable: empty packages")
}


func (c *Client) GetTemplate(ctx context.Context, name string) (TemplateInfo, error) {
	name = strings.ToLower(name)
	if c.BaseURL == "" || strings.Contains(c.BaseURL, "github") {
		return TemplateInfo{}, fmt.Errorf("registry unavailable: no registry URL configured")
	}
	u := fmt.Sprintf("%s/v1/packages/%s", c.BaseURL, url.PathEscape(name))
	req, err := http.NewRequestWithContext(ctx, "GET", u, nil)
	if err != nil {
		return TemplateInfo{}, fmt.Errorf("registry unavailable: %w", err)
	}
	req.Header.Set("User-Agent", "unsarep-tui")
	c.setAuth(req)
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return TemplateInfo{}, fmt.Errorf("registry unavailable: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	switch resp.StatusCode {
	case 200:
		var pkg TemplateInfo
		var raw map[string]any
		if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
			return TemplateInfo{}, fmt.Errorf("registry unavailable: decode %w", err)
		}
		b, _ := json.Marshal(raw)
		_ = json.Unmarshal(b, &pkg)
		if pkg.Name == "" {
			if v, ok := raw["name"].(string); ok {
				pkg.Name = v
			}
		}
		if pkg.Description == "" {
			if v, ok := raw["description"].(string); ok {
				pkg.Description = v
			}
		}
		if vs, ok := raw["versions"].([]any); ok {
			m := make(map[string]string)
			for _, v := range vs {
				if s, ok := v.(string); ok {
					m[s] = s
				}
			}
			pkg.Versions = m
		}
		if pkg.Name != "" {
			return pkg, nil
		}
		return TemplateInfo{}, fmt.Errorf("registry unavailable: empty template name")
	case 404:
		return TemplateInfo{}, fmt.Errorf("template %q not found", name)
	default:
		return TemplateInfo{}, fmt.Errorf("registry unavailable: status %d", resp.StatusCode)
	}
}

func (c *Client) GetTemplateVersion(ctx context.Context, name, rangeSpec string) (TemplateInfo, error) {
	info, err := c.GetTemplate(ctx, name)
	if err != nil {
		return TemplateInfo{}, err
	}
	var versionsMap map[string]*semver.Version
	var distTags map[string]*semver.Version

	versionsMap = make(map[string]*semver.Version)
	for ver := range info.Versions {
		if v, err := semver.NewVersion(ver); err == nil {
			versionsMap[ver] = v
		}
	}
	distTags = make(map[string]*semver.Version)
	for tag, verStr := range info.DistTags {
		if v, err := semver.NewVersion(verStr); err == nil {
			distTags[tag] = v
		}
	}
	if len(versionsMap) == 0 && c.BaseURL != "" {
		u := fmt.Sprintf("%s/v1/packages/%s/versions", c.BaseURL, url.PathEscape(strings.ToLower(name)))
		req, err := http.NewRequestWithContext(ctx, "GET", u, nil)
		if err == nil {
			req.Header.Set("User-Agent", "unsarep-tui")
			c.setAuth(req)
			resp, err := c.HTTPClient.Do(req)
			if err == nil {
				defer func() { _ = resp.Body.Close() }()
				if resp.StatusCode == 200 {
					var payload struct {
						Versions []struct {
							Version string `json:"version"`
						} `json:"versions"`
					}
					if err := json.NewDecoder(resp.Body).Decode(&payload); err == nil {
						for _, v := range payload.Versions {
							if sv, err := semver.NewVersion(v.Version); err == nil {
								versionsMap[v.Version] = sv
							}
						}
					}
				}
			}
		}
	}
	if len(versionsMap) == 0 && info.Version != "" {
		if v, err := semver.NewVersion(info.Version); err == nil {
			versionsMap[info.Version] = v
			if _, ok := distTags["latest"]; !ok {
				distTags["latest"] = v
			}
		}
	}

	resolved, err := resolveVersionFromMap(versionsMap, distTags, rangeSpec)
	if err != nil {
		return TemplateInfo{}, err
	}
	info.Version = resolved.Original()
	return info, nil
}

func resolveVersionFromMap(available map[string]*semver.Version, distTags map[string]*semver.Version, rangeSpec string) (*semver.Version, error) {
	switch rangeSpec {
	case "latest", "":
		if latest, ok := distTags["latest"]; ok {
			return latest, nil
		}
		return nil, fmt.Errorf("no 'latest' dist-tag found")
	case "*":
		return resolveLatest(available)
	}
	constraint, err := semver.NewConstraint(rangeSpec)
	if err != nil {
		return nil, fmt.Errorf("invalid version range %q: %w", rangeSpec, err)
	}
	var candidates []*semver.Version
	for _, v := range available {
		if ok, _ := constraint.Validate(v); ok {
			candidates = append(candidates, v)
		}
	}
	if len(candidates) == 0 {
		return nil, fmt.Errorf("no version matching %q", rangeSpec)
	}
	max := candidates[0]
	for _, c := range candidates[1:] {
		if c.GreaterThan(max) {
			max = c
		}
	}
	return max, nil
}

func resolveLatest(versions map[string]*semver.Version) (*semver.Version, error) {
	var all []*semver.Version
	for _, v := range versions {
		if v.Prerelease() != "" {
			continue
		}
		all = append(all, v)
	}
	if len(all) == 0 {
		return nil, fmt.Errorf("no stable versions found")
	}
	max := all[0]
	for _, v := range all[1:] {
		if v.GreaterThan(max) {
			max = v
		}
	}
	return max, nil
}

// DownloadAndExtract downloads the package archive from the registry and extracts it to targetDir.
func (c *Client) DownloadAndExtract(ctx context.Context, name, version, targetDir string) error {
	name = strings.ToLower(name)
	if c.BaseURL == "" {
		return fmt.Errorf("registry unavailable: no registry URL configured")
	}

	u := fmt.Sprintf("%s/v1/%s/%s/archive", c.BaseURL, url.PathEscape(name), url.PathEscape(version))
	req, err := http.NewRequestWithContext(ctx, "GET", u, nil)
	if err != nil {
		return fmt.Errorf("create archive request: %w", err)
	}
	req.Header.Set("User-Agent", "unsarep-tui")
	c.setAuth(req)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("archive metadata request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("get archive URL failed: status %d", resp.StatusCode)
	}

	var archiveResp struct {
		Package    string `json:"package"`
		Version    string `json:"version"`
		ArchiveURL string `json:"archive_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&archiveResp); err != nil {
		return fmt.Errorf("decode archive response: %w", err)
	}
	if archiveResp.ArchiveURL == "" {
		return fmt.Errorf("empty archive URL received")
	}

	downReq, err := http.NewRequestWithContext(ctx, "GET", archiveResp.ArchiveURL, nil)
	if err != nil {
		return fmt.Errorf("create download request: %w", err)
	}
	downResp, err := c.HTTPClient.Do(downReq)
	if err != nil {
		return fmt.Errorf("download archive: %w", err)
	}
	defer func() { _ = downResp.Body.Close() }()

	if downResp.StatusCode != http.StatusOK {
		return fmt.Errorf("download archive failed: status %d", downResp.StatusCode)
	}

	archiveBytes, err := io.ReadAll(downResp.Body)
	if err != nil {
		return fmt.Errorf("read archive body: %w", err)
	}

	zipReader, err := zip.NewReader(bytes.NewReader(archiveBytes), int64(len(archiveBytes)))
	if err != nil {
		return fmt.Errorf("open zip reader: %w", err)
	}

	cleanTarget := filepath.Clean(targetDir)
	if err := os.MkdirAll(cleanTarget, config.PermDirPrivate); err != nil {
		return fmt.Errorf("create target dir: %w", err)
	}

	for _, f := range zipReader.File {
		targetPath := filepath.Join(cleanTarget, f.Name)
		if !strings.HasPrefix(filepath.Clean(targetPath), cleanTarget) {
			return fmt.Errorf("illegal file path in zip: %s", f.Name)
		}

		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(targetPath, config.PermDirPrivate); err != nil {
				return fmt.Errorf("create dir in zip: %w", err)
			}
			continue
		}

		if err := os.MkdirAll(filepath.Dir(targetPath), config.PermDirPrivate); err != nil {
			return fmt.Errorf("create parent dir: %w", err)
		}

		rc, err := f.Open()
		if err != nil {
			return fmt.Errorf("open zip file %s: %w", f.Name, err)
		}

		outFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			_ = rc.Close()
			return fmt.Errorf("open out file %s: %w", targetPath, err)
		}

		_, copyErr := io.Copy(outFile, rc)
		_ = rc.Close()
		_ = outFile.Close()
		if copyErr != nil {
			return fmt.Errorf("write file %s: %w", targetPath, copyErr)
		}
	}

	return nil
}

// PublishPackage packages a directory into a .zip archive and uploads it to the registry.
func (c *Client) PublishPackage(ctx context.Context, packageDir string) error {
	if c.BaseURL == "" {
		return fmt.Errorf("registry unavailable: no registry URL configured")
	}

	manifestPath := filepath.Join(packageDir, "manifest.json")
	if _, err := os.Stat(manifestPath); err != nil {
		return fmt.Errorf("manifest.json not found in %s: %w", packageDir, err)
	}

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	err := filepath.Walk(packageDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		relPath, err := filepath.Rel(packageDir, path)
		if err != nil {
			return err
		}
		if relPath == "." {
			return nil
		}
		if strings.HasPrefix(relPath, ".git") || strings.HasPrefix(relPath, "node_modules") {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if info.IsDir() {
			return nil
		}

		w, err := zw.Create(relPath)
		if err != nil {
			return err
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		_, err = w.Write(data)
		return err
	})
	if err != nil {
		_ = zw.Close()
		return fmt.Errorf("create package zip: %w", err)
	}
	if err := zw.Close(); err != nil {
		return fmt.Errorf("close package zip: %w", err)
	}

	var reqBody bytes.Buffer
	mw := multipart.NewWriter(&reqBody)
	fw, err := mw.CreateFormFile("file", "package.zip")
	if err != nil {
		return fmt.Errorf("create form file: %w", err)
	}
	if _, err := fw.Write(buf.Bytes()); err != nil {
		return fmt.Errorf("write zip to form: %w", err)
	}
	if err := mw.Close(); err != nil {
		return fmt.Errorf("close multipart writer: %w", err)
	}

	u := fmt.Sprintf("%s/v1/packages", c.BaseURL)
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

