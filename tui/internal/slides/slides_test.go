package slides

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"My Deck":        "my-deck",
		"  Spaced  Out ": "spaced-out",
		"Áccénts!!":      "cc-nts",
		"a":              "a",
		"---":            "",
	}
	for in, want := range cases {
		if got := Slugify(in); got != want {
			t.Errorf("Slugify(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestValidateSlug(t *testing.T) {
	valid := []string{"ab", "my-deck", "deck-2024", "a-1"}
	for _, s := range valid {
		if !ValidateSlug(s) {
			t.Errorf("ValidateSlug(%q) = false, want true", s)
		}
	}
	invalid := []string{"", "a", "UPPER", "has space", "under_score", "dot.name"}
	for _, s := range invalid {
		if ValidateSlug(s) {
			t.Errorf("ValidateSlug(%q) = true, want false", s)
		}
	}
}

func writeFile(t *testing.T, dir, name, content string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestLoadManifest(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, dir, "manifest.json", `{"name":"d","title":"D","slides":[{"id":"intro","index":0}]}`)
	m, raw, err := LoadManifest(dir)
	if err != nil {
		t.Fatalf("err %v", err)
	}
	if m.Name != "d" || len(m.Slides) != 1 || raw["title"] != "D" {
		t.Fatalf("unexpected manifest: %+v", m)
	}
}

func TestLoadManifest_Invalid(t *testing.T) {
	cases := map[string]string{
		"missing title":    `{"name":"d","slides":[]}`,
		"missing slides":   `{"name":"d","title":"D"}`,
		"slide without id": `{"name":"d","title":"D","slides":[{"index":0}]}`,
		"not json":         `{{{`,
	}
	for name, body := range cases {
		dir := t.TempDir()
		writeFile(t, dir, "manifest.json", body)
		if _, _, err := LoadManifest(dir); err == nil {
			t.Errorf("%s: expected error, got nil", name)
		}
	}
	if _, _, err := LoadManifest(t.TempDir()); err == nil {
		t.Error("missing file: expected error, got nil")
	}
}

func TestProjectConfig_RoundTrip(t *testing.T) {
	dir := t.TempDir()
	want := &ProjectConfig{Slug: "demo", Title: "Demo", OrgSlug: "acme", Visibility: "public"}
	if err := SaveProjectConfig(dir, want); err != nil {
		t.Fatal(err)
	}
	got, err := LoadProjectConfig(dir)
	if err != nil {
		t.Fatal(err)
	}
	if *got != *want {
		t.Fatalf("got %+v want %+v", got, want)
	}
}

func TestStarterTemplate_Writes(t *testing.T) {
	files := StarterTemplate("Demo Deck")
	want := map[string]bool{
		"package.json": false, ".slidesrc.json": false, "manifest.json": false,
		"src/slides.tsx": false, "README.md": false,
	}
	for _, f := range files {
		want[f.Path] = true
		if f.Content == "" && len(f.Data) == 0 {
			t.Errorf("empty content for %s", f.Path)
		}
	}
	for path, seen := range want {
		if !seen {
			t.Errorf("template missing %s", path)
		}
	}
}

func TestDeploy_ClientContract(t *testing.T) {
	var gotAuth, gotPath string
	var gotBody map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotPath = r.URL.Path
		_ = json.NewDecoder(r.Body).Decode(&gotBody)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"success": true, "presentationId": "11111111-1111-1111-1111-111111111111",
			"slug": "demo", "version": 3, "url": "http://x/p/demo", "message": "ok",
		})
	}))
	defer srv.Close()

	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	resp, err := c.Deploy(context.Background(), "unsareport_pat_test", &DeployRequest{
		Slug: "demo", Title: "Demo", Visibility: "private",
		Manifest: map[string]any{"name": "demo", "title": "Demo", "slides": []any{}},
		Bundle:   "ZQ==",
	})
	if err != nil {
		t.Fatalf("err %v", err)
	}
	if gotPath != "/presentations/deploy" {
		t.Errorf("path = %s", gotPath)
	}
	if gotAuth != "Bearer unsareport_pat_test" {
		t.Errorf("auth = %s", gotAuth)
	}
	for _, k := range []string{"slug", "title", "visibility", "manifest", "bundle"} {
		if _, ok := gotBody[k]; !ok {
			t.Errorf("body missing %s", k)
		}
	}
	if resp.Version != 3 || !resp.Success {
		t.Errorf("unexpected response %+v", resp)
	}
}

func TestDeploy_UnauthorizedSurfaces(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(401)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"error": "Unauthorized", "message": "bad token", "statusCode": 401,
		})
	}))
	defer srv.Close()

	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	_, err := c.Deploy(context.Background(), "bad", &DeployRequest{Slug: "d", Title: "D"})
	if err == nil || !strings.Contains(err.Error(), "bad token") {
		t.Fatalf("expected api error message, got %v", err)
	}
}

