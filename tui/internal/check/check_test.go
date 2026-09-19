package check

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func write(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

const cfgText = "[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n"

func TestCleanProjectPasses(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "unsareport.toml"), cfgText)
	write(t, filepath.Join(root, "l1", "report.typ"), "#import \"/components/cardo/lib.typ\"\nHello\n")
	if findings := Run(root); len(findings) != 0 {
		t.Fatalf("findings: %v", findings)
	}
}

func TestRelativeImportFlagged(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "unsareport.toml"), cfgText)
	write(t, filepath.Join(root, "l1", "report.typ"), "#import \"../components/theme/lib.typ\"\n")
	findings := Run(root)
	if len(findings) == 0 {
		t.Fatal("expected relative-import finding")
	}
	if !strings.Contains(findings[0].Error(), "l1") {
		t.Fatalf("finding should name file: %v", findings[0])
	}
}

func TestParamReadFlagged(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "unsareport.toml"), cfgText)
	write(t, filepath.Join(root, "l1", "report.typ"), "Hi\n")
	write(t, filepath.Join(root, "components", "cardo", "lib.typ"), "#let code-render(f) = read(f)\n")
	findings := Run(root)
	found := false
	for _, f := range findings {
		if strings.Contains(f.Message, "parameter") {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected param-read finding, got %v", findings)
	}
}

func TestLiteralReadAllowed(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "unsareport.toml"), cfgText)
	write(t, filepath.Join(root, "l1", "report.typ"), "Hi\n")
	write(t, filepath.Join(root, "components", "theme", "lib.typ"), "#let icon() = read(\"icon.svg\")\n")
	for _, f := range Run(root) {
		if strings.Contains(f.Message, "parameter") {
			t.Fatalf("literal read must be allowed: %v", f)
		}
	}
}

func TestMissingRootFails(t *testing.T) {
	findings := Run(filepath.Join(t.TempDir(), "sub"))
	if len(findings) == 0 {
		t.Fatal("expected no-root finding")
	}
}

func TestOsMapScripts(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "unsareport.toml"), cfgText+"\n[scripts.\"zip:make\"]\ncommands = { any = \"rm -f s.zip\", linux = \"bash zip.sh\" }\ndescription = \"zip\"\n")
	write(t, filepath.Join(root, "l1", "report.typ"), "Hi\n")
	if findings := Run(root); len(findings) != 0 {
		t.Fatalf("findings: %v", findings)
	}
	bad := t.TempDir()
	write(t, filepath.Join(bad, "unsareport.toml"), cfgText+"\n[scripts.\"zip:make\"]\ncommands = { plan9 = \"x\" }\n")
	write(t, filepath.Join(bad, "l1", "report.typ"), "Hi\n")
	if findings := Run(bad); len(findings) == 0 {
		t.Fatal("expected unknown-os-key finding")
	}
}

func TestPackageDeclValidated(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "unsareport.toml"), cfgText+"\n[dependencies]\ntheme = \"bogus\"\n")
	write(t, filepath.Join(root, "l1", "report.typ"), "Hi\n")
	if findings := Run(root); len(findings) == 0 {
		t.Fatal("expected bad-range finding")
	}
}

func TestHooksTimingChecked(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "unsareport.toml"), cfgText+
		"\n[scripts.\"a:run\"]\ncommands = { any = \"echo hi\" }\n"+
		"\n[hooks.build]\nbefore = [\"a:run\"]\nafter = [\"os:linux a:run\", \"a:missing\"]\n")
	write(t, filepath.Join(root, "l1", "report.typ"), "Hi\n")
	findings := Run(root)
	if len(findings) != 1 || !strings.Contains(findings[0].Message, `unknown alias "a:missing"`) {
		t.Fatalf("findings: %v", findings)
	}
	dup := t.TempDir()
	write(t, filepath.Join(dup, "unsareport.toml"), cfgText+
		"\n[scripts.\"a:run\"]\ncommands = { any = \"echo hi\" }\n"+
		"\n[hooks.build]\nbefore = [\"a:run\", \"a:run\"]\n")
	write(t, filepath.Join(dup, "l1", "report.typ"), "Hi\n")
	if findings := Run(dup); len(findings) == 0 {
		t.Fatal("expected duplicate-alias finding")
	}
	badPrefix := t.TempDir()
	write(t, filepath.Join(badPrefix, "unsareport.toml"), cfgText+
		"\n[scripts.\"a:run\"]\ncommands = { any = \"echo hi\" }\n"+
		"\n[hooks.build]\nbefore = [\"[linux:] a:run\"]\n")
	write(t, filepath.Join(badPrefix, "l1", "report.typ"), "Hi\n")
	if findings := Run(badPrefix); len(findings) == 0 {
		t.Fatal("expected retired-prefix finding")
	}
}
