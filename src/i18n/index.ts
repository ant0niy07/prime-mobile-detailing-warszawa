import { pl } from "./pl";
import { en } from "./en";
import { ru } from "./ru";
import type { Lang } from "../config/business";
import { business } from "../config/business";
import { pricing } from "../config/pricing";
import seo from "../config/seo.json";

function resolve(lang: Lang, dictionary: typeof pl) {
  return {
    ...dictionary,
    seoTitle: seo[lang].title,
    seoDescription: seo[lang].description.replaceAll(
      "{basic}",
      String(pricing.packages[0].price),
    ),
    faq: dictionary.faq.map(([q, a]) => [
      q,
      business.packages.reduce(
        (text, p) =>
          text
            .replaceAll(`{${p.id}}`, String(p.price))
            .replaceAll(`{power.${p.id}}`, String(pricing.power[p.id])),
        a,
      ),
    ]),
  };
}
export const dictionaries = {
  pl: resolve("pl", pl),
  en: resolve("en", en),
  ru: resolve("ru", ru),
};
export const languages: Lang[] = ["pl", "en", "ru"];
export const languageNames = { pl: "Polski", en: "English", ru: "Русский" };
export type Dictionary = ReturnType<typeof resolve>;
