import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { business, type Lang } from "../config/business";
import {
  pricing,
  dirtLevels,
  problemIds,
  type CalculatorState,
} from "../config/pricing";
import type { Dictionary } from "../i18n";
import {
  buildMessage,
  copyText,
  emptyQuote,
  formatEstimate,
  parkings,
  quoteSchema,
  sizes,
  summaryRows,
  today,
  whatsappLink,
  type Quote,
} from "../lib/quote";
import { clearDraft, loadDraft, saveDraft } from "../lib/draft";
import { clearPhotos, usePhotoSession } from "../lib/photos";
import {
  quoteSubmissionAdapter,
  canSharePhotos,
  sharePhotos,
} from "../lib/submission";
import { sharing } from "../i18n/sharing";
import { track } from "../lib/tracking";
import { PhotoPicker } from "./PhotoPicker";
const stepFields: (keyof Quote)[][] = [
  ["vehicle", "size", "package"],
  [
    "condition",
    "problems",
    "district",
    "address",
    "parking",
    "serviceSpace",
    "power",
  ],
  ["date", "time", "flexible", "description"],
  ["name", "phone", "email", "consent", "contactMethod"],
];
export default function QuoteConfigurator({
  t,
  lang,
  initialPackage,
  initialState,
  onClose,
}: {
  t: Dictionary;
  lang: Lang;
  initialPackage?: Quote["package"];
  initialState?: CalculatorState;
  onClose: () => void;
}) {
  const f = t.form,
    c = t.calculator;
  const [step, setStep] = useState(0),
    [photos, setPhotos] = usePhotoSession(),
    [toast, setToast] = useState(""),
    [manual, setManual] = useState(false),
    [attempted, setAttempted] = useState(false),
    [busy, setBusy] = useState(false),
    [fallback, setFallback] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const {
    register,
    control,
    trigger,
    getFieldState,
    reset,
    formState: { errors },
  } = useForm<Quote>({
    resolver: zodResolver(quoteSchema(f)),
    defaultValues: {
      ...loadDraft(),
      ...(initialState
        ? Object.fromEntries(
            Object.entries(initialState).filter(([, v]) => v !== undefined),
          )
        : {}),
      ...(initialPackage ? { package: initialPackage } : {}),
    },
    mode: "onTouched",
  });
  const values = useWatch({ control }) as Quote;
  useEffect(() => saveDraft(values), [values]);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const field = (
    key:
      | "vehicle"
      | "district"
      | "address"
      | "time"
      | "name"
      | "phone"
      | "date"
      | "email",
    label: string,
    placeholder = "",
    type = "text",
  ) => (
    <div className="field">
      <label htmlFor={key}>{label}</label>
      <input
        id={key}
        type={type}
        {...register(key)}
        placeholder={placeholder}
        maxLength={
          key === "address"
            ? 200
            : key === "email"
              ? 254
              : key === "vehicle"
                ? 120
                : 100
        }
        autoComplete={
          key === "name"
            ? "given-name"
            : key === "phone"
              ? "tel"
              : key === "email"
                ? "email"
                : key === "address"
                  ? "street-address"
                  : "off"
        }
        min={key === "date" ? today() : undefined}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
      />
      {errors[key] && (
        <span className="error" id={`${key}-error`}>
          {errors[key]?.message}
        </span>
      )}
    </div>
  );
  const next = async () => {
    setAttempted(true);
    if (await trigger(stepFields[step], { shouldFocus: true })) {
      setStep(step + 1);
      setAttempted(false);
    }
  };
  const message = buildMessage(values, t, photos.length);
  const send = async () => {
    if (busy) return;
    if (!(await trigger())) {
      const invalid = stepFields.findIndex((fields) =>
        fields.some((k) => getFieldState(k).invalid),
      );
      setStep(Math.max(invalid, 0));
      setAttempted(true);
      return;
    }
    setBusy(true);
    setFallback(false);
    try {
      const result = await quoteSubmissionAdapter.submit({
        message,
        photos: photos.map((p) => p.file),
      });
      if (result.status === "handoff") {
        setFallback(true);
        setManual(!result.copied);
        setToast(`${f.opening}${result.copied ? "" : ` ${f.copyFailed}`}`);
        track("submit_quote", { mode: "whatsapp" });
        track("click_whatsapp");
      } else if (result.status === "confirmed") setToast(f.success);
      else {
        setToast(f.unavailable);
        setFallback(true);
      }
    } catch {
      setToast(f.error);
      setFallback(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="configurator">
      <div className="quote-heading">
        <span className="eyebrow">
          {business.name} / {f.step} {step + 1} {f.of} 5
        </span>
        <h2>{f.title}</h2>
        <p>{f.intro}</p>
      </div>
      <ol className="step-track" aria-label={f.title}>
        {f.steps.map((s, i) => (
          <li
            key={s}
            className={i === step ? "active" : i < step ? "complete" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step ? <Check size={14} /> : i + 1}</span>
            <small>{s}</small>
          </li>
        ))}
      </ol>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 4) void next();
        }}
      >
        <h3 ref={heading} tabIndex={-1}>
          {f.steps[step]}
        </h3>
        {attempted && Object.keys(errors).length > 0 && (
          <p role="alert" className="error-summary">
            {f.errorSummary}
          </p>
        )}
        {step === 0 && (
          <>
            {field("vehicle", f.vehicle, f.vehiclePlaceholder)}
            <fieldset>
              <legend>{c.size}</legend>
              <div className="options">
                {sizes.map((v, i) => (
                  <label className="option" key={v}>
                    <input type="radio" value={v} {...register("size")} />
                    <span>{c.sizes[i]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>{f.package}</legend>
              <div className="options package-options">
                {business.packages.map((p) => (
                  <label className="option" key={p.id}>
                    <input type="radio" value={p.id} {...register("package")} />
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {t.from} {p.price} {t.currency}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="note">
              {
                t.packages[
                  business.packages.findIndex((p) => p.id === values.package)
                ].note
              }
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <fieldset>
              <legend>{c.condition}</legend>
              <div className="options">
                {dirtLevels.map((v, i) => (
                  <label className="option" key={v}>
                    <input type="radio" value={v} {...register("condition")} />
                    <span>{c.levels[i]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>{c.problems}</legend>
              <div className="options">
                {problemIds.map((v, i) => (
                  <label className="option" key={v}>
                    <input
                      type="checkbox"
                      value={v}
                      {...register("problems")}
                    />
                    <span>{c.problemOptions[i]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>{c.power}</legend>
              <div className="options">
                {(["customer", "prime"] as const).map((v, i) => (
                  <label className="option" key={v}>
                    <input type="radio" value={v} {...register("power")} />
                    <span>
                      {c.powerOptions[i]}
                      <small>
                        {v === "prime" && pricing.power[values.package]
                          ? `+${pricing.power[values.package]} ${t.currency}`
                          : c.powerIncluded}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {field("district", f.district)}
            {field("address", `${f.address} (${f.optional})`)}
            <fieldset>
              <legend>{f.parking}</legend>
              <div className="options">
                {parkings.map((v, i) => (
                  <label className="option" key={v}>
                    <input type="radio" value={v} {...register("parking")} />
                    <span>{f.parkingOptions[i]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {values.parking === "garage" && (
              <p className="warning">{t.garage}</p>
            )}
            <fieldset>
              <legend>{f.serviceSpace}</legend>
              <div className="options">
                {["yes", "unsure"].map((v, i) => (
                  <label className="option" key={v}>
                    <input
                      type="radio"
                      value={v}
                      {...register("serviceSpace")}
                    />
                    <span>{f.spaceOptions[i]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        {step === 2 && (
          <>
            {field("date", f.date, "", "date")}
            {field("time", `${f.time} (${f.optional})`, f.timePlaceholder)}
            <label className="check-label">
              <input type="checkbox" {...register("flexible")} />
              {f.flexible}
            </label>
            <p className="note">{f.dateNote}</p>
            <div className="field">
              <label htmlFor="description">
                {f.description} ({f.optional})
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={3}
                maxLength={2000}
                placeholder={f.descriptionPlaceholder}
              />
            </div>
            <PhotoPicker photos={photos} onChange={setPhotos} t={f} />
          </>
        )}
        {step === 3 && (
          <>
            {field("name", f.name)}
            {field("phone", f.phone, "+48", "tel")}
            {field("email", `${f.email} (${f.optional})`, "", "email")}
            <fieldset>
              <legend>{f.contactMethod}</legend>
              <div className="options">
                {["whatsapp", "phone"].map((v, i) => (
                  <label className="option" key={v}>
                    <input
                      type="radio"
                      value={v}
                      {...register("contactMethod")}
                    />
                    <span>{f.contactOptions[i]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="check-label consent">
              <input
                type="checkbox"
                {...register("consent")}
                aria-invalid={!!errors.consent}
                aria-describedby={errors.consent ? "consent-error" : undefined}
              />
              <span>
                {f.consent}{" "}
                <Link to={`/${lang}/privacy`} onClick={onClose}>
                  {t.privacy}
                </Link>
              </span>
            </label>
            {errors.consent && (
              <p id="consent-error" className="error" role="alert">
                {errors.consent.message}
              </p>
            )}
          </>
        )}
        {step === 4 && (
          <div className="summary">
            <div className="summary-price" role="status">
              <strong>{formatEstimate(values, t)}</strong>
              <p>{c.note}</p>
            </div>
            <dl>
              {summaryRows(values, t, photos.length).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="warning">{f.photoNote}</p>
            {canSharePhotos(photos.map((p) => p.file)) && (
              <div className="photo-share">
                <p className="note">{sharing[lang].hint}</p>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const result = await sharePhotos({
                        message,
                        photos: photos.map((p) => p.file),
                      });
                      if (result === "shared") setToast(sharing[lang].shared);
                      if (result === "unavailable")
                        setToast(sharing[lang].failed);
                    } catch {
                      setToast(sharing[lang].failed);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {sharing[lang].action}
                </button>
              </div>
            )}
            <div className="summary-actions">
              <button
                className="btn secondary"
                type="button"
                onClick={async () => {
                  const ok = await copyText(message);
                  setManual(!ok);
                  setToast(ok ? f.copied : f.copyFailed);
                }}
              >
                <Copy size={17} />
                {f.copy}
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={send}
              >
                <MessageCircle size={18} />
                {busy ? f.submitting : f.send}
              </button>
            </div>
            {(manual || fallback) && (
              <>
                <textarea
                  aria-label={f.summary}
                  readOnly
                  rows={8}
                  value={message}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <a
                  className="btn whatsapp"
                  href={whatsappLink(message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("click_whatsapp")}
                >
                  {t.whatsapp}
                </a>
              </>
            )}
            <button
              type="button"
              className="text-button"
              onClick={() => setStep(0)}
            >
              <ArrowLeft size={16} />
              {f.edit}
            </button>
          </div>
        )}
        {step < 4 && (
          <div className="form-actions">
            <button
              type="button"
              className="btn secondary"
              disabled={step === 0}
              onClick={() => {
                setStep(step - 1);
                setAttempted(false);
              }}
            >
              <ArrowLeft size={17} />
              {f.prev}
            </button>
            <button type="submit" className="btn primary">
              {f.next}
              <ArrowRight size={17} />
            </button>
          </div>
        )}
      </form>
      <div className="draft-note">
        <span>{f.saved}</span>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            reset({ ...emptyQuote });
            clearPhotos();
            clearDraft();
            setStep(0);
            setManual(false);
            setFallback(false);
            setAttempted(false);
            setToast(f.cleared);
          }}
        >
          <RotateCcw size={14} />
          {f.clear}
        </button>
      </div>
      <div
        className={`toast ${toast ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </div>
  );
}
