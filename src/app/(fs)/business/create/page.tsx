import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { Img } from "@/components/fs/Img";
import { PlacementDiagram } from "@/components/fs/business/PlacementDiagram";

export const metadata = { title: "Create" };
export const dynamic = "force-dynamic";

/**
 * Create in Frame Shift: three campaign kinds and nothing else, each as a
 * source-to-commitment joint. The source is what drives the kind (a 9:16
 * reference for Recreate, the supplied 9:16 creative for Story, an
 * unmodified car and a placement diagram for Car); the commitment starts
 * one shift lower and names the setup that begins. The whole joint is the
 * link; the setup itself happens one decision at a time inside the flow.
 */
export default async function CreatePage({ searchParams }: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create"), searchParams]);
  const business = ctx.activeBusiness;
  const rec = params.rec && /^[0-9a-f-]{36}$/i.test(params.rec)
    ? await sqlOne<{ kind: string }>(`select prefill->>'kind' as kind from marketing_recommendations where id = $1 and business_id = $2 and status = 'new'`, [params.rec, business.id])
    : null;
  const q = rec ? `?rec=${params.rec}` : "";
  const kinds = [
    { key: "recreate_reel", href: `/business/create/recreate${q}`, aria: "Start a Recreate a Reel campaign", label: "Recreate", title: "Recreate a Reel", body: "Creators film their own version of your reference video.", basis: "Pay per approved video", action: "Set up a Recreate campaign",
      media: <span className="fs-create-source is-portrait"><Img src="/uploads/seed/tapmart-recreate.jpg" alt="" loading="eager" /><span className="fs-t-meta">A reference video, 9:16</span></span> },
    { key: "instagram_story", href: `/business/create/story${q}`, aria: "Start an Instagram Story ads campaign", label: "Story", title: "Instagram Story ads", body: "Creators post your finished Story creative and keep it live.", basis: "Pay per approved Story", action: "Set up a Story campaign",
      media: <span className="fs-create-source is-portrait"><Img src="/uploads/seed/tapmart-story.jpg" alt="" loading="eager" /><span className="fs-t-meta">Your creative, 9:16</span></span> },
    { key: "car_ads", href: `/business/create/car${q}`, aria: "Start a Car advertising campaign", label: "Car", title: "Car advertising", body: "Your ad on local drivers' cars, in the placement you choose.", basis: "Pay per car, per month", action: "Set up a Car campaign",
      media: <span className="fs-create-source is-car"><Img src="/uploads/seed/demo-bmw.webp" alt="" loading="eager" /><span className="fs-create-diagram"><PlacementDiagram zones={["driver_rear_door"]} width={132} label="Placement diagram: rear door highlighted" /></span><span className="fs-t-meta">A real car, and the placement on a diagram</span></span> },
  ] as const;

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-purpose-row">
        <h1 className="fs-t-page">Create a campaign</h1>
      </div>
      <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>Three kinds. Each is a short setup, one decision at a time.</p>

      <ul className="fs-create-choices" aria-label="Campaign kinds">
        {kinds.map((k) => (
          <li key={k.key}>
            <Link href={k.href} className="fs-create-choice" aria-label={k.aria}>
              {k.media}
              <span className="fs-create-commit">
                <span className="fs-t-label">{k.label}{rec?.kind === k.key && <span className="fs-status is-confirmed" style={{ marginLeft: 8 }}>Recommended</span>}</span>
                <span className="fs-create-title">{k.title}</span>
                <span className="fs-t-body">{k.body}</span>
                <span className="fs-t-meta">{k.basis}</span>
                <span className="fs-create-action">{k.action} <ArrowRight size={18} aria-hidden /></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
