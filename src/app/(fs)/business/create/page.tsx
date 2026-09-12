import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { PlacementDiagram } from "@/components/fs/business/PlacementDiagram";

export const metadata = { title: "Create" };
export const dynamic = "force-dynamic";

/**
 * Create in Frame Shift: three campaign kinds and nothing else, each drawn
 * from what drives it. Recreate is driven by a reference video, Story by
 * the supplied 9:16 creative, Car by the vehicle and its placements. The
 * whole composition is the link; the setup itself happens one decision at
 * a time inside the chosen flow.
 */
export default async function CreatePage({ searchParams }: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create"), searchParams]);
  const business = ctx.activeBusiness;
  const rec = params.rec && /^[0-9a-f-]{36}$/i.test(params.rec)
    ? await sqlOne<{ kind: string }>(`select prefill->>'kind' as kind from marketing_recommendations where id = $1 and business_id = $2 and status = 'new'`, [params.rec, business.id])
    : null;
  const q = rec ? `?rec=${params.rec}` : "";

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-purpose-row">
        <h1 className="fs-t-page">Create a campaign</h1>
      </div>
      <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>Three kinds. Each is a short setup, one decision at a time.</p>

      <ul className="fs-create-choices" aria-label="Campaign kinds">
        <li>
          <Link href={`/business/create/recreate${q}`} className="fs-create-choice" aria-label="Start a Recreate a Reel campaign">
            <span className="fs-create-visual is-recreate">
              <span className="fs-media fs-create-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/uploads/seed/tapmart-recreate.jpg" alt="" loading="eager" />
              </span>
              <span className="fs-create-arrow" aria-hidden><ArrowRight size={20} /></span>
              <span className="fs-create-echo" aria-hidden />
            </span>
            <span className="fs-create-words">
              <span className="fs-t-label">Recreate{rec?.kind === "recreate_reel" && <span className="fs-status is-confirmed" style={{ marginLeft: 8 }}>Recommended</span>}</span>
              <span className="fs-create-title">Recreate a Reel</span>
              <span className="fs-t-body">Creators film their own version of your reference video.</span>
              <span className="fs-t-meta">Pay per approved video</span>
            </span>
          </Link>
        </li>
        <li>
          <Link href={`/business/create/story${q}`} className="fs-create-choice" aria-label="Start an Instagram Story ads campaign">
            <span className="fs-create-visual is-story">
              <span className="fs-create-phone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/uploads/seed/tapmart-story.jpg" alt="" loading="eager" />
              </span>
            </span>
            <span className="fs-create-words">
              <span className="fs-t-label">Story{rec?.kind === "instagram_story" && <span className="fs-status is-confirmed" style={{ marginLeft: 8 }}>Recommended</span>}</span>
              <span className="fs-create-title">Instagram Story ads</span>
              <span className="fs-t-body">Creators post your finished Story creative and keep it live.</span>
              <span className="fs-t-meta">Pay per Story posted</span>
            </span>
          </Link>
        </li>
        <li>
          <Link href={`/business/create/car${q}`} className="fs-create-choice" aria-label="Start a Car advertising campaign">
            <span className="fs-create-visual is-car">
              <span className="fs-media fs-create-car">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/uploads/seed/tapmart-car.jpg" alt="" loading="eager" />
              </span>
              <span className="fs-create-diagram"><PlacementDiagram zones={["driver_rear_door"]} width={132} label="Placement diagram: rear door highlighted" /></span>
            </span>
            <span className="fs-create-words">
              <span className="fs-t-label">Car{rec?.kind === "car_ads" && <span className="fs-status is-confirmed" style={{ marginLeft: 8 }}>Recommended</span>}</span>
              <span className="fs-create-title">Car advertising</span>
              <span className="fs-t-body">Your ad on local drivers&apos; cars, in the placement you choose.</span>
              <span className="fs-t-meta">Pay per car, per month</span>
            </span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
