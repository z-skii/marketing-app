import type { JsonSchema } from "./client";

/**
 * Every strict JSON shape the director returns. The UI system and screen
 * design shapes match the specs already saved under docs/design-specs, so
 * earlier designs stay readable by the same code.
 */

export const SYSTEM_SCHEMA: JsonSchema = {
  name: "tapmart_ui_system",
  schema: {
    type: "object", additionalProperties: false,
    properties: {
      name: { type: "string" },
      principles: { type: "array", items: { type: "string" }, description: "Up to 8 one-line principles that make it TapMart." },
      colors: { type: "array", items: { $ref: "#/$defs/token" }, description: "Every colour with a role: background, surfaces, lines, text tiers, lime, success, warning, error, glass, scrim." },
      typography: { type: "array", items: { $ref: "#/$defs/token" }, description: "Font family and every text role with size px, weight, letter spacing, line height." },
      spacing: { type: "array", items: { $ref: "#/$defs/token" }, description: "Gutters, section gaps, card gaps, row gaps, internal paddings, content top and bottom." },
      surfaces: { type: "array", items: { $ref: "#/$defs/token" }, description: "Surface levels: fill, border, gradient, when each is used." },
      radius: { type: "array", items: { $ref: "#/$defs/token" } },
      buttons: { type: "array", items: { $ref: "#/$defs/token" }, description: "Primary, secondary, tertiary, icon button, chip: height, radius, fill, text, states." },
      navigation: { type: "array", items: { $ref: "#/$defs/token" }, description: "Phone top bar, phone bottom bar, desktop rail, active and inactive treatment, glass values." },
      rows: { type: "array", items: { $ref: "#/$defs/token" }, description: "Row anatomy: height, padding, thumb, title, sub, status, chevron, gaps." },
      cards: { type: "array", items: { $ref: "#/$defs/token" }, description: "Card types: hero media card, media tile, stat, vehicle card; when each is used." },
      media_ratios: { type: "array", items: { $ref: "#/$defs/token" }, description: "Ratios or fixed heights per media kind: Reel, Story creative, car, business cover, creator portrait, thumbnail, avatar." },
      badges: { type: "array", items: { $ref: "#/$defs/token" } },
      status: { type: "array", items: { $ref: "#/$defs/token" }, description: "Dot, text, colours per state (ready, active, pending, review, done, error)." },
      glass: { type: "array", items: { $ref: "#/$defs/token" } },
      shadow: { type: "array", items: { $ref: "#/$defs/token" } },
      animation: { type: "array", items: { $ref: "#/$defs/token" }, description: "Each motion with trigger, duration, easing and where it is used." },
      icon_style: { type: "array", items: { $ref: "#/$defs/token" } },
      responsive_rules: { type: "array", items: { $ref: "#/$defs/token" }, description: "Breakpoints, desktop rail width, content max widths, how phone compositions translate to desktop." },
    },
    required: ["name", "principles", "colors", "typography", "spacing", "surfaces", "radius", "buttons", "navigation", "rows", "cards", "media_ratios", "badges", "status", "glass", "shadow", "animation", "icon_style", "responsive_rules"],
    $defs: {
      token: {
        type: "object", additionalProperties: false,
        properties: {
          name: { type: "string" },
          value: { type: "string", description: "The exact value(s): hex, px, weight, ratio, duration, easing." },
          use: { type: "string", description: "Where and when it is used, one sentence." },
        },
        required: ["name", "value", "use"],
      },
    },
  },
};

