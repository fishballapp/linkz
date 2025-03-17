import { copy, ensureFile, existsSync } from "@std/fs";
import { basename, dirname, join } from "@std/path";
import { help } from "./help.ts";
import { render } from "./render.ts";
import { type Config, parseConfig } from "./types/Config.ts";
import { fetchAsText } from "./utils/fetchAsText.ts";
import { parseTitle } from "./utils/markdown.ts";
import { renderMarkdown } from "./utils/renderMarkdown.ts";

if (!import.meta.main) {
  throw new Error("This script is meant as a CLI. Bye.");
}

const getConfig = async (configFilePath: string): Promise<Config> => {
  const parseResult = parseConfig(
    JSON.parse(await Deno.readTextFile(configFilePath)),
  );

  if (!parseResult.success) {
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
  await Deno.mkdir(distDir);
};

const isForce = Deno.args.includes("-f") || Deno.args.includes("--force");
const [configFilePath] = Deno.args.filter((x) => !x.startsWith("-"));
if (!configFilePath) {
  help();
  Deno.exit(1);
}
const cwd = dirname(configFilePath);
const config = await getConfig(configFilePath);

const distDir = join(cwd, config.outDir);
await ensureDistOk(distDir, { isForce });

const [
  templateHtml,
  homePartial,
  markdownPartial,
  linkInternalPartial,
  linkExternalPartial,
  faviconPartial,
  mainCss,
  normalizeCss,
  highlightjsCss,
  poweredByHtml,
] = await Promise.all([
  fetchAsText(import.meta.resolve("./templates/template.html")),
  fetchAsText(import.meta.resolve("./templates/partials/home.html")),
  fetchAsText(import.meta.resolve("./templates/partials/markdown.html")),
  fetchAsText(
    import.meta.resolve("./templates/partials/link-internal.html"),
    { trim: true },
  ),
  fetchAsText(
    import.meta.resolve("./templates/partials/link-external.html"),
    { trim: true },
  ),
  fetchAsText(
    import.meta.resolve("./templates/partials/favicon.html"),
    { trim: true },
  ),
  fetchAsText(import.meta.resolve("./templates/main.css")),
  fetchAsText(import.meta.resolve("./templates/normalize.css")),
  fetchAsText(import.meta.resolve("./templates/highlightjs.css")),
  fetchAsText(import.meta.resolve("./templates/partials/powered-by.html"), {
    trim: true,
  }),
]);

const cssContents = new Map<string, string>([
  ["highlightjs.css", highlightjsCss],
  ["normalize.css", normalizeCss],
  ["main.css", mainCss],
]);
const renderHtmlWithTemplate = (
  bodyHtml: string,
  {
    title,
  }: {
    title?: string;
  } = {},
) =>
  render(templateHtml, {
    faviconHtml: config.favicon
      ? render(faviconPartial, { favicon: config.favicon })
      : "",
    title: typeof title === "string"
      ? `${title} | ${config.name}`
      : config.name,
    stylesheetsHtml: cssContents
      .keys()
      .map((fileName) => `<link rel="stylesheet" href="./${fileName}">`)
      .toArray()
      .join("\n"),
    bodyHtml,
    ...(config.poweredBy && {
      poweredByHtml: poweredByHtml,
    }),
  });

if (config.publicDir) {
  for await (const entry of Deno.readDir(config.publicDir)) {
    const path = join(config.publicDir, entry.name);
    if (entry.isFile && entry.name.endsWith(".md")) {
      const outPath = join(distDir, `${basename(path, ".md")}.html`);
      const md = await Deno.readTextFile(path);
      await ensureFile(outPath);
      await Deno.writeTextFile(
        outPath,
        renderHtmlWithTemplate(
          render(markdownPartial, {
            markdownHtml: renderMarkdown(md),
          }),
          {
            title: parseTitle(md),
          },
        ),
      );
      continue;
    }
    await copy(
      path,
      join(distDir, entry.name),
      { overwrite: true },
    );
  }
}

await Promise.all([
  Deno.writeTextFile(
    join(distDir, "index.html"),
    renderHtmlWithTemplate(
      render(homePartial, {
        name: config.name,
        profilePicture: config.profilePicture,
        linksHtml: config.links
          .map((link) =>
            render(link.external ? linkExternalPartial : linkInternalPartial, {
              title: link.title,
              href: link.href,
            })
          )
          .join(""),
      }),
    ),
  ),
  ...cssContents.entries().map(([fileName, content]) =>
    Deno.writeTextFile(
      join(distDir, fileName),
      content,
    )
  ),
]);

console.log(
  `%cYour linkz website is ready at %c${distDir}!`,
  "color: green",
  "color: cyan",
);
