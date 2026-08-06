import { Hono } from "hono";
import type { Env } from "../types";
import { sha256, randomInt } from "../lib/crypto";

const CAPTCHA_TTL_SECONDS = 300;

const captcha = new Hono<{ Bindings: Env }>();

captcha.post("/", async (c) => {
  const a = randomInt(20) + 1;
  const b = randomInt(20) + 1;
  const ops = ["+", "-"] as const;
  const op = ops[randomInt(ops.length)];
  const answer = op === "+" ? a + b : a - b;

  const sessionId = crypto.randomUUID();
  await c.env.KV.put(`captcha:${sessionId}`, await sha256(String(answer)), {
    expirationTtl: CAPTCHA_TTL_SECONDS,
  });

  return c.json({ ok: true, sessionId, problem: `${a} ${op} ${b}` });
});

export default captcha;
