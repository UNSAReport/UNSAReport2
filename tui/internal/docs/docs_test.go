package docs

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/BurntSushi/toml"
	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/lock"
	"github.com/UNSAReport/tui/internal/pkg"
	"github.com/UNSAReport/tui/internal/project"
	"github.com/UNSAReport/tui/internal/testutil"
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
	if err := runHooks(root, "build", project.HookBefore, cfg, nil); err != nil {
		t.Fatal(err)
	}
	if err := runHooks(root, "build", project.HookAfter, cfg, nil); err != nil {
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

func TestAfterHooksRunEvenWhenBeforeFails(t *testing.T) {
	root := t.TempDir()
	cfg := hookTestConfig()
	cfg.Scripts["a:pre"] = project.ScriptDef{
		Commands: project.ScriptCommands{"any": "echo pre >> order.txt\nexit 1"},
	}
	if err := runHooks(root, "build", project.HookBefore, cfg, nil); err == nil {
		t.Fatal("expected before-hook failure")
	}
	raw, err := os.ReadFile(filepath.Join(root, "order.txt"))
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != "pre\n" {
		t.Fatalf("got %q", raw)
	}
	if err := runHooks(root, "build", project.HookAfter, cfg, nil); err != nil {
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


func TestInitNonEmptyDirNoConflicts(t *testing.T) {
	srv := testutil.MockRegistry(t)
	defer srv.Close()

	tmp := t.TempDir()
	if err := os.WriteFile(filepath.Join(tmp, "README.md"), []byte("# My Doc\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	err := Init(context.Background(), tmp, InitOptions{Template: "@scope/cardo", Report: "t1"})
	if err != nil {
		t.Fatalf("expected Init to succeed in non-empty dir without conflicts, got %v", err)
	}

	if _, err := os.Stat(filepath.Join(tmp, "t1", "report.typ")); err != nil {
		t.Fatalf("expected report.typ to exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, "unsareport.toml")); err != nil {
		t.Fatalf("expected unsareport.toml to exist: %v", err)
	}
	rawToml, err := os.ReadFile(filepath.Join(tmp, "unsareport.toml"))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(rawToml), "root_marker_version") {
		t.Fatalf("unsareport.toml must not contain root_marker_version: %s", string(rawToml))
	}
	if !strings.Contains(string(rawToml), "config_version") {
		t.Fatalf("unsareport.toml must contain config_version: %s", string(rawToml))
	}

	if _, err := os.Stat(filepath.Join(tmp, "components", "@scope", "cardo", "lib.typ")); err != nil {
		t.Fatalf("expected cardo component to exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, "components", "@scope", "theme", "lib.typ")); err != nil {
		t.Fatalf("expected theme component to exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, "components", "@scope", "utils", "lib.typ")); err != nil {
		t.Fatalf("expected utils component to exist: %v", err)
	}

	l, err := lock.Load(tmp)
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := l.Find("@scope/cardo"); !ok {
		t.Fatal("cardo not in lock")
	}
	if _, ok := l.Find("@scope/theme"); !ok {
		t.Fatal("theme not in lock")
	}
	if _, ok := l.Find("@scope/utils"); !ok {
		t.Fatal("utils not in lock")
	}
}

func TestInitBlankTemplate(t *testing.T) {
	tmp := t.TempDir()

	err := Init(context.Background(), tmp, InitOptions{Template: "blank", Report: "lab-01"})
	if err != nil {
		t.Fatalf("expected Init with blank template to succeed, got %v", err)
	}

	cfgPath := filepath.Join(tmp, "unsareport.toml")
	if _, err := os.Stat(cfgPath); err != nil {
		t.Fatalf("expected unsareport.toml to exist: %v", err)
	}
	rawToml, err := os.ReadFile(cfgPath)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(rawToml), "config_version = 1") {
		t.Fatalf("expected config_version = 1, got: %s", string(rawToml))
	}
	if !strings.Contains(string(rawToml), `typst_entry = "main.typ"`) {
		t.Fatalf("expected typst_entry = main.typ, got: %s", string(rawToml))
	}

	mainTyp := filepath.Join(tmp, "lab-01", "main.typ")
	if _, err := os.Stat(mainTyp); err != nil {
		t.Fatalf("expected lab-01/main.typ to exist: %v", err)
	}
	content, err := os.ReadFile(mainTyp)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(content), "= Document") {
		t.Fatalf("unexpected content in main.typ: %s", string(content))
	}

	compDir := filepath.Join(tmp, "components")
	if _, err := os.Stat(compDir); !os.IsNotExist(err) {
		t.Fatalf("expected components/ to not exist for blank template")
	}

	l, err := lock.Load(tmp)
	if err != nil {
		t.Fatal(err)
	}
	if len(l.Pkg) != 0 {
		t.Fatalf("expected lockfile to have 0 packages, got %d", len(l.Pkg))
	}

	if err := runCheck(tmp); err != nil {
		t.Fatalf("expected runCheck to succeed, got %v", err)
	}

	err2 := Init(context.Background(), tmp, InitOptions{
		Template: "blank",
		Report:   "lab-01",
		Confirm: func(conflicts []string) (bool, error) {
			return false, nil
		},
	})
	if err2 == nil || !strings.Contains(err2.Error(), ErrInitCancelled) {
		t.Fatalf("expected ErrInitCancelled when conflict rejected, got %v", err2)
	}
}

func TestInitNonEmptyDirWithConflicts(t *testing.T) {
	srv := testutil.MockRegistry(t)
	defer srv.Close()

	t.Run("aborts when confirmation is rejected", func(t *testing.T) {
		tmp := t.TempDir()
		if err := os.MkdirAll(filepath.Join(tmp, "t1"), 0o755); err != nil {
			t.Fatal(err)
		}
		existingContent := "original content"
		if err := os.WriteFile(filepath.Join(tmp, "t1", "report.typ"), []byte(existingContent), 0o644); err != nil {
			t.Fatal(err)
		}

		sawConflicts := false
		err := Init(context.Background(), tmp, InitOptions{
			Template: "@scope/cardo",
			Report:   "t1",
			Confirm: func(conflicts []string) (bool, error) {
				sawConflicts = len(conflicts) > 0
				return false, nil
			},
		})
		if err == nil {
			t.Fatal("expected error on cancelled confirmation")
		}
		if !sawConflicts {
			t.Fatal("expected confirmation callback to see conflicts")
		}

		b, err := os.ReadFile(filepath.Join(tmp, "t1", "report.typ"))
		if err != nil {
			t.Fatal(err)
		}
		if string(b) != existingContent {
			t.Fatalf("expected original content to be preserved, got %q", string(b))
		}
	})

	t.Run("overwrites when confirmed with Yes", func(t *testing.T) {
		tmp := t.TempDir()
		if err := os.MkdirAll(filepath.Join(tmp, "t1"), 0o755); err != nil {
			t.Fatal(err)
		}
		existingContent := "original content"
		if err := os.WriteFile(filepath.Join(tmp, "t1", "report.typ"), []byte(existingContent), 0o644); err != nil {
			t.Fatal(err)
		}

		err := Init(context.Background(), tmp, InitOptions{
			Template: "@scope/cardo",
			Report:   "t1",
			Yes:      true,
		})
		if err != nil {
			t.Fatalf("expected Init with Yes=true to succeed, got %v", err)
		}

		b, err := os.ReadFile(filepath.Join(tmp, "t1", "report.typ"))
		if err != nil {
			t.Fatal(err)
		}
		if string(b) == existingContent {
			t.Fatal("expected original content to be overwritten")
		}
	})
}

func TestAddRecursiveDependencies(t *testing.T) {
	srv := testutil.MockRegistry(t)
	defer srv.Close()

	tmp := t.TempDir()
	cfg := "[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n\n[dependencies]\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.toml"), []byte(cfg), 0o644); err != nil {
		t.Fatal(err)
	}

	err := Add(context.Background(), tmp, AddOptions{
		Package: "@scope/cardo",
		Flags:   []string{"--yes"},
	})
	if err != nil {
		t.Fatalf("expected Add to succeed, got %v", err)
	}

	if _, err := os.Stat(filepath.Join(tmp, "components", "@scope", "cardo", "lib.typ")); err != nil {
		t.Fatalf("expected cardo component to exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, "components", "@scope", "theme", "lib.typ")); err != nil {
		t.Fatalf("expected theme component to exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, "components", "@scope", "utils", "lib.typ")); err != nil {
		t.Fatalf("expected utils component to exist: %v", err)
	}

	l, err := lock.Load(tmp)
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := l.Find("@scope/cardo"); !ok {
		t.Fatal("cardo not in lock")
	}
	if _, ok := l.Find("@scope/theme"); !ok {
		t.Fatal("theme not in lock")
	}
	if _, ok := l.Find("@scope/utils"); !ok {
		t.Fatal("utils not in lock")
	}
}

func TestNormalizeTemplateFiles(t *testing.T) {
	t.Run("single top level dir with no siblings is stripped", func(t *testing.T) {
		input := map[string][]byte{
			"template/report.typ":      []byte("report"),
			"template/assets/logo.png": []byte("logo"),
		}
		got, err := normalizeTemplateFiles(input)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(got) != 2 {
			t.Fatalf("got %d files, want 2", len(got))
		}
		if string(got["report.typ"]) != "report" {
			t.Fatalf("expected report.typ to be present")
		}
		if string(got["assets/logo.png"]) != "logo" {
			t.Fatalf("expected assets/logo.png to be present")
		}
	})

	t.Run("custom single top level dir is stripped", func(t *testing.T) {
		input := map[string][]byte{
			"custom_name/report.typ": []byte("report"),
		}
		got, err := normalizeTemplateFiles(input)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if string(got["report.typ"]) != "report" {
			t.Fatalf("expected report.typ to be present")
		}
	})

	t.Run("top level dir with sibling file is not stripped", func(t *testing.T) {
		input := map[string][]byte{
			"template/report.typ": []byte("report"),
			"README.md":           []byte("readme"),
		}
		got, err := normalizeTemplateFiles(input)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if string(got["template/report.typ"]) != "report" {
			t.Fatalf("expected template/report.typ to be preserved")
		}
		if string(got["README.md"]) != "readme" {
			t.Fatalf("expected README.md to be preserved")
		}
	})

	t.Run("multiple top level dirs are not stripped", func(t *testing.T) {
		input := map[string][]byte{
			"dir1/a.typ": []byte("a"),
			"dir2/b.typ": []byte("b"),
		}
		got, err := normalizeTemplateFiles(input)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if string(got["dir1/a.typ"]) != "a" || string(got["dir2/b.typ"]) != "b" {
			t.Fatalf("expected multiple top-level dirs to be preserved")
		}
	})

	t.Run("files at root are not stripped", func(t *testing.T) {
		input := map[string][]byte{
			"report.typ": []byte("report"),
		}
		got, err := normalizeTemplateFiles(input)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if string(got["report.typ"]) != "report" {
			t.Fatalf("expected report.typ to be preserved")
		}
	})

	t.Run("rejects path traversal", func(t *testing.T) {
		input := map[string][]byte{
			"../outside.typ": []byte("bad"),
		}
		if _, err := normalizeTemplateFiles(input); err == nil {
			t.Fatalf("expected path traversal error")
		}
	})
}

func TestInitTemplateStripsTemplateSubdir(t *testing.T) {
	srv := testutil.MockRegistry(t)
	defer srv.Close()

	tmp := t.TempDir()
	reportDir := filepath.Join("destination", "dir")
	err := Init(context.Background(), tmp, InitOptions{
		Template: "@scope/tplpkg",
		Report:   reportDir,
	})
	if err != nil {
		t.Fatalf("expected Init to succeed, got %v", err)
	}

	reportTypPath := filepath.Join(tmp, reportDir, "report.typ")
	if _, err := os.Stat(reportTypPath); err != nil {
		t.Fatalf("expected report.typ at %s: %v", reportTypPath, err)
	}

	assetPath := filepath.Join(tmp, reportDir, "assets", "logo.png")
	if _, err := os.Stat(assetPath); err != nil {
		t.Fatalf("expected logo.png at %s: %v", assetPath, err)
	}

	nestedTemplateDir := filepath.Join(tmp, reportDir, "template")
	if _, err := os.Stat(nestedTemplateDir); !os.IsNotExist(err) {
		t.Fatalf("expected %s to NOT exist, but it does", nestedTemplateDir)
	}
}

func TestInitTemplateKeepsSiblings(t *testing.T) {
	srv := testutil.MockRegistry(t)
	defer srv.Close()

	tmp := t.TempDir()
	reportDir := filepath.Join("destination", "dir")
	err := Init(context.Background(), tmp, InitOptions{
		Template: "@scope/siblingpkg",
		Report:   reportDir,
	})
	if err != nil {
		t.Fatalf("expected Init to succeed, got %v", err)
	}

	if _, err := os.Stat(filepath.Join(tmp, reportDir, "template", "report.typ")); err != nil {
		t.Fatalf("expected template/report.typ to exist because sibling README.md exists: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, reportDir, "README.md")); err != nil {
		t.Fatalf("expected README.md to exist: %v", err)
	}
}

func configTestPkg(schema map[string]pkg.ConfigSchemaEntry) pkg.PkgToml {
	return pkg.PkgToml{
		Package: pkg.PackageDef{Name: "@unsareport/epis-lab", Version: "0.1.0", CommandPrefix: "epis-lab"},
		Commands: map[string]pkg.CommandDef{
			"copy-report": {Description: "copy", Commands: project.OSCommands{"any": {"echo hi"}}},
		},
		ConfigSchema: schema,
	}
}

func TestCollectPackageConfigAllMode(t *testing.T) {
	root := t.TempDir()
	cfg := &project.SpecConfig{}
	p := configTestPkg(map[string]pkg.ConfigSchemaEntry{
		"filename_format": {Type: "string", Required: true, Default: "{course_abbr}.pdf"},
		"retries":         {Type: "int", Required: false},
	})
	if err := copyCommands(root, cfg, p, "all"); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(root, "unsareport.d", "config", "unsareport-epis-lab.toml"))
	if err != nil {
		t.Fatal(err)
	}
	body := string(raw)
	if !strings.Contains(body, `filename_format = "{course_abbr}.pdf"`) {
		t.Fatalf("fragment %q", body)
	}
	if strings.Contains(body, "retries") {
		t.Fatalf("optional key without default must be skipped: %q", body)
	}
	env := cfg.ConfigEnv("@unsareport/epis-lab")
	if len(env) != 1 || env[0] != "UNSAREP_CONFIG_EPIS_LAB_FILENAME_FORMAT={course_abbr}.pdf" {
		t.Fatalf("env %+v", env)
	}
}

func TestCollectPackageConfigRequiredFailsHeadless(t *testing.T) {
	root := t.TempDir()
	cfg := &project.SpecConfig{}
	p := configTestPkg(map[string]pkg.ConfigSchemaEntry{
		"filename_format": {Type: "string", Required: true},
	})
	if err := copyCommands(root, cfg, p, "all"); err == nil {
		t.Fatal("expected required-without-default error")
	}
}

func TestCopyCommandsBindsHooksBeforeAndAfter(t *testing.T) {
	root := t.TempDir()
	cfg := &project.SpecConfig{}
	p := pkg.PkgToml{
		Package: pkg.PackageDef{Name: "@unsareport/epis-lab", Version: "0.1.0", CommandPrefix: "epis-lab"},
		Commands: map[string]pkg.CommandDef{
			"pre-check":   {Description: "pre check", Commands: project.OSCommands{"any": {"echo pre"}}},
			"copy-report": {Description: "copy", Commands: project.OSCommands{"any": {"echo copy"}}},
		},
		Hooks: map[string]project.HookTiming{
			"build": {
				Before: []string{"pre-check"},
				After:  []string{"copy-report"},
			},
		},
	}
	if err := copyCommands(root, cfg, p, "all"); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(root, "unsareport.d", "hooks", "build-epis-lab.toml"))
	if err != nil {
		t.Fatal(err)
	}
	var frag project.HookFragment
	if _, err := toml.Decode(string(raw), &frag); err != nil {
		t.Fatal(err)
	}
	if frag.Standard != "build" || frag.Origin != "@unsareport/epis-lab" {
		t.Fatalf("unexpected standard/origin: %+v", frag)
	}
	if len(frag.Before) != 1 || frag.Before[0] != "epis-lab:pre-check" {
		t.Fatalf("unexpected frag.Before: %+v", frag.Before)
	}
	if len(frag.After) != 1 || frag.After[0] != "epis-lab:copy-report" {
		t.Fatalf("unexpected frag.After: %+v", frag.After)
	}
}

func TestRunHooksConfigEnv(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "unsareport.toml"), []byte("[project]\ntypst_entry = \"main.typ\"\nconfig_version = 1\n\n[hooks.build]\nafter = [\"lab:copy\"]\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(root, "unsareport.d", "scripts"), 0o755); err != nil {
		t.Fatal(err)
	}
	script := "alias = \"lab:copy\"\ndescription = \"copy\"\norigin = \"@unsareport/epis-lab\"\n\n[commands]\nany = \"printenv UNSAREP_CONFIG_EPIS_LAB_FILENAME_FORMAT > got.txt\"\n"
	if err := os.WriteFile(filepath.Join(root, "unsareport.d", "scripts", "lab-copy.toml"), []byte(script), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(root, "unsareport.d", "config"), 0o755); err != nil {
		t.Fatal(err)
	}
	conf := "origin = \"@unsareport/epis-lab\"\nenv_prefix = \"EPIS_LAB\"\n\n[values]\nfilename_format = \"{course_abbr}.pdf\"\n"
	if err := os.WriteFile(filepath.Join(root, "unsareport.d", "config", "unsareport-epis-lab.toml"), []byte(conf), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := project.Load(filepath.Join(root, "unsareport.toml"))
	if err != nil {
		t.Fatal(err)
	}
	if err := runHooks(root, "build", project.HookAfter, cfg, nil); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(root, "got.txt"))
	if err != nil {
		t.Fatal(err)
	}
	if strings.TrimSpace(string(raw)) != "{course_abbr}.pdf" {
		t.Fatalf("hook saw %q", raw)
	}
}

func TestScopeDownloadAndRemove(t *testing.T) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	zf, _ := zw.Create("tsconfig.json")
	_, _ = zf.Write([]byte(`{"compilerOptions":{}}`))
	_ = zw.Close()
	scopeZipBytes := buf.Bytes()

	var srv *httptest.Server
	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/scopes/@myscope/archive" {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"downloadUrl": srv.URL + "/dl/scope.zip",
			})
			return
		}
		if r.URL.Path == "/dl/scope.zip" {
			_, _ = w.Write(scopeZipBytes)
			return
		}
		if r.URL.Path == "/v1/resolve" {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"resolved": []map[string]any{
					{
						"name":        "@myscope/pkg1",
						"version":     "1.0.0",
						"archive_url": srv.URL + "/dl/pkg1.zip",
					},
				},
			})
			return
		}
		if strings.HasSuffix(r.URL.Path, "/archive") {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"archive_url": srv.URL + "/dl/pkg1.zip",
			})
			return
		}
		if strings.HasPrefix(r.URL.Path, "/dl/") {
			pkgArchive := testutil.CreateZip(map[string]string{
				"unsareport.toml": "[project]\nconfig_version = 1\n\n[package]\nname = \"@myscope/pkg1\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\n\n[templates]\nfiles = []\n",
				"lib.typ":         "#let p1 = 1\n",
			})
			_, _ = w.Write(pkgArchive)
			return
		}
		w.WriteHeader(404)
	}))
	defer srv.Close()
	t.Setenv(config.EnvRegistryURL, srv.URL)

	tmp := t.TempDir()
	cfg := "[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n\n[dependencies]\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.toml"), []byte(cfg), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := Add(context.Background(), tmp, AddOptions{Package: "@myscope/pkg1", Flags: []string{"--yes"}}); err != nil {
		t.Fatalf("Add failed: %v", err)
	}

	tsPath := filepath.Join(tmp, "components", "@myscope", "tsconfig.json")
	if _, err := os.Stat(tsPath); err != nil {
		t.Fatalf("expected scope file tsconfig.json to exist at %s: %v", tsPath, err)
	}

	l, err := lock.Load(tmp)
	if err != nil {
		t.Fatal(err)
	}
	sEntry, ok := l.FindScope("@myscope")
	if !ok {
		t.Fatal("expected @myscope in lock scopes")
	}
	if len(sEntry.Files) != 1 || sEntry.Files[0].Path != "tsconfig.json" {
		t.Fatalf("unexpected scope files in lock: %+v", sEntry.Files)
	}

	if err := Remove(tmp, "@myscope"); err == nil {
		t.Fatal("expected error removing scope with remaining installed package")
	}

	if err := Remove(tmp, "@myscope/pkg1"); err != nil {
		t.Fatalf("Remove package failed: %v", err)
	}

	if _, err := os.Stat(tsPath); err != nil {
		t.Fatalf("scope file should still exist after package remove: %v", err)
	}

	if err := Remove(tmp, "@myscope"); err != nil {
		t.Fatalf("Remove scope failed: %v", err)
	}

	if _, err := os.Stat(filepath.Join(tmp, "components", "@myscope")); !os.IsNotExist(err) {
		t.Fatal("expected components/@myscope to be deleted")
	}

	lAfter, err := lock.Load(tmp)
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := lAfter.FindScope("@myscope"); ok {
		t.Fatal("expected @myscope to be removed from lock scopes")
	}
}

