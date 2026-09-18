/**
 * Example data for the public homepage. Every person, business, campaign,
 * amount and date here is an illustrative example that shows how TapMart
 * works; none of it is a real account, a real campaign or real earnings,
 * and the page says so (Shell.tsx, Sources). Nothing reads or writes the
 * database. The media lives under /marketing/v3 (illustrative marketing
 * media prepared for the site). Live product numbers (fee, payout
 * minimum, plan prices) never come from here: src/app/page.tsx reads them
 * from production settings.
 */
export const ASSET = (id: string, ext = "jpg") => `/marketing/v3/${id}.${ext}`;

/** Money with an explicit currency prefix: the symbol alone is ambiguous. Discovery drops needless .00; ledgers keep two decimals. */
export function money(cents: number, opts: { cents?: boolean } = {}): string {
  const keep = opts.cents || cents % 100 !== 0;
  const n = new Intl.NumberFormat("en-US", { minimumFractionDigits: keep ? 2 : 0, maximumFractionDigits: keep ? 2 : 0 }).format(cents / 100);
  return `US$${n}`;
}

export type Kind = "recreate" | "story" | "car";

export type Opportunity = {
  id: string; kind: Kind; business: string; title: string;
  netCents: number; grossCents: number; feeCents: number; basis: string;
  media: string | null; mediaRatio: string; mediaAlt: string; mediaFit?: "cover" | "contain"; mediaPosition?: string; mediaCaption?: string;
  facts: string[];
  applyBy: string; submitBy?: string;
  requirements: string[]; usage: string; extra?: { label: string; value: string }[];
  eligibility?: { label: string; state: "ok" | "bad"; note?: string }[];
  blockers?: string[];
};

/** The three example campaigns the earning story is told with. */
export const homeOpportunities: Opportunity[] = [
  {
    id: "example-recreate-loopday-pour", kind: "recreate", business: "Loopday Coffee", title: "Recreate this Reel",
    netCents: 7500, grossCents: 7500, feeCents: 0, basis: "per approved version",
    media: ASSET("reference-loopday-01"), mediaRatio: "4 / 5", mediaAlt: "Reference still: milk poured into a green cup at a coffee counter", mediaPosition: "50% 58%",
    facts: ["8 spots", "Closes Sep 20"],
    applyBy: "Sep 20, 2026, 6:00 PM CDT", submitBy: "Sep 23, 2026, 6:00 PM CDT",
    requirements: ["15 to 30 seconds", "9:16 MP4", "Show the pour, then the finished drink.", "Use original audio.", "No Instagram post required."],
    usage: "Loopday Coffee may use approved work in US paid social ads for 90 days.",
  },
  {
    id: "example-story-loopday-24h", kind: "story", business: "Loopday Coffee", title: "Post for 24 hours",
    netCents: 2500, grossCents: 2500, feeCents: 0, basis: "after 24h + approval",
    media: ASSET("story-loopday-01"), mediaRatio: "9 / 16", mediaAlt: "Finished Story creative for Loopday Coffee",
    facts: ["500+ followers"],
    applyBy: "Sep 22, 2026, 6:00 PM CDT",
    requirements: ["Keep the Story live for 24 hours.", "Tag the business.", "Include #ad.", "Submit a screenshot after 24 hours."],
    usage: "Use this creative for the booked Story only.",
    extra: [{ label: "Post between", value: "Sep 24, 8:00 to 10:00 AM CDT" }, { label: "Proof by", value: "Sep 25, 2026, 12:00 PM CDT" }],
    eligibility: [{ label: "Instagram connected", state: "ok" }, { label: "API verified", state: "ok" }, { label: "Eligible", state: "ok", note: "1,240 followers, 500 needed" }],
  },
  {
    id: "example-car-spurroom-rear-doors", kind: "car", business: "Spurroom Bikes", title: "Drive with this campaign",
    netCents: 30000, grossCents: 30000, feeCents: 0, basis: "/month",
    media: ASSET("vehicle-eli-01"), mediaRatio: "3 / 2", mediaAlt: "Example eligible vehicle: a silver sedan parked outside a brick workshop", mediaCaption: "Vehicle example",
    facts: ["Austin", "3 months", "Vehicle required"],
    applyBy: "Sep 26, 2026, 6:00 PM CDT",
    requirements: ["Rear doors", "Installation arranged after acceptance.", "Installation and removal cost you US$0.", "Upload both rear-door photos monthly.", "Monthly payment requires approved proof."],
    usage: "",
    extra: [{ label: "Campaign dates", value: "Oct 1 to Dec 31, 2026" }],
    eligibility: [{ label: "Your listed vehicle is eligible.", state: "ok" }],
    blockers: ["Cancellation terms unavailable."],
  },
];

