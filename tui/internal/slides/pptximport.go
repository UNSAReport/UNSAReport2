package slides

import (
	"archive/zip"
	"encoding/xml"
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
)

// PptxTheme is the colors/fonts-only extraction of a .pptx theme.
//
// Scope (fidelity ceiling): theme clrScheme + major/minor latin fonts +
// slideMaster background fills. Layouts, text runs, shapes, animations and
// images are NOT extracted.
type PptxTheme struct {
	// Colors maps the 12 OOXML clrScheme slots (dk1, lt1, dk2, lt2,
	// accent1-6, hlink, folHlink) to #rrggbb hex.
	Colors map[string]string
	// MajorFont/MinorFont are the latin typefaces from a:fontScheme.
	MajorFont string
	MinorFont string
	// MasterBackgrounds holds #rrggbb fills found in slideMaster
	// backgrounds (solid first stop of gradients), in master order.
	MasterBackgrounds []string
	// Source is the parsed file base name, for patch provenance comments.
	Source string
}

// PptxColorSlots is the canonical 12-slot clrScheme order (ECMA-376).
var PptxColorSlots = []string{
	"dk1", "lt1", "dk2", "lt2",
	"accent1", "accent2", "accent3", "accent4", "accent5", "accent6",
	"hlink", "folHlink",
}

// modVal is an OOXML percentage modifier (tint/shade/lumMod/...):
// val is thousandths of a percent (0-100000).
type modVal struct {
	Val string `xml:"val,attr"`
}

func (m *modVal) fraction() float64 {
	if m == nil {
		return 0
	}
	n, err := strconv.Atoi(strings.TrimSpace(m.Val))
	if err != nil {
		return 0
	}
	if n < 0 {
		n = 0
	}
	if n > 100000 {
		n = 100000
	}
	return float64(n) / 100000
}

// colorChoice is one OOXML color value with optional transforms.
// encoding/xml matches local names regardless of the a: prefix.
type colorChoice struct {
	Srgb *struct {
		Val string `xml:"val,attr"`
	} `xml:"srgbClr"`
	Sys *struct {
		Val     string `xml:"val,attr"`
		LastClr string `xml:"lastClr,attr"`
	} `xml:"sysClr"`
	Scheme *struct {
		Val string `xml:"val,attr"`
	} `xml:"schemeClr"`
	Tint   *modVal `xml:"tint"`
	Shade  *modVal `xml:"shade"`
	LumMod *modVal `xml:"lumMod"`
	LumOff *modVal `xml:"lumOff"`
	SatMod *modVal `xml:"satMod"`
}

// themeXML mirrors ppt/theme/theme*.xml (only the parts we extract).
type themeXML struct {
	ThemeElements struct {
		ClrScheme struct {
			Name     string      `xml:"name,attr"`
			Dk1      colorChoice `xml:"dk1"`
			Lt1      colorChoice `xml:"lt1"`
			Dk2      colorChoice `xml:"dk2"`
			Lt2      colorChoice `xml:"lt2"`
			Accent1  colorChoice `xml:"accent1"`
			Accent2  colorChoice `xml:"accent2"`
			Accent3  colorChoice `xml:"accent3"`
			Accent4  colorChoice `xml:"accent4"`
			Accent5  colorChoice `xml:"accent5"`
			Accent6  colorChoice `xml:"accent6"`
			Hlink    colorChoice `xml:"hlink"`
			FolHlink colorChoice `xml:"folHlink"`
		} `xml:"clrScheme"`
		FontScheme struct {
			MajorFont struct {
				Latin struct {
					Typeface string `xml:"typeface,attr"`
				} `xml:"latin"`
			} `xml:"majorFont"`
			MinorFont struct {
				Latin struct {
					Typeface string `xml:"typeface,attr"`
				} `xml:"latin"`
			} `xml:"minorFont"`
		} `xml:"fontScheme"`
	} `xml:"themeElements"`
}

func (t *themeXML) slotMap() map[string]colorChoice {
	c := t.ThemeElements.ClrScheme
	return map[string]colorChoice{
		"dk1": c.Dk1, "lt1": c.Lt1, "dk2": c.Dk2, "lt2": c.Lt2,
		"accent1": c.Accent1, "accent2": c.Accent2, "accent3": c.Accent3,
		"accent4": c.Accent4, "accent5": c.Accent5, "accent6": c.Accent6,
		"hlink": c.Hlink, "folHlink": c.FolHlink,
	}
}

