package registry

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const basePkgToml = `[project]
config_version = 1

[package]
name = "@scope/cardo"
version = "0.1.0"
description = "cards"

[components]
files = ["lib.typ", "assets/**/*"]

[templates]
files = ["template/**/*"]
`

func setupPackageDir(t *testing.T, files map[string]string) string {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "unsareport.toml"), []byte(basePkgToml), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "lib.typ"), []byte("#let card(x) = x\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	for relPath, content := range files {
		full := filepath.Join(dir, filepath.FromSlash(relPath))
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(full, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

func TestCheckPackageDirBundledAssets(t *testing.T) {
	t.Run("allows relative to package root and template dir", func(t *testing.T) {
		dir := setupPackageDir(t, map[string]string{
			"assets/logo.png":       "png-bytes",
			"template/badge.png":    "badge-bytes",
			"template/report.typ":   "#image(\"assets/logo.png\")\n#image(\"../assets/logo.png\")\n#image(\"badge.png\")\n#read(\"assets/logo.png\")\n",
		})
		if err := CheckPackageDir(dir); err != nil {
			t.Fatalf("expected CheckPackageDir to succeed, got %v", err)
		}
	})

	t.Run("rejects unbundled asset in template", func(t *testing.T) {
		dir := setupPackageDir(t, map[string]string{
			"assets/logo.png":     "png-bytes",
			"template/report.typ": "#image(\"assets/missing.png\")\n",
		})
		err := CheckPackageDir(dir)
		if err == nil {
			t.Fatal("expected error for unbundled asset, got nil")
		}
		if !strings.Contains(err.Error(), "asset not found in package") {
			t.Fatalf("unexpected error message: %v", err)
		}
	})

	t.Run("rejects root-absolute path in template", func(t *testing.T) {
		dir := setupPackageDir(t, map[string]string{
			"assets/logo.png":     "png-bytes",
			"template/report.typ": "#image(\"/components/cardo/assets/logo.png\")\n",
		})
		err := CheckPackageDir(dir)
		if err == nil {
			t.Fatal("expected error for root-absolute path, got nil")
		}
		if !strings.Contains(err.Error(), "only relative paths to bundled package assets are allowed") {
			t.Fatalf("unexpected error message: %v", err)
		}
	})

	t.Run("rejects escaping path in template", func(t *testing.T) {
		dir := setupPackageDir(t, map[string]string{
			"assets/logo.png":     "png-bytes",
			"template/report.typ": "#image(\"../../outside.png\")\n",
		})
		err := CheckPackageDir(dir)
		if err == nil {
			t.Fatal("expected error for escaping path, got nil")
		}
		if !strings.Contains(err.Error(), "asset not found in package") {
			t.Fatalf("unexpected error message: %v", err)
		}
	})

	t.Run("rejects non-literal path in template", func(t *testing.T) {
		dir := setupPackageDir(t, map[string]string{
			"assets/logo.png":     "png-bytes",
			"template/report.typ": "#let p = \"assets/logo.png\"\n#image(p)\n",
		})
		err := CheckPackageDir(dir)
		if err == nil {
			t.Fatal("expected error for dynamic path, got nil")
		}
		if !strings.Contains(err.Error(), "only string literals referencing bundled package assets are allowed") {
			t.Fatalf("unexpected error message: %v", err)
		}
	})

	t.Run("rejects backslash path in template", func(t *testing.T) {
		dir := setupPackageDir(t, map[string]string{
			"assets/logo.png":     "png-bytes",
			"template/report.typ": "#image(\"assets\\logo.png\")\n",
		})
		err := CheckPackageDir(dir)
		if err == nil {
			t.Fatal("expected error for backslash path, got nil")
		}
		if !strings.Contains(err.Error(), "backslashes are not allowed in asset paths") {
			t.Fatalf("unexpected error message: %v", err)
		}
	})
}
