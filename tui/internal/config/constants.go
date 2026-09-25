package config

import (
	"regexp"
	"time"
)

const (
	DefaultBaseURL        = "https://unsareport.ynoacamino.tech"
	DefaultRegistryURL    = "https://unsareport.ynoacamino.tech/api/registry"
	DefaultAuthURL        = "https://unsareport.ynoacamino.tech/api/auth"
	DefaultSlidesURL      = "https://unsareport.ynoacamino.tech/api/slides"
	DefaultWebsiteURL     = "https://unsareport.ynoacamino.tech"
	SchemaBaseURL         = "https://raw.githubusercontent.com/UNSAReport/UNSAReport"
	LoopbackHost          = "127.0.0.1"
	LocalhostName         = "localhost"
	DefaultCallbackHost   = LoopbackHost + ":0"
	CallbackBaseURLPrefix = "http://"
	CallbackPath          = "/callback"
)

var Version = "dev"

const (
	DefaultPrompt        = "❯ "
	DefaultColumns       = 120
	DefaultRows          = 500
	DefaultSrcDir        = "src"
	DefaultSubmissionDir = "submission"
	DefaultReportFile    = "report.typ"
	DefaultReportWord    = "Informe"
	DefaultCodeWord      = "Código Fuente"
	DefaultFileTemplate  = "{output_type}_{lab_number}"
)

const (
	PATPrefix      = "unsareport_pat_"
	KeyringService = "unsareport"
	KeyringUser    = "pat"
)

const (
	DefaultRegistryLimit      = 100
	AuthTimeout               = 10 * time.Second
	RegistryTimeout           = 30 * time.Second
	CallbackTimeout           = 5 * time.Minute
	CallbackReadHeaderTimeout = 5 * time.Second
	CallbackShutdownTimeout   = 2 * time.Second
)

const (
	PermDirPrivate  = 0o700
	PermFilePrivate = 0o600
	PermDirPublic   = 0o755
	PermFilePublic  = 0o644
)

const (
	EnvRegistryURL     = "UNSAREP_REGISTRY_URL"
	EnvIDPIssuer       = "UNSAREP_IDP_ISSUER"
	EnvSlidesURL       = "UNSAREP_SLIDES_URL"
	EnvToken           = "UNSAREP_TOKEN"
	EnvTokenPath       = "UNSAREP_TOKEN_PATH"
	EnvCredentialsPath = "UNSAREP_CREDENTIALS_PATH"
	EnvWebsiteURL      = "UNSAREP_WEBSITE_URL"
	EnvDest            = "UNSAREP_DEST"
	EnvSession         = "UNSAREP_SESSION"
	EnvLocal           = "UNSAREP_LOCAL"
	EnvFreezeFlags     = "UNSAREP_FREEZE_FLAGS"
	EnvLocale          = "UNSAREP_LOCALE"
	EnvReportDir       = "UNSAREP_REPORT_DIR"
	EnvTypstEntry      = "UNSAREP_TYPST_ENTRY"
	EnvConfigPrefix    = "UNSAREP_CONFIG_"
	EnvXDGConfigHome   = "XDG_CONFIG_HOME"
	EnvXDGCacheHome    = "XDG_CACHE_HOME"
	EnvSSHConnection   = "SSH_CONNECTION"
	EnvDisplay         = "DISPLAY"
	EnvWaylandDisplay  = "WAYLAND_DISPLAY"
	EnvLang            = "LANG"
	EnvLCAll           = "LC_ALL"
	EnvLCMessages      = "LC_MESSAGES"
)

const (
	AppDirName          = "unsareport"
	ConfigFileName      = "unsareport.toml"
	ConfigDirName       = "unsareport.d"
	XDGConfigFileName   = "config.json"
	CredentialsFileName = "credentials.json"
	TokenFileName       = "token"
	CacheFileName       = "registry.json"
	LockFileName        = "unsareport.lock"
)

const (
	ConfigVersion     = 1
	DefaultTypstEntry = "main.typ"
)

var (
	ReVar     = regexp.MustCompile(`\{(\w+)\}`)
	ReIllegal = regexp.MustCompile(`[<>:"/\\|?*]`)
)

const (
	Key1     = "1"
	Key2     = "2"
	Key3     = "3"
	Key4     = "4"
	KeyH     = "h"
	KeyL     = "l"
	KeyR     = "r"
	KeyUp    = "up"
	KeyDown  = "down"
	KeyEnter = "enter"
)

const (
	ColorPrompt  = "32"
	ColorCommand = "36"
	ColorArgs    = "33"
	ColorReset   = "0"
)

const RegistryPackagesPath = "/v1/packages"

var EnvNames = []string{
	EnvRegistryURL,
	EnvIDPIssuer,
	EnvSlidesURL,
	EnvToken,
	EnvTokenPath,
	EnvCredentialsPath,
	EnvWebsiteURL,
	EnvDest,
	EnvSession,
	EnvLocal,
	EnvFreezeFlags,
}
