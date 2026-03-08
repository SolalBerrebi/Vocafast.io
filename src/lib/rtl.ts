const RTL_LANGUAGES = new Set(["he", "ar"]);

export function isRTL(langCode: string): boolean {
  return RTL_LANGUAGES.has(langCode);
}

export function getTextDirection(langCode: string): "rtl" | "ltr" {
  return isRTL(langCode) ? "rtl" : "ltr";
}
