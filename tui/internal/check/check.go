package check

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/UNSAReport/tui/internal/lock"
	"github.com/UNSAReport/tui/internal/project"
	"github.com/UNSAReport/tui/internal/scripts"
)

type Finding struct {
	File    string
	Line    int
	Message string
}

func (f Finding) Error() string {
	if f.Line > 0 {
		return fmt.Sprintf("%s:%d: %s", f.File, f.Line, f.Message)
	}
	return fmt.Sprintf("%s: %s", f.File, f.Message)
}

func Run(root string) []Finding {
	var out []Finding
	cfgPath := filepath.Join(root, "unsareport.toml")
	cfg, err := project.Load(cfgPath)
	if err != nil {
		return []Finding{{File: cfgPath, Message: err.Error()}}
	}
	out = append(out, checkReports(root, cfg)...)
	out = append(out, checkTypstSources(root)...)
	out = append(out, checkLock(root)...)
	out = append(out, checkScriptsHooks(root, cfg)...)
	sort.Slice(out, func(i, j int) bool {
		if out[i].File != out[j].File {
			return out[i].File < out[j].File
		}
		return out[i].Line < out[j].Line
	})
	return out
}

func checkReports(root string, cfg project.SpecConfig) []Finding {
	var out []Finding
	entries, err := os.ReadDir(root)
	if err != nil {
		return []Finding{{File: root, Message: err.Error()}}
	}
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		name := e.Name()
		if name == "components" || name == "unsareport.d" || strings.HasPrefix(name, ".") {
			continue
		}
		rel, _ := filepath.Rel(root, filepath.Join(root, name))
		if strings.Contains(rel, string(os.PathSeparator)) {
			continue
		}
		typPath := filepath.Join(root, name, cfg.Project.TypstEntry)
		if _, err := os.Stat(typPath); err != nil {
			continue
		}
		if nested, _ := hasNestedReport(filepath.Join(root, name), cfg.Project.TypstEntry); nested {
			out = append(out, Finding{File: filepath.Join(name, name, cfg.Project.TypstEntry), Message: "nested report dirs deeper than one level are rejected"})
		}
	}
	return out
}

func hasNestedReport(dir, entry string) (bool, error) {
	found := false
	err := filepath.WalkDir(dir, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if p == dir {
			return nil
		}
		if d.IsDir() {
			rel, _ := filepath.Rel(dir, p)
			if strings.Contains(rel, string(os.PathSeparator)) {
				if _, err := os.Stat(filepath.Join(p, entry)); err == nil {
					found = true
				}
				return filepath.SkipDir
			}
		}
		return nil
	})
	return found, err
}

func checkTypstSources(root string) []Finding {
	var out []Finding
	_ = filepath.WalkDir(root, func(p string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasSuffix(p, ".typ") {
			return nil
		}
		rel, _ := filepath.Rel(root, p)
		inComponents := rel == "components" || strings.HasPrefix(rel, "components"+string(os.PathSeparator))
		b, err := os.ReadFile(p)
		if err != nil {
			return nil
		}
		lines := strings.Split(string(b), "\n")
		params := collectParams(string(b))
		for i, ln := range lines {
			if strings.Contains(ln, "#import \"../components") {
				out = append(out, Finding{File: rel, Line: i + 1, Message: "relative ../components import rejected; use root-absolute /components/..."})
			}
			if strings.Contains(ln, "#import \"/lib.typ\"") {
				out = append(out, Finding{File: rel, Line: i + 1, Message: "legacy /lib.typ import rejected; use /components/<pkg>/..."})
			}
			if inComponents {
				for _, call := range []string{"read(", "image("} {
					if idx := strings.Index(ln, call); idx >= 0 {
						arg := strings.TrimSpace(ln[idx+len(call):])
						for name := range params {
							if arg == name || strings.HasPrefix(arg, name+",") || strings.HasPrefix(arg, name+")") || strings.HasPrefix(arg, name+" ") {
								out = append(out, Finding{File: rel, Line: i + 1, Message: fmt.Sprintf("%s on function parameter %q rejected; components take content, never paths", strings.TrimSuffix(call, "("), name)})
							}
						}
					}
				}
			}
		}
		return nil
	})
	return out
}

