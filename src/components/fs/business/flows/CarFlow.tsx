"use client";

import { useState, useTransition } from "react";
import { createEarnCampaign } from "@/app/(v2)/business/create/actions";
import { markIdeaUsed } from "@/app/(v2)/business/create/ideas-actions";
import type { Prefill, WizardBusiness } from "@/app/(v2)/business/create/prefill";
import { ZONE_LABELS } from "@/app/(v2)/cars/zones";
import { FsUploader } from "@/components/fs/work/Uploader";
import { formatMoney } from "@/components/fs/parts";
import { Facts } from "@/components/fs/work/DetailParts";
import { FlowShell, Field, ChoiceRows, CheckRows, DollarInput, Commitment, type FlowStep } from "@/components/fs/business/Flow";
import { PlacementDiagram } from "@/components/fs/business/PlacementDiagram";
import { FundingPlane, fundingState, type FundingFacts } from "./FundingPlane";
import { CarSource, todayPlus, dayWord, Presets } from "./shared";

/**
 * Car advertising: placement first, on a diagram, then duration, monthly
 * pay, which cars, where, how many, the artwork, funding, publish. Artwork
 * is shown as artwork; nothing is ever drawn onto a real car.
 */
const PLACEMENTS = ["rear_window", "driver_door", "passenger_door", "full_side", "partial_wrap", "full_wrap"] as const;
type Placement = (typeof PLACEMENTS)[number];
const COLORS = ["Black", "White", "Silver", "Gray"] as const;
const BODIES = ["Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Van"] as const;

