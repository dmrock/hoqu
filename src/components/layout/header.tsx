import { SearchPalette } from "@/components/search/search-palette";
import { MobileDrawer } from "./mobile-drawer";

type HeaderProps = {
  email: string;
  name: string | null;
  image: string | null;
  username: string | null;
  pendingRequests: number;
};

export function Header({ email, name, image, username, pendingRequests }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Same container as <main> in the (main) layout, so the search trigger's
          right edge lines up with the content instead of the viewport. */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 md:px-6">
        <MobileDrawer
          email={email}
          name={name}
          image={image}
          username={username}
          pendingRequests={pendingRequests}
        />

        <div className="flex flex-1 items-center justify-end">
          <SearchPalette />
        </div>
      </div>
    </header>
  );
}
