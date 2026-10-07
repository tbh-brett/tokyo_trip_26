// Build step: cut IBM Plex Sans JP down to the Japanese characters the site
// can actually show. Every such character lives in /data or /src, so the
// subset is complete by construction and is regenerated on every build.
// Chinese text (data/i18n, src/i18n) is skipped: it uses the phone's own
// Traditional Chinese font, since Plex Sans JP draws Japanese glyph shapes.
// Output: src/fonts/plex-sans-jp-{400,500,700}.woff2 and the Latin files
// copied to src/fonts/plex-latin-{400,500,700}.woff2 (all gitignored).
import { copyFile, readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
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
      if (entry.name !== 'fonts' && entry.name !== 'i18n') yield* files(path);
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
  // Latin: one file per weight, served under two family names in fonts.css.
  await copyFile(
    require.resolve(`@fontsource/ibm-plex-sans-jp/files/ibm-plex-sans-jp-latin-${weight}-normal.woff2`),
    `src/fonts/plex-latin-${weight}.woff2`,
  );
}
