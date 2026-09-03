import { Header } from "@/components/Header";
import { Bar } from "@/components/Bar";
import { LiveMain } from "@/components/live/LiveMain";
import { LiveRefresh } from "@/components/live/LiveRefresh";
import { LockViewport } from "@/components/live/LockViewport";
import { SpotPanel } from "@/components/live/SpotPanel";
import { TopRail } from "@/components/live/TopRail";
import { BoardWindow } from "@/components/live/BoardWindow";
import { SurpriseMe } from "@/components/live/SurpriseMe";
import { getCurrentUser } from "@/lib/auth";
import {
  getBar, getBoard, getBoardCount, getCurrentSpot, getNextSpot, getVisitorStats,
} from "@/lib/data";

// The homepage is live state; it is never served from a static cache.
export const dynamic = "force-dynamic";

/**
 * The homepage is one live discovery screen at every size: header as status
 * row, The Spot and Top 3 together, the Board cycling through rank windows,
 * and the Bar along the bottom. Desktop and phone both fit the viewport with
 * no tabs and no page scroll; phones simply run a more compact composition.
 */
export default async function HomePage() {
  const [user, spot, nextSpot, board, boardCount, bar, audience] = await Promise.all([
    getCurrentUser(),
    getCurrentSpot(),
    getNextSpot(),
    getBoard(103),
    getBoardCount(),
    getBar(),
    getVisitorStats(),
  ]);

  const topThree = board.slice(0, 3);
  const rest = board.slice(3);

  return (
    <div className="live-screen">
      <Header
        user={user}
        stats={{
          visitors: audience.allTime,
          liveNow: audience.liveNow,
          // Time stays off the landing page; the reset clock lives on the
          // board and link pages instead.
          roundEndsAt: null,
        }}
      />
      <main id="main" className="flex min-h-0 flex-col">
        <LiveMain
          spot={<SpotPanel current={spot} next={nextSpot} />}
          top={<TopRail rows={topThree} />}
          board={
            <>
              <BoardWindow
                rows={rest}
                startRank={4}
                totalCount={boardCount}
                pageSize={4}
                compact
                className="lg:hidden"
              />
              <BoardWindow
                rows={rest}
                startRank={4}
                totalCount={boardCount}
                className="hidden lg:flex"
              />
            </>
          }
        />
      </main>
      <Bar items={bar} docked={false} surprise={<SurpriseMe candidates={board} />} />
      <LiveRefresh seconds={60} />
      <LockViewport />
    </div>
  );
}
