package lock

import (
	"os"
	"sync"
	"testing"
)

func TestInvalidDedup(t *testing.T) {
	l := Lock{}
	l.Upsert(PkgEntry{Name: "a", Version: "1.0.0"})
	l.Upsert(PkgEntry{Name: "a", Version: "2.0.0"})
	if len(l.Pkg) != 1 {
		t.Fatalf("upsert must dedup, got %d", len(l.Pkg))
	}
	if e, _ := l.Find("a"); e.Version != "2.0.0" {
		t.Fatalf("latest upsert must win, got %+v", e)
	}
}

func TestInvalidBadSHA(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(Path(root), []byte("[[pkg]]\nname = \"a\"\nversion = \"1.0.0\"\n[[pkg.files]]\npath = \"x\"\nsha256 = \"zzz\"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	got, err := Load(root)
	if err != nil {
		t.Fatal(err)
	}
	e, ok := got.Find("a")
	if !ok || len(e.Files) != 1 || e.Files[0].SHA256 != "zzz" {
		t.Fatalf("lock must preserve raw entries, got %+v", got)
	}
	if SHA256Hex([]byte("x")) == "zzz" {
		t.Fatal("sha helper must not collide with garbage")
	}
}

func TestInvalidConcurrent(t *testing.T) {
	var mu sync.Mutex
	var l Lock
	var wg sync.WaitGroup
	for range 8 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			mu.Lock()
			l.Upsert(PkgEntry{Name: "a", Version: "1.0.0"})
			mu.Unlock()
		}()
	}
	wg.Wait()
	if len(l.Pkg) != 1 {
		t.Fatalf("concurrent upserts must collapse to one entry, got %d", len(l.Pkg))
	}
}

func TestInvalidRemoveMissing(t *testing.T) {
	l := Lock{Pkg: []PkgEntry{{Name: "a", Version: "1.0.0"}}}
	l.Remove("missing")
	if len(l.Pkg) != 1 || l.Pkg[0].Name != "a" {
		t.Fatalf("remove of missing entry must be a no-op, got %+v", l.Pkg)
	}
	l.RemoveScope("missing")
	if len(l.Scopes) != 0 {
		t.Fatalf("scope remove of missing entry must be a no-op, got %+v", l.Scopes)
	}
}
