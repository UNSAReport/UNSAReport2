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
	"strings"
	"testing"

	"github.com/UNSAReport/tui/internal/config"
)

func TestInvalidResolveNotFound(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	if _, err := c.ResolveVersion(context.Background(), "lab", "^1.0.0"); err == nil || !strings.Contains(err.Error(), "404") {
		t.Fatalf("expected 404 error, got %v", err)
	}
}

func TestInvalidResolveServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	if _, err := c.Resolve(context.Background(), map[string]string{"lab": "^1.0.0"}); err == nil || !strings.Contains(err.Error(), "500") {
		t.Fatalf("expected 500 error, got %v", err)
	}
}

func invalidZipServer(t *testing.T, payload []byte) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/dl.zip" {
			_, _ = w.Write(payload)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"archive_url": "http://" + r.Host + "/dl.zip"})
	}))
}

func TestInvalidDownloadMalformedZip(t *testing.T) {
	mux := invalidZipServer(t, []byte("this is not a zip"))
	defer mux.Close()
	c := &Client{BaseURL: mux.URL, HTTPClient: mux.Client()}
	if _, err := c.DownloadSection(context.Background(), "test-pkg", "1.0.0", "components"); err == nil || !strings.Contains(err.Error(), "zip") {
		t.Fatalf("expected zip error, got %v", err)
	}
}

func TestInvalidDownloadMissingLib(t *testing.T) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	w, err := zw.Create("readme.txt")
	if err != nil {
		t.Fatal(err)
	}
	_, _ = w.Write([]byte("hi"))
	if err := zw.Close(); err != nil {
		t.Fatal(err)
	}
	mux := invalidZipServer(t, buf.Bytes())
	defer mux.Close()
	c := &Client{BaseURL: mux.URL, HTTPClient: mux.Client()}
	files, err := c.DownloadSection(context.Background(), "test-pkg", "1.0.0", "components")
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := files["lib.typ"]; ok {
		t.Fatal("lib.typ must be absent from archive without it")
	}
	if string(files["readme.txt"]) != "hi" {
		t.Fatalf("content %q", files["readme.txt"])
	}
}

func TestInvalidPublishNon201(t *testing.T) {
	dir := t.TempDir()
	pkgToml := "[project]\nconfig_version = 1\n\n[package]\nname = \"@test/pkg\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\n\n[templates]\nfiles = []\n"
	if err := os.WriteFile(filepath.Join(dir, "unsareport.toml"), []byte(pkgToml), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "lib.typ"), []byte("#let x = 1"), 0o600); err != nil {
		t.Fatal(err)
	}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(422)
		_ = json.NewEncoder(w).Encode(map[string]any{"message": "version exists"})
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	err := c.Publish(context.Background(), dir, "", "")
	if err == nil || !strings.Contains(err.Error(), "publish failed") || !strings.Contains(err.Error(), "version exists") {
		t.Fatalf("expected publish failure with server message, got %v", err)
	}
}

func TestInvalidAuthHeaderSent(t *testing.T) {
	t.Setenv(config.EnvToken, "unsareport_pat_hdr123")
	var got string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/packages" {
			w.WriteHeader(404)
			return
		}
		got = r.Header.Get("Authorization")
		_ = json.NewEncoder(w).Encode(map[string]any{"packages": []any{}})
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	pkgs, err := c.ListPackages(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(pkgs) != 0 {
		t.Fatalf("packages %v", pkgs)
	}
	if got != "Bearer unsareport_pat_hdr123" {
		t.Fatalf("auth header %q", got)
	}
}

func TestInvalidInitOverwrite(t *testing.T) {
	dir := t.TempDir()
	if err := InitPackage(InitOptions{Dir: dir, Name: "@scope/cardo"}); err != nil {
		t.Fatal(err)
	}
	if err := InitPackage(InitOptions{Dir: dir, Name: "@scope/cardo"}); err == nil || !strings.Contains(err.Error(), "is not empty") {
		t.Fatalf("expected overwrite rejection, got %v", err)
	}
}

func TestInvalidInitUnscoped(t *testing.T) {
	if err := InitPackage(InitOptions{Dir: t.TempDir(), Name: "cardo"}); err == nil || !strings.Contains(err.Error(), "unscoped") {
		t.Fatalf("expected unscoped rejection, got %v", err)
	}
}

func TestInvalidPublishSourceBadTOML(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "unsareport.toml"), []byte("[project\nconfig_version = "), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, _, err := resolvePublishSource(dir); err == nil || !strings.Contains(err.Error(), "publishable") {
		t.Fatalf("expected no-source error, got %v", err)
	}
	if err := CheckPackageDir(dir); err == nil || !strings.Contains(err.Error(), "parse") {
		t.Fatalf("expected parse error, got %v", err)
	}
}
