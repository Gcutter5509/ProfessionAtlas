import { cacheLife } from "next/cache";

type HHSalary = { from: number | null; to: number | null; currency: string; gross?: boolean } | null;

type HHVacancy = {
  id: string;
  name: string;
  alternate_url: string;
  salary?: HHSalary;
  salary_range?: HHSalary;
  employer?: { name?: string; alternate_url?: string };
  experience?: { name?: string };
  schedule?: { name?: string };
  published_at?: string;
};

export type VacancyItem = {
  id: string;
  name: string;
  url: string;
  employer: string;
  salary: string | null;
  experience: string | null;
};

export type VacancyStats =
  | {
      ok: true;
      found: number;
      withSalary: number;
      avgSalary: number | null;
      medianSalary: number | null;
      minSalary: number | null;
      maxSalary: number | null;
      topEmployers: { name: string; count: number }[];
      vacancies: VacancyItem[];
      searchUrl: string;
    }
  | { ok: false; reason: "no_token" | "error"; message: string; searchUrl: string };

const API = "https://api.hh.ru";

export function hhSearchUrl(query: string, areaId: string) {
  const u = new URL("https://hh.kz/search/vacancy");
  u.searchParams.set("text", query);
  u.searchParams.set("area", areaId);
  return u.toString();
}

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

function salaryText(s: HHSalary): string | null {
  if (!s || (!s.from && !s.to)) return null;
  const cur = s.currency === "KZT" ? "₸" : s.currency;
  if (s.from && s.to) return `${fmt(s.from)} – ${fmt(s.to)} ${cur}`;
  if (s.from) return `от ${fmt(s.from)} ${cur}`;
  return `до ${fmt(s.to!)} ${cur}`;
}

/** Средняя точка вилки в тенге (только вакансии с зарплатой в KZT) */
function salaryPoint(s: HHSalary): number | null {
  if (!s || s.currency !== "KZT") return null;
  if (s.from && s.to) return (s.from + s.to) / 2;
  return s.from ?? s.to ?? null;
}

/**
 * Ищет вакансии на hh.kz и считает статистику.
 * С 2025 года API hh отдаёт вакансии только авторизованным приложениям —
 * нужен токен приложения (HH_ACCESS_TOKEN), см. README.
 */
export async function getVacancyStats(query: string, areaId: string): Promise<VacancyStats> {
  "use cache";
  cacheLife("hours");

  const searchUrl = hhSearchUrl(query, areaId);
  const token = process.env.HH_ACCESS_TOKEN;
  if (!token) {
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
  url.searchParams.set("host", "hh.kz");

  try {
    const res = await fetch(url, {
      headers: {
        "HH-User-Agent": process.env.HH_USER_AGENT || "ProfessionAtlas/1.0",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      return {
        ok: false,
        reason: "error",
        message: `hh.kz ответил ошибкой ${res.status}`,
        searchUrl,
      };
    }
    const data = (await res.json()) as { found: number; items: HHVacancy[] };

    const points: number[] = [];
    const employers = new Map<string, number>();
    for (const v of data.items) {
      const s = v.salary_range ?? v.salary ?? null;
      const p = salaryPoint(s);
      // отсекаем явные ошибки ввода (например, зарплата за час или опечатки)
      if (p && p >= 50_000 && p <= 20_000_000) points.push(p);
      const e = v.employer?.name;
      if (e) employers.set(e, (employers.get(e) ?? 0) + 1);
    }
    points.sort((a, b) => a - b);
    const avg = points.length ? points.reduce((a, b) => a + b, 0) / points.length : null;
    const median = points.length ? points[Math.floor(points.length / 2)] : null;

    return {
      ok: true,
      found: data.found,
      withSalary: points.length,
      avgSalary: avg && Math.round(avg),
      medianSalary: median && Math.round(median),
      minSalary: points[0] ?? null,
      maxSalary: points.at(-1) ?? null,
      topEmployers: [...employers.entries()]
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
      })),
      searchUrl,
    };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : "Сеть недоступна",
      searchUrl,
    };
  }
}