func mockUpdatableRegistry(t *testing.T, versions map[string]string) *httptest.Server {
	t.Helper()
	var srv *httptest.Server

	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/resolve" && r.Method == "POST" {
			var body struct {
				Packages map[string]string `json:"packages"`
			}
			_ = json.NewDecoder(r.Body).Decode(&body)
			var resolved []map[string]any
			for pkgName := range body.Packages {
				ver := versions[pkgName]
				if ver == "" {
					ver = "1.0.0"
				}
				resolved = append(resolved, map[string]any{
					"name":        pkgName,
					"version":     ver,
					"archive_url": srv.URL + "/dl/" + url.PathEscape(pkgName) + "/components.zip",
					"files":       []string{"lib.typ"},
				})
			}
			_ = json.NewEncoder(w).Encode(map[string]any{"resolved": resolved})
			return
		}

		if strings.HasSuffix(r.URL.Path, "/archive") {
			sec := r.URL.Query().Get("section")
			trimmed := strings.TrimPrefix(strings.TrimSuffix(r.URL.Path, "/archive"), "/v1/")
			parts := strings.Split(trimmed, "/")
			if len(parts) >= 2 {
				pkgName := strings.Join(parts[:len(parts)-1], "/")
				_ = json.NewEncoder(w).Encode(map[string]any{
					"archive_url": fmt.Sprintf("%s/dl/%s/%s.zip", srv.URL, url.PathEscape(pkgName), sec),
				})
				return
			}
		}

		if strings.HasPrefix(r.URL.Path, "/dl/") {
			rest := strings.TrimPrefix(r.URL.Path, "/dl/")
			lastSlash := strings.LastIndex(rest, "/")
			if lastSlash > 0 {
				rawPkg := rest[:lastSlash]
				pkgName, _ := url.PathUnescape(rawPkg)
				ver := versions[pkgName]
				if ver == "" {
					ver = "1.0.0"
				}
				var depsToml string
				switch pkgName {
				case "@scope/cardo":
					depsToml = "\n[dependencies]\n\"@scope/theme\" = \"^1.0.0\"\n"
				case "@scope/theme":
					depsToml = "\n[dependencies]\n\"@scope/utils\" = \"^1.0.0\"\n"
				default:
					depsToml = ""
				}
				manifest := fmt.Sprintf("[project]\nconfig_version = 1\n\n[package]\nname = %q\nversion = %q%s\n[components]\nfiles = [\"lib.typ\"]\n", pkgName, ver, depsToml)
				libContent := fmt.Sprintf("// %s v%s\n", pkgName, ver)
				zipBytes := testutil.CreateZip(map[string]string{
					"unsareport.toml": manifest,
					"lib.typ":         libContent,
				})
				_, _ = w.Write(zipBytes)
				return
			}
		}

		w.WriteHeader(404)
	}))

	t.Setenv(config.EnvRegistryURL, srv.URL)
	return srv
}

