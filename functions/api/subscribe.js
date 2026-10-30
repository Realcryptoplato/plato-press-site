/**
 * POST /api/subscribe
 *
 * Accepts { email } from a plato-press.com page (other origins get 403),
 * stores it in Cloudflare KV, and sends a short generic Plato Press welcome
 * email via Resend.
 *
 * Environment variables (set in Cloudflare Pages → Settings → Environment):
 *   RESEND_API_KEY              - Resend API key with sending permission
 *   FROM_EMAIL                  - e.g. "hello@plato-press.com"
 *   REPLY_TO_EMAIL              - e.g. "hello@plato-press.com"
 *
 * KV binding (set in Cloudflare Pages → Settings → Functions → KV namespace bindings):
 *   SUBSCRIBERS                 - KV namespace storing { email -> { subscribedAt, source } }
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // Only Plato Press pages may post here, so this endpoint can't be used
  // as a signup backend by any other site or brand.
  if (!isAllowedOrigin(request)) {
    return json({ error: "Not allowed." }, 403);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.email !== "string") {
      return json({ error: "Email is required." }, 400);
    }

    const email = body.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return json({ error: "Please enter a valid email address." }, 400);
    }

    // Store in KV (idempotent — overwriting an existing entry is fine)
    if (env.SUBSCRIBERS) {
      const record = {
        email,
        subscribedAt: new Date().toISOString(),
        source: "plato-press.com",
      };
      // Best-effort write — if KV fails we still send the email
      await env.SUBSCRIBERS.put(`subscriber:${email}`, JSON.stringify(record)).catch(() => {});
    }

    // Send the generic Plato Press welcome via Resend
    const resendResponse = await sendWelcomeEmail({
      to: email,
      apiKey: env.RESEND_API_KEY,
      from: env.FROM_EMAIL || "Plato Press <hello@plato-press.com>",
      replyTo: env.REPLY_TO_EMAIL || "hello@plato-press.com",
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text().catch(() => "");
      console.error("Resend send failed:", resendResponse.status, errText);
      return json({ error: "Email delivery failed. Try again in a minute." }, 502);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    console.error("subscribe error:", err);
    return json({ error: "Server error. Try again in a minute." }, 500);
  }
}

function isAllowedOrigin(request) {
  const allowed = new Set(["https://www.plato-press.com", "https://plato-press.com"]);
  const origin = request.headers.get("Origin");
  if (origin) return allowed.has(origin);
  const referer = request.headers.get("Referer");
  if (!referer) return false;
  try {
    return allowed.has(new URL(referer).origin);
  } catch {
    return false;
  }
}

function isValidEmail(s) {
  // Simple, intentionally permissive. Strict validation belongs at the email-provider side.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function sendWelcomeEmail({ to, apiKey, from, replyTo }) {
  const html = `
<p>Thanks for joining Plato Press.</p>

<p>We'll send you a short note when new books are released. In the meantime, you can see everything we publish at <a href="https://www.plato-press.com/books">plato-press.com/books</a>.</p>

<p>— Plato Press</p>
`.trim();

  const text = `Thanks for joining Plato Press.

We'll send you a short note when new books are released. In the meantime, you can see everything we publish at https://www.plato-press.com/books

— Plato Press
`;

  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject: "Thanks for joining Plato Press",
      html,
      text,
    }),
  });
}
