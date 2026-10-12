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

// SNAPSHOT del kit para decks `init` (self-contained: cada deck publica
// solo con su dir). ¡Se desincroniza con packages/slides-kit/src!
// Refrescar tras CUALQUIER cambio del kit (el tgz debe generarse SIEMPRE
// con `bun pm pack`, nunca con tar manual: bun exige layout npm
// `package/...` y falla con ENOENT en caso contrario):
//
//	cd packages/slides-kit && bun run build && bun pm pack --filename /tmp/kit.tgz
//	cp /tmp/kit.tgz tui/internal/slides/assets/slides-kit.tgz
//	go build ./cmd/unsarep   # el embed se congela en compilación
//
// Los decks que consuman el tgz (demos/ u otros) deben reinstalar limpio:
//
//	rm -rf node_modules bun.lock && bun install   # el lockfile fija sha512
//
// del tgz; sin esto bun sirve la extracción cacheada aunque cambien bytes.
//
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

// Decks iniciales de las 3 plantillas portadas: un layout por slide de la
// plantilla (layouts registrados en el kit con el contenido como defaults).
// Sin custom/, sin assets sueltos: todo viaja dentro de @unsa/slides-kit.
//
//go:embed templates/themes/azul-proposal/deck.config.ts.tmpl
var themeDeckAzul string

//go:embed templates/themes/cloudlet-pitch/deck.config.ts.tmpl
var themeDeckCloudlet string

//go:embed templates/themes/harper-minimal/deck.config.ts.tmpl
var themeDeckHarper string

// PortedReplica indica si el tema genera su réplica exacta (un layout por
// slide de la plantilla) como contenido inicial de `init`.
func PortedReplica(theme string) bool {
	switch theme {
	case "azul-proposal", "cloudlet-pitch", "harper-minimal":
		return true
	}
	return false
}

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
	return StarterTemplateWithTheme(projectName, "")
}

// StarterTemplateWithTheme igual que StarterTemplate pero con tema inicial.
// theme vacío (o desconocido) equivale a "unsa-dark"; el llamador valida
// con ThemeRegistered para mensajes de error con la lista oficial.
func StarterTemplateWithTheme(projectName, theme string) ([]TemplateFile, error) {
	slug := Slugify(projectName)
	if slug == "" {
		slug = "my-slides"
	}
	if !ThemeRegistered(theme) {
		theme = "unsa-dark"
	}
	nameJSON, err := jsonString(slug)
	if err != nil {
		return nil, fmt.Errorf("slides template: %w", err)
	}
	titleJSON, err := jsonString(projectName)
	if err != nil {
		return nil, fmt.Errorf("slides template: %w", err)
	}
	themeJSON, err := jsonString(theme)
	if err != nil {
		return nil, fmt.Errorf("slides template: %w", err)
	}
	data := map[string]string{
		"TitleTS":   tsSingleQuote(projectName),
		"SlugTS":    tsSingleQuote(slug),
		"ThemeTS":   tsSingleQuote(theme),
		"TitleHTML": html.EscapeString(projectName),
		"NameJSON":  nameJSON,
		"TitleJSON": titleJSON,
		"ThemeJSON": themeJSON,
		"Title":     projectName,
	}
	rendered := make([]TemplateFile, 0, 11)
	if PortedReplica(theme) {
		return starterPortedReplica(theme, data, rendered)
	}
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

// starterPortedReplica arma el scaffold de un tema portado: el deck es la
// réplica exacta de la plantilla (un layout registrado por slide, con el
// contenido como defaults), solo cambian title/slug al proyecto nuevo.
func starterPortedReplica(id string, data map[string]string, rendered []TemplateFile) ([]TemplateFile, error) {
	var deckBody string
	switch id {
	case "azul-proposal":
		deckBody = themeDeckAzul
	case "cloudlet-pitch":
		deckBody = themeDeckCloudlet
	case "harper-minimal":
		deckBody = themeDeckHarper
	default:
		return nil, fmt.Errorf("slides replica %s: sin preset de layouts", id)
	}
	content, err := render("deck.config.ts", deckBody, data)
	if err != nil {
		return nil, fmt.Errorf("slides replica %s: %w", id, err)
	}
	rendered = append(rendered, TemplateFile{Path: "deck.config.ts", Content: content})

	for _, d := range []struct{ out, name, body string }{
		{"index.html", "index.html", indexHTMLTmpl},
		{"package.json", "package.json", packageJSONTmpl},
		{".slidesrc.json", ".slidesrc.json", slidesrcJSONTmpl},
		{"manifest.json", "manifest.json", manifestJSONTmpl},
		{"src/slides.tsx", "slides.tsx", slidesTSXTmpl},
		{"README.md", "README.md", readmeTmpl},
	} {
		content, err := render(d.name, d.body, data)
		if err != nil {
			return nil, fmt.Errorf("slides template %s: %w", d.name, err)
		}
		rendered = append(rendered, TemplateFile{Path: d.out, Content: content})
	}
	rendered = append(rendered,
		TemplateFile{Path: "vite.config.ts", Content: viteConfig},
		TemplateFile{Path: "src/main.tsx", Content: mainTSX},
		TemplateFile{Path: ".gitignore", Content: gitignore},
		TemplateFile{Path: "slides-kit.tgz", Data: slidesKitArchive},
	)
	return rendered, nil
}
