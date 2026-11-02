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
  /** The state Worker only: the instances book their uploads; the site's functions don't bind it. */
  BUDGET: DurableObjectNamespace<SiteBudget>;
}
