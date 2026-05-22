import { cp } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

await cp(resolve(root, 'src/templates'), resolve(root, 'dist/templates'), { recursive: true });
