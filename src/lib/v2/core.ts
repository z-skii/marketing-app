import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { sql, sqlOne } from "@/lib/db";

/**
 * TapMart identity: one account, two modes. A person is always themselves
 * (User mode: the earning marketplace) and may also be acting as one of the
 * businesses they belong to (Business mode: the marketing command center).
 * Which one is active is remembered on the profile, so every device opens in
 * the same mode. Everything the shell and the screens need to adapt resolves
 * here, server-side, from the session.
 */

export type BusinessRef = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  member_role: string;
};

export type InstagramState = {
  status: "disconnected" | "pending" | "connected" | "error";
  handle: string | null;
  followers: number | null;
  verifiedBy: "none" | "manual" | "api";
};

export type V2Context = {
  user: CurrentUser;
  bio: string | null;
  city: string | null;
  avatarUrl: string | null;
  wantsEarn: boolean;
  wantsBusiness: boolean;
  onboarded: boolean;
  businesses: BusinessRef[];
  /** "business" when acting as a business the person belongs to. */
  mode: "user" | "business";
  activeBusiness: BusinessRef | null;
  vehicleCount: number;
  hasVehicles: boolean;
  isCreator: boolean;
  isVerified: boolean;
  instagram: InstagramState;
  unreadNotifications: number;
  unreadMessages: number;
};

export const getV2Context = cache(loadV2Context);

async function loadV2Context(): Promise<V2Context | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const [flags, businesses, counts, instagram] = await Promise.all([
    sqlOne<{
      bio: string | null; city: string | null; avatar_url: string | null;
      wants_earn: boolean; wants_business: boolean; onboarded_at: string | null;
      active_business_id: string | null;
    }>(
      `select bio, city, avatar_url, wants_earn, wants_business, onboarded_at, active_business_id
         from profiles where id = $1`,
      [user.id],
    ),
    sql<BusinessRef>(
      `select b.id, b.name, b.slug, b.logo_url, m.member_role
         from business_members m join businesses b on b.id = m.business_id
        where m.profile_id = $1 order by b.created_at`,
      [user.id],
    ),
    sqlOne<{ vehicles: string; creator: string; verified: string; unread: string; unread_msgs: string }>(
      `select
         (select count(*) from vehicles where owner_id = $1)::text as vehicles,
         (select count(*) from creator_profiles where profile_id = $1)::text as creator,
         (select count(*) from creator_profiles where profile_id = $1 and verification = 'verified')::text as verified,
         (select count(*) from notifications where profile_id = $1 and read_at is null)::text as unread,
         (select count(*) from conversation_members cm
           where cm.profile_id = $1
             and exists (select 1 from messages msg
                          where msg.conversation_id = cm.conversation_id
                            and msg.created_at > cm.last_read_at
                            and msg.sender_id is distinct from $1))::text as unread_msgs`,
      [user.id],
    ),
    sqlOne<{ status: InstagramState["status"]; handle: string | null; follower_count: number | null; verified_by: InstagramState["verifiedBy"] }>(
      `select status::text as status, handle, follower_count, verified_by
         from social_accounts where profile_id = $1 and provider = 'instagram'`,
      [user.id],
    ),
  ]);

  const activeBusiness = businesses.find((b) => b.id === flags?.active_business_id) ?? null;
  const vehicleCount = Number(counts?.vehicles ?? 0);

  return {
    user,
    bio: flags?.bio ?? null,
    city: flags?.city ?? null,
    avatarUrl: flags?.avatar_url ?? null,
    wantsEarn: flags?.wants_earn ?? false,
    wantsBusiness: flags?.wants_business ?? false,
    onboarded: Boolean(flags?.onboarded_at),
    businesses,
    mode: activeBusiness ? "business" : "user",
    activeBusiness,
    vehicleCount,
    hasVehicles: vehicleCount > 0,
    isCreator: Number(counts?.creator ?? 0) > 0,
    isVerified: Number(counts?.verified ?? 0) > 0,
    instagram: {
      status: instagram?.status ?? "disconnected",
      handle: instagram?.handle ?? null,
      // A follower count is only shown once the account is connected (API or confirmed by TapMart).
      followers: instagram?.status === "connected" ? (instagram?.follower_count ?? null) : null,
      verifiedBy: instagram?.verified_by ?? "none",
    },
    unreadNotifications: Number(counts?.unread ?? 0),
    unreadMessages: Number(counts?.unread_msgs ?? 0),
  };
}

/** Session required; unauthenticated visitors go to sign-in and come back. */
export async function requireV2(next = "/home"): Promise<V2Context> {
  const ctx = await getV2Context();
  if (!ctx) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (ctx.user.suspended) redirect("/");
  return ctx;
}

