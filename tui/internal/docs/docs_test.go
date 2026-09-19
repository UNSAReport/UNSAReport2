package docs

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/UNSAReport/tui/internal/project"
)

func TestParseNameRangeScoped(t *testing.T) {
	name, rng := parseNameRange("@xxx/yyy")
	if name != "@xxx/yyy" || rng != "*" {
		t.Fatalf("got %q %q", name, rng)
	}
	name, rng = parseNameRange("@xxx/yyy@^1.0.0")
	if name != "@xxx/yyy" || rng != "^1.0.0" {
		t.Fatalf("got %q %q", name, rng)
	}
	name, rng = parseNameRange("cardo")
	if name != "cardo" || rng != "*" {
		t.Fatalf("got %q %q", name, rng)
	}
	name, rng = parseNameRange("cardo@^1.0.0")
	if name != "cardo" || rng != "^1.0.0" {
		t.Fatalf("got %q %q", name, rng)
	}
}

func hookTestConfig() project.SpecConfig {
	return project.SpecConfig{
		Scripts: map[string]project.ScriptDef{
			"a:pre":  {Commands: project.ScriptCommands{"any": "echo pre >> order.txt"}},
			"a:post": {Commands: project.ScriptCommands{"any": "echo post >> order.txt"}},
		},
		Hooks: map[string]project.HookTiming{
			"build": {Before: []string{"a:pre"}, After: []string{"a:post"}},
		},
	}
}

func TestRunHooksBeforeAfterOrder(t *testing.T) {
	root := t.TempDir()
	cfg := hookTestConfig()
	if err := runHooks(root, "build", project.HookBefore, cfg); err != nil {
		t.Fatal(err)
	}
	if err := runHooks(root, "build", project.HookAfter, cfg); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(root, "order.txt"))
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != "pre\npost\n" {
		t.Fatalf("got %q", raw)
	}
}

func TestRunHooksAfterSkippedOnBeforeFailure(t *testing.T) {
	root := t.TempDir()
	cfg := hookTestConfig()
	cfg.Scripts["a:pre"] = project.ScriptDef{
		Commands: project.ScriptCommands{"any": "echo pre >> order.txt\nexit 1"},
	}
	if err := runHooks(root, "build", project.HookBefore, cfg); err == nil {
		t.Fatal("expected before-hook failure")
	}
	raw, err := os.ReadFile(filepath.Join(root, "order.txt"))
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != "pre\n" {
		t.Fatalf("got %q", raw)
	}
	// Fail-fast lives with the caller (Check/Build stop on error): the after
	// filter alone would still run post, so callers must not invoke it.
	if err := runHooks(root, "build", project.HookAfter, cfg); err != nil {
		t.Fatal(err)
	}
	raw, err = os.ReadFile(filepath.Join(root, "order.txt"))
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != "pre\npost\n" {
		t.Fatalf("got %q", raw)
	}
}

func writeTyp(t *testing.T, dir, name string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(dir, name), []byte("hi\n"), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestResolveTypstEntryConfiguredWins(t *testing.T) {
	dir := t.TempDir()
	writeTyp(t, dir, "custom.typ")
	writeTyp(t, dir, "other.typ")
	got, err := resolveTypstEntry(dir, "custom.typ", nil)
	if err != nil || got != "custom.typ" {
		t.Fatalf("got %q %v", got, err)
	}
}

func TestResolveTypstEntrySingleAssumed(t *testing.T) {
	dir := t.TempDir()
	writeTyp(t, dir, "only.typ")
	writeTyp(t, dir, "notes.txt")
	got, err := resolveTypstEntry(dir, "main.typ", nil)
	if err != nil || got != "only.typ" {
		t.Fatalf("got %q %v", got, err)
	}
}

func TestResolveTypstEntryNoneFails(t *testing.T) {
	dir := t.TempDir()
	if _, err := resolveTypstEntry(dir, "main.typ", nil); err == nil {
		t.Fatal("expected no-entry error")
	}
}

func TestResolveTypstEntryMultiplePicks(t *testing.T) {
	dir := t.TempDir()
	writeTyp(t, dir, "a.typ")
	writeTyp(t, dir, "b.typ")
	got, err := resolveTypstEntry(dir, "main.typ", func(string) (string, error) { return "2", nil })
	if err != nil || got != "b.typ" {
		t.Fatalf("got %q %v", got, err)
	}
	if _, err := resolveTypstEntry(dir, "main.typ", func(string) (string, error) { return "9", nil }); err == nil {
		t.Fatal("expected invalid-selection error")
	}
}

func TestSaveConfigKeepsImportsInFragments(t *testing.T) {
	tmp := t.TempDir()
	root := "[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n\n[scripts.\"local:one\"]\ndescription = \"local\"\n[scripts.\"local:one\".commands]\nany = \"echo local\"\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.toml"), []byte(root), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmp, "unsareport.d", "scripts"), 0o755); err != nil {
		t.Fatal(err)
	}
	frag := "alias = \"cardo:zip\"\ndescription = \"zip\"\norigin = \"cardo\"\n\n[commands]\nany = \"rm -f s.zip\"\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "scripts", "cardo-zip.toml"), []byte(frag), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmp, "unsareport.d", "hooks"), 0o755); err != nil {
		t.Fatal(err)
	}
	hook := "standard = \"build\"\nbefore = [\"cardo:zip\"]\norigin = \"cardo\"\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "hooks", "build-cardo.toml"), []byte(hook), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := project.Load(filepath.Join(tmp, "unsareport.toml"))
	if err != nil {
		t.Fatal(err)
	}
	if err := saveConfig(tmp, cfg); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(tmp, "unsareport.toml"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(raw), "local:one") {
		t.Fatalf("local script lost:\n%s", raw)
	}
	if strings.Contains(string(raw), "cardo:zip") {
		t.Fatalf("import inlined into root:\n%s", raw)
	}
	back, err := project.Load(filepath.Join(tmp, "unsareport.toml"))
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := back.Scripts["cardo:zip"]; !ok {
		t.Fatal("fragment script lost after save")
	}
	if len(back.Hooks["build"].Before) != 1 {
		t.Fatalf("fragment hook lost after save: %+v", back.Hooks)
	}
}
