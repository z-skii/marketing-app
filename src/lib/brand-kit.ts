/**
 * TAPMART BRAND KIT — the single source of truth for every agent that writes
 * copy or renders a graphic. Nothing brand-shaped may be hardcoded anywhere
 * else: templates import COLORS and TYPE; the generation agent's system
 * prompt is built from VOICE and MECHANICS verbatim.
 *
 * MECHANICS is a hard rule, not a style note: agents may claim ONLY what is
 * written there, because every line of it is enforced by this codebase.
 * Anything else — payout amounts, user counts, features we don't have — is
 * fabrication and gets content rejected in review.
 */

export const COLORS = {
  /** Warm off-white ground. CSS: --paper */
  paper: "#f2f0ea",
  /** Signal orange — the only accent. CSS: --signal */
  signal: "#ff3b18",
  /** Near-black ink. CSS: --ink */
  ink: "#0b0b0c",
  /** Derived, for secondary text on paper. */
  inkFaint: "#8b887e",
  /** Derived, for secondary text on ink. */
  paperFaint: "#a8a59b",
} as const;

export const TYPE = {
  /** Display face for headlines. Weights in use: 500 / 700 / 800 / 900. */
  display: "Archivo",
  displayWeights: [500, 700, 800, 900],
  /** Mono face for eyebrows, labels, numbers. Weights in use: 500 / 600. */
  mono: "IBM Plex Mono",
  monoWeights: [500, 600],
} as const;

export const VOICE = [
  "Direct. Short sentences. Say the thing.",
  "Lowercase-casual on social (Threads, captions). Ads may use uppercase display type.",
  "No corporate filler: never 'revolutionize', 'unlock', 'seamless', 'game-changer', 'we're excited to'.",
  "No emojis in ads. Sparse to none on social.",
  "Confident, a little blunt, never hype-desperate. The product is the pitch.",
  "Always spell the site exactly: tapmart.live",
] as const;

/**
 * THE ONLY CLAIMS AGENTS MAY MAKE. Every line maps to shipped behavior in
 * this repository. Nothing outside this list may be stated or implied.
 */
export const MECHANICS = [
  "Post your link → add credit → climb the board → get clicked.",
  "The board ranks links by credit added today; the top of the board is #1.",
  "The Spot is one rotating top slot — one link at a time on a countdown.",
  "Sharers earn only when someone they sent OPENS a live link. Views pay nothing.",
  "Links go live when posted. Anyone can put their link up.",
] as const;

export const FORBIDDEN = [
  "Never invent payout amounts, rates, or earnings figures.",
  "Never invent user counts, traffic numbers, or growth stats.",
  "Never promise features that do not exist in this codebase.",
  "Never say views, impressions, or follows earn anything.",
] as const;

export const SITE = {
  name: "TapMart",
  display: "TAPMART",
  url: "tapmart.live",
  tagline: "What's getting clicked right now?",
} as const;

/** The brand kit flattened into system-prompt text for the content agent. */
export function brandPromptBlock(): string {
  return [
    `BRAND: ${SITE.name} (${SITE.url}) — "${SITE.tagline}"`,
    "",
    "VOICE:",
    ...VOICE.map((v) => `- ${v}`),
    "",
    "MECHANICS — the ONLY claims you may make about how the product works:",
    ...MECHANICS.map((m) => `- ${m}`),
    "",
    "HARD RULES — violating any of these makes the content unusable:",
    ...FORBIDDEN.map((f) => `- ${f}`),
  ].join("\n");
}
