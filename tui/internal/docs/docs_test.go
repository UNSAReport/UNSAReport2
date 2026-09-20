package docs

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/lock"
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

func TestRunHooksAfterSkippedOnBeforeFailure(t *testing.T) {
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
	// Fail-fast lives with the caller (Check/Build stop on error): the after
	// filter alone would still run post, so callers must not invoke it.
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

func createZip(files map[string]string) []byte {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for name, content := range files {
		w, _ := zw.Create(name)
		_, _ = w.Write([]byte(content))
	}
	_ = zw.Close()
	return buf.Bytes()
}

func setupMockRegistry(t *testing.T) *httptest.Server {
	t.Helper()
	var srv *httptest.Server

	cardoComp := createZip(map[string]string{
		"pkg.toml": "[package]\nname = \"cardo\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\ndepends_on = [\"theme ^1.0.0\"]\n\n[templates]\nfiles = [\"report.typ\"]\n",
		"lib.typ":  "#let note(body) = block()[#body]\n",
	})
	cardoTpl := createZip(map[string]string{
		"report.typ": "#import \"/components/cardo/lib.typ\" as cardo\n#import \"/components/theme/lib.typ\" as theme\n= Report\n",
	})
	themeComp := createZip(map[string]string{
		"pkg.toml": "[package]\nname = \"theme\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\ndepends_on = [\"utils ^1.0.0\"]\n\n[templates]\nfiles = []\n",
		"lib.typ":  "#let theme(x) = x\n",
	})
	utilsComp := createZip(map[string]string{
		"pkg.toml": "[package]\nname = \"utils\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\ndepends_on = []\n\n[templates]\nfiles = []\n",
		"lib.typ":  "#let util(x) = x\n",
	})
	tplpkgComp := createZip(map[string]string{
		"pkg.toml": "[package]\nname = \"tplpkg\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\ndepends_on = []\n\n[templates]\nfiles = [\"template/**/*\"]\n",
		"lib.typ":  "#let note(body) = block()[#body]\n",
	})
	tplpkgTpl := createZip(map[string]string{
		"template/report.typ":      "= Templated Report\n",
		"template/assets/logo.png": "png-bytes",
	})
	siblingComp := createZip(map[string]string{
		"pkg.toml": "[package]\nname = \"siblingpkg\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\ndepends_on = []\n\n[templates]\nfiles = [\"**/*\"]\n",
		"lib.typ":  "#let note(body) = block()[#body]\n",
	})
	siblingTpl := createZip(map[string]string{
		"template/report.typ": "= Report\n",
		"README.md":           "# Readme\n",
	})

	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/resolve" && r.Method == "POST" {
			var body struct {
				Packages map[string]string `json:"packages"`
			}
			_ = json.NewDecoder(r.Body).Decode(&body)
			var resolved []map[string]any
			for pkgName := range body.Packages {
				resolved = append(resolved, map[string]any{
					"name":        pkgName,
					"version":     "1.0.0",
					"archive_url": srv.URL + "/dl/" + pkgName + "/components.zip",
					"files":       []string{"lib.typ"},
				})
			}
			_ = json.NewEncoder(w).Encode(map[string]any{"resolved": resolved})
			return
		}

		if strings.HasSuffix(r.URL.Path, "/archive") {
			sec := r.URL.Query().Get("section")
			parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
			if len(parts) >= 4 {
				pkgName := parts[1]
				_ = json.NewEncoder(w).Encode(map[string]any{
					"archive_url": fmt.Sprintf("%s/dl/%s/%s.zip", srv.URL, pkgName, sec),
				})
				return
			}
		}

		if strings.HasPrefix(r.URL.Path, "/dl/") {
			parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/dl/"), "/")
			if len(parts) == 2 {
				pkgName := parts[0]
				file := parts[1]
				if pkgName == "cardo" && file == "templates.zip" {
					_, _ = w.Write(cardoTpl)
					return
				}
				if pkgName == "cardo" && file == "components.zip" {
					_, _ = w.Write(cardoComp)
					return
				}
				if pkgName == "theme" && file == "components.zip" {
					_, _ = w.Write(themeComp)
					return
				}
				if pkgName == "utils" && file == "components.zip" {
					_, _ = w.Write(utilsComp)
					return
				}
				if pkgName == "tplpkg" && file == "templates.zip" {
					_, _ = w.Write(tplpkgTpl)
					return
				}
				if pkgName == "tplpkg" && file == "components.zip" {
					_, _ = w.Write(tplpkgComp)
					return
				}
				if pkgName == "siblingpkg" && file == "templates.zip" {
					_, _ = w.Write(siblingTpl)
					return
				}
				if pkgName == "siblingpkg" && file == "components.zip" {
					_, _ = w.Write(siblingComp)
					return
				}
			}
		}

		w.WriteHeader(404)
	}))

	t.Setenv(config.EnvRegistryURL, srv.URL)
	return srv
}

