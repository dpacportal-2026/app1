import { Hono } from "hono";
import type { Env } from "./types";
import otp from "./routes/otp";
import captcha from "./routes/captcha";
import submit from "./routes/submit";
import track from "./routes/track";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/send-otp", otp);
app.route("/api/captcha", captcha);
app.route("/api/submit", submit);
app.route("/api/track", track);

app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
