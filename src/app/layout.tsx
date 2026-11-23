import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { CityProvider } from "@/components/city";
import { CitySelect } from "@/components/city-select";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Атлас профессий — выбери, кем стать",
  description:
    "Профориентация для выпускников Казахстана: профессии, зарплаты по городам, вакансии hh.kz, срок обучения и тест.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <CityProvider>
          <header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:py-3">
              <Link href="/" className="whitespace-nowrap text-base font-bold tracking-tight sm:text-lg">
                🧭 Атлас профессий
              </Link>
              <div className="ml-auto sm:order-last">
                <CitySelect />
              </div>
              <nav className="no-scrollbar -mx-4 flex w-full gap-1 overflow-x-auto px-3 text-sm text-muted sm:mx-0 sm:w-auto sm:gap-4 sm:overflow-visible sm:px-0">
                <Link href="/" className="whitespace-nowrap rounded-lg px-2 py-1.5 hover:text-foreground sm:px-0 sm:py-0">Каталог</Link>
                <Link href="/test" className="whitespace-nowrap rounded-lg px-2 py-1.5 hover:text-foreground sm:px-0 sm:py-0">Тест</Link>
                <Link href="/events" className="whitespace-nowrap rounded-lg px-2 py-1.5 hover:text-foreground sm:px-0 sm:py-0">Дни профессий</Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
          <footer className="border-t border-line px-4 py-6 text-center text-xs text-muted">
            Зарплаты — ориентир: живые данные hh.kz или оценка по базе. Проверяй информацию на сайтах вузов и работодателей.
          </footer>
        </CityProvider>
      </body>
    </html>
  );
}
