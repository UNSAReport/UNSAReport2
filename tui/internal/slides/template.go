package slides

import (
	"fmt"
	"strings"
)

// TemplateFile is one scaffolded file of a new slide deck.
type TemplateFile struct {
	Path    string
	Content string
}

// StarterTemplate returns the new-deck scaffold. Command references use the
// merged `unsarep slides` surface, not the legacy standalone CLI.
func StarterTemplate(projectName string) []TemplateFile {
	slug := Slugify(projectName)
	if slug == "" {
		slug = "my-slides"
	}
	return []TemplateFile{
		{
			Path: "package.json",
			Content: `{
  "name": "` + projectName + `",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "unsarep slides dev",
    "deploy": "unsarep slides deploy"
  },
  "dependencies": {
    "@revealjs/react": "^0.2.1",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "reveal.js": "^6.0.1"
  }
}
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
    "theme": "black"
  },
  "slides": [
    {
      "id": "intro",
      "index": 0,
      "title": "Welcome to UNSA Slides",
      "notes": "Welcome slide introducing the topic."
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
	b.WriteString("Presentation project created with `unsarep slides`.\n\n")
	b.WriteString("## Development\n\n```bash\n# Preview locally\nunsarep slides dev\n\n# Deploy to Cloud\nunsarep slides deploy\n```\n")
	return b.String()
}
