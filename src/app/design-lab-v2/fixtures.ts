/**
 * V2 Design Lab fixtures. Every person, business, campaign, amount, date
 * and record here is fictional and exists only to render the prototypes,
 * exactly as the director's screen specs define them
 * (docs/design-lab-v2/screens). Nothing reads or writes the database.
 * The demonstration clock is frozen at 2026-09-16 10:00 America/Chicago;
 * money is USD cents. Imagery under /design-lab and /design-lab-v2 is
 * fixture imagery rendered for the Lab; /uploads/seed and /marketing hold
 * the product's own demo media.
 */
export const ASSET = (id: string, ext = "jpg") => `/design-lab/${id}.${ext}`;
export const V2ASSET = (id: string, ext = "jpg") => `/design-lab-v2/assets/${id}.${ext}`;

/** Money with an explicit currency prefix: the symbol alone is ambiguous. Discovery drops needless .00; ledgers keep two decimals. */
export function money(cents: number, opts: { cents?: boolean } = {}): string {
  const keep = opts.cents || cents % 100 !== 0;
  const n = new Intl.NumberFormat("en-US", { minimumFractionDigits: keep ? 2 : 0, maximumFractionDigits: keep ? 2 : 0 }).format(cents / 100);
  return `US$${n}`;
}

export type Kind = "recreate" | "story" | "car";

// ----------------------------------------------------------- User Home

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

