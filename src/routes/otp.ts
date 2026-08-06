import { Hono } from "hono";
import type { Env } from "../types";
import { EMAIL_RE, normalizeEmail, MAX_LENGTHS } from "../lib/validators";
import { sha256, randomDigits } from "../lib/crypto";
import { sendOtpEmail } from "../lib/email";

const OTP_TTL_SECONDS = 300; // 5 minutes
const COOLDOWN_SECONDS = 60;

const otp = new Hono<{ Bindings: Env }>();

otp.post("/", async (c) => {
  let body: { email?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "Invalid request payload." }, 400);
  }

  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  if (!email) return c.json({ ok: false, error: "Enter a valid email address." }, 400);
  if (!EMAIL_RE.test(email)) {
    return c.json({ ok: false, error: "Enter a valid email address." }, 400);
  }
  if (email.length > MAX_LENGTHS.email) {
    return c.json({ ok: false, error: "Email address is too long." }, 400);
  }

  const { KV } = c.env;
  const cooldownKey = `otp-cooldown:${email}`;
  const existing = await KV.get(cooldownKey);
  if (existing) {
    return c.json({ ok: false, error: "Please wait a moment before requesting a new code." }, 429);
  }

  const code = randomDigits(6);
  const codeHash = await sha256(`${email}:${code}`);

  await KV.put(`otp:${email}`, codeHash, { expirationTtl: OTP_TTL_SECONDS });
  await KV.put(cooldownKey, "1", { expirationTtl: COOLDOWN_SECONDS });

  const sent = await sendOtpEmail(c.env, email, code);
  if (!sent.ok) {
    await KV.delete(`otp:${email}`);
    return c.json({ ok: false, error: sent.error }, 500);
  }

  return c.json({ ok: true, message: `Code sent to ${email}.` });
});

export default otp;
