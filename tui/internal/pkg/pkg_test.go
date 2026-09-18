package pkg

import (
	"strings"
	"testing"
)

const validToml = `
[package]
name = "cardo"
version = "1.2.0"
entrypoint = "lib.typ"
description = "cards"
displayName = "Cardo"
tags = ["Layout"]
command_prefix = "cardo"

[components]
files = ["lib.typ", "parts/*.typ"]
depends_on = ["theme >=1.0.0, <2.0.0"]

[templates]
files = []
`

func TestParseValid(t *testing.T) {
	p, err := Parse(validToml)
	if err != nil {
		t.Fatal(err)
	}
	if err := Validate(p); err != nil {
		t.Fatal(err)
	}
	if p.Package.Name != "cardo" || len(p.Components.Files) != 2 {
		t.Fatalf("parsed %+v", p.Package)
	}
}

func TestValidateRejects(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(string) string
	}{
		{"bad name", func(s string) string { return strings.Replace(s, `name = "cardo"`, `name = "Bad Name!"`, 1) }},
		{"bad version", func(s string) string { return strings.Replace(s, `version = "1.2.0"`, `version = "1.2"`, 1) }},
		{"abs entry", func(s string) string {
			return strings.Replace(s, `entrypoint = "lib.typ"`, `entrypoint = "/lib.typ"`, 1)
		}},
		{"abs glob", func(s string) string { return strings.Replace(s, `"lib.typ"`, `"/lib.typ"`, 1) }},
		{"bad range", func(s string) string { return strings.Replace(s, "theme >=1.0.0, <2.0.0", "theme not-a-range", 1) }},
	}
	for _, c := range cases {
		p, err := Parse(c.mutate(validToml))
		if err != nil {
			continue
		}
		if err := Validate(p); err == nil {
			t.Fatalf("%s: expected validation error", c.name)
		}
	}
}

func TestRejectsInitHook(t *testing.T) {
	p, err := Parse(validToml + "\n[hooks-suggest]\ninit = [\"foo\"]\n")
	if err != nil {
		t.Fatal(err)
	}
	if err := Validate(p); err == nil {
		t.Fatal("expected init hook rejection")
	}
}

func TestRejectsUnknownField(t *testing.T) {
	if _, err := Parse(validToml + "\n[package]\nbogus = 1\n"); err == nil {
		t.Fatal("expected unknown-field error")
	}
}
