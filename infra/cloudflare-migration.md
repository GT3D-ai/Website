# Moving gt3d.com (the website only) to Cloudflare

Started 2026-11-11. The platform at **app.gt3d.com stays on Google Cloud**,
untouched. Cloudflare only answers DNS for it.

## Where things are today

| Piece | Where |
|---|---|
| Registrar | NameBright (TurnCommerce). Expires 2027-09-12. **DNSSEC off** (no DS record), so the nameserver change needs no DNSSEC step. |
| DNS | Google Cloud DNS, zone `gt3d-public-zone` in project `gt3d-website-2026`, nameservers `ns-cloud-b1..b4.googledomains.com` |
| Website | Bucket `gt3d-website-2026-web` behind a Google HTTPS load balancer at 34.117.48.237, deployed by hand with `deploy-gcs.ps1` |
| Platform | `app.gt3d.com` at 34.54.37.244 (project `gt-platform-472016`). Not part of this move. |

## Why the whole zone moves

On Cloudflare's free plan the apex (`gt3d.com`) can only be served if
Cloudflare runs the domain's DNS. Partial (CNAME) setup needs the Business
plan. So every record below is recreated in Cloudflare; only `gt3d.com` and
`www` change what they point at, and only at the very end.

## Record plan — every record in the zone as of 2026-11-11

| Name | Type | Value | Cloudflare proxy | Notes |
|---|---|---|---|---|
| `gt3d.com` | A | 34.117.48.237 | **DNS only** until cutover | Replaced by the Pages custom domain at cutover |
| `www` | A | 34.117.48.237 | **DNS only** until cutover | Replaced by the Pages custom domain at cutover |
| `app` | A | 34.54.37.244 | **DNS only — never proxy** | The platform. Proxying breaks its Google-managed cert renewal and puts Cloudflare in front of IAP |
| `gt3d.com` | MX | 1 smtp.google.com, 5 alt1.aspmx.l.google.com, 5 alt2.aspmx.l.google.com, 10 alt3.aspmx.l.google.com, 10 alt4.aspmx.l.google.com | n/a | Google Workspace mail |
| `gt3d.com` | TXT | `v=spf1 include:_spf.google.com ~all` | n/a | SPF — **its own record** (see below) |
| `gt3d.com` | TXT | `google-site-verification=9Eq403qWdI2MZeTwWRkGj5UOl88TxEOOYv-ilNcdHXA` | n/a | Search Console / Workspace — **its own record** |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:dmarc-reports@gt3d.com` | n/a | Google splits this into 3 strings; Cloudflare takes it as one |
| `google._domainkey` | TXT | `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDAAYUgEcjjhfqB28ye8tpG/Gv+nJhmCWnnjOfFR30NoiMHMuxOYAB87PL1V+lEnXIO8v0MCYWtot9sRnBulaqGmyEvYw6sdqbBqYZcvnS8I63hPE/rRfG4k94fgZzaR5SKPlE/i39OLVLecj2UZWpBevOs1VziqPKMbIQSFbzF8QIDAQAB` | n/a | Workspace DKIM — copy exactly |
| `s1._domainkey` | CNAME | s1.domainkey.u106309670.wl171.sendgrid.net | **DNS only** | SendGrid DKIM |
| `s2._domainkey` | CNAME | s2.domainkey.u106309670.wl171.sendgrid.net | **DNS only** | SendGrid DKIM |
| `em4634` | CNAME | u106309670.wl171.sendgrid.net | **DNS only** | SendGrid return path |
| `url6908` | CNAME | sendgrid.net | **DNS only** | SendGrid link branding |
| `106309670` | CNAME | sendgrid.net | **DNS only** | SendGrid link branding |

NS and SOA are not copied; Cloudflare supplies its own.

## Found during the move: SPF was broken in Cloud DNS

Cloud DNS held SPF and the site-verification token as **one** TXT record
with two strings. Receivers join the strings, so mail servers saw
`v=spf1 include:_spf.google.com ~allgoogle-site-verification=…` — an invalid
mechanism, so SPF returned permerror for gt3d.com mail. Cloudflare has them as
two separate records; the fix goes live with the nameserver switch.

## Status — cut over 2026-11-12

**gt3d.com is served by Cloudflare Pages** (project `gt3d-website`, builds on
every push to `main`; nothing to deploy by hand any more).

- Nameservers at NameBright: `eleanor.ns.cloudflare.com`,
  `rodney.ns.cloudflare.com` only. Zone active on the Free plan.
- `gt3d.com` and `www.gt3d.com` are Pages custom domains (proxied CNAMEs to
  `gt3d-website.pages.dev`). Edge certificate covers `gt3d.com` and
  `*.gt3d.com`, which also fixes the old www certificate error.
- Redirect rule: `https://www.*` → `https://${1}`, 301, query string kept.
  Always Use HTTPS on. `/X/index.html` → `/X/` is Pages' own 308.
- Every other record DNS only; `app.gt3d.com` (the platform) untouched.
- Checked after cutover: all 38 sitemap pages and 143 internal link targets
  answer 200, robots.txt and sitemap served, 3D viewer and videos work,
  platform sign-in answers 200, MX and the fixed SPF resolve publicly.

**Rollback** (until the Google side is deleted): in Cloudflare DNS, remove
the two Pages custom domains and set `gt3d.com` and `www` to A
34.117.48.237, DNS only.

**Delete after 2026-11-26** if nothing has needed a rollback: the Google
HTTPS load balancer and its certificate at 34.117.48.237, bucket
`gt3d-website-2026-web`, and Cloud DNS zone `gt3d-public-zone` (project
`gt3d-website-2026`). `deploy-gcs.ps1` is obsolete from now on — running it
updates a bucket nobody is served from.

## Order of work

1. **Pages project** from `GT3D-ai/Website`, branch `main`, no build command,
   output directory `/`. Test on `<project>.pages.dev`. (Repo prepared in
   `2bb6d90`: every file under 25 MiB, nothing in LFS.)
2. **Add the zone** to Cloudflare; enter the records above. Turn off any
   records Cloudflare auto-imports that are not in this table.
3. **Compare** every record Cloudflare answers against Cloud DNS, before
   touching the registrar:
   `dig @<cloudflare-ns> <name> <type>` vs `dig @ns-cloud-b1.googledomains.com <name> <type>`.
4. **Switch nameservers at NameBright** to the two Cloudflare gives. Nothing
   visible changes: both providers answer identically.
5. **Cutover:** add `gt3d.com` and `www.gt3d.com` as custom domains on the
   Pages project. Add a redirect rule `www.gt3d.com/*` → `https://gt3d.com/$1`
   (301), and turn on Always Use HTTPS.
6. **Keep the Google load balancer and bucket for two weeks.** Rollback is
   pointing `gt3d.com` and `www` back to 34.117.48.237 (DNS only), effective
   in minutes. Then delete the load balancer, its certificate, the bucket and
   the Cloud DNS zone.

## Loose ends to settle at cutover

- `deploy-gcs.ps1` submits the sitemap to IndexNow after each deploy. Pages
  deploys on push, so that ping needs a new home or is dropped.
- `residential_scan_scheduler/admin-config.js` holds its admin password in
  plain JavaScript (`changeme`). It is public today and stays public on
  Pages; it is not real protection either way.
