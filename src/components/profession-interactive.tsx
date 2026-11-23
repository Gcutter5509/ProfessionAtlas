"use client";

import { useState } from "react";
import { formatStudy, type Profession, TRAITS } from "@/data/professions";
import { gradient, SPHERE_THEME } from "./art";
import { useCity } from "./city";

/** Путь к профессии по шагам: школа → учёба → первая работа → опыт → эксперт */
export function CareerPath({ p }: { p: Profession }) {
  const { city } = useCity();
  const [active, setActive] = useState(0);
  const theme = SPHERE_THEME[p.sphere];
  const k = (i: number) => `${Math.round(p.salary[i] * city.salaryK)} тыс. ₸`;

  const steps = [
    { title: "Школа", when: "10–11 класс", head: "Готовься к ЕНТ", body: `Профильные предметы: ${p.ent}. Чем выше баллы, тем больше шансов на грант.` },
    {
      title: "Учёба",
      when: p.study.years ? formatStudy(p.study.years) : "несколько месяцев",
      head: p.study.years ? `Учиться ${formatStudy(p.study.years)}` : "Можно начать с курсов",
      body: p.study.path,
    },
    { title: "Первая работа", when: "0–1 год", head: `Около ${k(0)} в месяц`, body: `Начинаешь с простых задач под присмотром опытных коллег. Где искать: ${p.workplaces.slice(0, 2).join(", ")}.` },
    { title: "Опыт", when: "2–5 лет", head: `Около ${k(1)} в месяц`, body: `Работаешь самостоятельно. Ключевые навыки на этом этапе: ${p.skills.slice(0, 3).join(", ")}.` },
    { title: "Эксперт", when: "5+ лет", head: `До ${k(2)} в месяц`, body: "Берёшь сложные задачи, учишь новичков, можешь вырасти до руководителя или открыть своё дело." },
  ];
  const s = steps[active];

  return (
    <section className="reveal rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Путь к профессии</h2>
        <span className="text-xs text-muted">Нажимай на шаги · зарплата для города {city.name}</span>
      </div>

      <ol className="relative mt-5 grid grid-cols-5 gap-1">
        <div className="absolute left-[10%] right-[10%] top-4 h-1 rounded-full bg-accent-soft" />
        <div
          className="absolute left-[10%] top-4 h-1 rounded-full transition-all duration-500"
          style={{ width: `${(active / (steps.length - 1)) * 80}%`, background: gradient(theme, 90) }}
        />
        {steps.map((st, i) => (
          <li key={st.title} className="relative flex flex-col items-center text-center">
            <button
              onClick={() => setActive(i)}
              aria-current={i === active}
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                i <= active ? "border-transparent text-white" : "border-line bg-card text-muted hover:border-accent"
              } ${i === active ? "scale-110 shadow-lg" : ""}`}
              style={i <= active ? { background: gradient(theme) } : undefined}
            >
              {i + 1}
            </button>
            <span className={`mt-2 text-xs leading-tight sm:text-sm ${i === active ? "font-semibold" : "text-muted"}`}>{st.title}</span>
          </li>
        ))}
      </ol>

      <div key={active} className="fade-up mt-5 rounded-xl bg-accent-soft p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-accent">
          {s.when}
        </div>
        <div className="mt-1 text-lg font-semibold">{s.head}</div>
        <p className="mt-1 text-sm text-muted">{s.body}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setActive(Math.max(0, active - 1))}
            disabled={active === 0}
            className="rounded-lg border border-line px-3 py-1 text-sm disabled:opacity-40"
          >
            ←
          </button>
          <button
            onClick={() => setActive(Math.min(steps.length - 1, active + 1))}
            disabled={active === steps.length - 1}
            className="rounded-lg border border-line px-3 py-1 text-sm disabled:opacity-40"
          >
            Дальше →
          </button>
        </div>
      </div>
    </section>
  );
}

/** Что делает / Навыки / Где работать — вкладками, а не одной длинной простынёй */
export function ProfessionTabs({ p }: { p: Profession }) {
  const tabs = [
    { id: "tasks", label: "Что делает", items: p.tasks },
    { id: "skills", label: "Навыки", items: p.skills },
    { id: "work", label: "Где работать", items: p.workplaces },
  ] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("tasks");
  const current = tabs.find((t) => t.id === tab)!;
  const theme = SPHERE_THEME[p.sphere];

  return (
    <section className="reveal rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div role="tablist" className="flex gap-1 rounded-xl bg-accent-soft p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-card shadow" : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ul key={tab} className="mt-4 space-y-2">
        {current.items.map((item, i) => (
          <li key={item} className="fade-up flex items-start gap-3" style={{ animationDelay: `${i * 50}ms` }}>
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: gradient(theme) }}
            >
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Мини-проверка: отвечаешь «да/нет» про себя — видишь, насколько профессия по характеру */
export function FitCheck({ p }: { p: Profession }) {
  const [ans, setAns] = useState<Record<string, boolean>>({});
  const answered = Object.keys(ans).length;
  const yes = Object.values(ans).filter(Boolean).length;
  const all = answered === p.traits.length;
  const pct = Math.round((yes / p.traits.length) * 100);

  return (
    <section className="reveal rounded-2xl border border-line bg-card p-4 sm:p-5">
      <h2 className="text-lg font-semibold">Подходит ли тебе?</h2>
      <p className="mt-1 text-sm text-muted">Ответь честно — это про тебя?</p>
      <div className="mt-4 space-y-3">
        {p.traits.map((t) => (
          <div key={t} className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm">
              Ты <b>{TRAITS[t].about}</b>?
            </p>
            <div className="flex shrink-0 gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setAns({ ...ans, [t]: v })}
                  className={`rounded-lg border px-4 py-1.5 text-sm transition ${
                    ans[t] === v ? (v ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-400 bg-slate-400 text-white") : "border-line hover:border-accent"
                  }`}
                >
                  {v ? "Да" : "Не очень"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {all && (
        <div className="pop mt-4 flex items-center gap-4 rounded-xl bg-accent-soft p-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold"
            style={{ background: `conic-gradient(var(--accent) ${pct * 3.6}deg, var(--line) 0)` }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card">{pct}%</span>
          </div>
          <p className="text-sm">
            {pct === 100
              ? "По характеру — отличное совпадение! Загляни на день открытых дверей и посмотри работу вживую."
              : pct >= 50
                ? "Неплохое совпадение. Чего-то может не хватать, но многое развивается с опытом."
                : "Похоже, эта работа не очень в твоём характере. Посмотри похожие профессии ниже или пройди тест."}
          </p>
        </div>
      )}
    </section>
  );
}
