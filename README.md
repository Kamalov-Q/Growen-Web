# Growen City — web

Public site for the Growen City mobile app: the legal pages both app stores
require, and the foundation for the listing pages that will carry the search
traffic.

```bash
npm run dev        # http://localhost:3000
npm run build      # production build, fails on a type error
npm run typecheck
npm run lint
```

## Why it is built this way

**Static, not server-rendered.** Every page is prerendered at build time
(`dynamic = "force-static"` plus `generateStaticParams` over the languages).
These are documents that change a few times a year; rendering them per
request would buy nothing.

**Language in the path, not in a cookie.** `/uz/privacy` and `/ru/privacy`
are two URLs because Google indexes URLs, not preferences. `src/lib/metadata.ts`
emits the canonical and the hreflang alternates that tell a crawler they are
one document in two languages rather than two pages competing for the same
query — the commonest multilingual SEO mistake.

**Legal copy is data, not JSX** (`src/content/`). Both languages share one
typed shape and render through one component, so they cannot drift in
spacing, heading levels or anchor ids. Two guards run at build time and fail
`next build`:

- `assertParity` — both languages must carry the same section ids, in the
  same order. They are the anchors; `/ru/privacy#retention` has to find the
  same subject as `/uz/privacy#retention`.
- `assertScripts` — catches a glyph from the wrong writing system. Not
  hypothetical: a CJK character was pasted into the Russian page while this
  was being written, typechecked fine, and would have shipped as a box in the
  middle of a sentence.

**The content matches the backend.** Retention periods come from the server's
actual constants (`pruneRead(60)`, `VIDEO_RETENTION_DAYS = 30`, outbox 24h,
OTP 10 min) and the deletion section describes what `deleteOwnAccount` really
does — including that messages, comments and archived listings survive,
unlinked from the person. A policy copied from a template is a policy that
fails a review.

## What the stores need

| Requirement | Where |
| --- | --- |
| Privacy policy URL (Apple + Google) | `/uz/privacy` |
| Data deletion URL (Google Play) | `/uz/account-deletion` |
| Support URL (Apple) | `/uz/support` |
| EULA / terms | `/uz/terms` |

Google Play's data-deletion URL must be reachable without logging in and
without installing the app. This one is.

## A measured caveat

These pages ship **~171 KB gzipped of JavaScript** — React plus the Next App
Router runtime. Not zero: App Router hydrates, so it always sends React.

It does not block rendering. The scripts are `async`, the prose is in the
prerendered HTML, and the stylesheet is the only render-blocking resource, so
LCP, FCP and CLS are unaffected; only Total Blocking Time takes a small hit on
a slow device, on pages with nothing to interact with.

If true zero-JS ever matters more than staying on one framework, Astro is the
swap for this part of the site. It was not worth doing for four pages.

## Environment

| Variable | Default |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://growencity.uz` |
| `NEXT_PUBLIC_API_URL` | `https://api.growencity.uz` |

`SITE_URL` must be correct in production — canonicals, hreflang, Open Graph
and the sitemap are all built from it.

## Next

1. Real landing page.
2. `/[lang]/listing/[id]` — server-rendered, `JSON-LD`, ISR. Index `ACTIVE`
   only; `SOLD` should render with a badge and `noindex` rather than 404, so
   inbound links degrade gracefully.
3. Search pages with filters in the URL, for district and category landing
   pages.
