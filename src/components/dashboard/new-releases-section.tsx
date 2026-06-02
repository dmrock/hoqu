import { getRecentGames } from "@/lib/api/rawg";
import { getNowPlayingMovies, getOnTheAirTvShows } from "@/lib/api/tmdb";
import { NewReleasesRow } from "./new-releases-row";

export async function MoviesNewReleases({ ownedExternalIds }: { ownedExternalIds: string[] }) {
  const items = await getNowPlayingMovies().catch((err) => {
    console.error("getNowPlayingMovies failed", err);
    return [];
  });
  return (
    <NewReleasesRow
      title="Now in theaters"
      hobbySlug="movies"
      items={items}
      ownedExternalIds={ownedExternalIds}
      emptyHint="Couldn't load."
    />
  );
}

export async function TvNewReleases({ ownedExternalIds }: { ownedExternalIds: string[] }) {
  const items = await getOnTheAirTvShows().catch((err) => {
    console.error("getOnTheAirTvShows failed", err);
    return [];
  });
  return (
    <NewReleasesRow
      title="New episodes"
      hobbySlug="tv"
      items={items}
      ownedExternalIds={ownedExternalIds}
      emptyHint="Couldn't load."
    />
  );
}

export async function GamesNewReleases({ ownedExternalIds }: { ownedExternalIds: string[] }) {
  const items = await getRecentGames().catch((err) => {
    console.error("getRecentGames failed", err);
    return [];
  });
  return (
    <NewReleasesRow
      title="Just launched"
      hobbySlug="games"
      items={items}
      ownedExternalIds={ownedExternalIds}
      emptyHint="Couldn't load."
    />
  );
}
