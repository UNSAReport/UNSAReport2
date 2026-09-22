package naming

import (
	"testing"
)

func TestInvalidEmptyTemplate(t *testing.T) {
	got, err := ApplyTemplate("", map[string]string{}, "Informe")
	if err != nil || got != "" {
		t.Fatalf("got %q err %v", got, err)
	}
	if got := SanitizeFilename(""); got != "_" {
		t.Fatalf("sanitize empty %q", got)
	}
}

func TestInvalidUnclosedBrace(t *testing.T) {
	got, err := ApplyTemplate("{unclosed", map[string]string{}, "Informe")
	if err != nil {
		t.Fatalf("literal unclosed brace must pass through, got %v", err)
	}
	if got != "{unclosed" {
		t.Fatalf("got %q", got)
	}
}

func TestInvalidOutputTypeCollision(t *testing.T) {
	got, err := ApplyTemplate("{output_type}", map[string]string{"output_type": "VAR"}, "PARAM")
	if err != nil || got != "PARAM" {
		t.Fatalf("output_type must win over vars, got %q %v", got, err)
	}
	if got, err := ApplyTemplate("{output_type}_{lab_number}", map[string]string{"output_type": "VAR", "lab_number": "01"}, "Informe"); err != nil || got != "Informe_01" {
		t.Fatalf("got %q err %v", got, err)
	}
}
