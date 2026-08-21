import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Bar } from "@/components/Bar";
import { OpenButton } from "@/components/OpenButton";
import { ShareButton } from "@/components/ShareButton";
import { getBar, getLinkBySlug } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { formatCredit, formatCount } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  if (!link) return { title: "Not found" };
  return {
    title: link.display_name,
    description: link.short_description ?? undefined,
    openGraph: { title: link.display_name, description: link.short_description ?? undefined },
  };
}

export default async function LinkProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [user, link, bar] = await Promise.all([getCurrentUser(), getLinkBySlug(slug), getBar()]);
  if (!link) notFound();

  const openPlacement = link.board_placement_id ?? link.spot_placement_id ?? link.bar_placement_id;

  const participation = [
    link.board_placement_id && `The Board${link.board_rank ? ` · #${link.board_rank}` : ""}`,
    link.spot_placement_id && "The Spot",
    link.bar_placement_id && "The Bar",
  ].filter(Boolean) as string[];

  return (
    <>
      <Header user={user} />
      <main id="main" className="shell py-10 md:py-16">
        <div className="grid gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <div className="aspect-square w-full max-w-xs overflow-hidden border border-ink bg-paper-deep">
              {link.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={link.image_url} alt="" width={400} height={400} fetchPriority="high" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-display text-6xl font-800 text-rule-strong">
                    {link.display_name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-8">
            <p className="font-mono text-xs tracking-[0.1em] text-ink-faint uppercase">{link.domain}</p>
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
              <ShareButton path={`/l/${link.slug}`} />
            </div>

            <dl className="rule mt-10 grid grid-cols-2 gap-6 pt-6 sm:grid-cols-3">
              <div>
                <dt className="eyebrow">Opens</dt>
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
              <Link href="/board" className="eyebrow underline underline-offset-4 hover:text-ink">
                Back to the board
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
