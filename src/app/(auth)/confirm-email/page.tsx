import Link from "next/link";
import { ConfirmEmailForm } from "./confirm-form";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="font-pixel text-base tracking-tight">Confirm email</h1>
        <p className="text-sm text-muted-foreground">
          This confirmation link is missing its token.
        </p>
        <Link href="/settings" className="text-sm text-primary hover:text-primary-hover underline">
          Back to settings
        </Link>
      </div>
    );
  }

  return <ConfirmEmailForm token={token} />;
}
