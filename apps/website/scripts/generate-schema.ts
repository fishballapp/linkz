import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigSchema } from '@linksite/core';
import { z } from 'zod';

const schema = {
  $schema: 'https://json-schema.org/draft-07/schema',
  ...z.toJSONSchema(ConfigSchema, { target: 'draft-7' }),
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../public/config-schema.json');

await writeFile(out, `${JSON.stringify(schema, null, 2)}\n`);
console.log(`Wrote ${out}`);
