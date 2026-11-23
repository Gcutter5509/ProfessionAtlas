import { CareerTest } from "./career-test";

export const metadata = { title: "Профориентационный тест — Атлас профессий" };

export default function TestPage() {
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Какая профессия тебе подходит?</h1>
        <p className="mt-2 text-muted">
          20 пар занятий — в каждой выбери то, что тебе ближе. Представь, что ты уже всему обучен(а) и можешь делать любую
          работу. Долго не раздумывай: правильных ответов нет. Тест определит, к какому из пяти типов профессий у тебя
          больше склонность, подберёт профессии, а ИИ объяснит почему.
        </p>
        <p className="mt-2 text-xs text-muted">
          Методика: дифференциально-диагностический опросник (ДДО) Е. А. Климова. Тест помогает задуматься, но не ставит
          диагноз.
        </p>
      </div>
      <CareerTest />
    </div>
  );
}
