package project

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/BurntSushi/toml"
)

func TestFindRootMissing(t *testing.T) {
	tmp := t.TempDir()
	if _, err := FindRoot(filepath.Join(tmp, "sub", "dir")); err == nil {
		t.Fatal("expected error for missing unsareport.toml")
	}
}

const minimalToml = "[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n"

func TestLoadStrict(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "unsareport.toml")
	if err := os.WriteFile(path, []byte(minimalToml), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Project.TypstEntry != "report.typ" {
		t.Fatalf("entry %q", cfg.Project.TypstEntry)
	}
	bad := filepath.Join(tmp, "bad.toml")
	if err := os.WriteFile(bad, []byte("[project]\nbogus = 1\ntypst_entry = \"report.typ\"\nconfig_version = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(bad); err == nil {
		t.Fatal("expected unknown-field error")
	}
	named := filepath.Join(tmp, "named.toml")
	if err := os.WriteFile(named, []byte("[project]\nname = \"x\"\ntypst_entry = \"report.typ\"\nconfig_version = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(named); err == nil {
		t.Fatal("expected rejection of dropped [project] name")
	}
	wrong := filepath.Join(tmp, "wrong.toml")
	if err := os.WriteFile(wrong, []byte("[project]\ntypst_entry = \"report.typ\"\nconfig_version = 99\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(wrong); err == nil {
		t.Fatal("expected version error")
	}
}

func TestConfigVersion(t *testing.T) {
	legacy := filepath.Join(t.TempDir(), "unsareport.toml")
	if err := os.WriteFile(legacy, []byte("[project]\ntypst_entry = \"report.typ\"\nroot_marker_version = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(legacy); err == nil {
		t.Fatal("expected error on unknown field root_marker_version")
	}

	missing := filepath.Join(t.TempDir(), "unsareport.toml")
	if err := os.WriteFile(missing, []byte("[project]\ntypst_entry = \"report.typ\"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(missing); err == nil {
		t.Fatal("expected missing-version error")
	}

	wrong := filepath.Join(t.TempDir(), "unsareport.toml")
	if err := os.WriteFile(wrong, []byte("[project]\ntypst_entry = \"report.typ\"\nconfig_version = 99\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(wrong); err == nil {
		t.Fatal("expected unsupported config_version error")
	}

	valid := filepath.Join(t.TempDir(), "unsareport.toml")
	if err := os.WriteFile(valid, []byte("[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(valid)
	if err != nil {
		t.Fatalf("expected valid config_version to load: %v", err)
	}
	if cfg.Project.ConfigVersion != 1 {
		t.Fatalf("got config_version %d, want 1", cfg.Project.ConfigVersion)
	}
}

func TestLoadPackageDecl(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "unsareport.toml")
	body := minimalToml + "\n[package]\nname = \"cardo\"\nversion = \"1.2.0\"\ndescription = \"cards\"\n\n[dependencies]\ntheme = \">=1.0.0, <2.0.0\"\n"
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Package == nil || cfg.Package.Name != "cardo" {
		t.Fatalf("package %+v", cfg.Package)
	}
	if cfg.Dependencies["theme"] != ">=1.0.0, <2.0.0" {
		t.Fatalf("deps %+v", cfg.Dependencies)
	}
	bad := filepath.Join(tmp, "bad.toml")
	if err := os.WriteFile(bad, []byte(minimalToml+"\n[dependencies]\ntheme = \"bogus\"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(bad); err == nil {
		t.Fatal("expected bad-range error")
	}
}
func TestLoadScopedPackageDecl(t *testing.T) {
	for _, name := range []string{"@xxx/yyy", "my.pkg", "my_pkg"} {
		path := filepath.Join(t.TempDir(), "unsareport.toml")
		body := minimalToml + "\n[package]\nname = \"" + name + "\"\nversion = \"1.2.0\"\n"
		if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
		cfg, err := Load(path)
		if err != nil {
			t.Fatalf("%s: expected accept: %v", name, err)
		}
		if cfg.Package == nil || cfg.Package.Name != name {
			t.Fatalf("%s: package %+v", name, cfg.Package)
		}
	}
	for _, name := range []string{"@xxx", "a/b/c", "MyPkg", ".foo", "ab"} {
		path := filepath.Join(t.TempDir(), "unsareport.toml")
		body := minimalToml + "\n[package]\nname = \"" + name + "\"\nversion = \"1.2.0\"\n"
		if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
		if _, err := Load(path); err == nil {
			t.Fatalf("%s: expected rejection", name)
		}
	}
}

func TestLoadScopedDependencyKey(t *testing.T) {
	path := filepath.Join(t.TempDir(), "unsareport.toml")
	body := minimalToml + "\n[dependencies]\n\"@xxx/yyy\" = \"^1.0.0\"\n"
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("expected quoted scoped dep accept: %v", err)
	}
	if cfg.Dependencies["@xxx/yyy"] != "^1.0.0" {
		t.Fatalf("deps %+v", cfg.Dependencies)
	}
	bad := filepath.Join(t.TempDir(), "unsareport.toml")
	if err := os.WriteFile(bad, []byte(minimalToml+"\n[dependencies]\n\"MyPkg\" = \"^1.0.0\"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(bad); err == nil {
		t.Fatal("expected bad dep-name rejection")
	}
}

func TestFragments(t *testing.T) {
	tmp := t.TempDir()
	cfgPath := filepath.Join(tmp, "unsareport.toml")
	if err := os.WriteFile(cfgPath, []byte(minimalToml), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmp, "unsareport.d", "scripts"), 0o755); err != nil {
		t.Fatal(err)
	}
	frag := "alias = \"cardo:zip\"\ndescription = \"zip\"\norigin = \"cardo\"\n\n[commands]\nany = \"rm -f s.zip\"\nlinux = \"bash zip.sh\"\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "scripts", "cardo-zip.toml"), []byte(frag), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmp, "unsareport.d", "hooks"), 0o755); err != nil {
		t.Fatal(err)
	}
	hook := "standard = \"build\"\nbefore = [\"cardo:zip\"]\nafter = [\"os:linux cardo:zip\"]\norigin = \"cardo\"\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "hooks", "build-cardo.toml"), []byte(hook), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(cfgPath)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Scripts["cardo:zip"].Commands["any"] != "rm -f s.zip" {
		t.Fatalf("scripts %+v", cfg.Scripts)
	}
	if cfg.ScriptSource("cardo:zip") != "unsareport.d/scripts/cardo-zip.toml" {
		t.Fatalf("provenance %q", cfg.ScriptSource("cardo:zip"))
	}
	got := cfg.Hooks["build"]
	if len(got.Before) != 1 || got.Before[0] != "cardo:zip" {
		t.Fatalf("hooks %+v", cfg.Hooks)
	}
	if len(got.After) != 1 || got.After[0] != "os:linux cardo:zip" {
		t.Fatalf("hooks %+v", cfg.Hooks)
	}
	dup := "alias = \"cardo:zip\"\n\n[commands]\nany = \"x\"\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "scripts", "other.toml"), []byte(dup), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(cfgPath); err == nil {
		t.Fatal("expected duplicate-alias error")
	}
}
func TestHooksTimingRoundTrip(t *testing.T) {
	path := filepath.Join(t.TempDir(), "unsareport.toml")
	body := minimalToml + "\n[hooks.build]\nbefore = [\"a:pre\", \"os:linux a:other\"]\nafter = [\"a:post\"]\n"
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	got := cfg.Hooks["build"]
	if len(got.Before) != 2 || got.Before[0] != "a:pre" || got.Before[1] != "os:linux a:other" {
		t.Fatalf("before %+v", got)
	}
	if len(got.After) != 1 || got.After[0] != "a:post" {
		t.Fatalf("after %+v", got)
	}
	var buf strings.Builder
	if err := toml.NewEncoder(&buf).Encode(cfg); err != nil {
		t.Fatal(err)
	}
	out := buf.String()
	if !strings.Contains(out, "before = ") || !strings.Contains(out, "after = ") {
		t.Fatalf("timing lists must survive encode:\n%s", out)
	}
}

// TestHooksNoFalseUndecoded answers the v1.4.0 report: table-form bindings
// used to false-positive md.Undecoded() because HookBinding.UnmarshalTOML
// short-circuited unify(). HookTiming has no custom codec, so plain
// Undecoded() is exact: valid timing keys decode silently, unknown keys
// still fail. No BurntSushi upgrade needed for this.
func TestHooksNoFalseUndecoded(t *testing.T) {
	path := filepath.Join(t.TempDir(), "unsareport.toml")
	body := minimalToml + "\n[hooks.build]\nbefore = [\"a:b\"]\nafter = [\"c:d\"]\n"
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(path); err != nil {
		t.Fatalf("valid timing must not trip Undecoded: %v", err)
	}
	bad := filepath.Join(t.TempDir(), "unsareport.toml")
	if err := os.WriteFile(bad, []byte(minimalToml+"\n[hooks.build]\nbefore = [\"a:b\"]\nwhen = [\"x\"]\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(bad); err == nil {
		t.Fatal("expected unknown-field error under [hooks.build]")
	}
}

func TestHooksTimingRejects(t *testing.T) {
	cases := []string{
		"\n[hooks.build]\nbefore = [\"a:b\", \"a:b\"]\n",
		"\n[hooks.build]\nafter = [\"a:b\", \"a:b\"]\n",
		"\n[hooks]\nbuild = [\"a:b\"]\n",
	}
	for _, extra := range cases {
		path := filepath.Join(t.TempDir(), "unsareport.toml")
		if err := os.WriteFile(path, []byte(minimalToml+extra), 0o644); err != nil {
			t.Fatal(err)
		}
		if _, err := Load(path); err == nil {
			t.Fatalf("expected rejection of %q", extra)
		}
	}
}

func TestRootOnlyStripsFragments(t *testing.T) {
	tmp := t.TempDir()
	root := minimalToml + "\n[scripts.\"local:one\"]\ndescription = \"local\"\n[scripts.\"local:one\".commands]\nany = \"echo local\"\n\n[hooks.build]\nbefore = [\"local:one\"]\n"
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
	buildHook := "standard = \"build\"\nbefore = [\"cardo:zip\"]\norigin = \"cardo\"\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "hooks", "build-cardo.toml"), []byte(buildHook), 0o644); err != nil {
		t.Fatal(err)
	}
	checkHook := "standard = \"check\"\nbefore = [\"cardo:zip\"]\norigin = \"cardo\"\n"
	if err := os.WriteFile(filepath.Join(tmp, "unsareport.d", "hooks", "check-cardo.toml"), []byte(checkHook), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(filepath.Join(tmp, "unsareport.toml"))
	if err != nil {
		t.Fatal(err)
	}
	stripped := cfg.RootOnly()
	if len(stripped.Scripts) != 1 || stripped.Scripts["local:one"].Description != "local" {
		t.Fatalf("scripts %+v", stripped.Scripts)
	}
	got := stripped.Hooks["build"]
	if len(got.Before) != 1 || got.Before[0] != "local:one" || len(got.After) != 0 {
		t.Fatalf("build %+v", got)
	}
	if _, ok := stripped.Hooks["check"]; ok {
		t.Fatalf("fragment-only standard survived: %+v", stripped.Hooks)
	}
	if _, ok := cfg.Scripts["cardo:zip"]; !ok {
		t.Fatal("RootOnly mutated the merged config")
	}
}
