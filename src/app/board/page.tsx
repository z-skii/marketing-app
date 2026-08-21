import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Board } from "@/components/Board";
import { Bar } from "@/components/Bar";
import { RoundCountdown } from "@/components/RoundCountdown";
import { getBar, getBoard, getBoardCount, getCurrentRound } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { formatCount } from "@/lib/money";

export const metadata = { title: "The Board" };
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const [user, board, bar, round, count] = await Promise.all([
    getCurrentUser(), getBoard(200), getBar(), getCurrentRound(), getBoardCount(),
  ]);

  return (
    <>
      <Header user={user} />
      <main id="main">
        <section className="shell pt-10 pb-6 md:pt-14 md:pb-8">
          <h1 className="font-display text-4xl leading-[0.92] font-800 tracking-[-0.045em] md:text-6xl">
            The Board
          </h1>
          <dl className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-2">
            <div className="flex items-baseline gap-2">
              <dt className="eyebrow">Live</dt>
              <dd className="tnum font-mono text-sm font-600">{formatCount(count)}</dd>
            </div>
            {round && (
              <div className="flex items-baseline gap-2">
                <dt className="eyebrow">Resets in</dt>
                <dd><RoundCountdown endsAt={round.ends_at} /></dd>
              </div>
            )}
          </dl>
          <p className="mt-5 max-w-xl text-sm text-ink-soft">
            Ranked by credit added to the board today. Rank holds even as credit is spent —
            it only moves when someone adds more.
          </p>
        </section>
        <Board rows={board} startRank={1} heading="Rank" />
      </main>
      <Footer />
      <Bar items={bar} />
    </>
  );
}
