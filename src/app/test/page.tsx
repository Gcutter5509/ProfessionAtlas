import { CareerTest } from "./career-test";

export const metadata = { title: "Профориентационный тест — Атлас профессий" };

export default function TestPage() {
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold">Какая профессия тебе подходит?</h1>
        <p className="mt-2 text-muted">
          18 коротких утверждений. Отвечай честно — правильных ответов нет. Тест основан на модели Холланда: он определит твой
          тип личности и подберёт профессии, а ИИ объяснит почему.
        </p>
      </div>
      <CareerTest />
    </div>
  );
}
