import Typograf from "typograf";

/**
 * Русская типографика (typograf): «ёлочки», длинное тире, неразрывные пробелы после
 * коротких слов и перед единицами («5 лет», «400 тыс. ₸»), многоточие и т. п.
 * Результат — обычные Unicode-символы, без HTML-сущностей, поэтому годится для React-текста.
 */
const tp = new Typograf({ locale: ["ru", "en-US"], htmlEntity: { type: "default" } });

export function typo(text: string): string {
  return tp.execute(text);
}

/** Для Markdown: обрабатываем только текст строки, маркеры «## », «- », «1. » не трогаем */
export function typoMarkdown(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      const [, prefix = "", rest = ""] = line.match(/^(\s*(?:#{1,6}\s+|[-*•]\s+|\d+[.)]\s+)?)(.*)$/) ?? [];
      return prefix + (rest.trim() ? typo(rest) : rest);
    })
    .join("\n");
}

/** Для поиска: неразрывные пробелы и разные тире считаем обычными */
export function plainText(text: string): string {
  return text.replace(/[  ]/g, " ").replace(/[–—]/g, "-");
}

/** Типографирует все строки в объекте данных, кроме служебных полей (slug, ключи и т. п.) */
export function typoDeep<T>(value: T, skip: readonly string[] = []): T {
  const walk = (v: unknown, key?: string): unknown => {
    if (key && skip.includes(key)) return v;
    if (typeof v === "string") return typo(v);
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    return v;
  };
  return walk(value) as T;
}
