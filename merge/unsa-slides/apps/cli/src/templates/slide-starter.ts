export interface TemplateFile {
  path: string;
  content: string;
}

export function getStarterTemplate(projectName: string): TemplateFile[] {
  return [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: projectName,
          version: "1.0.0",
          private: true,
          type: "module",
          scripts: {
            dev: "slides dev",
            deploy: "slides deploy",
          },
          dependencies: {
            "@revealjs/react": "^0.2.1",
            react: "^19.2.8",
            "react-dom": "^19.2.8",
            "reveal.js": "^6.0.1",
          },
        },
        null,
        2,
      ),
    },
    {
      path: ".slidesrc.json",
      content: JSON.stringify(
        {
          slug: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          title: projectName,
          visibility: "private",
        },
        null,
        2,
      ),
    },
    {
      path: "manifest.json",
      content: JSON.stringify(
        {
          name: projectName,
          version: "1.0.0",
          title: projectName,
          description: "A presentation created with UNSA Slides",
          config: {
            width: 1280,
            height: 720,
            transition: "slide",
            theme: "black",
          },
          slides: [
            {
              id: "intro",
              index: 0,
              title: "Welcome to UNSA Slides",
              notes: "Welcome slide introducing the topic.",
            },
          ],
        },
        null,
        2,
      ),
    },
    {
      path: "src/slides.tsx",
      content: `import React from "react";

export function Presentation() {
  return (
    <div className="reveal">
      <div className="slides">
        <section>
          <h1 className="text-4xl font-bold mb-4">${projectName}</h1>
          <p className="text-xl text-gray-400">Created with UNSA Slides CLI</p>
        </section>
        <section>
          <h2 className="text-3xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2 text-left">
            <li>⚡ Fast local live preview with dev mode</li>
            <li>☁️ Instant one-command cloud deployment</li>
            <li>👥 Organization sharing & role management</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
`,
    },
    {
      path: "README.md",
      content: `# ${projectName}

Presentation project created with [UNSA Slides](https://github.com).

## Development

\`\`\`bash
# Preview locally
slides dev

# Deploy to Cloud
slides deploy
\`\`\`
`,
    },
  ];
}
