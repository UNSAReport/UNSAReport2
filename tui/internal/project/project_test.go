package project

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFindRootMissing(t *testing.T) {
	tmp := t.TempDir()
	if _, err := FindRoot(filepath.Join(tmp, "sub", "dir")); err == nil {
		t.Fatal("expected error for missing unsareport.toml")
	}
}

const minimalToml = "[project]\ntypst_entry = \"report.typ\"\nroot_marker_version = 1\n"

func TestLoadStrict(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "unsareport.toml")
	if err := os.WriteFile(path, []byte(minimalToml), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Project.TypstEntry != "report.typ" {
		t.Fatalf("entry %q", cfg.Project.TypstEntry)
	}
	bad := filepath.Join(tmp, "bad.toml")
	if err := os.WriteFile(bad, []byte("[project]\nbogus = 1\ntypst_entry = \"report.typ\"\nroot_marker_version = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(bad); err == nil {
		t.Fatal("expected unknown-field error")
	}
	named := filepath.Join(tmp, "named.toml")
	if err := os.WriteFile(named, []byte("[project]\nname = \"x\"\ntypst_entry = \"report.typ\"\nroot_marker_version = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(named); err == nil {
		t.Fatal("expected rejection of dropped [project] name")
	}
	wrong := filepath.Join(tmp, "wrong.toml")
	if err := os.WriteFile(wrong, []byte("[project]\ntypst_entry = \"report.typ\"\nroot_marker_version = 99\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(wrong); err == nil {
		t.Fatal("expected version error")
	}
}

func TestLoadPackageDecl(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "unsareport.toml")
	body := minimalToml + "\n[package]\nname = \"cardo\"\nversion = \"1.2.0\"\ndescription = \"cards\"\n\n[dependencies]\ntheme = \">=1.0.0, <2.0.0\"\n"
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Package == nil || cfg.Package.Name != "cardo" {
		t.Fatalf("package %+v", cfg.Package)
	}
	if cfg.Dependencies["theme"] != ">=1.0.0, <2.0.0" {
		t.Fatalf("deps %+v", cfg.Dependencies)
	}
	bad := filepath.Join(tmp, "bad.toml")
	if err := os.WriteFile(bad, []byte(minimalToml+"\n[dependencies]\ntheme = \"bogus\"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(bad); err == nil {
		t.Fatal("expected bad-range error")
	}
}

func TestFragments(t *testing.T) {
	tmp := t.TempDir()
	cfgPath := filepath.Join(tmp, "unsareport.toml")
	if err := os.WriteFile(cfgPath, []byte(minimalToml), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmp, "unsareport.d", "scripts"), 0o755); err != nil {
		t.Fatal(err)
	}
	frag := "alias = \"cardo:zip\"\ndescription = \"zip\"\norigin = \"cardo\"\n\n[commands]\nany = [\"rm -f s.zip\"]\nlinux = [\"bash zip.sh\"]\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "scripts", "cardo-zip.toml"), []byte(frag), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmp, "unsareport.d", "hooks"), 0o755); err != nil {
		t.Fatal(err)
	}
	hook := "standard = \"build\"\naliases = [\"cardo:zip\"]\norigin = \"cardo\"\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "hooks", "build-cardo.toml"), []byte(hook), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(cfgPath)
	if err != nil {
		t.Fatal(err)
	}
	if len(cfg.Scripts["cardo:zip"].Commands["any"]) != 1 {
		t.Fatalf("scripts %+v", cfg.Scripts)
	}
	if cfg.ScriptSource("cardo:zip") != "unsareport.d/scripts/cardo-zip.toml" {
		t.Fatalf("provenance %q", cfg.ScriptSource("cardo:zip"))
	}
	if len(cfg.Hooks["build"]) != 1 || cfg.Hooks["build"][0] != "cardo:zip" {
		t.Fatalf("hooks %+v", cfg.Hooks)
	}
	dup := "alias = \"cardo:zip\"\n\n[commands]\nany = [\"x\"]\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "scripts", "other.toml"), []byte(dup), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(cfgPath); err == nil {
		t.Fatal("expected duplicate-alias error")
	}
}
