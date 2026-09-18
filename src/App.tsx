import { lazy, Suspense, useEffect, useState, useCallback } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { ArrowUpRight, Menu, MessageCircle } from "lucide-react";
import { business, type Lang } from "./config/business";
import { Landing } from "./components/Landing";
import type { CalculatorState } from "./config/pricing";
import { track } from "./lib/tracking";
import { clearPhotos } from "./lib/photos";
import {
  dictionaries,
  languages,
  languageNames,
  type Dictionary,
} from "./i18n";
import { clearDraft, persistLanguage } from "./lib/draft";

import { Dialog } from "./components/Dialog";
import { Container, QuoteButton, WhatsAppAction } from "./components/UI";
import { extended } from "./i18n/extended";
const Fleet = lazy(() => import("./components/Fleet"));
const Blog = lazy(() => import("./components/Blog"));
const Admin = lazy(() => import("./components/Admin"));
const QuoteConfigurator = lazy(() => import("./components/QuoteConfigurator"));
const anchors = [
  "packages",
  "calculator",
  "process",
  "services",
  "faq",
  "contact",
];
function LanguageSwitcher({
  lang,
  onSelect,
  alternates,
}: {
  lang: Lang;
  onSelect?: () => void;
  alternates?: Partial<Record<Lang, string>>;
}) {
  const location = useLocation();
  return (
    <div className="languages">
      {languages.map((l) => (
        <Link
          key={l}
          to={`${alternates?.[l] || (location.pathname.includes("/blog/") ? `/${l}/blog` : `/${l}${location.pathname.replace(/^\/(pl|en|ru)/, "")}`)}${location.hash}`}
          aria-label={languageNames[l]}
          aria-current={lang === l ? "page" : undefined}
          onClick={() => {
            track("change_language", { language: l });
            onSelect?.();
          }}
        >
          <img src={`/flags/${l}.svg`} alt="" width="19" height="13" />
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
function Logo({ lang }: { lang: Lang }) {
  return (
    <Link className="logo" to={`/${lang}`} aria-label={business.name}>
      <strong>{business.logo}</strong>
      <small>{business.descriptor}</small>
    </Link>
  );
}
function Metadata({
  t,
  lang,
  privacy,
  page = "home",
}: {
  t: Dictionary;
  lang: Lang;
  privacy: boolean;
  page?: string;
}) {
  const path = `/${lang}${privacy ? "/privacy" : page === "fleet" ? "/floty" : ""}`;
  const title =
    page === "fleet"
      ? `${extended[lang].fleet.title} | ${business.name}`
      : t.seoTitle;
  const description =
    page === "fleet" ? extended[lang].fleet.intro : t.seoDescription;
  return (
    <Helmet>
      <html lang={lang} />
      <title>{privacy ? `${t.privacy} | ${business.name}` : title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`${business.siteUrl}${path}`} />
      {languages.map((l) => (
        <link
          key={l}
          rel="alternate"
          hrefLang={l}
          href={`${business.siteUrl}/${l}${privacy ? "/privacy" : page === "fleet" ? "/floty" : ""}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${business.siteUrl}/pl${privacy ? "/privacy" : page === "fleet" ? "/floty" : ""}`}
      />
      <meta property="og:title" content={privacy ? t.privacyTitle : title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={`${business.siteUrl}${path}`} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${business.siteUrl}/og.jpg`} />
      <meta
        property="og:locale"
        content={{ pl: "pl_PL", en: "en_GB", ru: "ru_RU" }[lang]}
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: business.name,
          url: business.siteUrl,
          telephone: business.phone,
          areaServed: business.area[lang],
          description: t.seoDescription,
          sameAs: [business.facebook],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: t.serviceTitle,
            itemListElement: business.packages.map((p) => ({
              "@type": "Offer",
              priceSpecification: {
                "@type": "PriceSpecification",
                minPrice: p.price,
                priceCurrency: "PLN",
              },
              itemOffered: {
                "@type": "Service",
                name: `${business.name} ${p.name}`,
              },
            })),
          },
        })}
      </script>
    </Helmet>
  );
}
function Header({
  lang,
  t,
  openQuote,
  alternates,
}: {
  lang: Lang;
  t: Dictionary;
  openQuote: () => void;
  alternates?: Partial<Record<Lang, string>>;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <>
      <header className="header">
        <Container className="header-inner">
          <Logo lang={lang} />
          <nav className="desktop-nav" aria-label={t.menu}>
            {t.nav.map((n, i) => (
              <Link key={n} to={`/${lang}#${anchors[i]}`}>
                {n}
              </Link>
            ))}
            <Link to={`/${lang}/floty`}>{extended[lang].fleetNav}</Link>
          </nav>
          <div className="header-actions">
            <a
              className="header-whatsapp icon-button"
              href={business.whatsappUrl}
              onClick={() => track("click_whatsapp")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.whatsapp}
            >
              <MessageCircle size={19} />
            </a>
            <LanguageSwitcher lang={lang} alternates={alternates} />
            <button className="header-quote" onClick={openQuote}>
              {t.shortQuote}
              <ArrowUpRight size={15} />
            </button>
            <button
              className="icon-button menu-toggle"
              aria-label={t.menu}
              aria-expanded={menu}
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
          </div>
        </Container>
      </header>
      {menu && (
        <Dialog
          kind="menu"
          label={t.menu}
          closeLabel={t.close}
          onClose={() => setMenu(false)}
        >
          <Logo lang={lang} />
          <nav>
            {t.nav.map((n, i) => (
              <Link
                key={n}
                to={`/${lang}#${anchors[i]}`}
                onClick={() => setMenu(false)}
              >
                {n}
                <ArrowUpRight />
              </Link>
            ))}
            <Link to={`/${lang}/floty`} onClick={() => setMenu(false)}>
              {extended[lang].fleetNav}
            </Link>
            <Link to={`/${lang}/blog`} onClick={() => setMenu(false)}>
              {extended[lang].blogNav}
            </Link>
          </nav>
          <LanguageSwitcher
            lang={lang}
            alternates={alternates}
            onSelect={() => setMenu(false)}
          />
          <QuoteButton
            onClick={() => {
              setMenu(false);
              openQuote();
            }}
          >
            {t.quote}
          </QuoteButton>
          <WhatsAppAction>{t.whatsapp}</WhatsAppAction>
        </Dialog>
      )}
    </>
  );
}
function Footer({ t, lang }: { t: Dictionary; lang: Lang }) {
  return (
    <footer>
      <Container>
        <div className="footer-top">
          <div>
            <Logo lang={lang} />
            <p>{t.interiorOnly}</p>
            <span>{business.area[lang]}</span>
          </div>
          <nav aria-label={t.nav[5]}>
            {t.nav.map((n, i) => (
              <Link key={n} to={`/${lang}#${anchors[i]}`}>
                {n}
              </Link>
            ))}
          </nav>
          <div className="footer-links">
            <a
              href={business.whatsappUrl}
              onClick={() => track("click_whatsapp")}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Business
              <ArrowUpRight size={14} />
            </a>
            <a
              href={business.facebook}
              onClick={() => track("click_facebook")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
              <ArrowUpRight size={14} />
            </a>
            <Link to={`/${lang}/floty`}>{extended[lang].fleetNav}</Link>
            <Link to={`/${lang}/blog`}>{extended[lang].blogNav}</Link>
            <Link to={`/${lang}/privacy`}>{t.privacy}</Link>
          </div>
        </div>
        <p className="footer-price">{t.priceNote}</p>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {business.name}
          </span>
          <a
            href={business.developer}
            target="_blank"
            rel="noopener noreferrer"
          >
            {business.signature}
            <ArrowUpRight size={13} />
          </a>
        </div>
      </Container>
    </footer>
  );
}
function Privacy({ t, lang }: { t: Dictionary; lang: Lang }) {
  const [cleared, setCleared] = useState(false);
  return (
    <section className="section privacy-page">
      <Container>
        <Link className="text-button" to={`/${lang}`}>
          {t.backHome}
          <ArrowUpRight size={18} />
        </Link>
        <h1>{t.privacyTitle}</h1>
        {t.privacyParagraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {business.legal.controllerName && (
          <p>
            {business.legal.controllerName} {business.legal.address}{" "}
            {business.legal.privacyContact}
          </p>
        )}
        <button
          className="btn secondary"
          onClick={() => {
            clearDraft();
            clearPhotos();
            setCleared(true);
          }}
        >
          {t.form.clear}
        </button>
        <p role="status">{cleared ? t.form.cleared : ""}</p>
      </Container>
    </section>
  );
}
function LocalizedSite() {
  const { lang: raw } = useParams();
  const lang = (languages.includes(raw as Lang) ? raw : "pl") as Lang;
  const t = dictionaries[lang];
  const location = useLocation();
  const suffix = location.pathname.replace(/^\/(pl|en|ru)/, "");
  const privacy = suffix === "/privacy";
  const fleet = suffix === "/floty",
    blog = suffix === "/blog" || suffix.startsWith("/blog/"),
    admin = suffix === "/admin";
  const home = suffix === "" || suffix === "/";
  const [alternates, setAlternates] = useState<Partial<Record<Lang, string>>>(
    {},
  );
  const updateAlternates = useCallback(
    (links: Partial<Record<Lang, string>>) => setAlternates(links),
    [],
  );
  const [quote, setQuote] = useState<CalculatorState | null>(null);
  const openQuote = (state?: CalculatorState) => {
    track("start_quote", { package: state?.package });
    setQuote(state ?? { problems: [] });
  };
  useEffect(() => {
    persistLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    } else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  if (!languages.includes(raw as Lang)) return <Navigate to="/pl" replace />;
  return (
    <>
      {!blog && !admin && (
        <Metadata
          t={t}
          lang={lang}
          privacy={privacy}
          page={fleet ? "fleet" : "home"}
        />
      )}
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <Header
        t={t}
        lang={lang}
        alternates={blog ? alternates : undefined}
        openQuote={() => openQuote()}
      />
      <main id="main">
        <Suspense
          fallback={
            <Container>
              <p className="loading">{extended[lang].loading}</p>
            </Container>
          }
        >
          {admin ? (
            <Admin lang={lang} />
          ) : blog ? (
            <Blog
              lang={lang}
              slug={suffix.split("/")[2]}
              onAlternates={updateAlternates}
            />
          ) : fleet ? (
            <Fleet lang={lang} />
          ) : privacy ? (
            <Privacy t={t} lang={lang} />
          ) : home ? (
            <Landing t={t} lang={lang} openQuote={openQuote} />
          ) : (
            <Container>
              <h1 className="section">{extended[lang].notFound}</h1>
            </Container>
          )}
        </Suspense>
      </main>
      <Footer t={t} lang={lang} />
      {!quote && home && (
        <div className="mobile-sticky">
          <QuoteButton onClick={() => openQuote()}>{t.shortQuote}</QuoteButton>
          <WhatsAppAction>WhatsApp</WhatsAppAction>
        </div>
      )}
      {quote && (
        <Dialog
          label={t.form.title}
          closeLabel={t.close}
          onClose={() => setQuote(null)}
        >
          <Suspense fallback={<p className="loading">{t.form.title}…</p>}>
            <QuoteConfigurator
              t={t}
              lang={lang}
              initialState={quote.package ? quote : undefined}
              onClose={() => setQuote(null)}
            />
          </Suspense>
        </Dialog>
      )}
    </>
  );
}
function DefaultRedirect() {
  let lang = "pl";
  try {
    const saved = localStorage.getItem("prime.language");
    if (languages.includes(saved as Lang)) lang = saved!;
  } catch {
    /* Polish by default. */
  }
  return <Navigate to={`/${lang}`} replace />;
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DefaultRedirect />} />
      <Route path="/admin" element={<Navigate to="/pl/admin" replace />} />
      <Route path="/blog" element={<Navigate to="/pl/blog" replace />} />
      <Route path="/floty" element={<Navigate to="/pl/floty" replace />} />
      <Route path="/:lang/*" element={<LocalizedSite />} />
    </Routes>
  );
}
