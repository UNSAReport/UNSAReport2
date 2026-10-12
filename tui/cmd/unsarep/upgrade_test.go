package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/updater"
)

func TestUpgradeCmd_Flags(t *testing.T) {
	cmd := newUpgradeCmd()
	if cmd.Flags().Lookup("check") == nil {
		t.Fatal("expected --check flag on upgrade command")
	}
	if cmd.Flags().Lookup("channel") == nil {
		t.Fatal("expected --channel flag on upgrade command")
	}
	if cmd.Flags().Lookup("yes") == nil {
		t.Fatal("expected --yes flag on upgrade command")
	}
	if cmd.Flags().Lookup("force") == nil {
		t.Fatal("expected --force flag on upgrade command")
	}
}

func TestUpgradeCmd_Disabled(t *testing.T) {
	orig := os.Getenv(config.EnvDisableAutoUpdate)
	defer os.Setenv(config.EnvDisableAutoUpdate, orig)

	os.Setenv(config.EnvDisableAutoUpdate, "1")

	cmd := newUpgradeCmd()
	cmd.SetArgs([]string{"--check"})

	err := cmd.Execute()
	if err == nil {
		t.Fatal("expected error when automatic updates are disabled, got nil")
	}
	if err.Error() != "automatic updates are disabled" {
		t.Fatalf("got error %q, want 'automatic updates are disabled'", err.Error())
	}
}

func TestUpgradeCmd_CheckOnly(t *testing.T) {
	origDisabled := os.Getenv(config.EnvDisableAutoUpdate)
	origEndpoint := os.Getenv(config.EnvUpdateEndpoint)
	origVer := config.Version
	origCommit := config.GitCommit
	defer func() {
		os.Setenv(config.EnvDisableAutoUpdate, origDisabled)
		os.Setenv(config.EnvUpdateEndpoint, origEndpoint)
		config.Version = origVer
		config.GitCommit = origCommit
	}()

	os.Unsetenv(config.EnvDisableAutoUpdate)
	config.Version = "v0.1.0"
	config.GitCommit = "old1234"

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		manifest := updater.Manifest{
			Stable: updater.ReleaseInfo{
				Version:    "v0.2.0",
				ReleaseURL: "https://github.com/UNSAReport/UNSAReport2/releases/tag/v0.2.0",
			},
			Dev: updater.ReleaseInfo{
				Version: "v0.3.0-dev",
				Commit:  "new5678",
			},
		}
		_ = json.NewEncoder(w).Encode(manifest)
	}))
	defer server.Close()

	os.Setenv(config.EnvUpdateEndpoint, server.URL)

	cmd := newUpgradeCmd()
	var outBuf bytes.Buffer
	cmd.SetOut(&outBuf)
	cmd.SetArgs([]string{"--check", "--channel", "stable"})

	err := cmd.Execute()
	if err != nil {
		t.Fatalf("unexpected error on upgrade --check: %v", err)
	}
}
