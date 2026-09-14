package registry

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestListTemplates_Hono(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/packages" {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"packages": []map[string]any{
					{"name": "lab", "description": "lab desc"},
					{"name": "multi-lab", "description": "multi desc"},
				},
			})
			return
		}
		w.WriteHeader(404)
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	templates, err := c.ListTemplates(context.Background())
	if err != nil {
		t.Fatalf("err %v", err)
	}
	if len(templates) != 2 {
		t.Fatalf("len %d", len(templates))
	}
	if templates[0].Name != "lab" {
		t.Fatalf("name %q", templates[0].Name)
	}
}

func TestGetTemplateVersion_Semver(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1/packages/lab":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"name":        "lab",
				"description": "lab",
				"versions":    []string{"1.0.0", "1.1.0", "2.0.0"},
			})
		case "/v1/packages/lab/versions":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"versions": []map[string]any{{"version": "1.0.0"}, {"version": "1.1.0"}, {"version": "2.0.0"}},
			})
		default:
			w.WriteHeader(404)
		}
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	info, err := c.GetTemplateVersion(context.Background(), "lab", "^1.0.0")
	if err != nil {
		t.Fatalf("err %v", err)
	}
	if info.Version != "1.1.0" {
		t.Fatalf("resolved %q", info.Version)
	}
}

func TestDownloadAndExtract(t *testing.T) {
	var zipBuf bytes.Buffer
	zw := zip.NewWriter(&zipBuf)
	w, err := zw.Create("main.typ")
	if err != nil {
		t.Fatal(err)
	}
	_, _ = w.Write([]byte("#let x = 1"))
	_ = zw.Close()

	var srv *httptest.Server
	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1/test-pkg/1.0.0/archive":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"package":     "test-pkg",
				"version":     "1.0.0",
				"archive_url": srv.URL + "/archive.zip",
			})
		case "/archive.zip":
			w.Header().Set("Content-Type", "application/zip")
			_, _ = w.Write(zipBuf.Bytes())
		default:
			w.WriteHeader(404)
		}
	}))
	defer srv.Close()

	tmpDir := t.TempDir()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	if err := c.DownloadAndExtract(context.Background(), "test-pkg", "1.0.0", tmpDir); err != nil {
		t.Fatalf("DownloadAndExtract failed: %v", err)
	}

	content, err := os.ReadFile(filepath.Join(tmpDir, "main.typ"))
	if err != nil {
		t.Fatalf("read extracted file: %v", err)
	}
	if string(content) != "#let x = 1" {
		t.Fatalf("unexpected content: %q", string(content))
	}
}

func TestPublishPackage(t *testing.T) {
	tmpDir := t.TempDir()
	manifestContent := `{"name":"test-pkg","version":"1.0.0","files":["main.typ"]}`
	if err := os.WriteFile(filepath.Join(tmpDir, "manifest.json"), []byte(manifestContent), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tmpDir, "main.typ"), []byte("// typst"), 0600); err != nil {
		t.Fatal(err)
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/packages" && r.Method == "POST" {
			file, _, err := r.FormFile("file")
			if err != nil {
				w.WriteHeader(400)
				_ = json.NewEncoder(w).Encode(map[string]any{"error": "ValidationError", "message": "missing file"})
				return
			}
			defer file.Close()
			w.WriteHeader(201)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"package": "test-pkg",
				"version": "1.0.0",
				"status":  "approved",
			})
			return
		}
		w.WriteHeader(404)
	}))
	defer srv.Close()

	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	if err := c.PublishPackage(context.Background(), tmpDir); err != nil {
		t.Fatalf("PublishPackage failed: %v", err)
	}
}

