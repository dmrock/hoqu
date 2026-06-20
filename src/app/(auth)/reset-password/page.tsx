import Link from "next/link";
import { ResetPasswordForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="font-pixel text-base tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          This reset link is missing its token. Request a new one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm text-primary hover:text-primary-hover underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
