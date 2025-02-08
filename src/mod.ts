import { existsSync } from "@std/fs";
import { dirname, fromFileUrl, join } from "@std/path";
import { help } from "./help.ts";
import { render } from "./render.ts";
import { type Config, parseConfig } from "./types/Config.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

if (!import.meta.main) {
  throw new Error("This script is meant as a CLI. Bye.");
}

const getConfig = async (configFilePath: string): Promise<Config> => {
  const parseResult = parseConfig(
    JSON.parse(await Deno.readTextFile(configFilePath)),
  );

  if (parseResult.success === false) {
    console.error("%cError while parsing config:", "color: yellow");
    for (const reason of parseResult.reasons) {
      console.error(`  - ${reason}%c`, "color: white", "", "", "", "");
    }
    Deno.exit(1);
  }
  return parseResult.config;
};

const ensureDistOk = async (distDir: string): Promise<void> => {
  if (!existsSync(distDir)) return;
  console.error(
    `%cWarning: %c${distDir}%c already exists!`,
    "color: yellow",
    "color: cyan",
    "",
  );
  if (!confirm("Would you like to remove it?")) {
    console.error("ABORT");
    Deno.exit(1);
  }

  await Deno.remove(distDir, { recursive: true });
};

const [configFilePath] = Deno.args;
if (!configFilePath) {
  help();
  Deno.exit(1);
}
const config = await getConfig(configFilePath);

const distDir = `${dirname(configFilePath)}/dist`;
await ensureDistOk(distDir);

const [indexHtml, linkPartial] = await Promise.all([
  Deno.readTextFile(join(__dirname, "templates/index.html")),
  Deno.readTextFile(join(__dirname, "templates/partials/link.html")),
]);

await Deno.mkdir(distDir);

await Promise.all([
  Deno.writeTextFile(
    `${distDir}/index.html`,
    render(indexHtml, {
      name: config.name,
      links: config.links.map((link) => render(linkPartial, link)).join(""),
    }),
  ),
  Deno.copyFile(
    join(__dirname, "templates/main.css"),
    `${distDir}/main.css`,
  ),
]);

console.log(
  `%cYour linkz website is ready at %c${distDir}!`,
  "color: green",
  "color: cyan",
);
