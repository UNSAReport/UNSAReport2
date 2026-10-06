package slides

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// Regresiones P0 del TUI: fijan el comportamiento ya corregido sin red
// (salvo httptest local) ni servidores externos.

func TestP0BuildAndZipPropagatesFailingBuild(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, dir, "package.json", `{"name":"p0-fail","scripts":{"build":"exit 1"}}`)
	// dist obsoleto: un build roto nunca debe dar éxito sobre él.
	if err := os.MkdirAll(filepath.Join(dir, "dist"), 0o755); err != nil {
		t.Fatal(err)
	}
	writeFile(t, dir, filepath.Join("dist", "index.html"), "<h1>stale</h1>")

	zipBytes, hash, err := BuildAndZip(dir)
	if err == nil {
		t.Fatalf("expected build failure, got success hash=%q", hash)
	}
	if !strings.Contains(err.Error(), "build presentation") {
		t.Errorf("expected wrapped build error, got %v", err)
	}
	if len(zipBytes) != 0 {
		t.Errorf("expected no zip bytes on failed build, got %d", len(zipBytes))
	}
	if hash != "" {
		t.Errorf("expected empty hash on failed build, got %q", hash)
	}
}

func TestP0ZipDirectoryExcludesSensitivePaths(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, dir, "index.html", "<h1>keep</h1>")
	if err := os.MkdirAll(filepath.Join(dir, "node_modules"), 0o755); err != nil {
		t.Fatal(err)
	}
	writeFile(t, dir, filepath.Join("node_modules", "evil.js"), "evil")
	if err := os.MkdirAll(filepath.Join(dir, ".git"), 0o755); err != nil {
		t.Fatal(err)
	}
	writeFile(t, dir, filepath.Join(".git", "config"), "gitdir")
	writeFile(t, dir, "bundle.tgz", "tgz-bytes")
	writeFile(t, dir, ".env", "secret=1")
	writeFile(t, dir, ".env.local", "secret=2")

	zipBytes, err := ZipDirectory(dir)
	if err != nil {
		t.Fatalf("ZipDirectory failed: %v", err)
	}
	zr, err := zip.NewReader(bytes.NewReader(zipBytes), int64(len(zipBytes)))
	if err != nil {
		t.Fatalf("open zip: %v", err)
	}
	names := make(map[string]bool, len(zr.File))
	for _, f := range zr.File {
		names[f.Name] = true
	}
	if !names["index.html"] {
		t.Errorf("expected index.html in bundle, got %v", names)
	}
	for _, bad := range []string{
		"node_modules/evil.js",
		".git/config",
		"bundle.tgz",
		".env",
		".env.local",
	} {
		if names[bad] {
			t.Errorf("expected %s excluded from bundle", bad)
		}
	}
}

func TestP0ZipDirectoryRejectsBundleOver50MiB(t *testing.T) {
	dir := t.TempDir()
	f, err := os.Create(filepath.Join(dir, "big.bin"))
	if err != nil {
		t.Fatal(err)
	}
	// Datos incompresibles: el límite aplica al zip final (>50 MiB).
	chunk := make([]byte, 1<<20)
	for range 52 {
		if _, err := rand.Read(chunk); err != nil {
			_ = f.Close()
			t.Fatal(err)
		}
		if _, err := f.Write(chunk); err != nil {
			_ = f.Close()
			t.Fatal(err)
		}
	}
	if err := f.Close(); err != nil {
		t.Fatal(err)
	}

	if _, err := ZipDirectory(dir); err == nil {
		t.Fatal("expected oversize bundle error, got nil")
	} else if !strings.Contains(err.Error(), "50 MiB") {
		t.Errorf("expected 50 MiB limit error, got %v", err)
	}
}

func TestP0PreviewHTMLEscapesScriptTitle(t *testing.T) {
	html := previewHTML(`<script>alert(1)</script>`)
	if strings.Contains(html, "<script>alert") {
		t.Errorf("raw <script> title leaked into preview HTML")
	}
	if !strings.Contains(html, "&lt;script&gt;") {
		t.Errorf("expected escaped title in preview HTML, got:\n%s", html)
	}
}

