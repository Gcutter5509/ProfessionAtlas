import { generateText } from "ai";
import { cacheLife } from "next/cache";
import { SYSTEM, getModel } from "./ai";

/**
 * Пауза ИИ после отказа провайдера. Пока она идёт, к Gemini не обращаемся вовсе —
 * посетитель сразу получает справку из базы, а уже сохранённые ответы ИИ по-прежнему
 * отдаются из кэша. Хранится в памяти экземпляра функции (на Vercel они переиспользуются).
 */
let pausedUntil = 0;

/** Квота исчерпана, но Google не сказал, когда она сбросится */
const QUOTA_PAUSE_MS = 15 * 60_000;
/** Модель перегружена или не ответила вовремя — пробуем снова через минуту */
const OVERLOAD_PAUSE_MS = 60_000;
/** Дольше суток не ждём: дневная квота сбрасывается раз в сутки */
const MAX_PAUSE_MS = 24 * 60 * 60_000;

/** «Please retry in 1h2m3.5s» / «"retryDelay": "2552s"» → миллисекунды */
function parseRetryDelay(message: string): number | null {
  const human = message.match(/retry in\s+(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:([\d.]+)s)?/i);
  if (human && (human[1] || human[2] || human[3])) {
    const ms = ((Number(human[1] ?? 0) * 60 + Number(human[2] ?? 0)) * 60 + Number(human[3] ?? 0)) * 1000;
    if (ms > 0) return ms;
  }
  const json = message.match(/retryDelay"?\s*:\s*"([\d.]+)s"/i);
  return json ? Number(json[1]) * 1000 : null;
}

function errorText(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const body = (error as { responseBody?: unknown }).responseBody;
  return `${error.name} ${error.message} ${typeof body === "string" ? body : ""}`;
}

/** Ставит паузу, если ошибка говорит о квоте или перегрузке провайдера */
export function pauseAfterError(error: unknown) {
  const text = errorText(error);
  let pause = 0;
  if (/quota|RESOURCE_EXHAUSTED|\b429\b|rate.?limit/i.test(text)) {
    pause = parseRetryDelay(text) ?? QUOTA_PAUSE_MS;
  } else if (/high demand|UNAVAILABLE|overloaded|\b503\b|timeout|timed out|aborted/i.test(text)) {
    pause = OVERLOAD_PAUSE_MS;
  }
  if (pause > 0) pausedUntil = Math.max(pausedUntil, Date.now() + Math.min(pause, MAX_PAUSE_MS));
}

export class AiPausedError extends Error {
  constructor() {
    super("AI is paused after a provider error");
    this.name = "AiPausedError";
  }
}

/**
 * Генерирует ответ ИИ и кэширует его в общем кэше платформы (на Vercel — Runtime Cache)
 * на неделю. Ключ кэша — текст запроса, поэтому одинаковые запросы (та же профессия и
 * город, тот же результат теста) не тратят квоту Gemini повторно.
 *
 * При ошибке функция бросает исключение — такой результат не кэшируется.
 * Повторные попытки отключены: каждая из них списывается с дневной квоты.
 * Тело функции выполняется только при промахе кэша, поэтому пауза не мешает
 * отдавать уже сохранённые ответы.
 */
export async function generateCached(prompt: string): Promise<string> {
  "use cache: remote";
  cacheLife("weeks");

  if (Date.now() < pausedUntil) throw new AiPausedError();

  const model = getModel();
  if (!model) throw new Error("AI model is not configured");

  const { text } = await generateText({
    model,
    instructions: SYSTEM,
    prompt,
    maxOutputTokens: 4096,
    maxRetries: 0,
    timeout: 45_000,
  });
  if (!text.trim()) throw new Error("AI returned empty text");
  return text;
}
