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
	"time"

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

func TestListPackages(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/packages" {
			w.WriteHeader(404)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"packages": []map[string]any{
				{
					"name":        "@unsareport/epis-lab",
					"description": "EPIS Lab Report",
					"version":     "0.1.1",
					"versions":    []string{"0.1.1", "0.1.0"},
				},
				{
					"name":          "@unsareport/legacy-pkg",
					"description":   "Legacy package",
					"latestVersion": "1.2.3",
				},
			},
		})
	}))
	defer srv.Close()

	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	pkgs, err := c.ListPackages(context.Background())
	if err != nil {
		t.Fatalf("ListPackages failed: %v", err)
	}
	if len(pkgs) != 2 {
		t.Fatalf("expected 2 packages, got %d", len(pkgs))
	}

	if pkgs[0].Name != "@unsareport/epis-lab" {
		t.Errorf("expected @unsareport/epis-lab, got %q", pkgs[0].Name)
	}
	if pkgs[0].Version != "0.1.1" {
		t.Errorf("expected version 0.1.1, got %q", pkgs[0].Version)
	}
	if len(pkgs[0].Versions) != 2 || pkgs[0].Versions[0] != "0.1.1" || pkgs[0].Versions[1] != "0.1.0" {
		t.Errorf("expected versions [0.1.1, 0.1.0], got %v", pkgs[0].Versions)
	}

	if pkgs[1].Name != "@unsareport/legacy-pkg" {
		t.Errorf("expected @unsareport/legacy-pkg, got %q", pkgs[1].Name)
	}
	if pkgs[1].Version != "1.2.3" {
		t.Errorf("expected version 1.2.3 from latestVersion, got %q", pkgs[1].Version)
	}
	if len(pkgs[1].Versions) != 1 || pkgs[1].Versions[0] != "1.2.3" {
		t.Errorf("expected versions [1.2.3], got %v", pkgs[1].Versions)
	}
}

func TestSearchPackages(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/packages" {
			w.WriteHeader(404)
			return
		}
		q := r.URL.Query().Get("q")
		limit := r.URL.Query().Get("limit")
		if q != "report template" {
			t.Errorf("expected query 'report template', got %q", q)
		}
		if limit != "10" {
			t.Errorf("expected limit '10', got %q", limit)
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"packages": []any{
				map[string]any{
					"name":        "@unsa/report-template",
					"description": "Report template",
					"version":     "1.0.0",
				},
			},
		})
	}))
	defer srv.Close()

	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	pkgs, err := c.SearchPackages(context.Background(), "report template", 10)
	if err != nil {
		t.Fatalf("SearchPackages failed: %v", err)
	}
	if len(pkgs) != 1 {
		t.Fatalf("expected 1 package, got %d", len(pkgs))
	}
	if pkgs[0].Name != "@unsa/report-template" {
		t.Errorf("expected @unsa/report-template, got %q", pkgs[0].Name)
	}
}

func TestGetAndSaveCachedPackages(t *testing.T) {
	tmpDir := t.TempDir()
	cachePath := filepath.Join(tmpDir, "registry.json")
	c := &Client{CachePath: cachePath}

	pkgs, ok := c.GetCachedPackages()
	if ok || pkgs != nil {
		t.Fatalf("expected cache miss, got ok=%v, pkgs=%v", ok, pkgs)
	}

	sample := []PackageInfo{
		{Name: "@unsa/pkg1", Version: "1.0.0", Description: "First"},
		{Name: "@unsa/pkg2", Version: "2.0.0", Description: "Second"},
	}
	if err := c.SaveCachedPackages(sample); err != nil {
		t.Fatalf("SaveCachedPackages failed: %v", err)
	}

	cached, ok := c.GetCachedPackages()
	if !ok {
		t.Fatalf("expected cache hit")
	}
	if len(cached) != 2 {
		t.Fatalf("expected 2 cached packages, got %d", len(cached))
	}
	if cached[0].Name != "@unsa/pkg1" || cached[1].Name != "@unsa/pkg2" {
		t.Errorf("unexpected cached content: %+v", cached)
	}

	expired := RegistryCache{
		Timestamp: time.Now().Add(-24 * time.Hour),
		Packages:  sample,
	}
	expiredData, err := json.Marshal(expired)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(cachePath, expiredData, 0o600); err != nil {
		t.Fatal(err)
	}

	_, ok = c.GetCachedPackages()
	if ok {
		t.Fatalf("expected cache miss for expired cache")
	}
}

func TestListPackagesCached(t *testing.T) {
	tmpDir := t.TempDir()
	cachePath := filepath.Join(tmpDir, "registry.json")

	networkHits := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		networkHits++
		_ = json.NewEncoder(w).Encode(map[string]any{
			"packages": []any{
				map[string]any{
					"name":        "@unsa/cached-test",
					"description": "Cached test package",
					"version":     "0.1.0",
				},
			},
		})
	}))
	defer srv.Close()

	c := &Client{
		BaseURL:    srv.URL,
		HTTPClient: srv.Client(),
		CachePath:  cachePath,
	}

	pkgs1, err := c.ListPackagesCached(context.Background())
	if err != nil {
		t.Fatalf("ListPackagesCached failed: %v", err)
	}
	if len(pkgs1) != 1 || pkgs1[0].Name != "@unsa/cached-test" {
		t.Fatalf("unexpected packages: %+v", pkgs1)
	}
	if networkHits != 1 {
		t.Fatalf("expected 1 network hit, got %d", networkHits)
	}

	pkgs2, err := c.ListPackagesCached(context.Background())
	if err != nil {
		t.Fatalf("ListPackagesCached (2nd) failed: %v", err)
	}
	if len(pkgs2) != 1 || pkgs2[0].Name != "@unsa/cached-test" {
		t.Fatalf("unexpected packages: %+v", pkgs2)
	}
	if networkHits != 1 {
		t.Fatalf("expected still 1 network hit, got %d", networkHits)
	}
}
