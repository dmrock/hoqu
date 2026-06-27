import { Badge } from "@/components/ui/badge";

type NavBadgeProps = {
  count: number;
  /** "dot" for the collapsed sidebar (no room for a number), "count" otherwise. */
  variant?: "count" | "dot";
};

/** Notification badge for a sidebar/drawer nav item; renders nothing when empty. */
export function NavBadge({ count, variant = "count" }: NavBadgeProps) {
  if (count <= 0) return null;

  const label = `${count} pending friend request${count === 1 ? "" : "s"}`;

  if (variant === "dot") {
    return (
      <span
        role="img"
        aria-label={label}
        className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary"
      />
    );
  }

  return (
    <Badge aria-label={label} className="ml-auto h-5 min-w-5 px-1.5 font-mono">
      {count}
    </Badge>
  );
}
