import { findCity } from "@/data/cities";
import { KLIMOV_KEYS, KLIMOV_MAX, type KlimovType } from "@/data/klimov";
import { getProfession, type Profession } from "@/data/professions";
import {
  getModel,
  fallbackProfession,
  fallbackTest,
  freeProfessionPrompt,
  professionPrompt,
  testPrompt,
} from "@/lib/ai";
import { generateCached, pauseAfterError } from "@/lib/ai-cache";
import { getProfessionVacancies } from "@/lib/hh";
import { typoMarkdown } from "@/lib/typograf";

type Body =
  | { kind: "profession"; slug: string; city?: string }
  | { kind: "free"; name: string; city?: string }
  | { kind: "test"; scores: Record<KlimovType, number>; slugs: string[]; city?: string };

/** Ответ — Markdown, поэтому типографируем его построчно, не трогая маркеры */
function plain(text: string, status = 200) {
  return new Response(typoMarkdown(text), { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
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
    const stats = await getProfessionVacancies(p.slug, city.hhId);
    prompt = professionPrompt(p, city, stats);
    fallback = fallbackProfession(p, city);
  } else if (body.kind === "free") {
    // нормализуем название, чтобы «Пилот» и « пилот » попадали в один кэш
    const name = String(body.name ?? "").trim().replace(/\s+/g, " ").toLowerCase().slice(0, 80);
    if (name.length < 2) return plain("Введите название профессии", 400);
    prompt = freeProfessionPrompt(name, city);
    fallback = `## ${name}\n\nПопробуй найти похожую профессию в каталоге.\n\n*ИИ-описание недоступно: на сервере не настроен ключ ИИ (GOOGLE_GENERATIVE_AI_API_KEY).*`;
  } else if (body.kind === "test") {
    const scores = Object.fromEntries(
      KLIMOV_KEYS.map((t) => [t, Math.max(0, Math.min(KLIMOV_MAX, Math.round(Number(body.scores?.[t]) || 0)))]),
    ) as Record<KlimovType, number>;
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

  if (!getModel()) return plain(fallback);

  try {
    return plain(await generateCached(prompt));
  } catch (error) {
    if (error instanceof Error && error.name === "AiPausedError") {
      // пауза после отказа провайдера — сразу отдаём справку, без запроса к ИИ
    } else {
      console.error("AI error:", error);
      pauseAfterError(error);
    }
    return plain(fallback.replace(/\*[^*\n]*GOOGLE_GENERATIVE_AI_API_KEY[^*\n]*\*/, "*ИИ сейчас недоступен — показана справка из базы.*"));
  }
}
