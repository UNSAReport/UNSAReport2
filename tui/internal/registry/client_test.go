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

func TestResolve(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/resolve" && r.Method == "POST" {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"resolved": []any{
					map[string]any{"name": "lab", "version": "1.2.0", "archive_url": "http://x/y.zip", "files": []any{"lib.typ"}},
				},
			})
			return
		}
		w.WriteHeader(404)
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	v, err := c.ResolveVersion(context.Background(), "lab", "^1.0.0")
	if err != nil {
		t.Fatalf("err %v", err)
	}
	if v != "1.2.0" {
		t.Fatalf("version %q", v)
	}
}

func TestDownloadSection(t *testing.T) {
	var zipBuf bytes.Buffer
	zw := zip.NewWriter(&zipBuf)
	w, err := zw.Create("lib.typ")
	if err != nil {
		t.Fatal(err)
	}
	_, _ = w.Write([]byte("#let x = 1"))
	if err := zw.Close(); err != nil {
		t.Fatal(err)
	}
	zipBytes := zipBuf.Bytes()
	var srv *httptest.Server
	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("section") != "components" {
			w.WriteHeader(400)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"archive_url": srv.URL + "/dl.zip"})
	}))
	defer srv.Close()
	dl := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write(zipBytes)
	}))
	defer dl.Close()
	_ = srv
	mux := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/dl.zip" {
			_, _ = w.Write(zipBytes)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"archive_url": "http://" + r.Host + "/dl.zip"})
	}))
	defer mux.Close()
	c := &Client{BaseURL: mux.URL, HTTPClient: mux.Client()}
	files, err := c.DownloadSection(context.Background(), "test-pkg", "1.0.0", "components")
	if err != nil {
		t.Fatalf("DownloadSection failed: %v", err)
	}
	if string(files["lib.typ"]) != "#let x = 1" {
		t.Fatalf("content %q", files["lib.typ"])
	}
	if _, err := c.DownloadSection(context.Background(), "test-pkg", "1.0.0", "bogus"); err == nil {
		t.Fatal("expected section error")
	}
}

func TestPublish(t *testing.T) {
	tmpDir := t.TempDir()
	pkgToml := "[package]\nname = \"test-pkg\"\nversion = \"1.0.0\"\nentrypoint = \"lib.typ\"\n\n[components]\nfiles = [\"lib.typ\"]\ndepends_on = []\n\n[templates]\nfiles = []\n"
	if err := os.WriteFile(filepath.Join(tmpDir, "pkg.toml"), []byte(pkgToml), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tmpDir, "lib.typ"), []byte("#let x = 1"), 0o600); err != nil {
		t.Fatal(err)
	}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/packages" || r.Method != "POST" {
			w.WriteHeader(404)
			return
		}
		w.WriteHeader(201)
		_, _ = w.Write([]byte(`{"message":"ok"}`))
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	if err := c.Publish(context.Background(), tmpDir, "", ""); err != nil {
		t.Fatalf("Publish failed: %v", err)
	}
	empty := t.TempDir()
	if err := c.Publish(context.Background(), empty, "", ""); err == nil {
		t.Fatal("expected pkg.toml error")
	}
}
