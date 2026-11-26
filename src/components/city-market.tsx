"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { City } from "@/data/cities";
import { PROFESSIONS } from "@/data/professions";
import type { CityOverview, ProfessionMarket } from "@/lib/city-overview";
import { gradient, SPHERE_THEME } from "./art";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));
const NAME = new Map(PROFESSIONS.map((p) => [p.slug, p]));

/** Медиане верим, только если зарплату указали хотя бы в 5 вакансиях */
export const MIN_SAMPLE = 5;
export const liveSalary = (m?: ProfessionMarket) => (m && m.median && m.withSalary >= MIN_SAMPLE ? m.median : null);

export type OverviewState = { loading: boolean; data: CityOverview | null };

export function useCityOverview(cityId: string): OverviewState {
  const [state, setState] = useState<{ key: string; data: CityOverview | null }>({ key: "", data: null });

  useEffect(() => {
    let alive = true;
    fetch(`/api/city-overview?city=${cityId}`)
      .then((r) => r.json())
      .then((d: CityOverview) => alive && setState({ key: cityId, data: d }))
      .catch(() => alive && setState({ key: cityId, data: null }));
    return () => {
      alive = false;
    };
  }, [cityId]);

  return state.key === cityId ? { loading: false, data: state.data } : { loading: true, data: null };
}

export function CityMarket({ city, overview }: { city: City; overview: OverviewState }) {
  const { loading, data } = overview;

  if (loading) {
    return (
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">Рынок труда: {city.name}</h2>
        <p className="mt-1 text-sm text-muted">
          Собираем вакансии hh.kz по всем {PROFESSIONS.length} профессиям — в первый раз это может занять до 15 секунд…
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-accent-soft" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || !data.ok) {
    return (
      <section className="rounded-2xl border border-line bg-card p-5 text-sm">
        <h2 className="text-lg font-semibold">Рынок труда: {city.name}</h2>
        <p className="mt-1 text-muted">
          {data?.ok === false && data.reason === "no_token"
            ? "Подключение к API hh.kz не настроено — показываем оценки зарплат по нашей базе."
            : "Не удалось получить вакансии с hh.kz — показываем оценки зарплат по нашей базе."}
        </p>
      </section>
    );
  }

  const ps = data.professions;
  const withJobs = ps.filter((m) => m.found > 0);
  const topDemand = [...withJobs].sort((a, b) => b.found - a.found).slice(0, 6);
  const paid = ps.filter((m) => liveSalary(m) !== null);
  const topPaid = [...paid].sort((a, b) => b.median! - a.median!).slice(0, 6);
  const maxFound = topDemand[0]?.found ?? 1;
  const maxPaid = topPaid[0]?.median ?? 1;
  const none = ps.filter((m) => m.found === 0);
  const time = new Date(data.fetchedAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Рынок труда: {city.name}</h2>
        <span className="text-xs text-muted">вакансии hh.kz на {time}</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Профессий с открытыми вакансиями" value={`${withJobs.length} из ${ps.length}`} />
        <Stat label="Профессий без вакансий сейчас" value={String(none.length)} />
        <Stat label={`Профессий, где зарплату указали в ${MIN_SAMPLE}+ вакансиях`} value={String(paid.length)} />
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <Ranking
          title="Больше всего вакансий"
          items={topDemand.map((m) => ({ slug: m.slug, value: m.found, text: fmt(m.found), share: m.found / maxFound }))}
        />
        <Ranking
          title="Самые высокие зарплаты"
          hint={`медиана месячных зарплат в тенге, только где зарплату указали в ${MIN_SAMPLE}+ вакансиях`}
          items={topPaid.map((m) => ({
            slug: m.slug,
            value: m.median!,
            text: `${fmt(m.median! / 1000)} тыс. ₸`,
            share: m.median! / maxPaid,
          }))}
        />
      </div>

      <div className="mt-5 space-y-2 text-xs text-muted">
        {none.length > 0 && (
          <p>
            Сейчас нет вакансий на hh.kz в этом городе: {none.map((m) => NAME.get(m.slug)?.name).filter(Boolean).join(", ")}.
          </p>
        )}
        {data.skipped.length > 0 && (
          <p>
            Не считаем вакансии: {data.skipped.map((s) => NAME.get(s.slug)?.name).filter(Boolean).join(", ")} — причина
            указана на странице профессии.
          </p>
        )}
        {data.failed.length > 0 && (
          <p>
            hh.kz не ответил по профессиям: {data.failed.map((s) => NAME.get(s)?.name).filter(Boolean).join(", ")}. Попробуй
            обновить страницу позже.
          </p>
        )}
        <p>
          Вакансии ищем по названию. Одна вакансия может попасть в две профессии: например, «учитель английского» есть и у
          учителей, и у преподавателей английского. Зарплаты — как указали работодатели: часть «на руки», часть до вычета
          налогов. Оплата за смену, час или вахту в расчёт не входит.
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-accent-soft px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-xl font-bold">{value}</div>
    </div>
  );
}

function Ranking({
  title,
  hint,
  items,
}: {
  title: string;
  hint?: string;
  items: { slug: string; value: number; text: string; share: number }[];
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-medium">{title}</h3>
      {hint && <div className="text-xs text-muted">{hint}</div>}
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Пока мало данных.</p>
      ) : (
        <ol className="mt-2 space-y-2">
          {items.map((it) => {
            const p = NAME.get(it.slug);
            if (!p) return null;
            return (
              <li key={it.slug}>
                <Link href={`/professions/${it.slug}`} className="group block">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate group-hover:text-accent">{p.name}</span>
                    <span className="shrink-0 font-semibold">{it.text}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-accent-soft">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(it.share * 100, 3)}%`, background: gradient(SPHERE_THEME[p.sphere], 90) }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
