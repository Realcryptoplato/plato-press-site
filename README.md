# plato-press.com

Landing page for **Plato Press**, a small imprint publishing practical field guides for adult-life events. The first book is *The First 90 Days After a Parent Dies* (Kindle).

## Stack

- Static HTML + CSS, no framework, no build step
- Hosted on **Cloudflare Pages** at `plato-press.com`
- Email capture handled by `functions/api/subscribe.js`, a Cloudflare Pages Function
- Transactional email via **Resend** (`plato-press.com` domain verified)
- Subscriber list stored in **Cloudflare KV** (`SUBSCRIBERS` namespace)
- DNS managed by Cloudflare (domain registered at Namecheap, nameservers point at Cloudflare)

## Repo layout

```
plato-press-site/
├── index.html              # single-page landing site
├── style.css               # all CSS
├── favicon.svg             # simple "P" wordmark favicon
├── cover.jpg               # Book #1 cover (1600x2560, copy of plato-kdp-catalog/books/probate-90-days/cover/cover.jpg)
├── functions/
│   └── api/
│       └── subscribe.js    # POST /api/subscribe — email signup endpoint
└── public/
    └── pdfs/               # printable checklists (TBD — placeholders until designed)
```

## Local development

No build step. Open `index.html` in a browser, or use a local server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

The `/api/subscribe` endpoint runs as a Cloudflare Pages Function. To test it locally, install Wrangler and run:

```bash
npm install -g wrangler
wrangler pages dev .
# then open http://localhost:8788
```

Set the following in a local `.dev.vars` file (gitignored) for Wrangler to pick up:

```
RESEND_API_KEY=re_your_resend_key_here
FROM_EMAIL=Plato Press <hello@plato-press.com>
REPLY_TO_EMAIL=hello@plato-press.com
```

## Deploy

Cloudflare Pages auto-deploys on push to `main`. Configuration:

- **Framework preset:** None
- **Build command:** *(blank)*
- **Build output directory:** *(root, i.e. `/` or blank)*
- **Custom domain:** `plato-press.com`

### Environment variables (set in Cloudflare Pages → Settings → Environment)

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | Resend API key with "Send" permission |
| `FROM_EMAIL` | `Plato Press <hello@plato-press.com>` |
| `REPLY_TO_EMAIL` | `hello@plato-press.com` |

### KV binding (set in Cloudflare Pages → Settings → Functions → KV namespace bindings)

| Variable name | KV namespace |
|---|---|
| `SUBSCRIBERS` | Create a new KV namespace named `plato-press-subscribers` and bind it here |

### DNS records to set in Cloudflare DNS

| Type | Name | Content | Purpose |
|---|---|---|---|
| `A` or `CNAME` | `@` | (auto-created by Cloudflare Pages custom domain) | Site serving |
| `CNAME` | `www` | `plato-press.com` | Redirect www → apex |
| `MX` | `@` | (per Resend's setup) | Receive email (set by Resend's domain verification) |
| `TXT` | `_dmarc` | (per Resend) | DMARC |
| `TXT` | `resend._domainkey` | (per Resend) | DKIM |
| `TXT` | `@` | (per Resend) | SPF |

If migrating MX records from Namecheap, copy them verbatim from Resend's domain setup page.

## Privacy

This site does not track. No analytics scripts. No cookies set. The form submission posts only the user's email to a Cloudflare Pages Function, which stores it in Cloudflare KV and triggers one welcome email via Resend. Cloudflare's standard anonymous request counters are the only request-level telemetry.

## License

Code in this repo is permissively licensed (MIT). Book content, the cover image, and the Plato Press brand are not — see the parent `plato-kdp-catalog` repo for book-content rights.
