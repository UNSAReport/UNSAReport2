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

func TestLoadStrict(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "unsareport.toml")
	if err := os.WriteFile(path, []byte("[project]\nname = \"x\"\ntypst_entry = \"report.typ\"\nroot_marker_version = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Project.Name != "x" {
		t.Fatalf("name %q", cfg.Project.Name)
	}
	bad := filepath.Join(tmp, "bad.toml")
	if err := os.WriteFile(bad, []byte("[project]\nname = \"x\"\ntypst_entry = \"report.typ\"\nroot_marker_version = 1\nbogus = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(bad); err == nil {
		t.Fatal("expected unknown-field error")
	}
	wrong := filepath.Join(tmp, "wrong.toml")
	if err := os.WriteFile(wrong, []byte("[project]\nname = \"x\"\ntypst_entry = \"report.typ\"\nroot_marker_version = 99\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(wrong); err == nil {
		t.Fatal("expected version error")
	}
}
