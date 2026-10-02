package slides

import (
	"archive/zip"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const fixtureThemeXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office">
<a:themeElements>
<a:clrScheme name="Office">
<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
<a:dk2><a:srgbClr val="1F3864"/></a:dk2>
<a:lt2><a:srgbClr val="D9D9D9"/></a:lt2>
<a:accent1><a:srgbClr val="4472C4"/></a:accent1>
<a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
<a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
<a:accent4><a:srgbClr val="FFC000"/></a:accent4>
<a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>
<a:accent6><a:srgbClr val="70AD47"/></a:accent6>
<a:hlink><a:srgbClr val="0563C1"/></a:hlink>
<a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
</a:clrScheme>
<a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
<a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme>
</a:themeElements>
</a:theme>`

const fixtureMasterXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="0B0F19"/></a:solidFill></p:bgPr></p:bg></p:cSld>
</p:sldMaster>`

const fixtureContentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>`

func writeFixturePptx(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "fixture.pptx")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	w := zip.NewWriter(f)
	for name, content := range map[string]string{
		"ppt/theme/theme1.xml":              fixtureThemeXML,
		"ppt/slideMasters/slideMaster1.xml": fixtureMasterXML,
		"[Content_Types].xml":               fixtureContentTypes,
	} {
		fw, err := w.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := fw.Write([]byte(content)); err != nil {
			t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	if err := f.Close(); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestParsePptxTheme(t *testing.T) {
	theme, err := ParsePptxTheme(writeFixturePptx(t))
	if err != nil {
		t.Fatal(err)
	}
	if len(theme.Colors) != 12 {
		t.Fatalf("expected 12 colors, got %d: %v", len(theme.Colors), theme.Colors)
	}
	want := map[string]string{
		"dk1": "#000000", "lt1": "#ffffff", "dk2": "#1f3864",
		"accent1": "#4472c4", "hlink": "#0563c1", "folHlink": "#954f72",
	}
	for slot, hex := range want {
		if theme.Colors[slot] != hex {
			t.Errorf("slot %s: got %s want %s", slot, theme.Colors[slot], hex)
		}
	}
	if theme.MajorFont != "Calibri Light" {
		t.Errorf("major font: got %q", theme.MajorFont)
	}
	if theme.MinorFont != "Calibri" {
		t.Errorf("minor font: got %q", theme.MinorFont)
	}
	if len(theme.MasterBackgrounds) != 1 || theme.MasterBackgrounds[0] != "#0b0f19" {
		t.Errorf("master backgrounds: got %v", theme.MasterBackgrounds)
	}
}

func TestParsePptxTheme_TintShade(t *testing.T) {
	if got := ApplyTint("#000000", 0.5); got != "#808080" {
		t.Errorf("tint: got %s want #808080", got)
	}
	if got := ApplyTint("#ff0000", 1.0); got != "#ffffff" {
		t.Errorf("tint full: got %s", got)
	}
	if got := ApplyShade("#ffffff", 0.5); got != "#808080" {
		t.Errorf("shade: got %s want #808080", got)
	}
	if got := ApplyShade("#4472c4", 0); got != "#4472c4" {
		t.Errorf("shade zero: got %s", got)
	}
}

func TestParsePptxTheme_MissingTheme(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "empty.pptx")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	w := zip.NewWriter(f)
	fw, err := w.Create("[Content_Types].xml")
	if err != nil {
		t.Fatal(err)
	}
	_, _ = fw.Write([]byte(fixtureContentTypes))
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	if err := f.Close(); err != nil {
		t.Fatal(err)
	}
	if _, err := ParsePptxTheme(path); err == nil {
		t.Fatal("expected error for pptx without theme XML")
	} else if !strings.Contains(err.Error(), "theme") {
		t.Fatalf("error should mention theme, got %v", err)
	}
}

func TestToThemePatch(t *testing.T) {
	theme, err := ParsePptxTheme(writeFixturePptx(t))
	if err != nil {
		t.Fatal(err)
	}
	patch := theme.ToThemePatch("office-import")
	for _, want := range []string{
		"ThemeDefinition", "office-import", "4472c4", "Calibri", "unsarep slides import",
	} {
		if !strings.Contains(patch, want) {
			t.Errorf("patch missing %q:\n%s", want, patch)
		}
	}
}
