import { existsSync } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { $ } from 'bun';

const entrypoints = ['./src/index.ts'];

await $`rm -rf dist`;

await Bun.build({
  entrypoints,
  outdir: './dist',
  target: 'node',
  format: 'esm',
  naming: '[dir]/[name].js',
  sourcemap: 'none',
  minify: false,
  external: ['@typescript-eslint/utils'],
});

await $`bunx tsc --project tsconfig.build.json`;

// Rewrite .ts extensions to .js in declaration files so consumers can resolve them.
// TypeScript's rewriteRelativeImportExtensions only rewrites in .js output, not .d.ts.
async function rewriteDeclarationExtensions(directory: string): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      await rewriteDeclarationExtensions(fullPath);
    } else if (entry.name.endsWith('.d.ts')) {
      const content = await readFile(fullPath, 'utf-8');
      const rewritten = content.replace(
        /(?<=(from\s+['"]))(\.\.?\/[^'"]*?)\.ts(?=['"])/g,
        '$2.js',
      );

      if (rewritten !== content) {
        await writeFile(fullPath, rewritten);
      }
    }
  }
}

await rewriteDeclarationExtensions('./dist');

// Build verification
const declarations = await Bun.file('./dist/index.d.ts').text();

if (/from\s+['"][^'"]*\.ts['"]/.test(declarations)) {
  console.error('ERROR: dist/index.d.ts still contains .ts import extensions');
  process.exit(1);
}

for (const leaked of ['dist/__fixtures__', 'dist/test-utilities']) {
  if (existsSync(leaked)) {
    console.error(`ERROR: ${leaked} should not exist in build output`);
    process.exit(1);
  }
}

const { size } = await stat('./dist/index.js');
console.log(`Build complete! Bundle size: ${(size / 1024).toFixed(1)} KB`);
