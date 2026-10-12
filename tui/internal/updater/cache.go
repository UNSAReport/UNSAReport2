package updater

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/UNSAReport/tui/internal/config"
)

func LoadCache() (*CacheState, error) {
	path := config.XDGUpdateCachePath()
	if path == "" {
		return nil, fmt.Errorf("update cache path unavailable")
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("read update cache: %w", err)
	}

	var state CacheState
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, fmt.Errorf("parse update cache: %w", err)
	}

	return &state, nil
}

func SaveCache(state *CacheState) error {
	if state == nil {
		return fmt.Errorf("cannot save nil cache state")
	}

	path := config.XDGUpdateCachePath()
	if path == "" {
		return fmt.Errorf("update cache path unavailable")
	}

	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal update cache: %w", err)
	}
	data = append(data, '\n')

	if err := config.WriteAtomic(path, data, config.PermFilePrivate); err != nil {
		return fmt.Errorf("write update cache: %w", err)
	}

	return nil
}
