// Build step: cut the fonts down to the characters the site can show. Every
// such character lives in /data or /src, so the subsets are complete by
// construction and are regenerated on every build.
//
// - huninn-latin: Huninn (粉圓) for Latin text, with all of Basic Latin,
//   Latin-1 and Latin Extended-A so anything typed in English renders, plus
//   the arrows and symbols the site uses.
// - huninn-tc: Huninn for Chinese, the CJK in src/i18n, data/i18n and the
//   *_zh fields of /data. Huninn draws kanji to Taiwanese conventions, so it
//   never carries Japanese names.
// - zen-maru-{500,700}: Zen Maru Gothic for Japanese, the CJK everywhere else
//   in /data and /src (place names, addresses, Japanese words in English text).
//
// Huninn comes from the Google Fonts TTF in @expo-google-fonts/huninn: the
// only npm copy with every character in one file (Fontsource splits it, and
// its single Chinese file lacks kana and full-width punctuation). Only the
// .ttf is read; none of that package's code runs.
//
// Output (gitignored): src/fonts/*.woff2. The unicode-ranges in
// src/styles/fonts.css must match CJK and SYMBOLS below.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import subsetFont from 'subset-font';

const require = createRequire(import.meta.url);
const SCAN = ['data', 'src'];
const TEXT = new Set(['.json', '.astro', '.ts', '.css', '.md']);
// Kana, CJK punctuation and ideographs, fullwidth forms.
const CJK = /[⺀-⿟　-㏿㐀-䶿一-鿿豈-﫿︰-﹏＀-￯]/u;
// Arrows, symbols and dingbats: drawn by Huninn in either language.
const SYMBOLS = /[←-⇿☀-➿]/u;
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)).join('');
// Basic Latin, Latin-1, Latin Extended-A, and the usual punctuation.
const LATIN = range(0x20, 0x7e) + range(0xa0, 0x17f) + '–—‘’‚“”„†•…‰‹›€™−';

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'fonts') yield* files(path);
    } else if (TEXT.has(extname(entry.name))) yield path;
  }
}

const chinese = new Set();
const japanese = new Set();
const symbols = new Set();
const collect = (text, cjk) => {
  for (const ch of text) {
    if (CJK.test(ch)) cjk.add(ch);
    else if (SYMBOLS.test(ch)) symbols.add(ch);
  }
};
// Data files keep some Chinese inline, in fields named *_zh.
const walkJson = (value, key = '') => {
  if (typeof value === 'string') collect(value, key.endsWith('_zh') ? chinese : japanese);
  else if (Array.isArray(value)) for (const v of value) walkJson(v, key);
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walkJson(v, k);
};
for (const dir of SCAN) {
  for await (const path of files(dir)) {
    const text = await readFile(path, 'utf8');
    if (path.split(sep).includes('i18n')) collect(text, chinese);
    else if (dir === 'data' && extname(path) === '.json') walkJson(JSON.parse(text));
    else collect(text, japanese);
  }
}

async function subset(source, text, out) {
  const font = await subsetFont(await readFile(source), text, { targetFormat: 'woff2' });
  await writeFile(out, font);
  console.log(`fonts: ${out} → ${[...text].length} characters, ${Math.round(font.length / 1024)} KB`);
}

const sorted = (set) => [...set].sort().join('');
const huninn = require.resolve('@expo-google-fonts/huninn/400Regular/Huninn_400Regular.ttf');

await mkdir('src/fonts', { recursive: true });
await subset(huninn, LATIN + sorted(symbols), 'src/fonts/huninn-latin.woff2');
await subset(huninn, sorted(chinese), 'src/fonts/huninn-tc.woff2');
for (const weight of [500, 700]) {
  await subset(
    require.resolve(`@fontsource/zen-maru-gothic/files/zen-maru-gothic-japanese-${weight}-normal.woff2`),
    sorted(japanese),
    `src/fonts/zen-maru-${weight}.woff2`,
  );
}