export const homeOpportunities: Opportunity[] = [
  {
    id: "lab-recreate-loopday-pour", kind: "recreate", business: "Loopday Coffee", title: "Recreate this Reel",
    netCents: 7500, grossCents: 7500, feeCents: 0, basis: "per approved version",
    media: ASSET("reference-loopday-01"), mediaRatio: "4 / 5", mediaAlt: "Reference still: milk poured into a green cup at a coffee counter", mediaPosition: "50% 58%",
    facts: ["8 spots", "Closes Sep 20"],
    applyBy: "Sep 20, 2026, 6:00 PM CDT", submitBy: "Sep 23, 2026, 6:00 PM CDT",
    requirements: ["15 to 30 seconds", "9:16 MP4", "Show the pour, then the finished drink.", "Use original audio.", "No Instagram post required."],
    usage: "Loopday Coffee may use approved work in US paid social ads for 90 days.",
  },
  {
    id: "lab-story-loopday-24h", kind: "story", business: "Loopday Coffee", title: "Post for 24 hours",
    netCents: 2500, grossCents: 2500, feeCents: 0, basis: "after 24h + approval",
    media: ASSET("story-loopday-01"), mediaRatio: "9 / 16", mediaAlt: "Finished Story creative for Loopday Coffee",
    facts: ["500+ followers"],
    applyBy: "Sep 22, 2026, 6:00 PM CDT",
    requirements: ["Keep the Story live for 24 hours.", "Tag @loopday.fixture.", "Include #ad.", "Submit a screenshot after 24 hours."],
    usage: "Use this creative for the booked Story only.",
    extra: [{ label: "Post between", value: "Sep 24, 8:00 to 10:00 AM CDT" }, { label: "Proof by", value: "Sep 25, 2026, 12:00 PM CDT" }],
    eligibility: [{ label: "Instagram connected", state: "ok", note: "@maya.open.cut.demo" }, { label: "API verified", state: "ok" }, { label: "Eligible", state: "ok", note: "1,240 followers, 500 needed" }],
  },
  {
    id: "lab-car-spurroom-rear-doors", kind: "car", business: "Spurroom Bikes", title: "Drive with this campaign",
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

export const homeActivityCount = 2;

// --------------------------------------------------------- User Profile

export const profile = {
  name: "Maya Chen", username: "@maya.tapmart.demo", city: "Austin",
  portrait: ASSET("portrait-maya-01"), portraitAlt: "Maya Chen, fictional creator",
  earnedCents: 42000, completed: 3, reviews: 0,
  instagram: null as null | { handle: string; followers: number | null },
  payoutReady: true,
  work: [
    { id: "latte-take", title: "Latte take", kind: "recreate" as Kind, business: "Loopday Coffee", media: V2ASSET("maya-loopday-submission-01"), ratio: "4 / 5", alt: "Latte submission sample: hands placing an iced latte on a cafe counter", state: "Approved", mediaNote: "Submission still", facts: [{ label: "Approved on", value: "Aug 9, 2026" }], grossCents: 8000, feeCents: 500, netCents: 7500, creditedOn: "Aug 9, 2026" },
    { id: "afternoon-story", title: "Afternoon Story", kind: "story" as Kind, business: "Loopday Coffee", media: ASSET("story-loopday-01"), ratio: "9 / 16", alt: "Loopday Story creative", state: "Proof approved", mediaNote: "Posted for 24 hours", facts: [{ label: "Posted", value: "Aug 12, 2026, 12:00 PM CDT" }, { label: "Ended", value: "Aug 13, 2026, 12:00 PM CDT" }, { label: "Confirmed manually", value: "Aug 14, 2026" }], grossCents: 5000, feeCents: 500, netCents: 4500, creditedOn: "Aug 14, 2026" },
    { id: "rear-door-placement", title: "Rear-door placement", kind: "car" as Kind, business: "Spurroom Bikes", media: V2ASSET("maya-spurroom-placement-01"), ratio: "3 / 2", alt: "Spurroom rear-door placement sample", state: "Proof approved", mediaNote: "Placement proof", facts: [{ label: "Period", value: "Aug 1 to 31, 2026" }, { label: "Rear doors", value: "Proof approved Sep 2, 2026" }], grossCents: 33000, feeCents: 3000, netCents: 30000, creditedOn: "Sep 2, 2026" },
  ],
  vehicle: { title: "Maya’s car", photo: ASSET("vehicle-maya-01"), alt: "Maya’s listed vehicle", listed: true, rate: null as number | null },
};

export const USER_SETTINGS = ["Account", "Instagram and Connections", "Verification", "Payout", "Notifications", "Privacy", "Security", "Log out"];
export const BUSINESS_SETTINGS = ["Account", "Business Details", "Connections", "Google Business", "Brand Kit", "Plan and Billing", "Team", "Notifications", "Security", "Log out"];

// -------------------------------------------------------- Business Home

export type Person = {
  id: string; name: string; city: string; portrait: string; portraitAlt: string;
  instagram: string | null;
  work: { src: string; ratio: string; alt: string; title: string; kind: Kind }[];
  canStory: boolean;
};

export const businessPeople: Person[] = [
  { id: "maya", name: "Maya Chen", city: "Austin", portrait: ASSET("portrait-maya-01"), portraitAlt: "Maya Chen, fictional creator", instagram: "@maya.tapmart_demo", canStory: true,
    work: [{ src: ASSET("work-maya-loopday-01"), ratio: "4 / 5", alt: "Coffee handoff at a counter", title: "Coffee handoff", kind: "recreate" }, { src: ASSET("content-loopday-pour-03"), ratio: "4 / 5", alt: "A slow pour into a cup", title: "Slow pour", kind: "recreate" }] },
  { id: "nora", name: "Nora Vale", city: "Austin", portrait: ASSET("portrait-nora-01"), portraitAlt: "Nora Vale, fictional creator", instagram: null, canStory: false,
    work: [{ src: ASSET("work-eli-spurroom-01"), ratio: "4 / 5", alt: "A bicycle wheel being trued", title: "Wheel true", kind: "recreate" }, { src: ASSET("work-nora-lunch-01"), ratio: "4 / 5", alt: "A lunch plate on a table", title: "Lunch plate", kind: "story" }] },
  { id: "eli", name: "Eli Moss", city: "Round Rock", portrait: ASSET("portrait-eli-01"), portraitAlt: "Eli Moreno, fictional creator", instagram: "@eli.tapmart_demo", canStory: true,
    work: [{ src: ASSET("work-maya-spurroom-02"), ratio: "4 / 5", alt: "A tire check in a bike workshop", title: "Tire check", kind: "recreate" }, { src: ASSET("work-jules-flowers-01"), ratio: "4 / 5", alt: "A bouquet being wrapped", title: "Bouquet wrap", kind: "recreate" }] },
];

export const businessCar = { id: "eli-car", title: "Eli’s car", city: "Austin", photo: ASSET("vehicle-eli-01"), alt: "Eli’s car: a silver sedan parked outside a brick workshop", zone: "Rear doors", askCents: 24000 };

export const businessAttention = { content: 2, campaigns: 3 };

// -------------------------------------------------------- Public site

export const publicExamples = {
  recreate: { netCents: 8000, basis: "on approval", title: "Recreate this Reel", business: "Loopday Coffee", facts: ["3 spots", "Closes Sep 30"], media: ASSET("reference-loopday-01"), ratio: "4 / 5", alt: "Reference still: milk poured into a green cup at a coffee counter" },
  story: { netCents: 3000, basis: "on approval", title: "Post for 24 hours", business: "Loopday Coffee", facts: ["1,000 followers minimum"], media: ASSET("story-loopday-01"), ratio: "9 / 16", alt: "Finished Story creative for Loopday Coffee" },
  car: { netCents: 24000, basis: "/month", title: "Drive with this campaign", business: "Spurroom Bikes", facts: ["Austin", "3 months"], media: ASSET("vehicle-eli-01"), ratio: "3 / 2", alt: "A silver sedan parked outside a brick workshop" },
};

export const plans = [
  { id: "essential", name: "Essential", priceCents: 9900, cadence: "One shoot a month", line: "10 photos, 3 videos" },
  { id: "growth", name: "Growth", priceCents: 19900, cadence: "Two shoots a month", line: "20 photos, 6 videos" },
];
