import { copy, ensureDir, ensureFile, existsSync } from "@std/fs";
import { dirname, join, resolve, toFileUrl } from "@std/path";
import { basename } from "@std/path/unstable-basename";
import { help } from "./help.ts";
import { render } from "./render.ts";
import { type Config, parseConfig } from "./types/Config.ts";
import { fetchAsText } from "./utils/fetchAsText.ts";
import { isFullUrl } from "./utils/isHrefFullUrl.ts";
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
  customStylesheets,
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
  Promise.all(
    config.stylesheets
      .filter((stylsheetUrlOrPath) => !isFullUrl(stylsheetUrlOrPath))
      .map(async (path) => {
        return [
          basename(path),
          await fetchAsText(
            toFileUrl(resolve(
              config.publicDir ?? (() => {
                throw new Error(
                  "`publicDir` is not defined while `stylesheets` is. Please provide `publicDir` so we know where to look up `stylesheets`.",
                );
              })(),
              path,
            )).href,
          ),
        ] as const;
      }),
  ),
]);

async function sha1Short(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-1", data)),
  ).map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 8);
}

const cssContents = new Map<string, string>(
  await Promise.all(([
    [
      "highlightjs.css",
      highlightjsCss,
    ],
    ["normalize.css", normalizeCss],
    ["main.css", mainCss],
    ...customStylesheets,
  ] as const).map(async ([fileName, content]) =>
    [
      `${basename(fileName, ".css")}.${await sha1Short(content)}.css`,
      content,
    ] as const
  )),
);
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
    stylesheetsHtml: [
      ...cssContents.keys().map((n) => `/${n}`),
      ...config.stylesheets.filter(isFullUrl),
    ]
      .map((href) => `<link rel="stylesheet" href="${href}">`)
      .join("\n"),
    bodyHtml,
    ...(config.poweredBy && {
      poweredByHtml: poweredByHtml,
    }),
  });

if (config.publicDir) {
  const publicDir = config.publicDir;
  const skipCopyAbsolutePaths = new Set(
    // skip stylesheets that's defined in config.stylesheets
    config.stylesheets
      .filter((urlOrPath) => !isFullUrl(urlOrPath))
      .map((path) => resolve(publicDir, path)),
  );

  for await (const entry of Deno.readDir(config.publicDir)) {
    if (entry.isSymlink) {
      console.log("symlink in public dir is not supported yet, skipping");
      continue;
    }

    const absolutePath = resolve(config.publicDir, entry.name);

    if (
      skipCopyAbsolutePaths.has(absolutePath)
    ) {
      // `stylesheets` are processed via `cssContents`, ignoring. If css is not listed, procceed to copying it.
      continue;
    }

    if (entry.isFile && entry.name.endsWith(".md")) {
      const nameWithoutExt = basename(absolutePath, ".md");
      const outPath = join(distDir, `${nameWithoutExt}.html`);
      const md = await Deno.readTextFile(absolutePath);
      await ensureFile(outPath);
      await Deno.writeTextFile(
        outPath,
        renderHtmlWithTemplate(
          render(markdownPartial, {
            markdownHtml: renderMarkdown(md),
            className: `${nameWithoutExt}-md`,
          }),
          {
            title: parseTitle(md),
          },
        ),
      );
      continue;
    }

    const outPath = join(distDir, entry.name);
    await (entry.isFile ? ensureFile : ensureDir)(outPath);
    await copy(
      absolutePath,
      outPath,
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
            render(
              isFullUrl(link.href) ? linkExternalPartial : linkInternalPartial,
              {
                title: link.title,
                href: link.href,
              },
            )
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
