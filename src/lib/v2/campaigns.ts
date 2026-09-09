import "server-only";
import { sql, sqlOne } from "@/lib/db";

/** Campaign reads shared by the jobs pages and the business review queue. */

export type CampaignDetail = {
  id: string;
  business_id: string;
  kind: string;
  title: string;
  brief: string;
  reference_url: string | null;
  requirements: string[];
  pay_cents: number;
  slots: number;
  city: string | null;
  deadline: string | null;
  event_at: string | null;
  verified_only: boolean;
  rights_note: string;
  status: string;
  published_at: string | null;
  business_name: string;
  business_slug: string;
  business_logo: string | null;
  business_owner_id: string;
  approved_count: number;
  submission_count: number;
};

export async function getCampaign(id: string): Promise<CampaignDetail | null> {
  return sqlOne<CampaignDetail>(
    `select c.id, c.business_id, c.kind::text as kind, c.title, c.brief, c.reference_url,
            c.requirements, c.pay_cents::int as pay_cents, c.slots, c.city, c.deadline,
            c.event_at, c.verified_only, c.rights_note, c.status::text as status, c.published_at,
            b.name as business_name, b.slug as business_slug, b.logo_url as business_logo,
            b.owner_id as business_owner_id,
            (select count(*) from submissions s
              where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int as approved_count,
            (select count(*) from submissions s where s.campaign_id = c.id)::int as submission_count
       from campaigns c join businesses b on b.id = c.business_id
      where c.id = $1`,
    [id],
  );
}

export type SubmissionRow = {
  id: string;
  campaign_id: string;
  creator_id: string;
  media_urls: string[];
  note: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
  creator_username: string;
  creator_name: string | null;
  creator_avatar: string | null;
  creator_verified: boolean;
};

export async function getSubmissions(campaignId: string): Promise<SubmissionRow[]> {
  return sql<SubmissionRow>(
    `select s.id, s.campaign_id, s.creator_id, s.media_urls, s.note, s.status::text as status,
            s.review_note, s.created_at,
            p.username as creator_username, p.display_name as creator_name,
            p.avatar_url as creator_avatar,
            coalesce(cp.verification = 'verified', false) as creator_verified
       from submissions s
       join profiles p on p.id = s.creator_id
       left join creator_profiles cp on cp.profile_id = s.creator_id
      where s.campaign_id = $1
      order by (s.status in ('submitted', 'under_review')) desc, s.created_at`,
    [campaignId],
  );
}

export type ApplicationRow = {
  id: string;
  applicant_id: string;
  message: string | null;
  status: string;
  created_at: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean;
  completed_jobs: number;
};

export async function getApplications(campaignId: string): Promise<ApplicationRow[]> {
  return sql<ApplicationRow>(
    `select a.id, a.applicant_id, a.message, a.status::text as status, a.created_at,
            p.username, p.display_name, p.avatar_url,
            coalesce(cp.verification = 'verified', false) as verified,
            coalesce(cp.completed_jobs, 0) as completed_jobs
       from applications a
       join profiles p on p.id = a.applicant_id
       left join creator_profiles cp on cp.profile_id = a.applicant_id
      where a.campaign_id = $1
      order by (a.status = 'applied') desc, a.created_at`,
    [campaignId],
  );
}

/** The viewer's relationship to a campaign: application + submissions. */
export async function getMyParticipation(campaignId: string, userId: string) {
  const [application, submissions, verified] = await Promise.all([
    sqlOne<{ id: string; status: string }>(
      `select id, status::text as status from applications
        where campaign_id = $1 and applicant_id = $2`,
      [campaignId, userId],
    ),
    sql<{ id: string; status: string; media_urls: string[]; review_note: string | null; created_at: string }>(
      `select id, status::text as status, media_urls, review_note, created_at
         from submissions where campaign_id = $1 and creator_id = $2 order by created_at desc`,
      [campaignId, userId],
    ),
    sqlOne<{ ok: boolean }>(
      `select verification = 'verified' as ok from creator_profiles where profile_id = $1`,
      [userId],
    ),
  ]);
  return { application, submissions, isVerified: verified?.ok ?? false };
}
