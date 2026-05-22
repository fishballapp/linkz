import { bundledLanguages } from 'shiki';
import { z } from 'zod';

const HighlightLang = z.enum(Object.keys(bundledLanguages) as [string, ...string[]]);

export type HighlightLang = z.infer<typeof HighlightLang>;

export const ConfigSchema = z.object({
  outDir: z.string().describe('Path to the output directory (relative to config file directory).'),
  publicDir: z
    .string()
    .optional()
    .describe('Path to the public directory (relative to config file directory).'),
  poweredBy: z
    .boolean()
    .default(true)
    .describe('Whether to show the "Powered by linksite" footer (default: true).'),
  favicon: z
    .string()
    .optional()
    .describe('URL or path to the favicon (path is relative to `publicDir`).'),
  ga: z.string().optional().describe('Google Analytics tracking id, e.g. G-XXXXXXXXXX.'),
  profilePicture: z
    .string()
    .describe('URL or path to the profile picture (path is relative to `publicDir`).'),
  name: z.string().describe('Site name, displayed in <title> and on the home page.'),
  stylesheets: z
    .string()
    .array()
    .default([])
    .describe('Extra stylesheets — URLs or paths relative to `publicDir`.'),
  highlightLangs: HighlightLang.array()
    .default(['javascript', 'typescript', 'python', 'bash', 'json', 'html', 'css', 'markdown'])
    .describe(
      'Languages to load for syntax highlighting in code blocks. Code blocks with unlisted languages render as plain text. See https://shiki.style/languages.',
    ),
  links: z
    .array(
      z.object({
        title: z.string(),
        href: z.string(),
      }),
    )
    .describe('Links shown on the home page.'),
});

export type Config = z.infer<typeof ConfigSchema>;

export type ParseConfigResult =
  | { success: true; config: Config }
  | { success: false; reasons: string[] };

export const parseConfig = (c: unknown): ParseConfigResult => {
  const parsed = ConfigSchema.safeParse(c);
  if (!parsed.success) {
    return {
      success: false,
      reasons: parsed.error.issues.map(i => `${i.path.join('.') || '<root>'}: ${i.message}`),
    };
  }
  return { success: true, config: parsed.data };
};
