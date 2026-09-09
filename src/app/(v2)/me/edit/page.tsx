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
    <main id="main" className="mx-auto w-full max-w-md px-4 py-5 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <h1 className="mt-2 font-display text-2xl font-900 tracking-[-0.03em]">Edit profile</h1>
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
