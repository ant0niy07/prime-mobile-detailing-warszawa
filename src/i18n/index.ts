import { pl } from "./pl";
import { en } from "./en";
import { ru } from "./ru";
import type { Lang } from "../config/business";
import { business } from "../config/business";
import seo from "../config/seo.json";
function resolve(lang: Lang, dictionary: typeof pl) {
  return {
    ...dictionary,
    seoTitle: seo[lang].title,
    seoDescription: seo[lang].description,
    faq: dictionary.faq.map(([q, a]) => [
      q,
      business.packages.reduce(
        (text, p) => text.replaceAll(`{${p.id}}`, String(p.price)),
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
export type { Dictionary } from "./pl";
