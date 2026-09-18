package registry

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/UNSAReport/tui/internal/pkg"
)

func TestInitPackage(t *testing.T) {
	dir2 := filepath.Join(t.TempDir(), "out")
	if err := InitPackage(InitOptions{Dir: dir2, Name: "cardo", Description: "cards"}); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(dir2, "pkg.toml"))
	if err != nil {
		t.Fatal(err)
	}
	p, err := pkg.Parse(string(raw))
	if err != nil {
		t.Fatal(err)
	}
	if err := pkg.Validate(p); err != nil {
		t.Fatal(err)
	}
	if p.Package.Name != "cardo" || p.Package.Version != "0.1.0" {
		t.Fatalf("pkg %+v", p.Package)
	}
	if err := CheckPackageDir(dir2); err != nil {
		t.Fatal(err)
	}
}

func TestInitPackageRejects(t *testing.T) {
	if err := InitPackage(InitOptions{Dir: t.TempDir(), Name: "Bad Name!"}); err == nil {
		t.Fatal("expected bad-name error")
	}
	full := t.TempDir()
	if err := os.WriteFile(filepath.Join(full, "x"), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := InitPackage(InitOptions{Dir: full, Name: "cardo"}); err == nil {
		t.Fatal("expected non-empty-dir error")
	}
}
func TestInitPackageScopedName(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "out")
	if err := InitPackage(InitOptions{Dir: dir, Name: "@xxx/yyy", Description: "scoped"}); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(dir, "pkg.toml"))
	if err != nil {
		t.Fatal(err)
	}
	p, err := pkg.Parse(string(raw))
	if err != nil {
		t.Fatal(err)
	}
	if err := pkg.Validate(p); err != nil {
		t.Fatal(err)
	}
	if p.Package.Name != "@xxx/yyy" {
		t.Fatalf("pkg %+v", p.Package)
	}
	if p.Package.CommandPrefix != "yyy" {
		t.Fatalf("expected scope-stripped prefix, got %q", p.Package.CommandPrefix)
	}
	for _, name := range []string{"@xxx", "a/b/c", "MyPkg", "ab"} {
		if err := InitPackage(InitOptions{Dir: t.TempDir(), Name: name}); err == nil {
			t.Fatalf("%s: expected rejection", name)
		}
	}
}

func TestResolvePublishSource(t *testing.T) {
	// Standalone pkg.toml dir wins.
	standalone := t.TempDir()
	if err := os.WriteFile(filepath.Join(standalone, "pkg.toml"), []byte("[package]\nname = \"a\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\ndepends_on = []\n\n[templates]\nfiles = []\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	text, compDir, err := resolvePublishSource(standalone)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(text, `name = "a"`) || compDir != standalone {
		t.Fatalf("got %q %q", text, compDir)
	}
	// Project root with [package] synthesizes from components/<name>/.
	root := t.TempDir()
	cfgText := "[project]\ntypst_entry = \"report.typ\"\nroot_marker_version = 1\n\n[package]\nname = \"mine\"\nversion = \"0.2.0\"\ndescription = \"m\"\n\n[dependencies]\ntheme = \">=1.0.0\"\n"
	if err := os.WriteFile(filepath.Join(root, "unsareport.toml"), []byte(cfgText), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(root, "components", "mine"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "components", "mine", "lib.typ"), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	text, compDir, err = resolvePublishSource(root)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(text, "mine") || !strings.Contains(text, "theme") || compDir != filepath.Join(root, "components", "mine") {
		t.Fatalf("got %q %q", text, compDir)
	}
	p, err := pkg.Parse(text)
	if err != nil {
		t.Fatal(err)
	}
	if err := pkg.Validate(p); err != nil {
		t.Fatal(err)
	}
	// Neither present errors.
	if _, _, err := resolvePublishSource(t.TempDir()); err == nil {
		t.Fatal("expected no-source error")
	}
}
