/**
 * V2 Design Lab fixtures. Every person, business, campaign, amount, date
 * and record here is fictional and exists only to render the prototypes.
 * Nothing reads or writes the database. The demonstration clock is frozen
 * at 2026-05-14T15:00:00Z; money is USD cents. Imagery under /design-lab
 * is fixture imagery rendered for the Lab; imagery under /uploads/seed and
 * /marketing is the product's own demo media.
 */
export const ASSET = (id: string, ext = "jpg") => `/design-lab/${id}.${ext}`;

export const NOW = new Date("2026-05-14T15:00:00Z");

export function usd(cents: number, opts: { whole?: boolean } = {}): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: opts.whole ? 0 : 2, maximumFractionDigits: opts.whole ? 0 : 2 }).format(cents / 100);
}

export const PLATFORM_FEE_PCT = 15;
export const PAYOUT_MINIMUM_CENTS = 2500;

export type Kind = "recreate" | "story" | "car";

export type Opportunity = {
  id: string; kind: Kind; business: string; businessInitials: string; title: string; payCents: number;
  /** What the amount is paid for, at the point of need. */
  basis: string;
  media: string; mediaRatio: "9 / 16" | "3 / 2" | "4 / 5" | "16 / 9"; mediaAlt: string; mediaLabel: string;
  spots: number; deadline: string; city: string;
  requirements: string[];
  /** Kind specific facts shown on demand. */
  detail: { label: string; value: string }[];
};

export const opportunities: Opportunity[] = [
  {
    id: "op-recreate-loopday", kind: "recreate", business: "Loopday Coffee", businessInitials: "LC", title: "Your coffee pour", payCents: 6500, basis: "per approved video",
    media: ASSET("reference-loopday-01"), mediaRatio: "9 / 16", mediaAlt: "Reference still: a slow pour at a coffee counter", mediaLabel: "Reference",
    spots: 4, deadline: "May 22", city: "Austin",
    requirements: ["Film your own version, 8 to 15 seconds", "Keep the kettle and cup in frame", "Vertical, natural light"],
    detail: [{ label: "Spots left", value: "4" }, { label: "Apply by", value: "May 22, 2026" }, { label: "Paid", value: "After approval" }, { label: "Fee", value: `${PLATFORM_FEE_PCT}% platform fee deducted` }],
  },
  {
    id: "op-story-loopday", kind: "story", business: "Loopday Coffee", businessInitials: "LC", title: "Coffee break", payCents: 3500, basis: "after 24h live and approval",
    media: ASSET("story-loopday-01"), mediaRatio: "9 / 16", mediaAlt: "A finished Instagram Story ad for a coffee counter", mediaLabel: "Story creative",
    spots: 8, deadline: "May 24", city: "Austin",
    requirements: ["Instagram connected", "1,000 followers or more", "Story stays live 24 hours"],
    detail: [{ label: "Needs", value: "1,000+ followers" }, { label: "Live for", value: "24 hours" }, { label: "Post by", value: "May 24, 2026" }, { label: "Paid", value: "After 24h and approval" }],
  },
  {
    id: "op-car-spurroom", kind: "car", business: "Spurroom Bikes", businessInitials: "SB", title: "Rear doors, 60 days", payCents: 24000, basis: "per month",
    media: ASSET("campaign-car-context-01"), mediaRatio: "3 / 2", mediaAlt: "A parked car in a street, the campaign visual", mediaLabel: "Campaign visual",
    spots: 2, deadline: "May 28", city: "Austin",
    requirements: ["A vehicle on your profile", "Installation at the shop", "Monthly proof photo"],
    detail: [{ label: "Placement", value: "Rear doors" }, { label: "Duration", value: "60 days" }, { label: "Paid", value: "Monthly, after proof" }, { label: "Install", value: "Spurroom, Austin" }],
  },
  {
    id: "op-recreate-spurroom", kind: "recreate", business: "Spurroom Bikes", businessInitials: "SB", title: "A quick tire check", payCents: 5000, basis: "per approved video",
    media: ASSET("work-eli-spurroom-01"), mediaRatio: "4 / 5", mediaAlt: "Reference still: a wheel being trued in a bike workshop", mediaLabel: "Reference",
    spots: 3, deadline: "May 30", city: "Austin",
    requirements: ["Film your own version, 10 to 20 seconds", "Show the wheel spinning at the end"],
    detail: [{ label: "Spots left", value: "3" }, { label: "Apply by", value: "May 30, 2026" }, { label: "Paid", value: "After approval" }],
  },
];

export type WorkState = "Applied" | "Accepted" | "Submitted" | "Revision requested" | "Approved" | "Paid" | "Booked" | "Installation" | "Proof due" | "Monthly payment";

export type Work = { id: string; kind: Kind; business: string; title: string; state: WorkState; payCents: number; media: string; mediaRatio: string; next: string | null; when: string };

