# VALOUR performance optimization report

Date: 2026-09-15

## Scope and measurement conditions

- Reference recording inspected: `C:\Users\ABCD\Downloads\Recording 2026-09-15 223354.mp4` (27.83 s, 948 x 1246). It showed Lighthouse Performance near 60, FCP near 3.1 s, LCP near 9.1 s, TBT near 340 ms, CLS 0, and the reported render-blocking, cache, reflow, image-delivery, and dependency-chain findings.
- Production baseline: `https://www.liquidspice.in/`, Lighthouse 13.4.1, three runs per form factor.
- Local before/after comparison: the same no-cache static server, browser, Lighthouse version, and form-factor settings, three runs per form factor. Dynamic APIs intentionally returned 404/405 in this isolated static measurement, so local and production numbers are not compared as if they were the same environment.
- Raw Lighthouse JSON and screenshots are under `output/performance/`.

## Median Lighthouse results

| Environment | Form factor | Performance | FCP | LCP | Speed Index | TBT | CLS | Transfer | Requests | Main thread |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Production baseline | Mobile | 58 | 3,497 ms | 6,363 ms | 7,201 ms | 256 ms | 0.057 | 5,774,007 B | 58 | 3,093 ms |
| Production baseline | Desktop | 95 | 1,054 ms | 1,256 ms | 1,489 ms | 6 ms | 0.032 | 1,782,672 B | 46 | 707 ms |
| Local baseline | Mobile | 73 | 2,404 ms | 6,624 ms | 2,423 ms | 89 ms | 0.062 | 2,583,940 B | 49 | 2,364 ms |
| Local optimized | Mobile | 71 | 3,119 ms | 5,593 ms | 3,119 ms | 154 ms | 0.001 | 1,739,505 B | 43 | 1,828 ms |
| Local baseline | Desktop | 96 | 523 ms | 1,372 ms | 589 ms | 0 ms | 0.032 | 1,661,448 B | 41 | 533 ms |
| Local optimized | Desktop | 99 | 711 ms | 886 ms | 734 ms | 0 ms | 0.001 | 1,232,215 B | 34 | 450 ms |

Mobile reduced LCP by 1,031 ms, transfer by 844,435 bytes, requests by 6, main-thread time by 536 ms, and CLS from 0.062 to 0.001. Its median FCP, Speed Index, TBT, and overall score varied adversely in the no-cache static runs, so a mobile 90+ result is not claimed. Desktop reached 99 locally, with LCP reduced by 486 ms, transfer by 429,233 bytes, requests by 7, and main-thread time by 83 ms. Production must be remeasured after deployment.

## Root causes and changes

- Render blockers: Meta and attribution scripts were parser-blocking, and three separate first-party stylesheets blocked rendering. The scripts now use ordered `defer`; the stylesheets are bundled and minified into `assets/css/home-20260915.min.css` without changing rule order.
- LCP: the measured LCP element was the hero title text. Exact Cormorant Garamond and Inter font files are now self-hosted, the hero face is preloaded, and font declarations preserve the existing typography. The LCP element is not lazy-loaded.
- Image delivery: oversized testimonials, product/gallery imagery, recipe cards, and the logo now have 320/640/960 WebP derivatives with `srcset`, `sizes`, and dimensions. Database-provided testimonial URLs are mapped only for the known first-party images; original public URLs and files remain intact.
- Startup/network work: exact GSAP 3.12.5 and ScrollTrigger 3.12.5 files are local; duplicate homepage-testimonial fetches now share one promise; script ordering and Meta event IDs/deduplication logic are unchanged.
- Video: below-fold recipe/story videos use `preload="none"`; existing visibility/play logic loads them when relevant. Posters, playback behavior, animation, and controls remain.
- Cache policy: versioned public root JS/CSS receives one-year immutable caching. Public homepage content endpoints receive a short browser cache and five-minute shared cache with stale-while-revalidate. HTML, checkout, signed/payment/tracking, order, admin, and other sensitive responses are not publicly cached.
- Missing static compositions: first-party `assets/images` files referenced by the existing page were restored locally; production currently returns route-not-found for those URLs, so deployment repairs those compositions.

