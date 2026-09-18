# Prime Mob Detail redesign — 18 September 2026

## Discovery

Verified the exact local Windows repository, expected GitHub origin, clean `main` branch and history before editing. Inspected local and live production pages in Edge at desktop/mobile sizes; both serve the original site. Screenshots are in ignored `artifacts/audit-*`.

Existing stack: React 19.3.0, Vite 8.3.0, TypeScript 5.9.3, React Router 7.18.4, Tailwind 4.3.3, npm/package-lock.json. Typed local PL/EN/RU dictionaries, Helmet metadata, local Fontsource fonts, native modal dialogs, React Hook Form/Zod, Vitest/Testing Library and Playwright/axe are useful and retained. Vercel SPA rewrites already exist.

There is no backend, upload endpoint, analytics provider, cookie tracker or booking integration. WhatsApp is the sole handoff; selected photos are local object URLs. The original form has eight steps and saves text drafts for seven days. Existing image sources are documented Unsplash interior photographs; no real business photography, customer cases, reviews or equipment photographs exist. Existing PRIME typography and favicon are legitimate project assets.

Problems: old brand/domain defaults; BASIC incorrectly includes extraction washing under the new offer; only three packages; no calculation engine; no legal service-space question; eight-image allowance instead of five; data/photo loss on form close; placeholder before/after repeats one photo; excessive small labels and similar grids; duplicate SEO text; no typed tracking/submission boundaries.

## Implementation plan

1. Centralize four packages and calculation rules; add pure estimates, recommendations, migrated drafts, privacy-safe tracking and a WhatsApp submission adapter.
2. Preserve routing, logo, flags, modal accessibility, safe image selection and validation. Connect a focused calculator to a shorter progressive quote form and retain local photos across accidental closure.
3. Replace the page composition with an editorial split hero, process timeline, honest results launch state, comparable package rows, calculator, distinct FAMILY & PET feature, mobile/studio comparison, equipment and material care. Keep reviews hidden until verified data is supplied.
4. Complete all three locales, production metadata, documentation and owner checklist. Validate calculations, form handoff, accessibility, seven responsive widths and production build. Review changes, commit and push ordinary Git to main.

## Master specification update — 19 September 2026

The latest specification supersedes the earlier price and power rules. Keep the implemented light design, equipment storytelling, language routes, native dialog, image safety and form drafts. Replace prices with 249/349/499/649; use S/M/L/XL increments 0/50/100/150 and per-package autonomous power 150/100/70/0. Add power and location to the calculator, persistence and lead summary. No travel fee is configured.

Add a distinct fleet page/form and homepage entry; add localized blog routes, honest empty states and a protected Supabase-backed admin. Use database-enforced editor permissions and published-only public reads. No account creation or credentials are assumed. The owner must connect their Supabase project and run the included migration. Do not expose drafts or use a browser-only admin password. Use a small block editor instead of raw HTML to avoid stored script injection. Add dynamic blog metadata/sitemap handlers for Vercel so new published posts do not require a rebuild. Keep local static pages and existing indexed routes. Lazy-load CMS/admin dependencies.

Verify the updated pricing exhaustively, validate fleet and consumer forms, test CMS authorization boundaries, all locales, responsive sizes and accessible empty states. Existing 21 page checks across seven widths passed before the new commercial rules; the form QA runner needs an explicit browser context for axe.

## Market/UX research

Reviewed current public pages without copying assets, code or layouts. [Wash On Wheels](https://washonwheels.pl/) makes package/size configuration and studio-versus-mobile logistics visible. [AXIO1](https://www.axio1.pl/) has an explicit fleet path and service hierarchy (read in local Edge after web retrieval failed). [CleanerMix](https://cleanermix.pl/) connects service categories, local areas, business services and guides. [CLEANWWA](https://cleanwwa.pl/) exposes pricing, areas and real-result/review entry points. PRIME uses clear interior-only scope, an explicit power fee, a separate B2B enquiry and future owner-published guides. Competitor guarantees, statistics, images and wording were not imported.

## Implementation outcome

Preserved React/Vite/strict TypeScript, router URLs, native dialogs, safe local photo picker, React Hook Form/Zod, Fontsource, WhatsApp contacts, Vercel deployment and useful tests. Removed the repetitive dark/lime composition, animated power status, duplicate stock comparison, weak extra stock image, duplicated old content and unnecessary animation runtime. The production initial JS is about 130 kB gzip with CMS disabled; the quote and extra pages load separately.

Added the four-package pricing engine, seven-step calculator including power/location, five-step quote, per-tab photo retention, Family & Pet, editorial equipment explanations and power fee comparison, material care, separate fleet funnel, localized blog/admin, optional consent-gated events, real-domain SEO, static localized heads and dynamic article/sitemap handlers. Prices follow the latest master specification. No paid-power claim remains hidden behind the earlier all-inclusive wording.

Limits: no genuine equipment/client photos or reviews supplied; equipment uses a deliberate text composition, portfolio an honest empty state and reviews stay hidden. Enquiry photos can be handed to an application through native file sharing where supported, or attached manually in WhatsApp; no private lead-upload backend is connected. Supabase URL/public key were tested successfully; posts table is missing. The migration, editor assignment and CMS enable flag are documented, with no live database mutations performed.

## Final verification

Lint, typecheck, production build and CMS-enabled build passed. 74 frontend/business tests plus 4 server tests passed; npm audit reports zero vulnerabilities. Production preview passed home checks at seven widths (320–1920) in three locales, the complete calculator/form journey in every locale and fleet/blog/admin checks at six requested widths. Intercepted CMS tests passed auth/role denial, draft/error recovery, image upload, preview, publication, PL/RU/EN translations, metadata, unpublish, delete and logout. Real backend permissions remain unverified until migration/admin setup. See `CONTINUATION-AUDIT.md` for the requirement-by-requirement status and owner dependencies.
