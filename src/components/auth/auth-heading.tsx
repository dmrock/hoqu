export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  /** Pixel-font label above the title — "Continue", "New game", "Recovery". */
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="space-y-2 text-center">
      <p className="font-pixel text-[10px] text-primary uppercase leading-none">{eyebrow}</p>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
