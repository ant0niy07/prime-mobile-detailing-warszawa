import { lazy, Suspense, useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowUpRight,
  BatteryCharging,
  CarFront,
  Check,
  ChevronRight,
  CircleCheck,
  Droplets,
  MapPin,
  Menu,
  MessageCircle,
  PlugZap,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wind,
} from "lucide-react";
import { business, type Lang } from "./config/business";
import { gallery } from "./config/gallery";
import {
  dictionaries,
  languages,
  languageNames,
  type Dictionary,
} from "./i18n";
import { clearDraft, persistLanguage } from "./lib/draft";
import type { Quote } from "./lib/quote";
import { Dialog } from "./components/Dialog";
import {
  BeforeAfterSlider,
  Container,
  FAQAccordion,
  MotionReveal,
  Photo,
  QuoteButton,
  WhatsAppAction,
} from "./components/UI";
const QuoteConfigurator = lazy(() => import("./components/QuoteConfigurator"));
const anchors = [
  "services",
  "packages",
  "process",
  "results",
  "faq",
  "contact",
];
function LanguageSwitcher({
  lang,
  onSelect,
}: {
  lang: Lang;
  onSelect?: () => void;
}) {
  const location = useLocation();
  return (
    <div className="languages">
      {languages.map((l) => (
        <Link
          key={l}
          to={`/${l}${location.pathname.endsWith("/privacy") ? "/privacy" : ""}${location.hash}`}
          aria-label={languageNames[l]}
          aria-current={lang === l ? "page" : undefined}
          onClick={onSelect}
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
}: {
  t: Dictionary;
  lang: Lang;
  privacy: boolean;
}) {
  const path = `/${lang}${privacy ? "/privacy" : ""}`;
  return (
    <Helmet>
      <html lang={lang} />
      <title>{privacy ? `${t.privacy} | ${business.name}` : t.seoTitle}</title>
      <meta name="description" content={t.seoDescription} />
      <link rel="canonical" href={`${business.siteUrl}${path}`} />
      {languages.map((l) => (
        <link
          key={l}
          rel="alternate"
          hrefLang={l}
          href={`${business.siteUrl}/${l}${privacy ? "/privacy" : ""}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${business.siteUrl}/pl${privacy ? "/privacy" : ""}`}
      />
      <meta
        property="og:title"
        content={privacy ? t.privacyTitle : t.seoTitle}
      />
      <meta property="og:description" content={t.seoDescription} />
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
}: {
  lang: Lang;
  t: Dictionary;
  openQuote: () => void;
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
          </nav>
          <div className="header-actions">
            <a
              className="header-whatsapp icon-button"
              href={business.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.whatsapp}
            >
              <MessageCircle size={19} />
            </a>
            <LanguageSwitcher lang={lang} />
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
          </nav>
          <LanguageSwitcher lang={lang} onSelect={() => setMenu(false)} />
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
function Hero({ t, openQuote }: { t: Dictionary; openQuote: () => void }) {
  const reduced = useReducedMotion();
  return (
    <section className="hero">
      <Photo
        hero
        base={gallery.hero}
        alt={t.interiorAlt}
        className="hero-photo"
      />
      <div className="hero-shade" />
      <Container className="hero-layout">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" />
            {t.eyebrow}
          </p>
          <h1>
            {t.hero[0]}
            <br />
            {t.hero[1]}
            <br />
            <em>{t.hero[2]}</em>
          </h1>
          <p className="hero-intro">{t.intro}</p>
          <div className="hero-buttons">
            <QuoteButton onClick={openQuote}>{t.quote}</QuoteButton>
            <button className="btn dark-secondary" onClick={openQuote}>
              {t.photosCta}
              <ArrowUpRight size={18} />
            </button>
          </div>
          <a
            className="hero-chat"
            href={business.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} />
            {t.whatsapp}
            <ChevronRight size={15} />
          </a>
        </div>
        <div className="hero-side">
          <div className="hero-coordinate mono">
            52.2297° N / 21.0122° E<br />
            WARSZAWA, PL
          </div>
          <div className="power-card">
            <div className="power-icon">
              <BatteryCharging size={28} />
              <span className="live-dot" />
            </div>
            <span className="mono">{t.power}</span>
            <div className="status-sequence">
              {t.status.map((s, i) => (
                <motion.div
                  key={s}
                  initial={reduced ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: reduced ? 0 : 0.4 + i * 0.45,
                    duration: 0.35,
                  }}
                >
                  <Check size={12} />
                  {s}
                </motion.div>
              ))}
            </div>
            <motion.strong
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduced ? 0 : 2.3 }}
            >
              <span className="live-dot" />
              {t.ready}
            </motion.strong>
          </div>
          <span className="image-note">{t.illustrative}</span>
        </div>
        <div className="hero-bottom">
          <span className="mono">01 / PRIME MOBILE DETAILING</span>
          <a href="#autonomy" aria-label={t.autonomyTitle}>
            <ArrowDown size={19} />
          </a>
          <span className="mono">
            {
              business.area[
                t === dictionaries.pl
                  ? "pl"
                  : t === dictionaries.ru
                    ? "ru"
                    : "en"
              ]
            }
          </span>
        </div>
      </Container>
    </section>
  );
}
function Home({
  t,
  lang,
  openQuote,
}: {
  t: Dictionary;
  lang: Lang;
  openQuote: (p?: Quote["package"]) => void;
}) {
  const icons = [BatteryCharging, Droplets, Sparkles, CarFront];
  const serviceIcons = [Droplets, ScanLine, Wind, ShieldCheck];
  return (
    <>
      <Hero t={t} openQuote={() => openQuote()} />
      <div className="trust-bar">
        <Container>
          {t.trust.map((text, i) => {
            const Icon = [MapPin, PlugZap, ShieldCheck, ScanLine][i];
            return (
              <span key={text}>
                <Icon size={17} />
                {text}
              </span>
            );
          })}
        </Container>
      </div>
      <section id="autonomy" className="autonomy section">
        <Container>
          <MotionReveal className="autonomy-top">
            <div>
              <span className="eyebrow">01 / {t.autonomy[0]}</span>
              <h2>{t.autonomyTitle}</h2>
            </div>
            <p>{t.autonomyText}</p>
          </MotionReveal>
          <div className="autonomy-grid">
            {t.autonomy.map((s, i) => {
              const Icon = icons[i];
              return (
                <div key={s}>
                  <Icon />
                  <span>{s}</span>
                  <small className="mono">0{i + 1}</small>
                </div>
              );
            })}
          </div>
          <p className="garage-note">
            <CircleCheck size={17} />
            {t.garage}
          </p>
        </Container>
      </section>
      <section className="section benefits-section">
        <Container className="split">
          <MotionReveal className="benefit-image">
            <Photo base={gallery.detail} alt={t.interiorAlt} />
            <span className="photo-caption">{t.illustrative}</span>
            <div className="image-mark">
              <span>{business.logo}</span>
              <small>{t.nav[0]} / PRIME</small>
            </div>
          </MotionReveal>
          <MotionReveal>
            <span className="eyebrow">{t.benefitEyebrow}</span>
            <h2>{t.benefitTitle}</h2>
            <p>{t.benefitText}</p>
            <ul className="check-list">
              {t.benefits.map((b) => (
                <li key={b}>
                  <Check size={18} />
                  {b}
                </li>
              ))}
            </ul>
            <p className="note">{t.drying}</p>
            <button className="text-button" onClick={() => openQuote()}>
              {t.quote}
              <ArrowUpRight size={18} />
            </button>
          </MotionReveal>
        </Container>
      </section>
      <section id="services" className="section services-section">
        <Container>
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.serviceEyebrow}</span>
              <h2>{t.serviceTitle}</h2>
            </div>
            <p>{t.serviceIntro}</p>
          </div>
          <div className="services-grid">
            {t.services.map((s, i) => {
              const Icon = serviceIcons[i];
              return (
                <MotionReveal key={s.title} className="service-card">
                  <div>
                    <Icon size={28} />
                    <span className="mono">0{i + 1}</span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </MotionReveal>
              );
            })}
          </div>
          <p className="note service-note">{t.resultDisclaimer}</p>
        </Container>
      </section>
      <section id="packages" className="section packages-section">
        <Container>
          <div className="center-heading">
            <span className="eyebrow">{t.packageEyebrow}</span>
            <h2>{t.packageTitle}</h2>
          </div>
          <div className="packages-grid">
            {business.packages.map((p, i) => (
              <MotionReveal
                key={p.id}
                className={`package-card ${i === 1 ? "featured" : ""}`}
              >
                {i === 1 && (
                  <div className="popular">
                    <span className="live-dot" />
                    {t.popular}
                  </div>
                )}
                <div className="package-top">
                  <span className="mono">0{i + 1} /</span>
                  <h3>{p.name}</h3>
                  <p>{t.packages[i].text}</p>
                  <div className="price">
                    <span>{t.from}</span> {p.price} <span>{t.currency}</span>
                  </div>
                </div>
                <ul className="check-list">
                  {t.packages[i].items.map((item) => (
                    <li key={item}>
                      <Check size={16} />
                      {item}
                    </li>
                  ))}
                </ul>
                <QuoteButton
                  secondary={i !== 1}
                  onClick={() => openQuote(p.id)}
                >
                  {t.packageCta}
                </QuoteButton>
              </MotionReveal>
            ))}
          </div>
          <div className="pricing-note">
            <p>{t.priceNote}</p>
            <strong>{t.priceConfirm}</strong>
          </div>
        </Container>
      </section>
      <section id="process" className="section process-section">
        <Container>
          <span className="eyebrow">{t.processEyebrow}</span>
          <h2>{t.processTitle}</h2>
          <div className="process-grid">
            {t.process.map((s, i) => (
              <MotionReveal key={s.title}>
                <div className="process-number mono">
                  0{i + 1}
                  <ArrowUpRight size={22} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </MotionReveal>
            ))}
          </div>
        </Container>
      </section>
      <section id="results" className="section results-section">
        <Container className="split">
          <MotionReveal>
            <span className="eyebrow">{t.resultsEyebrow}</span>
            <h2>{t.resultsTitle}</h2>
            <p>{t.resultsText}</p>
            <span className="pill">{t.illustrative}</span>
            <p className="note">{t.resultDisclaimer}</p>
          </MotionReveal>
          <BeforeAfterSlider t={t} />
        </Container>
      </section>
      <section className="equipment-section section">
        <Container className="split">
          <div className="equipment-visual" aria-hidden="true">
            <div className="equipment-orbit" />
            <BatteryCharging size={94} strokeWidth={1} />
            <span className="mono">PRIME / {t.autonomy[3]}</span>
            <div className="equipment-chip">
              <span className="live-dot" />
              {t.power}
            </div>
          </div>
          <MotionReveal>
            <span className="eyebrow">{t.autonomy[0]} / PRIME</span>
            <h2>{t.equipmentTitle}</h2>
            <p>{t.equipmentText}</p>
            <div className="equipment-tags">
              {t.equipmentTags.map((s) => (
                <span key={s}>
                  <Check size={14} />
                  {s}
                </span>
              ))}
            </div>
          </MotionReveal>
        </Container>
      </section>
      <section className="area-section section">
        <Container className="split">
          <div>
            <span className="eyebrow">
              <MapPin size={15} />
              {business.area[lang]}
            </span>
            <h2>{t.areaTitle}</h2>
            <p>{t.areaText}</p>
            <button className="text-button" onClick={() => openQuote()}>
              {t.quote}
              <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="districts">
            {business.districts.map((s) => (
              <span key={s}>
                {s}
                <ArrowUpRight size={15} />
              </span>
            ))}
          </div>
        </Container>
      </section>
      <section id="faq" className="section faq-section">
        <Container className="faq-layout">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2>{t.faqTitle}</h2>
            <a
              className="text-button"
              href={business.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.whatsapp}
              <ArrowUpRight size={18} />
            </a>
          </div>
          <FAQAccordion t={t} />
        </Container>
      </section>
      <section id="contact" className="section contact-section">
        <Container>
          <span className="eyebrow">
            <span className="live-dot" />
            {t.contactEyebrow}
          </span>
          <div className="contact-layout">
            <div>
              <h2>{t.contactTitle}</h2>
              <p>{t.contactText}</p>
              <div className="contact-buttons">
                <WhatsAppAction>{t.contactCta}</WhatsAppAction>
                <QuoteButton secondary onClick={() => openQuote()}>
                  {t.quote}
                </QuoteButton>
              </div>
            </div>
            <div className="contact-details">
              <MessageCircle size={28} />
              <small>WhatsApp Business</small>
              <a
                href={business.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {business.phone}
              </a>
              <span>{business.area[lang]}</span>
              <span>{t.trust[1]}</span>
              <a
                className="facebook"
                href={business.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
                <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
        </Container>
      </section>
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
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Business
              <ArrowUpRight size={14} />
            </a>
            <a
              href={business.facebook}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
              <ArrowUpRight size={14} />
            </a>
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
  const privacy = location.pathname.endsWith("/privacy");
  const [quote, setQuote] = useState<{ package?: Quote["package"] } | null>(
    null,
  );
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
      <Metadata t={t} lang={lang} privacy={privacy} />
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <Header t={t} lang={lang} openQuote={() => setQuote({})} />
      <main id="main">
        {privacy ? (
          <Privacy t={t} lang={lang} />
        ) : (
          <Home t={t} lang={lang} openQuote={(p) => setQuote({ package: p })} />
        )}
      </main>
      <Footer t={t} lang={lang} />
      {!quote && !privacy && (
        <div className="mobile-sticky">
          <QuoteButton onClick={() => setQuote({})}>{t.shortQuote}</QuoteButton>
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
              initialPackage={quote.package}
              onClose={() => setQuote(null)}
            />
          </Suspense>
        </Dialog>
      )}
    </>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pl" replace />} />
      <Route path="/:lang" element={<LocalizedSite />} />
      <Route path="/:lang/privacy" element={<LocalizedSite />} />
      <Route path="*" element={<Navigate to="/pl" replace />} />
    </Routes>
  );
}
