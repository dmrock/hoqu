import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
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
        <AuthHeading
          eyebrow="Checkpoint"
          title="Confirm email"
          description="This confirmation link is missing its token."
        />
        <Link href="/settings" className="text-sm text-primary hover:text-primary-hover underline">
          Back to settings
        </Link>
      </div>
    );
  }

  return <ConfirmEmailForm token={token} />;
}
