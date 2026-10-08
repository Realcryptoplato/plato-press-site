# plato-press.com

Website for **Plato Press**, an independent press and bookseller in Palo Alto. The homepage leads with the shelves. `/books/` is the catalog of what is actually listed: four vintage flower-arrangement books on Etsy, and the Calleja paperbacks on Amazon. Citizen Coach stays linked at `#citizen-coach`.

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
├── books/                  # books catalog
├── shop-links.js           # publishes AbeBooks/Etsy buttons when data-shop-url is set
├── privacy/                # privacy notice
├── terms/                  # website terms
├── cover.jpg               # earlier cover image, not used by the current pages
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

`plato-press.com` and `www.plato-press.com` are already attached to the existing Pages project. `www.plato-press.com` is canonical; `functions/_middleware.js` redirects exact apex requests to `www` with HTTP 308 while preserving the path, query string, and request method. A normal site deploy requires no DNS changes. Preserve all Google Workspace mail, SPF, DKIM, DMARC, and transactional-email records, as well as the separate Citizen Coach and Calleja routes.

## Books catalog

`/books/` and the homepage list what Plato Press sells and publishes. Etsy links to the shop home, `https://platopressbooks.etsy.com`, not to individual listings. AbeBooks stays labeled “Coming soon” until a real shop URL is pasted into `data-shop-url`. `shop-links.js` turns that control into a link only when the value is an `https://` URL.

## Privacy

This site does not track. No analytics scripts. No cookies set. The public pages do not include an email form. `functions/api/subscribe.js` remains from an earlier books page: a POST still stores an address in Cloudflare KV and can send one email via Resend. Cloudflare's standard anonymous request counters are the only request-level telemetry.

## License

Code in this repo is permissively licensed (MIT). Book content, the cover image, and the Plato Press brand are not — see the parent `plato-kdp-catalog` repo for book-content rights.
