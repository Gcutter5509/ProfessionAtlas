"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCity } from "@/components/city";
import { Markdown } from "@/components/markdown";
import { useAiStream } from "@/components/use-ai-stream";
import { PROFESSIONS, type Profession, type Trait, TRAITS } from "@/data/professions";

const QUESTIONS: { text: string; trait: Trait }[] = [
  { text: "Мне нравится собирать, чинить или мастерить что-то своими руками", trait: "R" },
  { text: "Я с удовольствием разбираюсь, почему что-то устроено именно так", trait: "I" },
  { text: "Я люблю рисовать, писать, снимать видео или сочинять музыку", trait: "A" },
  { text: "Друзья часто приходят ко мне за советом или поддержкой", trait: "S" },
  { text: "Мне нравится организовывать мероприятия и вести за собой людей", trait: "E" },
  { text: "Я люблю, когда всё разложено по полочкам и сделано по плану", trait: "C" },
  { text: "Мне интереснее работать на улице или в мастерской, чем в офисе", trait: "R" },
  { text: "Решать сложные задачи по математике или физике — это скорее в кайф", trait: "I" },
  { text: "Мне важно делать что-то оригинальное, а не по шаблону", trait: "A" },
  { text: "Мне нравится объяснять что-то другим, пока они не поймут", trait: "S" },
  { text: "Я легко убеждаю людей и люблю спорить, отстаивая свою позицию", trait: "E" },
  { text: "Я внимателен к деталям и редко делаю ошибки в расчётах и текстах", trait: "C" },
  { text: "Мне интересны техника, машины, электроника или спорт", trait: "R" },
  { text: "Я люблю ставить эксперименты и проверять свои догадки", trait: "I" },
  { text: "Я замечаю красоту в оформлении, дизайне, одежде, интерьерах", trait: "A" },
  { text: "Я хотел(а) бы помогать больным, детям или людям в трудной ситуации", trait: "S" },
  { text: "Мне хотелось бы когда-нибудь открыть своё дело", trait: "E" },
  { text: "Мне нравится работать с таблицами, документами, цифрами", trait: "C" },
];

const ANSWERS = ["Нет", "Скорее нет", "Скорее да", "Да"];
const TRAIT_KEYS: Trait[] = ["R", "I", "A", "S", "E", "C"];

function computeScores(answers: number[]): Record<Trait, number> {
  const raw = Object.fromEntries(TRAIT_KEYS.map((t) => [t, 0])) as Record<Trait, number>;
  const max = Object.fromEntries(TRAIT_KEYS.map((t) => [t, 0])) as Record<Trait, number>;
  QUESTIONS.forEach((q, i) => {
    raw[q.trait] += answers[i] ?? 0;
    max[q.trait] += 3;
  });
  return Object.fromEntries(TRAIT_KEYS.map((t) => [t, Math.round((raw[t] / max[t]) * 100)])) as Record<Trait, number>;
}

function matchProfessions(scores: Record<Trait, number>): { p: Profession; match: number }[] {
  const weights = [3, 2, 1];
  return PROFESSIONS.map((p) => {
    const w = p.traits.map((t, i) => weights[i] ?? 1);
    const total = w.reduce((a, b) => a + b, 0);
    const match = Math.round(p.traits.reduce((acc, t, i) => acc + scores[t] * w[i], 0) / total);
    return { p, match };
  })
    .sort((a, b) => b.match - a.match)
    .slice(0, 8);
}

export function CareerTest() {
  const { city } = useCity();
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const ai = useAiStream();
  const done = answers.length === QUESTIONS.length && step >= QUESTIONS.length;

  const result = useMemo(() => {
    if (!done) return null;
    const scores = computeScores(answers);
    return { scores, top: matchProfessions(scores) };
  }, [done, answers]);

  function answer(v: number) {
    const next = [...answers];
    next[step] = v;
    setAnswers(next);
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep === QUESTIONS.length) {
      const scores = computeScores(next);
      ai.run({ kind: "test", scores, slugs: matchProfessions(scores).map((m) => m.p.slug), city: city.hhId });
    }
  }

  function restart() {
    setAnswers([]);
    setStep(0);
  }

  if (!done || !result) {
    const q = QUESTIONS[step];
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-card p-5 sm:p-10">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Вопрос {step + 1} из {QUESTIONS.length}
          </span>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="hover:text-foreground">
              ← Назад
            </button>
          )}
        </div>
        <div className="mt-3 h-2 rounded-full bg-accent-soft">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(step / QUESTIONS.length) * 100}%` }} />
        </div>
        <h2 className="mt-6 min-h-[5.5rem] text-lg font-semibold sm:mt-8 sm:min-h-[4rem] sm:text-2xl">{q.text}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4">
          {ANSWERS.map((a, i) => (
            <button
              key={a}
              onClick={() => answer(i)}
              className={`rounded-xl border px-4 py-3 font-medium transition hover:border-accent hover:bg-accent-soft ${
                answers[step] === i ? "border-accent bg-accent-soft" : "border-line"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const sorted = TRAIT_KEYS.map((t) => [t, result.scores[t]] as const).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Твой результат</h1>
        <button onClick={restart} className="rounded-xl border border-line px-4 py-2 text-sm hover:border-accent">
          Пройти заново
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">Твой профиль</h2>
          <div className="mt-4 space-y-3">
            {sorted.map(([t, s]) => (
              <div key={t}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{TRAITS[t].name}</span>
                  <span>{s}%</span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-accent-soft">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${s}%` }} />
                </div>
                <p className="mt-0.5 text-xs text-muted">{TRAITS[t].about}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-6 font-semibold">Подходящие профессии</h2>
          <ul className="mt-3 space-y-2">
            {result.top.map(({ p, match }) => (
              <li key={p.slug}>
                <Link
                  href={`/professions/${p.slug}`}
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-2.5 hover:border-accent"
                >
                  <span>
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-xs text-muted">{p.sphere}</span>
                  </span>
                  <span className="text-sm font-semibold text-accent">{match}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-accent/40 bg-card p-5">
          <h2 className="font-semibold">🤖 Почему именно это тебе подходит</h2>
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
