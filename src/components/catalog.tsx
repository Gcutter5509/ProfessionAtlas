"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatStudy, type Profession, PROFESSIONS, SPHERES, TRAITS } from "@/data/professions";
import { gradient, SPHERE_THEME, SphereArt, textColor } from "./art";
import { plainText } from "@/lib/typograf";
import { useCity } from "./city";
import { CityMarket, liveSalary, useCityOverview } from "./city-market";
import { Markdown } from "./markdown";
import { useAiStream } from "./use-ai-stream";

type Sort = "name" | "salary" | "study" | "demand";

export function Catalog() {
  const { city } = useCity();
  const [q, setQ] = useState("");
  const [sphere, setSphere] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("name");
  const [compare, setCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const overview = useCityOverview(city.hhId);
  const market = overview.data?.ok ? overview.data : null;
  const bySlug = useMemo(() => new Map(market?.professions.map((m) => [m.slug, m])), [market]);

  /** Зарплата для карточки, тыс. ₸: медиана hh.kz, если данных достаточно, иначе оценка по базе */
  const salaryOf = (p: Profession) => {
    const live = liveSalary(bySlug.get(p.slug));
    return live ? { value: Math.round(live / 1000), live: true } : { value: Math.round(p.salary[1] * city.salaryK), live: false };
  };

  function toggleCompare(slug: string) {
    setCompare((c) => (c.includes(slug) ? c.filter((x) => x !== slug) : c.length >= 3 ? [...c.slice(1), slug] : [...c, slug]));
  }

  const list = useMemo(() => {
    const needle = plainText(q.trim().toLowerCase());
    const filtered = PROFESSIONS.filter(
      (p) =>
        (!sphere || p.sphere === sphere) &&
        (!needle || plainText(`${p.name} ${p.short}`.toLowerCase()).includes(needle)),
    );
    return filtered.sort((a, b) =>
      sort === "salary"
        ? salaryOf(b).value - salaryOf(a).value
        : sort === "demand"
          ? (bySlug.get(b.slug)?.found ?? -1) - (bySlug.get(a.slug)?.found ?? -1)
          : sort === "study"
            ? a.study.years - b.study.years
            : a.name.localeCompare(b.name, "ru"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- salaryOf зависит только от bySlug и city
  }, [q, sphere, sort, bySlug, city]);

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
          <option value="demand">Больше всего вакансий</option>
          <option value="salary">Сначала с высокой зарплатой</option>
          <option value="study">Сначала с коротким обучением</option>
        </select>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <Chip active={!sphere} onClick={() => setSphere(null)}>
          Все сферы
        </Chip>
        {SPHERES.map((s) => (
          <Chip key={s} active={sphere === s} onClick={() => setSphere(s)} color={gradient(SPHERE_THEME[s])}>
            {s}
          </Chip>
        ))}
      </div>

      <CityMarket city={city} overview={overview} />

      <Roulette />

      <p className="text-sm text-muted">
        Найдено: {list.length}. Зарплаты и вакансии — для города <b className="text-foreground">{city.name}</b>: медиана по
        вакансиям hh.kz, а где их мало — оценка для опытного специалиста. Отметь до трёх профессий кнопкой «Сравнить», чтобы
        увидеть их рядом.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <ProfessionCard
            key={p.slug}
            p={p}
            salary={salaryOf(p)}
            vacancies={overview.loading ? undefined : (bySlug.get(p.slug)?.found ?? null)}
            selected={compare.includes(p.slug)}
            onCompare={() => toggleCompare(p.slug)}
          />
        ))}
      </div>

      {compare.length > 0 && (
        <div className="fade-up sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-accent bg-card/95 p-3 shadow-xl backdrop-blur">
          <span className="text-sm text-muted">Сравнение:</span>
          {compare.map((slug) => {
            const p = PROFESSIONS.find((x) => x.slug === slug)!;
            return (
              <button
                key={slug}
                onClick={() => toggleCompare(slug)}
                className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm hover:border-red-400"
                title="Убрать из сравнения"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: gradient(SPHERE_THEME[p.sphere]) }} />
                {p.name}
                <span className="text-muted">×</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowCompare(true)}
            disabled={compare.length < 2}
            className="ml-auto rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {compare.length < 2 ? "Выбери ещё одну" : "Сравнить"}
          </button>
        </div>
      )}

      {showCompare && compare.length >= 2 && (
        <CompareDialog slugs={compare} onClose={() => setShowCompare(false)} />
      )}

      <AskAnyProfession initial={list.length === 0 ? q : ""} />
    </div>
  );
}

