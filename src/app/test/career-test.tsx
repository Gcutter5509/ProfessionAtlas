"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gradient, KLIMOV_THEME, KlimovArt, SphereArt, textColor } from "@/components/art";
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
  type KlimovType,
  matchByKlimov,
} from "@/data/klimov";

const TOTAL = KLIMOV_QUESTIONS.length;

/** Картинка к паре: слева занятие «А», справа — «Б» (сгенерированы под каждый вопрос) */
const questionImage = (step: number) => `/test/q${String(step + 1).padStart(2, "0")}.svg`;

export function CareerTest() {
  const { city } = useCity();
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const ai = useAiStream();
  // Подсветка привязана к вопросу, поэтому при переходе к следующему сбрасывается сама
  const [hover, setHover] = useState<{ step: number; side: number } | null>(null);
  const hoverSide = hover?.step === step ? hover.side : null;
  const setHoverSide = (side: number | null) => setHover(side === null ? null : { step, side });
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

  // Клавиши: ← / 1 — вариант А, → / 2 — вариант Б, Backspace — назад
  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  });
  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "ArrowLeft" || e.key === "1") answerRef.current(0);
      else if (e.key === "ArrowRight" || e.key === "2") answerRef.current(1);
      else if (e.key === "Backspace") setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done]);

  // Заранее подгружаем картинку следующего вопроса
  useEffect(() => {
    if (step + 1 < TOTAL) new window.Image().src = questionImage(step + 1);
  }, [step]);

  function restart() {
    setAnswers([]);
    setStep(0);
  }

  if (!done || !result) {
    const q = KLIMOV_QUESTIONS[step];
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-card p-5 sm:p-8">
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
        <div className="mt-3 flex gap-1">
          {KLIMOV_QUESTIONS.map((_, i) => (
            <button
              key={i}
              onClick={() => i <= answers.length && setStep(i)}
              disabled={i > answers.length}
              aria-label={`Пара ${i + 1}`}
              className={`h-2 flex-1 rounded-full transition-all ${
                i === step ? "bg-accent scale-y-150" : i < answers.length ? "bg-accent/60 hover:bg-accent" : "bg-accent-soft"
              }`}
            />
          ))}
        </div>
        <h2 className="mt-6 text-center text-lg font-semibold sm:text-xl">Что бы ты выбрал(а)?</h2>
        <div key={step} className="fade-up relative mt-5 overflow-hidden rounded-2xl border border-line">
          <Image
            src={questionImage(step)}
            alt={`Слева: ${q.a.toLowerCase()}. Справа: ${q.b.toLowerCase()}`}
            width={1200}
            height={600}
            unoptimized
            priority
            className="aspect-[2/1] w-full object-cover"
          />
          {/* Половины картинки тоже кликабельны: левая — «А», правая — «Б» */}
          {[0, 1].map((i) => (
            <button
              key={i}
              tabIndex={-1}
              aria-hidden
              onClick={() => answer(i)}
              onMouseEnter={() => setHoverSide(i)}
              onMouseLeave={() => setHoverSide(null)}
              className={`absolute inset-y-0 w-1/2 transition-colors ${i === 0 ? "left-0" : "right-0"} ${
                hoverSide !== null && hoverSide !== i ? "bg-background/55" : ""
              }`}
            >
              <span
                className={`absolute bottom-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shadow transition ${
                  i === 0 ? "left-3" : "right-3"
                } ${hoverSide === i || answers[step] === i ? "bg-accent text-white" : "bg-card text-accent"}`}
              >
                {i === 0 ? "А" : "Б"}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
          {[q.a, q.b].map((text, i) => (
            <Option
              key={`${step}-${i}`}
              letter={i === 0 ? "А" : "Б"}
              text={text}
              chosen={answers[step] === i}
              highlighted={hoverSide === i}
              onClick={() => answer(i)}
              onHover={(on) => setHoverSide(on ? i : null)}
              delay={i * 80}
              order={i === 0 ? "order-1" : "order-3"}
            />
          ))}
          <div className="order-2 -my-1 flex items-center justify-center text-sm font-semibold text-muted sm:my-0">или</div>
        </div>
        <p className="mt-5 hidden text-center text-xs text-muted sm:block">Можно отвечать клавишами ← и →</p>
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
          <Radar scores={result.scores} />
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
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(s / KLIMOV_MAX) * 100}%`, background: gradient(KLIMOV_THEME[t], 90) }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm">{result.verdict}</p>

          <div className="mt-4 overflow-hidden rounded-xl bg-accent-soft text-sm">
            <KlimovArt type={sorted[0][0]} className="art-float-always h-28" />
            <div className="p-4">
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
          </div>

          <h2 className="mt-6 font-semibold">Подходящие профессии</h2>
          <ul className="mt-3 space-y-2">
            {result.top.map(({ p, match }) => (
              <li key={p.slug}>
                <Link
                  href={`/professions/${p.slug}`}
                  className="flex items-center gap-3 overflow-hidden rounded-xl border border-line pr-4 transition hover:border-accent hover:shadow"
                >
                  <SphereArt sphere={p.sphere} seed={p.slug} className="h-14 w-20 shrink-0" />
                  <span className="min-w-0 flex-1 py-2">
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

function Option({
  letter,
  text,
  chosen,
  highlighted,
  onClick,
  onHover,
  delay,
  order,
}: {
  letter: string;
  text: string;
  chosen: boolean;
  highlighted: boolean;
  onClick: () => void;
  onHover: (on: boolean) => void;
  delay: number;
  order: string;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      style={{ animationDelay: `${delay}ms` }}
      className={`fade-up group flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[.98] ${order} ${
        chosen ? "border-accent bg-accent-soft" : highlighted ? "border-accent" : "border-line"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
          highlighted || chosen ? "bg-accent text-white" : "bg-accent-soft text-accent"
        }`}
      >
        {letter}
      </span>
      <span>{text}</span>
    </button>
  );
}

/** Пятиугольная диаграмма склонностей: наведи на вершину — увидишь подсказку */
function Radar({ scores }: { scores: Record<KlimovType, number> }) {
  const [hover, setHover] = useState<KlimovType | null>(null);
  const R = 80;
  const C = 110;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / KLIMOV_KEYS.length) * Math.PI * 2;
    return [C + Math.cos(a) * R * v, C + Math.sin(a) * R * v] as const;
  };
  const poly = (v: (i: number) => number) => KLIMOV_KEYS.map((_, i) => pt(i, v(i)).join(",")).join(" ");
  const h = hover ? KLIMOV_TYPES[hover] : null;

  return (
    <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
      <svg viewBox="0 0 220 220" className="w-full max-w-[16rem] shrink-0">
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <polygon key={r} points={poly(() => r)} fill="none" stroke="var(--line)" />
        ))}
        {KLIMOV_KEYS.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="var(--line)" />;
        })}
        <polygon
          points={poly((i) => Math.max(0.04, scores[KLIMOV_KEYS[i]] / KLIMOV_MAX))}
          fill="var(--accent)"
          fillOpacity={0.25}
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          className="pop"
          style={{ transformOrigin: `${C}px ${C}px` }}
        />
        {KLIMOV_KEYS.map((t, i) => {
          const [x, y] = pt(i, Math.max(0.04, scores[t] / KLIMOV_MAX));
          const [lx, ly] = pt(i, 1.2);
          return (
            <g
              key={t}
              onMouseEnter={() => setHover(t)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === t ? null : t)}
              className="cursor-pointer"
            >
              <circle cx={x} cy={y} r={hover === t ? 7 : 5} fill={KLIMOV_THEME[t].from} stroke="var(--card)" strokeWidth={2} />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fontWeight={hover === t ? 700 : 500}
                fill="var(--foreground)"
              >
                {KLIMOV_TYPES[t].short}
              </text>
              <circle cx={lx} cy={ly} r={18} fill="transparent" />
            </g>
          );
        })}
      </svg>
      <div className="min-h-[5rem] flex-1 text-sm">
        {h && hover ? (
          <div key={hover} className="fade-up">
            <div className="font-semibold" style={{ color: textColor(KLIMOV_THEME[hover]) }}>
              {h.name}: {scores[hover]} из {KLIMOV_MAX}
            </div>
            <p className="mt-1 text-muted">{h.about}</p>
          </div>
        ) : (
          <p className="text-muted">Наведи или нажми на вершину диаграммы, чтобы узнать о типе подробнее.</p>
        )}
      </div>
    </div>
  );
}
