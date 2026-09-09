"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { LocationForm } from "@/components/locations/location-form";
import { createLocationAction } from "@/app/(app)/stores/actions";

export function NewStoreForm({ defaultTimezone }: { defaultTimezone: string }) {
  const router = useRouter();
  const onDone = useCallback((id?: string) => { router.push(id ? `/stores/${id}` : "/stores"); }, [router]);
  return <LocationForm action={createLocationAction} defaultTimezone={defaultTimezone} submitLabel="Add store" onDone={onDone} />;
}
