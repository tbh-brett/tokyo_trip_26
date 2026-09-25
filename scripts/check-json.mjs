// Fail the build on malformed JSON in /data. Astro's file loader only logs a
// parse error and carries on with the last good data, which would deploy stale
// or empty content without anyone noticing.
import { readdir, readFile } from 'node:fs/promises';

let bad = 0;
for (const name of (await readdir('data')).filter((f) => f.endsWith('.json'))) {
  try {
    JSON.parse(await readFile(`data/${name}`, 'utf8'));
  } catch (error) {
    bad++;
    console.error(`data/${name}: ${error.message}`);
  }
}
if (bad) {
  console.error(`\n${bad} data file(s) are not valid JSON. Nothing was deployed.`);
  process.exit(1);
}
console.log('data: JSON ok');
