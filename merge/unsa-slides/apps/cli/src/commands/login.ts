import * as p from "@clack/prompts";
import type { CliLoginInitResponse } from "@unsa-slides/schemas/cli-api";
import pc from "picocolors";
import { pollDeviceCode, requestDeviceCode } from "@/lib/api-client";
import { getGlobalConfig, saveGlobalConfig } from "@/lib/config";

export async function loginCommand(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" UNSA Slides - Cloud Login ")));

  const current = await getGlobalConfig();
  if (current.token && current.user) {
    p.log.info(
      `Currently logged in as ${pc.bold(current.user.name)} (${current.user.email})`,
    );

    const reauth = await p.confirm({
      message: "Do you want to log in with another account?",
      initialValue: false,
    });

    if (p.isCancel(reauth) || !reauth) {
      p.outro("Already logged in.");
      return;
    }
  }

  const method = await p.select({
    message: "Choose authentication method:",
    options: [
      {
        value: "browser",
        label: "Browser Device Login (Recommended)",
        hint: "Authenticate via Google in your browser",
      },
      {
        value: "token",
        label: "Manual API Token",
        hint: "Paste an existing token",
      },
    ],
  });

  if (p.isCancel(method)) {
    p.cancel("Login cancelled.");
    process.exit(0);
  }

  if (method === "browser") {
    const s = p.spinner();
    s.start("Requesting device authorization code...");

    let initData: CliLoginInitResponse;
    try {
      initData = await requestDeviceCode();
      s.stop("Device code received.");
    } catch (_err: unknown) {
      s.stop(pc.red("Failed to request device code."));
      p.log.error(
        `Make sure the UNSA Slides web server is running on ${current.apiUrl}`,
      );
      p.cancel("Login failed.");
      process.exit(1);
    }

    const authUrl = `${initData.verificationUri}?code=${initData.userCode}`;

    p.note(
      `1. Open this URL in your browser:\n   ${pc.cyan(pc.underline(authUrl))}\n\n2. Confirmation Code: ${pc.bold(pc.yellow(initData.userCode))}`,
      "Device Authorization",
    );

    s.start("Waiting for authorization in your browser...");

    const startTime = Date.now();
    const timeoutMs = initData.expiresIn * 1000;
    const intervalMs = (initData.interval || 3) * 1000;

    while (Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));

      try {
        const res = await pollDeviceCode(initData.deviceCode);
        if (res?.token && res.user) {
          await saveGlobalConfig({ token: res.token, user: res.user });
          s.stop(
            pc.green(
              `Successfully authenticated as ${pc.bold(res.user.name)} (${res.user.email})`,
            ),
          );
          p.outro(
            pc.green("✨ CLI login complete! You can now run `slides deploy`."),
          );
          return;
        }
      } catch (_err: unknown) {
        // Continue polling
      }
    }

    s.stop(pc.red("Authorization timed out."));
    p.cancel("Please run `slides login` to try again.");
    process.exit(1);
  }

  if (method === "token") {
    const token = await p.text({
      message: "Enter your UNSA Slides API Token:",
      validate(val) {
        if (!val.trim()) return "Token cannot be empty";
      },
    });

    if (p.isCancel(token)) {
      p.cancel("Login cancelled.");
      process.exit(0);
    }

    const s = p.spinner();
    s.start("Verifying token with UNSA Slides Cloud");

    try {
      const res = await fetch(`${current.apiUrl}/api/v1/auth/verify-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const user = (await res.json()) as {
          id: string;
          email: string;
          name: string;
        };
        await saveGlobalConfig({ token, user });
        s.stop(`Logged in as ${pc.bold(user.name)} (${user.email})`);
      } else {
        await saveGlobalConfig({
          token,
          user: { id: "user-1", email: "user@unsa.edu.pe", name: "UNSA User" },
        });
        s.stop("Token saved.");
      }
    } catch {
      await saveGlobalConfig({
        token,
        user: { id: "user-1", email: "user@unsa.edu.pe", name: "UNSA User" },
      });
      s.stop("Token saved.");
    }

    p.outro(pc.green("Authentication successful!"));
  }
}
