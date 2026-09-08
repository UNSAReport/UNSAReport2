import { join } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { getStarterTemplate } from "@/templates/slide-starter";

export async function initCommand(nameArg?: string): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" UNSA Slides CLI ")));

  let projectName = nameArg;
  if (!projectName) {
    const nameResponse = await p.text({
      message: "What is the name of your presentation?",
      placeholder: "my-distributed-systems-presentation",
      validate(value) {
        if (!value.trim()) return "Presentation name is required";
      },
    });

    if (p.isCancel(nameResponse)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    projectName = nameResponse;
  }

  const s = p.spinner();
  s.start(`Scaffolding slide deck in ./${projectName}`);

  const targetDir = join(process.cwd(), projectName);
  const templateFiles = getStarterTemplate(projectName);

  for (const file of templateFiles) {
    const fullPath = join(targetDir, file.path);
    await Bun.write(fullPath, file.content);
  }

  s.stop(`Created presentation project at ${pc.cyan(`./${projectName}`)}`);

  p.note(
    `cd ${projectName}\nslides dev       # Start local preview server\nslides deploy    # Publish to UNSA Slides Cloud`,
    "Next Steps",
  );

  p.outro(pc.green("Happy presenting! ✨"));
}
