package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestInvalidSaveURLRejected(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	t.Setenv(EnvRegistryURL, "")
	if err := SaveXDGConfig(&XDGConfig{RegistryURL: "bad-url"}); err != nil {
		t.Fatal(err)
	}
	if _, err := GetRegistryURL(); err == nil || !strings.Contains(err.Error(), "valid http or https") {
		t.Fatalf("expected invalid-URL error, got %v", err)
	}
}

func TestInvalidClearMissing(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	t.Setenv(EnvTokenPath, "")
	if err := ClearToken(); err != nil {
		t.Fatalf("clear on missing token must be a no-op, got %v", err)
	}
	if GetToken() != "" {
		t.Fatal("token must be empty after clear")
	}
}

func TestInvalidTokenWhitespace(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	t.Setenv(EnvToken, "")
	t.Setenv(EnvTokenPath, "")
	if err := SaveToken("   spaced-token   "); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(tmp, AppDirName, TokenFileName))
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != "   spaced-token   " {
		t.Fatalf("stored bytes %q", raw)
	}
	if got := GetToken(); got != "spaced-token" {
		t.Fatalf("GetToken %q", got)
	}
	t.Setenv(EnvToken, "  env-spaced  ")
	if got := GetToken(); got != "env-spaced" {
		t.Fatalf("env GetToken %q", got)
	}
}
