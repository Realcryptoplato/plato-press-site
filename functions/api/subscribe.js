/**
 * POST /api/subscribe
 *
 * Accepts { email } from the landing-page form. Sends a welcome email via
 * Resend with the four printable PDFs (or placeholder text until PDFs are
 * designed). Stores the email in Cloudflare KV for future newsletter sends.
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
        source: "plato-press.com/printables",
      };
      // Best-effort write — if KV fails we still send the email
      await env.SUBSCRIBERS.put(`subscriber:${email}`, JSON.stringify(record)).catch(() => {});
    }

    // Send welcome email via Resend
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
<p>Thanks for signing up.</p>

<p>The four printable checklists from <em>The First 90 Days After a Parent Dies</em> are still in design. They will be ready within two weeks of the book's launch, and I will email you the moment they are live — no new action needed from you.</p>

<p>The checklists are:</p>

<ul>
  <li>Ten-document baseline (Chapter 3)</li>
  <li>Five-document institution packet (Chapter 5)</li>
  <li>First-day phone call sheet (Chapter 1)</li>
  <li>Ninety-day timeline (whole-book overview)</li>
</ul>

<p>If a friend or family member could use the book in the meantime, the link is on Amazon: <a href="https://www.amazon.com/dp/PLACEHOLDER">The First 90 Days After a Parent Dies</a>.</p>

<p>When the next field guide ships, I will send one short email. No marketing newsletters. Reply to this if anything in the book was wrong or unclear — I read every reply.</p>

<p>— Jordan Hale<br/>Plato Press</p>
`;

  const text = `
Thanks for signing up.

The four printable checklists from The First 90 Days After a Parent Dies are still in design. They will be ready within two weeks of the book's launch, and I will email you the moment they are live — no new action needed from you.

The checklists are:
- Ten-document baseline (Chapter 3)
- Five-document institution packet (Chapter 5)
- First-day phone call sheet (Chapter 1)
- Ninety-day timeline (whole-book overview)

The book is on Amazon: https://www.amazon.com/dp/PLACEHOLDER

When the next field guide ships, I will send one short email. No marketing newsletters. Reply if anything in the book was wrong or unclear — I read every reply.

— Jordan Hale
Plato Press
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
      subject: "The printable checklists from The First 90 Days",
      html,
      text,
    }),
  });
}
