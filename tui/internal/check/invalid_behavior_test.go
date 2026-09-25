package check

import (
	"path/filepath"
	"strings"
	"testing"
)

func TestInvalidRemoteAndLegacyImport(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "unsareport.toml"), cfgText)
	write(t, filepath.Join(root, "l1", "report.typ"), "#import \"https://example.com/lib.typ\"\nHello\n")
	if findings := Run(root); len(findings) != 0 {
		t.Fatalf("remote import must not crash checker, got %v", findings)
	}
	write(t, filepath.Join(root, "l1", "report.typ"), "#import \"/lib.typ\"\nHello\n")
	findings := Run(root)
	if len(findings) == 0 || !strings.Contains(findings[0].Message, "legacy /lib.typ") {
		t.Fatalf("expected legacy-import finding, got %v", findings)
	}
}

func TestInvalidMissingAssets(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "unsareport.toml"), cfgText)
	write(t, filepath.Join(root, "l1", "report.typ"), "Hi\n")
	write(t, filepath.Join(root, "unsareport.lock"), "[[pkg]]\nname = \"@scope/ghost\"\nversion = \"1.0.0\"\n")
	findings := Run(root)
	if len(findings) == 0 || !strings.Contains(findings[0].Message, "missing on disk") {
		t.Fatalf("expected missing-asset finding, got %v", findings)
	}
}

func TestInvalidEmptyProject(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "unsareport.toml"), cfgText)
	if findings := Run(root); len(findings) != 0 {
		t.Fatalf("report-less project must pass, got %v", findings)
	}
	broken := t.TempDir()
	write(t, filepath.Join(broken, "unsareport.toml"), "[project]\ntypst_entry = \"report.typ\"\nconfig_version = 1\n\n[dependencies]\ntheme = \"bogus\"\n")
	write(t, filepath.Join(broken, "l1", "report.typ"), "Hi\n")
	if findings := Run(broken); len(findings) == 0 {
		t.Fatal("expected invalid-dependency finding in broken project")
	}
}
