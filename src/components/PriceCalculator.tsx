import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  pricing,
  vehicleSizes,
  dirtLevels,
  problemIds,
  type CalculatorState,
} from "../config/pricing";
import {
  calculateEstimate,
  recommendPackage,
  saveCalculator,
} from "../lib/pricing";
import { formatEstimate } from "../lib/quote";
import { track } from "../lib/tracking";
import type { Dictionary } from "../i18n";
export function PriceResult({
  state,
  t,
}: {
  state: CalculatorState;
  t: Dictionary;
}) {
  const result = calculateEstimate(state);
  return (
    <div className="price-result" aria-live="polite" aria-atomic="true">
      <span className="eyebrow">{t.calculator.steps[6]}</span>
      <strong>{formatEstimate(state, t)}</strong>
      <p>{t.calculator.note}</p>
      {result.adjustments.length > 0 && (
        <ul>
          {result.adjustments.map((a) => (
            <li key={a}>
              <Check size={15} />
              {t.calculator.adjustments[a]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export function PriceCalculator({
  t,
  state,
  onChange,
  onQuote,
}: {
  t: Dictionary;
  state: CalculatorState;
  onChange: (s: CalculatorState) => void;
  onQuote: (s: CalculatorState) => void;
}) {
  const [step, setStep] = useState(0),
    [error, setError] = useState(false);
  const started = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const c = t.calculator;
  const recommendation = recommendPackage(state);
  useEffect(() => saveCalculator(state), [state]);
  const change = (s: CalculatorState) => {
    if (!started.current) {
      track("start_calculator");
      started.current = true;
    }
    onChange(s);
    setError(false);
  };
  const move = (to: number) => {
    setStep(to);
    setError(false);
    requestAnimationFrame(() => heading.current?.focus());
  };
  const next = () => {
    if (
      (step === 0 && !state.package) ||
      (step === 1 && !state.size) ||
      (step === 2 && !state.condition)
    ) {
      setError(true);
      return;
    }
    if (
      (step === 4 && !state.power) ||
      (step === 5 && !state.district?.trim())
    ) {
      setError(true);
      return;
    }
    if (step === 5) {
      const result = calculateEstimate(state);
      if (result.kind !== "pending")
        track("calculator_complete", { kind: result.kind });
    }
    move(step + 1);
  };
  return (
    <div className="calculator-shell">
      <ol className="calculator-steps" aria-label={c.title}>
        {c.steps.map((s, i) => (
          <li key={s} aria-current={step === i ? "step" : undefined}>
            <span>{i + 1}</span>
            <small>{s}</small>
          </li>
        ))}
      </ol>
      <div className="calculator-body">
        <div className="calculator-input">
          <h3 tabIndex={-1} ref={heading}>
            {c.steps[step]}
          </h3>
          {error && (
            <p className="error" role="alert">
              {c.select}
            </p>
          )}
          {step === 0 && (
            <fieldset>
              <legend className="sr-only">{c.steps[0]}</legend>
              <div className="calc-options">
                {pricing.packages.map((p, i) => (
                  <label key={p.id} className="calc-option">
                    <input
                      type="radio"
                      name="calc-package"
                      checked={state.package === p.id}
                      onChange={() => {
                        change({ ...state, package: p.id });
                        track("select_package", { package: p.id });
                      }}
                    />
                    <span>
                      <strong>{p.name}</strong>
                      <small>{t.packages[i].short}</small>
                    </span>
                    <b>
                      {t.from} {p.price} {t.currency}
                    </b>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {step === 1 && (
            <fieldset>
              <legend className="sr-only">{c.size}</legend>
              <div className="calc-options">
                {vehicleSizes.map((v, i) => (
                  <label className="calc-option" key={v}>
                    <input
                      type="radio"
                      name="calc-size"
                      checked={state.size === v}
                      onChange={() => {
                        change({ ...state, size: v });
                        track("select_vehicle_size", { size: v });
                      }}
                    />
                    <span>{c.sizes[i]}</span>
                    <b>
                      {pricing.vehicle[v] === null
                        ? "—"
                        : pricing.vehicle[v]
                          ? `+${pricing.vehicle[v]} ${t.currency}`
                          : "—"}
                    </b>
                  </label>
                ))}
              </div>
              <p className="note">
                {c.base}. {c.van}.
              </p>
            </fieldset>
          )}
          {step === 2 && (
            <fieldset>
              <legend className="sr-only">{c.condition}</legend>
              <div className="calc-options">
                {dirtLevels.map((v, i) => (
                  <label className="calc-option" key={v}>
                    <input
                      type="radio"
                      name="calc-condition"
                      checked={state.condition === v}
                      onChange={() => change({ ...state, condition: v })}
                    />
                    <span>{c.levels[i]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {step === 3 && (
            <fieldset>
              <legend className="sr-only">{c.problems}</legend>
              <p className="note">{c.problemHint}</p>
              <div className="calc-options">
                {problemIds.map((v, i) => (
                  <label className="calc-option" key={v}>
                    <input
                      type="checkbox"
                      checked={state.problems.includes(v)}
                      onChange={(e) =>
                        change({
                          ...state,
                          problems: e.target.checked
                            ? [...state.problems, v]
                            : state.problems.filter((p) => p !== v),
                        })
                      }
                    />
                    <span>{c.problemOptions[i]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {step === 4 && (
            <fieldset>
              <legend>{c.power}</legend>
              <p className="note">{c.powerNote}</p>
              <div className="calc-options">
                {(["customer", "prime"] as const).map((v, i) => (
                  <label className="calc-option" key={v}>
                    <input
                      type="radio"
                      name="calc-power"
                      checked={state.power === v}
                      onChange={() => {
                        change({ ...state, power: v });
                        track("select_power_option", { power: v });
                      }}
                    />
                    <span>{c.powerOptions[i]}</span>
                    <b>
                      {v === "prime" &&
                      state.package &&
                      pricing.power[state.package]
                        ? `+${pricing.power[state.package]} ${t.currency}`
                        : c.powerIncluded}
                    </b>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {step === 5 && (
            <div className="field">
              <label htmlFor="calc-district">{c.district}</label>
              <input
                id="calc-district"
                value={state.district || ""}
                maxLength={150}
                onChange={(e) => change({ ...state, district: e.target.value })}
              />
              <p className="note">{c.locationHint}</p>
            </div>
          )}
          {step === 6 && (
            <>
              <PriceResult state={state} t={t} />
              {recommendation && (
                <div className="recommendation">
                  <h4>
                    {c.recommended}:{" "}
                    {
                      pricing.packages.find(
                        (p) => p.id === recommendation.package,
                      )!.name
                    }
                  </h4>
                  <p>{c.reasons[recommendation.reason]}</p>
                  <button
                    className="text-button"
                    onClick={() =>
                      change({ ...state, package: recommendation.package })
                    }
                  >
                    {c.apply}
                    <ArrowRight size={16} />
                  </button>
                  <small>{c.keep}</small>
                </div>
              )}
              <button
                className="btn primary calculator-submit"
                onClick={() => onQuote(state)}
              >
                {c.cta}
                <ArrowRight size={18} />
              </button>
            </>
          )}
          <div className="form-actions">
            <button
              className="text-button"
              disabled={step === 0}
              onClick={() => move(step - 1)}
            >
              <ArrowLeft size={17} />
              {t.form.prev}
            </button>
            {step < 6 ? (
              <button className="btn primary" onClick={next}>
                {t.form.next}
                <ArrowRight size={17} />
              </button>
            ) : (
              <button className="text-button" onClick={() => move(0)}>
                {c.edit}
              </button>
            )}
          </div>
        </div>
        <aside className="calculator-aside">
          <span className="eyebrow">{c.rulesTitle}</span>
          <p>{c.base}</p>
          <dl>
            {[
              [c.sedan, `+${pricing.vehicle.sedan}`],
              [c.suv, `+${pricing.vehicle.suv}`],
              [c.large, `+${pricing.vehicle.large}`],
              [c.dirt, `+${pricing.heavyDirt.join("–")}`],
              [c.hair, `+${pricing.substantialHair.join("–")}`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {value} {t.currency}
                  <small>{c.approx}</small>
                </dd>
              </div>
            ))}
          </dl>
          <p>{c.van}</p>
          <p className="note">{c.powerNote}</p>
          <dl>
            {pricing.packages.map((p) => (
              <div key={p.id}>
                <dt>
                  {p.name} · {c.powerLabel}
                </dt>
                <dd>
                  {pricing.power[p.id]
                    ? `+${pricing.power[p.id]} ${t.currency}`
                    : c.powerIncluded}
                </dd>
              </div>
            ))}
          </dl>
          <p className="calc-included">{c.included}</p>
          <p className="note">{t.priceConfirm}</p>
        </aside>
      </div>
    </div>
  );
}
