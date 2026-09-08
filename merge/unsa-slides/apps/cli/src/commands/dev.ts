import { join } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { getProjectConfig } from "@/lib/config";

export async function devCommand(options: { port?: string }): Promise<void> {
  const port = Number(options.port) || 4000;
  const project = await getProjectConfig();

  p.intro(pc.bgCyan(pc.black(" UNSA Slides - Dev Preview ")));

  const manifestFile = Bun.file(join(process.cwd(), "manifest.json"));
  let title = "UNSA Slides Preview";
  if (await manifestFile.exists()) {
    try {
      const manifest = await manifestFile.json();
      title = manifest.title || title;
    } catch {
      // fallback
    }
  }

  p.log.info(`Deck: ${pc.bold(project?.title || title)}`);
  p.log.info(`Local Server: ${pc.cyan(`http://localhost:${port}`)}`);

  const _server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/" || url.pathname === "/index.html") {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} (Dev Preview)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white">
  <div class="reveal">
    <div class="slides">
      <section>
        <h1 class="text-4xl font-bold mb-4">${title}</h1>
        <p class="text-xl text-slate-400">UNSA Slides Local Preview</p>
      </section>
      <section>
        <h2 class="text-3xl font-semibold mb-4">Local Preview Mode</h2>
        <p class="text-lg text-slate-300">Edit your slides and reload to see updates.</p>
        <p class="mt-4 text-sm text-cyan-400">Run 'slides deploy' when ready to publish to Cloud.</p>
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
</html>`;
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      }

      const filePath = join(process.cwd(), url.pathname.slice(1));
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  p.note(`Press Ctrl+C to stop the preview server.`, "Live Preview Running");
}
