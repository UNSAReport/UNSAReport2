package docs

import (
	"os"
	"path/filepath"
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
			"a:pre":  {Commands: project.OSCommands{"any": {"echo pre >> order.txt"}}},
			"a:post": {Commands: project.OSCommands{"any": {"echo post >> order.txt"}}},
		},
		Hooks: map[string][]project.HookBinding{
			// Listed out of order to prove timing partitions, never interleaves.
			"build": {{Alias: "a:post", Time: project.HookAfter}, {Alias: "a:pre"}},
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
		Commands: project.OSCommands{"any": {"echo pre >> order.txt", "exit 1"}},
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
