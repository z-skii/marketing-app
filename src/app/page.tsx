import { Header } from "@/components/Header";
import { Bar } from "@/components/Bar";
import { LiveMain } from "@/components/live/LiveMain";
import { LiveRefresh } from "@/components/live/LiveRefresh";
import { SpotPanel } from "@/components/live/SpotPanel";
import { TopRail } from "@/components/live/TopRail";
import { BoardWindow } from "@/components/live/BoardWindow";
import { SurpriseMe } from "@/components/live/SurpriseMe";
import { getCurrentUser } from "@/lib/auth";
import {
  getBar, getBoard, getBoardCount, getCurrentRound, getCurrentSpot, getLiveStats, getNextSpot,
} from "@/lib/data";

// The homepage is live state; it is never served from a static cache.
export const dynamic = "force-dynamic";

/**
 * The homepage is one live discovery screen: header as status row, The Spot
 * and Top 3 side by side, the Board cycling through rank windows beneath them,
 * and the Bar running along the bottom. On desktop the whole thing fits the
 * viewport; small screens switch surfaces with tabs instead of scrolling.
 */
export default async function HomePage() {
  const [user, spot, nextSpot, board, boardCount, bar, round, stats] = await Promise.all([
    getCurrentUser(),
    getCurrentSpot(),
    getNextSpot(),
    getBoard(103),
    getBoardCount(),
    getBar(),
    getCurrentRound(),
    getLiveStats(),
  ]);

  const topThree = board.slice(0, 3);
  const rest = board.slice(3);

  return (
    <div className="live-screen">
      <Header
        user={user}
        stats={{
          liveLinks: stats.liveLinks,
          opensToday: stats.opensToday,
          roundEndsAt: round?.ends_at ?? null,
        }}
      />
      <main id="main" className="flex min-h-0 flex-col">
        <LiveMain
          spot={<SpotPanel current={spot} next={nextSpot} />}
          top={<TopRail rows={topThree} />}
          board={<BoardWindow rows={rest} startRank={4} totalCount={boardCount} />}
        />
      </main>
      <Bar items={bar} docked={false} surprise={<SurpriseMe candidates={board} />} />
      <LiveRefresh seconds={60} />
    </div>
  );
}