func collectParams(src string) map[string]bool {
	out := map[string]bool{}
	for _, line := range strings.Split(src, "\n") {
		t := strings.TrimSpace(line)
		if strings.HasPrefix(t, "#let ") && strings.Contains(t, "(") {
			start := strings.Index(t, "(")
			end := strings.Index(t, ")")
			if start >= 0 && end > start {
				for _, p := range strings.Split(t[start+1:end], ",") {
					p = strings.TrimSpace(p)
					if p == "" {
						continue
					}
					if idx := strings.Index(p, ":"); idx >= 0 {
						p = strings.TrimSpace(p[:idx])
					}
					if idx := strings.Index(p, "="); idx >= 0 {
						p = strings.TrimSpace(p[:idx])
					}
					if p != "" {
						out[p] = true
					}
				}
			}
		}
	}
	return out
}

func checkLock(root string) []Finding {
	var out []Finding
	l, err := lock.Load(root)
	if err != nil {
		return []Finding{{File: filepath.Join(root, ".unsareport.lock"), Message: err.Error()}}
	}
	for _, p := range l.Pkg {
		dir := filepath.Join(root, "components", p.Name)
		if _, err := os.Stat(dir); err != nil {
			out = append(out, Finding{File: ".unsareport.lock", Message: fmt.Sprintf("locked package %q missing on disk at components/%s", p.Name, p.Name)})
			continue
		}
		for _, f := range p.Files {
			fp := filepath.Join(dir, filepath.FromSlash(f.Path))
			b, err := os.ReadFile(fp)
			if err != nil {
				out = append(out, Finding{File: ".unsareport.lock", Message: fmt.Sprintf("locked file %s/%s missing on disk", p.Name, f.Path)})
				continue
			}
			if got := lock.SHA256Hex(b); got != f.SHA256 {
				out = append(out, Finding{File: filepath.Join("components", p.Name, f.Path), Message: "drift: sha256 mismatch vs .unsareport.lock"})
			}
		}
	}
	return out
}

func checkScriptsHooks(root string, cfg project.SpecConfig) []Finding {
	var out []Finding
	for alias, s := range cfg.Scripts {
		file := "unsareport.toml"
		if src := cfg.ScriptSource(alias); src != "" {
			file = src
		}
		total := 0
		for key, lines := range s.Commands {
			if !project.OSKeys[key] {
				out = append(out, Finding{File: file, Message: fmt.Sprintf("[scripts.%s] unknown os key %q", alias, key)})
			}
			total += len(lines)
			for _, l := range lines {
				if strings.Contains(l, "allow_read") || strings.Contains(l, "allow_write") {
					out = append(out, Finding{File: file, Message: fmt.Sprintf("[scripts.%s]: legacy allow_read/allow_write rejected", alias)})
				}
			}
		}
		if total == 0 {
			out = append(out, Finding{File: file, Message: fmt.Sprintf("[scripts.%s] commands must not be empty", alias)})
		}
		if _, err := scripts.Select(s.Commands, alias, ""); err != nil {
			out = append(out, Finding{File: file, Message: fmt.Sprintf("[scripts.%s]: %v", alias, err)})
		}
	}
	seen := map[string]map[string]bool{}
	for std, aliases := range cfg.Hooks {
		if !scripts.HookStandards[std] {
			out = append(out, Finding{File: "unsareport.toml", Message: fmt.Sprintf("unknown [hooks.%s] (hookable: build, check)", std)})
			continue
		}
		if seen[std] == nil {
			seen[std] = map[string]bool{}
		}
		for _, b := range aliases {
			name := b.Alias
			if idx := strings.Index(b.Alias, "]"); strings.HasPrefix(b.Alias, "[") && idx >= 0 {
				name = strings.TrimSpace(b.Alias[idx+1:])
			}
			if seen[std][name+"\x00"+b.When()] {
				out = append(out, Finding{File: "unsareport.toml", Message: fmt.Sprintf("duplicate alias %q in [hooks.%s]", name, std)})
			}
			seen[std][name+"\x00"+b.When()] = true
			if _, ok := cfg.Scripts[name]; !ok {
				out = append(out, Finding{File: "unsareport.toml", Message: fmt.Sprintf("[hooks.%s] unknown alias %q", std, name)})
			}
		}
	}
	return out
}
