/**
 * Design Lab fixtures. Every person, business, campaign, file, amount and
 * record here is fictional and exists only to render the prototypes.
 * Nothing reads or writes the database. The demonstration clock is frozen
 * at 2026-05-12T15:00:00Z; dates are absolute; money is USD cents.
 */
export const ASSET = (id: string, ext = "jpg") => `/design-lab/${id}.${ext}`;

export const NOW = new Date("2026-05-12T15:00:00Z");

export const maya = {
  id: "demo-maya", name: "Maya Chen", first: "Maya", handle: "maya.frame_demo", city: "Austin, Texas", portrait: ASSET("portrait-maya-01"),
  bio: null as string | null, verified: false,
  stats: { lifetimeEarnedCents: 31240, completed: 7, rating: 4.8, reviews: 5 },
  instagram: { handle: "maya.frame_demo", followers: 1420, verifiedBy: "manual" as const },
  vehicle: { id: "demo-vehicle-maya", label: "Toyota Corolla", year: 2020, body: "Hatchback", color: "Blue", city: "Austin", photo: ASSET("vehicle-maya-01"), modelUrl: null as string | null, zones: ["Rear doors"], askingCents: 18000 },
  money: { availableCents: 7840, pendingCents: 3600, payoutRequestedCents: 5000, payoutRequestedAt: "May 10, 2026", minimumCents: 2500 },
  recentWork: [
    { id: "w1", title: "Coffee handoff", kind: "Recreate", state: "Approved", src: ASSET("work-maya-loopday-01") },
    { id: "w2", title: "Coffee break", kind: "Story", state: "Approved", src: ASSET("story-loopday-01") },
    { id: "w3", title: "Tire check", kind: "Recreate", state: "In review", src: ASSET("work-maya-spurroom-02") },
  ],
  resume: { title: "Reel revision ready", business: "Spurroom Bikes", work: "A quick tire check", note: "Please hold the final wheel shot for two seconds." },
};

export const opportunities = {
  recreate: { id: "demo-recreate-01", business: "Loopday Coffee", title: "Your coffee pour", instruction: "Film your version.", payCents: 6500, basis: "per approved video", spots: 4, deadline: "May 22, 2026", reference: ASSET("reference-loopday-01"), referenceLabel: "Reference · still", fee: { grossCents: 6500, feeCents: 650, netCents: 5850 } },
  story: { id: "demo-story-01", business: "Loopday Coffee", title: "Coffee break", payCents: 3500, basis: "after 24h live and approval", liveHours: 24, minFollowers: 1000, spots: 8, deadline: "May 24, 2026", creative: ASSET("story-loopday-01"), creativeLabel: "Supplied creative · Demo" },
  car: { id: "demo-car-campaign-01", business: "Spurroom Bikes", title: "Bike-shop car ad", payCents: 24000, basis: "per month", zones: "Rear doors", durationDays: 60, spots: 2, deadline: "May 28, 2026", visual: ASSET("campaign-car-context-01"), visualLabel: "Campaign visual · Demo · No installed ad" },
};

export const loopday = { id: "demo-loopday", name: "Loopday Coffee", initials: "LC", category: "coffee counter", city: "Austin, Texas", logo: null as string | null, plan: "Growth", planState: "Active" };

export type Person = { id: string; name: string; city: string; portrait: string | null; initials: string; completed: number | null; rating: { value: number; count: number } | null; qualification: string; sample: { src: string; ratio: string } | null };

export const people: Person[] = [
  { id: "p-maya", name: "Maya Chen", city: "Austin", portrait: ASSET("portrait-maya-01"), initials: "MC", completed: 7, rating: { value: 4.8, count: 5 }, qualification: "Instagram Manual · 1,420 followers", sample: { src: ASSET("work-maya-loopday-01"), ratio: "9 / 16" } },
  { id: "p-eli", name: "Eli Moreno", city: "Austin", portrait: ASSET("portrait-eli-01"), initials: "EM", completed: 4, rating: { value: 4.7, count: 3 }, qualification: "Instagram connected · 2,080 followers", sample: { src: ASSET("work-eli-spurroom-01"), ratio: "4 / 5" } },
  { id: "p-imani", name: "Imani Cole", city: "Austin", portrait: ASSET("portrait-imani-01"), initials: "IC", completed: 12, rating: { value: 4.9, count: 8 }, qualification: "Verified creator", sample: { src: ASSET("content-loopday-counter-01"), ratio: "3 / 2" } },
  { id: "p-jules", name: "Jules Park", city: "Austin", portrait: ASSET("portrait-jules-01"), initials: "JP", completed: 3, rating: null, qualification: "Instagram connected · 1,180 followers", sample: { src: ASSET("work-jules-flowers-01"), ratio: "4 / 5" } },
  { id: "p-nora", name: "Nora Bell", city: "Round Rock", portrait: ASSET("portrait-nora-01"), initials: "NB", completed: 5, rating: { value: 4.6, count: 4 }, qualification: "5 completed", sample: { src: ASSET("work-nora-lunch-01"), ratio: "4 / 5" } },
  { id: "p-theo", name: "Theo Grant", city: "Austin", portrait: null, initials: "TG", completed: null, rating: null, qualification: "Not verified", sample: null },
];

