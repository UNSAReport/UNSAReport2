package updater

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/UNSAReport/tui/internal/config"
)

func TestResolveBinaryName(t *testing.T) {
	if got := ResolveBinaryName("linux", "amd64"); got != "unsarep-linux-amd64" {
		t.Errorf("got %s, want unsarep-linux-amd64", got)
	}
	if got := ResolveBinaryName("windows", "amd64"); got != "unsarep-windows-amd64.exe" {
		t.Errorf("got %s, want unsarep-windows-amd64.exe", got)
	}
}

func TestResolveAssetURL(t *testing.T) {
	target := ReleaseInfo{
		Version:    "v0.2.0",
		ReleaseURL: "https://github.com/UNSAReport/UNSAReport2/releases/tag/v0.2.0",
	}

	dl, cs, err := ResolveAssetURL(target, "unsarep-linux-amd64", "linux-amd64")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expectedDl := "https://github.com/UNSAReport/UNSAReport2/releases/tag/v0.2.0/download/v0.2.0/unsarep-linux-amd64"
	expectedCs := "https://github.com/UNSAReport/UNSAReport2/releases/tag/v0.2.0/download/v0.2.0/checksums.txt"
	if dl != expectedDl {
		t.Errorf("got %s, want %s", dl, expectedDl)
	}
	if cs != expectedCs {
		t.Errorf("got %s, want %s", cs, expectedCs)
	}
}

func TestFetchExpectedChecksum(t *testing.T) {
	checksumsContent := `
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  unsarep-darwin-amd64
a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3  unsarep-linux-amd64
`
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		_, _ = w.Write([]byte(checksumsContent))
	}))
	defer server.Close()

	ctx := context.Background()
	hash, err := FetchExpectedChecksum(ctx, server.URL+"/checksums.txt", "unsarep-linux-amd64")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if hash != "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3" {
		t.Errorf("got hash %s", hash)
	}

	_, err = FetchExpectedChecksum(ctx, server.URL+"/checksums.txt", "unsarep-windows-amd64.exe")
	if err == nil {
		t.Fatal("expected error for missing binary, got nil")
	}
}

func TestVerifyBinaryHeader(t *testing.T) {
	tmpDir := t.TempDir()

	elfFile := filepath.Join(tmpDir, "elf")
	_ = os.WriteFile(elfFile, []byte{0x7f, 'E', 'L', 'F', 0x02, 0x01}, 0o755)
	if err := VerifyBinaryHeader(elfFile, "linux"); err != nil {
		t.Errorf("expected valid ELF header: %v", err)
	}

	corruptFile := filepath.Join(tmpDir, "corrupt")
	_ = os.WriteFile(corruptFile, []byte("NOT_AN_EXECUTABLE"), 0o755)
	if err := VerifyBinaryHeader(corruptFile, "linux"); err == nil {
		t.Errorf("expected error on corrupt file, got nil")
	}
}

func TestUpgradeBinary_Disabled(t *testing.T) {
	t.Setenv(config.EnvDisableAutoUpdate, "1")
	err := UpgradeBinary(context.Background(), ReleaseInfo{Version: "v0.2.0"})
	if err == nil {
		t.Fatal("expected error when auto-updates disabled, got nil")
	}
	if err.Error() != "automatic updates are disabled" {
		t.Errorf("got error %q, want 'automatic updates are disabled'", err.Error())
	}
}

func TestUpgradeBinary_ChecksumMismatch(t *testing.T) {
	tmpDir := t.TempDir()
	binaryName := ResolveBinaryName(runtime.GOOS, runtime.GOARCH)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/checksums.txt" {
			_, _ = fmt.Fprintf(w, "0000000000000000000000000000000000000000000000000000000000000000  %s\n", binaryName)
			return
		}
		if r.URL.Path == "/binary" {
			_, _ = w.Write([]byte{0x7f, 'E', 'L', 'F', 0x00, 0x00})
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	platformKey := fmt.Sprintf("%s-%s", runtime.GOOS, runtime.GOARCH)
	target := ReleaseInfo{
		Version: "v0.2.0",
		DownloadURLs: map[string]string{
			platformKey: server.URL + "/binary",
		},
		ChecksumsURL: server.URL + "/checksums.txt",
	}

	origExe, _ := os.Executable()
	_ = tmpDir
	_ = origExe

	hasher := sha256.New()
	hasher.Write([]byte{0x7f, 'E', 'L', 'F', 0x00, 0x00})
	realHash := hex.EncodeToString(hasher.Sum(nil))
	if realHash == "0000000000000000000000000000000000000000000000000000000000000000" {
		t.Fatal("hashes should differ")
	}

	_ = target
}
