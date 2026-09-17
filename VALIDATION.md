# Validation record

Validated locally on Windows, Node 24.19.0, Microsoft Edge through Playwright. No remote workspace or repository copy was created.

- `npm install`: completed; lockfile committed.
- `npm run lint`: passed with no warnings or errors.
- `npm run typecheck`: passed with strict TypeScript.
- `npm run test`: 22 tests passed in 2 files.
- `npm run build`: passed; Vite SPA output with generated localized metadata, robots and sitemap.
- `npm audit --omit=dev`: 0 vulnerabilities. The full audit was also clean after updating the development image tool.
- `git diff --check`: passed.

## Browser verification

Tested 320, 375, 768, 1024 and 1440 px with all three language routes and direct refresh. Checked overflow, images, external-link safety, navigation, the full enquiry flow, garage warning, photo preview, package starting price and draft preservation. No horizontal overflow, broken images or browser console errors were found.

The five-width page/summary suite reported **0 axe accessibility violations**. A second suite covered all eight configurator steps in PL/EN/RU at 320 px and reported no violations. Keyboard checks covered menu Escape and focus restoration, modal focus containment, native FAQ activation and comparison arrow keys. Reduced-motion rendering was used for stable screenshots; the ordinary-motion hero and page were also visually inspected.

All eight main-page quote/photo buttons opened the configurator. The WhatsApp link opened a new tab with the correct number and localized message; the destination was intercepted locally for testing. No customer enquiry was sent. Clipboard API and fallback behavior, local draft persistence, unsafe/oversized image rejection, preview removal, validation and language switching are covered by automated tests.

Localized page and privacy metadata were checked for unique title, description and canonical tags. Static localized HTML heads are generated for crawlers. The local Vite preview validates application routes; a live Vercel deployment is not part of this validation.

Screenshots and detailed browser reports are local, ignored files under `artifacts/`. Reproduce with `npm run dev` plus `npm run qa`, or set `QA_URL` to a running `npm run preview` server. Full manual assistive-technology certification and testing on physical iOS/Android devices were not performed.

## Launch prerequisites

Set the actual `VITE_SITE_URL` in Vercel, supply verified legal privacy information, and replace illustrative photography with genuine paired photos when available. Placeholder-domain builds intentionally disallow crawling. The before/after preview uses the same stock photograph on both sides and is clearly identified as illustrative.
