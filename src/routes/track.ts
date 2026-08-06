import { Hono } from "hono";
import type { Env } from "../types";
import { ARTA_RE } from "../lib/validators";

const track = new Hono<{ Bindings: Env }>();

track.get("/:ref", async (c) => {
  const ref = c.req.param("ref").trim().toUpperCase();
  if (!ARTA_RE.test(ref)) {
    return c.json({ found: false, error: "Invalid reference number. Use the format ARTA-YYYY-XXXXX." }, 400);
  }

  const row = await c.env.DB.prepare(
    `SELECT arta_reference_no, full_name, email_address, nature_of_request, description, status, created_at, updated_at
     FROM tickets WHERE arta_reference_no = ?`
  )
    .bind(ref)
    .first();

  if (!row) {
    return c.json({ found: false, error: "No ticket found with that reference number." }, 404);
  }

  return c.json({ found: true, ticket: row });
});

export default track;