export const SCREEN_SCHEMA: JsonSchema = {
  name: "tapmart_screen_design",
  schema: {
    type: "object", additionalProperties: false,
    properties: {
      concept: { type: "string", description: "Two sentences: what this screen is, in the new design." },
      three_second_read: { type: "string", description: "What a first time viewer understands in three seconds." },
      layout_architecture: { type: "string", description: "The page structure top to bottom on the phone, with region names and heights." },
      visual_hierarchy: { type: "array", items: { type: "string" }, description: "Ordered: what the eye lands on first, second, third." },
      content_order: { type: "array", items: { $ref: "#/$defs/block" }, description: "Every block on the screen, in order, with its exact composition." },
      removed: { type: "array", items: { type: "string" }, description: "What existing UI or copy is deleted, and why." },
      moved_deeper: { type: "array", items: { type: "string" }, description: "What moves into a detail view, a sheet, or settings." },
      media: { type: "array", items: { type: "string" }, description: "Media proportions and treatment per media kind on this screen (ratio or height, crop, scrim, filter, which campaign image where)." },
      typography: { type: "array", items: { type: "string" }, description: "Each text role on this screen with px, weight, colour." },
      spacing: { type: "array", items: { type: "string" }, description: "Gutters, gaps and paddings on this screen." },
      cards_and_rows: { type: "array", items: { type: "string" }, description: "Which elements are cards, which are rows, which are bare media, and why." },
      cta: { type: "array", items: { type: "string" }, description: "Every action on the screen, its style (primary, secondary, tertiary), its placement and its label." },
      navigation: { type: "string", description: "Top chrome and bottom bar treatment on this screen." },
      animation: { type: "array", items: { type: "string" }, description: "Purposeful motion on this screen with trigger, duration, easing." },
      desktop: { type: "array", items: { type: "string" }, description: "The desktop composition at 1360 wide with the rail: columns, widths, what changes, what stays." },
      empty_states: { type: "array", items: { type: "string" }, description: "Honest empty and loading states for each block." },
      implementation: { type: "array", items: { $ref: "#/$defs/step" }, description: "Ordered engineering steps, each buildable without a question." },
    },
    required: ["concept", "three_second_read", "layout_architecture", "visual_hierarchy", "content_order", "removed", "moved_deeper", "media", "typography", "spacing", "cards_and_rows", "cta", "navigation", "animation", "desktop", "empty_states", "implementation"],
    $defs: {
      block: {
        type: "object", additionalProperties: false,
        properties: {
          name: { type: "string" },
          composition: { type: "string", description: "Exact composition: elements, sizes, positions, colours, media." },
          height: { type: "string", description: "Approximate height on the phone, in px or ratio." },
        },
        required: ["name", "composition", "height"],
      },
      step: {
        type: "object", additionalProperties: false,
        properties: { priority: { type: "integer", minimum: 1 }, change: { type: "string" }, where: { type: "string" } },
        required: ["priority", "change", "where"],
      },
    },
  },
};