func setupTestProject(t *testing.T) string {
	t.Helper()
	tmp := t.TempDir()
	cfg := "[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n\n[dependencies]\n\"@scope/cardo\" = \"^1.0.0\"\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.toml"), []byte(cfg), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tmp, "report.typ"), []byte("= Report\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	return tmp
}

func TestUpdatePackageDepsOption(t *testing.T) {
	versions := map[string]string{
		"@scope/cardo": "1.0.0",
		"@scope/theme": "1.0.0",
		"@scope/utils": "1.0.0",
	}
	srv := mockUpdatableRegistry(t, versions)
	defer srv.Close()

	tmp := setupTestProject(t)

	err := Add(context.Background(), tmp, AddOptions{
		Package: "@scope/cardo",
		Flags:   []string{"--yes"},
	})
	if err != nil {
		t.Fatalf("Add failed: %v", err)
	}

	versions["@scope/cardo"] = "1.1.0"
	versions["@scope/theme"] = "1.1.0"

	err = Update(context.Background(), tmp, UpdateOptions{
		Package: "@scope/cardo",
		Deps:    false,
		Flags:   []string{"--yes"},
	})
	if err != nil {
		t.Fatalf("Update without deps failed: %v", err)
	}

	l, err := lock.Load(tmp)
	if err != nil {
		t.Fatal(err)
	}
	cardoEntry, ok := l.Find("@scope/cardo")
	if !ok || cardoEntry.Version != "1.1.0" {
		t.Fatalf("expected cardo 1.1.0, got %+v", cardoEntry)
	}
	themeEntry, ok := l.Find("@scope/theme")
	if !ok || themeEntry.Version != "1.0.0" {
		t.Fatalf("expected theme to remain 1.0.0 when Deps=false, got %+v", themeEntry)
	}

	err = Update(context.Background(), tmp, UpdateOptions{
		Package: "@scope/cardo",
		Deps:    true,
		Flags:   []string{"--yes"},
	})
	if err != nil {
		t.Fatalf("Update with deps failed: %v", err)
	}

	l, err = lock.Load(tmp)
	if err != nil {
		t.Fatal(err)
	}
	themeEntry, ok = l.Find("@scope/theme")
	if !ok || themeEntry.Version != "1.1.0" {
		t.Fatalf("expected theme to update to 1.1.0 when Deps=true, got %+v", themeEntry)
	}
}

