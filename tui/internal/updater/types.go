package updater

type ReleaseInfo struct {
	Version      string            `json:"version"`
	Commit       string            `json:"commit,omitempty"`
	Branch       string            `json:"branch,omitempty"`
	ReleaseURL   string            `json:"releaseUrl,omitempty"`
	PublishedAt  string            `json:"publishedAt,omitempty"`
	DownloadURLs map[string]string `json:"downloadUrls,omitempty"`
	ChecksumsURL string            `json:"checksumsUrl,omitempty"`
}

type Manifest struct {
	Stable ReleaseInfo `json:"stable"`
	Dev    ReleaseInfo `json:"dev"`
}

type CacheState struct {
	LastChecked     int64  `json:"lastChecked"`
	Channel         string `json:"channel"`
	UpdateAvailable bool   `json:"updateAvailable"`
	LatestVersion   string `json:"latestVersion"`
	LatestCommit    string `json:"latestCommit,omitempty"`
	ReleaseURL      string `json:"releaseUrl,omitempty"`
	PublishedAt     string `json:"publishedAt,omitempty"`
}
