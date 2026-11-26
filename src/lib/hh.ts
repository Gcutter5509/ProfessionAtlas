import { cacheLife } from "next/cache";
import { hhQuery } from "@/data/hh-queries";

type HHSalary = {
  from: number | null;
  to: number | null;
  currency: string;
  /** true — до вычета налогов, false — «на руки» */
  gross?: boolean | null;
  /** За какой период указана сумма: MONTH, SHIFT, HOUR, FLY_IN_FLY_OUT… (только в salary_range) */
  mode?: { id: string; name: string } | null;
} | null;

type HHVacancy = {
  id: string;
  name: string;
  alternate_url: string;
  salary?: HHSalary;
  salary_range?: HHSalary;
  employer?: { name?: string; alternate_url?: string };
  experience?: { name?: string };
  published_at?: string;
};

export type VacancyItem = {
  id: string;
  name: string;
  url: string;
  employer: string;
  salary: string | null;
  experience: string | null;
  publishedAt: string | null;
};

export type VacancyStats =
  | {
      ok: true;
      /** Сколько всего вакансий нашёл hh.kz по запросу */
      found: number;
      /** По скольким последним вакансиям считаем зарплаты и работодателей (не больше 100) */
      sampled: number;
      /** Сколько из них дали месячную зарплату в тенге, вошедшую в расчёт */
      withSalary: number;
      /** Из вошедших в расчёт: сумма указана «на руки» */
      netCount: number;
      /** Из вошедших в расчёт: сумма указана до вычета налогов */
      grossCount: number;
      /** Зарплата указана, но не за месяц (за смену, час, вахту) или не в тенге — в расчёт не входит */
      skippedSalary: number;
      avgSalary: number | null;
      medianSalary: number | null;
      minSalary: number | null;
      maxSalary: number | null;
      topEmployers: { name: string; count: number }[];
      vacancies: VacancyItem[];
      searchUrl: string;
      /** Когда данные получены с hh.kz */
      fetchedAt: string;
    }
  | { ok: false; reason: "no_token" | "no_query" | "error"; message: string; searchUrl: string | null };

const API = "https://api.hh.ru";

/** Ссылка на тот же поиск на сайте hh.kz — с тем же запросом и поиском только по названию */
export function hhSearchUrl(query: string, areaId: string) {
  const u = new URL("https://hh.kz/search/vacancy");
  u.searchParams.set("text", query);
  u.searchParams.set("area", areaId);
  u.searchParams.set("search_field", "name");
  u.searchParams.set("order_by", "publication_time");
  return u.toString();
}

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

const MODE_TEXT: Record<string, string> = {
  SHIFT: "за смену",
  HOUR: "в час",
  FLY_IN_FLY_OUT: "за вахту",
  SERVICE: "за услугу",
};

/** Зарплата так, как её указал работодатель, с периодом и пометкой о налогах */
function salaryText(s: HHSalary): string | null {
  if (!s || (!s.from && !s.to)) return null;
  const cur = s.currency === "KZT" ? "₸" : s.currency;
  const sum =
    s.from && s.to ? `${fmt(s.from)} – ${fmt(s.to)} ${cur}` : s.from ? `от ${fmt(s.from)} ${cur}` : `до ${fmt(s.to!)} ${cur}`;
  const mode = s.mode && s.mode.id !== "MONTH" ? ` ${MODE_TEXT[s.mode.id] ?? s.mode.name.toLowerCase()}` : "";
  const tax = s.gross === true ? ", до вычета налогов" : s.gross === false ? ", на руки" : "";
  return sum + mode + tax;
}

/** Суммы вне этого диапазона за месяц — почти всегда опечатки (лишний или пропущенный ноль) */
const MIN_MONTHLY = 50_000;
const MAX_MONTHLY = 20_000_000;

/**
 * Месячная зарплата в тенге: середина вилки, а если указана одна граница — она.
 * null — зарплата не указана, не в тенге, не за месяц или выглядит как опечатка.
 */
function monthlyKzt(s: HHSalary): number | null {
  if (!s || s.currency !== "KZT") return null;
  if (s.mode && s.mode.id !== "MONTH") return null;
  const p = s.from && s.to ? (s.from + s.to) / 2 : (s.from ?? s.to ?? null);
  if (!p || p < MIN_MONTHLY || p > MAX_MONTHLY) return null;
  return p;
}