func TestUpdateDependencyPackageDirectly(t *testing.T) {
	versions := map[string]string{
		"@scope/cardo": "1.0.0",
		"@scope/theme": "1.0.0",
		"@scope/utils": "1.0.0",
	}
	srv := mockUpdatableRegistry(t, versions)
	defer srv.Close()

	tmp := setupTestProject(t)

	err := Add(context.Background(), tmp, AddOptions{
		Package: "@scope/cardo",
		Flags:   []string{"--yes"},
	})
	if err != nil {
		t.Fatalf("Add failed: %v", err)
	}

	versions["@scope/theme"] = "1.1.0"

	err = Update(context.Background(), tmp, UpdateOptions{
		Package: "@scope/theme",
		Deps:    false,
		Flags:   []string{"--yes"},
	})
	if err != nil {
		t.Fatalf("expected updating dependency package directly to succeed, got %v", err)
	}

	l, err := lock.Load(tmp)
	if err != nil {
		t.Fatal(err)
	}
	themeEntry, ok := l.Find("@scope/theme")
	if !ok || themeEntry.Version != "1.1.0" {
		t.Fatalf("expected theme to update to 1.1.0, got %+v", themeEntry)
	}
}

func TestUpdateInteractiveDiffReview(t *testing.T) {
	versions := map[string]string{
		"@scope/cardo": "1.0.0",
		"@scope/theme": "1.0.0",
		"@scope/utils": "1.0.0",
	}
	srv := mockUpdatableRegistry(t, versions)
	defer srv.Close()

	tmp := setupTestProject(t)

	err := Add(context.Background(), tmp, AddOptions{
		Package: "@scope/cardo",
		Flags:   []string{"--yes"},
	})
	if err != nil {
		t.Fatalf("Add failed: %v", err)
	}

	localContent := "// local custom modification\n"
	cardoLibPath := filepath.Join(tmp, "components", "@scope", "cardo", "lib.typ")
	if err := os.WriteFile(cardoLibPath, []byte(localContent), 0o644); err != nil {
		t.Fatal(err)
	}

	versions["@scope/cardo"] = "1.1.0"

	origTTY := isTTYFunc
	isTTYFunc = func() bool { return true }
	defer func() { isTTYFunc = origTTY }()

	origStdin := stdinReader
	defer func() { stdinReader = origStdin }()

	stdinReader = strings.NewReader("n\n")
	err = Update(context.Background(), tmp, UpdateOptions{
		Package: "@scope/cardo",
		Flags:   nil,
	})
	if err != nil {
		t.Fatalf("interactive Update failed: %v", err)
	}

	content, err := os.ReadFile(cardoLibPath)
	if err != nil {
		t.Fatal(err)
	}
	if string(content) != localContent {
		t.Fatalf("expected local modification to be preserved on 'n', got %q", string(content))
	}

	stdinReader = strings.NewReader("y\n")
	err = Update(context.Background(), tmp, UpdateOptions{
		Package: "@scope/cardo",
		Flags:   nil,
	})
	if err != nil {
		t.Fatalf("interactive Update failed: %v", err)
	}

	content, err = os.ReadFile(cardoLibPath)
	if err != nil {
		t.Fatal(err)
	}
	expectedUpstream := "// @scope/cardo v1.1.0\n"
	if string(content) != expectedUpstream {
		t.Fatalf("expected file to be updated on 'y', got %q", string(content))
	}
}

