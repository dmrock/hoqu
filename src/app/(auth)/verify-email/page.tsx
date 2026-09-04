import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
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
        <AuthHeading
          eyebrow="Checkpoint"
          title="Verify email"
          description="This verification link is missing its token."
        />
        <Link href="/explore" className="text-sm text-primary hover:text-primary-hover underline">
          Back to HOQU
        </Link>
      </div>
    );
  }

  return <VerifyEmailForm token={token} />;
}
