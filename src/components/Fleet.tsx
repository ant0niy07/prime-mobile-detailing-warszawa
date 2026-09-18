import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { fleetSchema } from "../lib/fleet";
import { business, type Lang } from "../config/business";
import { extended } from "../i18n/extended";
import { dictionaries } from "../i18n";
import { whatsappSubmission } from "../lib/submission";
import { whatsappLink, copyText } from "../lib/quote";
import { track } from "../lib/tracking";
import { Container } from "./UI";
export default function Fleet({ lang }: { lang: Lang }) {
  const t = extended[lang],
    f = t.fleet;
  const [errors, setErrors] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [message, setMessage] = useState("");
  const started = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = fleetSchema.safeParse({
      ...raw,
      consent: raw.consent === "on",
    });
    if (!parsed.success) {
      const fields = parsed.error.issues.map((i) => String(i.path[0]));
      setErrors(fields);
      form.current
        ?.querySelector<HTMLElement>(`[name="${fields[0]}"]`)
        ?.focus();
      return;
    }
    setErrors([]);
    setBusy(true);
    const text = [
      f.messageTitle,
      "",
      ...Object.entries(f.fields).map(
        ([key, label]) =>
          `${label}: ${key === "frequency" ? f.frequencyOptions[["once", "regular", "monthly", "quarterly"].indexOf(parsed.data.frequency)] : key === "power" ? f.powerOptions[["yes", "no", "unsure"].indexOf(parsed.data.power)] : parsed.data[key as keyof typeof parsed.data] || "—"}`,
      ),
    ].join("\n");
    setMessage(text);
    try {
      const result = await whatsappSubmission.submit({
        message: text,
        photos: [],
      });
      setNotice(result.status === "handoff" ? f.ready : f.failed);
      track("fleet_lead_submit");
    } catch {
      setNotice(f.failed);
    } finally {
      setBusy(false);
    }
  };
  const field = (
    key: keyof typeof f.fields,
    type = "text",
    optional = false,
  ) => (
    <div className="field" key={key}>
      <label htmlFor={`fleet-${key}`}>{f.fields[key]}</label>
      <input
        id={`fleet-${key}`}
        name={key}
        type={type}
        required={!optional}
        min={type === "number" ? 1 : undefined}
        max={type === "number" ? 10000 : undefined}
        maxLength={key === "message" ? 2000 : 500}
        autoComplete={
          key === "email"
            ? "email"
            : key === "phone"
              ? "tel"
              : key === "contact"
                ? "name"
                : key === "company"
                  ? "organization"
                  : "off"
        }
        aria-invalid={errors.includes(key)}
        aria-describedby={errors.includes(key) ? "fleet-errors" : undefined}
      />
    </div>
  );
  return (
    <>
      <section className="section fleet-hero">
        <Container>
          <nav className="breadcrumbs">
            <Link to={`/${lang}`}>{t.home}</Link>
            <span>/</span>
            <span>{t.fleetNav}</span>
          </nav>
          <div className="split">
            <div>
              <p className="eyebrow">PRIME / B2B</p>
              <h1>{f.title}</h1>
              <p className="hero-intro">{f.intro}</p>
              <a className="btn primary" href="#fleet-form">
                {f.cta}
              </a>
            </div>
            <div>
              <p>{f.text}</p>
              <ul className="family-points">
                {f.benefits.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="note">{f.audience}</p>
            </div>
          </div>
        </Container>
      </section>
      <section className="section">
        <Container className="fleet-form-layout">
          <div>
            <span className="eyebrow">{f.line}</span>
            <h2>{f.formTitle}</h2>
            <p className="note">{f.handoff}</p>
            <p className="note">{dictionaries[lang].garage}</p>
            <a
              className="text-button"
              href={business.telephoneUrl}
              onClick={() => track("click_phone")}
            >
              {business.phone}
            </a>
          </div>
          <form
            id="fleet-form"
            ref={form}
            onSubmit={submit}
            noValidate
            onFocus={() => {
              if (!started.current) {
                track("fleet_lead_start");
                started.current = true;
              }
            }}
          >
            <div className="form-grid">
              {field("company")}
              {field("taxId", "text", true)}
              {field("contact")}
              {field("phone", "tel")}
              {field("email", "email")}
              {field("count", "number")}
              {field("types")}
              {field("location")}
            </div>
            {(["frequency", "power"] as const).map((key) => (
              <div className="field" key={key}>
                <label htmlFor={`fleet-${key}`}>{f.fields[key]}</label>
                <select
                  id={`fleet-${key}`}
                  name={key}
                  required
                  aria-invalid={errors.includes(key)}
                  aria-describedby={
                    errors.includes(key) ? "fleet-errors" : undefined
                  }
                >
                  <option value="">—</option>
                  {f[
                    key === "frequency" ? "frequencyOptions" : "powerOptions"
                  ].map((s, i) => (
                    <option
                      key={i}
                      value={
                        (key === "frequency"
                          ? ["once", "regular", "monthly", "quarterly"]
                          : ["yes", "no", "unsure"])[i]
                      }
                    >
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {(["scope", "message"] as const).map((key) => (
              <div className="field" key={key}>
                <label htmlFor={`fleet-${key}`}>{f.fields[key]}</label>
                <textarea
                  id={`fleet-${key}`}
                  name={key}
                  maxLength={2000}
                  rows={3}
                  required={key === "scope"}
                  aria-invalid={errors.includes(key)}
                  aria-describedby={
                    errors.includes(key) ? "fleet-errors" : undefined
                  }
                />
              </div>
            ))}
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="fleet-website">Website</label>
              <input
                id="fleet-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                name="consent"
                required
                aria-invalid={errors.includes("consent")}
              />
              <span>
                {f.consent}{" "}
                <Link className="text-button" to={`/${lang}/privacy`}>
                  {dictionaries[lang].privacy}
                </Link>
              </span>
            </label>
            <p id="fleet-errors" role="alert" className="error">
              {errors.length ? f.invalid : ""}
            </p>
            <button className="btn primary" disabled={busy}>
              {busy ? t.loading : f.submit}
            </button>
            <p role="status" className="note">
              {notice}
            </p>
            {message && (
              <div className="fleet-fallback">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => void copyText(message)}
                >
                  {dictionaries[lang].form.copy}
                </button>
                <a
                  className="btn whatsapp"
                  href={whatsappLink(message)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
                <textarea
                  aria-label={dictionaries[lang].form.summary}
                  readOnly
                  value={message}
                  rows={6}
                />
              </div>
            )}
          </form>
        </Container>
      </section>
    </>
  );
}
