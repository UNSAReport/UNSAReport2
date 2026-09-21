package lock

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
	"github.com/UNSAReport/tui/internal/config"
)

type FileEntry struct {
	Path   string `toml:"path"`
	SHA256 string `toml:"sha256"`
}

type PkgEntry struct {
	Name      string      `toml:"name"`
	Version   string      `toml:"version"`
	Files     []FileEntry `toml:"files"`
	DependsOn []string    `toml:"depends_on"`
}

type ScopeEntry struct {
	Name  string      `toml:"name"`
	Files []FileEntry `toml:"files"`
}

type Lock struct {
	Scopes []ScopeEntry `toml:"scopes,omitempty"`
	Pkg    []PkgEntry   `toml:"pkg"`
}

func Path(root string) string {
	return filepath.Join(root, config.LockFileName)
}

func Load(root string) (Lock, error) {
	var l Lock
	p := Path(root)
	b, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return Lock{}, nil
		}
		return Lock{}, fmt.Errorf("read lock: %w", err)
	}
	md, err := toml.Decode(string(b), &l)
	if err != nil {
		return Lock{}, fmt.Errorf("parse %s: %w", config.LockFileName, err)
	}
	if undecoded := md.Undecoded(); len(undecoded) > 0 {
		return Lock{}, fmt.Errorf("unknown field %q in %s", undecoded[0].String(), config.LockFileName)
	}
	return l, nil
}

func Write(root string, l Lock) error {
	p := Path(root)
	f, err := os.Create(p)
	if err != nil {
		return fmt.Errorf("write lock: %w", err)
	}
	if err := toml.NewEncoder(f).Encode(l); err != nil {
		_ = f.Close()
		return fmt.Errorf("encode lock: %w", err)
	}
	if err := f.Close(); err != nil {
		return fmt.Errorf("close lock: %w", err)
	}
	return nil
}

func SHA256Hex(b []byte) string {
	sum := sha256.Sum256(b)
	return fmt.Sprintf("%x", sum)
}

func (l *Lock) Upsert(e PkgEntry) {
	for i, p := range l.Pkg {
		if p.Name == e.Name {
			l.Pkg[i] = e
			return
		}
	}
	l.Pkg = append(l.Pkg, e)
}

func (l *Lock) Remove(name string) {
	out := l.Pkg[:0]
	for _, p := range l.Pkg {
		if p.Name != name {
			out = append(out, p)
		}
	}
	l.Pkg = out
}

func (l *Lock) Find(name string) (PkgEntry, bool) {
	for _, p := range l.Pkg {
		if p.Name == name {
			return p, true
		}
	}
	return PkgEntry{}, false
}

func (l *Lock) UpsertScope(e ScopeEntry) {
	for i, s := range l.Scopes {
		if s.Name == e.Name {
			l.Scopes[i] = e
			return
		}
	}
	l.Scopes = append(l.Scopes, e)
}

func (l *Lock) RemoveScope(name string) {
	out := l.Scopes[:0]
	for _, s := range l.Scopes {
		if s.Name != name {
			out = append(out, s)
		}
	}
	l.Scopes = out
}

func (l *Lock) FindScope(name string) (ScopeEntry, bool) {
	for _, s := range l.Scopes {
		if s.Name == name {
			return s, true
		}
	}
	return ScopeEntry{}, false
}

