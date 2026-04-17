import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import hi from "./locales/hi";
import pa from "./locales/pa";
import te from "./locales/te";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, hi: { translation: hi }, pa: { translation: pa }, te: { translation: te } },
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "pa", "te"],
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
] as const;

export default i18n;