export function CarFlow({ business, defaultCity, prefill, funding }: { business: WizardBusiness; defaultCity: string; prefill: Prefill | null; funding: FundingFacts }) {
  const [index, setIndex] = useState(0);
  const [placements, setPlacements] = useState<Placement[]>(["rear_window"]);
  const [durationDays, setDurationDays] = useState<"30" | "60" | "90">("30");
  const [startsOn, setStartsOn] = useState("");
  const [pay, setPay] = useState(String(prefill?.payDollars ?? 250));
  const [colors, setColors] = useState<string[]>([]);
  const [bodies, setBodies] = useState<string[]>([]);
  const [city, setCity] = useState(defaultCity);
  const [slots, setSlots] = useState(String(prefill?.slots ?? 3));
  const [artworkUrl, setArtworkUrl] = useState("");
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [brief, setBrief] = useState(prefill?.brief ?? "");
  const [briefEdited, setBriefEdited] = useState(Boolean(prefill?.brief));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const payCents = Math.round(Number(pay || 0) * 100);
  const nSlots = Math.round(Number(slots || 0));
  const months = Math.max(1, Math.round(Number(durationDays) / 30));
  const fs = fundingState(payCents, nSlots, funding);
  const zoneWords = placements.map((z) => ZONE_LABELS[z]).join(", ");
  const autoBrief = `Drive with our ad on your ${placements.map((z) => ZONE_LABELS[z].toLowerCase()).join(" or ")} for ${durationDays} days around ${city || "town"}. We send the artwork; you send a photo each week.`;
  const finalBrief = briefEdited ? brief : autoBrief;
  const finalTitle = title.trim() || `Drivers wanted in ${city}`;

  const stepDefs: FlowStep[] = [
    { key: "placement", label: "Where on the car", summary: placements.length ? zoneWords : null },
    { key: "duration", label: "How long", summary: `${durationDays} days${startsOn ? ` from ${dayWord(startsOn)}` : ""}` },
    { key: "pay", label: "Pay per car, per month", summary: payCents >= 2500 ? formatMoney(payCents) : null },
    { key: "cars", label: "Which cars", summary: colors.length || bodies.length ? [colors.join(", "), bodies.join(", ")].filter(Boolean).join(" · ") : "Any car" },
    { key: "where", label: "Where they drive", summary: city || null },
    { key: "spots", label: "How many cars", summary: nSlots >= 1 ? `${nSlots} car${nSlots === 1 ? "" : "s"}` : null },
    { key: "artwork", label: "The artwork", summary: artworkUrl ? "Artwork added" : "Later, after drivers are accepted" },
    { key: "funding", label: "Publishing credit", summary: fs.canPublish ? "Enough for one payment" : "Not enough for one payment" },
    { key: "publish", label: "Ready to publish", summary: null },
  ];
  const valid = [placements.length > 0, true, payCents >= 2500 && payCents <= 500_000, true, city.trim().length > 0, nSlots >= 1 && nSlots <= 500, true, true, finalTitle.length >= 4 && finalBrief.trim().length >= 20];

  const submit = (publish: boolean) => start(async () => {
    setError(null);
    if (prefill?.id) await markIdeaUsed(prefill.id, business.id);
    const r = await createEarnCampaign({
      businessId: business.id, title: finalTitle, publish, kind: "car_ads",
      city: city.trim(), colors, bodyTypes: bodies, placements, durationDays: Number(durationDays), monthlyDollars: Number(pay), slots: nSlots,
      artworkUrl: artworkUrl || undefined, brief: finalBrief.trim(), startsOn: startsOn || undefined,
    });
    if (r && !r.ok) setError(r.error);
  });

  const last = index === stepDefs.length - 1;
  return (
    <FlowShell
      title="Car advertising" kind={business.name} back={{ href: "/business/create", label: "Create" }}
      steps={stepDefs} index={index} onJump={setIndex} error={error} pending={pending} review={last}
      source={<CarSource zones={placements} artworkUrl={artworkUrl} />}
      commitment={payCents >= 2500 ? <Commitment cents={payCents} basis="per car, per month" total={nSlots >= 1 ? fs.total : undefined} totalLabel={nSlots >= 1 ? `per month for all ${nSlots} car${nSlots === 1 ? "" : "s"}` : undefined} /> : undefined}
      canContinue={valid[index]} continueLabel={last ? "Publish campaign" : index === stepDefs.length - 2 && !fs.canPublish ? "Continue without publishing" : "Continue"}
      onContinue={() => { if (last) submit(true); else setIndex(index + 1); }} onBack={() => setIndex(index - 1)}
    >
      {index === 0 && (
        <>
          <p className="fs-t-body">Pick every placement a driver may offer. The diagram shows where; it never shows an ad on a real car.</p>
          <CheckRows values={placements} onChange={(v) => setPlacements(v as Placement[])} noun="placement" options={PLACEMENTS.map((z) => ({ value: z, label: ZONE_LABELS[z], media: (on: boolean) => <PlacementDiagram zones={[z]} width={96} muted={!on} label={`${ZONE_LABELS[z]} on the diagram`} /> }))} />
        </>
      )}
      {index === 1 && (
        <>
          <ChoiceRows name="duration" value={durationDays} onChange={setDurationDays} options={[
            { value: "30", label: "30 days", detail: "About 1 monthly payment per car" },
            { value: "60", label: "60 days", detail: "About 2 monthly payments per car" },
            { value: "90", label: "90 days", detail: "About 3 monthly payments per car" },
          ]} />
          <Field id="fs-starts" label="Start date, if you have one" hint="Leave it empty to start when a car is installed."><input id="fs-starts" type="date" className="fs-input" value={startsOn} min={todayPlus(0)} onChange={(e) => setStartsOn(e.target.value)} style={{ maxWidth: 220 }} /></Field>
        </>
      )}
      {index === 2 && (
        <>
          <p className="fs-t-body">Paid from your campaign credit when you confirm an installation, then each month you confirm. Not before.</p>
          <Presets values={[150, 250, 350]} current={pay} onPick={setPay} money />
          <Field id="fs-pay" label="Or another amount"><DollarInput id="fs-pay" value={pay} onChange={setPay} min={25} max={5000} /></Field>
        </>
      )}
      {index === 3 && (
        <>
          <p className="fs-t-body">Leave both empty to accept any car.</p>
          <p className="fs-t-label" style={{ marginTop: 12 }}>Colours</p>
          <CheckRows values={colors} onChange={setColors} options={COLORS.map((c) => ({ value: c, label: c }))} />
          <p className="fs-t-label" style={{ marginTop: 16 }}>Body types</p>
          <CheckRows values={bodies} onChange={setBodies} options={BODIES.map((b) => ({ value: b, label: b }))} />
        </>
      )}
      {index === 4 && (
        <Field id="fs-city" label="City" hint="Drivers in this city are told about it."><input id="fs-city" className="fs-input" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} style={{ maxWidth: 320 }} /></Field>
      )}
      {index === 5 && (
        <>
          <p className="fs-t-body">How many cars you will accept at most.</p>
          <Presets values={[1, 3, 5, 10]} current={slots} onPick={setSlots} />
          <Field id="fs-slots" label="Or another number" hint="1 to 500"><input id="fs-slots" className="fs-input fs-tnum" inputMode="numeric" value={slots} onChange={(e) => setSlots(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} style={{ maxWidth: 160 }} /></Field>
        </>
      )}
      {index === 6 && (
        <>
          <p className="fs-t-body">The file that gets printed and installed. You can add it after drivers are accepted; a car cannot be installed without it.</p>
          <div style={{ marginTop: 12 }}>
            <FsUploader folder="campaigns" accept="image/*" label={artworkUrl ? "Replace the artwork" : "Upload the artwork"} onUploaded={(u) => setArtworkUrl(u[0])} id="fs-art-upload" />
          </div>
          {artworkUrl && <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" style={{ marginTop: 8, paddingLeft: 0 }} onClick={() => setArtworkUrl("")}>Remove it for now</button>}
        </>
      )}
      {index === 7 && <FundingPlane payCents={payCents} spots={nSlots} unit="car" monthly funding={funding} extra={<p className="fs-t-meta" style={{ marginTop: 8 }}>Over {durationDays} days that is about {months} payment{months === 1 ? "" : "s"} per car.</p>} />}
      {index === 8 && (
        <>
          <Field id="fs-title" label="Name the campaign" hint="4 to 120 characters. Drivers see it."><input id="fs-title" className="fs-input" value={finalTitle} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field id="fs-brief" label="What drivers are told" hint={briefEdited ? undefined : "Written for you from your choices. Edit anything."}>
            <textarea id="fs-brief" className="fs-textarea" rows={4} maxLength={4000} value={finalBrief} onChange={(e) => { setBrief(e.target.value); setBriefEdited(true); }} />
          </Field>
          <div style={{ marginTop: 16 }}>
            <Facts rows={[["Placements", zoneWords], ["Duration", `${durationDays} days${startsOn ? `, from ${dayWord(startsOn)}` : ""}`], ["Cars", String(nSlots)], ["Cars preferred", colors.length || bodies.length ? [colors.join(", "), bodies.join(", ")].filter(Boolean).join(" · ") : "Any"], ["Artwork", artworkUrl ? "Added" : "Not yet"], ["City", city]]} />
          </div>
          <p className="fs-t-body" style={{ marginTop: 16 }}>Publishing needs credit for one {formatMoney(payCents)} payment. Nothing is held when you publish. Confirming an installation pays the first month. {fs.canPublish ? `Publishing tells drivers in ${city}.` : "Your credit is not enough for one payment yet. Save it as a draft and publish once credit is added."}</p>
          <button type="button" className="fs-btn fs-btn-secondary" style={{ marginTop: 12 }} disabled={pending} onClick={() => submit(false)}>Save as draft</button>
        </>
      )}
    </FlowShell>
  );
}
