// Which OpenAI model plays which role in TapMart's design workflow.
//
// DESIGN DIRECTOR: designs screens from scratch (design-spec) and compares an
// implementation against its own design (design-review --director). Full
// reasoning; used for major screens only.
//
// QA REVIEWER: cheap screenshot checks after small changes (design-review
// without --director). Lower reasoning so routine passes stay inexpensive.
//
// Override either with an environment variable; never hardcode a model in a
// screen or a doc.

export const DIRECTOR_MODEL = process.env.OPENAI_DESIGN_MODEL || "gpt-6-astra";
export const DIRECTOR_EFFORT = process.env.OPENAI_DESIGN_EFFORT || "high";

export const QA_MODEL = process.env.OPENAI_REVIEW_MODEL || "gpt-5.5";
export const QA_EFFORT = process.env.OPENAI_REVIEW_EFFORT || "medium";

/** Reasoning models take a reasoning.effort; older chat models take a temperature. */
export function supportsReasoning(model) {
  return /^(gpt-[5-9]|o[1-9])/.test(model);
}
