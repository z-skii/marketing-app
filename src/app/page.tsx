import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Spot } from "@/components/Spot";
import { TopThree } from "@/components/TopThree";
import { Board } from "@/components/Board";
import { Bar } from "@/components/Bar";
import { getCurrentUser } from "@/lib/auth";
import {
  getBar, getBoard, getCurrentRound, getCurrentSpot, getLiveStats, getNextSpot,
} from "@/lib/data";

// The homepage is live state; it is never served from a static cache.
export const dynamic = "force-dynamic";

const BOARD_PREVIEW = 20;

export default async function HomePage() {
  const [user, spot, nextSpot, board, bar, round, stats] = await Promise.all([
    getCurrentUser(),
    getCurrentSpot(),
    getNextSpot(),
    getBoard(BOARD_PREVIEW + 3),
    getBar(),
    getCurrentRound(),
    getLiveStats(),
  ]);

  const topThree = board.slice(0, 3);
  const rest = board.slice(3);

  return (
    <>
      <Header user={user} />
      <main id="main">
        <Hero
          liveLinks={stats.liveLinks}
          opensToday={stats.opensToday}
          roundEndsAt={round?.ends_at ?? null}
        />
        <Spot spot={spot ?? nextSpot} upcoming={!spot && !!nextSpot} />
        <TopThree rows={topThree} />
        <Board rows={rest} startRank={4} showViewAll />
      </main>
      <Footer />
      <Bar items={bar} />
    </>
  );
}
