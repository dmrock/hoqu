import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Avatar + name + @handle row for people lists (friends, guild members).
 * Trailing content (badges, action menus) goes in `children`.
 */
export function EntityRow({
  name,
  username,
  image,
  subtitle,
  children,
  className,
}: {
  name: string;
  username: string | null;
  image: string | null;
  /** Replaces the @handle line when set. */
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <Card padding="sm" className={cn("flex items-center gap-3", className)}>
      <Avatar className="size-10">
        {image ? <AvatarImage src={image} alt={name} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        {username ? (
          <Link
            href={`/profile/${username}`}
            className="block truncate font-medium transition-colors hover:text-primary"
          >
            {name}
          </Link>
        ) : (
          <p className="truncate font-medium">{name}</p>
        )}
        {subtitle ?? (
          <p className="truncate font-mono text-xs text-muted-foreground">
            {username ? `@${username}` : " "}
          </p>
        )}
      </div>
      {children}
    </Card>
  );
}
