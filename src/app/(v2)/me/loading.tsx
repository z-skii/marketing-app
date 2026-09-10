import { SkeletonRows } from "@/components/v2/ui";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-32 rounded bg-surface-2" />
      <div className="mt-2 h-8 w-56 rounded bg-surface-2" />
      <div className="mt-6">
        <SkeletonRows n={2} />
      </div>
    </main>
  );
}
