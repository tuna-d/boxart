import { NextResponse, type NextRequest } from "next/server";
import { quickSearchGames } from "@/lib/games";
import { releaseYear } from "@/lib/format";

export type QuickSearchResult = {
  slug: string;
  title: string;
  year: string;
  coverUrl: string | null;
  average: number | null;
};

const MIN_QUERY_LENGTH = 2;

/** The top matches for the header search dropdown. */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] });
  }

  try {
    const items = await quickSearchGames(query);
    const results: QuickSearchResult[] = items.map(({ game, stats }) => ({
      slug: game.slug,
      title: game.title,
      year: releaseYear(game.releaseDate),
      coverUrl: game.coverUrl,
      average: stats.count > 0 ? stats.average : null,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Search is not available right now." }, { status: 502 });
  }
}
