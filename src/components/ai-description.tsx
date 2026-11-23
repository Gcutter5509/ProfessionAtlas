"use client";

import { useEffect } from "react";
import { useCity } from "./city";
import { Markdown } from "./markdown";
import { useAiStream } from "./use-ai-stream";

export function AiDescription({ slug, name }: { slug: string; name: string }) {
  const { city } = useCity();
  const ai = useAiStream();
  const { run } = ai;

  // Описание генерируется сразу при открытии профессии и при смене города
  useEffect(() => {
    run({ kind: "profession", slug, city: city.hhId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, city.hhId]);

  return (
    <section className="min-w-0 rounded-2xl border border-accent/40 bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">🤖 ИИ-гид: «{name}» в городе {city.name}</h2>
        <button
          onClick={() => run({ kind: "profession", slug, city: city.hhId })}
          disabled={ai.loading}
          className="rounded-lg border border-line px-3 py-1 text-sm hover:border-accent disabled:opacity-50"
        >
          {ai.loading ? "Пишу…" : "Обновить"}
        </button>
      </div>
      <div className="mt-4">
        {ai.error && <p className="text-sm text-red-500">{ai.error}</p>}
        {!ai.text && ai.loading && (
          <div className="space-y-2">
            {[80, 95, 70, 90].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-accent-soft" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
        {ai.text && <Markdown text={ai.text} />}
      </div>
    </section>
  );
}
