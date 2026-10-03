package slides

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

const (
	ProjectConfigFile = ".slidesrc.json"
	DeckConfigFile    = "deck.config.ts"
)

type ProjectConfig struct {
	Slug        string `json:"slug"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	OrgSlug     string `json:"orgSlug,omitempty"`
	Visibility  string `json:"visibility,omitempty"`
	Theme       string `json:"theme,omitempty"`
}

type Slide struct {
	ID    string `json:"id"`
	Index int    `json:"index"`
	Title string `json:"title,omitempty"`
}

type Manifest struct {
	Name        string  `json:"name"`
	Title       string  `json:"title"`
	Description string  `json:"description,omitempty"`
	Slides      []Slide `json:"slides"`
}

var slugRe = regexp.MustCompile(`^[a-z0-9-]+$`)

var (
	titleRegex      = regexp.MustCompile(`(?m)^\s*title:\s*['"` + "`" + `]([^'"` + "`" + `]+)['"` + "`" + `]`)
	slugRegex       = regexp.MustCompile(`(?m)^\s*slug:\s*['"` + "`" + `]([^'"` + "`" + `]+)['"` + "`" + `]`)
	themeRegex      = regexp.MustCompile(`(?m)^\s*theme:\s*['"` + "`" + `]([^'"` + "`" + `]+)['"` + "`" + `]`)
	orgSlugRegex    = regexp.MustCompile(`(?m)^\s*orgSlug:\s*['"` + "`" + `]([^'"` + "`" + `]+)['"` + "`" + `]`)
	visibilityRegex = regexp.MustCompile(`(?m)^\s*visibility:\s*['"` + "`" + `]([^'"` + "`" + `]+)['"` + "`" + `]`)
	descRegex       = regexp.MustCompile(`(?m)^\s*description:\s*['"` + "`" + `]([^'"` + "`" + `]+)['"` + "`" + `]`)
)

func ParseDeckConfig(content string) *ProjectConfig {
	cfg := &ProjectConfig{
		Visibility: "private",
		Theme:      "unsa-dark",
	}

	if m := titleRegex.FindStringSubmatch(content); len(m) > 1 {
		cfg.Title = strings.TrimSpace(m[1])
	}
	if m := slugRegex.FindStringSubmatch(content); len(m) > 1 {
		cfg.Slug = strings.TrimSpace(m[1])
	}
	if m := themeRegex.FindStringSubmatch(content); len(m) > 1 {
		cfg.Theme = strings.TrimSpace(m[1])
	}
	if m := orgSlugRegex.FindStringSubmatch(content); len(m) > 1 {
		cfg.OrgSlug = strings.TrimSpace(m[1])
	}
	if m := visibilityRegex.FindStringSubmatch(content); len(m) > 1 {
		cfg.Visibility = strings.TrimSpace(m[1])
	}
	if m := descRegex.FindStringSubmatch(content); len(m) > 1 {
		cfg.Description = strings.TrimSpace(m[1])
	}

	return cfg
}

func LoadProjectConfig(dir string) (*ProjectConfig, error) {
	deckPath := filepath.Join(dir, DeckConfigFile)
	if content, err := os.ReadFile(deckPath); err == nil {
		cfg := ParseDeckConfig(string(content))
		deckText := string(content)
		deckHasVisibility := visibilityRegex.MatchString(deckText)
		if jsonBytes, err := os.ReadFile(filepath.Join(dir, ProjectConfigFile)); err == nil {
			var jsonCfg ProjectConfig
			if json.Unmarshal(jsonBytes, &jsonCfg) == nil {
				if cfg.Slug == "" {
					cfg.Slug = jsonCfg.Slug
				}
				if cfg.Title == "" {
					cfg.Title = jsonCfg.Title
				}
				if cfg.OrgSlug == "" {
					cfg.OrgSlug = jsonCfg.OrgSlug
				}
				if cfg.Description == "" {
					cfg.Description = jsonCfg.Description
				}
				if cfg.Theme == "" {
					cfg.Theme = jsonCfg.Theme
				}
				if !deckHasVisibility && jsonCfg.Visibility != "" {
					cfg.Visibility = jsonCfg.Visibility
				}
			}
		}
		if cfg.Slug != "" || cfg.Title != "" {
			return cfg, nil
		}
	}

	b, err := os.ReadFile(filepath.Join(dir, ProjectConfigFile))
	if err != nil {
		return nil, fmt.Errorf("no %s or %s found: %w", DeckConfigFile, ProjectConfigFile, err)
	}
	var cfg ProjectConfig
	if err := json.Unmarshal(b, &cfg); err != nil {
		return nil, fmt.Errorf("parse %s: %w", ProjectConfigFile, err)
	}
	return &cfg, nil
}

func SaveProjectConfig(dir string, cfg *ProjectConfig) error {
	b, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	b = append(b, '\n')
	return os.WriteFile(filepath.Join(dir, ProjectConfigFile), b, 0o644)
}

func ValidateSlug(s string) bool {
	return len(s) >= 2 && len(s) <= 100 && slugRe.MatchString(s)
}