func TestBuildWatchArgs(t *testing.T) {
	argsOpen := buildWatchArgs("/root", "/root/in.typ", "/root/out.pdf", true)
	expectedOpen := []string{"watch", "--root", "/root", "/root/in.typ", "/root/out.pdf", "--open"}
	if len(argsOpen) != len(expectedOpen) {
		t.Fatalf("expected %d args with open, got %d: %v", len(expectedOpen), len(argsOpen), argsOpen)
	}
	for i := range argsOpen {
		if argsOpen[i] != expectedOpen[i] {
			t.Errorf("arg[%d] = %q, want %q", i, argsOpen[i], expectedOpen[i])
		}
	}

	argsNoOpen := buildWatchArgs("/root", "/root/in.typ", "/root/out.pdf", false)
	expectedNoOpen := []string{"watch", "--root", "/root", "/root/in.typ", "/root/out.pdf"}
	if len(argsNoOpen) != len(expectedNoOpen) {
		t.Fatalf("expected %d args without open, got %d: %v", len(expectedNoOpen), len(argsNoOpen), argsNoOpen)
	}
	for i := range argsNoOpen {
		if argsNoOpen[i] != expectedNoOpen[i] {
			t.Errorf("arg[%d] = %q, want %q", i, argsNoOpen[i], expectedNoOpen[i])
		}
	}
}

