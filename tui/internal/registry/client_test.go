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

	"github.com/UNSAReport/tui/internal/testutil"
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
	pkgToml := "[project]\nconfig_version = 1\n\n[package]\nname = \"@test/pkg\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\n\n[templates]\nfiles = []\n"
	if err := os.WriteFile(filepath.Join(tmpDir, "unsareport.toml"), []byte(pkgToml), 0o600); err != nil {
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
		t.Fatal("expected unsareport.toml error")
	}
}

func TestSharedMockRegistry(t *testing.T) {
	srv := testutil.MockRegistry(t)
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	v, err := c.ResolveVersion(context.Background(), "@scope/cardo", "^1.0.0")
	if err != nil {
		t.Fatalf("ResolveVersion failed: %v", err)
	}
	if v != "1.0.0" {
		t.Fatalf("version %q", v)
	}
	files, err := c.DownloadSection(context.Background(), "@scope/cardo", "1.0.0", "components")
	if err != nil {
		t.Fatalf("DownloadSection failed: %v", err)
	}
	if string(files["lib.typ"]) != "#let note(body) = block()[#body]\n" {
		t.Fatalf("content %q", files["lib.typ"])
	}
	tpl, err := c.DownloadSection(context.Background(), "@scope/cardo", "1.0.0", "templates")
	if err != nil {
		t.Fatalf("DownloadSection templates failed: %v", err)
	}
	if len(tpl["report.typ"]) == 0 {
		t.Fatal("expected report.typ in templates")
	}
}