export const SCREEN_REVIEW_SCHEMA: JsonSchema = {
  name: "tapmart_design_review",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      verdict: { type: "string", description: "One sentence: how far this screen is from TapMart's standard and why." },
      tapmart_match: { type: "integer", minimum: 1, maximum: 10, description: "10 = unmistakably TapMart." },
      generic_ai_look: { type: "integer", minimum: 1, maximum: 10, description: "10 = looks like a template or AI dashboard." },
      reference_match: { type: "integer", minimum: 1, maximum: 10, description: "10 = same visual confidence, hierarchy, polish and restraint as the reference image. Null-equivalent 1 when no reference was given." },
      premium_feel: { type: "integer", minimum: 1, maximum: 10, description: "10 = feels like a real high-end consumer product." },
      same_kit: { type: "boolean", description: "True only if a professional product designer would immediately believe this screen and the reference belong to the same application." },
      kit: {
        type: "object",
        additionalProperties: false,
        description: "Design drift from the blueprint, 0 = a different visual system, 10 = the blueprint's CSS.",
        properties: {
          typography: { $ref: "#/$defs/kit" },
          colors: { $ref: "#/$defs/kit" },
          surfaces: { $ref: "#/$defs/kit" },
          spacing: { $ref: "#/$defs/kit" },
          radii: { $ref: "#/$defs/kit" },
          navigation: { $ref: "#/$defs/kit" },
          buttons: { $ref: "#/$defs/kit" },
          rows: { $ref: "#/$defs/kit" },
          media: { $ref: "#/$defs/kit" },
          density: { $ref: "#/$defs/kit" },
          lime_restraint: { $ref: "#/$defs/kit" },
          family_resemblance: { $ref: "#/$defs/kit" },
        },
        required: ["typography", "colors", "surfaces", "spacing", "radii", "navigation", "buttons", "rows", "media", "density", "lime_restraint", "family_resemblance"],
      },
      three_second_read: { type: "string", description: "What a first-time viewer understands in three seconds, in one sentence, and what they miss." },
      scores: {
        type: "object",
        additionalProperties: false,
        properties: {
          clutter: { $ref: "#/$defs/score" },
          text_amount: { $ref: "#/$defs/score" },
          media_size: { $ref: "#/$defs/score" },
          hierarchy: { $ref: "#/$defs/score" },
          spacing: { $ref: "#/$defs/score" },
          card_overuse: { $ref: "#/$defs/score" },
          money_visibility: { $ref: "#/$defs/score" },
          cta_visibility: { $ref: "#/$defs/score" },
          lime_restraint: { $ref: "#/$defs/score" },
          secondary_text_quiet: { $ref: "#/$defs/score" },
          typography: { $ref: "#/$defs/score" },
          navigation_and_glass: { $ref: "#/$defs/score" },
        },
        required: ["clutter", "text_amount", "media_size", "hierarchy", "spacing", "card_overuse", "money_visibility", "cta_visibility", "lime_restraint", "secondary_text_quiet", "typography", "navigation_and_glass"],
      },
      keep: { type: "array", items: { type: "string" }, description: "Up to 5 things that already work and must not be changed." },
      animation: { type: "array", items: { type: "string" }, description: "Up to 4 specific, subtle motion suggestions with the element and the trigger." },
      checklist: {
        type: "array",
        description: "Prioritized implementation checklist, most impactful first. Each item is one concrete change a developer can make without asking a question.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            priority: { type: "integer", minimum: 1 },
            change: { type: "string", description: "Imperative, specific, measurable where possible: 'Make creator photos 40% taller (aspect 4:5)'." },
            where: { type: "string", description: "Which element or region of the screenshot." },
            why: { type: "string", description: "One clause tying it to a TapMart rule." },
          },
          required: ["priority", "change", "where", "why"],
        },
      },
    },
    required: ["verdict", "tapmart_match", "generic_ai_look", "reference_match", "premium_feel", "same_kit", "kit", "three_second_read", "scores", "keep", "animation", "checklist"],
    $defs: {
      kit: {
        type: "object",
        additionalProperties: false,
        properties: {
          score: { type: "integer", minimum: 0, maximum: 10, description: "0 = different visual system, 10 = same kit." },
          note: { type: "string", description: "One short sentence: the concrete difference from the reference, or 'matches'." },
        },
        required: ["score", "note"],
      },
      score: {
        type: "object",
        additionalProperties: false,
        properties: {
          score: { type: "integer", minimum: 1, maximum: 5, description: "5 = meets the TapMart rule fully." },
          note: { type: "string", description: "One short sentence naming the specific element." },
        },
        required: ["score", "note"],
      },
    },
  },
};