func TestP0StarterTemplateValidNpmName(t *testing.T) {
	cases := map[string]string{
		"Demo Deck": "demo-deck",
		"O'Brien":   "o-brien",
	}
	for input, want := range cases {
		files, err := StarterTemplate(input)
		if err != nil {
			t.Fatal(err)
		}
		var pkgJSON string
		for _, f := range files {
			if f.Path == "package.json" {
				pkgJSON = f.Content
			}
		}
		if pkgJSON == "" {
			t.Fatalf("%q: template missing package.json", input)
		}
		var pkg struct {
			Name string `json:"name"`
		}
		if err := json.Unmarshal([]byte(pkgJSON), &pkg); err != nil {
			t.Fatalf("%q: invalid package.json: %v", input, err)
		}
		if pkg.Name != want {
			t.Errorf("%q: name = %q, want %q", input, pkg.Name, want)
		}
		for _, r := range pkg.Name {
			if !(r >= 'a' && r <= 'z' || r >= '0' && r <= '9' || r == '-' || r == '.' || r == '_') {
				t.Errorf("%q: invalid npm name char %q in %q", input, r, pkg.Name)
			}
		}
		if strings.ContainsAny(pkg.Name, " '\"ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
			t.Errorf("%q: name %q is not a valid lowercase npm name", input, pkg.Name)
		}
	}
}

func TestP0LoadProjectConfigDeckVisibilityWins(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, dir, "deck.config.ts", `import { defineConfig } from '@unsa/slides-kit';

export default defineConfig({
  title: 'T',
  slug: 'x',
  visibility: 'public',
});
`)
	writeFile(t, dir, ".slidesrc.json", `{"slug":"x","title":"T","visibility":"private"}`)

	cfg, err := LoadProjectConfig(dir)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Visibility != "public" {
		t.Errorf("deck visibility should beat .slidesrc.json: got %q, want %q", cfg.Visibility, "public")
	}
}

func TestP0DeployMultipartSurfacesManifestMarshalError(t *testing.T) {
	hit := false
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hit = true
		_, _ = w.Write([]byte(`{}`))
	}))
	defer srv.Close()

	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	_, err := c.DeployMultipart(context.Background(), "tok", &DeployRequest{
		Slug:     "d",
		Title:    "D",
		Manifest: map[string]any{"bad": func() {}},
	}, []byte("PK\x05\x06"))
	if err == nil {
		t.Fatal("expected manifest marshal error, got nil")
	}
	if !strings.Contains(err.Error(), "marshal manifest") {
		t.Errorf("expected marshal manifest error, got %v", err)
	}
	if hit {
		t.Errorf("request must not reach the server when manifest marshal fails")
	}
}

func TestP1P2StartDevRejectsBadPort(t *testing.T) {
	dir := t.TempDir()
	for _, port := range []int{0, 99999} {
		if err := StartDev(dir, port); err == nil {
			t.Errorf("port %d: expected error, got nil", port)
		} else if !strings.Contains(err.Error(), "invalid port") {
			t.Errorf("port %d: expected invalid port error, got %v", port, err)
		}
	}
}

func TestP1P2StartDevViteFailureReturnsError(t *testing.T) {
	if _, err := exec.LookPath("bun"); err != nil {
		t.Skip("requires bun on PATH so the failing dev script runs deterministically")
	}
	dir := t.TempDir()
	writeFile(t, dir, "package.json", `{"name":"p1-dev-fail","scripts":{"dev":"exit 1"}}`)
	if err := StartDev(dir, 19191); err == nil {
		t.Fatal("expected dev server failure, got nil")
	} else if !strings.Contains(err.Error(), "dev server failed") {
		t.Fatalf("expected dev server failed error, got %v", err)
	}
}

