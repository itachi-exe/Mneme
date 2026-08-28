import { serve } from "@hono/node-server";
import { env } from "./env.js";
import { app } from "./routes/http.js";
import { ensureDemoPool } from "./demo/swarm.js";

ensureDemoPool();

serve({ fetch: app.fetch, port: env.port, hostname: "0.0.0.0" }, (info) => {
  console.log(`mneme-api http://127.0.0.1:${info.port}`);
});
