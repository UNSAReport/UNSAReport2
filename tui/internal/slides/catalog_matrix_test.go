package slides

import (
	"regexp"
	"strings"
	"testing"
)

var layoutRef = regexp.MustCompile(`layout: '([a-z0-9/-]+)'`)

func TestMatrix_UniversalVisibleUnderEveryTheme(t *testing.T) {
	for _, theme := range ListThemes() {
		layouts := ListLayoutsByTheme(theme.ID)
		found := false
		for _, l := range layouts {
			if l.ID == "hero-centered-bold" {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("universal layout hero-centered-bold missing under theme %s", theme.ID)
		}
	}
}

func TestMatrix_SignatureCounts(t *testing.T) {
	// 112 universales + firmas por tema (15 azul, 16 cloudlet, 14 harper).
	cases := map[string]int{
		"azul-proposal":  127,
		"cloudlet-pitch": 128,
		"harper-minimal": 126,
		"unsa-dark":      112,
	}
	for theme, want := range cases {
		if got := len(ListLayoutsByTheme(theme)); got != want {
			t.Errorf("theme %s: expected %d layouts, got %d", theme, want, got)
		}
	}
}

func TestMatrix_ThemesByLayout(t *testing.T) {
	if got := len(ListThemesByLayout("hero-centered-bold")); got != 8 {
		t.Errorf("universal layout: expected 8 themes, got %d", got)
	}
	got := ListThemesByLayout("hero-two-line")
	if len(got) != 1 || got[0].ID != "azul-proposal" {
		t.Errorf("hero-two-line: expected [azul-proposal], got %v", got)
	}
	if got := ListThemesByLayout("no-existe"); got != nil {
		t.Errorf("unknown layout: expected nil, got %v", got)
	}
}

func TestMatrix_DriftReport(t *testing.T) {
	kitPairs := []string{
		"azul-proposal/competitive-analysis@azul-proposal",
		"azul-proposal/conclusion-next-steps@azul-proposal",
		"azul-proposal/cover-duo@azul-proposal",
		"azul-proposal/implementation-plan@azul-proposal",
		"azul-proposal/market-opportunity@azul-proposal",
		"azul-proposal/marketing-strategy@azul-proposal",
		"azul-proposal/our-solution@azul-proposal",
		"azul-proposal/problem-statement@azul-proposal",
		"azul-proposal/target-audience@azul-proposal",
		"azul-proposal/thank-you@azul-proposal",
		"azul-proposal/value-proposition@azul-proposal",
		"cloudlet-pitch/accomplishments@cloudlet-pitch",
		"cloudlet-pitch/advantages@cloudlet-pitch",
		"cloudlet-pitch/agenda@cloudlet-pitch",
		"cloudlet-pitch/competitors@cloudlet-pitch",
		"cloudlet-pitch/cover@cloudlet-pitch",
		"cloudlet-pitch/innovative-solutions@cloudlet-pitch",
		"cloudlet-pitch/introduction@cloudlet-pitch",
		"cloudlet-pitch/market-size@cloudlet-pitch",
		"cloudlet-pitch/problem-statement@cloudlet-pitch",
		"cloudlet-pitch/services@cloudlet-pitch",
		"cloudlet-pitch/team@cloudlet-pitch",
		"cloudlet-pitch/thank-you@cloudlet-pitch",
		"cloudlet-pitch/traction@cloudlet-pitch",
		"cloudlet-pitch/use-of-funds@cloudlet-pitch",
		"harper-minimal/business-model@harper-minimal",
		"harper-minimal/closing@harper-minimal",
		"harper-minimal/contents@harper-minimal",
		"harper-minimal/cover@harper-minimal",
		"harper-minimal/features@harper-minimal",
		"harper-minimal/market-opportunity@harper-minimal",
		"harper-minimal/problem@harper-minimal",
		"harper-minimal/product-overview@harper-minimal",
		"harper-minimal/roadmap-quarters@harper-minimal",
		"harper-minimal/solution@harper-minimal",
		"harper-minimal/stats@harper-minimal",
		"harper-minimal/why-now@harper-minimal",
		"hero-cover-photo-blob@cloudlet-pitch",
		"hero-stacked-duo-footer@azul-proposal",
		"hero-two-line@azul-proposal",
		"list-pill-stack@harper-minimal",
		"quote-ghost-numeral@harper-minimal",
		"split-lead-plus-steps@azul-proposal",
		"split-numbered-steps@azul-proposal",
		"stats-team-grid@cloudlet-pitch",
	}
	if got := MatrixDriftReport(kitPairs); got != "" {
		t.Errorf("expected no matrix drift, got:\n%s", got)
	}
	if got := MatrixDriftReport(kitPairs[:7]); got == "" {
		t.Error("expected drift report for missing pair, got empty")
	}
	withExtra := append(append([]string{}, kitPairs...), "hero-minimal@azul-proposal")
	if got := MatrixDriftReport(withExtra); got == "" {
		t.Error("expected drift report for extra pair, got empty")
	}
	if got := len(OfficialMatrixPairs()); got != 45 {
		t.Errorf("expected 45 official matrix pairs, got %d", got)
	}
}

func TestInit_ThemeRegisteredCoversPortedThemes(t *testing.T) {
	for _, id := range []string{"azul-proposal", "cloudlet-pitch", "harper-minimal", "unsa-dark"} {
		if !ThemeRegistered(id) {
			t.Errorf("ThemeRegistered(%q) = false, want true", id)
		}
	}
	if ThemeRegistered("no-existe") {
		t.Errorf("ThemeRegistered(no-existe) = true, want false")
	}
	if len(ThemeIDs()) != len(ListThemes()) {
		t.Errorf("ThemeIDs len %d != ListThemes len %d", len(ThemeIDs()), len(ListThemes()))
	}
}

func TestInit_StarterTemplateWithTheme(t *testing.T) {
	files, err := StarterTemplateWithTheme("Demo", "azul-proposal")
	if err != nil {
		t.Fatal(err)
	}
	got := map[string]string{}
	for _, f := range files {
		got[f.Path] = f.Content
		if strings.HasPrefix(f.Path, "custom/") {
			t.Errorf("replica por layouts no debe traer custom/: %s", f.Path)
		}
	}
	// Réplica exacta: un layout registrado por slide de la plantilla.
	if g := got["deck.config.ts"]; !strings.Contains(g, "theme: 'azul-proposal'") {
		t.Errorf("deck.config.ts sin theme azul-proposal:\n%s", g[:200])
	}
	if g := got["deck.config.ts"]; !strings.Contains(g, "layout: 'azul-proposal/cover-duo'") {
		t.Errorf("deck.config.ts sin layout azul-proposal/cover-duo:\n%s", g[:300])
	}
	if g := got["manifest.json"]; !strings.Contains(g, `"theme": "azul-proposal"`) {
		t.Errorf("manifest.json sin theme azul-proposal:\n%s", g[:200])
	}
	// Por defecto y ante tema desconocido: unsa-dark (comportamiento previo).
	for _, th := range []string{"", "no-existe"} {
		f2, err := StarterTemplateWithTheme("Demo", th)
		if err != nil {
			t.Fatal(err)
		}
		for _, f := range f2 {
			if f.Path == "deck.config.ts" && !strings.Contains(f.Content, "theme: 'unsa-dark'") {
				t.Errorf("theme %q: deck.config.ts = %q, want unsa-dark", th, f.Content[:120])
			}
		}
	}
}

// TestInit_PortedReplicas: los 3 temas portados generan la réplica exacta
// (un layout registrado por slide), con title/slug del proyecto nuevo.
func TestInit_PortedReplicas(t *testing.T) {
	cases := map[string]int{
		"azul-proposal":  11,
		"cloudlet-pitch": 14,
		"harper-minimal": 12,
	}
	for theme, slides := range cases {
		if !PortedReplica(theme) {
			t.Errorf("PortedReplica(%q) = false, want true", theme)
		}
		files, err := StarterTemplateWithTheme("Mi Charla", theme)
		if err != nil {
			t.Fatal(err)
		}
		got := map[string]string{}
		for _, f := range files {
			got[f.Path] = f.Content
		}
		cfg := got["deck.config.ts"]
		if n := strings.Count(cfg, "layout: '"); n != slides {
			t.Errorf("%s: %d layouts, want %d", theme, n, slides)
		}
		if !strings.Contains(cfg, "title: 'Mi Charla'") || !strings.Contains(cfg, "slug: 'mi-charla'") {
			t.Errorf("%s: title/slug no templatizados:\n%s", theme, cfg[:300])
		}
		// Todo layout del deck debe existir en el espejo bajo ese tema.
		for _, m := range layoutRef.FindAllStringSubmatch(cfg, -1) {
			ok := false
			for _, l := range ListLayoutsByTheme(theme) {
				if l.ID == m[1] {
					ok = true
					break
				}
			}
			if !ok {
				t.Errorf("%s: layout %q no registrado en el espejo", theme, m[1])
			}
		}
	}
	if PortedReplica("unsa-dark") {
		t.Errorf("PortedReplica(unsa-dark) = true, want false")
	}
}
