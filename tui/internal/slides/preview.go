package slides

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func previewHTML(title string) string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>` + title + ` (Dev Preview)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white">
  <div class="reveal">
    <div class="slides">
      <section>
        <h1 class="text-4xl font-bold mb-4">` + title + `</h1>
        <p class="text-xl text-slate-400">UNSA Slides Local Preview</p>
      </section>
      <section>
        <h2 class="text-3xl font-semibold mb-4">Local Preview Mode</h2>
        <p class="text-lg text-slate-300">Edit your slides and reload to see updates.</p>
        <p class="mt-4 text-sm text-cyan-400">Run 'unsarep slides deploy' when ready to publish to Cloud.</p>
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
