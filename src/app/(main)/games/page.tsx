import { HobbyPage } from "@/components/items/hobby-page";

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  return <HobbyPage hobbySlug="games" title="Games" searchParams={sp} />;
}