// masterXML mirrors the background-relevant part of a slideMaster
// (p:cSld > p:bg > p:bgPr).
type masterXML struct {
	CSld struct {
		Bg struct {
			BgPr struct {
				SolidFill *colorChoice `xml:"solidFill"`
				GradFill  *struct {
					Stops []struct {
						Srgb *struct {
							Val string `xml:"val,attr"`
						} `xml:"srgbClr"`
						Sys *struct {
							Val     string `xml:"val,attr"`
							LastClr string `xml:"lastClr,attr"`
						} `xml:"sysClr"`
						Scheme *struct {
							Val string `xml:"val,attr"`
						} `xml:"schemeClr"`
					} `xml:"gs"`
				} `xml:"gsLst"`
			} `xml:"bgPr"`
		} `xml:"bg"`
	} `xml:"cSld"`
}

// sysClrFallback maps common ECMA-376 sysClr names to hex; lastClr wins.
var sysClrFallback = map[string]string{
	"window":     "FFFFFF",
	"windowText": "000000",
	"highlight":  "0078D7",
	"btnFace":    "F0F0F0",
	"btnText":    "000000",
	"grayText":   "808080",
	"hotLight":   "0066CC",
}

func parseHex6(s string) (r, g, b uint8, ok bool) {
	s = strings.TrimSpace(strings.TrimPrefix(s, "#"))
	if len(s) != 6 {
		return 0, 0, 0, false
	}
	n, err := strconv.ParseUint(s, 16, 32)
	if err != nil {
		return 0, 0, 0, false
	}
	return uint8(n >> 16), uint8((n >> 8) & 0xFF), uint8(n & 0xFF), true
}

func hex6(r, g, b uint8) string {
	return fmt.Sprintf("#%02x%02x%02x", r, g, b)
}

func clamp8(f float64) uint8 {
	if f < 0 {
		return 0
	}
	if f > 255 {
		return 255
	}
	return uint8(f + 0.5)
}

// ApplyTint lightens toward white: ECMA-376 tint, f in [0,1].
func ApplyTint(hex string, f float64) string {
	r, g, b, ok := parseHex6(hex)
	if !ok {
		return hex
	}
	return hex6(
		clamp8(float64(r)+(255-float64(r))*f),
		clamp8(float64(g)+(255-float64(g))*f),
		clamp8(float64(b)+(255-float64(b))*f),
	)
}

// ApplyShade darkens toward black: ECMA-376 shade, f in [0,1].
func ApplyShade(hex string, f float64) string {
	r, g, b, ok := parseHex6(hex)
	if !ok {
		return hex
	}
	return hex6(
		clamp8(float64(r)*(1-f)),
		clamp8(float64(g)*(1-f)),
		clamp8(float64(b)*(1-f)),
	)
}

func rgbToHSL(r, g, b uint8) (h, s, l float64) {
	rf, gf, bf := float64(r)/255, float64(g)/255, float64(b)/255
	max, min := rf, rf
	if gf > max {
		max = gf
	}
	if bf > max {
		max = bf
	}
	if gf < min {
		min = gf
	}
	if bf < min {
		min = bf
	}
	l = (max + min) / 2
	if max == min {
		return 0, 0, l
	}
	d := max - min
	if l > 0.5 {
		s = d / (2 - max - min)
	} else {
		s = d / (max + min)
	}
	switch max {
	case rf:
		h = (gf - bf) / d
		if gf < bf {
			h += 6
		}
	case gf:
		h = (bf-rf)/d + 2
	default:
		h = (rf-gf)/d + 4
	}
	return h / 6, s, l
}

func hslToRGB(h, s, l float64) (uint8, uint8, uint8) {
	if s == 0 {
		v := clamp8(l * 255)
		return v, v, v
	}
	var q float64
	if l < 0.5 {
		q = l * (1 + s)
	} else {
		q = l + s - l*s
	}
	p := 2*l - q
	ch := func(t float64) uint8 {
		if t < 0 {
			t++
		}
		if t > 1 {
			t--
		}
		switch {
		case t < 1.0/6:
			return clamp8((p + (q-p)*6*t) * 255)
		case t < 0.5:
			return clamp8(q * 255)
		case t < 2.0/3:
			return clamp8((p + (q-p)*(2.0/3-t)*6) * 255)
		default:
			return clamp8(p * 255)
		}
	}
	return ch(h + 1.0/3), ch(h), ch(h - 1.0/3)
}

