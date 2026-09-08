import * as p from "@clack/prompts";
import pc from "picocolors";
import { getProjectConfig, saveProjectConfig } from "@/lib/config";

export async function linkCommand(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" UNSA Slides - Link Presentation ")));

  const current = (await getProjectConfig()) || {
    slug: "my-slides",
    title: "My Presentation",
  };

  const title = await p.text({
    message: "Presentation Title:",
    initialValue: current.title,
    validate(val) {
      if (!val.trim()) return "Title is required";
    },
  });

  if (p.isCancel(title)) {
    p.cancel("Link cancelled.");
    process.exit(0);
  }

  const slug = await p.text({
    message: "Presentation Slug (URL friendly identifier):",
    initialValue: current.slug,
    validate(val) {
      if (!/^[a-z0-9-]+$/.test(val)) {
        return "Slug must only contain lowercase letters, numbers, and hyphens";
      }
    },
  });

  if (p.isCancel(slug)) {
    p.cancel("Link cancelled.");
    process.exit(0);
  }

  const orgSlug = await p.text({
    message: "Organization Slug (optional, leave empty for personal):",
    initialValue: current.orgSlug || "",
  });

  if (p.isCancel(orgSlug)) {
    p.cancel("Link cancelled.");
    process.exit(0);
  }

  const visibility = await p.select({
    message: "Visibility:",
    initialValue: current.visibility || "private",
    options: [
      { value: "private", label: "Private (Only you/members)" },
      { value: "org", label: "Organization (All organization members)" },
      { value: "unlisted", label: "Unlisted (Anyone with link)" },
      { value: "public", label: "Public (Discoverable)" },
    ],
  });

  if (p.isCancel(visibility)) {
    p.cancel("Link cancelled.");
    process.exit(0);
  }

  await saveProjectConfig({
    title,
    slug,
    orgSlug: orgSlug.trim() || undefined,
    visibility: visibility as "private" | "org" | "public" | "unlisted",
  });

  p.outro(pc.green("✨ Linked presentation project to .slidesrc.json"));
}
