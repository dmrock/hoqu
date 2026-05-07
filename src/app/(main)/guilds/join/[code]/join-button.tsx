"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinGuildByCode } from "@/app/(main)/guilds/actions";
import { Button } from "@/components/ui/button";

export function JoinByCodeButton({ code }: { code: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await joinGuildByCode({ code });
      if (res.ok && res.data) {
        router.push(`/guilds/${res.data.guildId}`);
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={pending}>
        <LogIn />
        {pending ? "Joining..." : "Join guild"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
