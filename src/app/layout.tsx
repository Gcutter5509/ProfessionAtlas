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
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
              <Link href="/" className="text-lg font-bold tracking-tight">
                🧭 Атлас профессий
              </Link>
              <nav className="flex gap-4 text-sm text-muted">
                <Link href="/" className="hover:text-foreground">Каталог</Link>
                <Link href="/test" className="hover:text-foreground">Тест</Link>
                <Link href="/events" className="hover:text-foreground">Дни профессий</Link>
              </nav>
              <div className="ml-auto">
                <CitySelect />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-line py-6 text-center text-xs text-muted">
            Зарплаты — ориентир: живые данные hh.kz или оценка по базе. Проверяй информацию на сайтах вузов и работодателей.
          </footer>
        </CityProvider>
      </body>
    </html>
  );
}
