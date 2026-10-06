package slides

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"
	"html"
	"strings"
	"text/template"
)

//go:embed assets/slides-kit.tgz
var slidesKitArchive []byte

//go:embed templates/deck.config.ts.tmpl
var deckConfigTmpl string

//go:embed templates/index.html.tmpl
var indexHTMLTmpl string

//go:embed templates/slides.tsx.tmpl
var slidesTSXTmpl string

//go:embed templates/package.json.tmpl
var packageJSONTmpl string

//go:embed templates/slidesrc.json.tmpl
var slidesrcJSONTmpl string

//go:embed templates/manifest.json.tmpl
var manifestJSONTmpl string

//go:embed templates/readme.md.tmpl
var readmeTmpl string

//go:embed templates/vite.config.ts
var viteConfig string

//go:embed templates/main.tsx
var mainTSX string

//go:embed templates/gitignore
var gitignore string

type TemplateFile struct {
	Path    string
	Content string
	Data    []byte
}

func tsSingleQuote(s string) string {
	var b strings.Builder
	b.WriteByte('\'')
	for _, r := range s {
		switch r {
		case '\'':
			b.WriteString("\\'")
		case '\\':
			b.WriteString("\\\\")
		case '\n':
			b.WriteString("\\n")
		case '\r':
			b.WriteString("\\r")
		case '\t':
			b.WriteString("\\t")
		case '\u2028':
			b.WriteString("\\u2028")
		case '\u2029':
			b.WriteString("\\u2029")
		default:
			b.WriteRune(r)
		}
	}
	b.WriteByte('\'')
	return b.String()
}

func jsonString(s string) (string, error) {
	b, err := json.Marshal(s)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func render(name, body string, data any) (string, error) {
	t, err := template.New(name).Parse(body)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}

func StarterTemplate(projectName string) ([]TemplateFile, error) {
	slug := Slugify(projectName)
	if slug == "" {
		slug = "my-slides"
	}
	nameJSON, err := jsonString(slug)
	if err != nil {
		return nil, fmt.Errorf("slides template: %w", err)
	}
	titleJSON, err := jsonString(projectName)
	if err != nil {
		return nil, fmt.Errorf("slides template: %w", err)
	}
	data := map[string]string{
		"TitleTS":   tsSingleQuote(projectName),
		"SlugTS":    tsSingleQuote(slug),
		"TitleHTML": html.EscapeString(projectName),
		"NameJSON":  nameJSON,
		"TitleJSON": titleJSON,
		"Title":     projectName,
	}
	rendered := make([]TemplateFile, 0, 11)
	dynamic := []struct {
		out  string
		name string
		body string
	}{
		{"deck.config.ts", "deck.config.ts", deckConfigTmpl},
		{"index.html", "index.html", indexHTMLTmpl},
		{"package.json", "package.json", packageJSONTmpl},
		{".slidesrc.json", ".slidesrc.json", slidesrcJSONTmpl},
		{"manifest.json", "manifest.json", manifestJSONTmpl},
		{"src/slides.tsx", "slides.tsx", slidesTSXTmpl},
		{"README.md", "README.md", readmeTmpl},
	}
	for _, d := range dynamic {
		content, err := render(d.name, d.body, data)
		if err != nil {
			return nil, fmt.Errorf("slides template %s: %w", d.name, err)
		}
		rendered = append(rendered, TemplateFile{Path: d.out, Content: content})
	}
	static := []TemplateFile{
		{Path: "vite.config.ts", Content: viteConfig},
		{Path: "src/main.tsx", Content: mainTSX},
		{Path: ".gitignore", Content: gitignore},
		{Path: "slides-kit.tgz", Data: slidesKitArchive},
	}
	return append(rendered[:0:0], append(rendered, static...)...), nil
}