function Chip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={active && color ? { background: color, borderColor: "transparent" } : undefined}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition sm:py-1 ${
        active ? "border-accent bg-accent text-white" : "border-line bg-card hover:border-accent"
      }`}
    >
      {color && !active && <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

function ProfessionCard({
  p,
  salary,
  vacancies,
  selected,
  onCompare,
}: {
  p: Profession;
  salary: { value: number; live: boolean };
  /** undefined — ещё загружаем, null — нет данных */
  vacancies?: number | null;
  selected: boolean;
  onCompare: () => void;
}) {
  const theme = SPHERE_THEME[p.sphere];
  return (
    <div
      className={`reveal group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:shadow-xl ${
        selected ? "border-accent ring-2 ring-accent/40" : "border-line"
      }`}
    >
      <Link href={`/professions/${p.slug}`} className="flex flex-1 flex-col">
        <SphereArt sphere={p.sphere} seed={p.slug} className="h-28 transition-transform duration-500 group-hover:scale-105" />
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <span className="text-xs font-medium" style={{ color: textColor(theme) }}>
            {p.sphere}
          </span>
          <h3 className="mt-1 font-semibold leading-snug group-hover:text-accent">{p.name}</h3>
          <p className="mt-2 flex-1 text-sm text-muted">{p.short}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-accent-soft px-3 py-2">
              <div className="text-xs text-muted" title={salary.live ? "Медиана по вакансиям hh.kz" : "Оценка по базе"}>
                {salary.live ? "Зарплата · hh.kz" : "Зарплата · оценка"}
              </div>
              <div className="font-semibold">~{salary.value} тыс. ₸</div>
            </div>
            <div className="rounded-lg bg-accent-soft px-3 py-2">
              <div className="text-xs text-muted">Учиться</div>
              <div className="font-semibold">{formatStudy(p.study.years)}</div>
            </div>
          </div>
          {vacancies !== null && (
            <div className="mt-2 text-xs text-muted">
              {vacancies === undefined ? (
                <span className="inline-block h-3 w-28 animate-pulse rounded bg-accent-soft align-middle" />
              ) : vacancies === 0 ? (
                "Сейчас нет вакансий в этом городе"
              ) : (
                <>
                  Вакансий на hh.kz: <b className="text-foreground">{vacancies.toLocaleString("ru-RU")}</b>
                </>
              )}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1">
            {p.traits.map((t) => (
              <span key={t} className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                {TRAITS[t].name}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <button
        onClick={onCompare}
        aria-pressed={selected}
        className={`absolute right-2 top-2 rounded-full px-3 py-1 text-xs font-medium shadow transition ${
          selected ? "bg-accent text-white" : "bg-white/90 text-slate-800 hover:bg-white"
        }`}
      >
        {selected ? "✓ В сравнении" : "+ Сравнить"}
      </button>
    </div>
  );
}

/** «Случайная профессия»: барабан крутится и останавливается на одной из профессий */
function Roulette() {
  const [idx, setIdx] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function spin() {
    if (spinning) return;
    setSpinning(true);
    const target = Math.floor(Math.random() * PROFESSIONS.length);
    const steps = 18;
    let i = 0;
    const tick = () => {
      i++;
      setIdx(i >= steps ? target : Math.floor(Math.random() * PROFESSIONS.length));
      if (i < steps) timer.current = setTimeout(tick, 40 + i * i * 1.2);
      else setSpinning(false);
    };
    tick();
  }

  const p = idx === null ? null : PROFESSIONS[idx];

  return (
    <section className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-card sm:flex-row sm:items-stretch">
      {p ? (
        <SphereArt sphere={p.sphere} seed={p.slug} className="h-28 shrink-0 sm:h-auto sm:w-56" />
      ) : (
        <div className="flex h-28 shrink-0 items-center justify-center bg-gradient-to-br from-accent to-indigo-500 text-4xl font-bold text-white sm:h-auto sm:w-56">
          ?
        </div>
      )}
      <div className="flex flex-1 flex-col justify-center gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:py-4 sm:pl-0">
        <div className="min-w-0 flex-1">
          {p ? (
            <>
              <div className="text-xs text-muted">{p.sphere}</div>
              <div className={`text-lg font-semibold ${spinning ? "opacity-70" : "pop"}`}>{p.name}</div>
              {!spinning && <p className="mt-1 text-sm text-muted">{p.short}</p>}
            </>
          ) : (
            <>
              <div className="text-lg font-semibold">Не знаешь, с чего начать?</div>
              <p className="mt-1 text-sm text-muted">Крути барабан — откроем случайную профессию, о которой ты, может, и не думал(а).</p>
            </>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {p && !spinning && (
            <Link href={`/professions/${p.slug}`} className="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:border-accent">
              Подробнее
            </Link>
          )}
          <button
            onClick={spin}
            disabled={spinning}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
          >
            {spinning ? "Крутим…" : p ? "Ещё раз" : "Случайная профессия"}
          </button>
        </div>
      </div>
    </section>
  );
}

function CompareDialog({ slugs, onClose }: { slugs: string[]; onClose: () => void }) {
  const { city } = useCity();
  const items = slugs.map((s) => PROFESSIONS.find((p) => p.slug === s)!);
  const maxSalary = Math.max(...items.map((p) => p.salary[2]));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const rows: { label: string; render: (p: Profession) => React.ReactNode }[] = [
    {
      label: `Зарплата, ${city.name}`,
      render: (p) => (
        <div className="space-y-1.5">
          {["Начинающий", "Опытный", "Эксперт"].map((l, i) => (
            <div key={l}>
              <div className="flex justify-between gap-2 text-xs">
                <span className="text-muted">{l}</span>
                <b>{Math.round(p.salary[i] * city.salaryK)} тыс.</b>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-accent-soft">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(p.salary[i] / maxSalary) * 100}%`, background: gradient(SPHERE_THEME[p.sphere], 90) }}
                />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    { label: "Обучение", render: (p) => <><b>{formatStudy(p.study.years)}</b><div className="mt-1 text-xs text-muted">{p.study.path}</div></> },
    { label: "Предметы ЕНТ", render: (p) => p.ent },
    { label: "Тип личности", render: (p) => p.traits.map((t) => TRAITS[t].name).join(", ") },
    { label: "Навыки", render: (p) => p.skills.slice(0, 4).join(", ") },
    { label: "Польза людям", render: (p) => p.benefit },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label="Сравнение профессий"
        onClick={(e) => e.stopPropagation()}
        className="fade-up max-h-[90vh] w-full max-w-5xl overflow-auto rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-4 py-3 sm:px-6">
          <h2 className="text-lg font-semibold">Сравнение профессий</h2>
          <button onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-muted hover:text-foreground">
            Закрыть ✕
          </button>
        </div>
        <div className="overflow-x-auto p-4 sm:p-6">
          <div className="grid min-w-[36rem] gap-x-4" style={{ gridTemplateColumns: `8rem repeat(${items.length}, minmax(0, 1fr))` }}>
            <div />
            {items.map((p) => (
              <Link key={p.slug} href={`/professions/${p.slug}`} className="group overflow-hidden rounded-xl border border-line">
                <SphereArt sphere={p.sphere} seed={p.slug} className="h-20" />
                <div className="p-3 font-semibold group-hover:text-accent">{p.name}</div>
              </Link>
            ))}
            {rows.map((r) => (
              <div key={r.label} className="contents">
                <div className="border-t border-line py-3 text-sm text-muted">{r.label}</div>
                {items.map((p) => (
                  <div key={p.slug} className="border-t border-line py-3 text-sm">
                    {r.render(p)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AskAnyProfession({ initial }: { initial: string }) {
  const { city } = useCity();
  const [name, setName] = useState("");
  const ai = useAiStream();
  const value = name || initial;

  return (
    <section className="rounded-2xl border border-dashed border-accent bg-card p-5">
      <h2 className="font-semibold">Не нашёл профессию? Спроси ИИ</h2>
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
