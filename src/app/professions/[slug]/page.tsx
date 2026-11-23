import Link from "next/link";
import { notFound } from "next/navigation";
import { AiDescription } from "@/components/ai-description";
import { accentVars, SPHERE_THEME, SphereArt } from "@/components/art";
import { CityStats } from "@/components/city-stats";
import { CareerPath, FitCheck, ProfessionTabs } from "@/components/profession-interactive";
import { getProfession, PROFESSIONS, TRAITS } from "@/data/professions";

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
    <div className="sphere-accent space-y-6" style={accentVars(SPHERE_THEME[p.sphere])}>
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Все профессии
      </Link>

      <header className="relative overflow-hidden rounded-3xl text-white">
        <SphereArt sphere={p.sphere} seed={p.slug} bare className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/15 to-transparent" />
        <div className="relative grid gap-4 p-5 sm:grid-cols-[1fr_14rem] sm:p-8">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">{p.sphere}</span>
            <h1 className="mt-3 text-2xl font-bold drop-shadow sm:text-4xl">{p.name}</h1>
            <p className="mt-2 max-w-2xl text-base text-white/90 sm:text-lg">{p.short}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.traits.map((t) => (
                <span key={t} className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur" title={TRAITS[t].about}>
                  {TRAITS[t].name}
                </span>
              ))}
            </div>
          </div>
          <SphereArt sphere={p.sphere} seed={`${p.slug}-hero`} className="art-float-always order-first h-28 self-center rounded-2xl shadow-2xl ring-4 ring-white/30 sm:order-none sm:h-36" />
        </div>
      </header>

      <blockquote className="reveal rounded-2xl border-l-4 border-accent bg-card p-4 sm:p-5">
        <div className="text-sm text-muted">Чем полезна людям</div>
        <p className="mt-1 font-medium">{p.benefit}</p>
      </blockquote>

      <CareerPath p={p} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="min-w-0 space-y-6">
          <ProfessionTabs p={p} />
          <FitCheck p={p} />
          <CityStats p={p} />
        </div>
        <AiDescription slug={p.slug} name={p.name} />
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Похожие профессии</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {similar.map((o) => (
              <Link
                key={o.slug}
                href={`/professions/${o.slug}`}
                className="reveal group overflow-hidden rounded-xl border border-line bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <SphereArt sphere={o.sphere} seed={o.slug} className="h-16" />
                <div className="p-2.5 text-sm font-medium leading-snug group-hover:text-accent">{o.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
