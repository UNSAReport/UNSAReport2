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

func ParseDeckConfigWithWarnings(content string) (*ProjectConfig, []string) {
	var kept []string
	for _, line := range strings.Split(content, "\n") {
		if strings.HasPrefix(strings.TrimSpace(line), "//") {
			continue
		}
		kept = append(kept, line)
	}
	filtered := strings.Join(kept, "\n")
	cfg := &ProjectConfig{
		Visibility: "private",
		Theme:      "unsa-dark",
	}
	var warnings []string
	if m := titleRegex.FindStringSubmatch(filtered); len(m) > 1 {
		cfg.Title = strings.TrimSpace(m[1])
	} else {
		warnings = append(warnings, `field "title" fell back to default ""`)
	}
	if m := slugRegex.FindStringSubmatch(filtered); len(m) > 1 {
		cfg.Slug = strings.TrimSpace(m[1])
	} else {
		warnings = append(warnings, `field "slug" fell back to default ""`)
	}
	if m := themeRegex.FindStringSubmatch(filtered); len(m) > 1 {
		cfg.Theme = strings.TrimSpace(m[1])
	} else {
		warnings = append(warnings, `field "theme" fell back to default "unsa-dark"`)
	}
	if m := orgSlugRegex.FindStringSubmatch(filtered); len(m) > 1 {
		cfg.OrgSlug = strings.TrimSpace(m[1])
	} else {
		warnings = append(warnings, `field "orgSlug" fell back to default ""`)
	}
	if m := visibilityRegex.FindStringSubmatch(filtered); len(m) > 1 {
		cfg.Visibility = strings.TrimSpace(m[1])
	} else {
		warnings = append(warnings, `field "visibility" fell back to default "private"`)
	}
	if m := descRegex.FindStringSubmatch(filtered); len(m) > 1 {
		cfg.Description = strings.TrimSpace(m[1])
	} else {
		warnings = append(warnings, `field "description" fell back to default ""`)
	}
	return cfg, warnings
}

func ParseDeckConfig(content string) *ProjectConfig {
	cfg, _ := ParseDeckConfigWithWarnings(content)
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
	if !ValidateSlug(cfg.Slug) {
		return fmt.Errorf("invalid slug %q", cfg.Slug)
	}
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

// BundleFile reads src/slides.tsx and returns it base64-encoded.
//
// Bundle paths: the canonical deploy path is BuildAndZip, which zips dist/
// into ZipBytes sent as multipart form data (DeployMultipart). The base64
// Bundle field carrying this file is the legacy path, kept for the JSON
// deploy contract.
func BundleFile(dir string) (string, error) {
	b, err := os.ReadFile(filepath.Join(dir, "src", "slides.tsx"))
	if err != nil {
		return "", fmt.Errorf("read bundle file: %w", err)
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

// latinFold transliterates common Latin diacritics to ASCII so slugs stay
// readable (Café -> cafe). Runes without an entry (e.g. CJK ideographs) are
// dropped by Slugify; when nothing mappable remains Slugify returns "" and
// callers fall back to a default such as "my-slides" (see StarterTemplate).
var latinFold = map[rune]string{
	'à': "a", 'á': "a", 'â': "a", 'ã': "a", 'ä': "a", 'å': "a",
	'À': "a", 'Á': "a", 'Â': "a", 'Ã': "a", 'Ä': "a", 'Å': "a",
	'è': "e", 'é': "e", 'ê': "e", 'ë': "e",
	'È': "e", 'É': "e", 'Ê': "e", 'Ë': "e",
	'ì': "i", 'í': "i", 'î': "i", 'ï': "i",
	'Ì': "i", 'Í': "i", 'Î': "i", 'Ï': "i",
	'ò': "o", 'ó': "o", 'ô': "o", 'õ': "o", 'ö': "o", 'ø': "o",
	'Ò': "o", 'Ó': "o", 'Ô': "o", 'Õ': "o", 'Ö': "o", 'Ø': "o",
	'ù': "u", 'ú': "u", 'û': "u", 'ü': "u",
	'Ù': "u", 'Ú': "u", 'Û': "u", 'Ü': "u",
	'ñ': "n", 'Ñ': "n",
	'ç': "c", 'Ç': "c",
	'ý': "y", 'ÿ': "y", 'Ý': "y",
	'æ': "ae", 'Æ': "ae",
	'œ': "oe", 'Œ': "oe",
	'ß': "ss", 'ẞ': "ss",
	'ð': "d", 'Ð': "d",
}

func Slugify(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	var out strings.Builder
	for _, r := range s {
		if rep, ok := latinFold[r]; ok {
			out.WriteString(rep)
			continue
		}
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
