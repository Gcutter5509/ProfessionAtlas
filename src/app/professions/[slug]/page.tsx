import Link from "next/link";
import { notFound } from "next/navigation";
import { AiDescription } from "@/components/ai-description";
import { CityStats } from "@/components/city-stats";
import { formatStudy, getProfession, PROFESSIONS, TRAITS } from "@/data/professions";

export function generateStaticParams() {
  return PROFESSIONS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/professions/[slug]">) {
  const p = getProfession((await params).slug);
  return { title: p ? `${p.name} — Атлас профессий` : "Профессия не найдена" };
}

export default async function ProfessionPage({ params }: PageProps<"/professions/[slug]">) {
  const p = getProfession((await params).slug);
  if (!p) notFound();

  const similar = PROFESSIONS.filter(
    (o) => o.slug !== p.slug && (o.sphere === p.sphere || o.traits[0] === p.traits[0]),
  ).slice(0, 6);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Все профессии
      </Link>

      <header>
        <span className="text-sm font-medium text-accent">{p.sphere}</span>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{p.name}</h1>
        <p className="mt-2 max-w-3xl text-base text-muted sm:text-lg">{p.short}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.traits.map((t) => (
            <span key={t} className="rounded-full bg-accent-soft px-3 py-1 text-sm" title={TRAITS[t].about}>
              {TRAITS[t].name}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <Fact title="Срок обучения" value={formatStudy(p.study.years)} note={p.study.path} />
        <Fact title="Предметы ЕНТ" value={p.ent} />
        <Fact title="Польза людям" value={p.benefit} small />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <h2 className="text-lg font-semibold">Что делает</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {p.tasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h2 className="mt-6 text-lg font-semibold">Какие навыки нужны</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span key={s} className="rounded-lg border border-line px-3 py-1 text-sm">
                  {s}
                </span>
              ))}
            </div>
            <h2 className="mt-6 text-lg font-semibold">Где работать</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {p.workplaces.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>
          <CityStats p={p} />
        </div>
        <AiDescription slug={p.slug} name={p.name} />
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Похожие профессии</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {similar.map((o) => (
              <Link
                key={o.slug}
                href={`/professions/${o.slug}`}
                className="rounded-xl border border-line bg-card px-4 py-2 text-sm hover:border-accent"
              >
                {o.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Fact({ title, value, note, small }: { title: string; value: string; note?: string; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="text-sm text-muted">{title}</div>
      <div className={`mt-1 font-semibold ${small ? "text-sm" : "text-lg"}`}>{value}</div>
      {note && <div className="mt-1 text-xs text-muted">{note}</div>}
    </div>
  );
}
