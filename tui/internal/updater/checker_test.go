package updater

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/UNSAReport/tui/internal/config"
)

func TestResolveChannel(t *testing.T) {
	origEnv := os.Getenv(config.EnvUpdateChannel)
	origCfg := config.Channel
	defer func() {
		os.Setenv(config.EnvUpdateChannel, origEnv)
		config.Channel = origCfg
	}()

	os.Unsetenv(config.EnvUpdateChannel)
	config.Channel = config.ChannelStable

	if ch := ResolveChannel("dev"); ch != config.ChannelDev {
		t.Errorf("expected dev from override, got %s", ch)
	}
	if ch := ResolveChannel("STABLE"); ch != config.ChannelStable {
		t.Errorf("expected stable from override, got %s", ch)
	}

	os.Setenv(config.EnvUpdateChannel, "dev")
	if ch := ResolveChannel(""); ch != config.ChannelDev {
		t.Errorf("expected dev from env, got %s", ch)
	}

	os.Unsetenv(config.EnvUpdateChannel)
	config.Channel = config.ChannelDev
	if ch := ResolveChannel(""); ch != config.ChannelDev {
		t.Errorf("expected dev from config, got %s", ch)
	}
}

func TestResolveEndpoint(t *testing.T) {
	orig := os.Getenv(config.EnvUpdateEndpoint)
	defer os.Setenv(config.EnvUpdateEndpoint, orig)

	os.Unsetenv(config.EnvUpdateEndpoint)
	if ep := ResolveEndpoint(); ep != config.DefaultUpdateEndpoint {
		t.Errorf("expected default endpoint, got %s", ep)
	}

	custom := "https://custom.endpoint.com/api/version"
	os.Setenv(config.EnvUpdateEndpoint, custom)
	if ep := ResolveEndpoint(); ep != custom {
		t.Errorf("expected custom endpoint, got %s", ep)
	}
}

func TestQueryManifest(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/version" {
			manifest := Manifest{
				Stable: ReleaseInfo{
					Version:    "v0.2.0",
					ReleaseURL: "https://example.com/v0.2.0",
				},
				Dev: ReleaseInfo{
					Version:    "v0.3.0-dev",
					Commit:     "1234567",
					Branch:     "dev",
					ReleaseURL: "https://example.com/dev",
				},
			}
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(manifest)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	ctx := context.Background()
	manifest, err := QueryManifest(ctx, server.URL+"/api/version")
	if err != nil {
		t.Fatalf("QueryManifest failed: %v", err)
	}
	if manifest.Stable.Version != "v0.2.0" {
		t.Errorf("expected stable v0.2.0, got %s", manifest.Stable.Version)
	}
	if manifest.Dev.Commit != "1234567" {
		t.Errorf("expected dev commit 1234567, got %s", manifest.Dev.Commit)
	}

	_, err = QueryManifest(ctx, server.URL+"/not-found")
	if err == nil {
		t.Fatal("expected error on 404, got nil")
	}
}

func TestIsNewer_Stable(t *testing.T) {
	tests := []struct {
		current string
		target  string
		newer   bool
	}{
		{"v0.1.0", "v0.1.1", true},
		{"v0.1.1", "v0.1.0", false},
		{"v0.1.0", "v0.1.0", false},
		{"v0.1.0", "v1.0.0", true},
		{"dev", "v0.1.0", true},
	}

	for _, tc := range tests {
		isNewer, err := IsNewer(tc.current, "unknown", config.ChannelStable, ReleaseInfo{Version: tc.target})
		if err != nil {
			t.Errorf("IsNewer(%s, %s) error: %v", tc.current, tc.target, err)
		}
		if isNewer != tc.newer {
			t.Errorf("IsNewer(%s, %s) = %v; want %v", tc.current, tc.target, isNewer, tc.newer)
		}
	}
}

func TestIsNewer_Dev(t *testing.T) {
	target := ReleaseInfo{
		Version: "v0.2.0-dev",
		Commit:  "abcdef1",
	}

	isNewer, err := IsNewer("v0.1.0", "abcdef1", config.ChannelDev, target)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if isNewer {
		t.Errorf("expected false for identical dev commit SHA")
	}

	isNewer, err = IsNewer("v0.1.0", "1111111", config.ChannelDev, target)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !isNewer {
		t.Errorf("expected true for different dev commit SHA")
	}
}