export const activeWork: Work[] = [
  { id: "w-tire", kind: "recreate", business: "Spurroom Bikes", title: "A quick tire check", state: "Revision requested", payCents: 5000, media: ASSET("work-maya-spurroom-02"), mediaRatio: "4 / 5", next: "Hold the final wheel shot for two seconds", when: "Today" },
  { id: "w-story", kind: "story", business: "Loopday Coffee", title: "Coffee break", state: "Submitted", payCents: 3500, media: ASSET("story-loopday-01"), mediaRatio: "9 / 16", next: "Live until 9:10 AM tomorrow", when: "Yesterday" },
  { id: "w-car", kind: "car", business: "Spurroom Bikes", title: "Rear doors, 60 days", state: "Installation", payCents: 24000, media: ASSET("vehicle-maya-01"), mediaRatio: "3 / 2", next: "Install at Spurroom, May 16", when: "May 12" },
];

export const directRequest = { id: "req-1", kind: "story" as Kind, business: "Loopday Coffee", title: "Post our new cups", payCents: 4000, basis: "after 24h live and approval", media: ASSET("content-loopday-cups-05"), mediaRatio: "1 / 1", expires: "Replies close May 16" };

export const me = {
  id: "me", name: "Maya Chen", first: "Maya", handle: "maya.frame_demo", city: "Austin, Texas", portrait: ASSET("portrait-maya-01"), cover: ASSET("work-maya-loopday-01"),
  bio: "Coffee, bikes and morning light.",
  verified: true,
  stats: { lifetimeEarnedCents: 31240, completed: 7, rating: 4.8, reviews: 5 },
  money: { availableCents: 7840, pendingCents: 3600, minimumCents: PAYOUT_MINIMUM_CENTS },
  instagram: { handle: "maya.frame_demo", followers: 1420, connected: true },
  vehicle: { id: "v-maya", label: "Toyota Corolla", year: 2020, body: "Hatchback", color: "Blue", photo: ASSET("vehicle-maya-01"), modelUrl: null as string | null, zones: ["Rear doors"], askingCents: 18000, listed: true },
  work: [
    { id: "k1", title: "Coffee handoff", kind: "recreate" as Kind, business: "Loopday Coffee", state: "Paid", payCents: 6500, src: ASSET("work-maya-loopday-01"), ratio: "9 / 16" },
    { id: "k2", title: "Coffee break", kind: "story" as Kind, business: "Loopday Coffee", state: "Paid", payCents: 3500, src: ASSET("story-loopday-01"), ratio: "9 / 16" },
    { id: "k3", title: "A quick tire check", kind: "recreate" as Kind, business: "Spurroom Bikes", state: "In review", payCents: 5000, src: ASSET("work-maya-spurroom-02"), ratio: "4 / 5" },
    { id: "k4", title: "Rear doors, 60 days", kind: "car" as Kind, business: "Spurroom Bikes", state: "Installing", payCents: 24000, src: ASSET("vehicle-maya-01"), ratio: "3 / 2" },
    { id: "k5", title: "Counter reset", kind: "recreate" as Kind, business: "Loopday Coffee", state: "Paid", payCents: 6500, src: ASSET("content-loopday-counter-01"), ratio: "3 / 2" },
    { id: "k6", title: "Window light", kind: "story" as Kind, business: "Loopday Coffee", state: "Paid", payCents: 3500, src: ASSET("content-loopday-window-04"), ratio: "3 / 2" },
  ],
  reviews: [
    { id: "r1", business: "Loopday Coffee", text: "Exactly the pour we asked for.", rating: 5 },
    { id: "r2", business: "Spurroom Bikes", text: "Quick, clean, on time.", rating: 5 },
  ],
};

export const USER_SETTINGS = ["Account", "Instagram and Connections", "Verification", "Payout", "Notifications", "Privacy", "Security", "Log out"];
export const BUSINESS_SETTINGS = ["Account", "Business Details", "Connections", "Google Business", "Brand Kit", "Plan and Billing", "Team", "Notifications", "Security", "Log out"];

export const loopday = { id: "loopday", name: "Loopday Coffee", initials: "LC", category: "Coffee counter", city: "Austin, Texas", plan: "Growth", cover: ASSET("content-loopday-window-04") };

export type Person = {
  id: string; name: string; first: string; city: string; distance: string; portrait: string | null; initials: string;
  completed: number | null; rating: { value: number; count: number } | null; verified: boolean;
  instagram: { handle: string; followers: number } | null;
  does: Kind[];
  work: { src: string; ratio: string; title: string; kind: Kind }[];
  vehicle: { label: string; photo: string; zone: string; askingCents: number } | null;
};

