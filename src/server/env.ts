// Bindings of the state Worker; the Pages functions bind the same namespaces
// by script name (wrangler.toml at src/ and src/server/).
import type { Instance } from "./instance.ts";
import type { JoinCode } from "./directory.ts";
import type { UploadStats } from "./stats.ts";
import type { SiteBudget } from "./budget.ts";

export interface Env {
  INSTANCE: DurableObjectNamespace<Instance>;
  JOIN: DurableObjectNamespace<JoinCode>;
  STATS: DurableObjectNamespace<UploadStats>;
  BUDGET: DurableObjectNamespace<SiteBudget>;
  /** The Pages project's secret for GET /api/site/use; unset, that address answers 404. */
  OWNER_KEY?: string;
}

/** The namespaces in Cloudflare's EU jurisdiction, where an object runs and keeps its data in EU data centres only (docs/design/hosting-and-limits.md, "Where the data is"). */
export function inEu<E extends Env>(env: E): E {
  try {
    return {
      ...env,
      INSTANCE: env.INSTANCE.jurisdiction("eu"),
      JOIN: env.JOIN.jurisdiction("eu"),
      STATS: env.STATS.jurisdiction("eu"),
      BUDGET: env.BUDGET.jurisdiction("eu"),
    };
  } catch (e) {
    // Local workerd (`npm run dev`) has no jurisdictions; there the namespaces stay as they are.
    if (e instanceof Error && e.message.includes("not implemented in workerd")) return env;
    throw e;
  }
}

const EMPTIED = "emptiedOutsideEu";

/**
 * From before the EU: the site-wide object of this name outside it, which the
 * site used until then, still holds the counts. When its namesake in the EU
 * starts, the old one forgets them, once; the counts started over in the EU.
 */
export async function emptyOutsideEu<T extends SiteBudget | UploadStats>(ctx: DurableObjectState, ns: DurableObjectNamespace<T>, name: string): Promise<void> {
  const old = ns.idFromName(name);
  if (ctx.id.equals(old) || (await ctx.storage.get(EMPTIED))) return;
  try {
    await ns.get(old).forget();
    await ctx.storage.put(EMPTIED, true);
  } catch {
    // Tried again when this object next starts.
  }
}
