package registry

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/UNSAReport/tui/internal/pkg"
)

func CheckPackageDir(dir string) error {
	raw, err := os.ReadFile(filepath.Join(dir, "pkg.toml"))
	if err != nil {
		return fmt.Errorf("pkg.toml not found in %s: %w", dir, err)
	}
	p, err := pkg.Parse(string(raw))
	if err != nil {
		return err
	}
	if err := pkg.Validate(p); err != nil {
		return err
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}
	var typFiles []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".typ") {
			typFiles = append(typFiles, e.Name())
		}
	}
	for _, f := range typFiles {
		b, err := os.ReadFile(filepath.Join(dir, f))
		if err != nil {
			continue
		}
		for _, line := range strings.Split(string(b), "\n") {
			if strings.Contains(line, "read(") || strings.Contains(line, "image(\"") {
				return fmt.Errorf("%s: templates must use content-passing; move read()/image() calls to the report", f)
			}
		}
	}
	return nil
}
