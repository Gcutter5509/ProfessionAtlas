"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCity } from "@/components/city";
import { Markdown } from "@/components/markdown";
import { useAiStream } from "@/components/use-ai-stream";
import {
  KLIMOV_KEYS,
  KLIMOV_MAX,
  KLIMOV_QUESTIONS,
  KLIMOV_TYPES,
  klimovScores,
  klimovVerdict,
  matchByKlimov,
} from "@/data/klimov";

const TOTAL = KLIMOV_QUESTIONS.length;

export function CareerTest() {
  const { city } = useCity();
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const ai = useAiStream();
  const done = answers.length === TOTAL && step >= TOTAL;

  const result = useMemo(() => {
    if (!done) return null;
    const scores = klimovScores(answers);
    return { scores, top: matchByKlimov(scores), verdict: klimovVerdict(scores) };
  }, [done, answers]);

  function answer(v: number) {
    const next = [...answers];
    next[step] = v;
    setAnswers(next);
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep === TOTAL) {
      const scores = klimovScores(next);
      ai.run({ kind: "test", scores, slugs: matchByKlimov(scores).map((m) => m.p.slug), city: city.hhId });
    }
  }

  function restart() {
    setAnswers([]);
    setStep(0);
  }

  if (!done || !result) {
    const q = KLIMOV_QUESTIONS[step];
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-card p-5 sm:p-10">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Пара {step + 1} из {TOTAL}
          </span>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="hover:text-foreground">
              ← Назад
            </button>
          )}
        </div>
        <div className="mt-3 h-2 rounded-full bg-accent-soft">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>
        <h2 className="mt-6 text-lg font-semibold sm:mt-8 sm:text-xl">Что бы ты выбрал(а)?</h2>
        <div className="mt-4 grid gap-3">
          {[q.a, q.b].map((text, i) => (
            <button
              key={i}
              onClick={() => answer(i)}
              className={`flex min-h-[4.5rem] items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:border-accent hover:bg-accent-soft ${
                answers[step] === i ? "border-accent bg-accent-soft" : "border-line"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                {i === 0 ? "А" : "Б"}
              </span>
              <span>{text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const sorted = KLIMOV_KEYS.map((t) => [t, result.scores[t]] as const).sort((a, b) => b[1] - a[1]);
  const lead = KLIMOV_TYPES[sorted[0][0]];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Твой результат</h1>
        <button onClick={restart} className="rounded-xl border border-line px-4 py-2 text-sm hover:border-accent">
          Пройти заново
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h2 className="font-semibold">Склонности к типам профессий</h2>
          <div className="mt-4 space-y-3">
            {sorted.map(([t, s]) => (
              <div key={t}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium">{KLIMOV_TYPES[t].name}</span>
                  <span className="shrink-0">
                    {s} из {KLIMOV_MAX}
                  </span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-accent-soft">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(s / KLIMOV_MAX) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm">{result.verdict}</p>

          <div className="mt-4 rounded-xl bg-accent-soft p-4 text-sm">
            <div className="font-semibold">{lead.name}</div>
            <p className="mt-1">{lead.about}</p>
            <p className="mt-2">
              <span className="text-muted">Что важно: </span>
              {lead.needs}
            </p>
            <p className="mt-2">
              <span className="text-muted">Например: </span>
              {lead.examples}
            </p>
          </div>

          <h2 className="mt-6 font-semibold">Подходящие профессии</h2>
          <ul className="mt-3 space-y-2">
            {result.top.map(({ p, match }) => (
              <li key={p.slug}>
                <Link
                  href={`/professions/${p.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-2.5 hover:border-accent"
                >
                  <span>
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-xs text-muted">{p.sphere}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-accent">{match}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 rounded-2xl border border-accent/40 bg-card p-4 sm:p-5">
          <h2 className="font-semibold">Почему именно это тебе подходит</h2>
          <div className="mt-4">
            {ai.error && <p className="text-sm text-red-500">{ai.error}</p>}
            {!ai.text && ai.loading && <p className="text-sm text-muted">ИИ анализирует твои ответы…</p>}
            {ai.text && <Markdown text={ai.text} />}
          </div>
        </section>
      </div>
    </div>
  );
}
