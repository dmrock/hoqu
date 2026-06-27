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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
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
    </header>
  );
}
