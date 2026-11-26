import { findCity } from "@/data/cities";
import { getCityOverview } from "@/lib/city-overview";

export async function GET(request: Request) {
  const city = findCity(new URL(request.url).searchParams.get("city"));
  return Response.json(await getCityOverview(city.hhId));
}
