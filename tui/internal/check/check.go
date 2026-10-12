package check

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/UNSAReport/tui/internal/config"
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

type CheckScope = string

const (
	ScopeAll        CheckScope = config.CheckScopeAll
	ScopeReport     CheckScope = config.CheckScopeReport
	ScopeComponents CheckScope = config.CheckScopeComponents
)

type Options struct {
	Scope  CheckScope
	Report string
}

func Run(root string) []Finding {
	return RunWithOptions(root, Options{Scope: ScopeAll})
}

func RunReport(root, report string) []Finding {
	return RunWithOptions(root, Options{
		Scope:  ScopeReport,
		Report: report,
	})
}

func RunComponents(root string) []Finding {
	return RunWithOptions(root, Options{Scope: ScopeComponents})
}

func RunWithOptions(root string, opts Options) []Finding {
	var out []Finding
	cfgPath := filepath.Join(root, config.ConfigFileName)
	cfg, err := project.Load(cfgPath)
	if err != nil {
		return []Finding{{File: cfgPath, Message: err.Error()}}
	}

	switch opts.Scope {
	case ScopeComponents:
	case ScopeReport:
		out = append(out, checkReport(root, opts.Report, cfg)...)
	case ScopeAll:
		out = append(out, checkReports(root, cfg)...)
	default:
		return []Finding{{File: root, Message: fmt.Sprintf("invalid check scope %q", opts.Scope)}}
	}

	out = append(out, checkTypstSources(root, opts)...)
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

func checkReport(root, report string, cfg project.SpecConfig) []Finding {
	clean := filepath.Clean(report)
	if clean == "." || clean == "" {
		return nil
	}
	cleanSlash := filepath.ToSlash(clean)
	topDir := strings.Split(cleanSlash, "/")[0]
	if topDir == config.ComponentsDirName || topDir == config.ConfigDirName || strings.HasPrefix(topDir, ".") {
		return nil
	}
	var out []Finding
	if nested, _ := hasNestedReport(filepath.Join(root, topDir), cfg.Project.TypstEntry); nested {
		out = append(out, Finding{File: filepath.Join(topDir, topDir, cfg.Project.TypstEntry), Message: "nested report dirs deeper than one level are rejected"})
	}
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
		if name == config.ComponentsDirName || name == config.ConfigDirName || strings.HasPrefix(name, ".") {
			continue
		}
		if _, sErr := os.Stat(filepath.Join(root, name, config.ConfigFileName)); sErr == nil {
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
			if d.Name() == "template" || d.Name() == config.ComponentsDirName || strings.HasPrefix(d.Name(), ".") {
				return filepath.SkipDir
			}
			if _, sErr := os.Stat(filepath.Join(p, config.ConfigFileName)); sErr == nil {
				return filepath.SkipDir
			}
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

var (
	fnPattern    = regexp.MustCompile(`(?m)#?let\s+[A-Za-z_][\w-]*\s*\(([^)]*)\)`)
	paramPattern = regexp.MustCompile(`^[A-Za-z_][\w-]*$`)
	callPattern  = regexp.MustCompile(`\b(read|image)\s*\(\s*([A-Za-z_][\w-]*)\s*[,)]`)
)

func checkTypstSources(root string, opts Options) []Finding {
	var out []Finding
	_ = filepath.WalkDir(root, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if p == root {
			return nil
		}
		rel, rErr := filepath.Rel(root, p)
		if rErr != nil {
			return nil
		}
		relSlash := filepath.ToSlash(rel)

		if d.IsDir() {
			if d.Name() == ".git" {
				return filepath.SkipDir
			}
			if !strings.Contains(relSlash, "/") {
				switch opts.Scope {
				case ScopeComponents:
					if relSlash != config.ComponentsDirName {
						return filepath.SkipDir
					}
				case ScopeReport:
					cleanReport := filepath.ToSlash(filepath.Clean(opts.Report))
					topDir := strings.Split(cleanReport, "/")[0]
					if relSlash != config.ComponentsDirName && relSlash != topDir {
						return filepath.SkipDir
					}
				case ScopeAll:
				default:
					return filepath.SkipDir
				}
			}
			return nil
		}

		if !strings.HasSuffix(p, config.ExtTypst) {
			return nil
		}

		inComponents := relSlash == config.ComponentsDirName || strings.HasPrefix(relSlash, config.ComponentsDirName+"/")
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
				for _, m := range callPattern.FindAllStringSubmatch(ln, -1) {
					if len(m) == 3 {
						fn := m[1]
						ident := m[2]
						if params[ident] {
							out = append(out, Finding{
								File:    rel,
								Line:    i + 1,
								Message: fmt.Sprintf("%s on function parameter %q rejected; components take content, never paths", fn, ident),
							})
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
	matches := fnPattern.FindAllStringSubmatch(src, -1)
	for _, m := range matches {
		if len(m) < 2 {
			continue
		}
		for _, p := range strings.Split(m[1], ",") {
			head := strings.TrimSpace(p)
			if idx := strings.IndexAny(head, ":="); idx >= 0 {
				head = strings.TrimSpace(head[:idx])
			}
			if paramPattern.MatchString(head) {
				out[head] = true
			}
		}
	}
	return out
}

func checkLock(root string) []Finding {
	var out []Finding
	l, err := lock.Load(root)
	if err != nil {
		return []Finding{{File: filepath.Join(root, config.LockFileName), Message: err.Error()}}
	}
	for _, p := range l.Pkg {
		dir := filepath.Join(root, "components", p.Name)
		if _, err := os.Stat(dir); err != nil {
			out = append(out, Finding{File: config.LockFileName, Message: fmt.Sprintf("locked package %q missing on disk at components/%s", p.Name, p.Name)})
			continue
		}
		for _, f := range p.Files {
			fp := filepath.Join(dir, filepath.FromSlash(f.Path))
			if _, err := os.Stat(fp); err != nil {
				out = append(out, Finding{File: config.LockFileName, Message: fmt.Sprintf("locked file %s/%s missing on disk", p.Name, f.Path)})
				continue
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
		for key, cmd := range s.Commands {
			if !project.OSKeys[key] {
				out = append(out, Finding{File: file, Message: fmt.Sprintf("[scripts.%s] unknown os key %q", alias, key)})
			}
			if strings.TrimSpace(cmd) == "" {
				continue
			}
			total++
			if strings.Contains(cmd, "allow_read") || strings.Contains(cmd, "allow_write") {
				out = append(out, Finding{File: file, Message: fmt.Sprintf("[scripts.%s]: legacy allow_read/allow_write rejected", alias)})
			}
		}
		if total == 0 {
			out = append(out, Finding{File: file, Message: fmt.Sprintf("[scripts.%s] commands must not be empty", alias)})
		}
		if _, err := scripts.Select(s.Commands, alias, ""); err != nil {
			out = append(out, Finding{File: file, Message: fmt.Sprintf("[scripts.%s]: %v", alias, err)})
		}
	}
	seen := map[string]bool{}
	for std, timing := range cfg.Hooks {
		if !scripts.HookStandards[std] {
			out = append(out, Finding{File: "unsareport.toml", Message: fmt.Sprintf("unknown [hooks.%s] (hookable: build, check)", std)})
			continue
		}
		for _, list := range []struct {
			when    string
			aliases []string
		}{
			{project.HookBefore, timing.Before},
			{project.HookAfter, timing.After},
		} {
			for _, a := range list.aliases {
				_, name, err := scripts.SplitPrefix(strings.TrimSpace(a))
				if err != nil {
					out = append(out, Finding{File: "unsareport.toml", Message: fmt.Sprintf("[hooks.%s] %v", std, err)})
					continue
				}
				key := std + "\x00" + list.when + "\x00" + name
				if seen[key] {
					out = append(out, Finding{File: "unsareport.toml", Message: fmt.Sprintf("duplicate alias %q in [hooks.%s.%s]", name, std, list.when)})
				}
				seen[key] = true
				if _, ok := cfg.Scripts[name]; !ok {
					out = append(out, Finding{File: "unsareport.toml", Message: fmt.Sprintf("[hooks.%s] unknown alias %q", std, name)})
				}
			}
		}
	}
	return out
}
