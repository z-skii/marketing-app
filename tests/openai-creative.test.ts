import { describe, expect, it } from "vitest";
import { IMAGE_SIZE, MODELS, imageModel, route, routingTable, supportsReasoning } from "@/lib/openai/models";
import { CREATIVE_DIRECTION_SCHEMA, CREATIVE_REVIEW_SCHEMA, SCREEN_REVIEW_SCHEMA, SCREEN_SCHEMA } from "@/lib/openai/schemas";
import { REBOOT_A_SCHEMA, REBOOT_B_SCHEMA, REBOOT_C_SCHEMA } from "@/lib/openai/reboot-schemas";
import { REBOOT_INSTRUCTIONS } from "@/lib/openai/reboot";
import { totalUsage } from "@/lib/openai/assets";
import { creativeMarkdown, type CreativeJobResult } from "@/lib/openai/creative";

/**
 * The creative layer without the network: routing, schema shape, usage
 * arithmetic and the report. Live calls are exercised by the CLI.
 */

describe("model router", () => {
  it("routes judgment to the director and mechanical QA to the cheap reviewer", () => {
    expect(route("screen_design")).toEqual({ role: "director", model: MODELS.director, effort: "high" });
    expect(route("ui_system").effort).toBe("xhigh");
    expect(route("creative_direction").role).toBe("director");
    expect(route("creative_review").effort).toBe("medium");
    expect(route("creative_final_review").effort).toBe("high");
    expect(route("screen_review_final").effort).toBe("high");
    expect(route("minor_qa")).toEqual({ role: "qa", model: MODELS.qa, effort: "low" });
  });

  it("lets a caller lower or raise effort for one call", () => {
    expect(route("screen_review", "low").effort).toBe("low");
    expect(route("screen_design", "xhigh").effort).toBe("xhigh");
  });

  it("defaults to Astra, Sunburst and Flare unless the environment overrides", () => {
    expect(MODELS.director).toBe(process.env.OPENAI_DESIGN_DIRECTOR_MODEL || process.env.OPENAI_DESIGN_MODEL || "gpt-6-astra");
    expect(imageModel("final")).toBe(process.env.OPENAI_IMAGE_FINAL_MODEL || "gpt-image-2.5-sunburst");
    expect(imageModel("fast")).toBe(process.env.OPENAI_IMAGE_FAST_MODEL || "gpt-image-2.5-flare");
  });

  it("knows which models take a reasoning effort", () => {
    expect(supportsReasoning("gpt-6-astra")).toBe(true);
    expect(supportsReasoning("gpt-5.5")).toBe(true);
    expect(supportsReasoning("o3")).toBe(true);
    expect(supportsReasoning("gpt-4.1")).toBe(false);
  });

  it("maps every aspect TapMart asks for onto a canvas", () => {
    for (const a of ["9:16", "4:5", "1:1", "16:9", "3:2"] as const) expect(IMAGE_SIZE[a]).toMatch(/^\d+x\d+$/);
    expect(routingTable().map((r) => r.job)).toContain("minor_qa");
  });
});

describe("schemas", () => {
  it("are strict objects with every property required", () => {
    for (const s of [SCREEN_SCHEMA, SCREEN_REVIEW_SCHEMA, CREATIVE_DIRECTION_SCHEMA, CREATIVE_REVIEW_SCHEMA, REBOOT_A_SCHEMA, REBOOT_B_SCHEMA, REBOOT_C_SCHEMA]) {
      const schema = s.schema as { type: string; additionalProperties: boolean; properties: Record<string, unknown>; required: string[] };
      expect(schema.type).toBe("object");
      expect(schema.additionalProperties).toBe(false);
      expect(schema.required.sort()).toEqual(Object.keys(schema.properties).sort());
    }
  });

  it("the reboot never points the director at old visuals", () => {
    expect(REBOOT_INSTRUCTIONS).toContain("BLANK CANVAS");
    expect(REBOOT_INSTRUCTIONS).not.toMatch(/lime|graphite|blueprint|reference image/i);
  });

  it("the creative review can only approve, edit or regenerate", () => {
    const verdict = (CREATIVE_REVIEW_SCHEMA.schema as { properties: { verdict: { enum: string[] } } }).properties.verdict.enum;
    expect(verdict).toEqual(["approve", "edit", "regenerate"]);
  });
});

describe("usage and report", () => {
  const brief = {
    title: "Morning light", concept: "c", subject: "s", environment: "e", composition: "co", camera: "ca", lighting: "l", color_treatment: "ct", headline: "", cta: "",
    aspect_ratio: "9:16" as const, preserve: [], avoid: ["neon"], image_route: "fast" as const, generation_mode: "generate" as const, prompt: "p", source_image_use: "",
  };
  const review = { summary: "ok", scores: { purpose: 8, brand: 7, professional: 8, not_ai_looking: 6, text_clean: 10, product_correct: 9, premium: 7 }, problems: ["hand"], verdict: "edit" as const, edit_instructions: "fix the hand", revised_prompt: "" };
  const image = { bytes: Buffer.from("x"), contentType: "image/png" as const };
  const result: CreativeJobResult = {
    type: "STORY_AD", brandRead: "b", audienceRead: "a", brief, image, finalReview: review, approvedByDirector: false, asset: null,
    rounds: [{ round: 1, action: "generate", image, imageModel: "gpt-image-2.5-flare", size: "1024x1536", prompt: "p", review, usage: [{ model: "gpt-image-2.5-flare", images: 1 }, { model: "gpt-6-astra", input_tokens: 100, output_tokens: 20 }] }],
    usage: [{ model: "gpt-6-astra", input_tokens: 500, output_tokens: 50 }, { model: "gpt-image-2.5-flare", images: 1 }, { model: "gpt-6-astra", input_tokens: 100, output_tokens: 20 }],
  };

  it("sums usage across director and image calls", () => {
    expect(totalUsage(result.usage)).toEqual({ input_tokens: 600, output_tokens: 70, images: 1, calls: 3 });
  });

  it("writes a report that names the verdict, the brief and the draft status", () => {
    const md = creativeMarkdown({ type: "STORY_AD", business: { name: "Demo Coffee Co." }, objective: "", placement: "" }, result);
    expect(md).toContain("Director review: EDIT");
    expect(md).toContain("fix the hand");
    expect(md).toContain("draft until a person approves");
    expect(md.includes(String.fromCharCode(0x2014)) || md.includes(String.fromCharCode(0x2013))).toBe(false);
  });
});
