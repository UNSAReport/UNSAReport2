package docs

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/lock"
	"github.com/UNSAReport/tui/internal/testutil"
)

func invalidDocsRoot(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "unsareport.toml"), []byte("[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	return root
}

func TestInvalidUnsatisfiable(t *testing.T) {
	srv := testutil.MockRegistry(t)
	defer srv.Close()
	root := invalidDocsRoot(t)
	if err := Add(context.Background(), root, AddOptions{Package: "@scope/does-not-exist", Flags: []string{"--yes"}}); err == nil || !strings.Contains(err.Error(), "404") {
		t.Fatalf("expected unsatisfiable-add error, got %v", err)
	}
	if err := Init(context.Background(), root, InitOptions{Template: "@scope/does-not-exist", Report: "r1"}); err == nil || !strings.Contains(err.Error(), "404") {
		t.Fatalf("expected unsatisfiable-init error, got %v", err)
	}
}

func TestInvalidMidDownloadFailure(t *testing.T) {
	srv := testutil.MockRegistry(t)
	defer srv.Close()
	root := invalidDocsRoot(t)
	t.Setenv(config.EnvRegistryURL, srv.URL+"/bogus")
	if err := Add(context.Background(), root, AddOptions{Package: "@scope/cardo", Flags: []string{"--yes"}}); err == nil {
		t.Fatal("expected mid-download failure against wrong registry prefix")
	}
}

func TestInvalidCircularDeps(t *testing.T) {
	srv := testutil.MockRegistry(t)
	defer srv.Close()
	root := invalidDocsRoot(t)
	if err := Add(context.Background(), root, AddOptions{Package: "@scope/cardo", Flags: []string{"--yes"}}); err != nil {
		t.Fatal(err)
	}
	l, err := lock.Load(root)
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"@scope/cardo", "@scope/theme", "@scope/utils"} {
		if _, ok := l.Find(want); !ok {
			t.Fatalf("%s missing from lock %+v", want, l)
		}
	}
	if err := Add(context.Background(), root, AddOptions{Package: "@scope/theme", Flags: []string{"--yes"}}); err != nil {
		t.Fatalf("re-adding a visited dependency must succeed, got %v", err)
	}
}

func TestInvalidMissingReportEntry(t *testing.T) {
	dir := t.TempDir()
	if _, err := resolveTypstEntry(dir, "missing.typ", nil); err == nil || !strings.Contains(err.Error(), "not found") {
		t.Fatalf("expected missing-entry error, got %v", err)
	}
}
