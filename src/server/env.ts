// Bindings of the state Worker; the Pages functions bind the same namespaces
// by script name (wrangler.toml at src/ and src/server/).
import type { Instance } from "./instance.ts";
import type { JoinCode, Pairing } from "./directory.ts";
import type { UploadStats } from "./stats.ts";

export interface Env {
  INSTANCE: DurableObjectNamespace<Instance>;
  JOIN: DurableObjectNamespace<JoinCode>;
  PAIR: DurableObjectNamespace<Pairing>;
  STATS: DurableObjectNamespace<UploadStats>;
}
