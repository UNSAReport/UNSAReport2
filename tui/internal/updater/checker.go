package updater

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Masterminds/semver/v3"
	"github.com/UNSAReport/tui/internal/config"
)

func ResolveChannel(override string) string {
	trimmed := strings.ToLower(strings.TrimSpace(override))
	if trimmed == config.ChannelDev || trimmed == config.ChannelStable {
		return trimmed
	}
	if env := strings.ToLower(strings.TrimSpace(os.Getenv(config.EnvUpdateChannel))); env != "" {
		if env == config.ChannelDev || env == config.ChannelStable {
			return env
		}
	}
	if config.Channel == config.ChannelDev {
		return config.ChannelDev
	}
	if strings.Contains(strings.ToLower(config.Version), "dev") {
		return config.ChannelDev
	}
	return config.ChannelStable
}

func ResolveEndpoint() string {
	if env := strings.TrimSpace(os.Getenv(config.EnvUpdateEndpoint)); env != "" {
		return env
	}
	return config.DefaultUpdateEndpoint
}

func QueryManifest(ctx context.Context, endpoint string) (*Manifest, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("create manifest request: %w", err)
	}
	req.Header.Set("User-Agent", fmt.Sprintf("unsarep/%s (%s/%s)", config.Version, config.GitBranch, config.GitCommit))

	client := &http.Client{Timeout: config.UpdateTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch manifest from %s: %w", endpoint, err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("update endpoint %s returned status %d %s", endpoint, resp.StatusCode, resp.Status)
	}

	var manifest Manifest
	if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
		return nil, fmt.Errorf("decode update manifest: %w", err)
	}

	return &manifest, nil
}

func IsNewer(currentVersion, currentCommit, channel string, target ReleaseInfo) (bool, error) {
	if channel == config.ChannelDev {
		if target.Commit != "" && currentCommit != "" && target.Commit != "unknown" && currentCommit != "unknown" {
			return !strings.HasPrefix(currentCommit, target.Commit) && !strings.HasPrefix(target.Commit, currentCommit), nil
		}
		if target.Version != "" && currentVersion != "" && target.Version != currentVersion {
			return true, nil
		}
		return false, nil
	}

	cleanCurrent := strings.TrimPrefix(strings.TrimSpace(currentVersion), "v")
	cleanTarget := strings.TrimPrefix(strings.TrimSpace(target.Version), "v")

	if cleanCurrent == "" || cleanCurrent == "dev" {
		return cleanTarget != "", nil
	}

	currSemver, errCurr := semver.NewVersion(cleanCurrent)
	targetSemver, errTarget := semver.NewVersion(cleanTarget)

	if errCurr != nil || errTarget != nil {
		return cleanTarget != cleanCurrent && cleanTarget != "", nil
	}

	return targetSemver.GreaterThan(currSemver), nil
}

func CheckOnLaunch(ctx context.Context) {
	if disabled, _ := IsAutoUpdateDisabled(); disabled {
		return
	}
	if os.Getenv(config.EnvNoUpdateNotifier) == "1" {
		return
	}
	if os.Getenv("CI") == "true" || os.Getenv("GITHUB_ACTIONS") == "true" {
		return
	}

	fi, err := os.Stdin.Stat()
	if err != nil || fi.Mode()&os.ModeCharDevice == 0 {
		return
	}

	channel := ResolveChannel("")
	cache, _ := LoadCache()

	now := time.Now().Unix()
	if cache != nil && cache.Channel == channel && now-cache.LastChecked < int64(config.UpdateCheckTTL.Seconds()) {
		if cache.UpdateAvailable {
			fmt.Fprint(os.Stderr, RenderUpdateNotice(config.Version, cache.LatestVersion, channel, cache.ReleaseURL))
		}
		return
	}

	endpoint := ResolveEndpoint()
	manifest, err := QueryManifest(ctx, endpoint)
	if err != nil {
		PrintWarning("unable to check for updates: %v", err)
		if cache == nil {
			_ = SaveCache(&CacheState{
				LastChecked:     now,
				Channel:         channel,
				UpdateAvailable: false,
			})
		}
		return
	}

	var target ReleaseInfo
	if channel == config.ChannelDev {
		target = manifest.Dev
	} else {
		target = manifest.Stable
	}

	isNewer, err := IsNewer(config.Version, config.GitCommit, channel, target)
	if err != nil {
		PrintWarning("unable to determine update version: %v", err)
		return
	}

	newCache := &CacheState{
		LastChecked:     now,
		Channel:         channel,
		UpdateAvailable: isNewer,
		LatestVersion:   target.Version,
		LatestCommit:    target.Commit,
		ReleaseURL:      target.ReleaseURL,
		PublishedAt:     target.PublishedAt,
	}
	_ = SaveCache(newCache)

	if isNewer {
		fmt.Fprint(os.Stderr, RenderUpdateNotice(config.Version, target.Version, channel, target.ReleaseURL))
	}
}
