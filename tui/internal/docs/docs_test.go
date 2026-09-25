package docs

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
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
