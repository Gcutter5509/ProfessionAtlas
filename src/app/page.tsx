import Link from "next/link";
import { Catalog } from "@/components/catalog";
import { PROFESSIONS } from "@/data/professions";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-accent to-indigo-500 p-8 text-white sm:p-12">
        <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Не знаешь, куда поступать после школы? Давай разберёмся вместе.
        </h1>
        <p className="mt-4 max-w-2xl text-white/85">
          {PROFESSIONS.length} профессий с описанием, зарплатами по городам Казахстана, вакансиями с hh.kz, сроками обучения и
          нужными навыками. Нажми на профессию — ИИ расскажет о ней подробно.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/test" className="rounded-xl bg-white px-5 py-2.5 font-semibold text-accent hover:bg-white/90">
            Пройти тест за 5 минут →
          </Link>
          <Link href="/events" className="rounded-xl border border-white/50 px-5 py-2.5 font-semibold hover:bg-white/10">
            Дни профессий
          </Link>
        </div>
      </section>
      <Catalog />
    </div>
  );
}
