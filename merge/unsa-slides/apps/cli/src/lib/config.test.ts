import { describe, expect, it } from "vitest";
import {
  getGlobalConfig,
  getProjectConfig,
  saveProjectConfig,
} from "@/lib/config";

describe("CLI Config Management", () => {
  it("should read default global config if none exists", async () => {
    const config = await getGlobalConfig();
    expect(config).toBeDefined();
    expect(config.apiUrl).toContain("http");
  });

  it("should save and retrieve project configuration in memory / fs", async () => {
    const project = {
      slug: "test-deck-slug",
      title: "Test Deck Title",
      description: "A test deck for CLI tests",
      visibility: "public" as const,
    };

    await saveProjectConfig(project);
    const loaded = await getProjectConfig();

    expect(loaded).toBeDefined();
    expect(loaded?.slug).toBe("test-deck-slug");
    expect(loaded?.title).toBe("Test Deck Title");

    // Clean up .slidesrc.json in current directory
    try {
      const file = Bun.file(`${process.cwd()}/.slidesrc.json`);
      if (await file.exists()) {
        const { unlinkSync } = await import("node:fs");
        unlinkSync(`${process.cwd()}/.slidesrc.json`);
      }
    } catch {
      // ignore
    }
  });
});
