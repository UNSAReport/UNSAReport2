package registry

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestFindWorkspaceRoot(t *testing.T) {
	ws := t.TempDir()

	compDir := filepath.Join(ws, ComponentsDirName)
	if err := os.MkdirAll(compDir, 0o755); err != nil {
		t.Fatal(err)
	}
	metaPath := filepath.Join(compDir, SyncMetaFileName)
	if err := os.WriteFile(metaPath, []byte("[]"), 0o644); err != nil {
		t.Fatal(err)
	}

	nested := filepath.Join(ws, "sub", "pkg", "dir")
	if err := os.MkdirAll(nested, 0o755); err != nil {
		t.Fatal(err)
	}

	found, err := FindWorkspaceRoot(nested)
	if err != nil {
		t.Fatalf("FindWorkspaceRoot failed: %v", err)
	}
	if found != ws {
		t.Fatalf("FindWorkspaceRoot = %q, want %q", found, ws)
	}
}

func TestResolveTemplateTarget(t *testing.T) {
	ws := t.TempDir()

	compDir := filepath.Join(ws, ComponentsDirName)
	if err := os.MkdirAll(compDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(compDir, SyncMetaFileName), []byte("[]"), 0o644); err != nil {
		t.Fatal(err)
	}

	pkgDir := filepath.Join(ws, "scope", "my-pkg")
	tmplDir := filepath.Join(pkgDir, "template")
	if err := os.MkdirAll(tmplDir, 0o755); err != nil {
		t.Fatal(err)
	}

	tomlContent := `[project]
config_version = 1

[package]
name = "@scope/my-pkg"
version = "0.1.0"
command_prefix = "my_pkg"

[templates]
files = ["template/**/*"]

[commands.test-hook]
description = "test hook"
commands = { any = ["echo hook executed"] }

[hooks.build]
after = ["test-hook"]

[config-schema.custom_var]
type = "string"
required = false
default = "sample-val"
`
	if err := os.WriteFile(filepath.Join(pkgDir, "unsareport.toml"), []byte(tomlContent), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tmplDir, "main.typ"), []byte("#let title = [Test]"), 0o644); err != nil {
		t.Fatal(err)
	}

	templates, err := ListTemplatePackages(ws)
	if err != nil {
		t.Fatalf("ListTemplatePackages failed: %v", err)
	}
	if len(templates) != 1 {
		t.Fatalf("expected 1 template package, got %d", len(templates))
	}
	if templates[0].Name != "@scope/my-pkg" {
		t.Fatalf("unexpected template name: %s", templates[0].Name)
	}

	target, err := ResolveTemplateTarget(ws, "", ws)
	if err != nil {
		t.Fatalf("ResolveTemplateTarget empty target failed: %v", err)
	}
	if target.PkgName != "@scope/my-pkg" {
		t.Fatalf("expected PkgName '@scope/my-pkg', got %q", target.PkgName)
	}
	if target.TypstEntry != "main.typ" {
		t.Fatalf("expected TypstEntry 'main.typ', got %q", target.TypstEntry)
	}

	targetByName, err := ResolveTemplateTarget(ws, "@scope/my-pkg", ws)
	if err != nil {
		t.Fatalf("ResolveTemplateTarget by name failed: %v", err)
	}
	if targetByName.PkgName != "@scope/my-pkg" {
		t.Fatalf("expected PkgName '@scope/my-pkg', got %q", targetByName.PkgName)
	}

	targetByDir, err := ResolveTemplateTarget(ws, "scope/my-pkg", ws)
	if err != nil {
		t.Fatalf("ResolveTemplateTarget by dir failed: %v", err)
	}
	if targetByDir.PkgName != "@scope/my-pkg" {
		t.Fatalf("expected PkgName '@scope/my-pkg', got %q", targetByDir.PkgName)
	}

	targetByTyp, err := ResolveTemplateTarget(ws, filepath.Join("scope", "my-pkg", "template", "main.typ"), ws)
	if err != nil {
		t.Fatalf("ResolveTemplateTarget by typ file failed: %v", err)
	}
	if targetByTyp.EntryPath != filepath.Join(tmplDir, "main.typ") {
		t.Fatalf("expected EntryPath %q, got %q", filepath.Join(tmplDir, "main.typ"), targetByTyp.EntryPath)
	}

	env := buildPackageHookEnv(ws, target)
	foundReportDir := false
	foundTypstEntry := false
	foundConfigVar := false
	for _, e := range env {
		if strings.HasPrefix(e, "UNSAREP_REPORT_DIR=") {
			foundReportDir = true
			if !strings.Contains(e, "scope/my-pkg/template") {
				t.Errorf("unexpected UNSAREP_REPORT_DIR: %s", e)
			}
		}
		if e == "UNSAREP_TYPST_ENTRY=main.typ" {
			foundTypstEntry = true
		}
		if e == "UNSAREP_CONFIG_MY_PKG_CUSTOM_VAR=sample-val" {
			foundConfigVar = true
		}
	}
	if !foundReportDir {
		t.Errorf("UNSAREP_REPORT_DIR missing in hook env: %v", env)
	}
	if !foundTypstEntry {
		t.Errorf("UNSAREP_TYPST_ENTRY missing in hook env: %v", env)
	}
	if !foundConfigVar {
		t.Errorf("UNSAREP_CONFIG_MY_PKG_CUSTOM_VAR missing in hook env: %v", env)
	}
}
