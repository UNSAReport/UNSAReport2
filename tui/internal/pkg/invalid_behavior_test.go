package pkg

import (
	"strings"
	"testing"
)

func mustInvalidParse(t *testing.T, text string) PkgToml {
	t.Helper()
	p, err := Parse(text)
	if err != nil {
		t.Fatalf("unexpected parse error: %v", err)
	}
	return p
}

func TestInvalidDupAlias(t *testing.T) {
	if _, err := Parse(validToml + "\n[commands.zip]\ndescription = \"dup\"\ncommands = { any = [\"x\"] }\n"); err == nil || !strings.Contains(err.Error(), "already been defined") {
		t.Fatalf("expected duplicate-section error, got %v", err)
	}
}

func TestInvalidEmptyGlobs(t *testing.T) {
	p := mustInvalidParse(t, strings.Replace(validToml, `files = ["lib.typ", "parts/*.typ"]`, `files = []`, 1))
	if err := Validate(p); err == nil || !strings.Contains(err.Error(), "at least one glob") {
		t.Fatalf("expected empty-glob error, got %v", err)
	}
}

func TestInvalidVersionPrefix(t *testing.T) {
	p := mustInvalidParse(t, strings.Replace(validToml, `version = "1.2.0"`, `version = "v1.2.0"`, 1))
	if err := Validate(p); err == nil || !strings.Contains(err.Error(), "invalid [package] version") {
		t.Fatalf("expected v-prefix error, got %v", err)
	}
}

func TestInvalidSpacedRange(t *testing.T) {
	for _, rng := range []string{"> =1.0.0", ">=1.0.0,", ">=1.0.0,,<2.0.0"} {
		p := mustInvalidParse(t, strings.Replace(validToml, `">=1.0.0, <2.0.0"`, `"`+rng+`"`, 1))
		if err := Validate(p); err == nil || !strings.Contains(err.Error(), "invalid [dependencies] range") {
			t.Fatalf("range %q: expected range error, got %v", rng, err)
		}
	}
}