/** The example creator whose work the earning story follows. */
export const profile = {
  name: "Maya Chen", username: "@maya.example", city: "Austin",
  portrait: ASSET("portrait-maya-01"), portraitAlt: "Maya Chen, example creator",
  earnedCents: 42000, completed: 3, reviews: 0,
  instagram: null as null | { handle: string; followers: number | null },
  payoutReady: true,
  work: [
    { id: "latte-take", title: "Latte take", kind: "recreate" as Kind, business: "Loopday Coffee", media: ASSET("maya-loopday-submission-01"), ratio: "4 / 5", alt: "Latte submission sample: hands placing an iced latte on a cafe counter", state: "Approved", mediaNote: "Submission still", facts: [{ label: "Approved on", value: "Aug 9, 2026" }], grossCents: 8000, feeCents: 500, netCents: 7500, creditedOn: "Aug 9, 2026" },
    { id: "afternoon-story", title: "Afternoon Story", kind: "story" as Kind, business: "Loopday Coffee", media: ASSET("story-loopday-01"), ratio: "9 / 16", alt: "Loopday Story creative", state: "Proof approved", mediaNote: "Posted for 24 hours", facts: [{ label: "Posted", value: "Aug 12, 2026, 12:00 PM CDT" }, { label: "Ended", value: "Aug 13, 2026, 12:00 PM CDT" }, { label: "Confirmed manually", value: "Aug 14, 2026" }], grossCents: 5000, feeCents: 500, netCents: 4500, creditedOn: "Aug 14, 2026" },
    { id: "rear-door-placement", title: "Rear-door placement", kind: "car" as Kind, business: "Spurroom Bikes", media: ASSET("maya-spurroom-placement-01"), ratio: "3 / 2", alt: "Spurroom rear-door placement sample", state: "Proof approved", mediaNote: "Placement proof", facts: [{ label: "Period", value: "Aug 1 to 31, 2026" }, { label: "Rear doors", value: "Proof approved Sep 2, 2026" }], grossCents: 33000, feeCents: 3000, netCents: 30000, creditedOn: "Sep 2, 2026" },
  ],
  vehicle: { title: "Maya’s car", photo: ASSET("vehicle-maya-01"), alt: "Maya’s listed vehicle", listed: true, rate: null as number | null },
};

export type Person = {
  id: string; name: string; city: string; portrait: string; portraitAlt: string;
  instagram: { handle: string; followers: number } | null;
  completed: number; rating: { value: number; review: { by: string; text: string; date: string } } | null; verified: boolean;
  project: { title: string; business: string; approved: string; stills: { src: string; alt: string }[] };
};

/** The example people a business finds. */
export const businessPeople: Person[] = [
  { id: "maya", name: "Maya Chen", city: "Austin", portrait: ASSET("portrait-maya-01"), portraitAlt: "Maya Chen, example creator", instagram: { handle: "@maya.example", followers: 2400 }, completed: 4, verified: true,
    rating: { value: 5, review: { by: "Spurroom Bikes", text: "Clear framing and careful attention to the brief.", date: "Sep 12, 2026" } },
    project: { title: "Counter pour", business: "Loopday Coffee", approved: "Sep 10, 2026", stills: [{ src: ASSET("maya-work-pour-01"), alt: "Recreate still: hands pouring milk into a coffee cup" }, { src: ASSET("maya-work-cup-02"), alt: "Recreate still: hands presenting the finished cup" }] } },
  { id: "nora", name: "Nora Vale", city: "Austin", portrait: ASSET("portrait-nora-01"), portraitAlt: "Nora Vale, example creator", instagram: null, completed: 1, verified: false, rating: null,
    project: { title: "Chain care", business: "Spurroom Bikes", approved: "Sep 9, 2026", stills: [{ src: ASSET("nora-work-chain-01"), alt: "Recreate still: hands cleaning a bicycle chain" }, { src: ASSET("nora-work-wheel-02"), alt: "Recreate still: checking the rear wheel and chain" }] } },
  { id: "eli", name: "Eli Moss", city: "Round Rock", portrait: ASSET("portrait-eli-01"), portraitAlt: "Eli Moss, example creator", instagram: { handle: "@eli.example", followers: 1800 }, completed: 3, verified: false, rating: null,
    project: { title: "Desk ritual", business: "Loopday Coffee", approved: "Sep 8, 2026", stills: [{ src: ASSET("eli-work-bag-01"), alt: "Recreate still: hands opening a paper coffee bag" }, { src: ASSET("eli-work-cup-02"), alt: "Recreate still: placing the prepared cup beside the bag" }] } },
];

export const businessCar = { id: "example-car-eli-rear-doors", title: "Eli’s car", city: "Austin", photo: ASSET("vehicle-eli-01"), alt: "Eli’s car: a silver sedan parked outside a brick workshop", zone: "Rear doors", askCents: 24000 };

// ------------------------------------------------------------- Loyalty
// The Loyalty sequence shows a planned feature (coming soon). The card is an
// example design; no pass is issued to any Wallet.

export type ProgramKind = "visits" | "points";

export type CardDesign = {
  businessName: string; programName: string; rewardTitle: string;
  bg: string; fg: string; label: string;
  logo: "loop" | "initial"; artwork: string | null; artworkAlt: string; artworkPosition: string;
};

export type Program = {
  id: string; status: "none" | "draft" | "live";
  kind: ProgramKind; requirement: number; pointsPerPurchase: 1;
  reward: { name: string; terms: string; version: number };
  card: CardDesign; joinCode: string; launchedAt: string | null; draftStep: number;
};

export const defaultCard: CardDesign = {
  businessName: "Loopday Coffee", programName: "Loopday Rewards", rewardTitle: "Free coffee",
  bg: "#18231D", fg: "#F7F4EB", label: "#C4CDBF",
  logo: "loop", artwork: ASSET("reference-loopday-01"), artworkAlt: "Loopday counter, example imagery", artworkPosition: "72% 50%",
};

export const REWARD_TERMS = "One qualifying purchase earns one visit. A maximum of one visit counts per business day. Collect five visits for one free barista-made coffee on a later purchase. Redeeming a reward does not earn a visit. Earned rewards have no expiry in this example.";

export const liveProgram: Program = {
  id: "example-loopday-rewards", status: "live", kind: "visits", requirement: 5, pointsPerPurchase: 1,
  reward: { name: "Free coffee", terms: REWARD_TERMS, version: 1 },
  card: defaultCard, joinCode: "example-counter", launchedAt: "2026-08-25T09:00:00-05:00", draftStep: 5,
};
