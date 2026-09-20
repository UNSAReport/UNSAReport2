package config

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

type XDGConfig struct {
	APIURL      string `json:"apiUrl,omitempty"`
	RegistryURL string `json:"registryUrl,omitempty"`
	SlidesURL   string `json:"slidesUrl,omitempty"`
	TokenPath   string `json:"tokenPath,omitempty"`
	Locale      string `json:"locale,omitempty"`
}

func xdgDir() string {
	if v := os.Getenv(EnvXDGConfigHome); v != "" {
		return filepath.Join(v, AppDirName)
	}
	if d, err := os.UserConfigDir(); err == nil && d != "" {
		return filepath.Join(d, AppDirName)
	}
	if home, err := os.UserHomeDir(); err == nil && home != "" {
		return filepath.Join(home, ".config", AppDirName)
	}
	return ""
}

func xdgConfigPath() string    { return filepath.Join(xdgDir(), XDGConfigFileName) }
func defaultTokenPath() string { return filepath.Join(xdgDir(), TokenFileName) }

func writeAtomic(path string, data []byte, perm os.FileMode) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, PermDirPrivate); err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, perm); err != nil {
		return err
	}
	if err := os.Rename(tmp, path); err != nil {
		// Windows: Rename fails if target exists
		_ = os.Remove(path)
		if err2 := os.Rename(tmp, path); err2 != nil {
			return err2
		}
	}
	return nil
}

func LoadXDGConfig() (*XDGConfig, error) {
	path := xdgConfigPath()
	b, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return &XDGConfig{}, nil
		}
		return nil, fmt.Errorf("read xdg config: %w", err)
	}
	var cfg XDGConfig
	if err := json.Unmarshal(b, &cfg); err != nil {
		return nil, fmt.Errorf("parse xdg config: %w", err)
	}
	return &cfg, nil
}

func SaveXDGConfig(cfg *XDGConfig) error {
	b, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	b = append(b, '\n')
	path := xdgConfigPath()
	if path == "" {
		return fmt.Errorf("config dir unavailable")
	}
	if err := writeAtomic(path, b, PermFilePrivate); err != nil {
		return fmt.Errorf("write xdg config: %w", err)
	}
	return nil
}

// ValidateURL ensures raw is a valid http or https URL with non-empty host,
// returning the URL without trailing slash.
func ValidateURL(raw, name string) (string, error) {
	trimmed := strings.TrimRight(strings.TrimSpace(raw), "/")
	if trimmed == "" {
		return "", fmt.Errorf("%s must not be empty", name)
	}
	u, err := url.ParseRequestURI(trimmed)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		return "", fmt.Errorf("invalid %s %q: must be a valid http or https URL", name, raw)
	}
	return trimmed, nil
}

func ResolveRegistryURL() (string, error) {
	if v := strings.TrimSpace(os.Getenv(EnvRegistryURL)); v != "" {
		return ValidateURL(v, EnvRegistryURL)
	}
	cfg, err := LoadXDGConfig()
	if err == nil && cfg != nil && strings.TrimSpace(cfg.RegistryURL) != "" {
		return ValidateURL(cfg.RegistryURL, "xdg config registryUrl")
	}
	return ValidateURL(DefaultRegistryURL, "DefaultRegistryURL")
}

func ResolveSlidesURL() (string, error) {
	if v := strings.TrimSpace(os.Getenv(EnvSlidesURL)); v != "" {
		return ValidateURL(v, EnvSlidesURL)
	}
	cfg, err := LoadXDGConfig()
	if err == nil && cfg != nil && strings.TrimSpace(cfg.SlidesURL) != "" {
		return ValidateURL(cfg.SlidesURL, "xdg config slidesUrl")
	}
	return ValidateURL(DefaultSlidesURL, "DefaultSlidesURL")
}

func ResolveAuthURL() (string, error) {
	if v := strings.TrimSpace(os.Getenv(EnvIDPIssuer)); v != "" {
		return ValidateURL(v, EnvIDPIssuer)
	}
	cfg, err := LoadXDGConfig()
	if err == nil && cfg != nil && strings.TrimSpace(cfg.APIURL) != "" {
		return ValidateURL(cfg.APIURL, "xdg config apiUrl")
	}
	return ValidateURL(DefaultAuthURL, "DefaultAuthURL")
}

func ResolveWebsiteURL() (string, error) {
	if v := strings.TrimSpace(os.Getenv(EnvWebsiteURL)); v != "" {
		return ValidateURL(v, EnvWebsiteURL)
	}
	cfg, err := LoadXDGConfig()
	if err == nil && cfg != nil && strings.TrimSpace(cfg.APIURL) != "" {
		return ValidateURL(cfg.APIURL, "xdg config apiUrl")
	}
	return ValidateURL(DefaultWebsiteURL, "DefaultWebsiteURL")
}

func GetRegistryURL() string {
	u, err := ResolveRegistryURL()
	if err != nil {
		panic(err)
	}
	return u
}

func GetSlidesURL() string {
	u, err := ResolveSlidesURL()
	if err != nil {
		panic(err)
	}
	return u
}

func GetAuthURL() string {
	u, err := ResolveAuthURL()
	if err != nil {
		panic(err)
	}
	return u
}

func GetWebsiteURL() string {
	u, err := ResolveWebsiteURL()
	if err != nil {
		panic(err)
	}
	return u
}

func GetToken() string {
	if v := os.Getenv(EnvToken); v != "" {
		return strings.TrimSpace(v)
	}
	cfg, _ := LoadXDGConfig()
	tokenPath := defaultTokenPath()
	if cfg != nil && cfg.TokenPath != "" {
		tokenPath = cfg.TokenPath
	}
	if v := os.Getenv(EnvTokenPath); v != "" {
		tokenPath = v
	}
	if tokenPath == "" {
		return ""
	}
	b, err := os.ReadFile(tokenPath)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(b))
}

func SaveToken(token string) error {
	cfg, _ := LoadXDGConfig()
	path := defaultTokenPath()
	if cfg != nil && cfg.TokenPath != "" {
		path = cfg.TokenPath
	}
	if v := os.Getenv(EnvTokenPath); v != "" {
		path = v
	}
	if path == "" {
		return fmt.Errorf("token path unavailable")
	}
	if err := writeAtomic(path, []byte(token), PermFilePrivate); err != nil {
		return fmt.Errorf("write token: %w", err)
	}
	return nil
}

func ClearToken() error {
	cfg, _ := LoadXDGConfig()
	path := defaultTokenPath()
	if cfg != nil && cfg.TokenPath != "" {
		path = cfg.TokenPath
	}
	if v := os.Getenv(EnvTokenPath); v != "" {
		path = v
	}
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func GetLocale() string {
	if v := os.Getenv(EnvLocale); v != "" {
		return v
	}
	if v := os.Getenv(EnvLang); v != "" {
		return v
	}
	cfg, _ := LoadXDGConfig()
	if cfg != nil && cfg.Locale != "" {
		return cfg.Locale
	}
	return ""
}

func GetDest() string        { return os.Getenv(EnvDest) }
func GetSession() string     { return os.Getenv(EnvSession) }
func GetLocal() string       { return os.Getenv(EnvLocal) }
func GetFreezeFlags() string { return os.Getenv(EnvFreezeFlags) }
