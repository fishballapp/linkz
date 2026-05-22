import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { confirm, isCancel } from '@clack/prompts';
import { buildSite, loadConfig } from '@linksite/core';
import pc from 'picocolors';

const ensureDistOk = async (distDir: string, { force }: { force: boolean }): Promise<void> => {
  if (!existsSync(distDir)) return;

  console.error(`${pc.yellow('Warning:')} ${pc.cyan(distDir)} already exists!`);

  if (force) {
    console.log(`${pc.bold('--force')} detected. Overriding ${pc.cyan(distDir)}.`);
  } else {
    if (!process.stdin.isTTY) {
      console.error(
        'ABORT: outDir exists and stdin is not a TTY. Re-run with --force to overwrite.',
      );
      process.exit(1);
    }
    const ok = await confirm({ message: 'Remove it?', initialValue: false });
    if (isCancel(ok) || !ok) {
      console.error('ABORT');
      process.exit(1);
    }
  }

  await rm(distDir, { recursive: true, force: true });
};

export default async ({ force }: { force: boolean }, configFilePath: string): Promise<void> => {
  const cwd = dirname(resolve(configFilePath));
  const config = await loadConfig(configFilePath);
  const distDir = resolve(cwd, config.outDir);

  await ensureDistOk(distDir, { force });
  await mkdir(distDir, { recursive: true });

  const { files } = await buildSite(config, { cwd });

  await Promise.all(
    [...files].map(async ([relPath, content]) => {
      const outPath = join(distDir, relPath);
      await mkdir(dirname(outPath), { recursive: true });
      await writeFile(outPath, content);
    }),
  );

  console.log(`${pc.green('Your linksite website is ready at')} ${pc.cyan(distDir)}!`);
};