function median(sorted: number[]): number | null {
  const n = sorted.length;
  if (!n) return null;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/** hh отвечает 429 при всплеске запросов (например, при сборе сводки по городу) — ждём и пробуем ещё раз */
async function fetchWithRetry(url: URL, init: RequestInit, attempts = 5): Promise<Response> {
  for (let i = 1; ; i++) {
    const res = await fetch(url, init);
    if (i >= attempts || (res.status !== 429 && res.status < 500)) return res;
    const retryAfter = Number(res.headers.get("retry-after"));
    const delay = retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 700 * 2 ** (i - 1) + Math.random() * 500;
    await new Promise((r) => setTimeout(r, delay));
  }
}

/**
 * Ищет вакансии на hh.kz и считает статистику по последним 100 вакансиям.
 * С 2025 года API hh отдаёт вакансии только авторизованным приложениям —
 * нужен токен приложения (HH_ACCESS_TOKEN), см. README.
 */
export async function getVacancyStats(query: string, areaId: string): Promise<VacancyStats> {
  "use cache";

  const searchUrl = hhSearchUrl(query, areaId);
  const token = process.env.HH_ACCESS_TOKEN;
  if (!token) {
    cacheLife("minutes");
    return {
      ok: false,
      reason: "no_token",
      message: "Не задан HH_ACCESS_TOKEN — показываем оценку по встроенной базе.",
      searchUrl,
    };
  }

  const url = new URL(`${API}/vacancies`);
  url.searchParams.set("text", query);
  url.searchParams.set("area", areaId);
  url.searchParams.set("per_page", "100");
  url.searchParams.set("search_field", "name");
  url.searchParams.set("order_by", "publication_time");
  url.searchParams.set("host", "hh.kz");

  try {
    const res = await fetchWithRetry(url, {
      headers: {
        "HH-User-Agent": process.env.HH_USER_AGENT || "ProfessionAtlas/1.0",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      // ошибки (лимиты, сбои) не держим в кэше долго
      cacheLife("minutes");
      return {
        ok: false,
        reason: "error",
        message: `hh.kz ответил ошибкой ${res.status}`,
        searchUrl,
      };
    }
    cacheLife("hours");
    const data = (await res.json()) as { found: number; items: HHVacancy[] };

    const points: number[] = [];
    let netCount = 0;
    let grossCount = 0;
    let skippedSalary = 0;
    const employers = new Map<string, number>();
    for (const v of data.items) {
      // salary_range — новое поле hh (с периодом оплаты), salary — старое
      const s = v.salary_range ?? v.salary ?? null;
      const p = monthlyKzt(s);
      if (p !== null) {
        points.push(p);
        if (s?.gross === true) grossCount++;
        else if (s?.gross === false) netCount++;
      } else if (s && (s.from || s.to)) {
        skippedSalary++;
      }
      const e = v.employer?.name;
      if (e) employers.set(e, (employers.get(e) ?? 0) + 1);
    }
    points.sort((a, b) => a - b);
    const avg = points.length ? points.reduce((a, b) => a + b, 0) / points.length : null;
    const med = median(points);

    return {
      ok: true,
      found: data.found,
      sampled: data.items.length,
      withSalary: points.length,
      netCount,
      grossCount,
      skippedSalary,
      avgSalary: avg === null ? null : Math.round(avg),
      medianSalary: med === null ? null : Math.round(med),
      minSalary: points[0] ?? null,
      maxSalary: points.at(-1) ?? null,
      topEmployers: [...employers.entries()]
        .filter(([, count]) => count > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count })),
      vacancies: data.items.slice(0, 10).map((v) => ({
        id: v.id,
        name: v.name,
        url: v.alternate_url,
        employer: v.employer?.name ?? "—",
        salary: salaryText(v.salary_range ?? v.salary ?? null),
        experience: v.experience?.name ?? null,
        publishedAt: v.published_at ?? null,
      })),
      searchUrl,
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    cacheLife("minutes");
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : "Сеть недоступна",
      searchUrl,
    };
  }
}

/** Статистика по профессии атласа: берёт проверенный запрос из HH_QUERIES */
export async function getProfessionVacancies(slug: string, areaId: string): Promise<VacancyStats> {
  const q = hhQuery(slug);
  if (q.query === null) return { ok: false, reason: "no_query", message: q.reason, searchUrl: null };
  return getVacancyStats(q.query, areaId);
}