func TestReachable(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/orgs" {
			w.WriteHeader(404)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"organizations": []any{}})
	}))
	defer srv.Close()

	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	if err := c.Reachable(context.Background(), "tok"); err != nil {
		t.Fatalf("err %v", err)
	}
}

func TestCatalog(t *testing.T) {
	cats := ListCategories()
	if len(cats) != 9 {
		t.Errorf("expected 9 categories, got %d", len(cats))
	}

	themes := ListThemes()
	if len(themes) != 3 {
		t.Errorf("expected 3 themes, got %d", len(themes))
	}

	allLayouts := ListLayouts("", "")
	if len(allLayouts) != 110 {
		t.Errorf("expected 110 layouts, got %d", len(allLayouts))
	}

	bentoLayouts := ListLayouts("bento", "")
	if len(bentoLayouts) != 20 {
		t.Errorf("expected 20 bento layouts, got %d", len(bentoLayouts))
	}

	searchLayouts := ListLayouts("", "hero-centered-bold")
	if len(searchLayouts) != 1 {
		t.Errorf("expected 1 search result, got %d", len(searchLayouts))
	}
}

func TestParseDeckConfig(t *testing.T) {
	sample := `
import { defineConfig } from '@unsa/slides-kit';

export default defineConfig({
  title: 'Sistemas Distribuidos',
  slug: 'sistemas-distribuidos-lab1',
  theme: 'unsa-dark',
  visibility: 'org',
  orgSlug: 'epis-unsa',
  description: 'Procesamiento Concurrente',
});
`
	cfg := ParseDeckConfig(sample)
	if cfg.Title != "Sistemas Distribuidos" {
		t.Errorf("expected title 'Sistemas Distribuidos', got %q", cfg.Title)
	}
	if cfg.Slug != "sistemas-distribuidos-lab1" {
		t.Errorf("expected slug 'sistemas-distribuidos-lab1', got %q", cfg.Slug)
	}
	if cfg.Theme != "unsa-dark" {
		t.Errorf("expected theme 'unsa-dark', got %q", cfg.Theme)
	}
	if cfg.Visibility != "org" {
		t.Errorf("expected visibility 'org', got %q", cfg.Visibility)
	}
	if cfg.OrgSlug != "epis-unsa" {
		t.Errorf("expected orgSlug 'epis-unsa', got %q", cfg.OrgSlug)
	}
	if cfg.Description != "Procesamiento Concurrente" {
		t.Errorf("expected description 'Procesamiento Concurrente', got %q", cfg.Description)
	}
}

func TestZipDirectory(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, dir, "index.html", "<h1>Hello</h1>")
	writeFile(t, dir, "style.css", "body { margin: 0; }")

	zipBytes, err := ZipDirectory(dir)
	if err != nil {
		t.Fatalf("ZipDirectory failed: %v", err)
	}
	if len(zipBytes) == 0 {
		t.Fatal("expected non-empty zip bytes")
	}
}

func TestDeployMultipart(t *testing.T) {
	var gotContentType string
	var gotAuth string
	var gotSlug string
	var fileBytesLen int

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotContentType = r.Header.Get("Content-Type")
		gotAuth = r.Header.Get("Authorization")
		if err := r.ParseMultipartForm(10 << 20); err == nil {
			gotSlug = r.FormValue("slug")
			if file, _, err := r.FormFile("bundle"); err == nil {
				buf := new(bytes.Buffer)
				_, _ = io.Copy(buf, file)
				_ = file.Close()
				fileBytesLen = buf.Len()
			}
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"success":        true,
			"presentationId": "22222222-2222-2222-2222-222222222222",
			"slug":           "multipart-demo",
			"version":        1,
			"url":            "http://x/p/multipart-demo",
			"message":        "ok",
		})
	}))
	defer srv.Close()

	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	dummyZip := []byte("PK\x05\x06dummy-zip-content")
	resp, err := c.Deploy(context.Background(), "unsareport_pat_multi", &DeployRequest{
		Slug:       "multipart-demo",
		Title:      "Multipart Demo",
		Visibility: "public",
		ZipBytes:   dummyZip,
		Manifest:   map[string]any{"name": "multipart-demo", "title": "Multipart Demo"},
	})
	if err != nil {
		t.Fatalf("Deploy multipart failed: %v", err)
	}
	if !resp.Success || resp.Version != 1 {
		t.Errorf("unexpected response %+v", resp)
	}
	if !strings.HasPrefix(gotContentType, "multipart/form-data") {
		t.Errorf("expected Content-Type to start with multipart/form-data, got %q", gotContentType)
	}
	if gotAuth != "Bearer unsareport_pat_multi" {
		t.Errorf("expected auth Bearer unsareport_pat_multi, got %q", gotAuth)
	}
	if gotSlug != "multipart-demo" {
		t.Errorf("expected slug 'multipart-demo', got %q", gotSlug)
	}
	if fileBytesLen != len(dummyZip) {
		t.Errorf("expected bundle size %d, got %d", len(dummyZip), fileBytesLen)
	}
}
