"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type City, DEFAULT_CITY, findCity } from "@/data/cities";

const KEY = "atlas-city";
const Ctx = createContext<{ city: City; setCity: (id: string) => void }>({
  city: DEFAULT_CITY,
  setCity: () => {},
});

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCityState] = useState<City>(DEFAULT_CITY);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- восстановление выбора после гидрации
      if (saved) setCityState(findCity(saved));
    } catch {}
  }, []);

  function setCity(id: string) {
    setCityState(findCity(id));
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  }

  return <Ctx.Provider value={{ city, setCity }}>{children}</Ctx.Provider>;
}

export const useCity = () => useContext(Ctx);
