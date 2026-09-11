import type { JsonSchema } from "./client";

/**
 * The master design package, in three parts so each answer stays within
 * one response: A (thesis, alternatives, art direction, information
 * architecture, navigation), B (components, media, motion, the four master
 * screens, the public homepage, the mockup briefs), C (application to the
 * whole product, the creative system, the self critique with fixes, the QA
 * scores, open questions).
 */

const S = (description?: string) => (description ? { type: "string", description } : { type: "string" });
const L = (description?: string) => ({ type: "array", items: { type: "string" }, ...(description ? { description } : {}) });
const obj = (properties: Record<string, unknown>, description?: string) => ({
  type: "object", additionalProperties: false, properties, required: Object.keys(properties), ...(description ? { description } : {}),
});

export const REBOOT_A_SCHEMA: JsonSchema = {
  name: "tapmart_reboot_a",
  schema: obj({
    thesis: obj({
      feel: S("What TapMart should feel like, in plain language."),
      emotional_association: S("What people should associate with it."),
      recognizable_idea: S("The one visual idea that makes it recognizable at a glance."),
      earning_feel: S("How earning money should feel in the product."),
      business_feel: S("How a business discovering marketing should feel."),
      not_a_gig_app: S(), not_a_social_network: S(), not_a_creator_marketplace: S(), not_a_saas_dashboard: S(), not_an_ad_platform: S(),
    }, "Part 1: the product design thesis."),
    alternatives_explored: {
      type: "array", minItems: 3,
      items: obj({
        name: S(), summary: S("Theme, colour, density, typography, media treatment, navigation, motion, personality in a few sentences."),
        strengths: L(), weaknesses: L(), outcome: S("rejected, merged into the chosen direction (what was taken), or chosen"),
      }),
      description: "At least three substantially different directions considered, judged honestly.",
    },
    chosen_direction: obj({ name: S(), why_it_won: S("Why it beat the alternatives, briefly."), what_was_merged: L("Ideas taken from the other directions, only where they improve the result.") }),
    art_direction: obj({
      theme_strategy: S("light, dark, adaptive or mixed, and exactly where each applies."),
      primary_colors: { type: "array", items: obj({ name: S(), hex: S(), role: S() }) },
      secondary_colors: { type: "array", items: obj({ name: S(), hex: S(), role: S() }) },
      typography: { type: "array", items: obj({ face: S("Font family, with a free or licensable source."), role: S(), why: S() }) },
      type_hierarchy: { type: "array", items: obj({ role: S(), size_px: S("phone / desktop"), weight: S(), tracking: S(), line_height: S() }) },
      spacing: S("The spacing scale and the rules for gutters, section gaps and internal padding."),
      grid: S("Phone and desktop grids."),
      shapes: S("Shape language and the radius rules, including what has none."),
      surfaces: S("What surfaces exist, how they separate, when a surface is not used."),
      depth: S(), borders: S(), shadows: S(),
      photography: S("Direction for photography: subjects, light, lens, colour, what to avoid."),
      video: S(), iconography: S("Family, weight, size, when icons are used and when not."), illustration: S(), three_d: S(), generated_imagery: S(),
      motion_principles: S(), device_framing: S("When and how phone or desktop frames appear."),
      logo: S("Keep, refine or replace the wordmark; describe the treatment."),
      why_it_fits: S("Why this system fits what TapMart actually is."),
    }, "Part 2: brand and art direction chosen from scratch."),
    information_architecture: obj({
      audit: L("Where the current structure adds decisions or taps that the product does not need; what to preserve."),
      user_journey: L("Ordered: first login to a paid piece of work, step by step, with the screen and the decision at each step."),
      business_journey: L("Ordered: first login to a running campaign and to reviewed content."),
      removed_complexity: L(),
      preserved_capabilities: L("Every capability from the inventory that stays, and where it now lives."),
    }, "Part 3."),
    navigation: obj({
      mobile_user: S(), desktop_user: S(), mobile_business: S(), desktop_business: S(), public_site: S(),
      mode_switching: S("How a person moves between Personal and each business, and how the app makes the current mode obvious."),
      principle: S("Why it is obvious without dominating the screen."),
    }, "Part 4."),
  }),
};

const SCREEN = obj({
  name: S(),
  three_second_read: S("What a person understands within three seconds."),
  mobile_composition: S("Top to bottom, region by region, with sizes."),
  desktop_composition: S("The desktop as its own composition, not a stretched phone."),
  information_hierarchy: L(),
  primary_actions: L(), secondary_actions: L(),
  media: L("Exactly which media, at what size, and why."),
  interaction: L(), motion: L(),
  removed: L("What from today's product is removed from this screen."),
  hidden_deeper: L("What moves into a detail view, a sheet or settings."),
  empty_and_loading: L("Honest states."),
  responsive: L(),
  accessibility: L(),
});