export type Car = { id: string; owner: string; label: string; city: string; photo: string; zone: string; askingCents: number };

export const cars: Car[] = [
  { id: "c-maya", owner: "Maya", label: "2020 Toyota Corolla hatchback", city: "Austin", photo: ASSET("vehicle-maya-01"), zone: "Rear doors", askingCents: 18000 },
  { id: "c-eli", owner: "Eli", label: "2018 Honda Civic sedan", city: "Austin", photo: ASSET("vehicle-eli-01"), zone: "Driver door", askingCents: 12000 },
  { id: "c-nora", owner: "Nora", label: "2019 Mazda CX-5", city: "Round Rock", photo: ASSET("vehicle-nora-01"), zone: "Rear panel", askingCents: 16000 },
  { id: "c-theo", owner: "Theo", label: "2021 Ford Transit Connect", city: "Austin", photo: ASSET("vehicle-theo-01"), zone: "Full side", askingCents: 26000 },
];

export const attention = [
  { id: "a1", text: "2 campaign decisions", href: "#campaigns" },
  { id: "a2", text: "1 file to approve", href: "/design-lab/business-content" },
];

export type ContentFile = { id: string; title: string; state: "New" | "Approved"; src: string; ratio: string; caption: string; editNote: string | null; post: { state: string; detail?: string } };

export const contentFiles: ContentFile[] = [
  { id: "content-01", title: "Counter reset", state: "New", src: ASSET("content-loopday-counter-01"), ratio: "3 / 2", caption: "A fresh start at the counter.", editNote: null, post: { state: "Not scheduled" } },
  { id: "content-02", title: "Pastry detail", state: "Approved", src: ASSET("content-loopday-pastry-02"), ratio: "4 / 5", caption: "Butter, sugar, patience.", editNote: null, post: { state: "Failed", detail: "Instagram authorization expired." } },
  { id: "content-03", title: "Slow pour", state: "Approved", src: ASSET("content-loopday-pour-03"), ratio: "9 / 16", caption: "The slow part is the point.", editNote: "Keep the kettle and cup fully visible.", post: { state: "Not scheduled" } },
  { id: "content-04", title: "Window light", state: "Approved", src: ASSET("content-loopday-window-04"), ratio: "3 / 2", caption: "Morning at the window seat.", editNote: null, post: { state: "Scheduled", detail: "May 15, 2026 at 10:30 AM Central · Instagram photo" } },
  { id: "content-05", title: "Green cups", state: "Approved", src: ASSET("content-loopday-cups-05"), ratio: "1 / 1", caption: "New cups, same counter.", editNote: null, post: { state: "Not scheduled" } },
];

export const shoots = [
  { id: "shoot-demo-01", title: "Shoot 01", when: "May 7, 2026 at 9:00 AM Central", state: "Shoot completed", delivery: "Delivery recorded", files: "5 files available", planned: "10 photos · 3 videos planned", creator: { name: "Imani Cole", verified: true, portrait: ASSET("portrait-imani-01") } },
  { id: "shoot-demo-02", title: "Shoot 02", when: null, state: "Your shoot is being scheduled", delivery: null, files: null, planned: "10 photos · 3 videos planned", creator: null },
];

export const upcomingPosts = [
  { id: "post-04", title: "Window light", when: "May 15, 2026 at 10:30 AM Central", platform: "Instagram photo", state: "Scheduled", note: "Scheduling does not publish automatically." },
  { id: "post-02", title: "Pastry detail", when: null, platform: "Instagram photo", state: "Failed", note: "Instagram authorization expired. Open Connections." },
];

export function usd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}
