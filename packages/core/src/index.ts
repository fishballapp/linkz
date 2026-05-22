import { readdir, readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { render } from './render.ts';
import { type Config, parseConfig } from './types/Config.ts';
import { isFullUrl } from './utils/isHrefFullUrl.ts';
import { parseTitle } from './utils/markdown.ts';
import { createMarkdownRenderer } from './utils/renderMarkdown.ts';

export type { Config, ParseConfigResult } from './types/Config.ts';
export { ConfigSchema, parseConfig } from './types/Config.ts';

const readTemplate = async (relativePath: string, { trim = false } = {}): Promise<string> => {
  const url = new URL(`./templates/${relativePath}`, import.meta.url);
  const text = await readFile(fileURLToPath(url), 'utf8');
  return trim ? text.trim() : text;
};

const sha1Short = async (s: string): Promise<string> => {
  const data = new TextEncoder().encode(s);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', data)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
};

export type BuiltFiles = Map<string, string | Uint8Array>;

export type BuildSiteResult = {
  files: BuiltFiles;
};

export const buildSite = async (
  config: Config,
  { cwd }: { cwd: string },
): Promise<BuildSiteResult> => {
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
    readTemplate('partials/powered-by.html', { trim: true }),
    Promise.all(
      config.stylesheets
        .filter(s => !isFullUrl(s))
        .map(async path => {
          const publicDir = config.publicDir;
          if (!publicDir) {
            throw new Error(
              '`publicDir` is not defined while `stylesheets` is. Please provide `publicDir` so we know where to look up `stylesheets`.',
            );
          }
          const absPath = resolve(cwd, publicDir, path);
          return [basename(path), await readFile(pathToFileURL(absPath), 'utf8')] as const;
        }),
    ),
  ]);

  const cssContents = new Map<string, string>(
    await Promise.all(
      ([['normalize.css', normalizeCss], ['main.css', mainCss], ...customStylesheets] as const).map(
        async ([fileName, content]) =>
          [`${basename(fileName, '.css')}.${await sha1Short(content)}.css`, content] as const,
      ),
    ),
  );

  const renderHtmlWithTemplate = (bodyHtml: string, { title }: { title?: string } = {}): string =>
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
      ...(config.poweredBy && { poweredByHtml }),
    });

  const files: BuiltFiles = new Map();

  if (config.publicDir) {
    const publicDir = resolve(cwd, config.publicDir);
    const skipCopyAbsolutePaths = new Set(
      config.stylesheets.filter(s => !isFullUrl(s)).map(p => resolve(publicDir, p)),
    );
    const renderMarkdown = await createMarkdownRenderer({ langs: config.highlightLangs });
    await walkPublic(publicDir, files, {
      skipCopyAbsolutePaths,
      renderMarkdownPage: (md, nameWithoutExt) =>
        renderHtmlWithTemplate(
          render(markdownPartial, {
            markdownHtml: renderMarkdown(md),
            className: `${nameWithoutExt}-md`,
          }),
          { title: parseTitle(md) },
        ),
    });
  }

  files.set(
    'index.html',
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
  );

  for (const [fileName, content] of cssContents) {
    files.set(fileName, content);
  }

  return { files };
};

type WalkOpts = {
  skipCopyAbsolutePaths: Set<string>;
  renderMarkdownPage: (md: string, nameWithoutExt: string) => string;
};

const walkPublic = async (publicDir: string, files: BuiltFiles, opts: WalkOpts): Promise<void> => {
  for (const entry of await readdir(publicDir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;

    const absPath = resolve(publicDir, entry.name);
    if (opts.skipCopyAbsolutePaths.has(absPath)) continue;

    if (entry.isFile() && entry.name.endsWith('.md')) {
      const nameWithoutExt = basename(absPath, '.md');
      const md = await readFile(absPath, 'utf8');
      files.set(`${nameWithoutExt}.html`, opts.renderMarkdownPage(md, nameWithoutExt));
      continue;
    }

    if (entry.isFile()) {
      files.set(entry.name, await readFile(absPath));
    } else if (entry.isDirectory()) {
      await copyDirRecursive(absPath, entry.name, files);
    }
  }
};

const copyDirRecursive = async (
  absoluteDir: string,
  relPrefix: string,
  files: BuiltFiles,
): Promise<void> => {
  for (const entry of await readdir(absoluteDir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const absPath = resolve(absoluteDir, entry.name);
    const relPath = join(relPrefix, entry.name);
    if (entry.isFile()) {
      files.set(relPath, await readFile(absPath));
    } else if (entry.isDirectory()) {
      await copyDirRecursive(absPath, relPath, files);
    }
  }
};

export const loadConfig = async (configFilePath: string): Promise<Config> => {
  const parseResult = parseConfig(JSON.parse(await readFile(configFilePath, 'utf8')));
  if (!parseResult.success) {
    throw new Error(`Invalid config:\n${parseResult.reasons.map(r => `  - ${r}`).join('\n')}`);
  }
  return parseResult.config;
};
