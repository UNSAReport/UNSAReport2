package auth

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/zalando/go-keyring"
)

func TestMain(m *testing.M) {
	keyring.MockInit()
	os.Exit(m.Run())
}

func TestFileStorePermAndAtomic(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	t.Setenv("UNSAREP_TOKEN", "")
	t.Setenv("UNSAREP_CREDENTIALS_PATH", "")
	_ = (&KeyringStore{}).Clear()
	fs := NewFileStore()
	cred := &Credentials{PAT: "unsareport_pat_test123", Email: "a@example.com", Name: "Alice", CreatedAt: time.Now()}
	if err := fs.Set(cred); err != nil {
		t.Fatal(err)
	}
	info, err := os.Stat(fs.Path)
	if err != nil {
		t.Fatal(err)
	}
	if runtime.GOOS != "windows" && info.Mode().Perm() != config.PermFilePrivate {
		t.Fatalf("perm %o want 0600", info.Mode().Perm())
	}
	dirInfo, _ := os.Stat(filepath.Dir(fs.Path))
	if runtime.GOOS != "windows" && dirInfo.Mode().Perm() != config.PermDirPrivate {
		t.Fatalf("dir perm %o want 0700", dirInfo.Mode().Perm())
	}
	got, err := fs.Get()
	if err != nil {
		t.Fatal(err)
	}
	if got.PAT != cred.PAT || got.Email != "a@example.com" {
		t.Fatalf("got %+v", got)
	}
	if err := fs.Clear(); err != nil {
		t.Fatal(err)
	}
	if _, err := fs.Get(); err == nil {
		t.Fatal("should error after clear")
	}
}

func TestFileStoreClear(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	t.Setenv("UNSAREP_TOKEN", "")
	_ = (&KeyringStore{}).Clear()
	fs := NewFileStore()
	cred := &Credentials{PAT: "unsareport_pat_fb", CreatedAt: time.Now()}
	if err := fs.Set(cred); err != nil {
		t.Fatal(err)
	}
	got, err := fs.Get()
	if err != nil {
		t.Fatal(err)
	}
	if got.PAT != cred.PAT {
		t.Fatalf("got %q", got.PAT)
	}
	if err := fs.Clear(); err != nil {
		t.Fatal(err)
	}
}

func TestHybridStore(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	t.Setenv("UNSAREP_TOKEN", "")
	hs := NewHybridStore()
	_ = hs.Clear()

	cred := &Credentials{PAT: "unsareport_pat_hybrid", Email: "h@example.com", Name: "Hybrid", CreatedAt: time.Now()}
	if err := hs.Set(cred); err != nil {
		t.Fatal(err)
	}
	got, err := hs.Get()
	if err != nil {
		t.Fatal(err)
	}
	if got.PAT != cred.PAT || got.Email != "h@example.com" {
		t.Fatalf("got %+v", got)
	}
	if err := hs.Clear(); err != nil {
		t.Fatal(err)
	}
	if _, err := hs.Get(); err == nil {
		t.Fatal("expected error after clear")
	}
}