/** One creative concept: what to make, how, and which image route makes it. */
const CREATIVE_BRIEF = {
  type: "object", additionalProperties: false,
  properties: {
    title: { type: "string", description: "Short working title for the concept." },
    concept: { type: "string", description: "Two sentences: the idea and why it fits this business and objective." },
    subject: { type: "string", description: "What is in the frame: the product, the place, the person, the car." },
    environment: { type: "string", description: "Where it happens: setting, time of day, props, what is in the background." },
    composition: { type: "string", description: "Framing and layout: where the subject sits, negative space for copy, safe zones for the placement." },
    camera: { type: "string", description: "Angle, lens feel, distance, depth of field." },
    lighting: { type: "string", description: "Light source, direction, quality, mood." },
    color_treatment: { type: "string", description: "Palette and grade, tied to the brand colours where they exist." },
    headline: { type: "string", description: "The one line of copy on the image, or an empty string when none belongs on it." },
    cta: { type: "string", description: "The call to action on the image, or an empty string." },
    aspect_ratio: { type: "string", enum: ["9:16", "4:5", "1:1", "16:9", "3:2"] },
    preserve: { type: "array", items: { type: "string" }, description: "What must stay exactly as in the source images: product geometry, label, logo, faces, storefront details." },
    avoid: { type: "array", items: { type: "string" }, description: "What the image must not contain or look like." },
    image_route: { type: "string", enum: ["fast", "final"], description: "fast for concepts and previews, final for the asset the business will use." },
    generation_mode: { type: "string", enum: ["generate", "edit"], description: "edit when real source images exist and must be preserved; generate only when nothing real can be used." },
    prompt: { type: "string", description: "The complete prompt for the image model, self-contained, in plain descriptive language, no style-name spam, no instructions to add text unless headline or cta are set." },
    source_image_use: { type: "string", description: "How each provided source image is used in the edit (which is the base, which are references), or an empty string when generating." },
  },
  required: ["title", "concept", "subject", "environment", "composition", "camera", "lighting", "color_treatment", "headline", "cta", "aspect_ratio", "preserve", "avoid", "image_route", "generation_mode", "prompt", "source_image_use"],
};

export const CREATIVE_DIRECTION_SCHEMA: JsonSchema = {
  name: "tapmart_creative_direction",
  schema: {
    type: "object", additionalProperties: false,
    properties: {
      brand_read: { type: "string", description: "Three sentences on the existing brand as seen in the inputs: what it already is, what to keep, what to avoid inventing." },
      audience_read: { type: "string", description: "Who this is for and what would make them stop." },
      concepts: { type: "array", items: CREATIVE_BRIEF, description: "The requested number of distinct concepts, best first." },
    },
    required: ["brand_read", "audience_read", "concepts"],
  },
};

const SCORE = { type: "integer", minimum: 0, maximum: 10 };

export const CREATIVE_REVIEW_SCHEMA: JsonSchema = {
  name: "tapmart_creative_review",
  schema: {
    type: "object", additionalProperties: false,
    properties: {
      summary: { type: "string", description: "Two sentences: what the image is and how close it is to the brief." },
      scores: {
        type: "object", additionalProperties: false,
        properties: {
          purpose: { ...SCORE, description: "Accomplishes the requested purpose." },
          brand: { ...SCORE, description: "Matches the business brand as given, not an invented one." },
          professional: { ...SCORE, description: "Looks made by a professional team." },
          not_ai_looking: { ...SCORE, description: "10 = nothing gives away generation: hands, text, logos, surfaces, lighting all hold." },
          text_clean: { ...SCORE, description: "Any copy is spelled correctly, legible, minimal. 10 when no copy was asked for and none appears." },
          product_correct: { ...SCORE, description: "Product, logo, place or car represented correctly and preserved where required." },
          premium: { ...SCORE, description: "Meets TapMart's premium bar: real, clean, modern, visual." },
        },
        required: ["purpose", "brand", "professional", "not_ai_looking", "text_clean", "product_correct", "premium"],
      },
      problems: { type: "array", items: { type: "string" }, description: "Specific defects, most damaging first: name the region and what is wrong." },
      verdict: { type: "string", enum: ["approve", "edit", "regenerate"], description: "approve only when it can go in front of a business; edit when the image is right and specific regions need fixing; regenerate when the composition itself fails." },
      edit_instructions: { type: "string", description: "For edit: precise, region by region, what to change and what to leave untouched. Empty otherwise." },
      revised_prompt: { type: "string", description: "For regenerate: the complete new prompt. Empty otherwise." },
    },
    required: ["summary", "scores", "problems", "verdict", "edit_instructions", "revised_prompt"],
  },
};

export const COPY_SCHEMA: JsonSchema = {
  name: "tapmart_copy",
  schema: {
    type: "object", additionalProperties: false,
    properties: {
      options: { type: "array", items: { type: "object", additionalProperties: false, properties: { headline: { type: "string" }, cta: { type: "string" }, why: { type: "string" } }, required: ["headline", "cta", "why"] } },
    },
    required: ["options"],
  },
};
