// Build step (after astro build): a Workbox service worker that saves the
// whole site on the phone, so every page opens with no signal.
// - Precaches every page, script, style, font and icon in dist/.
// - Never touches /api/*: the shared plan keeps its own copy (src/scripts/store.ts).
// - Pages are served from the phone first; a new deploy installs in the
//   background and takes over straight away (skipWaiting + clientsClaim).
import { generateSW } from 'workbox-build';

const { count, size, warnings } = await generateSW({
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,woff2,svg,png,webmanifest}'],
  globIgnores: ['404.html', 'sw.js'],
  swDest: 'dist/sw.js',
  mode: 'production',
  sourcemap: false,
  inlineWorkboxRuntime: true,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  // /p/mine/?id=…, /places/eat/?zone=…, /add/?day=… are all the same saved page.
  ignoreURLParametersMatching: [/.*/],
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  manifestTransforms: [
    async (entries) => ({
      manifest: entries.map((entry) => {
        // Save pages under the address the site actually uses: /day/x/, not /day/x/index.html.
        const url = `/${entry.url}`.replace(/\/index\.html$/, '/');
        // Files in /_astro/ have a content hash in their name, so the name is the version.
        return { ...entry, url, revision: url.startsWith('/_astro/') ? null : entry.revision };
      }),
      warnings: [],
    }),
  ],
});

for (const w of warnings) console.warn('sw:', w);
console.log(`sw: ${count} files saved for offline, ${(size / 1024 / 1024).toFixed(1)} MB`);
