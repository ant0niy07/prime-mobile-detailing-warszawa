import { Link } from "react-router-dom";
import { extended } from "../i18n/extended";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, MapPin, PlugZap } from "lucide-react";
import { business, type Lang } from "../config/business";
import { gallery } from "../config/gallery";
import { cases, reviews } from "../config/cases";
import {
  pricing,
  type CalculatorState,
  type PackageId,
} from "../config/pricing";
import type { Dictionary } from "../i18n";
import { readCalculator } from "../lib/pricing";
import { track } from "../lib/tracking";
import {
  Container,
  Photo,
  QuoteButton,
  WhatsAppAction,
  FAQAccordion,
  BeforeAfterSlider,
} from "./UI";
import { EquipmentSection } from "./EquipmentSection";
import { PriceCalculator } from "./PriceCalculator";
export function Landing({
  t,
  lang,
  openQuote,
}: {
  t: Dictionary;
  lang: Lang;
  openQuote: (state?: CalculatorState) => void;
}) {
  const [state, setState] = useState<CalculatorState>(readCalculator);
  const [revision, setRevision] = useState(0);
  const pricingRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const clear = () => {
      setState({ problems: [] });
      setRevision((v) => v + 1);
    };
    window.addEventListener("prime:clear-draft", clear);
    return () => window.removeEventListener("prime:clear-draft", clear);
  }, []);
  useEffect(() => {
    const node = pricingRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          track("view_pricing");
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const choose = (id: PackageId) => {
    setState((s) => ({ ...s, package: id }));
    setRevision((v) => v + 1);
    track("select_package", { package: id });
    document
      .getElementById("calculator")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <>
      <section className="hero">
        <Container className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>
              {t.hero[0]}
              <span>
                {t.hero[1]} {t.hero[2]}
              </span>
            </h1>
            <p className="hero-intro">{t.intro}</p>
            <div className="hero-buttons">
              <QuoteButton onClick={() => openQuote()}>
                {t.primaryCta}
              </QuoteButton>
              <a className="text-button" href="#packages">
                {t.seePackages}
                <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="hero-price">
              <span>{t.starting}</span>
              <strong>
                {business.packages[0].price} <small>{t.currency}</small>
              </strong>
              <span>{t.interiorOnly}</span>
            </div>
          </div>
          <figure className="hero-media">
            <Photo hero base={gallery.hero} alt={t.interiorAlt} />
            <figcaption>
              <strong>{t.heroLabel}</strong>
              <span>{t.illustrative}</span>
            </figcaption>
          </figure>
        </Container>
      </section>
      <div className="trust-bar">
        <Container>
          {t.trust.map((s, i) => (
            <span key={s}>
              {i === 1 ? <PlugZap size={18} /> : <Check size={17} />} {s}
            </span>
          ))}
        </Container>
      </div>
      <Container>
        <p className="garage-short">{t.garageShort}</p>
      </Container>
      <section
        id="packages"
        ref={pricingRef}
        className="section packages-section"
      >
        <Container>
          <div className="section-heading">
            <span className="eyebrow">{t.packageEyebrow}</span>
            <h2>{t.packageTitle}</h2>
            <p>{t.packageIntro}</p>
          </div>
          <div className="package-list">
            {business.packages.map((p, i) => (
              <article
                className={`package-row ${i === 1 ? "featured" : ""} ${p.id === "family" ? "family-row" : ""}`}
                key={p.id}
              >
                <div className="package-name">
                  <span className="eyebrow">
                    0{i + 1} / {i === 1 ? t.popular : t.packages[i].short}
                  </span>
                  <h3>{p.name}</h3>
                  <p>{t.packages[i].text}</p>
                </div>
                <div className="package-scope">
                  <details open={i === 1}>
                    <summary>
                      {t.seeScope}
                      <ArrowUpRight size={17} />
                    </summary>
                    <ul className="check-list">
                      {t.packages[i].items.map((item) => (
                        <li key={item}>
                          <Check size={16} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </details>
                  <p className="note">{t.packages[i].note}</p>
                </div>
                <div className="package-price">
                  <p className="power-price">
                    {t.calculator.powerLabel}:{" "}
                    {pricing.power[p.id]
                      ? `+${pricing.power[p.id]} ${t.currency}`
                      : t.calculator.powerIncluded}
                  </p>
                  <div className="price">
                    <small>{t.from}</small>
                    <strong>{p.price}</strong>
                    <span>{t.currency}</span>
                  </div>
                  <QuoteButton secondary={i !== 1} onClick={() => choose(p.id)}>
                    {t.packageCta}
                  </QuoteButton>
                </div>
              </article>
            ))}
          </div>
          <div className="pricing-note">
            <p>{t.priceNote}</p>
            <p>{t.priceConfirm}</p>
          </div>
        </Container>
      </section>
      <section id="calculator" className="section calculator-section">
        <Container>
          <div className="section-heading">
            <span className="eyebrow">{t.calculator.eyebrow}</span>
            <h2>{t.calculator.title}</h2>
            <p>{t.calculator.intro}</p>
          </div>
          <PriceCalculator
            key={revision}
            t={t}
            state={state}
            onChange={setState}
            onQuote={openQuote}
          />
        </Container>
      </section>
      <section id="process" className="section process-section">
        <Container>
          <span className="eyebrow">{t.processEyebrow}</span>
          <h2>{t.processTitle}</h2>
          <ol className="process-timeline">
            {t.process.map((s, i) => (
              <li key={s.title}>
                <span className="process-number">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
      <section id="results" className="results-section">
        <Container>
          <span className="eyebrow">{t.resultsEyebrow}</span>
          {cases.some((c) => c.verified) ? (
            cases
              .filter((c) => c.verified)
              .map((c) => (
                <div key={c.id}>
                  <h2>{c.title[lang]}</h2>
                  <BeforeAfterSlider
                    t={t}
                    comparison={{
                      before: c.before,
                      after: c.after,
                      alt: c.alt[lang],
                    }}
                  />
                </div>
              ))
          ) : (
            <div className="results-launch">
              <h2>{t.resultsTitle}</h2>
              <p>{t.resultsText}</p>
            </div>
          )}
        </Container>
      </section>
      <section className="section family-section">
        <Container className="split">
          <div>
            <span className="eyebrow">{t.familyEyebrow}</span>
            <h2>{t.familyTitle}</h2>
            <p className="family-subtitle">{t.familySubtitle}</p>
          </div>
          <div>
            <p>{t.familyText}</p>
            <ul className="family-points">
              {t.familyPoints.map((p) => (
                <li key={p}>
                  <Check size={18} />
                  {p}
                </li>
              ))}
            </ul>
            <QuoteButton
              onClick={() => (track("family_pet_click"), choose("family"))}
            >
              {t.familyCta}
            </QuoteButton>
            <p className="note">{t.familyNote}</p>
          </div>
        </Container>
      </section>
      <section className="section mobile-comparison">
        <Container>
          <h2>{t.mobileTitle}</h2>
          <div className="mobile-columns">
            {[
              { title: t.studio, steps: t.studioSteps },
              { title: business.name, steps: t.mobileSteps },
            ].map((col, i) => (
              <div key={col.title} className={i === 1 ? "prime-way" : ""}>
                <h3>{col.title}</h3>
                <ol>
                  {col.steps.map((s, k) => (
                    <li key={s}>
                      <span>0{k + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <p className="note">{t.garage}</p>
        </Container>
      </section>
      <EquipmentSection lang={lang} garage={t.garageShort} />
      <section id="services" className="section materials-section">
        <Container className="split">
          <div>
            <span className="eyebrow">PRIME / DETAILING</span>
            <h2>{t.serviceTitle}</h2>
            <p>{t.serviceIntro}</p>
            <aside className="aftercare">
              <h3>{t.aftercareTitle}</h3>
              <p>{t.aftercare}</p>
              <p className="note">{t.drying}</p>
            </aside>
          </div>
          <div className="material-list">
            {t.materials.map((m, i) => (
              <details key={m.title} open={i === 0}>
                <summary>
                  <span>0{i + 1}</span>
                  {m.title}
                  <ArrowUpRight size={18} />
                </summary>
                <p>{m.text}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>
      <section className="section area-section">
        <Container className="split">
          <div>
            <span className="eyebrow">
              <MapPin size={16} />
              {business.area[lang]}
            </span>
            <h2>{t.areaTitle}</h2>
            <p>{t.areaText}</p>
          </div>
          <div className="districts">
            {business.districts.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </Container>
      </section>
      {reviews.some((r) => r.verified && r.permissionConfirmed) && (
        <section className="section">
          <Container>
            <h2>{t.reviewsTitle}</h2>
            {reviews
              .filter((r) => r.verified && r.permissionConfirmed)
              .map((r) => (
                <blockquote key={r.id}>
                  <p>{r.text[lang]}</p>
                  <cite>
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {r.name}
                    </a>
                  </cite>
                </blockquote>
              ))}
          </Container>
        </section>
      )}
      <section className="section fleet-preview">
        <Container className="split">
          <div>
            <span className="eyebrow">PRIME / B2B</span>
            <h2>{extended[lang].fleet.title}</h2>
            <p>{extended[lang].fleet.intro}</p>
          </div>
          <div>
            <p>{extended[lang].fleet.text}</p>
            <p className="note">{extended[lang].fleet.line}</p>
            <Link className="btn primary" to={`/${lang}/floty`}>
              {extended[lang].fleet.cta}
            </Link>
          </div>
        </Container>
      </section>
      <section className="section blog-preview">
        <Container className="split">
          <div>
            <span className="eyebrow">{extended[lang].blogNav}</span>
            <h2>{extended[lang].blog.title}</h2>
          </div>
          <div>
            <p>{extended[lang].blog.intro}</p>
            <Link className="text-button" to={`/${lang}/blog`}>
              {extended[lang].blog.all}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </Container>
      </section>
      <section id="faq" className="section faq-section">
        <Container className="faq-layout">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2>{t.faqTitle}</h2>
          </div>
          <FAQAccordion t={t} />
        </Container>
      </section>
      <section id="contact" className="section contact-section">
        <Container className="split">
          <div>
            <span className="eyebrow">PRIME MOB DETAIL / WARSZAWA</span>
            <h2>{t.contactTitle}</h2>
            <p>{t.contactText}</p>
            <div className="contact-buttons">
              <QuoteButton onClick={() => openQuote()}>
                {t.contactCta}
              </QuoteButton>
              <WhatsAppAction>WhatsApp</WhatsAppAction>
            </div>
          </div>
          <div className="contact-details">
            <span>{t.call}</span>
            <a
              href={business.telephoneUrl}
              onClick={() => track("click_phone")}
            >
              {business.phone}
            </a>
            <span>{business.area[lang]}</span>
            <p>{t.power}</p>
            <a
              className="facebook"
              href={business.facebook}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("click_facebook")}
            >
              Facebook <ArrowUpRight size={18} />
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
