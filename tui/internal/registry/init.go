package registry

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/Masterminds/semver/v3"
	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/pkg"
)

var initNameRe = regexp.MustCompile(`^(@[a-z0-9][a-z0-9._~-]*/)?[a-z0-9][a-z0-9._~-]*$`)
var initPrefixRe = regexp.MustCompile(`^[a-z0-9][a-z0-9._~-]*$`)

type InitOptions struct {
	Dir           string
	Name          string
	Description   string
	Version       string
	CommandPrefix string
}

func InitPackage(opt InitOptions) error {
	name := strings.TrimSpace(opt.Name)
	if len(name) < 3 || len(name) > 64 || !initNameRe.MatchString(name) {
		return fmt.Errorf("invalid package name %q (want [a-z0-9._~-], optionally \"@scope/name\", 3-64 chars)", opt.Name)
	}
	version := strings.TrimSpace(opt.Version)
	if version == "" {
		version = "0.1.0"
	}
	if _, err := semver.StrictNewVersion(version); err != nil {
		return fmt.Errorf("invalid version %q: %w", opt.Version, err)
	}
	prefix := strings.TrimSpace(opt.CommandPrefix)
	if prefix == "" {
		prefix = name[strings.LastIndex(name, "/")+1:]
	}
	if !initPrefixRe.MatchString(prefix) {
		return fmt.Errorf("invalid command_prefix %q (want [a-z0-9._~-])", opt.CommandPrefix)
	}
	dir := strings.TrimSpace(opt.Dir)
	if dir == "" {
		cwd, err := os.Getwd()
		if err != nil {
			return fmt.Errorf("resolve cwd: %w", err)
		}
		dir = filepath.Join(cwd, name)
	}
	if st, err := os.Stat(dir); err == nil {
		if !st.IsDir() {
			return fmt.Errorf("target %s exists and is not a directory", dir)
		}
		entries, err := os.ReadDir(dir)
		if err != nil {
			return err
		}
		if len(entries) > 0 {
			return fmt.Errorf("target %s is not empty", dir)
		}
	}
	doc := pkg.PkgToml{
		Project: pkg.ProjectDef{
			ConfigVersion: config.ConfigVersion,
		},
		Package: pkg.PackageDef{
			Name:          name,
			Version:       version,
			Description:   strings.TrimSpace(opt.Description),
			CommandPrefix: prefix,
		},
		Components:   pkg.ComponentsDef{Files: []string{"lib.typ"}},
		Dependencies: map[string]string{},
		Templates:    pkg.TemplatesDef{Files: []string{"report.typ"}},
	}
	if err := pkg.Validate(doc); err != nil {
		return err
	}
	if err := os.MkdirAll(dir, config.PermDirPublic); err != nil {
		return err
	}
	text, err := pkg.Encode(doc)
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(dir, config.ConfigFileName), []byte(text), config.PermFilePublic); err != nil {
		return err
	}
	lib := fmt.Sprintf("// Package %s: shared components live here.\n#let note(body) = block()[#body]\n", name)
	if err := os.WriteFile(filepath.Join(dir, "lib.typ"), []byte(lib), config.PermFilePublic); err != nil {
		return err
	}
	tpl := fmt.Sprintf("// Starter template for %s. Consumed once by `docs init`; edit freely.\n#import \"/components/%s/lib.typ\" as lib\n= Report\n#lib.note[Hello]\n", name, name)
	if err := os.WriteFile(filepath.Join(dir, "report.typ"), []byte(tpl), config.PermFilePublic); err != nil {
		return err
	}
	return nil
}
