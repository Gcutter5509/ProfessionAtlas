import { findCity } from "@/data/cities";
import { getProfession } from "@/data/professions";
import { getProfessionVacancies } from "@/lib/hh";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prof = getProfession(searchParams.get("slug") ?? "");
  if (!prof) return Response.json({ error: "Профессия не найдена" }, { status: 404 });
  const city = findCity(searchParams.get("city"));
  const stats = await getProfessionVacancies(prof.slug, city.hhId);
  return Response.json(stats);
}
