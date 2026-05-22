import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { type BundledLanguage, createHighlighter, type Highlighter } from 'shiki';
import type { HighlightLang } from '../types/Config.ts';
import { isFullUrl } from './isHrefFullUrl.ts';

const THEME = 'github-light';

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, c => HTML_ESCAPE[c] ?? c);

const isSafeHref = (href: string): boolean =>
  /^(https?:|mailto:|\/|#|\.)/i.test(href) || !/^[a-z][a-z0-9+.-]*:/i.test(href);

const buildMarked = (highlighter: Highlighter): Marked => {
  const loaded = new Set(highlighter.getLoadedLanguages());

  const marked = new Marked(
    { gfm: true },
    markedHighlight({
      highlight: (code, lang) =>
        highlighter.codeToHtml(code, {
          lang: loaded.has(lang) ? lang : 'text',
          theme: THEME,
        }),
    }),
  );

  marked.use({
    renderer: {
      link({ href, title, text }) {
        const safeHref = isSafeHref(href) ? escapeHtml(href) : '#';
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const externalAttrs = isFullUrl(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${safeHref}"${titleAttr}${externalAttrs}>${text}</a>`;
      },
    },
  });

  return marked;
};

export type MarkdownRenderer = (md: string) => string;

export const createMarkdownRenderer = async ({
  langs,
}: {
  langs: HighlightLang[];
}): Promise<MarkdownRenderer> => {
  const highlighter = await createHighlighter({
    themes: [THEME],
    langs: langs as BundledLanguage[],
  });
  const marked = buildMarked(highlighter);
  return md => marked.parse(md) as string;
};
