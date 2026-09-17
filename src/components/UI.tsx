import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ChevronDown,
  MessageCircle,
  MoveHorizontal,
} from "lucide-react";
import type { Dictionary } from "../i18n";
import { business } from "../config/business";
import { gallery } from "../config/gallery";
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`container ${className}`}>{children}</div>;
}
export function MotionReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45 }}
    >
      {children}
    </motion.div>
  );
}
export function QuoteButton({
  children,
  onClick,
  secondary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      className={`btn ${secondary ? "secondary" : "primary"}`}
      onClick={onClick}
    >
      {children}
      <ArrowUpRight size={18} />
    </button>
  );
}
export function WhatsAppAction({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={business.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn whatsapp ${className}`}
    >
      <MessageCircle size={19} />
      {children}
      <ArrowUpRight size={16} />
    </a>
  );
}
export function Photo({
  base,
  alt,
  hero = false,
  className = "",
}: {
  base: string;
  alt: string;
  hero?: boolean;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={`${base}-1200.webp`}
      srcSet={`${base}-640.webp 640w, ${base}-1200.webp 1200w, ${base}-1920.webp 1920w`}
      sizes={hero ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
      width="1920"
      height="1280"
      alt={alt}
      loading={hero ? "eager" : "lazy"}
      fetchPriority={hero ? "high" : "auto"}
    />
  );
}
export function BeforeAfterSlider({ t }: { t: Dictionary }) {
  const [value, setValue] = useState(50);
  return (
    <figure className="comparison">
      <div className="comparison-images">
        <img
          src={gallery.comparison.before}
          alt={`${t.before} — ${t.interiorAlt}`}
          width="1200"
          height="800"
          loading="lazy"
        />
        <img
          className="comparison-after"
          src={gallery.comparison.after}
          style={{ clipPath: `inset(0 0 0 ${value}%)` }}
          alt={`${t.after} — ${t.interiorAlt}`}
          width="1200"
          height="800"
          loading="lazy"
        />
        <span className="comparison-label before">{t.before}</span>
        <span className="comparison-label after">{t.after}</span>
        <div className="comparison-divider" style={{ left: `${value}%` }}>
          <MoveHorizontal />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label={t.compareLabel}
        />
      </div>
      <figcaption>
        {gallery.comparison.kind === "illustrative"
          ? t.comparisonDemo
          : t.resultDisclaimer}
      </figcaption>
    </figure>
  );
}
export function FAQAccordion({ t }: { t: Dictionary }) {
  return (
    <div className="faq-list">
      {t.faq.map(([q, a], i) => (
        <details key={q}>
          <summary>
            <span className="mono">{String(i + 1).padStart(2, "0")}</span>
            <span>{q}</span>
            <ChevronDown size={20} />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
