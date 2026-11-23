import { formatStudy, type Profession } from "@/data/professions";
import { KLIMOV_MAX, KLIMOV_TYPES, type KlimovType, PROFESSION_KLIMOV, klimovVerdict } from "@/data/klimov";
import type { City } from "@/data/cities";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

/**
 * Выбор модели:
 * 1) GOOGLE_GENERATIVE_AI_API_KEY — бесплатный Gemini API (ключ из Google AI Studio);
 * 2) иначе Vercel AI Gateway (AI_GATEWAY_API_KEY или OIDC на Vercel).
 */
export function getModel(): LanguageModel | null {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google(process.env.GEMINI_MODEL || "gemini-flash-latest");
  }
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    return process.env.AI_MODEL || "anthropic/claude-sonnet-5.5";
  }
  return null;
}

export const SYSTEM = `Ты — дружелюбный профориентолог для выпускников школ Казахстана (15–18 лет).
Пиши по-русски, простым живым языком, без канцелярита, обращайся на «ты».
Опирайся на реалии Казахстана: ЕНТ, гранты, колледжи (ТиПО), вузы РК, местные компании и зарплаты в тенге.
Не выдумывай точные цифры, если не уверен, — давай диапазоны и помечай их как примерные.
Форматируй ответ в Markdown: заголовки «## », списки «- », выделение **жирным**. Не используй таблицы.`;

function fmtK(n: number, k: number) {
  return `${Math.round(n * k)} тыс. ₸`;
}

export function professionPrompt(p: Profession, city: City, live?: { avg: number | null; found: number }) {
  const liveLine = live
    ? `Живые данные hh.kz по городу ${city.name}: найдено ${live.found} вакансий, средняя зарплата по вакансиям с указанной зарплатой — ${live.avg ? Math.round(live.avg / 1000) + " тыс. ₸" : "нет данных"}.`
    : "";
  return `Расскажи школьнику о профессии «${p.name}» так, чтобы он понял, подходит ли она ему. Город школьника: ${city.name}.

Справка из нашей базы:
- Сфера: ${p.sphere}
- Коротко: ${p.short}
- Польза: ${p.benefit}
- Обучение: ${p.study.path} (минимум ${formatStudy(p.study.years)})
- ЕНТ: ${p.ent}
- Навыки: ${p.skills.join(", ")}
- Оценка зарплаты (${city.name}): начинающий ~${fmtK(p.salary[0], city.salaryK)}, опытный ~${fmtK(p.salary[1], city.salaryK)}, эксперт ~${fmtK(p.salary[2], city.salaryK)}
- Где работать: ${p.workplaces.join(", ")}
${liveLine}

Структура ответа (кратко, 300–450 слов):
## Чем занимается
## Как проходит рабочий день
## Чем полезна людям
## Как стать — путь после школы в Казахстане
## Какие качества и навыки нужны
## Зарплата и перспективы в городе ${city.name}
## Плюсы и минусы
## Попробуй уже сейчас — 3 конкретных шага для школьника`;
}

export function freeProfessionPrompt(name: string, city: City) {
  return `Расскажи школьнику о профессии «${name}». Город школьника: ${city.name}, Казахстан.
Если такой профессии не существует или запрос не про профессию — вежливо скажи об этом в одном абзаце и предложи похожие реальные профессии.

Структура ответа (кратко, 300–450 слов):
## Чем занимается
## Чем полезна людям
## Как стать — путь после школы в Казахстане (колледж/вуз, примерный срок обучения, предметы ЕНТ)
## Какие качества и навыки нужны
## Примерная зарплата в Казахстане (диапазон, пометь как ориентир)
## Плюсы и минусы
## Попробуй уже сейчас — 3 конкретных шага`;
}

export function testPrompt(scores: Record<KlimovType, number>, top: Profession[], city: City) {
  const sorted = (Object.entries(scores) as [KlimovType, number][]).sort((a, b) => b[1] - a[1]);
  return `Школьник из города ${city.name} прошёл дифференциально-диагностический опросник Е. А. Климова (20 пар занятий, по каждому типу от 0 до ${KLIMOV_MAX} баллов). Баллы по типам профессий:
${sorted.map(([t, s]) => `- «${KLIMOV_TYPES[t].name}»: ${s} из ${KLIMOV_MAX}`).join("\n")}

Вывод по правилам методики: ${klimovVerdict(scores)}

Наш алгоритм подобрал профессии: ${top.map((p) => `«${p.name}» (${p.sphere})`).join(", ")}.

Объясни ему (250–400 слов):
## Твой профиль — что значат ведущие типы профессий, какие у него сильные стороны
## Почему подходят эти профессии — по 1–2 предложения про 3–4 самые подходящие из списка, связывая с его профилем
## Сферы, на которые стоит посмотреть ещё
## Что сделать дальше — конкретные шаги (кружки, олимпиады, дни открытых дверей, профильные предметы ЕНТ)`;
}

/** Описание без ИИ — собирается из базы, если ключ не настроен */
export function fallbackProfession(p: Profession, city: City) {
  return `## Чем занимается
${p.short}

${p.tasks.map((t) => `- ${t}`).join("\n")}

## Чем полезна людям
${p.benefit}

## Как стать
${p.study.path}. Предметы ЕНТ: **${p.ent}**.

## Какие навыки нужны
${p.skills.map((s) => `- ${s}`).join("\n")}

## Зарплата в городе ${city.name} (оценка)
- Начинающий: ~${fmtK(p.salary[0], city.salaryK)}
- Опытный: ~${fmtK(p.salary[1], city.salaryK)}
- Эксперт: ~${fmtK(p.salary[2], city.salaryK)}

## Где работать
${p.workplaces.map((w) => `- ${w}`).join("\n")}

*ИИ-описание недоступно: на сервере не настроен ключ ИИ (GOOGLE_GENERATIVE_AI_API_KEY). Показана справка из базы.*`;
}

export function fallbackTest(scores: Record<KlimovType, number>, top: Profession[]) {
  const sorted = (Object.entries(scores) as [KlimovType, number][]).sort((a, b) => b[1] - a[1]);
  const [a, b] = sorted.map(([t]) => KLIMOV_TYPES[t]);
  return `## Твой профиль
${klimovVerdict(scores)}

- **${a.name}** — ${a.about.charAt(0).toLowerCase() + a.about.slice(1)} Что важно: ${a.needs.charAt(0).toLowerCase() + a.needs.slice(1)}
- **${b.name}** — ${b.about.charAt(0).toLowerCase() + b.about.slice(1)}

## Почему подходят эти профессии
${top
  .slice(0, 4)
  .map((p) => {
    const types = (PROFESSION_KLIMOV[p.slug] ?? []).map((t) => `«${KLIMOV_TYPES[t].name}»`).join(" и ");
    return `- **${p.name}** — ${p.short.charAt(0).toLowerCase() + p.short.slice(1)}${types ? ` Тип профессии: ${types}.` : ""}`;
  })
  .join("\n")}

## Что сделать дальше
- Открой карточки профессий и посмотри вакансии в своём городе
- Сходи на день открытых дверей в колледж или вуз (раздел «Дни профессий»)
- Выбери профильные предметы ЕНТ под подходящую сферу

*Подробное ИИ-объяснение недоступно: не настроен ключ ИИ (GOOGLE_GENERATIVE_AI_API_KEY).*`;
}
