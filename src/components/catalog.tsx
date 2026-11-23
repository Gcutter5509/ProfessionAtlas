"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatStudy, PROFESSIONS, SPHERES, TRAITS } from "@/data/professions";
import { useCity } from "./city";
import { Markdown } from "./markdown";
import { useAiStream } from "./use-ai-stream";

type Sort = "name" | "salary" | "study";

export function Catalog() {
  const { city } = useCity();
  const [q, setQ] = useState("");
  const [sphere, setSphere] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("name");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = PROFESSIONS.filter(
      (p) =>
        (!sphere || p.sphere === sphere) &&
        (!needle || p.name.toLowerCase().includes(needle) || p.short.toLowerCase().includes(needle)),
    );
    return filtered.sort((a, b) =>
      sort === "salary"
        ? b.salary[1] - a.salary[1]
        : sort === "study"
          ? a.study.years - b.study.years
          : a.name.localeCompare(b.name, "ru"),
    );
  }, [q, sphere, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск профессии: врач, программист, дизайнер…"
          className="flex-1 rounded-xl border border-line bg-card px-4 py-2.5 outline-none focus:border-accent"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-xl border border-line bg-card px-3 py-2.5"
        >
          <option value="name">По алфавиту</option>
          <option value="salary">Сначала с высокой зарплатой</option>
          <option value="study">Сначала с коротким обучением</option>
        </select>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <Chip active={!sphere} onClick={() => setSphere(null)}>
          Все сферы
        </Chip>
        {SPHERES.map((s) => (
          <Chip key={s} active={sphere === s} onClick={() => setSphere(s)}>
            {s}
          </Chip>
        ))}
      </div>

      <p className="text-sm text-muted">
        Найдено: {list.length}. Зарплаты указаны для города <b className="text-foreground">{city.name}</b> (оценка, опытный
        специалист).
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <Link
            key={p.slug}
            href={`/professions/${p.slug}`}
            className="group flex flex-col rounded-2xl border border-line bg-card p-4 transition sm:p-5 hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
          >
            <span className="text-xs font-medium text-accent">{p.sphere}</span>
            <h3 className="mt-1 font-semibold leading-snug group-hover:text-accent">{p.name}</h3>
            <p className="mt-2 flex-1 text-sm text-muted">{p.short}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-accent-soft px-3 py-2">
                <div className="text-xs text-muted">Зарплата</div>
                <div className="font-semibold">~{Math.round(p.salary[1] * city.salaryK)} тыс. ₸</div>
              </div>
              <div className="rounded-lg bg-accent-soft px-3 py-2">
                <div className="text-xs text-muted">Учиться</div>
                <div className="font-semibold">{formatStudy(p.study.years)}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {p.traits.map((t) => (
                <span key={t} className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                  {TRAITS[t].name}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <AskAnyProfession initial={list.length === 0 ? q : ""} />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition sm:py-1 ${
        active ? "border-accent bg-accent text-white" : "border-line bg-card hover:border-accent"
      }`}
    >
      {children}
    </button>
  );
}

function AskAnyProfession({ initial }: { initial: string }) {
  const { city } = useCity();
  const [name, setName] = useState("");
  const ai = useAiStream();
  const value = name || initial;

  return (
    <section className="rounded-2xl border border-dashed border-accent bg-card p-5">
      <h2 className="font-semibold">🤖 Не нашёл профессию? Спроси ИИ</h2>
      <p className="mt-1 text-sm text-muted">
        Напиши любую профессию — ИИ расскажет, что это, где учиться в Казахстане и сколько можно зарабатывать.
      </p>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) ai.run({ kind: "free", name: value, city: city.hhId });
        }}
      >
        <input
          value={value}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Например: сомелье, урбанист, пилот дронов"
          className="flex-1 rounded-xl border border-line bg-background px-4 py-2 outline-none focus:border-accent"
        />
        <button
          disabled={ai.loading}
          className="rounded-xl bg-accent px-4 py-2.5 font-medium text-white disabled:opacity-60 sm:py-2"
        >
          {ai.loading ? "Пишу…" : "Рассказать"}
        </button>
      </form>
      {ai.error && <p className="mt-3 text-sm text-red-500">{ai.error}</p>}
      {ai.text && (
        <div className="mt-4">
          <Markdown text={ai.text} />
        </div>
      )}
    </section>
  );
}
