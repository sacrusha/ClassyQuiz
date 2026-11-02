// The state Worker: it only hosts the Durable Objects. Pages can't define
// Durable Objects itself, so the site's functions bind to these by script
// name. It has no public address of its own (workers_dev = false).

export { Instance } from "./instance.ts";
export { JoinCode } from "./directory.ts";
export { UploadStats } from "./stats.ts";
export { SiteBudget } from "./budget.ts";

export default {
  async fetch(): Promise<Response> {
    return new Response("Not found", { status: 404 });
  },
};
