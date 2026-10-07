// Fail the build on malformed JSON in /data (including data/i18n). Astro's
// file loader only logs a parse error and carries on with the last good data,
// which would deploy stale or empty content without anyone noticing.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

let bad = 0;
let checked = 0;
for (const entry of await readdir('data', { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
  const path = join(entry.parentPath, entry.name);
  checked++;
  try {
    JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    bad++;
    console.error(`${path}: ${error.message}`);
  }
}
if (bad) {
  console.error(`\n${bad} data file(s) are not valid JSON. Nothing was deployed.`);
  process.exit(1);
}
console.log(`data: JSON ok (${checked} files)`);
