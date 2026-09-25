// The one place the shared plan is stored. A single Durable Object is right
// here: the whole trip is one coordination unit with two people editing it,
// and a single object gives every change a strict order.
import { DurableObject } from 'cloudflare:workers';
import { applyAll, emptyPlan, type Envelope, type PlanState } from '../src/lib/plan';

const OP_ID = /^[A-Za-z0-9-]{6,64}$/;

export class TripStore extends DurableObject<Env> {
  private state: PlanState = emptyPlan();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const sql = ctx.storage.sql;
      sql.exec('CREATE TABLE IF NOT EXISTS doc (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      // Every change ever applied, for de-duplicating retries and for the record.
      sql.exec(
        'CREATE TABLE IF NOT EXISTS ops (op_id TEXT PRIMARY KEY, at INTEGER NOT NULL, by_name TEXT NOT NULL, body TEXT NOT NULL, result TEXT NOT NULL)',
      );
      const row = sql.exec<{ value: string }>("SELECT value FROM doc WHERE key = 'plan'").toArray()[0];
      if (row) this.state = { ...emptyPlan(), ...(JSON.parse(row.value) as PlanState) };
    });
  }

  /** The current plan, or null if the caller already has this version. */
  read(since: number): PlanState | null {
    return since === this.state.version ? null : this.state;
  }

  /** Apply a batch of changes in order. Each is applied once, however often it is retried. */
  apply(batch: Envelope[]): { state: PlanState; rejected: { opId: string; error: string }[] } {
    const sql = this.ctx.storage.sql;
    const seen = new Set<string>();
    const fresh = batch.filter((env) => {
      if (!env || typeof env.opId !== 'string' || !OP_ID.test(env.opId) || seen.has(env.opId)) return false;
      seen.add(env.opId);
      return sql.exec('SELECT 1 FROM ops WHERE op_id = ?', env.opId).toArray().length === 0;
    });
    if (!fresh.length) return { state: this.state, rejected: [] };

    const now = Date.now();
    const { state, rejected } = applyAll(this.state, fresh, now);
    const errors = new Map(rejected.map((r) => [r.opId, r.error]));

    // No awaits from here: the log and the new plan commit together.
    for (const env of fresh) {
      sql.exec(
        'INSERT INTO ops (op_id, at, by_name, body, result) VALUES (?, ?, ?, ?, ?)',
        env.opId,
        now,
        String(env.by ?? '').slice(0, 24),
        JSON.stringify(env.op ?? null).slice(0, 4000),
        errors.get(env.opId) ?? 'ok',
      );
    }
    if (state !== this.state) {
      sql.exec("INSERT OR REPLACE INTO doc (key, value) VALUES ('plan', ?)", JSON.stringify(state));
      this.state = state;
    }
    return { state, rejected };
  }
}
