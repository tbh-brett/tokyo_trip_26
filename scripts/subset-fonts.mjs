// Build step: cut IBM Plex Sans JP down to the Japanese characters the site
// can actually show. Every such character lives in /data or /src, so the
// subset is complete by construction and is regenerated on every build.
// Output: src/fonts/plex-sans-jp-{400,500,700}.woff2 (gitignored).
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
import subsetFont from 'subset-font';

const require = createRequire(import.meta.url);
const WEIGHTS = [400, 500, 700];
const SCAN = ['data', 'src'];
const TEXT = new Set(['.json', '.astro', '.ts', '.css', '.md']);
// Arrows and symbols, kana, CJK punctuation and ideographs, fullwidth forms.
// Must match the unicode-range in src/styles/fonts.css.
const JAPANESE = /[←-⇿☀-⛿⺀-⿟　-㏿㐀-䶿一-鿿豈-﫿︰-﹏＀-￯]/u;

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'fonts') yield* files(path);
    } else if (TEXT.has(extname(entry.name))) yield path;
  }
}

const chars = new Set();
for (const dir of SCAN) {
  for await (const path of files(dir)) {
    for (const ch of await readFile(path, 'utf8')) if (JAPANESE.test(ch)) chars.add(ch);
  }
}
const text = [...chars].sort().join('');

await mkdir('src/fonts', { recursive: true });
for (const weight of WEIGHTS) {
  const source = require.resolve(`@fontsource/ibm-plex-sans-jp/files/ibm-plex-sans-jp-japanese-${weight}-normal.woff2`);
  const subset = await subsetFont(await readFile(source), text, { targetFormat: 'woff2' });
  await writeFile(`src/fonts/plex-sans-jp-${weight}.woff2`, subset);
  console.log(`fonts: ${weight} → ${chars.size} glyphs, ${Math.round(subset.length / 1024)} KB`);
}