func TestP1P2ParseDeckConfigIgnoresCommentTheme(t *testing.T) {
	cfg, warnings := ParseDeckConfigWithWarnings("// theme: 'should-be-ignored'\ntitle: 'Real'\nslug: 'real-slug'\n")
	if cfg.Theme != "unsa-dark" {
		t.Errorf("comment theme leaked: got %q want default unsa-dark", cfg.Theme)
	}
	if cfg.Title != "Real" || cfg.Slug != "real-slug" {
		t.Errorf("real fields lost: %+v", cfg)
	}
	found := false
	for _, w := range warnings {
		if strings.Contains(w, `"theme"`) && strings.Contains(w, "unsa-dark") {
			found = true
		}
	}
	if !found {
		t.Errorf("expected theme default fallback warning, got %v", warnings)
	}
}

func TestP1P2LoadManifestMissingFileErrors(t *testing.T) {
	if _, _, err := LoadManifest(t.TempDir()); err == nil {
		t.Fatal("expected missing manifest error, got nil")
	} else if !strings.Contains(err.Error(), "read manifest.json") {
		t.Fatalf("expected read manifest.json error, got %v", err)
	}
}

func TestP1P2DeployStructuralGate(t *testing.T) {
	hit := false
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hit = true
		_ = json.NewEncoder(w).Encode(map[string]any{
			"success": true, "presentationId": "11111111-1111-1111-1111-111111111111",
			"slug": "d", "version": 1, "url": "http://x/p/d", "message": "ok",
		})
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	for _, bad := range []string{"", "UPPER"} {
		hit = false
		if _, err := c.Deploy(context.Background(), "tok", &DeployRequest{Slug: bad, Title: "T", Manifest: map[string]any{}}); err == nil {
			t.Errorf("slug %q: expected invalid slug error, got nil", bad)
		} else if !strings.Contains(err.Error(), "invalid slug") {
			t.Errorf("slug %q: expected invalid slug error, got %v", bad, err)
		}
		if hit {
			t.Errorf("slug %q: request must not reach the server on structural reject", bad)
		}
	}
	resp, err := c.Deploy(context.Background(), "tok", &DeployRequest{Slug: "d", Title: "T", Manifest: map[string]any{}})
	if err != nil {
		t.Fatalf("slug d: expected success, got %v", err)
	}
	if resp.Slug != "d" {
		t.Errorf("slug d: got %q", resp.Slug)
	}
}

