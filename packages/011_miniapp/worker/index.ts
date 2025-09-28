import { Hono } from "hono";

import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: (origin, c) => c.env.APP_ORIGIN || origin,
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

export default {
  fetch: app.fetch,
};
