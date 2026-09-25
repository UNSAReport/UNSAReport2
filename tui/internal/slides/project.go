package slides

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

const ProjectConfigFile = ".slidesrc.json"

type ProjectConfig struct {
	Slug        string `json:"slug"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	OrgSlug     string `json:"orgSlug,omitempty"`
	Visibility  string `json:"visibility,omitempty"`
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

func LoadProjectConfig(dir string) (*ProjectConfig, error) {
	b, err := os.ReadFile(filepath.Join(dir, ProjectConfigFile))
	if err != nil {
		return nil, err
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
