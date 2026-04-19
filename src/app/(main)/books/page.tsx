import { HobbyPage } from "@/components/items/hobby-page";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  return <HobbyPage hobbySlug="books" title="Books" searchParams={sp} />;
}