func TestTypstEntryToPDF(t *testing.T) {
	validCases := []struct {
		entry    string
		expected string
	}{
		{"report.typ", "report.pdf"},
		{"main.typ", "main.pdf"},
		{"lab-01.typ", "lab-01.pdf"},
		{"subdir/report.typ", "subdir/report.pdf"},
	}

	for _, tc := range validCases {
		got, err := typstEntryToPDF(tc.entry)
		if err != nil {
			t.Fatalf("typstEntryToPDF(%q) returned unexpected error: %v", tc.entry, err)
		}
		if got != tc.expected {
			t.Errorf("typstEntryToPDF(%q) = %q, want %q", tc.entry, got, tc.expected)
		}
	}

	invalidCases := []string{
		"",
		"report.pdf",
		"report.txt",
		"main",
		".typ",
	}

	for _, entry := range invalidCases {
		got, err := typstEntryToPDF(entry)
		if err == nil {
			t.Errorf("typstEntryToPDF(%q) expected error, got %q", entry, got)
		}
	}
}

func TestRootFilesSelection(t *testing.T) {
	pkgManifest := `[project]
config_version = 1

[package]
name = "@testscope/rootpkg"
version = "1.0.0"

[root-files]
files = ["tsconfig.unsareport.json"]

[components]
files = ["lib.typ"]
`
	pkgArchive := testutil.CreateZip(map[string]string{
		"unsareport.toml":          pkgManifest,
		"lib.typ":                  "#let v = 10\n",
		"tsconfig.unsareport.json": `{"compilerOptions":{"baseUrl":"."}}`,
	})

	var srv *httptest.Server
	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/resolve" {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"resolved": []map[string]any{
					{
						"name":        "@testscope/rootpkg",
						"version":     "1.0.0",
						"archive_url": srv.URL + "/dl/pkg.zip",
					},
				},
			})
			return
		}
		if r.URL.Path == "/v1/@testscope/rootpkg/1.0.0/archive" {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"archive_url": srv.URL + "/dl/pkg.zip",
			})
			return
		}
		if r.URL.Path == "/dl/pkg.zip" {
			_, _ = w.Write(pkgArchive)
			return
		}
		w.WriteHeader(404)
	}))
	defer srv.Close()
	t.Setenv(config.EnvRegistryURL, srv.URL)

	t.Run("user approves root file", func(t *testing.T) {
		tmp := t.TempDir()
		cfg := "[project]\nconfig_version = 1\n\n[dependencies]\n"
		if err := os.WriteFile(filepath.Join(tmp, "unsareport.toml"), []byte(cfg), 0o644); err != nil {
			t.Fatal(err)
		}

		err := Add(context.Background(), tmp, AddOptions{
			Package: "@testscope/rootpkg",
			Flags:   []string{"--yes"},
			SelectRootFiles: func(files []string) ([]string, error) {
				return files, nil
			},
		})
		if err != nil {
			t.Fatalf("Add failed: %v", err)
		}

		rootTsPath := filepath.Join(tmp, "tsconfig.unsareport.json")
		if _, err := os.Stat(rootTsPath); err != nil {
			t.Fatalf("expected root tsconfig to exist at %s: %v", rootTsPath, err)
		}

		compTsPath := filepath.Join(tmp, "components", "@testscope", "rootpkg", "tsconfig.unsareport.json")
		if _, err := os.Stat(compTsPath); !os.IsNotExist(err) {
			t.Fatalf("did not expect root file inside components dir: %s", compTsPath)
		}

		compLibPath := filepath.Join(tmp, "components", "@testscope", "rootpkg", "lib.typ")
		if _, err := os.Stat(compLibPath); err != nil {
			t.Fatalf("expected component lib.typ to exist: %v", err)
		}
	})

	t.Run("user declines root file", func(t *testing.T) {
		tmp := t.TempDir()
		cfg := "[project]\nconfig_version = 1\n\n[dependencies]\n"
		if err := os.WriteFile(filepath.Join(tmp, "unsareport.toml"), []byte(cfg), 0o644); err != nil {
			t.Fatal(err)
		}

		err := Add(context.Background(), tmp, AddOptions{
			Package: "@testscope/rootpkg",
			Flags:   []string{"--yes"},
			SelectRootFiles: func(files []string) ([]string, error) {
				return []string{}, nil
			},
		})
		if err != nil {
			t.Fatalf("Add failed: %v", err)
		}

		rootTsPath := filepath.Join(tmp, "tsconfig.unsareport.json")
		if _, err := os.Stat(rootTsPath); !os.IsNotExist(err) {
			t.Fatalf("did not expect root tsconfig when user declined: %s", rootTsPath)
		}

		compLibPath := filepath.Join(tmp, "components", "@testscope", "rootpkg", "lib.typ")
		if _, err := os.Stat(compLibPath); err != nil {
			t.Fatalf("expected component lib.typ to exist: %v", err)
		}
	})
}

