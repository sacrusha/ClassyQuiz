export { Instance } from "./instance.ts";
export { JoinCode } from "./directory.ts";
export { UploadStats } from "./stats.ts";
export { SiteBudget } from "./budget.ts";

export default {
  async fetch(): Promise<Response> {
    return new Response("Not found", { status: 404 });
  },
};
