import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/bin/linkly.ts'],
  outDir: 'dist/bin',
  format: 'esm',
  clean: true,
  dts: false,
});
