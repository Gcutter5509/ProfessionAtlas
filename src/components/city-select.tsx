"use client";

import { CITIES } from "@/data/cities";
import { useCity } from "./city";

export function CitySelect() {
  const { city, setCity } = useCity();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">📍 Город:</span>
      <select
        value={city.hhId}
        onChange={(e) => setCity(e.target.value)}
        className="rounded-lg border border-line bg-card px-3 py-1.5 font-medium outline-none focus:border-accent"
      >
        {CITIES.map((c) => (
          <option key={c.hhId} value={c.hhId}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
