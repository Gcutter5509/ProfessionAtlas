import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { findCity } from "@/data/cities";
import { getProfession, type Profession, type Trait } from "@/data/professions";
import {
  AI_MODEL,
  SYSTEM,
  aiAvailable,
  fallbackProfession,
  fallbackTest,
  freeProfessionPrompt,
  professionPrompt,
  testPrompt,
} from "@/lib/ai";
import { getVacancyStats } from "@/lib/hh";

type Body =
  | { kind: "profession"; slug: string; city?: string }
  | { kind: "free"; name: string; city?: string }
  | { kind: "test"; scores: Record<Trait, number>; slugs: string[]; city?: string };

const TRAIT_KEYS: Trait[] = ["R", "I", "A", "S", "E", "C"];

function plain(text: string, status = 200) {
  return new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return plain("Некорректный запрос", 400);
  }
  const city = findCity(body.city);

  let prompt: string;
  let fallback: string;

  if (body.kind === "profession") {
    const p = getProfession(body.slug);
    if (!p) return plain("Профессия не найдена", 404);
    const stats = await getVacancyStats(p.hh, city.hhId);
    prompt = professionPrompt(p, city, stats.ok ? { avg: stats.avgSalary, found: stats.found } : undefined);
    fallback = fallbackProfession(p, city);
  } else if (body.kind === "free") {
    const name = String(body.name ?? "").trim().slice(0, 80);
    if (name.length < 2) return plain("Введите название профессии", 400);
    prompt = freeProfessionPrompt(name, city);
    fallback = `## ${name}\n\nПопробуй найти похожую профессию в каталоге.\n\n*ИИ-описание недоступно: на сервере не настроен ключ AI_GATEWAY_API_KEY.*`;
  } else if (body.kind === "test") {
    const scores = Object.fromEntries(
      TRAIT_KEYS.map((t) => [t, Math.max(0, Math.min(100, Number(body.scores?.[t]) || 0))]),
    ) as Record<Trait, number>;
    const top = (body.slugs ?? [])
      .slice(0, 8)
      .map(getProfession)
      .filter((p): p is Profession => Boolean(p));
    if (!top.length) return plain("Нет профессий для объяснения", 400);
    prompt = testPrompt(scores, top, city);
    fallback = fallbackTest(scores, top);
  } else {
    return plain("Неизвестный тип запроса", 400);
  }

  if (!aiAvailable()) return plain(fallback);

  const result = streamText({
    model: AI_MODEL,
    instructions: SYSTEM,
    prompt,
    maxOutputTokens: 1500,
    onError({ error }) {
      console.error("AI error:", error);
    },
  });

  // streamText гасит ошибки модели; если ИИ не выдал ни символа — отдаём справку из базы
  const source = toTextStream({ stream: result.stream });
  const stream = new ReadableStream<string>({
    async start(controller) {
      let any = false;
      try {
        const reader = source.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) any = true;
          controller.enqueue(value);
        }
      } catch (error) {
        console.error("AI stream error:", error);
      }
      if (!any) controller.enqueue(fallback.replace(/\*[^*\n]*AI_GATEWAY_API_KEY[^*\n]*\*/, "*ИИ сейчас недоступен — показана справка из базы.*"));
      controller.close();
    },
  });

  return createTextStreamResponse({ stream });
}
