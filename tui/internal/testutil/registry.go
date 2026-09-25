package testutil

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/UNSAReport/tui/internal/config"
)

func CreateZip(files map[string]string) []byte {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for name, content := range files {
		w, _ := zw.Create(name)
		_, _ = w.Write([]byte(content))
	}
	_ = zw.Close()
	return buf.Bytes()
}

func MockRegistry(t *testing.T) *httptest.Server {
	t.Helper()
	var srv *httptest.Server

	cardoComp := CreateZip(map[string]string{
		"unsareport.toml": "[project]\nconfig_version = 1\n\n[package]\nname = \"@scope/cardo\"\nversion = \"1.0.0\"\n\n[dependencies]\n\"@scope/theme\" = \"^1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\n\n[templates]\nfiles = [\"report.typ\"]\n",
		"lib.typ": "#let note(body) = block()[#body]\n",
	})
	cardoTpl := CreateZip(map[string]string{
		"report.typ": "#import \"/components/@scope/cardo/lib.typ\" as cardo\n#import \"/components/@scope/theme/lib.typ\" as theme\n= Report\n",
	})
	themeComp := CreateZip(map[string]string{
		"unsareport.toml": "[project]\nconfig_version = 1\n\n[package]\nname = \"@scope/theme\"\nversion = \"1.0.0\"\n\n[dependencies]\n\"@scope/utils\" = \"^1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\n\n[templates]\nfiles = []\n",
		"lib.typ": "#let theme(x) = x\n",
	})
	utilsComp := CreateZip(map[string]string{
		"unsareport.toml": "[project]\nconfig_version = 1\n\n[package]\nname = \"@scope/utils\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\n\n[templates]\nfiles = []\n",
		"lib.typ": "#let util(x) = x\n",
	})
	tplpkgComp := CreateZip(map[string]string{
		"unsareport.toml": "[project]\nconfig_version = 1\n\n[package]\nname = \"@scope/tplpkg\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\n\n[templates]\nfiles = [\"template/**/*\"]\n",
		"lib.typ": "#let note(body) = block()[#body]\n",
	})
	tplpkgTpl := CreateZip(map[string]string{
		"template/report.typ":      "= Templated Report\n",
		"template/assets/logo.png": "png-bytes",
	})
	siblingComp := CreateZip(map[string]string{
		"unsareport.toml": "[project]\nconfig_version = 1\n\n[package]\nname = \"@scope/siblingpkg\"\nversion = \"1.0.0\"\n\n[components]\nfiles = [\"lib.typ\"]\n\n[templates]\nfiles = [\"**/*\"]\n",
		"lib.typ": "#let note(body) = block()[#body]\n",
	})
	siblingTpl := CreateZip(map[string]string{
		"template/report.typ": "= Report\n",
		"README.md":           "# Readme\n",
	})

	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/resolve" && r.Method == "POST" {
			var body struct {
				Packages map[string]string `json:"packages"`
			}
			_ = json.NewDecoder(r.Body).Decode(&body)
			var resolved []map[string]any
			for pkgName := range body.Packages {
				resolved = append(resolved, map[string]any{
					"name":        pkgName,
					"version":     "1.0.0",
					"archive_url": srv.URL + "/dl/" + url.PathEscape(pkgName) + "/components.zip",
					"files":       []string{"lib.typ"},
				})
			}
			_ = json.NewEncoder(w).Encode(map[string]any{"resolved": resolved})
			return
		}

		if strings.HasSuffix(r.URL.Path, "/archive") {
			sec := r.URL.Query().Get("section")
			trimmed := strings.TrimPrefix(strings.TrimSuffix(r.URL.Path, "/archive"), "/v1/")
			parts := strings.Split(trimmed, "/")
			if len(parts) >= 2 {
				pkgName := strings.Join(parts[:len(parts)-1], "/")
				_ = json.NewEncoder(w).Encode(map[string]any{
					"archive_url": fmt.Sprintf("%s/dl/%s/%s.zip", srv.URL, url.PathEscape(pkgName), sec),
				})
				return
			}
		}

		if strings.HasPrefix(r.URL.Path, "/dl/") {
			rest := strings.TrimPrefix(r.URL.Path, "/dl/")
			lastSlash := strings.LastIndex(rest, "/")
			if lastSlash > 0 {
				rawPkg := rest[:lastSlash]
				file := rest[lastSlash+1:]
				pkgName, _ := url.PathUnescape(rawPkg)
				if pkgName == "@scope/cardo" && file == "templates.zip" {
					_, _ = w.Write(cardoTpl)
					return
				}
				if pkgName == "@scope/cardo" && file == "components.zip" {
					_, _ = w.Write(cardoComp)
					return
				}
				if pkgName == "@scope/theme" && file == "components.zip" {
					_, _ = w.Write(themeComp)
					return
				}
				if pkgName == "@scope/utils" && file == "components.zip" {
					_, _ = w.Write(utilsComp)
					return
				}
				if pkgName == "@scope/tplpkg" && file == "templates.zip" {
					_, _ = w.Write(tplpkgTpl)
					return
				}
				if pkgName == "@scope/tplpkg" && file == "components.zip" {
					_, _ = w.Write(tplpkgComp)
					return
				}
				if pkgName == "@scope/siblingpkg" && file == "templates.zip" {
					_, _ = w.Write(siblingTpl)
					return
				}
				if pkgName == "@scope/siblingpkg" && file == "components.zip" {
					_, _ = w.Write(siblingComp)
					return
				}
			}
		}

		w.WriteHeader(404)
	}))

	t.Setenv(config.EnvRegistryURL, srv.URL)
	return srv
}