func TestRootFilesPrecedenceAncestorShadowsDescendant(t *testing.T) {
	parentManifest := `[project]
config_version = 1

[package]
name = "@testscope/parent"
version = "1.0.0"

[dependencies]
"@testscope/child" = "^1.0.0"

[root-files]
files = ["tsconfig.unsareport.json"]

[components]
files = ["lib.typ"]
`
	childManifest := `[project]
config_version = 1

[package]
name = "@testscope/child"
version = "1.0.0"

[root-files]
files = ["tsconfig.unsareport.json"]

[components]
files = ["lib.typ"]
`
	parentArchive := testutil.CreateZip(map[string]string{
		"unsareport.toml":          parentManifest,
		"lib.typ":                  "#let parent = true\n",
		"tsconfig.unsareport.json": `{"source":"parent"}`,
	})
	childArchive := testutil.CreateZip(map[string]string{
		"unsareport.toml":          childManifest,
		"lib.typ":                  "#let child = true\n",
		"tsconfig.unsareport.json": `{"source":"child"}`,
	})

	var srv *httptest.Server
	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/resolve" {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"resolved": []map[string]any{
					{
						"name":        "@testscope/parent",
						"version":     "1.0.0",
						"archive_url": srv.URL + "/dl/parent.zip",
					},
					{
						"name":        "@testscope/child",
						"version":     "1.0.0",
						"archive_url": srv.URL + "/dl/child.zip",
					},
				},
			})
			return
		}
		if strings.HasSuffix(r.URL.Path, "/archive") {
			if strings.Contains(r.URL.Path, "parent") {
				_ = json.NewEncoder(w).Encode(map[string]any{"archive_url": srv.URL + "/dl/parent.zip"})
				return
			}
			if strings.Contains(r.URL.Path, "child") {
				_ = json.NewEncoder(w).Encode(map[string]any{"archive_url": srv.URL + "/dl/child.zip"})
				return
			}
		}
		if r.URL.Path == "/dl/parent.zip" {
			_, _ = w.Write(parentArchive)
			return
		}
		if r.URL.Path == "/dl/child.zip" {
			_, _ = w.Write(childArchive)
			return
		}
		w.WriteHeader(404)
	}))
	defer srv.Close()
	t.Setenv(config.EnvRegistryURL, srv.URL)

	tmp := t.TempDir()
	cfg := "[project]\nconfig_version = 1\n\n[dependencies]\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.toml"), []byte(cfg), 0o644); err != nil {
		t.Fatal(err)
	}

	err := Add(context.Background(), tmp, AddOptions{
		Package: "@testscope/parent",
		Flags:   []string{"--yes"},
	})
	if err != nil {
		t.Fatalf("Add failed: %v", err)
	}

	rootTsPath := filepath.Join(tmp, "tsconfig.unsareport.json")
	content, err := os.ReadFile(rootTsPath)
	if err != nil {
		t.Fatalf("expected tsconfig.unsareport.json: %v", err)
	}
	if !strings.Contains(string(content), `"source":"parent"`) {
		t.Fatalf("expected topmost package's file to win, got: %s", string(content))
	}
}

