// The Worker. Pages are static files; this only handles /api/*.
// Cloudflare Access sits in front of everything, so every request that
// reaches this code is already signed in as Brett or Clara.
import type { Envelope } from '../src/lib/plan';

export { TripStore } from './trip-store';

const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...HEADERS, 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    const store = env.TRIP.getByName('trip');
    try {
      if (url.pathname === '/api/state' && request.method === 'GET') {
        const since = Number(url.searchParams.get('since') ?? '-1');
        const state = await store.read(Number.isFinite(since) ? since : -1);
        return state ? json(state) : new Response(null, { status: 204, headers: HEADERS });
      }

      if (url.pathname === '/api/ops' && request.method === 'POST') {
        // Only this site's own pages may write. A custom header and a JSON body
        // force a CORS preflight from any other site, and nothing here answers one.
        const origin = request.headers.get('Origin');
        if (
          request.headers.get('X-Trip-Client') !== '1' ||
          !request.headers.get('Content-Type')?.startsWith('application/json') ||
          (origin !== null && origin !== url.origin)
        ) {
          return json({ error: 'forbidden' }, 403);
        }
        const body = await request.text();
        if (body.length > 100_000) return json({ error: 'too much at once' }, 413);
        let ops: unknown;
        try {
          ops = (JSON.parse(body) as { ops?: unknown }).ops;
        } catch {
          return json({ error: 'bad JSON' }, 400);
        }
        if (!Array.isArray(ops) || ops.length > 100) return json({ error: 'expected up to 100 changes' }, 400);
        return json(await store.apply(ops as Envelope[]));
      }

      return json({ error: 'not found' }, 404);
    } catch (error) {
      console.error('api error', error);
      return json({ error: 'server error' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
