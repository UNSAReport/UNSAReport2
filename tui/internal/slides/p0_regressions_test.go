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
		files := StarterTemplate(input)
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
