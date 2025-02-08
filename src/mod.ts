import { existsSync } from "@std/fs";
import { dirname } from "@std/path";
import { help } from "./help.ts";
import { render } from "./render.ts";
import { type Config, parseConfig } from "./types/Config.ts";
console.log(import.meta.url);

const fetchAsText = async (url: string): Promise<string> => {
  const res = await fetch(url);
  return await res.text();
};

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

const ensureDistOk = async (
  distDir: string,
  { isForce }: { isForce: boolean },
): Promise<void> => {
  if (!existsSync(distDir)) return;
  console.error(
    `%cWarning: %c${distDir}%c already exists!`,
    "color: yellow",
    "color: cyan",
    "",
  );
  if (isForce) {
    console.log(
      `%c--force%c detected! Overriding %c${distDir}%c!`,
      "color: white",
      "",
      "color: cyan",
      "",
    );
  } else {
    if (!confirm("Would you like to remove it?")) {
      console.error("ABORT");
      Deno.exit(1);
    }
  }

  await Deno.remove(distDir, { recursive: true });
};

const isForce = Deno.args.includes("-f") || Deno.args.includes("--force");
const [configFilePath] = Deno.args.filter((x) => !x.startsWith("-"));
if (!configFilePath) {
  help();
  Deno.exit(1);
}
const config = await getConfig(configFilePath);

const distDir = `${dirname(configFilePath)}/dist`;
await ensureDistOk(distDir, { isForce });

const [indexHtml, linkPartial, mainCss] = await Promise.all([
  fetchAsText(import.meta.resolve("./templates/index.html")),
  fetchAsText(import.meta.resolve("./templates/partials/link.html")),
  fetchAsText(import.meta.resolve("./templates/main.css")),
]);

await Deno.mkdir(distDir);

await Promise.all([
  Deno.writeTextFile(
    `${distDir}/index.html`,
    render(indexHtml, {
      name: config.name,
      links: config.links.map((link) => render(linkPartial, link)).join(""),
      profilePicture: config.profilePicture,
    }),
  ),
  Deno.writeTextFile(
    `${distDir}/main.css`,
    mainCss,
  ),
]);

console.log(
  `%cYour linkz website is ready at %c${distDir}!`,
  "color: green",
  "color: cyan",
);
