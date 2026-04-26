import { getRecentGames } from "@/lib/api/rawg";
import { getNowPlayingMovies, getOnTheAirTvShows } from "@/lib/api/tmdb";
import { NewReleasesRow } from "./new-releases-row";

export async function MoviesNewReleases() {
  const items = await getNowPlayingMovies().catch((err) => {
    console.error("getNowPlayingMovies failed", err);
    return [];
  });
  return <NewReleasesRow title="Now in theaters" items={items} emptyHint="Couldn't load." />;
}

export async function TvNewReleases() {
  const items = await getOnTheAirTvShows().catch((err) => {
    console.error("getOnTheAirTvShows failed", err);
    return [];
  });
  return <NewReleasesRow title="New episodes" items={items} emptyHint="Couldn't load." />;
}

export async function GamesNewReleases() {
  const items = await getRecentGames().catch((err) => {
    console.error("getRecentGames failed", err);
    return [];
  });
  return <NewReleasesRow title="Just launched" items={items} emptyHint="Couldn't load." />;
}
