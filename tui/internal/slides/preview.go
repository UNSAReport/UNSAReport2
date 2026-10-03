package slides

import (
	"fmt"
	"html"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func previewHTML(title string) string {
	esc := html.EscapeString(title)
	return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>` + esc + ` (Dev Preview)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white">
  <div class="reveal">
    <div class="slides">
      <section>
        <h1 class="text-4xl font-bold mb-4">` + esc + `</h1>
        <p class="text-xl text-slate-400">UNSA Slides Local Preview</p>
      </section>
      <section>
        <h2 class="text-3xl font-semibold mb-4">Modo de Vista Previa Local</h2>
        <p class="text-lg text-slate-300">Edita deck.config.ts o tus componentes para ver los cambios.</p>
        <p class="mt-4 text-sm text-cyan-400">Ejecuta 'unsarep slides deploy' cuando estés listo para publicar.</p>
      </section>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      width: 1280,
      height: 720,
      margin: 0.04,
      controls: true,
      progress: true,
      hash: true,
      center: false
    });
  </script>
</body>
</html>`
}

func ServePreview(addr, dir, title string) error {
	page := previewHTML(title)
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || r.URL.Path == "/index.html" {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Content-Security-Policy", "default-src 'self' https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
			if _, err := fmt.Fprint(w, page); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			return
		}
		rel := strings.TrimPrefix(r.URL.Path, "/")
		if strings.Contains(rel, "..") {
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}
		full := filepath.Join(dir, filepath.FromSlash(rel))
		if st, err := os.Stat(full); err != nil || st.IsDir() {
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}
		http.ServeFile(w, r, full)
	})
	return http.ListenAndServe(addr, mux)
}

func StartDev(dir string, port int) error {
	pkgPath := filepath.Join(dir, "package.json")
	if _, err := os.Stat(pkgPath); err == nil {
		runner := ""
		if _, err := exec.LookPath("bun"); err == nil {
			runner = "bun"
		} else if _, err := exec.LookPath("npx"); err == nil {
			runner = "npx"
		}

		if runner != "" {
			var cmd *exec.Cmd
			if runner == "bun" {
				cmd = exec.Command("bun", "run", "dev", "--port", fmt.Sprintf("%d", port))
			} else {
				cmd = exec.Command("npx", "vite", "--port", fmt.Sprintf("%d", port))
			}
			cmd.Dir = dir
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			cmd.Stdin = os.Stdin
			if err := cmd.Run(); err == nil {
				return nil
			}
		}
	}

	addr := fmt.Sprintf("127.0.0.1:%d", port)
	title := "UNSA Slides Preview"
	if cfg, err := LoadProjectConfig(dir); err == nil && cfg.Title != "" {
		title = cfg.Title
	}
	return ServePreview(addr, dir, title)
}
