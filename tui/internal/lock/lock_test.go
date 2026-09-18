package lock

import (
	"os"
	"path/filepath"
	"testing"
)

func TestRoundTrip(t *testing.T) {
	root := t.TempDir()
	l := Lock{}
	l.Upsert(PkgEntry{Name: "cardo", Version: "1.2.0", Files: []FileEntry{{Path: "lib.typ", SHA256: SHA256Hex([]byte("x"))}}, DependsOn: []string{"theme 1.1.0"}})
	if err := Write(root, l); err != nil {
		t.Fatal(err)
	}
	got, err := Load(root)
	if err != nil {
		t.Fatal(err)
	}
	e, ok := got.Find("cardo")
	if !ok || e.Version != "1.2.0" || len(e.Files) != 1 {
		t.Fatalf("got %+v", got)
	}
	l.Upsert(PkgEntry{Name: "cardo", Version: "1.3.0"})
	if err := Write(root, l); err != nil {
		t.Fatal(err)
	}
	got, _ = Load(root)
	if e, _ := got.Find("cardo"); e.Version != "1.3.0" {
		t.Fatalf("upsert failed %+v", e)
	}
	l.Remove("cardo")
	if err := Write(root, l); err != nil {
		t.Fatal(err)
	}
	got, _ = Load(root)
	if _, ok := got.Find("cardo"); ok {
		t.Fatal("remove failed")
	}
}

func TestLoadMissingIsEmpty(t *testing.T) {
	l, err := Load(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if len(l.Pkg) != 0 {
		t.Fatal("expected empty lock")
	}
}

func TestLoadInvalid(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, ".unsareport.lock"), []byte("[[pkg]\nname = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(root); err == nil {
		t.Fatal("expected parse error")
	}
}