export const people: Person[] = [
  { id: "p-maya", name: "Maya Chen", first: "Maya", city: "Austin", distance: "1.2 mi", portrait: ASSET("portrait-maya-01"), initials: "MC", completed: 7, rating: { value: 4.8, count: 5 }, verified: true, instagram: { handle: "maya.frame_demo", followers: 1420 }, does: ["recreate", "story", "car"],
    work: [{ src: ASSET("work-maya-loopday-01"), ratio: "9 / 16", title: "Coffee handoff", kind: "recreate" }, { src: ASSET("story-loopday-01"), ratio: "9 / 16", title: "Coffee break", kind: "story" }, { src: ASSET("work-maya-spurroom-02"), ratio: "4 / 5", title: "Tire check", kind: "recreate" }],
    vehicle: { label: "2020 Toyota Corolla", photo: ASSET("vehicle-maya-01"), zone: "Rear doors", askingCents: 18000 } },
  { id: "p-eli", name: "Eli Moreno", first: "Eli", city: "Austin", distance: "2.4 mi", portrait: ASSET("portrait-eli-01"), initials: "EM", completed: 4, rating: { value: 4.7, count: 3 }, verified: false, instagram: { handle: "eli.rides_demo", followers: 2080 }, does: ["recreate", "car"],
    work: [{ src: ASSET("work-eli-spurroom-01"), ratio: "4 / 5", title: "Wheel true", kind: "recreate" }],
    vehicle: { label: "2018 Honda Civic", photo: ASSET("vehicle-eli-01"), zone: "Driver door", askingCents: 12000 } },
  { id: "p-imani", name: "Imani Cole", first: "Imani", city: "Austin", distance: "0.8 mi", portrait: ASSET("portrait-imani-01"), initials: "IC", completed: 12, rating: { value: 4.9, count: 8 }, verified: true, instagram: null, does: ["recreate"],
    work: [{ src: ASSET("content-loopday-counter-01"), ratio: "3 / 2", title: "Counter reset", kind: "recreate" }, { src: ASSET("content-loopday-pour-03"), ratio: "9 / 16", title: "Slow pour", kind: "recreate" }, { src: ASSET("content-loopday-pastry-02"), ratio: "4 / 5", title: "Pastry detail", kind: "recreate" }],
    vehicle: null },
  { id: "p-jules", name: "Jules Park", first: "Jules", city: "Austin", distance: "3.1 mi", portrait: ASSET("portrait-jules-01"), initials: "JP", completed: 3, rating: null, verified: false, instagram: { handle: "jules.stems_demo", followers: 1180 }, does: ["recreate", "story"],
    work: [{ src: ASSET("work-jules-flowers-01"), ratio: "4 / 5", title: "Bouquet wrap", kind: "recreate" }],
    vehicle: null },
  { id: "p-nora", name: "Nora Bell", first: "Nora", city: "Round Rock", distance: "14 mi", portrait: ASSET("portrait-nora-01"), initials: "NB", completed: 5, rating: { value: 4.6, count: 4 }, verified: false, instagram: null, does: ["story", "car"],
    work: [{ src: ASSET("work-nora-lunch-01"), ratio: "4 / 5", title: "Lunch plate", kind: "story" }],
    vehicle: { label: "2019 Mazda CX-5", photo: ASSET("vehicle-nora-01"), zone: "Rear panel", askingCents: 16000 } },
  { id: "p-theo", name: "Theo Grant", first: "Theo", city: "Austin", distance: "1.9 mi", portrait: null, initials: "TG", completed: null, rating: null, verified: false, instagram: null, does: ["car"],
    work: [],
    vehicle: { label: "2021 Ford Transit Connect", photo: ASSET("vehicle-theo-01"), zone: "Full side", askingCents: 26000 } },
];

export type Car = { id: string; ownerFirst: string; label: string; year: number; body: string; color: string; city: string; distance: string; photo: string; zones: string[]; askingCents: number; modelUrl: string | null };

export const cars: Car[] = [
  { id: "c-maya", ownerFirst: "Maya", label: "Toyota Corolla", year: 2020, body: "Hatchback", color: "Blue", city: "Austin", distance: "1.2 mi", photo: ASSET("vehicle-maya-01"), zones: ["Rear doors"], askingCents: 18000, modelUrl: null },
  { id: "c-eli", ownerFirst: "Eli", label: "Honda Civic", year: 2018, body: "Sedan", color: "White", city: "Austin", distance: "2.4 mi", photo: ASSET("vehicle-eli-01"), zones: ["Driver door"], askingCents: 12000, modelUrl: null },
  { id: "c-nora", ownerFirst: "Nora", label: "Mazda CX-5", year: 2019, body: "SUV", color: "Grey", city: "Round Rock", distance: "14 mi", photo: ASSET("vehicle-nora-01"), zones: ["Rear panel"], askingCents: 16000, modelUrl: null },
  { id: "c-theo", ownerFirst: "Theo", label: "Ford Transit Connect", year: 2021, body: "Van", color: "White", city: "Austin", distance: "1.9 mi", photo: ASSET("vehicle-theo-01"), zones: ["Full side", "Rear doors"], askingCents: 26000, modelUrl: null },
];

export const businessAttention = [
  { id: "a1", label: "2 videos to review", kind: "recreate" as Kind, href: "#campaigns", media: ASSET("work-maya-spurroom-02") },
  { id: "a2", label: "1 photo to approve", kind: "recreate" as Kind, href: "#content", media: ASSET("content-loopday-counter-01") },
];

export const plans = [
  { id: "essential", name: "Essential", priceCents: 9900, shoots: "1 shoot a month", line: "10 photos, 3 videos" },
  { id: "growth", name: "Growth", priceCents: 19900, shoots: "2 shoots a month", line: "20 photos, 6 videos, trending Reels" },
];
