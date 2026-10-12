package updater

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/UNSAReport/tui/internal/config"
)

func TestCacheState_SaveAndLoad(t *testing.T) {
	tmpDir := t.TempDir()
	orig := os.Getenv(config.EnvXDGCacheHome)
	defer os.Setenv(config.EnvXDGCacheHome, orig)

	os.Setenv(config.EnvXDGCacheHome, tmpDir)

	state := &CacheState{
		LastChecked:     1728690000,
		Channel:         "stable",
		UpdateAvailable: true,
		LatestVersion:   "v0.2.0",
		LatestCommit:    "abc1234",
		ReleaseURL:      "https://example.com/release",
	}

	if err := SaveCache(state); err != nil {
		t.Fatalf("SaveCache failed: %v", err)
	}

	loaded, err := LoadCache()
	if err != nil {
		t.Fatalf("LoadCache failed: %v", err)
	}
	if loaded == nil {
		t.Fatal("expected non-nil loaded cache")
	}

	if loaded.LastChecked != state.LastChecked ||
		loaded.Channel != state.Channel ||
		loaded.UpdateAvailable != state.UpdateAvailable ||
		loaded.LatestVersion != state.LatestVersion ||
		loaded.LatestCommit != state.LatestCommit ||
		loaded.ReleaseURL != state.ReleaseURL {
		t.Errorf("loaded cache mismatch: %+v vs %+v", loaded, state)
	}

	expectedPath := filepath.Join(tmpDir, config.AppDirName, config.UpdateCacheFileName)
	if _, err := os.Stat(expectedPath); err != nil {
		t.Errorf("cache file not found at %s: %v", expectedPath, err)
	}
}
