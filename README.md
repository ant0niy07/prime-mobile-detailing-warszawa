# Prime Mob Detail

Existing local Windows React + Vite + TypeScript project, redesigned for mobile **car interior** detailing in Warsaw. Production origin: https://primemobdetail.pl. No exterior services, fake results, ratings or company facts.

## Local development

Node 22.12+ (validated on Node 24), npm and the existing lockfile:

```powershell
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run qa
node scripts/qa-pages.mjs
```

`/pl`, `/ru`, `/en` remain the localized home routes. `/` uses an explicit saved language preference or Polish. `/privacy`, `/floty`, `/blog`, `/blog/:slug` and `/admin` live below each locale. Short `/floty`, `/blog`, `/admin` URLs redirect to Polish. Language switching preserves logical pages; article translations use the configured translation group.

## Structure

| Location                                                        | Responsibility                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/config/business.ts`                                        | Brand, contacts, service area, legal fields, site origin                                                           |
| `src/config/pricing.ts`                                         | The single source for package prices, vehicle increments, power and condition fees                                 |
| `src/lib/pricing.ts`                                            | Pure estimation, recommendations, calculator persistence                                                           |
| `src/i18n/{pl,en,ru}.ts`                                        | Typed consumer content and forms                                                                                   |
| `src/i18n/equipment.ts` / `extended.ts`                         | Equipment, fleet, blog and admin in all three languages                                                            |
| `src/components/Landing.tsx`                                    | Hero, package rows, calculator, process, Family & Pet, equipment, materials, area, fleet/blog entry points and FAQ |
| `src/components/QuoteConfigurator.tsx`                          | Lazy five-step enquiry; native dialog remains accessible                                                           |
| `src/lib/quote.ts`, `draft.ts`, `photos.ts`, `submission.ts`    | Validation, seven-day text draft, per-tab photo session, honest WhatsApp handoff                                   |
| `src/components/Fleet.tsx`, `src/lib/fleet.ts`                  | Separate B2B form, validation and honeypot                                                                         |
| `src/config/cases.ts`                                           | Empty verified cases/reviews data, with permission gates                                                           |
| `src/config/equipment.ts`                                       | Real equipment image slots and process/package comparison                                                          |
| `src/lib/cms.ts`, `Admin.tsx`, `Blog.tsx`, `ArticleContent.tsx` | Supabase API boundary, protected block editor, public articles, safe rendering                                     |
| `supabase/migrations/202609190001_cms.sql`                      | Database policies and image bucket                                                                                 |
| `api/`, `server/`, `scripts/seo.mjs`                            | Dynamic article metadata/sitemap and static localized heads                                                        |
| `src/lib/tracking.ts`                                           | Disabled, typed, consent-gated analytics adapter                                                                   |

## Pricing

Starting prices for S: BASIC 249, BASIC PLUS 349, PREMIUM 499, FAMILY & PET 649 zł. Vehicle increments: S 0, M +50, L +100, XL +150; VAN is individual. Premium therefore starts at 499 / 549 / 599 / 649 zł. Condition and substantial pet hair each add a preliminary 50–150 zł range outside the ordinary included Family & Pet scope. Extreme/unusual contamination is individual. Children, leather, odour and stains do not independently create invented micro-fees.

Suitable customer 230 V has no power fee. PRIME autonomous power: BASIC +150, BASIC PLUS +100, PREMIUM +70, FAMILY & PET included. No travel fee is configured; location is transferred for confirmation. All displays and summaries read the same config. FAQ monetary tokens and SEO starting-price tokens are resolved from it.

The seven-step calculator transfers package, size, condition, problems, power and location to the quote. Recommendations do not replace the customer's package automatically. Price confirmation is subject only to substantial differences from supplied photos/description or requested extra scope.

## Enquiry behaviour

The five-step quote gathers car/package, condition/location/power, date/photos, contact, then summary. JPEG/PNG/WebP: up to five, 8 MB each; suggested angles are shown. Photos stay in memory across form close/reopen and language changes; removing or clearing revokes URLs. Refreshing/closing the browser tab removes photos. Text is validated and saved for seven days without consent; older drafts migrate. Calculator state remains until explicitly cleared.

There is **no live lead-upload backend**. On browsers supporting file sharing, the customer can pass the actual selected files and message to an application through the device share menu, choose WhatsApp and complete sending to PRIME there. Otherwise, photos must be attached manually in WhatsApp. Sharing, cancellation and acknowledged server delivery are distinct states; no false sent/booking confirmation is shown. Clipboard and manual-copy fallbacks are provided. The submission API interface only reports server success on explicit acknowledgement. Fleet has its own form and the same transparent WhatsApp handoff, not the consumer calculator. Current forms do not create public database-write endpoints. A future real upload endpoint requires server validation, private storage, rate limits, anti-spam, retention and notification configuration.

## Blog and admin

See [CMS-SETUP.md](CMS-SETUP.md). The supplied public Supabase settings are local and untracked. The table is not yet created, so CMS remains disabled. Apply the migration, create an editor, assign the editor UUID, enable the flag and deploy once. Routine publishing then needs no Git/redeploy. RLS restricts public reads to published/date-eligible posts; only assigned editors can write/upload. Raw HTML is never executed. Images in the blog bucket are public publication assets, not customer enquiry photos.

Draft, publish, unpublish, delete with confirmation, preview, cover/article images, SEO fields, scheduling and translation groups are implemented. Vercel renders article metadata/content and a dynamic sitemap from public data. Local Vite tests the client; server handlers have separate tests.

`npm run qa:cms` expects a local Vite QA server on 5175 with `VITE_CMS_ENABLED=true` in ignored `.env.qa.local`. Example: `npm run dev -- --mode qa --port 5175`. The script intercepts every Supabase request and makes **no real backend changes**. Actual RLS/account validation awaits owner setup.

## Assets and launch states

[CREDITS.md](CREDITS.md) documents the one remaining licensed illustrative interior image. Hero has responsive WebP sizes, dimensions and high fetch priority. Removed the weak detail photograph and identical before/after demonstration. Real cases are absent; show an honest launch state. Reviews stay hidden. Add consented case pairs in `cases.ts`; the reusable native range comparison supports keyboard, mouse and touch.

Equipment has editorial composition, prominent Puzzi, paired chemistry/brush explanations, hair tools, wide EcoFlow and the package table. Real product photographs have not been supplied; all slots are intentionally empty and render clean text rather than fake assets. `equipmentPhotos` accepts source, dimensions and credit. Do not invent chemical brands or station specifications.

## Analytics and privacy

No analytics provider is active. Events include pricing view, package/size/power selection, calculator start/complete, quote start/photo selection/handoff, Family & Pet click, fleet start/handoff, phone/WhatsApp/Facebook, language and article views. Runtime property allowlists exclude all free text and contact details. Configure a provider and appropriate consent UI before enabling GA4/Meta; `setTrackingConsent` defaults false. Provider failures never interrupt forms.

## Deployment

Vercel: Vite preset, project root `./`, `npm ci`, `npm run build`, output `dist`, Node 22+; production branch `main`. Existing GitHub integration should deploy an ordinary push. Configure `VITE_SITE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_CMS_ENABLED` in Vercel as well as local `.env`. **Never** use service-role credentials in `VITE_*`. Without CMS settings the main site and WhatsApp flows remain functional and the blog is empty.

`vercel.json` preserves localized SPA pages, directs article URLs to server metadata, and `/sitemap.xml` to the dynamic sitemap. Admin routes are noindex and excluded from the sitemap. No ratings or invented address in structured data. Current infrastructure uses Vercel functions only for public blog/SEO reads, not lead collection.

## Owner items

[OWNER-CHECKLIST.md](OWNER-CHECKLIST.md) lists photographs, genuine cases/reviews, legal details and integration setup still required. [REDESIGN-LOG.md](REDESIGN-LOG.md) records audit, market research and verification. All work remains in the original local repository.
