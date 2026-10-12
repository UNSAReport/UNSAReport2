import { createServerFn } from '@tanstack/react-start';

export interface ReleaseInfo {
  version: string;
  commit?: string;
  branch?: string;
  releaseUrl?: string;
  publishedAt?: string;
  downloadUrls?: Record<string, string>;
  checksumsUrl?: string;
}

export interface VersionManifest {
  stable: ReleaseInfo;
  dev: ReleaseInfo;
}

const GITHUB_REPO = 'UNSAReport/UNSAReport2';
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;

interface CachedManifest {
  manifest: VersionManifest;
  cachedAt: number;
}

let cached: CachedManifest | null = null;
const CACHE_TTL_MS = 60 * 1000;

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name: string;
  html_url: string;
  prerelease: boolean;
  published_at: string;
  target_commitish?: string;
  body?: string;
  assets: GithubAsset[];
}

function parseRelease(
  release: GithubRelease | null,
  fallbackTag: string,
  channel: 'stable' | 'dev',
): ReleaseInfo {
  if (!release) {
    const isDev = channel === 'dev';
    const tag = isDev ? 'dev' : fallbackTag;
    const downloadBase = `https://github.com/${GITHUB_REPO}/releases/download/${tag}`;
    return {
      version: tag,
      branch: isDev ? 'dev' : 'main',
      commit: 'unknown',
      releaseUrl: `https://github.com/${GITHUB_REPO}/releases/tag/${tag}`,
      publishedAt: new Date().toISOString(),
      checksumsUrl: `${downloadBase}/checksums.txt`,
      downloadUrls: {
        'linux-amd64': `${downloadBase}/unsarep-linux-amd64`,
        'linux-arm64': `${downloadBase}/unsarep-linux-arm64`,
        'darwin-amd64': `${downloadBase}/unsarep-darwin-amd64`,
        'darwin-arm64': `${downloadBase}/unsarep-darwin-arm64`,
        'windows-amd64': `${downloadBase}/unsarep-windows-amd64.exe`,
        'windows-arm64': `${downloadBase}/unsarep-windows-arm64.exe`,
      },
    };
  }

  const downloadUrls: Record<string, string> = {};
  let checksumsUrl = '';

  for (const asset of release.assets) {
    if (asset.name === 'checksums.txt') {
      checksumsUrl = asset.browser_download_url;
      continue;
    }
    const match = asset.name.match(
      /^unsarep-(linux|darwin|windows)-(amd64|arm64)(\.exe)?$/,
    );
    if (match) {
      const platformKey = `${match[1]}-${match[2]}`;
      downloadUrls[platformKey] = asset.browser_download_url;
      downloadUrls[asset.name] = asset.browser_download_url;
    }
  }

  let commit = release.target_commitish || 'unknown';
  const commitMatch = release.body?.match(/commit ([0-9a-f]{7,40})/i);
  if (commitMatch) {
    commit = commitMatch[1];
  }

  return {
    version: release.tag_name,
    commit,
    branch: channel === 'dev' ? 'dev' : 'main',
    releaseUrl: release.html_url,
    publishedAt: release.published_at,
    downloadUrls,
    checksumsUrl,
  };
}

export async function getVersionManifest(): Promise<VersionManifest> {
  const now = Date.now();
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.manifest;
  }

  const headers: Record<string, string> = {
    'User-Agent': 'UNSAReport-Web',
    Accept: 'application/vnd.github.v3+json',
  };
  const githubPat = process.env.GITHUB_PAT;
  if (githubPat) {
    headers.Authorization = `Bearer ${githubPat}`;
  }

  let releases: GithubRelease[] = [];
  try {
    const res = await fetch(`${GITHUB_API_BASE}/releases?per_page=20`, {
      headers,
    });
    if (res.ok) {
      releases = (await res.json()) as GithubRelease[];
    }
  } catch {
    if (cached) return cached.manifest;
  }

  const stableRelease = releases.find((r) => !r.prerelease) || null;
  const devRelease =
    releases.find((r) => r.prerelease || r.tag_name === 'dev') || null;

  const manifest: VersionManifest = {
    stable: parseRelease(stableRelease, 'v0.1.0', 'stable'),
    dev: parseRelease(devRelease, 'dev', 'dev'),
  };

  cached = {
    manifest,
    cachedAt: now,
  };

  return manifest;
}

export const fetchVersionManifestServerFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return getVersionManifest();
});
