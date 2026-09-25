package project

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestInvalidBOMTolerated(t *testing.T) {
	path := filepath.Join(t.TempDir(), "unsareport.toml")
	if err := os.WriteFile(path, []byte("\xef\xbb\xbf"+minimalToml), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("BOM-prefixed config must load, got %v", err)
	}
	if cfg.Project.ConfigVersion != 1 {
		t.Fatalf("config version %d", cfg.Project.ConfigVersion)
	}
}

func TestInvalidUnknownAliasField(t *testing.T) {
	path := filepath.Join(t.TempDir(), "unsareport.toml")
	if err := os.WriteFile(path, []byte(minimalToml+"x = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(path); err == nil || !strings.Contains(err.Error(), "unknown field") {
		t.Fatalf("expected unknown-field error, got %v", err)
	}
}

func TestInvalidBadFragment(t *testing.T) {
	tmp := t.TempDir()
	cfgPath := filepath.Join(tmp, "unsareport.toml")
	if err := os.WriteFile(cfgPath, []byte(minimalToml), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmp, "unsareport.d", "scripts"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "scripts", "bad.toml"), []byte("alias = \"x:y\"\n\n[commands]\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(cfgPath); err == nil || !strings.Contains(err.Error(), "must not be empty") {
		t.Fatalf("expected bad-fragment error, got %v", err)
	}
}
