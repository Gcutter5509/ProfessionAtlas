import { cacheLife } from "next/cache";
import { hhQuery } from "@/data/hh-queries";
import { PROFESSIONS } from "@/data/professions";
import { getVacancyStats } from "./hh";

export type ProfessionMarket = {
  slug: string;
  /** Сколько вакансий нашёл hh.kz */
  found: number;
  /** Медиана месячных зарплат в тенге по последним (до 100) вакансиям, где зарплата указана */
  median: number | null;
  /** Из скольких вакансий посчитана медиана */
  withSalary: number;
};

export type CityOverview =
  | {
      ok: true;
      areaId: string;
      professions: ProfessionMarket[];
      /** Профессии, для которых вакансии не считаем (нет осмысленного запроса) */
      skipped: { slug: string; reason: string }[];
      /** Профессии, по которым hh.kz не ответил */
      failed: string[];
      /** Когда собрана сводка */
      fetchedAt: string;
    }
  | { ok: false; reason: "no_token" | "error"; message: string };

/** Ограничиваем число одновременных запросов к hh (при большем числе hh начинает отвечать 429) */
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Рынок труда города: вакансии и зарплаты по каждой профессии атласа */
export async function getCityOverview(areaId: string): Promise<CityOverview> {
  "use cache: remote";

  const skipped: { slug: string; reason: string }[] = [];
  const jobs: { slug: string; query: string }[] = [];
  for (const p of PROFESSIONS) {
    const q = hhQuery(p.slug);
    if (q.query !== null) jobs.push({ slug: p.slug, query: q.query });
    else skipped.push({ slug: p.slug, reason: q.reason });
  }

  const results = await pool(jobs, 8, async (j) => ({ slug: j.slug, stats: await getVacancyStats(j.query, areaId) }));

  const first = results[0]?.stats;
  if (first && !first.ok && first.reason === "no_token") {
    cacheLife("minutes");
    return { ok: false, reason: "no_token", message: first.message };
  }

  const professions: ProfessionMarket[] = [];
  const failed: string[] = [];
  for (const { slug, stats } of results) {
    if (!stats.ok) {
      failed.push(slug);
      continue;
    }
    professions.push({ slug, found: stats.found, median: stats.medianSalary, withSalary: stats.withSalary });
  }

  if (professions.length === 0) {
    cacheLife("minutes");
    return { ok: false, reason: "error", message: "hh.kz сейчас не отвечает" };
  }

  // неполную сводку держим недолго, чтобы быстрее догрузить пропуски
  if (failed.length > 0) cacheLife("minutes");
  else cacheLife("hours");
  return { ok: true, areaId, professions, skipped, failed, fetchedAt: new Date().toISOString() };
}