func writePptxWithThemes(t *testing.T, themes map[string]string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "multi.pptx")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	w := zip.NewWriter(f)
	for name, content := range themes {
		fw, err := w.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := fw.Write([]byte(content)); err != nil {
			t.Fatal(err)
		}
	}
	fw, err := w.Create("ppt/slideMasters/slideMaster1.xml")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := fw.Write([]byte(fixtureMasterXML)); err != nil {
		t.Fatal(err)
	}
	fw, err = w.Create("[Content_Types].xml")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := fw.Write([]byte(fixtureContentTypes)); err != nil {
		t.Fatal(err)
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	if err := f.Close(); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestP1P2PptxMultiThemePrefersTheme1(t *testing.T) {
	alt := strings.Replace(fixtureThemeXML, `<a:accent1><a:srgbClr val="4472C4"/></a:accent1>`, `<a:accent1><a:srgbClr val="FF0000"/></a:accent1>`, 1)
	path := writePptxWithThemes(t, map[string]string{
		"ppt/theme/theme2.xml": alt,
		"ppt/theme/theme1.xml": fixtureThemeXML,
	})
	theme, err := ParsePptxTheme(path)
	if err != nil {
		t.Fatal(err)
	}
	if theme.Colors["accent1"] != "#4472c4" {
		t.Errorf("expected theme1 to win (accent1 #4472c4), got %q", theme.Colors["accent1"])
	}
}

func TestP1P2PptxSkippedSlotsOnPhClr(t *testing.T) {
	phClr := strings.Replace(fixtureThemeXML, `<a:accent1><a:srgbClr val="4472C4"/></a:accent1>`, `<a:accent1><a:schemeClr val="phClr"/></a:accent1>`, 1)
	path := writePptxWithThemes(t, map[string]string{"ppt/theme/theme1.xml": phClr})
	theme, err := ParsePptxTheme(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(theme.SkippedSlots) == 0 {
		t.Fatal("expected non-empty SkippedSlots on phClr fixture")
	}
	found := false
	for _, s := range theme.SkippedSlots {
		if s == "accent1" {
			found = true
		}
	}
	if !found {
		t.Errorf("expected accent1 in SkippedSlots, got %v", theme.SkippedSlots)
	}
}

func TestP1P2ToThemePatchContainsMajorFont(t *testing.T) {
	theme, err := ParsePptxTheme(writeFixturePptx(t))
	if err != nil {
		t.Fatal(err)
	}
	patch := theme.ToThemePatch("office-import")
	if !strings.Contains(patch, theme.MajorFont) {
		t.Errorf("patch missing major font %q:\n%s", theme.MajorFont, patch)
	}
	if !strings.Contains(patch, "--slide-heading-font-family") {
		t.Errorf("patch missing heading font variable:\n%s", patch)
	}
}

func TestP1P2SlugifyAccents(t *testing.T) {
	if got := Slugify("Café"); got != "cafe" {
		t.Errorf("got %q want cafe", got)
	}
}

func TestP1P2BundleFileMissingPathErrors(t *testing.T) {
	if _, err := BundleFile(t.TempDir()); err == nil {
		t.Fatal("expected bundle file error, got nil")
	} else if !strings.Contains(err.Error(), "read bundle file") {
		t.Fatalf("expected read bundle file error, got %v", err)
	}
}

func TestP1P2DriftReport(t *testing.T) {
	layouts := ListLayouts("", "")
	var layoutIDs []string
	for _, l := range layouts {
		layoutIDs = append(layoutIDs, l.ID)
	}
	var themeIDs []string
	for _, th := range ListThemes() {
		themeIDs = append(themeIDs, th.ID)
	}
	if got := DriftReport(layoutIDs, themeIDs); got != "" {
		t.Errorf("expected empty report when in sync, got %q", got)
	}
	if len(layoutIDs) == 0 {
		t.Fatal("need at least one layout for the removed-layout case")
	}
	removed := layoutIDs[1:]
	got := DriftReport(removed, themeIDs)
	if !strings.Contains(got, "missing from kit") {
		t.Errorf("expected missing-from-kit line, got %q", got)
	}
	if !strings.Contains(got, layoutIDs[0]) {
		t.Errorf("expected removed layout %q flagged, got %q", layoutIDs[0], got)
	}
}

func TestStarterTemplateEscapesSpecialCharsInTSStrings(t *testing.T) {
	name := "linea\nsalto'O\\Brien" + string([]rune{'\u2028', '\u2029'}) + "end"
	files, err := StarterTemplate(name)
	if err != nil {
		t.Fatal(err)
	}
	var deck string
	for _, f := range files {
		if f.Path == "deck.config.ts" {
			deck = f.Content
		}
	}
	if deck == "" {
		t.Fatal("template missing deck.config.ts")
	}
	for _, want := range []string{`linea\nsalto`, `salto\'O\\Brien`, `\u2028`, `\u2029`} {
		if !strings.Contains(deck, want) {
			t.Errorf("deck.config.ts missing escaped %q:\n%s", want, deck)
		}
	}
	for _, raw := range []string{string('\u2028'), string('\u2029')} {
		if strings.Contains(deck, raw) {
			t.Errorf("deck.config.ts contains raw separator %q:\n%q", raw, deck)
		}
	}
	for _, line := range strings.Split(deck, "\n") {
		if strings.HasPrefix(line, "  title: '") && !strings.HasSuffix(line, "',") {
			t.Errorf("title leaks across lines: %q", line)
		}
	}
}
