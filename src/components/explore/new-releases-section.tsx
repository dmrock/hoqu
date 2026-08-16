import { getRecentGames } from "@/lib/api/igdb";
import { getNowPlayingMovies, getOnTheAirTvShows } from "@/lib/api/tmdb";
import { filterOwnedExternalIds } from "@/lib/owned-items";
import { NewReleasesRow } from "./new-releases-row";

export async function MoviesNewReleases({
  viewerId,
  eager,
}: {
  viewerId: string;
  eager?: boolean;
}) {
  const items = await getNowPlayingMovies().catch((err) => {
    console.error("getNowPlayingMovies failed", err);
    return [];
  });
  const ownedExternalIds = await filterOwnedExternalIds(
    viewerId,
    "movies",
    items.map((i) => i.externalId),
  );
  return (
    <NewReleasesRow
      title="Now in theaters"
      hobbySlug="movies"
      items={items}
      ownedExternalIds={ownedExternalIds}
      emptyHint="Couldn't load."
      eager={eager}
    />
  );
}

export async function TvNewReleases({ viewerId }: { viewerId: string }) {
  const items = await getOnTheAirTvShows().catch((err) => {
    console.error("getOnTheAirTvShows failed", err);
    return [];
  });
  const ownedExternalIds = await filterOwnedExternalIds(
    viewerId,
    "tv",
    items.map((i) => i.externalId),
  );
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

export async function GamesNewReleases({ viewerId }: { viewerId: string }) {
  const items = await getRecentGames().catch((err) => {
    console.error("getRecentGames failed", err);
    return [];
  });
  const ownedExternalIds = await filterOwnedExternalIds(
    viewerId,
    "games",
    items.map((i) => i.externalId),
  );
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
