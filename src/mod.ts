import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { help } from './help.ts';
import { render } from './render.ts';
import { type Config, parseConfig } from './types/Config.ts';
import { isFullUrl } from './utils/isHrefFullUrl.ts';
import { parseTitle } from './utils/markdown.ts';
import { renderMarkdown } from './utils/renderMarkdown.ts';

const templateDir = join(import.meta.dirname!, 'templates');

const readTemplate = (relativePath: string, { trim = false } = {}): Promise<string> =>
  readFile(join(templateDir, relativePath), 'utf-8').then(t => (trim ? t.trim() : t));

const getConfig = async (configFilePath: string): Promise<Config> => {
  const parseResult = parseConfig(JSON.parse(await readFile(configFilePath, 'utf-8')));

  if (!parseResult.success) {
    console.error('\x1b[33mError while parsing config:\x1b[0m');
    for (const reason of parseResult.reasons) {
      console.error(`  - ${reason}`);
    }
    process.exit(1);
  }
  return parseResult.config;
};

const confirm = async (message: string): Promise<boolean> => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${message} (y/N) `);
  rl.close();
  return answer.toLowerCase() === 'y';
};

const ensureDistOk = async (distDir: string, { isForce }: { isForce: boolean }): Promise<void> => {
  if (!existsSync(distDir)) return;
  console.error(`\x1b[33mWarning:\x1b[0m \x1b[36m${distDir}\x1b[0m already exists!`);
  if (isForce) {
    console.log(`\x1b[37m--force\x1b[0m detected! Overriding \x1b[36m${distDir}\x1b[0m!`);
  } else {
    if (!(await confirm('Would you like to remove it?'))) {
      console.error('ABORT');
      process.exit(1);
    }
  }

  await rm(distDir, { recursive: true });
  await mkdir(distDir);
};

const args = process.argv.slice(2);
const isForce = args.includes('-f') || args.includes('--force');
const [configFilePath] = args.filter(x => !x.startsWith('-'));
if (!configFilePath) {
  help();
  process.exit(1);
}
const cwd = dirname(configFilePath);
const config = await getConfig(configFilePath);

const distDir = join(cwd, config.outDir);
await ensureDistOk(distDir, { isForce });

const [
  templateHtml,
  gaPartial,
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
  readTemplate('template.html'),
  readTemplate('partials/ga.html'),
  readTemplate('partials/home.html'),
  readTemplate('partials/markdown.html'),
  readTemplate('partials/link-internal.html', { trim: true }),
  readTemplate('partials/link-external.html', { trim: true }),
  readTemplate('partials/favicon.html', { trim: true }),
  readTemplate('main.css'),
  readTemplate('normalize.css'),
  readTemplate('highlightjs.css'),
  readTemplate('partials/powered-by.html', { trim: true }),
  Promise.all(
    config.stylesheets
      .filter(stylesheetUrlOrPath => !isFullUrl(stylesheetUrlOrPath))
      .map(async path => {
        const fullPath = resolve(
          config.publicDir ??
            (() => {
              throw new Error(
                '`publicDir` is not defined while `stylesheets` is. Please provide `publicDir` so we know where to look up `stylesheets`.',
              );
            })(),
          path,
        );
        return [basename(path), await readFile(fullPath, 'utf-8')] as const;
      }),
  ),
]);

async function sha1Short(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', data)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
}

const cssContents = new Map<string, string>(
  await Promise.all(
    (
      [
        ['highlightjs.css', highlightjsCss],
        ['normalize.css', normalizeCss],
        ['main.css', mainCss],
        ...customStylesheets,
      ] as const
    ).map(
      async ([fileName, content]) =>
        [`${basename(fileName, '.css')}.${await sha1Short(content)}.css`, content] as const,
    ),
  ),
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
    faviconHtml: config.favicon ? render(faviconPartial, { favicon: config.favicon }) : '',
    gaHtml: config.ga ? render(gaPartial, { gaId: config.ga }) : '',
    title: typeof title === 'string' ? `${title} | ${config.name}` : config.name,
    stylesheetsHtml: [
      ...cssContents.keys().map(n => `/${n}`),
      ...config.stylesheets.filter(isFullUrl),
    ]
      .map(href => `<link rel="stylesheet" href="${href}">`)
      .join('\n'),
    bodyHtml,
    ...(config.poweredBy && {
      poweredByHtml: poweredByHtml,
    }),
  });

if (config.publicDir) {
  const publicDir = config.publicDir;
  const skipCopyAbsolutePaths = new Set(
    config.stylesheets
      .filter(urlOrPath => !isFullUrl(urlOrPath))
      .map(path => resolve(publicDir, path)),
  );

  const entries = await readdir(config.publicDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      console.log('symlink in public dir is not supported yet, skipping');
      continue;
    }

    const absolutePath = resolve(config.publicDir, entry.name);

    if (skipCopyAbsolutePaths.has(absolutePath)) {
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      const nameWithoutExt = basename(absolutePath, '.md');
      const outPath = join(distDir, `${nameWithoutExt}.html`);
      const md = await readFile(absolutePath, 'utf-8');
      await mkdir(dirname(outPath), { recursive: true });
      await writeFile(
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
    await cp(absolutePath, outPath, { recursive: true });
  }
}

await Promise.all([
  writeFile(
    join(distDir, 'index.html'),
    renderHtmlWithTemplate(
      render(homePartial, {
        name: config.name,
        profilePicture: config.profilePicture,
        linksHtml: config.links
          .map(link =>
            render(isFullUrl(link.href) ? linkExternalPartial : linkInternalPartial, {
              title: link.title,
              href: link.href,
            }),
          )
          .join(''),
      }),
    ),
  ),
  ...cssContents
    .entries()
    .map(([fileName, content]) => writeFile(join(distDir, fileName), content)),
]);

console.log(`\x1b[32mYour linkz website is ready at \x1b[36m${distDir}\x1b[32m!\x1b[0m`);
