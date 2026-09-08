import { Command } from "commander";
import pc from "picocolors";
import { deployCommand } from "@/commands/deploy";
import { devCommand } from "@/commands/dev";
import { initCommand } from "@/commands/init";
import { linkCommand } from "@/commands/link";
import { loginCommand } from "@/commands/login";
import { getGlobalConfig } from "@/lib/config";

const program = new Command();

program
  .name("slides")
  .description("UNSA Slides CLI - Author, Preview, and Deploy Slides to Cloud")
  .version("0.1.0");

program
  .command("init")
  .description("Scaffold a new slide presentation project")
  .argument("[name]", "Name of the presentation project")
  .action(async (name) => {
    await initCommand(name);
  });

program
  .command("dev")
  .description("Start local development server with live slide preview")
  .option("-p, --port <port>", "Port for local preview server", "4000")
  .action(async (options) => {
    await devCommand(options);
  });

program
  .command("login")
  .description("Authenticate CLI with UNSA Slides Cloud")
  .action(async () => {
    await loginCommand();
  });

program
  .command("link")
  .description("Link local directory to a cloud presentation slug/organization")
  .action(async () => {
    await linkCommand();
  });

program
  .command("deploy")
  .description("Bundle and deploy slides to UNSA Slides Cloud")
  .action(async () => {
    await deployCommand();
  });

program
  .command("whoami")
  .description("Check current authenticated user and cloud endpoint")
  .action(async () => {
    const config = await getGlobalConfig();
    console.log(pc.cyan("\nUNSA Slides Cloud Status:"));
    console.log(`  API Endpoint: ${pc.bold(config.apiUrl)}`);
    if (config.user) {
      console.log(
        `  User:         ${pc.bold(config.user.name)} (${config.user.email})`,
      );
      console.log(`  Token:        ${pc.green("Active")}\n`);
    } else {
      console.log(
        `  Auth:         ${pc.yellow("Not logged in. Run 'slides login'")}\n`,
      );
    }
  });

program.parse(process.argv);
