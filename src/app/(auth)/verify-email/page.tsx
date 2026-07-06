import Link from "next/link";
import { VerifyEmailForm } from "./verify-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="font-pixel text-base tracking-tight">Verify email</h1>
        <p className="text-sm text-muted-foreground">
          This verification link is missing its token.
        </p>
        <Link href="/dashboard" className="text-sm text-primary hover:text-primary-hover underline">
          Back to HOQU
        </Link>
      </div>
    );
  }

  return <VerifyEmailForm token={token} />;
}
