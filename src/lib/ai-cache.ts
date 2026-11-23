import { generateText } from "ai";
import { cacheLife } from "next/cache";
import { SYSTEM, getModel } from "./ai";

/**
 * Генерирует ответ ИИ и кэширует его в общем кэше платформы (на Vercel — Runtime Cache)
 * на неделю. Ключ кэша — текст запроса, поэтому одинаковые запросы (та же профессия и
 * город, тот же результат теста) не тратят квоту Gemini повторно.
 *
 * При ошибке функция бросает исключение — такой результат не кэшируется,
 * и следующий посетитель получит новую попытку.
 * Повторные попытки отключены: каждая из них списывается с дневной квоты.
 */
export async function generateCached(prompt: string): Promise<string> {
  "use cache: remote";
  cacheLife("weeks");

  const model = getModel();
  if (!model) throw new Error("AI model is not configured");

  const { text } = await generateText({
    model,
    instructions: SYSTEM,
    prompt,
    maxOutputTokens: 4096,
    maxRetries: 0,
    timeout: 90_000,
  });
  if (!text.trim()) throw new Error("AI returned empty text");
  return text;
}