func TestInitNonEmptyDirNoConflicts(t *testing.T) {
	srv := setupMockRegistry(t)
	defer srv.Close()

	tmp := t.TempDir()
	// Pre-populate directory with non-conflicting files
	if err := os.WriteFile(filepath.Join(tmp, "README.md"), []byte("# My Doc\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	err := Init(context.Background(), tmp, InitOptions{Template: "cardo", Report: "t1"})
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

	// Verify recursive dependency installation
	if _, err := os.Stat(filepath.Join(tmp, "components", "cardo", "lib.typ")); err != nil {
		t.Fatalf("expected cardo component to exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, "components", "theme", "lib.typ")); err != nil {
		t.Fatalf("expected theme component to exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, "components", "utils", "lib.typ")); err != nil {
		t.Fatalf("expected utils component to exist: %v", err)
	}

	l, err := lock.Load(tmp)
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := l.Find("cardo"); !ok {
		t.Fatal("cardo not in lock")
	}
	if _, ok := l.Find("theme"); !ok {
		t.Fatal("theme not in lock")
	}
	if _, ok := l.Find("utils"); !ok {
		t.Fatal("utils not in lock")
	}
}

func TestInitNonEmptyDirWithConflicts(t *testing.T) {
	srv := setupMockRegistry(t)
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
			Template: "cardo",
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
			Template: "cardo",
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
	srv := setupMockRegistry(t)
	defer srv.Close()

	tmp := t.TempDir()
	cfg := "[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n\n[dependencies]\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.toml"), []byte(cfg), 0o644); err != nil {
		t.Fatal(err)
	}

	err := Add(context.Background(), tmp, AddOptions{
		Package: "cardo",
		Flags:   []string{"--yes"},
	})
	if err != nil {
		t.Fatalf("expected Add to succeed, got %v", err)
	}

	if _, err := os.Stat(filepath.Join(tmp, "components", "cardo", "lib.typ")); err != nil {
		t.Fatalf("expected cardo component to exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, "components", "theme", "lib.typ")); err != nil {
		t.Fatalf("expected theme component to exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, "components", "utils", "lib.typ")); err != nil {
		t.Fatalf("expected utils component to exist: %v", err)
	}

	l, err := lock.Load(tmp)
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := l.Find("cardo"); !ok {
		t.Fatal("cardo not in lock")
	}
	if _, ok := l.Find("theme"); !ok {
		t.Fatal("theme not in lock")
	}
	if _, ok := l.Find("utils"); !ok {
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
	srv := setupMockRegistry(t)
	defer srv.Close()

	tmp := t.TempDir()
	reportDir := filepath.Join("destination", "dir")
	err := Init(context.Background(), tmp, InitOptions{
		Template: "tplpkg",
		Report:   reportDir,
	})
	if err != nil {
		t.Fatalf("expected Init to succeed, got %v", err)
	}

	// Verify report.typ is at destination/dir/report.typ
	reportTypPath := filepath.Join(tmp, reportDir, "report.typ")
	if _, err := os.Stat(reportTypPath); err != nil {
		t.Fatalf("expected report.typ at %s: %v", reportTypPath, err)
	}

	// Verify asset is at destination/dir/assets/logo.png
	assetPath := filepath.Join(tmp, reportDir, "assets", "logo.png")
	if _, err := os.Stat(assetPath); err != nil {
		t.Fatalf("expected logo.png at %s: %v", assetPath, err)
	}

	// Verify destination/dir/template does NOT exist
	nestedTemplateDir := filepath.Join(tmp, reportDir, "template")
	if _, err := os.Stat(nestedTemplateDir); !os.IsNotExist(err) {
		t.Fatalf("expected %s to NOT exist, but it does", nestedTemplateDir)
	}
}

func TestInitTemplateKeepsSiblings(t *testing.T) {
	srv := setupMockRegistry(t)
	defer srv.Close()

	tmp := t.TempDir()
	reportDir := filepath.Join("destination", "dir")
	err := Init(context.Background(), tmp, InitOptions{
		Template: "siblingpkg",
		Report:   reportDir,
	})
	if err != nil {
		t.Fatalf("expected Init to succeed, got %v", err)
	}

	// Siblings exist (template/ and README.md), so nothing should be stripped
	if _, err := os.Stat(filepath.Join(tmp, reportDir, "template", "report.typ")); err != nil {
		t.Fatalf("expected template/report.typ to exist because sibling README.md exists: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tmp, reportDir, "README.md")); err != nil {
		t.Fatalf("expected README.md to exist: %v", err)
	}
}

