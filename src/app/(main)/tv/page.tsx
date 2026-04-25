import { HobbyPage } from "@/components/items/hobby-page";

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  return <HobbyPage hobbySlug="tv" title="TV Shows" searchParams={sp} />;
}
