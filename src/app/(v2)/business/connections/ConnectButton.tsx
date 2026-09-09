"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestConnection } from "../actions";

export function ConnectButton({ businessId, provider }: { businessId: string; provider: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button" disabled={pending} className="btn !min-h-0 !px-3 !py-1.5 !text-[0.625rem]"
      onClick={() => startTransition(async () => { await requestConnection(businessId, provider); router.refresh(); })}
    >
      {pending ? "…" : "Request"}
    </button>
  );
}
