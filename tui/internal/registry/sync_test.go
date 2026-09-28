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
)

func TestSyncWorkspaceInternal(t *testing.T) {
	ws := t.TempDir()

	if err := os.Mkdir(filepath.Join(ws, ".git"), 0o755); err != nil {
		t.Fatal(err)
	}

	pkgADir := filepath.Join(ws, "scope-a", "pkg-a")
	pkgBDir := filepath.Join(ws, "scope-a", "pkg-b")
	if err := os.MkdirAll(pkgADir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(pkgBDir, 0o755); err != nil {
		t.Fatal(err)
	}

	tomlA := `[project]
config_version = 1

[package]
name = "@scope-a/pkg-a"
version = "0.1.0"

[dependencies]
"@scope-a/pkg-b" = "^0.1.0"
`
	tomlB := `[project]
config_version = 1

[package]
name = "@scope-a/pkg-b"
version = "0.1.0"
`
	if err := os.WriteFile(filepath.Join(pkgADir, "unsareport.toml"), []byte(tomlA), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgADir, "lib.typ"), []byte("#let a = 1"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgBDir, "unsareport.toml"), []byte(tomlB), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(pkgBDir, "lib.typ"), []byte("#let b = 2"), 0o644); err != nil {
		t.Fatal(err)
	}

	res, err := SyncWorkspace(context.Background(), nil, ws, SyncOptions{})
	if err != nil {
		t.Fatalf("SyncWorkspace failed: %v", err)
	}

	if len(res.Packages) != 2 {
		t.Fatalf("expected 2 packages synced, got %d", len(res.Packages))
	}

	linkA := filepath.Join(ws, "components", "@scope-a", "pkg-a")
	fiA, err := os.Lstat(linkA)
	if err != nil {
		t.Fatalf("stat symlink A failed: %v", err)
	}
	if fiA.Mode()&os.ModeSymlink == 0 {
		t.Fatalf("expected symlink for pkg-a, got mode %v", fiA.Mode())
	}

	contentA, err := os.ReadFile(filepath.Join(linkA, "lib.typ"))
	if err != nil {
		t.Fatalf("read through symlink failed: %v", err)
	}
	if string(contentA) != "#let a = 1" {
		t.Fatalf("unexpected content: %s", string(contentA))
	}

	gi, err := os.ReadFile(filepath.Join(ws, ".gitignore"))
	if err != nil {
		t.Fatalf("read gitignore failed: %v", err)
	}
	if !strings.Contains(string(gi), "/components/") {
		t.Fatalf("expected .gitignore to contain /components/, got %s", string(gi))
	}

	cleanRes, err := SyncWorkspace(context.Background(), nil, ws, SyncOptions{Clean: true})
	if err != nil {
		t.Fatalf("clean failed: %v", err)
	}
	if !cleanRes.Cleaned {
		t.Fatalf("expected cleaned=true")
	}
	if _, err := os.Stat(filepath.Join(ws, "components")); !os.IsNotExist(err) {
		t.Fatalf("expected components/ to be removed after clean")
	}
}

func TestSyncWorkspaceRegistry(t *testing.T) {
	var zipBuf bytes.Buffer
	zw := zip.NewWriter(&zipBuf)
	w, err := zw.Create("lib.typ")
	if err != nil {
		t.Fatal(err)
	}
	_, _ = w.Write([]byte("#let define = 42"))
	if err := zw.Close(); err != nil {
		t.Fatal(err)
	}
	zipBytes := zipBuf.Bytes()

	var srv *httptest.Server
	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/resolve" {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"resolved": []any{
					map[string]any{
						"name":        "@unsareport/define",
						"version":     "0.1.0",
						"archive_url": srv.URL + "/dl.zip",
						"files":       []any{"lib.typ"},
					},
				},
			})
			return
		}
		if strings.Contains(r.URL.Path, "/archive") {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"archive_url": srv.URL + "/dl.zip",
			})
			return
		}
		if r.URL.Path == "/dl.zip" {
			w.Header().Set("Content-Type", "application/zip")
			_, _ = w.Write(zipBytes)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	client := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}

	ws := t.TempDir()
	pkgDir := filepath.Join(ws, "my-pkg")
	if err := os.MkdirAll(pkgDir, 0o755); err != nil {
		t.Fatal(err)
	}
	manifest := `[project]
config_version = 1

[package]
name = "@my/pkg"
version = "0.1.0"

[dependencies]
"@unsareport/define" = "^0.1.0"
`
	if err := os.WriteFile(filepath.Join(pkgDir, "unsareport.toml"), []byte(manifest), 0o644); err != nil {
		t.Fatal(err)
	}

	res, err := SyncWorkspace(context.Background(), client, ws, SyncOptions{})
	if err != nil {
		t.Fatalf("SyncWorkspace failed: %v", err)
	}

	if len(res.Packages) != 2 {
		t.Fatalf("expected 2 packages, got %d", len(res.Packages))
	}

	defContent, err := os.ReadFile(filepath.Join(ws, "components", "@unsareport", "define", "lib.typ"))
	if err != nil {
		t.Fatalf("read downloaded file failed: %v", err)
	}
	if string(defContent) != "#let define = 42" {
		t.Fatalf("unexpected content: %s", string(defContent))
	}
}
