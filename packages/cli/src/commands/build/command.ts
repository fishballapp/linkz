import { buildCommand } from '@stricli/core';

export const buildSiteCommand = buildCommand({
  loader: async () => import('./impl.ts'),
  parameters: {
    positional: {
      kind: 'tuple',
      parameters: [
        {
          parse: String,
          brief: 'Path to the linkly config JSON file',
          placeholder: 'config',
        },
      ],
    },
    flags: {
      force: {
        kind: 'boolean',
        brief: 'Overwrite outDir without prompting',
      },
    },
    aliases: {
      f: 'force',
    },
  },
  docs: {
    brief: 'Build the static site from a linkly config file',
  },
});
