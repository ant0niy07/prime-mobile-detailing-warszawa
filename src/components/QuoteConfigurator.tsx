import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
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
import type { Dictionary } from "../i18n";
import {
  buildMessage,
  conditions,
  copyText,
  emptyQuote,
  parkings,
  quoteSchema,
  sizes,
  summaryRows,
  today,
  whatsappLink,
  type Quote,
} from "../lib/quote";
import { clearDraft, loadDraft, saveDraft } from "../lib/draft";
import { PhotoPicker, type Photo } from "./PhotoPicker";
const stepFields: FieldPath<Quote>[][] = [
  ["vehicle", "size"],
  ["package"],
  ["conditions"],
  ["district", "address", "parking"],
  ["date", "time", "flexible"],
  ["description"],
  ["name", "phone", "consent", "contactMethod"],
];
export default function QuoteConfigurator({
  t,
  lang,
  initialPackage,
  onClose,
}: {
  t: Dictionary;
  lang: Lang;
  initialPackage?: Quote["package"];
  onClose: () => void;
}) {
  const f = t.form;
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [toast, setToast] = useState("");
  const [manual, setManual] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const photoRef = useRef(photos);
  const heading = useRef<HTMLHeadingElement>(null);
  const {
    register,
    control,
    trigger,
    getValues,
    reset,
    formState: { errors },
  } = useForm<Quote>({
    resolver: zodResolver(quoteSchema(f)),
    defaultValues: {
      ...loadDraft(),
      ...(initialPackage ? { package: initialPackage } : {}),
    },
    mode: "onTouched",
  });
  const values = useWatch({ control }) as Quote;
  useEffect(() => {
    saveDraft(values);
  }, [values]);
  useEffect(() => {
    photoRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => photoRef.current.forEach((p) => URL.revokeObjectURL(p.url)),
    [],
  );
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 8000);
    return () => clearTimeout(timer);
  }, [toast]);
  const field = (
    key:
      "vehicle" | "district" | "address" | "time" | "name" | "phone" | "date",
    label: string,
    placeholder = "",
    type = "text",
  ) => (
    <div className="field">
      <label htmlFor={key}>{label}</label>
      <input
        id={key}
        type={type}
        placeholder={placeholder}
        {...register(key)}
        maxLength={
          key === "address"
            ? 200
            : key === "vehicle"
              ? 120
              : key === "name"
                ? 100
                : key === "time"
                  ? 100
                  : 150
        }
        autoComplete={
          key === "name"
            ? "given-name"
            : key === "phone"
              ? "tel"
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
  const copy = async () => {
    const ok = await copyText(buildMessage(getValues(), t, photos.length));
    setManual(!ok);
    setToast(ok ? f.copied : f.copyFailed);
  };
  const message = buildMessage(values, t, photos.length);
  const selectedPackage = business.packages.find(
    (p) => p.id === values.package,
  );
  return (
    <div className="configurator">
      <div className="quote-heading">
        <span className="eyebrow">
          {business.logo} / {f.step} {step + 1} {f.of} 8
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
        onSubmit={(event) => {
          event.preventDefault();
          if (step < 7) void next();
        }}
        noValidate
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
              <legend>{f.size}</legend>
              <div className="options">
                {sizes.map((v, i) => (
                  <label className="option" key={v}>
                    <input type="radio" value={v} {...register("size")} />
                    <span>{f.sizes[i]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        {step === 1 && (
          <fieldset>
            <legend className="sr-only">{f.package}</legend>
            <div className="options package-options">
              {[
                ...business.packages,
                { id: "help", name: f.help, price: 0 },
              ].map((p) => (
                <label className="option" key={p.id}>
                  <input type="radio" value={p.id} {...register("package")} />
                  <span>
                    <strong>{p.name}</strong>
                    {p.price > 0 && (
                      <small>
                        {t.from} {p.price} {t.currency}
                      </small>
                    )}
                  </span>
                </label>
              ))}
            </div>
            <p className="note">{t.priceConfirm}</p>
          </fieldset>
        )}
        {step === 2 && (
          <fieldset>
            <legend>{f.conditions}</legend>
            <p className="note">{f.conditionsHint}</p>
            <div className="options">
              {conditions.map((v, i) => (
                <label className="option" key={v}>
                  <input
                    type="checkbox"
                    value={v}
                    {...register("conditions")}
                  />
                  <span>{f.conditionOptions[i]}</span>
                </label>
              ))}
            </div>
            {errors.conditions && (
              <p className="error" role="alert">
                {errors.conditions.message}
              </p>
            )}
          </fieldset>
        )}
        {step === 3 && (
          <>
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
          </>
        )}
        {step === 4 && (
          <>
            {field("date", f.date, "", "date")}
            {field("time", `${f.time} (${f.optional})`, f.timePlaceholder)}
            <label className="check-label">
              <input type="checkbox" {...register("flexible")} />
              {f.flexible}
            </label>
            <p className="note">{f.dateNote}</p>
          </>
        )}
        {step === 5 && (
          <>
            <div className="field">
              <label htmlFor="description">
                {f.description} ({f.optional})
              </label>
              <textarea
                id="description"
                {...register("description")}
                placeholder={f.descriptionPlaceholder}
                maxLength={2000}
                rows={4}
              />
            </div>
            <PhotoPicker photos={photos} onChange={setPhotos} t={f} />
          </>
        )}
        {step === 6 && (
          <>
            {field("name", f.name)}
            {field("phone", f.phone, "+48", "tel")}
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
              />
              <span>
                {f.consent}{" "}
                <Link to={`/${lang}/privacy`} onClick={onClose}>
                  {t.privacy}
                </Link>
              </span>
            </label>
            {errors.consent && (
              <p className="error" role="alert">
                {errors.consent.message}
              </p>
            )}
          </>
        )}
        {step === 7 && (
          <div className="summary">
            <dl>
              {summaryRows(values, t, photos.length).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="summary-price">
              {selectedPackage ? (
                <span>
                  {t.from} <strong>{selectedPackage.price}</strong> {t.currency}
                </span>
              ) : (
                f.unknownPrice
              )}
              <p>{f.finalPrice}</p>
            </div>
            <p className="warning">{f.photoNote}</p>
            <div className="summary-actions">
              <button className="btn secondary" type="button" onClick={copy}>
                <Copy size={18} />
                {f.copy}
              </button>
              <a
                className="btn whatsapp"
                href={whatsappLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async (e) => {
                  e.preventDefault();
                  if (!(await trigger())) {
                    setStep(0);
                    return;
                  }
                  const ok = await copyText(message);
                  setManual(!ok);
                  setToast(ok ? f.copied : f.copyFailed);
                  const a = document.createElement("a");
                  a.href = whatsappLink(message);
                  a.target = "_blank";
                  a.rel = "noopener noreferrer";
                  document.body.append(a);
                  a.click();
                  a.remove();
                }}
              >
                <MessageCircle size={18} />
                {f.send}
              </a>
            </div>
            {manual && (
              <textarea
                aria-label={f.summary}
                readOnly
                value={message}
                rows={10}
                onFocus={(e) => e.currentTarget.select()}
              />
            )}
            <button
              className="text-button"
              type="button"
              onClick={() => setStep(0)}
            >
              <ArrowLeft size={16} />
              {f.edit}
            </button>
          </div>
        )}
        {step < 7 && (
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
              <ArrowLeft size={18} />
              {f.prev}
            </button>
            <button type="submit" className="btn primary">
              {f.next}
              <ArrowRight size={18} />
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
            photoRef.current.forEach((p) => URL.revokeObjectURL(p.url));
            setPhotos([]);
            setStep(0);
            setManual(false);
            setAttempted(false);
            clearDraft();
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