func applyLumSat(hex string, lumMod, lumOff, satMod float64, hasLumMod, hasSatMod bool) string {
	r, g, b, ok := parseHex6(hex)
	if !ok {
		return hex
	}
	h, s, l := rgbToHSL(r, g, b)
	if hasLumMod {
		l = l * lumMod
	}
	if lumOff != 0 {
		l = l + lumOff
	}
	if l < 0 {
		l = 0
	}
	if l > 1 {
		l = 1
	}
	if hasSatMod {
		s = s * satMod
		if s < 0 {
			s = 0
		}
		if s > 1 {
			s = 1
		}
	}
	nr, ng, nb := hslToRGB(h, s, l)
	return hex6(nr, ng, nb)
}

// resolveChoice resolves one OOXML color value to #rrggbb, applying
// tint/shade/lum/sat transforms. slots resolves schemeClr references.
func resolveChoice(c colorChoice, slots map[string]string) (string, bool) {
	var base string
	switch {
	case c.Srgb != nil && strings.TrimSpace(c.Srgb.Val) != "":
		v := strings.TrimSpace(c.Srgb.Val)
		if _, _, _, ok := parseHex6(v); !ok {
			return "", false
		}
		base = "#" + strings.ToLower(v)
	case c.Sys != nil && strings.TrimSpace(c.Sys.Val) != "":
		if clr := strings.TrimSpace(c.Sys.LastClr); clr != "" {
			if _, _, _, ok := parseHex6(clr); ok {
				base = "#" + strings.ToLower(clr)
				break
			}
		}
		if fb, ok := sysClrFallback[strings.TrimSpace(c.Sys.Val)]; ok {
			base = "#" + strings.ToLower(fb)
			break
		}
		return "", false
	case c.Scheme != nil && strings.TrimSpace(c.Scheme.Val) != "":
		v, ok := slots[strings.TrimSpace(c.Scheme.Val)]
		if !ok || v == "" {
			return "", false
		}
		base = v
	default:
		return "", false
	}
	out := base
	if c.Tint != nil {
		out = ApplyTint(out, c.Tint.fraction())
	}
	if c.Shade != nil {
		out = ApplyShade(out, c.Shade.fraction())
	}
	if c.LumMod != nil || c.LumOff != nil || c.SatMod != nil {
		lm, lo, sm := 0.0, 0.0, 0.0
		hl, hs := false, false
		if c.LumMod != nil {
			lm, hl = c.LumMod.fraction(), true
		}
		if c.LumOff != nil {
			lo = c.LumOff.fraction()
		}
		if c.SatMod != nil {
			sm, hs = c.SatMod.fraction(), true
		}
		out = applyLumSat(out, lm, lo, sm, hl, hs)
	}
	return out, true
}

func readZipEntry(f *zip.File) ([]byte, error) {
	rc, err := f.Open()
	if err != nil {
		return nil, err
	}
	defer func() { _ = rc.Close() }()
	var out []byte
	buf := make([]byte, 32*1024)
	for {
		n, rerr := rc.Read(buf)
		out = append(out, buf[:n]...)
		if rerr != nil {
			break
		}
	}
	return out, nil
}