## Visual and functional verification

- Before and after screenshots were captured at 412 x 915, 768 x 1024, and 1440 x 1000. The hero, navigation, typography, colors, spacing, sections, and responsive composition remain equivalent. A rotating announcement can differ by timer between captures.
- Buy drawer smoke check: drawer visible, `aria-hidden=false`, body scroll locked, quantity changed to 2, and total updated to Rs. 700.00.
- Static reference audit found no missing first-party file references. The only reported item was the intentional protocol-relative media origin.
- Syntax checks passed for `backend/server.js`, `attribution.js`, and `meta-pixel.js`.
- `node --test backend/server-analytics.test.js`: 5/5 passed, covering cache boundaries, ordered analytics deferral, the single testimonial request, responsive mappings, fonts, video preload, and asset presence.
- Broader backend run: 82 passed, 1 failed. The existing time-window-sensitive WhatsApp test expected `submitted` but received `scheduled`; no WhatsApp code was changed.
- No real order, OTP, payment, WhatsApp message, webhook, admin mutation, or production database change was made. Real-provider OTP resend, Razorpay/COD completion, order-success/tracking/review persistence, WhatsApp delivery/schedules, and admin fulfilment remain unverified end-to-end because doing so would create prohibited external side effects.
- In isolated static Lighthouse runs, API 404/405 responses are expected because the backend was deliberately not connected. Production baseline API requests completed normally.

## `back_vlr_poster` image usage

No application code references the `back_vlr_poster` directory itself. It is a backup directory. Files in it whose corresponding public-path images are currently used are:

- `hero_banner2nd.webp` - supplied by backend testimonial fallback data and rendered dynamically.
- `imagetab2.webp` - supplied by backend testimonial/media fallback data and rendered dynamically.

Present in the backup directory but not currently referenced:

- `hero_banner2nd.jpg`
- `hero_banner_vlrmn.webp`
- `imagetab2.png`
- `imagetab2-320.webp`
- `imagetab2-640.webp`
- `imagetab2-960.webp`
- `Mob_banner_2_TB.png`
- `Mob_banner_2_TB.webp`
- `Mob_banner_4_TB.jpg`
- `Mob_banner_4_TB.png`
- `Mob_banner_4_TB.webp`

## Deployment and cache verification

1. Deploy the HTML, backend changes, `assets/`, and new responsive image files together, then restart the Node service using the existing production process manager.
2. Configure Cloudflare to respect the origin `Cache-Control` headers and retain Brotli/gzip compression. Do not add a catch-all cache rule for HTML or `/api/`.
3. Purge only the changed HTML URLs and these public content endpoints once: `/api/accordion-content`, `/api/carousel-videos`, `/api/testimonial-media`, and `/api/homepage-testimonials`. Fingerprinted new assets do not need purging.
4. Verify that HTML is `no-cache`; versioned root JS/CSS is `public, max-age=31536000, immutable`; public homepage content has `public, max-age=60, s-maxage=300, stale-while-revalidate=86400`; and checkout, order, payment, tracking, and admin responses do not have public caching.
5. Repeat three production mobile and three desktop Lighthouse runs with the baseline settings and compare production-to-production medians.

## Remaining limitations

- Meta's `fbevents.js` cache lifetime is controlled by Meta and still appears in Lighthouse. The integration remains enabled.
- ScrollTrigger still appears in forced-reflow diagnostics. Its measured work remains, because removing or replacing it would alter required animation behavior; overall local main-thread time is lower.
- The Material Symbols font remains hosted by Google because replacing it would require validating every icon/glyph. Its third-party request remains.
- Mobile 90+ is not demonstrated. Production TTFB, Cloudflare behavior, live content, third-party timing, and the remaining animation/style work need a post-deployment production measurement.
