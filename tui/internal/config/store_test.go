package config

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestXDGStore(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	t.Setenv("UNSAREP_TOKEN", "")
	t.Setenv("UNSAREP_REGISTRY_URL", "")

	cfg := &XDGConfig{RegistryURL: "https://example.com", APIURL: "https://idp.example.com", Locale: "es"}
	if err := SaveXDGConfig(cfg); err != nil {
		t.Fatal(err)
	}
	loaded, err := LoadXDGConfig()
	if err != nil {
		t.Fatal(err)
	}
	if loaded.RegistryURL != cfg.RegistryURL {
		t.Fatalf("registry %q", loaded.RegistryURL)
	}
	if GetRegistryURL() != cfg.RegistryURL {
		t.Fatalf("GetRegistryURL %q", GetRegistryURL())
	}
	t.Setenv("UNSAREP_REGISTRY_URL", "https://override.com")
	if GetRegistryURL() != "https://override.com" {
		t.Fatal("env override failed")
	}
	t.Setenv("UNSAREP_REGISTRY_URL", "")

	if err := SaveToken("secret123"); err != nil {
		t.Fatal(err)
	}
	info, _ := os.Stat(filepath.Join(tmp, AppDirName, TokenFileName))
	if runtime.GOOS != "windows" && info.Mode().Perm() != PermFilePrivate {
		t.Fatalf("perm %o", info.Mode().Perm())
	}
	if tok := GetToken(); tok != "secret123" {
		t.Fatalf("token %q", tok)
	}
	t.Setenv("UNSAREP_TOKEN", "envtok")
	if GetToken() != "envtok" {
		t.Fatal("env token override")
	}
	t.Setenv("UNSAREP_TOKEN", "")
	if err := ClearToken(); err != nil {
		t.Fatal(err)
	}
	if GetToken() != "" {
		t.Fatal("token should be empty after clear")
	}
}

func TestValidateURL(t *testing.T) {
	valid := []struct {
		in   string
		want string
	}{
		{"https://unsareport.ynoacamino.tech", "https://unsareport.ynoacamino.tech"},
		{"http://localhost:9876/api/registry/", "http://localhost:9876/api/registry"},
		{"https://unsareport.ynoacamino.tech/api/auth///", "https://unsareport.ynoacamino.tech/api/auth"},
	}
	for _, tc := range valid {
		got, err := ValidateURL(tc.in, "test")
		if err != nil {
			t.Fatalf("ValidateURL(%q) unexpected error: %v", tc.in, err)
		}
		if got != tc.want {
			t.Fatalf("ValidateURL(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}

	invalid := []string{
		"",
		"   ",
		"not-a-url",
		"://missing-scheme",
		"ftp://unsupported-scheme",
		"/just/a/path",
	}
	for _, tc := range invalid {
		if _, err := ValidateURL(tc, "test"); err == nil {
			t.Fatalf("ValidateURL(%q) expected error, got nil", tc)
		}
	}
}

func TestURLResolutionDefaultsAndOverrides(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	t.Setenv(EnvRegistryURL, "")
	t.Setenv(EnvIDPIssuer, "")
	t.Setenv(EnvSlidesURL, "")
	t.Setenv(EnvWebsiteURL, "")

	// Defaults check
	if got := GetRegistryURL(); got != DefaultRegistryURL {
		t.Fatalf("GetRegistryURL() default = %q, want %q", got, DefaultRegistryURL)
	}
	if got := GetAuthURL(); got != DefaultAuthURL {
		t.Fatalf("GetAuthURL() default = %q, want %q", got, DefaultAuthURL)
	}
	if got := GetSlidesURL(); got != DefaultSlidesURL {
		t.Fatalf("GetSlidesURL() default = %q, want %q", got, DefaultSlidesURL)
	}
	if got := GetWebsiteURL(); got != DefaultWebsiteURL {
		t.Fatalf("GetWebsiteURL() default = %q, want %q", got, DefaultWebsiteURL)
	}

	// Environment variable overrides
	t.Setenv(EnvRegistryURL, "http://localhost:9876/api/registry")
	t.Setenv(EnvIDPIssuer, "http://localhost:9876/api/auth")
	t.Setenv(EnvSlidesURL, "http://localhost:9876/api/slides")
	t.Setenv(EnvWebsiteURL, "http://localhost:9876")

	if got := GetRegistryURL(); got != "http://localhost:9876/api/registry" {
		t.Fatalf("GetRegistryURL() override = %q", got)
	}
	if got := GetAuthURL(); got != "http://localhost:9876/api/auth" {
		t.Fatalf("GetAuthURL() override = %q", got)
	}
	if got := GetSlidesURL(); got != "http://localhost:9876/api/slides" {
		t.Fatalf("GetSlidesURL() override = %q", got)
	}
	if got := GetWebsiteURL(); got != "http://localhost:9876" {
		t.Fatalf("GetWebsiteURL() override = %q", got)
	}

	// Invalid URL override fails fast
	t.Setenv(EnvRegistryURL, "bad-url")
	if _, err := ResolveRegistryURL(); err == nil {
		t.Fatal("ResolveRegistryURL() should return error for invalid URL")
	}

	// Panic check on invalid URL for GetRegistryURL
	defer func() {
		r := recover()
		if r == nil {
			t.Fatal("GetRegistryURL() should panic on invalid URL")
		}
	}()
	_ = GetRegistryURL()
}

