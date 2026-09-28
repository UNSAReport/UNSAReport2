package slides

import (
	_ "embed"
	"fmt"
	"strings"
)

//go:embed assets/slides-kit.tgz
var slidesKitArchive []byte

type TemplateFile struct {
	Path    string
	Content string
	Data    []byte
}

func StarterTemplate(projectName string) []TemplateFile {
	slug := Slugify(projectName)
	if slug == "" {
		slug = "my-slides"
	}
	return []TemplateFile{
		{
			Path: "slides-kit.tgz",
			Data: slidesKitArchive,
		},
		{
			Path: "package.json",
			Content: `{
  "name": "` + projectName + `",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@unsa/slides-kit": "file:./slides-kit.tgz",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "reveal.js": "^6.0.1"
  },
  "devDependencies": {
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.3",
    "vite": "^6.2.0"
  }
}
`,
		},
		{
			Path: "deck.config.ts",
			Content: `import { defineConfig } from '@unsa/slides-kit';

export default defineConfig({
  title: '` + projectName + `',
  slug: '` + slug + `',
  theme: 'unsa-dark',
  visibility: 'private',
  slides: [
    {
      layout: 'hero-centered-bold',
      tag: 'Presentación',
      title: '` + projectName + `',
      subtitle: 'Creado con unsarep slides y @unsa/slides-kit',
      author: 'Autor',
      date: '2026',
    },
    {
      layout: 'split-comparison-cards',
      tag: 'Comparativa',
      title: 'Arquitectura Modular',
      left: {
        title: 'Tradicional',
        badge: 'Antes',
        items: ['Diseño estático', 'Acoplamiento rígido', 'Dificultad de actualización'],
      },
      right: {
        title: 'UNSA Slides',
        badge: 'Recomendado',
        items: ['110 layouts puros', 'Tokens temáticos intercambiables', 'Despliegue ágil en la nube'],
      },
    },
    {
      layout: 'bento-4-featured-left',
      tag: 'Capacidades',
      title: 'Ecosistema de Presentaciones',
      featured: {
        stat: '110',
        label: 'Layouts Oficiales',
        description: 'Componentes estructurales diseñados para ingeniería y academia.',
      },
      cards: [
        { title: 'Familias', stat: '9 familias', status: 'optimal' },
        { title: 'Temas', stat: '3 oficiales', status: 'optimal' },
        { title: 'Embed Iframe', stat: 'Sandboxed', status: 'optimal' },
      ],
    },
    {
      layout: 'closing-qa-centered',
      title: '¿Preguntas?',
      subtitle: 'Gracias por su atención',
      contactInfo: 'contacto@unsa.edu.pe',
    },
  ],
});
`,
		},
		{
			Path: "vite.config.ts",
			Content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
  },
  build: {
    outDir: 'dist',
  },
});
`,
		},
		{
			Path: "index.html",
			Content: `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>` + projectName + `</title>
  </head>
  <body class="m-0 p-0 overflow-hidden bg-black">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
		},
		{
			Path: "src/main.tsx",
			Content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { DeckRenderer } from '@unsa/slides-kit/renderer';
import deckConfig from '../deck.config';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DeckRenderer deck={deckConfig} />
  </React.StrictMode>,
);
`,
		},
		{
			Path: ".slidesrc.json",
			Content: `{
  "slug": "` + slug + `",
  "title": "` + projectName + `",
  "visibility": "private"
}
`,
		},
		{
			Path: "manifest.json",
			Content: `{
  "name": "` + projectName + `",
  "version": "1.0.0",
  "title": "` + projectName + `",
  "description": "A presentation created with unsarep slides",
  "config": {
    "width": 1280,
    "height": 720,
    "transition": "slide",
    "theme": "unsa-dark"
  },
  "slides": [
    {
      "id": "hero",
      "index": 0,
      "title": "` + projectName + `"
    },
    {
      "id": "comparison",
      "index": 1,
      "title": "Arquitectura Modular"
    },
    {
      "id": "bento",
      "index": 2,
      "title": "Ecosistema de Presentaciones"
    },
    {
      "id": "closing",
      "index": 3,
      "title": "¿Preguntas?"
    }
  ]
}
`,
		},
		{
			Path:    "src/slides.tsx",
			Content: slidesTSX(projectName),
		},
		{
			Path:    "README.md",
			Content: readmeMD(projectName),
		},
	}
}

func slidesTSX(projectName string) string {
	return `import React from "react";

export function Presentation() {
  return (
    <div className="reveal">
      <div className="slides">
        <section>
          <h1 className="text-4xl font-bold mb-4">` + projectName + `</h1>
          <p className="text-xl text-gray-400">Created with unsarep slides</p>
        </section>
        <section>
          <h2 className="text-3xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2 text-left">
            <li>Fast local live preview with dev mode</li>
            <li>Instant one-command cloud deployment</li>
            <li>Organization sharing & role management</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
`
}

func readmeMD(projectName string) string {
	var b strings.Builder
	fmt.Fprintf(&b, "# %s\n\n", projectName)
	b.WriteString("Presentation project created with `unsarep slides` and `@unsa/slides-kit`.\n\n")
	b.WriteString("## Development\n\n```bash\n# Preview locally with live reload\nunsarep slides dev\n\n# Deploy to Cloud\nunsarep slides deploy\n```\n")
	return b.String()
}
