package pkg

import (
	"strings"
	"testing"
)

const validToml = `
[package]
name = "cardo"
version = "1.2.0"
description = "cards"
displayName = "Cardo"
tags = ["Layout"]
command_prefix = "cardo"

[components]
files = ["lib.typ", "parts/*.typ"]
depends_on = ["theme >=1.0.0, <2.0.0"]

[templates]
files = []

[commands.zip]
description = "zip it"
commands = { any = ["rm -f s.zip"], linux = ["bash zip.sh"] }
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
	if len(p.Commands["zip"].Commands["any"]) != 1 || len(p.Commands["zip"].Commands["linux"]) != 1 {
		t.Fatalf("commands %+v", p.Commands["zip"])
	}
}

func TestValidateScopedNames(t *testing.T) {
	accept := []string{"cardo", "@xxx/yyy", "my.pkg", "my_pkg", "a~b"}
	for _, name := range accept {
		p, err := Parse(strings.Replace(validToml, `name = "cardo"`, `name = "`+name+`"`, 1))
		if err != nil {
			t.Fatalf("%s: parse: %v", name, err)
		}
		if err := Validate(p); err != nil {
			t.Fatalf("%s: expected accept: %v", name, err)
		}
	}
	reject := []string{"@xxx", "xxx/", "@/y", "a/b/c", "MyPkg", ".foo", "-foo", "_foo", "foo bar", "foo:bar", "foo%20x", "ab"}
	for _, name := range reject {
		p, err := Parse(strings.Replace(validToml, `name = "cardo"`, `name = "`+name+`"`, 1))
		if err != nil {
			continue
		}
		if err := Validate(p); err == nil {
			t.Fatalf("%s: expected rejection", name)
		}
	}
}

func TestValidateScopedDependsOn(t *testing.T) {
	p, err := Parse(strings.Replace(validToml, "theme >=1.0.0, <2.0.0", "@xxx/theme ^1.0.0", 1))
	if err != nil {
		t.Fatal(err)
	}
	if err := Validate(p); err != nil {
		t.Fatalf("expected scoped depends_on accept: %v", err)
	}
	p, err = Parse(strings.Replace(validToml, "theme >=1.0.0, <2.0.0", "Bad_Name ^1.0.0", 1))
	if err != nil {
		t.Fatal(err)
	}
	if err := Validate(p); err == nil {
		t.Fatal("expected bad depends_on name rejection")
	}
}

func TestValidateRejects(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(string) string
	}{
		{"bad name", func(s string) string { return strings.Replace(s, `name = "cardo"`, `name = "Bad Name!"`, 1) }},
		{"bad version", func(s string) string { return strings.Replace(s, `version = "1.2.0"`, `version = "1.2"`, 1) }},
		{"abs glob", func(s string) string { return strings.Replace(s, `"lib.typ"`, `"/lib.typ"`, 1) }},
		{"bad range", func(s string) string { return strings.Replace(s, "theme >=1.0.0, <2.0.0", "theme not-a-range", 1) }},
		{"entrypoint dropped", func(s string) string { return s + "\n[package]\nentrypoint = \"lib.typ\"\n" }},
		{"default_select dropped", func(s string) string {
			return strings.Replace(s, `commands = { any`, `default_select = true`+"\ncommands = { any", 1)
		}},
		{"bad os key", func(s string) string {
			return strings.Replace(s, `linux = ["bash zip.sh"]`, `plan9 = ["bash zip.sh"]`, 1)
		}},
		{"empty commands", func(s string) string {
			return strings.Replace(s, `commands = { any = ["rm -f s.zip"], linux = ["bash zip.sh"] }`, `commands = {}`, 1)
		}},
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