export const REBOOT_B_SCHEMA: JsonSchema = {
  name: "tapmart_reboot_b",
  schema: obj({
    components: {
      type: "array",
      items: obj({ name: S(), used_for: L(), must_not_be_reused_for: L("Content types that deliberately get a different component."), anatomy: S("Parts, sizes, states."), variants: L() }),
      description: "Part 5: the master components, including Recreate, Story and Car opportunities as distinct presentations, person and vehicle discovery, content deliverable, campaign state, transaction, profile and business identity, media viewer, navigation, sheet, modal, settings row, form, upload, approval, empty, loading and success states.",
    },
    media_system: L("Part 6: rules for photography, video, generated visuals, uploaded media, 3D, motion, device mockups, thumbnails, full bleed and backgrounds: where each is used and where it is not."),
    motion_system: L("Part 7: microinteractions, navigation transitions, sheets, media playback, dragging, 3D, upload progress, approval success, money feedback, desktop hover, scroll, public storytelling, loading, reduced motion; each with trigger, duration, easing and what it explains."),
    master_screens: { type: "array", minItems: 4, maxItems: 4, items: SCREEN, description: "Part 8: User Home, User Profile, Business Home, Business Content, in that order." },
    public_homepage: obj({
      message: S("The core message, in the fewest words."),
      sections: { type: "array", items: obj({ name: S(), purpose: S(), composition: S(), media: S(), motion: S(), copy: S("The actual words, minimal.") }) },
      explains_recreate_post_drive_get_paid: S("How the four ideas are shown almost visually."),
      business_side: S(), cta_strategy: S(), desktop_vs_phone: S(), performance_and_accessibility: S(),
    }, "Part 9."),
    mockup_briefs: {
      type: "array", minItems: 5,
      items: obj({
        screen: S("User Home, User Profile, Business Home, Business Content, Public Homepage, or an additional concept."),
        device: S("phone, desktop or composition"),
        aspect_ratio: { type: "string", enum: ["9:16", "4:5", "1:1", "16:9", "3:2"] },
        what_it_must_communicate: L("Composition, colour, type, media, depth, personality."),
        prompt: S("A complete, concrete prompt for the image model: a photographic render of the actual screen or composition in the chosen art direction, real looking people, places and cars, no legible fake copy beyond a word or two, no watermark, no template look."),
        avoid: L(),
      }),
      description: "Part 10: the briefs for brand new concept images of the recommended direction. Previous TapMart imagery is never referenced.",
    },
  }),
};

export const REBOOT_C_SCHEMA: JsonSchema = {
  name: "tapmart_reboot_c",
  schema: obj({
    application: {
      type: "array",
      items: obj({ screen: S(), treatment: S("How the master system applies here without reverting to a generic dashboard."), distinct_from_master_screens: S("What is deliberately different.") }),
      description: "Part 11: Activity, Earnings, opportunity details (Recreate, Story, Car), submission flows, vehicle management and scan, Business Create (three flows), Campaigns and campaign detail, Business Profile, Brand Kit, Settings, Notifications, Messages, Connections, Billing, authentication and onboarding.",
    },
    creative_system: {
      type: "array",
      items: obj({ asset: S(), direction: S("Composition, subject, light, colour, copy rules, aspect."), production: S("How it is produced with the director and the image models; when editing is used over generation."), quality_bar: L() }),
      description: "Part 12: Story ads, Recreate covers, vehicle ad previews, business promotional content, marketing photography, social graphics, content thumbnails.",
    },
    self_critique: {
      type: "array",
      items: obj({ question: S(), honest_answer: S(), passes: { type: "boolean" }, fix: S("The change made to the master direction when it did not pass, or an empty string.") }),
      description: "Part 13: simple; distinctive; easy for a normal person; User mode obviously about earning; Business mode obviously about growing; every main action has a path; too much text; too many cards; media meaningful; templated; AI generated feel; effects for their own sake; understandable with no explanation; mobile excellent; desktop intentional; buildable by Claude; scales.",
    },
    fixes_applied: L("What changed in the direction because of the critique."),
    qa: {
      type: "array",
      items: obj({ criterion: S(), score: { type: "integer", minimum: 0, maximum: 10 }, evidence: S("Why, with reference to the design, never 'looks clean'.") }),
      description: "Part 14: clarity, uniqueness, usability, visual quality, consistency, interaction quality, media quality, information hierarchy, responsiveness, implementability, brand recognition.",
    },
    implementation_readiness: obj({
      first_screen_to_build: S(), build_order: L(), engineering_notes: L("What Claude Code must know: tokens, fonts, media pipeline, motion primitives, accessibility."),
      risks: L(),
    }),
    open_questions_for_the_founder: L("Decisions only the founder can make, if any."),
  }),
};
