"use client";

import { useEffect, useState } from "react";
import { hhQuery } from "@/data/hh-queries";
import type { Profession } from "@/data/professions";
import type { VacancyStats } from "@/lib/hh";
import { useCity } from "./city";
import { MIN_SAMPLE } from "./city-market";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));
const date = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

export function CityStats({ p }: { p: Profession }) {
  const { city } = useCity();
  const [state, setState] = useState<{ key: string; data: VacancyStats | null }>({ key: "", data: null });
  const key = `${p.slug}:${city.hhId}`;
  const stats = state.key === key ? state.data : null;
  const loading = state.key !== key;
  const q = hhQuery(p.slug);

  useEffect(() => {
    let alive = true;
    fetch(`/api/vacancies?slug=${p.slug}&city=${city.hhId}`)
      .then((r) => r.json())
      .then((d: VacancyStats) => alive && setState({ key, data: d }))
      .catch(() => alive && setState({ key, data: null }));
    return () => {
      alive = false;
    };
  }, [p.slug, city.hhId, key]);

  const est = p.salary.map((s) => s * 1000 * city.salaryK);
  const live = stats?.ok ? stats : null;
  const liveMedian = live && live.medianSalary !== null && live.withSalary >= MIN_SAMPLE ? live.medianSalary : null;
  const bars = [
    { label: "Начинающий (0–1 год), оценка", value: est[0] },
    { label: "Опытный (2–5 лет), оценка", value: est[1] },
    { label: "Эксперт (5+ лет), оценка", value: est[2] },
    ...(liveMedian ? [{ label: "Медиана по вакансиям hh.kz", value: liveMedian, live: true }] : []),
  ];
  const max = Math.max(...bars.map((b) => b.value));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Зарплата в городе {city.name}</h2>
          <span className="text-xs text-muted">₸ в месяц</span>
        </div>
        <div className="mt-4 space-y-3">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between gap-3 text-sm">
                <span className={"live" in b ? "font-medium text-accent" : "text-muted"}>{b.label}</span>
                <span className="shrink-0 font-semibold">{fmt(b.value)} ₸</span>
              </div>
              <div className="mt-1 h-2.5 rounded-full bg-accent-soft">
                <div
                  className={`h-full rounded-full ${"live" in b ? "bg-emerald-500" : "bg-accent"}`}
                  style={{ width: `${(b.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 text-xs text-muted">
          <p>Оценка по уровням опыта — из нашей базы с поправкой на город, это не данные вакансий.</p>
          {live && liveMedian && (
            <p>
              Медиана посчитана по {live.withSalary} из {live.sampled} последних вакансий hh.kz, где указана месячная
              зарплата в тенге (середина вилки или единственная граница). Из них «на руки» — {live.netCount}, до вычета
              налогов — {live.grossCount}
              {live.withSalary - live.netCount - live.grossCount > 0
                ? `, без пометки — ${live.withSalary - live.netCount - live.grossCount}`
                : ""}
              .{live.skippedSalary > 0 ? ` Ещё ${live.skippedSalary} — оплата за смену, час, вахту или не в тенге, в расчёт не входят.` : ""}
            </p>
          )}
          {live && !liveMedian && (
            <p>
              По вакансиям hh.kz медиану не считаем: месячную зарплату в тенге указали только в {live.withSalary} из{" "}
              {live.sampled} последних вакансий, нужно хотя бы {MIN_SAMPLE}.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Вакансии в городе {city.name}</h2>
          {stats?.searchUrl && (
            <a href={stats.searchUrl} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
              Этот поиск на hh.kz →
            </a>
          )}
        </div>

        {loading && <p className="mt-3 text-sm text-muted">Ищем вакансии…</p>}

        {!loading && !live && (
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-muted">
              {stats?.ok === false && stats.reason === "no_query"
                ? stats.message
                : stats?.ok === false && stats.reason === "no_token"
                  ? "Подключение к API hh.kz не настроено."
                  : `Не удалось получить вакансии${stats?.ok === false ? `: ${stats.message}` : ""}.`}
            </p>
            <p>
              Где обычно работают (из нашей базы): <b>{p.workplaces.join(", ")}</b>
            </p>
          </div>
        )}

        {live && (
          <>
            <p className="mt-1 text-sm text-muted">
              Открытых вакансий на hh.kz: <b className="text-foreground">{fmt(live.found)}</b> на {date(live.fetchedAt)}
              {q.query !== null && <> · ищем в названии вакансии: {q.label}</>}
            </p>
            {live.topEmployers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium">У кого несколько вакансий (среди последних {live.sampled})</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {live.topEmployers.map((e) => (
                    <span key={e.name} className="rounded-full bg-accent-soft px-3 py-1 text-xs">
                      {e.name} · {e.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {live.vacancies.length > 0 && <h3 className="mt-4 text-sm font-medium">Свежие вакансии</h3>}
            <ul className="mt-1 divide-y divide-line">
              {live.vacancies.map((v) => (
                <li key={v.id} className="py-3">
                  <a href={v.url} target="_blank" rel="noreferrer" className="font-medium hover:text-accent">
                    {v.name}
                  </a>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted">
                    <span>{v.employer}</span>
                    {v.salary && <span className="text-foreground">{v.salary}</span>}
                    {v.experience && <span>{v.experience}</span>}
                    {v.publishedAt && <span>{date(v.publishedAt)}</span>}
                  </div>
                </li>
              ))}
            </ul>
            {live.vacancies.length === 0 && <p className="mt-3 text-sm text-muted">Сейчас вакансий нет.</p>}
          </>
        )}
      </section>
    </div>
  );
}
