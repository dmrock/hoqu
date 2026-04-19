import { HobbyPage } from "@/components/items/hobby-page";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  return <HobbyPage hobbySlug="movies" title="Movies" searchParams={sp} />;
}