// ParsePptxTheme extracts colors + fonts from a .pptx file using only
// archive/zip + encoding/xml. It reads ppt/theme/theme1.xml (falling back
// to any ppt/theme/theme*.xml) and all ppt/slideMasters/*.xml backgrounds.
func ParsePptxTheme(pptxPath string) (*PptxTheme, error) {
	z, err := zip.OpenReader(pptxPath)
	if err != nil {
		return nil, fmt.Errorf("slides import: open %s: %w", pptxPath, err)
	}
	defer func() { _ = z.Close() }()
	var themeData []byte
	for _, f := range z.File {
		if strings.HasPrefix(f.Name, "ppt/theme/theme") && strings.HasSuffix(f.Name, ".xml") {
			out, oerr := readZipEntry(f)
			if oerr != nil {
				continue
			}
			themeData = out
			if f.Name == "ppt/theme/theme1.xml" {
				break
			}
		}
	}
	if themeData == nil {
		return nil, fmt.Errorf("slides import: no ppt/theme/theme*.xml found in %s (not a PowerPoint .pptx?)", pptxPath)
	}

	var th themeXML
	if err := xml.Unmarshal(themeData, &th); err != nil {
		return nil, fmt.Errorf("slides import: parse theme XML: %w", err)
	}
	slots := th.slotMap()
	// Resolve in two passes so schemeClr refs hit resolved siblings.
	colors := make(map[string]string, len(PptxColorSlots))
	raw := make(map[string]string, len(PptxColorSlots))
	unresolved := map[string]colorChoice{}
	for _, slot := range PptxColorSlots {
		choice := slots[slot]
		if hex, ok := resolveChoice(choice, nil); ok {
			raw[slot] = hex
		} else {
			unresolved[slot] = choice
		}
	}
	for _, slot := range PptxColorSlots {
		if v, ok := raw[slot]; ok {
			colors[slot] = v
			continue
		}
		if hex, ok := resolveChoice(unresolved[slot], raw); ok {
			colors[slot] = hex
		}
	}
	if len(colors) == 0 {
		return nil, fmt.Errorf("slides import: theme clrScheme has no resolvable colors")
	}

	theme := &PptxTheme{
		Colors:    colors,
		MajorFont: strings.TrimSpace(th.ThemeElements.FontScheme.MajorFont.Latin.Typeface),
		MinorFont: strings.TrimSpace(th.ThemeElements.FontScheme.MinorFont.Latin.Typeface),
		Source:    filepath.Base(pptxPath),
	}

	// SlideMaster backgrounds (solid fills + first gradient stop).
	for _, f := range z.File {
		if !strings.HasPrefix(f.Name, "ppt/slideMasters/") || !strings.HasSuffix(f.Name, ".xml") {
			continue
		}
		out, oerr := readZipEntry(f)
		if oerr != nil {
			continue
		}
		var m masterXML
		if xml.Unmarshal(out, &m) != nil {
			continue
		}
		bg := m.CSld.Bg.BgPr
		switch {
		case bg.SolidFill != nil:
			if hex, ok := resolveChoice(*bg.SolidFill, colors); ok {
				theme.MasterBackgrounds = append(theme.MasterBackgrounds, hex)
			}
		case bg.GradFill != nil:
			for _, gs := range bg.GradFill.Stops {
				var c colorChoice
				switch {
				case gs.Srgb != nil:
					c.Srgb = &struct {
						Val string `xml:"val,attr"`
					}{Val: gs.Srgb.Val}
				case gs.Sys != nil:
					c.Sys = &struct {
						Val     string `xml:"val,attr"`
						LastClr string `xml:"lastClr,attr"`
					}{Val: gs.Sys.Val, LastClr: gs.Sys.LastClr}
				case gs.Scheme != nil:
					c.Scheme = &struct {
						Val string `xml:"val,attr"`
					}{Val: gs.Scheme.Val}
				default:
					continue
				}
				if hex, ok := resolveChoice(c, colors); ok {
					theme.MasterBackgrounds = append(theme.MasterBackgrounds, hex)
					break
				}
			}
		}
	}
	return theme, nil
}

// luminance returns the relative brightness of a #rrggbb color in [0,1].
func luminance(hex string) float64 {
	r, g, b, ok := parseHex6(hex)
	if !ok {
		return 0
	}
	return (0.299*float64(r) + 0.587*float64(g) + 0.114*float64(b)) / 255
}

func rgba(hex string, alpha float64) string {
	r, g, b, ok := parseHex6(hex)
	if !ok {
		return hex
	}
	return fmt.Sprintf("rgba(%d, %d, %d, %g)", r, g, b, alpha)
}

func themeSlug(s string) string {
	slug := Slugify(s)
	if slug == "" {
		slug = "imported-theme"
	}
	return slug
}

func camelThemeName(slug string) string {
	parts := strings.Split(slug, "-")
	var b strings.Builder
	for _, p := range parts {
		if p == "" {
			continue
		}
		b.WriteString(strings.ToUpper(p[:1]) + p[1:])
	}
	b.WriteString("Theme")
	return b.String()
}

