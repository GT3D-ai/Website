# Canonical host: `https://gt3d.com`

Static files in this repo include `<link rel="canonical" href="https://gt3d.com/…">` on every HTML page (except `404.html`) so search engines consolidate on the apex HTTPS URL.

**HTTP → HTTPS** and **www → apex** are not enforceable in HTML alone. Configure them on the **Google Cloud external HTTP(S) load balancer** (or whatever fronts `gt3d-website-2026-web`).

## Recommended redirects

| Request | Response |
|--------|----------|
| `http://gt3d.com/*` | `301` → `https://gt3d.com/*` |
| `http://www.gt3d.com/*` | `301` → `https://gt3d.com/*` |
| `https://www.gt3d.com/*` | `301` → `https://gt3d.com/*` |

## URL map (sketch)

Export your live map, merge, and re-import:

```bash
gcloud compute url-maps export YOUR_URL_MAP --destination=map.yaml --global
# edit map.yaml — see url-map-canonical-hosts.example.yaml
gcloud compute url-maps import YOUR_URL_MAP --source=map.yaml --global
```

Use a **host rule** for `www.gt3d.com` whose path matcher’s `defaultUrlRedirect` sets `hostRedirect` to `gt3d.com`, `httpsRedirect: true`, and `stripQuery: false` (unless you intentionally strip query strings).

For the **HTTP (port 80) frontend**, point at a URL map whose default action is an HTTPS redirect to `https://gt3d.com` with the same path and query, or use managed rules your team already applies.

After changes, invalidate **Cloud CDN** if enabled.