func LoadManifest(dir string) (*Manifest, map[string]any, error) {
	b, err := os.ReadFile(filepath.Join(dir, "manifest.json"))
	if err != nil {
		if cfg, cfgErr := LoadProjectConfig(dir); cfgErr == nil {
			m := &Manifest{
				Name:        cfg.Slug,
				Title:       cfg.Title,
				Description: cfg.Description,
				Slides: []Slide{
					{ID: "slide-1", Index: 0, Title: cfg.Title},
				},
			}
			raw := map[string]any{
				"name":        cfg.Slug,
				"title":       cfg.Title,
				"description": cfg.Description,
				"slides": []any{
					map[string]any{"id": "slide-1", "index": 0, "title": cfg.Title},
				},
			}
			return m, raw, nil
		}
		return nil, nil, fmt.Errorf("read manifest.json: %w", err)
	}
	var raw map[string]any
	if err := json.Unmarshal(b, &raw); err != nil {
		return nil, nil, fmt.Errorf("parse manifest.json: %w", err)
	}
	var m Manifest
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, nil, fmt.Errorf("parse manifest.json: %w", err)
	}
	if strings.TrimSpace(m.Name) == "" {
		return nil, nil, fmt.Errorf("invalid manifest.json: field \"name\" is required")
	}
	if strings.TrimSpace(m.Title) == "" {
		return nil, nil, fmt.Errorf("invalid manifest.json: field \"title\" is required")
	}
	if m.Slides == nil {
		return nil, nil, fmt.Errorf("invalid manifest.json: field \"slides\" is required")
	}
	for i, s := range m.Slides {
		if strings.TrimSpace(s.ID) == "" {
			return nil, nil, fmt.Errorf("invalid manifest.json: slides[%d].id is required", i)
		}
	}
	return &m, raw, nil
}

func BundleFile(dir string) (string, error) {
	b, err := os.ReadFile(filepath.Join(dir, "src", "slides.tsx"))
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", err
	}
	return base64.StdEncoding.EncodeToString(b), nil
}

const maxBundleBytes = 50 << 20

func shouldZipExclude(relPath string) bool {
	p := filepath.ToSlash(relPath)
	if p == "" || p == "." {
		return true
	}
	if p == "node_modules" || strings.HasPrefix(p, "node_modules/") {
		return true
	}
	if p == ".git" || strings.HasPrefix(p, ".git/") {
		return true
	}
	if strings.HasSuffix(p, ".tgz") {
		return true
	}
	if strings.HasPrefix(filepath.ToSlash(filepath.Base(p)), ".env") {
		return true
	}
	return false
}

func ZipDirectory(srcDir string) ([]byte, error) {
	buf := new(bytes.Buffer)
	zw := zip.NewWriter(buf)

	err := filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}
		if shouldZipExclude(relPath) {
			return nil
		}

		cleanPath := filepath.ToSlash(relPath)
		w, err := zw.Create(cleanPath)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}

		_, copyErr := io.Copy(w, file)
		closeErr := file.Close()
		if copyErr != nil {
			return copyErr
		}
		return closeErr
	})

	if err != nil {
		_ = zw.Close()
		return nil, err
	}

	if err := zw.Close(); err != nil {
		return nil, err
	}

	if buf.Len() > maxBundleBytes {
		return nil, fmt.Errorf("bundle exceeds 50 MiB (%d bytes)", buf.Len())
	}

	return buf.Bytes(), nil
}

func RunBuild(dir string) error {
	pkgPath := filepath.Join(dir, "package.json")
	if _, err := os.Stat(pkgPath); err != nil {
		return fmt.Errorf("build requires package.json: %w", err)
	}

	buildCmd := "bun"
	if _, err := exec.LookPath("bun"); err != nil {
		if _, err := exec.LookPath("npm"); err == nil {
			buildCmd = "npm"
		} else {
			return fmt.Errorf("build requires bun or npm on PATH")
		}
	}

	var cmd *exec.Cmd
	if buildCmd == "bun" {
		cmd = exec.Command("bun", "run", "build")
	} else {
		cmd = exec.Command("npm", "run", "build")
	}
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}

func BuildAndZip(dir string) ([]byte, string, error) {
	if err := RunBuild(dir); err != nil {
		return nil, "", fmt.Errorf("build presentation: %w", err)
	}

	distDir := filepath.Join(dir, "dist")
	st, err := os.Stat(distDir)
	if err != nil || !st.IsDir() {
		return nil, "", fmt.Errorf("build did not produce dist/: run build to generate dist before deploy")
	}

	zipBytes, err := ZipDirectory(distDir)
	if err != nil {
		return nil, "", fmt.Errorf("compress presentation files: %w", err)
	}

	hash := sha256.Sum256(zipBytes)
	hashHex := hex.EncodeToString(hash[:])

	return zipBytes, hashHex, nil
}

func Slugify(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	var out strings.Builder
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			out.WriteRune(r)
		default:
			out.WriteRune('-')
		}
	}
	s = regexp.MustCompile(`-+`).ReplaceAllString(out.String(), "-")
	return strings.Trim(s, "-")
}
