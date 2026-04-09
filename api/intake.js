/**
 * MTSAi contact intake — Vercel Serverless Function (Node 18+).
 *
 * Required env (Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY     — https://resend.com/api-keys
 *   INTAKE_TO_EMAIL    — Comma-separated inbox(es), e.g. ssg@miracletraffic.ai
 *   INTAKE_FROM_EMAIL  — Verified sender in Resend, e.g. MTSAi Intake <intake@yourdomain.com>
 *
 * Optional:
 *   ALLOWED_ORIGINS    — Extra comma-separated origins (production defaults are always included)
 */

module.exports = async function handler(req, res) {
  const defaults = [
    "https://mtsai.in",
    "https://www.mtsai.in",
  ];
  if (process.env.VERCEL_URL) {
    defaults.push(`https://${process.env.VERCEL_URL}`);
  }

  const extra = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowList = [...new Set([...defaults, ...extra])];

  const origin = (req.headers.origin || "").trim();

  function applyCors(allowOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    res.setHeader("Access-Control-Max-Age", "86400");
  }

  const corsOrigin =
    origin && allowList.includes(origin) ? origin : allowList[0];
  applyCors(corsOrigin);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!origin || !allowList.includes(origin)) {
    return res.status(403).json({ ok: false, error: "Origin not allowed" });
  }

  const key = process.env.RESEND_API_KEY;
  const toRaw = process.env.INTAKE_TO_EMAIL;
  const fromEmail = process.env.INTAKE_FROM_EMAIL;

  if (!key || !toRaw || !fromEmail) {
    return res.status(503).json({
      ok: false,
      error:
        "Intake not configured (set RESEND_API_KEY, INTAKE_TO_EMAIL, INTAKE_FROM_EMAIL)",
    });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }

  const email = String(body.email || "").trim();
  const name = String(body.name || "").trim();
  const organization = String(body.organization || "").trim();
  const lane = String(body.lane || "").trim();

  if (!email || !name || !organization || !lane) {
    return res.status(400).json({
      ok: false,
      error: "Missing required fields (email, name, organization, lane)",
    });
  }

  const subject =
    String(body._subject || "").trim() ||
    `[MTSAi] ${lane} — ${name}, ${organization}`;

  const lines = [
    `Lane: ${lane}`,
    `Name: ${name}`,
    `Organization: ${organization}`,
    `Email: ${email}`,
    `Role: ${String(body.role || "").trim()}`,
    `Objective: ${String(body.objective || "").trim()}`,
  ];
  if (body.sp_territory != null || body.sp_experience != null) {
    lines.push(`Territory: ${String(body.sp_territory || "").trim()}`);
    lines.push(`Experience: ${String(body.sp_experience || "").trim()}`);
  }
  if (body.concern_detail != null) {
    lines.push(`Concern:\n${String(body.concern_detail || "").trim()}`);
  }
  const text = lines.join("\n");

  const replyTo = String(body._replyto || email).trim() || email;

  const toList = toRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toList,
      subject,
      text,
      reply_to: replyTo,
    }),
  });

  const resendJson = await resendRes.json().catch(() => ({}));

  if (!resendRes.ok) {
    return res.status(502).json({
      ok: false,
      error: resendJson.message || "Email provider error",
    });
  }

  return res.status(200).json({ ok: true, id: resendJson.id || null });
};

async function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") {
      return req.body ? JSON.parse(req.body) : {};
    }
    if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      return req.body;
    }
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}
