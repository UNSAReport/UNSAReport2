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
	if err := InitPackage(InitOptions{Dir: dir2, Name: "@scope/cardo", Description: "cards"}); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(dir2, "unsareport.toml"))
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
	if p.Package.Name != "@scope/cardo" || p.Package.Version != "0.1.0" {
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
	if err := InitPackage(InitOptions{Dir: full, Name: "@scope/cardo"}); err == nil {
		t.Fatal("expected non-empty-dir error")
	}
}
func TestInitPackageScopedName(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "out")
	if err := InitPackage(InitOptions{Dir: dir, Name: "@xxx/yyy", Description: "scoped"}); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(dir, "unsareport.toml"))
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
	for _, name := range []string{"@xxx", "MyPkg"} {
		if err := InitPackage(InitOptions{Dir: t.TempDir(), Name: name}); err == nil {
			t.Fatalf("%s: expected rejection", name)
		}
	}
}

func TestResolvePublishSource(t *testing.T) {
	standalone := t.TempDir()
	if err := os.WriteFile(filepath.Join(standalone, "unsareport.toml"), []byte("[project]\nconfig_version = 1\n\n[package]\nname = \"@scope/a\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\n\n[templates]\nfiles = []\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	text, compDir, err := resolvePublishSource(standalone)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(text, `name = "@scope/a"`) || compDir != standalone {
		t.Fatalf("got %q %q", text, compDir)
	}
	root := t.TempDir()
	cfgText := "[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n\n[package]\nname = \"@scope/mine\"\nversion = \"0.2.0\"\ndescription = \"m\"\n\n[dependencies]\n\"@scope/theme\" = \">=1.0.0\"\n"
	if err := os.WriteFile(filepath.Join(root, "unsareport.toml"), []byte(cfgText), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(root, "components", "@scope", "mine"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "components", "@scope", "mine", "lib.typ"), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	text, compDir, err = resolvePublishSource(root)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(text, "@scope/mine") || !strings.Contains(text, "@scope/theme") || compDir != filepath.Join(root, "components", "@scope", "mine") {
		t.Fatalf("got %q %q", text, compDir)
	}
	p, err := pkg.Parse(text)
	if err != nil {
		t.Fatal(err)
	}
	if err := pkg.Validate(p); err != nil {
		t.Fatal(err)
	}
	if _, _, err := resolvePublishSource(t.TempDir()); err == nil {
		t.Fatal("expected no-source error")
	}
}