func TestRootFilesConflictUnrelatedPackages(t *testing.T) {
	appManifest := `[project]
config_version = 1

[package]
name = "@testscope/app"
version = "1.0.0"

[dependencies]
"@testscope/mod-a" = "^1.0.0"
"@testscope/mod-b" = "^1.0.0"

[components]
files = ["lib.typ"]
`
	modAManifest := `[project]
config_version = 1

[package]
name = "@testscope/mod-a"
version = "1.0.0"

[root-files]
files = ["shared.json"]

[components]
files = ["lib.typ"]
`
	modBManifest := `[project]
config_version = 1

[package]
name = "@testscope/mod-b"
version = "1.0.0"

[root-files]
files = ["shared.json"]

[components]
files = ["lib.typ"]
`
	appArchive := testutil.CreateZip(map[string]string{
		"unsareport.toml": appManifest,
		"lib.typ":         "#let app = true\n",
	})
	modAArchive := testutil.CreateZip(map[string]string{
		"unsareport.toml": modAManifest,
		"lib.typ":         "#let a = true\n",
		"shared.json":     `{"mod":"a"}`,
	})
	modBArchive := testutil.CreateZip(map[string]string{
		"unsareport.toml": modBManifest,
		"lib.typ":         "#let b = true\n",
		"shared.json":     `{"mod":"b"}`,
	})

	var srv *httptest.Server
	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/resolve" {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"resolved": []map[string]any{
					{
						"name":        "@testscope/app",
						"version":     "1.0.0",
						"archive_url": srv.URL + "/dl/app.zip",
					},
					{
						"name":        "@testscope/mod-a",
						"version":     "1.0.0",
						"archive_url": srv.URL + "/dl/mod-a.zip",
					},
					{
						"name":        "@testscope/mod-b",
						"version":     "1.0.0",
						"archive_url": srv.URL + "/dl/mod-b.zip",
					},
				},
			})
			return
		}
		if strings.HasSuffix(r.URL.Path, "/archive") {
			if strings.Contains(r.URL.Path, "app") {
				_ = json.NewEncoder(w).Encode(map[string]any{"archive_url": srv.URL + "/dl/app.zip"})
				return
			}
			if strings.Contains(r.URL.Path, "mod-a") {
				_ = json.NewEncoder(w).Encode(map[string]any{"archive_url": srv.URL + "/dl/mod-a.zip"})
				return
			}
			if strings.Contains(r.URL.Path, "mod-b") {
				_ = json.NewEncoder(w).Encode(map[string]any{"archive_url": srv.URL + "/dl/mod-b.zip"})
				return
			}
		}
		if r.URL.Path == "/dl/app.zip" {
			_, _ = w.Write(appArchive)
			return
		}
		if r.URL.Path == "/dl/mod-a.zip" {
			_, _ = w.Write(modAArchive)
			return
		}
		if r.URL.Path == "/dl/mod-b.zip" {
			_, _ = w.Write(modBArchive)
			return
		}
		w.WriteHeader(404)
	}))
	defer srv.Close()
	t.Setenv(config.EnvRegistryURL, srv.URL)

	t.Run("fails fast on unattended conflict between differing unrelated files", func(t *testing.T) {
		tmp := t.TempDir()
		cfg := "[project]\nconfig_version = 1\n\n[dependencies]\n"
		if err := os.WriteFile(filepath.Join(tmp, "unsareport.toml"), []byte(cfg), 0o644); err != nil {
			t.Fatal(err)
		}

		err := Add(context.Background(), tmp, AddOptions{
			Package: "@testscope/app",
			Flags:   []string{"--yes"},
		})
		if err == nil {
			t.Fatalf("expected conflict error for unrelated packages declaring differing root file")
		}
		if !strings.Contains(err.Error(), "conflict: unrelated packages declare differing shared.json") {
			t.Fatalf("unexpected error message: %v", err)
		}
	})

	t.Run("allows picking at most one candidate via resolver", func(t *testing.T) {
		tmp := t.TempDir()
		cfg := "[project]\nconfig_version = 1\n\n[dependencies]\n"
		if err := os.WriteFile(filepath.Join(tmp, "unsareport.toml"), []byte(cfg), 0o644); err != nil {
			t.Fatal(err)
		}

		sawConflict := false
		err := Add(context.Background(), tmp, AddOptions{
			Package: "@testscope/app",
			Flags:   []string{"--yes"},
			ResolveRootFiles: func(singles []RootFileCandidate, conflicts []RootFileConflict) (RootFileResolution, error) {
				if len(conflicts) != 1 {
					t.Fatalf("expected 1 conflict, got %d", len(conflicts))
				}
				sawConflict = true
				if conflicts[0].Path != "shared.json" {
					t.Fatalf("expected conflict on shared.json, got %s", conflicts[0].Path)
				}
				if len(conflicts[0].Candidates) != 2 {
					t.Fatalf("expected 2 candidates in conflict, got %d", len(conflicts[0].Candidates))
				}
				return RootFileResolution{
					SelectedWinners: map[string]string{
						"shared.json": "@testscope/mod-b",
					},
				}, nil
			},
		})
		if err != nil {
			t.Fatalf("Add with resolver failed: %v", err)
		}
		if !sawConflict {
			t.Fatal("expected conflict resolver to be called")
		}

		content, err := os.ReadFile(filepath.Join(tmp, "shared.json"))
		if err != nil {
			t.Fatalf("expected shared.json to be written: %v", err)
		}
		if !strings.Contains(string(content), `"mod":"b"`) {
			t.Fatalf("expected chosen candidate mod-b, got: %s", string(content))
		}
	})
}

func TestFormatFilePreview(t *testing.T) {
	binaryContent := []byte{0xff, 0xfe, 0x00, 0x01}
	if !strings.Contains(formatFilePreview(binaryContent), "[binary file") {
		t.Fatalf("expected binary file notice, got %s", formatFilePreview(binaryContent))
	}

	shortText := []byte("line1\nline2\n")
	if formatFilePreview(shortText) != "line1\nline2" {
		t.Fatalf("unexpected formatted short text: %q", formatFilePreview(shortText))
	}

	var longText strings.Builder
	for i := 1; i <= 60; i++ {
		fmt.Fprintf(&longText, "line %d\n", i)
	}
	formatted := formatFilePreview([]byte(longText.String()))
	if !strings.Contains(formatted, "... (20 more lines)") {
		t.Fatalf("expected truncation, got:\n%s", formatted)
	}
}

func TestInitSelectiveConflictOverwrite(t *testing.T) {
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, config.ConfigFileName)
	_ = os.WriteFile(cfgPath, []byte("[project]\nconfig_version = 1\n"), 0o644)

	reportDir := filepath.Join(dir, "t1")
	_ = os.MkdirAll(reportDir, 0o755)
	mainTyp := filepath.Join(reportDir, config.DefaultTypstEntry)
	origTypContent := "= Original Document\n"
	_ = os.WriteFile(mainTyp, []byte(origTypContent), 0o644)

	err := Init(context.Background(), dir, InitOptions{
		Template: config.TemplateBlank,
		Report:   "t1",
		ResolveConflicts: func(conflicts []string) ([]string, error) {
			return []string{"t1/main.typ"}, nil
		},
	})
	if err != nil {
		t.Fatalf("Init with ResolveConflicts failed: %v", err)
	}

	typContent, err := os.ReadFile(mainTyp)
	if err != nil {
		t.Fatal(err)
	}
	if string(typContent) != "= Document\n" {
		t.Fatalf("expected main.typ to be overwritten with template, got: %s", string(typContent))
	}

	cfgContent, err := os.ReadFile(cfgPath)
	if err != nil {
		t.Fatal(err)
	}
	if string(cfgContent) != "[project]\nconfig_version = 1\n" {
		t.Fatalf("expected unsareport.toml to be preserved, got: %s", string(cfgContent))
	}
}

