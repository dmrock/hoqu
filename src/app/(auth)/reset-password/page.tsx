import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
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
        <AuthHeading
          eyebrow="Recovery"
          title="Reset password"
          description="This reset link is missing its token. Request a new one to continue."
        />
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
