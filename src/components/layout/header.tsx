import { SearchPalette } from "@/components/search/search-palette";
import { Logo } from "./logo";
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
    // Glass bar; the bottom edge is a brand-tinted hairline instead of a
    // flat border so the chrome has a little depth of its own.
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-md supports-backdrop-filter:bg-background/60 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-linear-to-r after:from-border after:via-primary/40 after:to-border">
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
        <Logo href="/explore" className="md:hidden" />

        <div className="flex flex-1 items-center justify-end">
          <SearchPalette />
        </div>
      </div>
    </header>
  );
}
