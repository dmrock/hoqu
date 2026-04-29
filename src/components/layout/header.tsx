import { Search } from "lucide-react";
import { MobileDrawer } from "./mobile-drawer";

type HeaderProps = {
  email: string;
  name: string | null;
  image: string | null;
  username: string | null;
};

export function Header({ email, name, image, username }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <MobileDrawer email={email} name={name} image={image} username={username} />

      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            disabled
            className="h-9 w-full rounded-lg border border-border bg-muted pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>
    </header>
  );
}
