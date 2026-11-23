import Link from "next/link";
import { EVENTS } from "@/data/events";
import { PROFESSIONS } from "@/data/professions";

export const metadata = { title: "Дни профессий — Атлас профессий" };

export default function EventsPage() {
  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold sm:text-3xl">Дни профессий: посмотри работу вживую</h1>
        <p className="mt-2 text-muted">
          Лучший способ понять профессию — увидеть, где и как работают специалисты. Здесь собраны форматы, которые доступны
          школьникам в Казахстане, и подсказки, как на них попасть.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {EVENTS.map((e) => (
          <article key={e.title} className="flex flex-col rounded-2xl border border-line bg-card p-4 sm:p-5">
            <div className="flex flex-col-reverse items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
              <h2 className="text-lg font-semibold">
                {e.icon} {e.title}
              </h2>
              <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium">{e.when}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{e.about}</p>
            <h3 className="mt-4 text-sm font-medium">Что увидишь</h3>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {e.see.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-medium">Как попасть</h3>
            <p className="mt-1 text-sm">{e.how}</p>
            {e.professions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 pt-1">
                {e.professions.map((slug) => {
                  const p = PROFESSIONS.find((x) => x.slug === slug);
                  return p ? (
                    <Link
                      key={slug}
                      href={`/professions/${slug}`}
                      className="rounded-full border border-line px-3 py-1 text-xs hover:border-accent"
                    >
                      {p.name}
                    </Link>
                  ) : null;
                })}
              </div>
            )}
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-dashed border-line bg-card p-5 text-sm text-muted">
        <b className="text-foreground">Для школ и организаторов:</b> конкретные даты экскурсий и дней открытых дверей
        добавляются в файл <code>src/data/events.ts</code>. Даты меняются каждый год — уточняй их на сайтах вузов, колледжей и
        компаний.
      </section>
    </div>
  );
}
