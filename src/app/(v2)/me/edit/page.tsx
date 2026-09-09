import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { EditProfileForm } from "./EditProfileForm";

export const metadata = { title: "Edit profile" };
export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const row = await sqlOne<{ avatar_url: string | null }>(
    `select avatar_url from profiles where id = $1`, [ctx.user.id],
  );
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Edit profile</h1>
      <p className="mt-1 text-sm text-ink-faint">What businesses and other creators see when they open your profile.</p>
      <EditProfileForm
        initial={{
          displayName: ctx.user.displayName ?? "",
          bio: ctx.bio ?? "",
          city: ctx.city ?? "",
          avatarUrl: row?.avatar_url ?? "",
        }}
      />
    </main>
  );
}
