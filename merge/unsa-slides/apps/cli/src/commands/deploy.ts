import { join } from "node:path";
import * as p from "@clack/prompts";
import { SlideManifestSchema } from "@unsa-slides/schemas/manifest";
import pc from "picocolors";
import { deployPresentation } from "@/lib/api-client";
import { getProjectConfig } from "@/lib/config";

export async function deployCommand(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" UNSA Slides - Deploy to Cloud ")));

  const project = await getProjectConfig();
  if (!project) {
    p.cancel(
      "No .slidesrc.json found. Run 'slides link' or 'slides init' first.",
    );
    process.exit(1);
  }

  const manifestFile = Bun.file(join(process.cwd(), "manifest.json"));
  if (!(await manifestFile.exists())) {
    p.cancel("No manifest.json found in current directory.");
    process.exit(1);
  }

  const rawManifest = await manifestFile.json();
  const parseResult = SlideManifestSchema.safeParse(rawManifest);

  if (!parseResult.success) {
    p.cancel(`Invalid manifest.json: ${parseResult.error.message}`);
    process.exit(1);
  }

  const manifest = parseResult.data;

  const s = p.spinner();
  s.start("Bundling presentation assets...");

  // Bundle slide files
  const slidesFile = Bun.file(join(process.cwd(), "src/slides.tsx"));
  let bundleContent = "";
  if (await slidesFile.exists()) {
    bundleContent = await slidesFile.text();
  }

  s.message("Uploading slide deck to UNSA Slides Cloud...");

  try {
    const response = await deployPresentation({
      slug: project.slug,
      title: project.title,
      description: project.description || manifest.description,
      orgSlug: project.orgSlug,
      visibility: project.visibility || "private",
      manifest,
      bundle: Buffer.from(bundleContent).toString("base64"),
    });

    s.stop(`Deployment complete! Version v${response.version}`);

    p.note(
      `Viewer URL:    ${pc.cyan(response.url)}\nPresenter URL: ${pc.cyan(`${response.url}/present`)}`,
      "Live Presentation Links",
    );

    p.outro(pc.green("🎉 Published successfully!"));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    s.stop(pc.red("Deployment failed."));
    p.cancel(message);
    process.exit(1);
  }
}
