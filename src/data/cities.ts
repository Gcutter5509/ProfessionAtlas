export type City = {
  /** ID региона в API hh (hh.kz использует тот же API) */
  hhId: string;
  name: string;
  /** Коэффициент зарплат относительно Алматы — для оценки, когда нет живых данных */
  salaryK: number;
};

const CITY_LIST: City[] = [
  { hhId: "160", name: "Алматы", salaryK: 1 },
  { hhId: "159", name: "Астана", salaryK: 1.03 },
  { hhId: "205", name: "Шымкент", salaryK: 0.75 },
  { hhId: "177", name: "Караганда", salaryK: 0.8 },
  { hhId: "154", name: "Актобе", salaryK: 0.82 },
  { hhId: "153", name: "Атырау", salaryK: 1.15 },
  { hhId: "152", name: "Актау", salaryK: 1.05 },
  { hhId: "181", name: "Павлодар", salaryK: 0.8 },
  { hhId: "194", name: "Усть-Каменогорск", salaryK: 0.8 },
  { hhId: "185", name: "Семей", salaryK: 0.72 },
  { hhId: "187", name: "Тараз", salaryK: 0.7 },
  { hhId: "172", name: "Костанай", salaryK: 0.76 },
  { hhId: "174", name: "Кызылорда", salaryK: 0.74 },
  { hhId: "193", name: "Уральск", salaryK: 0.8 },
  { hhId: "180", name: "Петропавловск", salaryK: 0.72 },
  { hhId: "190", name: "Темиртау", salaryK: 0.78 },
  { hhId: "192", name: "Туркестан", salaryK: 0.68 },
  { hhId: "176", name: "Кокшетау", salaryK: 0.72 },
  { hhId: "188", name: "Талдыкорган", salaryK: 0.72 },
  { hhId: "198", name: "Экибастуз", salaryK: 0.85 },
  { hhId: "166", name: "Жезказган", salaryK: 0.82 },
  { hhId: "182", name: "Рудный", salaryK: 0.78 },
  { hhId: "164", name: "Балхаш", salaryK: 0.78 },
  { hhId: "171", name: "Конаев", salaryK: 0.75 },
];

/** Города по алфавиту */
export const CITIES: City[] = [...CITY_LIST].sort((a, b) => a.name.localeCompare(b.name, "ru"));

/** По умолчанию — Алматы */
export const DEFAULT_CITY = CITIES.find((c) => c.hhId === "160")!;

export function findCity(hhId: string | null | undefined): City {
  return CITIES.find((c) => c.hhId === hhId) ?? DEFAULT_CITY;
}