// ToThemePatch renders a slides-kit ThemeDefinition file for the theme.
// Mapping heuristic: the brighter of lt1/dk1 becomes the page background;
// accent1/accent2 become the brand accents; surfaces derive from the
// background; success/warning/error keep kit defaults (not in OOXML).
func (t *PptxTheme) ToThemePatch(slug string) string {
	if slug == "" {
		slug = themeSlug(strings.TrimSuffix(t.Source, filepath.Ext(t.Source)))
	}
	lt1 := t.Colors["lt1"]
	dk1 := t.Colors["dk1"]
	if lt1 == "" {
		lt1 = "#ffffff"
	}
	if dk1 == "" {
		dk1 = "#000000"
	}
	background, text := dk1, lt1
	light := luminance(lt1) >= luminance(dk1)
	if light {
		background, text = lt1, dk1
	}
	var surface, surfaceMuted string
	if light {
		surface = ApplyShade(background, 0.04)
		surfaceMuted = ApplyShade(background, 0.08)
	} else {
		surface = ApplyTint(background, 0.07)
		surfaceMuted = ApplyTint(background, 0.03)
	}
	textMuted := text
	if light {
		textMuted = ApplyShade(text, 0.35)
	} else {
		textMuted = ApplyTint(text, 0.35)
	}
	accent := t.Colors["accent1"]
	if accent == "" {
		accent = "#4472c4"
	}
	accentSecondary := t.Colors["accent2"]
	if accentSecondary == "" {
		accentSecondary = accent
	}
	minor := t.MinorFont
	if minor == "" {
		minor = "Calibri"
	}
	major := t.MajorFont
	if major == "" {
		major = minor
	}

	var b strings.Builder
	fmt.Fprintf(&b, "import type { ThemeDefinition } from '@/themes/types';\n\n")
	fmt.Fprintf(&b, "// Auto-generated by `unsarep slides import %s` (colors/fonts only).\n", t.Source)
	fmt.Fprintf(&b, "// Fidelity ceiling: OOXML theme colors + major/minor latin fonts.\n")
	fmt.Fprintf(&b, "// Layouts, shapes, images and animations are NOT imported.\n")
	if len(t.MasterBackgrounds) > 0 {
		fmt.Fprintf(&b, "// slideMaster background hint(s): %s\n", strings.Join(t.MasterBackgrounds, ", "))
	}
	fmt.Fprintf(&b, "export const %s: ThemeDefinition = {\n", camelThemeName(slug))
	fmt.Fprintf(&b, "  id: '%s',\n", slug)
	fmt.Fprintf(&b, "  name: '%s',\n", slug)
	fmt.Fprintf(&b, "  description: 'Imported from %s (colors/fonts only).',\n", t.Source)
	fmt.Fprintf(&b, "  tags: ['imported', 'pptx'],\n")
	fmt.Fprintf(&b, "  colors: {\n")
	fmt.Fprintf(&b, "    background: '%s',\n", background)
	fmt.Fprintf(&b, "    surface: '%s',\n", surface)
	fmt.Fprintf(&b, "    surfaceMuted: '%s',\n", surfaceMuted)
	fmt.Fprintf(&b, "    text: '%s',\n", text)
	fmt.Fprintf(&b, "    textMuted: '%s',\n", textMuted)
	fmt.Fprintf(&b, "    accent: '%s',\n", accent)
	fmt.Fprintf(&b, "    accentSecondary: '%s',\n", accentSecondary)
	fmt.Fprintf(&b, "    border: '%s',\n", rgba(text, 0.12))
	fmt.Fprintf(&b, "    borderGlow: '%s',\n", rgba(accent, 0.35))
	fmt.Fprintf(&b, "    success: '#10b981',\n")
	fmt.Fprintf(&b, "    warning: '#f59e0b',\n")
	fmt.Fprintf(&b, "    error: '#ef4444',\n")
	fmt.Fprintf(&b, "  },\n")
	fmt.Fprintf(&b, "  typography: {\n")
	fmt.Fprintf(&b, "    fontFamily: '%s, system-ui, sans-serif',\n", minor)
	fmt.Fprintf(&b, "    monoFamily: 'ui-monospace, \"SFMono-Regular\", Consolas, monospace',\n")
	fmt.Fprintf(&b, "    headingWeight: 700,\n")
	fmt.Fprintf(&b, "  },\n")
	fmt.Fprintf(&b, "  effects: {\n")
	fmt.Fprintf(&b, "    cardBorderRadius: '12px',\n")
	fmt.Fprintf(&b, "    glowEnabled: false,\n")
	fmt.Fprintf(&b, "    glassmorphism: false,\n")
	fmt.Fprintf(&b, "    slideBorderGradient: false,\n")
	fmt.Fprintf(&b, "  },\n")
	fmt.Fprintf(&b, "};\n")
	_ = major
	return b.String()
}
