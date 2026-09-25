package registry

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/UNSAReport/tui/internal/config"
	"github.com/UNSAReport/tui/internal/pkg"
)

const (
	ErrTemplateAssetLiteralOnly  = "%s:%d: templates must not call %s(...); only string literals referencing bundled package assets are allowed"
	ErrTemplateAssetRelativeOnly = "%s:%d: templates must not call %s(%q); only relative paths to bundled package assets are allowed"
	ErrTemplateAssetNoBackslash  = "%s:%d: templates must not call %s(%q); backslashes are not allowed in asset paths"
	ErrTemplateAssetNotFound     = "%s:%d: templates must not call %s(%q); asset not found in package"
)

var assetCallPattern = regexp.MustCompile(`\b(read|image)\s*\(`)

func globToRegexp(pattern string) (*regexp.Regexp, error) {
	var b strings.Builder
	b.WriteString("^")
	chars := []rune(pattern)
	for i := 0; i < len(chars); {
		c := chars[i]
		if c == '*' {
			if i+1 < len(chars) && chars[i+1] == '*' {
				if i+2 < len(chars) && chars[i+2] == '/' {
					b.WriteString("(?:.*/)?")
					i += 3
				} else {
					b.WriteString(".*")
					i += 2
				}
			} else {
				b.WriteString("[^/]*")
				i++
			}
		} else if c == '?' {
			b.WriteString("[^/]")
			i++
		} else if strings.ContainsRune(`+()|^$.{}[]\`, c) {
			b.WriteRune('\\')
			b.WriteRune(c)
			i++
		} else {
			b.WriteRune(c)
			i++
		}
	}
	b.WriteString("$")
	return regexp.Compile(b.String())
}

func normalizeRelativePosixPath(rawPath string) (string, bool) {
	if strings.HasPrefix(rawPath, "/") || strings.Contains(rawPath, "\\") {
		return "", false
	}
	parts := strings.Split(rawPath, "/")
	var stack []string
	for _, part := range parts {
		if part == "" || part == "." {
			continue
		}
		if part == ".." {
			if len(stack) == 0 {
				return "", false
			}
			stack = stack[:len(stack)-1]
		} else {
			stack = append(stack, part)
		}
	}
	return strings.Join(stack, "/"), true
}

func resolveBundledAssetPath(templatePath, rawPath string, presentFiles map[string]bool) (string, bool) {
	if strings.HasPrefix(rawPath, "/") || strings.Contains(rawPath, "\\") {
		return "", false
	}

	templateDir := path.Dir(templatePath)
	fromTemplateDir := rawPath
	if templateDir != "" && templateDir != "." {
		fromTemplateDir = templateDir + "/" + rawPath
	}
	if norm, ok := normalizeRelativePosixPath(fromTemplateDir); ok && presentFiles[norm] {
		return norm, true
	}

	if norm, ok := normalizeRelativePosixPath(rawPath); ok && presentFiles[norm] {
		return norm, true
	}

	return "", false
}

func findLineNumber(content string, index int) int {
	line := 1
	for i := 0; i < index && i < len(content); i++ {
		if content[i] == '\n' {
			line++
		}
	}
	return line
}

func scanTemplateContent(templatePath, content string, presentFiles map[string]bool) error {
	matches := assetCallPattern.FindAllStringSubmatchIndex(content, -1)
	for _, m := range matches {
		fn := content[m[2]:m[3]]
		line := findLineNumber(content, m[0])
		openParenIdx := m[1]
		idx := openParenIdx
		for idx < len(content) && (content[idx] == ' ' || content[idx] == '\t' || content[idx] == '\n' || content[idx] == '\r') {
			idx++
		}
		if idx >= len(content) {
			return fmt.Errorf(ErrTemplateAssetLiteralOnly, templatePath, line, fn)
		}
		quoteChar := content[idx]
		if quoteChar != '"' && quoteChar != '\'' {
			return fmt.Errorf(ErrTemplateAssetLiteralOnly, templatePath, line, fn)
		}
		idx++
		var rawPath strings.Builder
		escaped := false
		terminated := false
		hasBackslash := false

		for idx < len(content) {
			ch := content[idx]
			if escaped {
				rawPath.WriteByte(ch)
				escaped = false
			} else if ch == '\\' {
				hasBackslash = true
				escaped = true
			} else if ch == quoteChar {
				terminated = true
				break
			} else {
				rawPath.WriteByte(ch)
			}
			idx++
		}
		if !terminated {
			return fmt.Errorf(ErrTemplateAssetLiteralOnly, templatePath, line, fn)
		}
		raw := rawPath.String()
		if strings.HasPrefix(raw, "/") {
			return fmt.Errorf(ErrTemplateAssetRelativeOnly, templatePath, line, fn, raw)
		}
		if hasBackslash || strings.Contains(raw, "\\") {
			return fmt.Errorf(ErrTemplateAssetNoBackslash, templatePath, line, fn, raw)
		}
		if _, ok := resolveBundledAssetPath(templatePath, raw, presentFiles); !ok {
			return fmt.Errorf(ErrTemplateAssetNotFound, templatePath, line, fn, raw)
		}
	}
	return nil
}

func CheckPackageDir(dir string) error {
	raw, err := os.ReadFile(filepath.Join(dir, config.ConfigFileName))
	if err != nil {
		return fmt.Errorf("%s not found in %s: %w", config.ConfigFileName, dir, err)
	}
	p, err := pkg.Parse(string(raw))
	if err != nil {
		return err
	}
	if err := pkg.Validate(p); err != nil {
		return err
	}

	presentFiles := make(map[string]bool)
	err = filepath.WalkDir(dir, func(pPath string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(dir, pPath)
		if err != nil {
			return err
		}
		if rel == "." {
			return nil
		}
		if strings.HasPrefix(rel, ".git"+string(os.PathSeparator)) || rel == ".git" {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if d.IsDir() {
			return nil
		}
		presentFiles[filepath.ToSlash(rel)] = true
		return nil
	})
	if err != nil {
		return err
	}

	var templateFiles []string
	for _, glob := range p.Templates.Files {
		re, err := globToRegexp(glob)
		if err != nil {
			return fmt.Errorf("invalid template glob %q: %w", glob, err)
		}
		for f := range presentFiles {
			if re.MatchString(f) && strings.HasSuffix(f, ".typ") {
				templateFiles = append(templateFiles, f)
			}
		}
	}

	for _, tFile := range templateFiles {
		contentBytes, err := os.ReadFile(filepath.Join(dir, filepath.FromSlash(tFile)))
		if err != nil {
			return fmt.Errorf("read template file %s: %w", tFile, err)
		}
		if err := scanTemplateContent(tFile, string(contentBytes), presentFiles); err != nil {
			return err
		}
	}

	return nil
}
