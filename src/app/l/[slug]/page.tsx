import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Bar } from "@/components/Bar";
import { OpenButton } from "@/components/OpenButton";
import { ShareButton } from "@/components/ShareButton";
import { OpensIcon } from "@/components/icons";
import { getBar, getLinkBySlug } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { formatCredit, formatCount } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  if (!link) return { title: "Not found" };
  const card = `${SITE_URL}/l/${link.slug}/story`;
  return {
    title: link.display_name,
    description: link.short_description ?? `${link.display_name} — live on ${SITE_NAME}.`,
    openGraph: {
      title: link.display_name,
      description: link.short_description ?? undefined,
      images: [{ url: card, width: 1080, height: 1920 }],
    },
    twitter: { card: "summary_large_image" as const, images: [card] },
  };
}

/**
 * A link's public page is its story card: the same 1080x1920 image people can
 * save and post, framed like a print proof, with the live stats beside it.
 */
export default async function LinkProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [user, link, bar] = await Promise.all([getCurrentUser(), getLinkBySlug(slug), getBar()]);
  if (!link) notFound();

  const openPlacement = link.board_placement_id ?? link.spot_placement_id ?? link.bar_placement_id;
  const storyPath = `/l/${link.slug}/story`;
  // The preview must bypass phone image caches; the page renders per request,
  // so a fresh stamp per view is deliberate.
  // eslint-disable-next-line react-hooks/purity
  const cardVersion = Date.now();

  const participation = [
    link.board_placement_id && `The Board${link.board_rank ? ` · #${link.board_rank}` : ""}`,
    link.spot_placement_id && "The Spot",
    link.bar_placement_id && "The Bar",
  ].filter(Boolean) as string[];

  return (
    <>
      <Header user={user} />
      <main id="main" className="shell with-docked-bar py-10 md:py-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5 lg:col-span-4">
            <div className="mx-auto w-full max-w-[340px] md:mx-0">
              <div className="aspect-[9/16] w-full overflow-hidden border border-ink bg-paper-deep shadow-[8px_8px_0_var(--color-rule)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${storyPath}?v=${cardVersion}`}
                  alt={`${link.display_name} — story card`}
                  className="h-full w-full"
                  fetchPriority="high"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={storyPath}
                  download={`tapmart-${link.slug}-story.png`}
                  className="btn btn-signal flex-1 !py-3 text-center"
                >
                  Save story card
                </a>
                <ShareButton path={`/l/${link.slug}`} />
              </div>
              <p className="mt-2 font-mono text-[0.6875rem] text-ink-faint">
                1080 × 1920 — sized for an Instagram or TikTok story.
              </p>
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8">
            <p translate="no" className="font-mono text-xs tracking-[0.1em] text-ink-faint uppercase">
              {link.domain}
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[0.92] font-800 tracking-[-0.045em] break-words md:text-6xl">
              {link.display_name}
            </h1>
            {link.short_description && (
              <p className="mt-4 max-w-xl font-display text-lg text-ink-soft md:text-xl">
                {link.short_description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {openPlacement ? (
                <OpenButton placementId={openPlacement} className="btn btn-signal !px-7 !py-3.5" />
              ) : (
                <span className="eyebrow">Not live right now</span>
              )}
            </div>

            <dl className="rule mt-10 grid grid-cols-2 gap-6 pt-6 sm:grid-cols-3">
              <div>
                <dt className="eyebrow flex items-center gap-1.5">
                  <OpensIcon /> Opens
                </dt>
                <dd className="tnum mt-1 font-mono text-xl font-600">{formatCount(link.total_opens)}</dd>
              </div>
              {link.board_rank != null && (
                <div>
                  <dt className="eyebrow">Rank</dt>
                  <dd className="tnum mt-1 font-mono text-xl font-600">#{link.board_rank}</dd>
                </div>
              )}
              {link.board_score_cents != null && (
                <div>
                  <dt className="eyebrow">Today</dt>
                  <dd className="tnum mt-1 font-mono text-xl font-600">
                    {formatCredit(link.board_score_cents)}
                  </dd>
                </div>
              )}
            </dl>

            {participation.length > 0 && (
              <p className="mt-6 font-mono text-xs text-ink-faint">
                Appearing on {participation.join(" · ")}
              </p>
            )}

            <p className="mt-10">
              <Link href="/" className="eyebrow underline underline-offset-4 hover:text-ink">
                Back to the live screen
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <Bar items={bar} />
    </>
  );
}
