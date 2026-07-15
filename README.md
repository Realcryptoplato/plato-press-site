# plato-press.com

Website for **Plato Press**, an independent product studio. The homepage features Citizen Coach, while `/books/` preserves the original publishing imprint and *The First 90 Days After a Parent Dies*.

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
├── index.html              # studio homepage
├── style.css               # studio and legal-page CSS
├── favicon.svg             # simple "P" wordmark favicon
├── assets/                 # studio social image and Citizen Coach feature image
├── books/                  # publishing-imprint page and CSS
├── privacy/                # privacy notice
├── terms/                  # website terms
├── cover.jpg               # Book #1 cover
├── functions/
│   └── api/
│       └── subscribe.js    # POST /api/subscribe — email signup endpoint
└── _redirects              # canonical trailing-slash redirects
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

Cloudflare Pages project: `plato-press-site`. The project is manually deployed and has no connected Git provider. A push to `main` does not deploy production.

Deploy only a clean, reviewed `main` commit and include its exact SHA:

```bash
npx wrangler pages deploy . \
  --project-name plato-press-site \
  --branch main \
  --commit-hash "$(git rev-parse HEAD)"
```

Configuration:

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
| `SUBSCRIBERS` | Existing `plato-press-subscribers` namespace |

### DNS safety

`plato-press.com` and `www.plato-press.com` are already attached to the existing Pages project. A normal site deploy requires no DNS changes. Preserve all Google Workspace mail, SPF, DKIM, DMARC, and transactional-email records, as well as the separate Citizen Coach and Calleja routes.

## Privacy

This site does not track. No analytics scripts. No cookies set. The form submission posts only the user's email to a Cloudflare Pages Function, which stores it in Cloudflare KV and triggers one welcome email via Resend. Cloudflare's standard anonymous request counters are the only request-level telemetry.

## License

Code in this repo is permissively licensed (MIT). Book content, the cover image, and the Plato Press brand are not — see the parent `plato-kdp-catalog` repo for book-content rights.
