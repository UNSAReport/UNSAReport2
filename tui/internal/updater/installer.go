package updater

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/UNSAReport/tui/internal/config"
)

func ResolveBinaryName(goos, goarch string) string {
	ext := ""
	if goos == "windows" {
		ext = ".exe"
	}
	return fmt.Sprintf("unsarep-%s-%s%s", goos, goarch, ext)
}

func ResolveAssetURL(target ReleaseInfo, binaryName, platformKey string) (string, string, error) {
	var downloadURL string
	if target.DownloadURLs != nil {
		if u, ok := target.DownloadURLs[binaryName]; ok && u != "" {
			downloadURL = u
		} else if u, ok := target.DownloadURLs[platformKey]; ok && u != "" {
			downloadURL = u
		}
	}

	if downloadURL == "" && target.ReleaseURL != "" {
		tag := target.Version
		cleanRelease := strings.TrimRight(target.ReleaseURL, "/")
		if strings.Contains(cleanRelease, "github.com") {
			downloadURL = fmt.Sprintf("%s/download/%s/%s", cleanRelease, tag, binaryName)
		}
	}

	if downloadURL == "" {
		return "", "", fmt.Errorf("no download URL found for platform %s (%s)", platformKey, binaryName)
	}

	checksumURL := target.ChecksumsURL
	if checksumURL == "" && target.ReleaseURL != "" {
		cleanRelease := strings.TrimRight(target.ReleaseURL, "/")
		if strings.Contains(cleanRelease, "github.com") {
			tag := target.Version
			checksumURL = fmt.Sprintf("%s/download/%s/%s", cleanRelease, tag, config.DefaultChecksumFile)
		}
	}

	if checksumURL == "" {
		return "", "", fmt.Errorf("no checksums URL available for release %s", target.Version)
	}

	return downloadURL, checksumURL, nil
}

func FetchExpectedChecksum(ctx context.Context, checksumsURL, binaryName string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, checksumsURL, nil)
	if err != nil {
		return "", fmt.Errorf("create checksums request: %w", err)
	}
	req.Header.Set("User-Agent", fmt.Sprintf("unsarep/%s", config.Version))

	client := &http.Client{Timeout: config.UpdateTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch checksums from %s: %w", checksumsURL, err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("checksums endpoint returned status %d", resp.StatusCode)
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) >= 2 {
			entryFile := filepath.Base(strings.TrimPrefix(fields[1], "*"))
			if entryFile == binaryName {
				return strings.ToLower(fields[0]), nil
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("parse checksums: %w", err)
	}

	return "", fmt.Errorf("checksum for %s not found in %s", binaryName, checksumsURL)
}

func VerifyBinaryHeader(path, goos string) error {
	f, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("open downloaded binary: %w", err)
	}
	defer func() { _ = f.Close() }()

	header := make([]byte, 4)
	n, err := f.Read(header)
	if err != nil || n < 4 {
		return fmt.Errorf("binary is too small or unreadable")
	}

	switch goos {
	case "linux":
		if !bytes.Equal(header, []byte{0x7f, 'E', 'L', 'F'}) {
			return fmt.Errorf("invalid Linux ELF executable header")
		}
	case "darwin":
		isMachO := bytes.Equal(header, []byte{0xfe, 0xed, 0xfa, 0xce}) ||
			bytes.Equal(header, []byte{0xfe, 0xed, 0xfa, 0xcf}) ||
			bytes.Equal(header, []byte{0xce, 0xfa, 0xed, 0xfe}) ||
			bytes.Equal(header, []byte{0xcf, 0xfa, 0xed, 0xfe}) ||
			bytes.Equal(header, []byte{0xca, 0xfe, 0xba, 0xbe})
		if !isMachO {
			return fmt.Errorf("invalid macOS Mach-O executable header")
		}
	case "windows":
		if header[0] != 'M' || header[1] != 'Z' {
			return fmt.Errorf("invalid Windows PE executable header")
		}
	}
	return nil
}

func UpgradeBinary(ctx context.Context, target ReleaseInfo) error {
	if disabled, reason := IsAutoUpdateDisabled(); disabled {
		return errors.New(reason)
	}

	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("determine current executable path: %w", err)
	}
	if resolved, evalErr := filepath.EvalSymlinks(exePath); evalErr == nil {
		exePath = resolved
	}

	destDir := filepath.Dir(exePath)
	testTemp, err := os.CreateTemp(destDir, ".unsarep-test-perm-*")
	if err != nil {
		return fmt.Errorf("insufficient permissions to update in %s: %w", destDir, err)
	}
	testName := testTemp.Name()
	_ = testTemp.Close()
	_ = os.Remove(testName)

	platformKey := fmt.Sprintf("%s-%s", runtime.GOOS, runtime.GOARCH)
	binaryName := ResolveBinaryName(runtime.GOOS, runtime.GOARCH)

	downloadURL, checksumURL, err := ResolveAssetURL(target, binaryName, platformKey)
	if err != nil {
		return err
	}

	expectedHash, err := FetchExpectedChecksum(ctx, checksumURL, binaryName)
	if err != nil {
		return fmt.Errorf("verify checksum: %w", err)
	}

	tempFile, err := os.CreateTemp(destDir, ".unsarep-download-*")
	if err != nil {
		return fmt.Errorf("create temporary download file: %w", err)
	}
	tempPath := tempFile.Name()
	defer func() {
		_ = os.Remove(tempPath)
	}()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, downloadURL, nil)
	if err != nil {
		_ = tempFile.Close()
		return fmt.Errorf("create download request: %w", err)
	}
	req.Header.Set("User-Agent", fmt.Sprintf("unsarep/%s", config.Version))

	client := &http.Client{Timeout: 5 * config.UpdateTimeout}
	resp, err := client.Do(req)
	if err != nil {
		_ = tempFile.Close()
		return fmt.Errorf("download binary from %s: %w", downloadURL, err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		_ = tempFile.Close()
		return fmt.Errorf("download failed with status %d", resp.StatusCode)
	}

	hasher := sha256.New()
	writer := io.MultiWriter(tempFile, hasher)
	if _, err := io.Copy(writer, resp.Body); err != nil {
		_ = tempFile.Close()
		return fmt.Errorf("write binary: %w", err)
	}
	if err := tempFile.Close(); err != nil {
		return fmt.Errorf("flush binary to disk: %w", err)
	}

	calculatedHash := strings.ToLower(hex.EncodeToString(hasher.Sum(nil)))
	if calculatedHash != expectedHash {
		return fmt.Errorf("checksum mismatch: expected %s, calculated %s", expectedHash, calculatedHash)
	}

	if err := VerifyBinaryHeader(tempPath, runtime.GOOS); err != nil {
		return fmt.Errorf("corrupt binary validation: %w", err)
	}

	if runtime.GOOS != "windows" {
		if err := os.Chmod(tempPath, 0o755); err != nil {
			return fmt.Errorf("chmod binary: %w", err)
		}
		if err := os.Rename(tempPath, exePath); err != nil {
			return fmt.Errorf("replace executable: %w", err)
		}
		return nil
	}

	oldPath := exePath + ".old"
	_ = os.Remove(oldPath)

	if err := os.Rename(exePath, oldPath); err != nil {
		return fmt.Errorf("backup existing executable on Windows: %w", err)
	}

	if err := os.Rename(tempPath, exePath); err != nil {
		_ = os.Rename(oldPath, exePath)
		return fmt.Errorf("replace executable on Windows: %w", err)
	}

	_ = os.Remove(oldPath)
	return nil
}
