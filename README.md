# PRIME Mobile Detailing Warszawa

Mobile automotive **interior-only** detailing website. Built directly in the local Windows repository on `main`. React + Vite + strict TypeScript SPA, with Polish, English and Russian routes, a local enquiry configurator and WhatsApp handoff. There is no database, payment flow or fake submission endpoint.

## Run locally

Node.js 22.12+ (validated with Node 24) and npm are required.

```powershell
npm install
npm run dev
```

Open the URL printed by Vite. `/` redirects to `/pl`; `/en` and `/ru` are complete language versions. Each has a `/privacy` route. The route is authoritative; language changes also persist in localStorage. Root deliberately remains Polish as requested.

## Architecture and editing

- `src/config/business.ts`: the single source for brand, contacts, external links, package prices, service area, site URL and pending legal identity fields.
- `src/i18n/{pl,en,ru}.ts`: typed complete dictionaries. English and Russian must match the Polish dictionary shape.
- `src/config/gallery.ts`: image paths and comparison mode.
- `src/components/QuoteConfigurator.tsx`: lazy-loaded eight-step enquiry, React Hook Form + Zod.
- `src/lib/quote.ts`: validation, safe photo checks, localized summary/message and clipboard fallback.
- `src/lib/draft.ts`: versioned, validated localStorage draft with seven-day expiry; consent and photographs are not stored.
- `src/components/Dialog.tsx`: native modal dialog, focus containment, Escape, focus restoration and scroll locking.
- `src/components/UI.tsx`: shared buttons, images, reduced-motion reveal, comparison and FAQ.
- `src/App.tsx`: routes, localized metadata, header, page sections and footer.
- `src/styles.css`: responsive visual system and Tailwind entry point.

The design combines a dark automotive hero and technical power-status panel with light service, pricing and FAQ sections. Locally hosted Manrope, Inter and Geist Mono fonts avoid remote font requests. Native dialogs and semantic details elements provide baseline keyboard behavior. Animations are restrained and respect reduced-motion preferences.

Current starting prices: BASIC **199 zł**, BASIC PLUS **299 zł**, PREMIUM **449 zł**. Final quotes depend on the vehicle, material, condition and agreed work. Changing prices must be done in business configuration.

Future sofa, armchair or mattress services should be added as a distinct service category with its own routes, dictionaries, schema fields and image data. Keep the current automotive packages separate; do not advertise future services before the owner confirms availability.

## WhatsApp and photos

The form validates vehicle, interior condition, location, date preference and contact details. It prepares a localized message, copies it via the Clipboard API (with `execCommand` and manual-copy fallbacks), and opens the verified WhatsApp conversation. **The user still sends the message in WhatsApp.** Opening a conversation does not mean the enquiry was sent or an appointment confirmed.

Only JPEG, PNG and WebP files are accepted, up to 8 images and 8 MB per file. Previews use browser object URLs and are revoked when removed or when the configurator unmounts. Nothing is uploaded. WhatsApp cannot receive file attachments from a `wa.me` link, so the customer must attach photographs manually in the chat. Photos must be reselected after closing/reloading the form; text data remains in a local draft. Both the configurator and privacy page provide a draft deletion control. Storage-disabled browsing still works without persistence.

## Images and replacing the preview

See [CREDITS.md](CREDITS.md) for source pages and licenses. Two Unsplash photographs are stored locally as 640, 1200 and 1920 pixel WebP variants. No image is hotlinked or claimed as a PRIME customer result.

The comparison component intentionally displays the **same illustrative image on both sides**. It is a functional, keyboard- and touch-accessible preview, not an invented before/after result.

To publish real results:

1. Obtain owner-supplied paired photos and permission to publish them. Remove identifying details as appropriate.
2. Optimize and add local images under `public/images/`, with matched crops and dimensions.
3. Update `gallery.comparison.before` and `.after`, set `.kind` to `real`, and update the localized results introduction and alternative text in all three dictionaries.
4. Review `CREDITS.md` and repeat responsive QA. Do not label stock imagery as a client project.

`scripts/assets.mjs` rebuilds the current optimized assets/OG image from the original `artifacts/interior.jpg` and `artifacts/detail.jpg` downloads; originals are deliberately ignored. Their URLs are documented in CREDITS. Asset generation is not required to build or deploy the site because the optimized files are committed.

## Production URL and SEO

Set `VITE_SITE_URL` to the final HTTPS origin, **without a path**, e.g. your real domain. `.env.example` documents the variable; never commit `.env` or `.env.local`. On Vercel, use the project environment settings and redeploy after changing it.

Until supplied, a centralized safe `https://example.com` fallback in `src/config/seo.json` is used; the build generates `robots.txt` with `Disallow: /` to avoid indexing placeholder metadata. Set the real origin before launch. Localized Helmet metadata includes titles, descriptions, canonical URLs, hreflang, Open Graph image and LocalBusiness/service JSON-LD without invented addresses, ratings or reviews. `scripts/seo.mjs` generates `robots.txt`, `sitemap.xml` and localized HTML heads in the build output, so social preview crawlers can read metadata without executing JavaScript. The application itself remains a Vite SPA.

## Vercel import settings

Import the existing [GitHub repository](https://github.com/ant0niy07/prime-mobile-detailing-warszawa) with:

| Setting          | Value                                       |
| ---------------- | ------------------------------------------- |
| Framework Preset | **Vite**                                    |
| Root Directory   | **./**                                      |
| Build Command    | **npm run build**                           |
| Output Directory | **dist**                                    |
| Install Command  | **Default**                                 |
| Environment      | **VITE_SITE_URL = your final HTTPS origin** |

`vercel.json` contains only SPA route rewrites, allowing direct refresh on language and privacy routes while leaving static assets untouched. No Next.js settings or secrets are required. This repository is ready to import; pushing code does not independently create a Vercel project.

## Validation

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --omit=dev
git diff --check
```

For real browser QA, start `npm run dev`, then run `npm run qa` in another terminal. The QA script uses locally installed Microsoft Edge through Playwright. It checks 320, 375, 768, 1024 and 1440 pixel widths; all three languages; refresh; overflow; broken images; safe links; mobile navigation; the complete form; local photo selection; keyboard controls; console errors; and axe WCAG A/AA checks. Screenshots and detailed results go to ignored `artifacts/`. Set `QA_URL` to test a preview server instead. Automated accessibility checks do not establish complete WCAG certification.

## Owner input before public launch

- Final production domain for `VITE_SITE_URL`.
- Genuine before/after photographs with publication permission.
- Verified legal controller identity, applicable registration/address details and privacy contact, plus the owner's final privacy wording. Centralized placeholders in `business.legal` are intentionally empty; fake identity details are never displayed. Review the localized privacy text when filling these fields.

No email, studio address, opening hours, customer reviews, company statistics, qualifications or guaranteed results have been invented.