/** Onboarded session required; fresh accounts finish onboarding first. */
export async function requireOnboarded(next = "/home"): Promise<V2Context> {
  const ctx = await requireV2(next);
  if (!ctx.onboarded) redirect("/onboarding");
  return ctx;
}

/**
 * Business screens need a business. The active one wins; a person with
 * businesses but no active one is switched into their first business; a
 * person with none is sent to add one.
 */
export async function requireBusinessContext(next = "/business"): Promise<V2Context & { activeBusiness: BusinessRef }> {
  const ctx = await requireOnboarded(next);
  if (ctx.activeBusiness) return ctx as V2Context & { activeBusiness: BusinessRef };
  if (ctx.businesses.length > 0) {
    await setActiveBusiness(ctx.user.id, ctx.businesses[0].id);
    return { ...ctx, mode: "business", activeBusiness: ctx.businesses[0] };
  }
  redirect("/business/new");
}

/** Persist the identity a person is acting as (null = personal). */
export async function setActiveBusiness(userId: string, businessId: string | null) {
  await sql(
    `update profiles set active_business_id =
       case when $2::uuid is null then null
            when exists (select 1 from business_members m where m.business_id = $2 and m.profile_id = $1) then $2::uuid
            else active_business_id end
      where id = $1`,
    [userId, businessId],
  );
}

/**
 * Membership gate for business actions. Returns the member role or redirects;
 * `roles` narrows to e.g. owners only. Admins pass for moderation purposes.
 */
export async function requireBusinessMember(
  userId: string,
  businessId: string,
  roles?: string[],
): Promise<string> {
  const row = await sqlOne<{ member_role: string; role: string }>(
    `select coalesce(m.member_role, '') as member_role, p.role::text as role
       from profiles p
       left join business_members m on m.business_id = $2 and m.profile_id = p.id
      where p.id = $1`,
    [userId, businessId],
  );
  if (row?.role === "admin") return "owner";
  const memberRole = row?.member_role || null;
  if (!memberRole || (roles && !roles.includes(memberRole))) {
    throw new Error("You don't have permission to manage this business.");
  }
  return memberRole;
}

/** Notifications: the platform's activity stream. Fire and forget. */
export async function notify(
  profileId: string,
  category: string,
  title: string,
  options: { body?: string; href?: string } = {},
) {
  await sql(
    `insert into notifications (profile_id, category, title, body, href) values ($1, $2, $3, $4, $5)`,
    [profileId, category, title, options.body ?? null, options.href ?? null],
  );
}

export async function notifyMany(
  profileIds: string[],
  category: string,
  title: string,
  options: { body?: string; href?: string } = {},
) {
  if (profileIds.length === 0) return;
  await sql(
    `insert into notifications (profile_id, category, title, body, href)
     select unnest($1::uuid[]), $2, $3, $4, $5`,
    [profileIds, category, title, options.body ?? null, options.href ?? null],
  );
}

/**
 * Conversations. Marketplace threads are anchored to a topic (a campaign, an
 * offer, a booking, a business or a profile) so the same people talking about
 * the same thing always land in the same thread.
 */
export async function ensureConversation(
  topicType: "campaign" | "offer" | "booking" | "business" | "profile",
  topicId: string,
  memberIds: string[],
): Promise<string> {
  const existing = await sqlOne<{ id: string }>(
    `select c.id from conversations c
      where c.topic_type = $1 and c.topic_id = $2
        and not exists (
          select 1 from unnest($3::uuid[]) want(id)
           where not exists (select 1 from conversation_members m
                              where m.conversation_id = c.id and m.profile_id = want.id))
      limit 1`,
    [topicType, topicId, memberIds],
  );
  if (existing) return existing.id;

  const conv = await sqlOne<{ id: string }>(
    `insert into conversations (topic_type, topic_id) values ($1, $2) returning id`,
    [topicType, topicId],
  );
  await sql(
    `insert into conversation_members (conversation_id, profile_id)
     select $1, unnest($2::uuid[]) on conflict do nothing`,
    [conv!.id, memberIds],
  );
  return conv!.id;
}

export async function requireConversationMember(userId: string, conversationId: string) {
  const member = await sqlOne(
    `select 1 as ok from conversation_members where conversation_id = $1 and profile_id = $2`,
    [conversationId, userId],
  );
  if (!member) throw new Error("You're not part of this conversation.");
}

/** A system line in a thread ("Offer accepted", "Submission uploaded"). */
export async function systemMessage(conversationId: string, body: string) {
  await sql(
    `insert into messages (conversation_id, sender_id, kind, body) values ($1, null, 'system', $2)`,
    [conversationId, body],
  );
}
