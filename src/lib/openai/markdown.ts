import path from "node:path";
import type { ScreenDesign, ScreenReview, SystemSpec } from "./director";

/** Markdown renderings of what the director returns, for the files under docs/design-specs and design-reviews. */

type Listed = string | { name?: string; value?: string; composition?: string; change?: string; use?: string; height?: string; where?: string };

function list(lines: string[], title: string, arr: Listed[] | undefined) {
  if (!arr?.length) return;
  lines.push(`## ${title}`, "");
  for (const x of arr) {
    if (typeof x === "string") lines.push(`- ${x}`);
    else lines.push(`- **${x.name}**: ${x.value ?? x.composition ?? x.change} ${x.use ? `(${x.use})` : ""}${x.height ? ` [${x.height}]` : ""}${x.where ? ` (${x.where})` : ""}`);
  }
  lines.push("");
}

export function systemMarkdown(spec: SystemSpec): string {
  const lines = ["# TapMart UI system", "", `**${spec.name}**`, ""];
  for (const k of Object.keys(spec)) if (Array.isArray(spec[k])) list(lines, k.replace(/_/g, " "), spec[k] as Listed[]);
  return lines.join("\n") + "\n";
}

export function screenDesignMarkdown(name: string, spec: ScreenDesign): string {
  const lines = [`# Design: ${name}`, "", `**Concept.** ${spec.concept}`, "", `**Three seconds.** ${spec.three_second_read}`, "", `**Layout.** ${spec.layout_architecture}`, ""];
  const s = spec as unknown as Record<string, unknown>;
  for (const k of Object.keys(s)) {
    const v = s[k];
    if (!Array.isArray(v)) continue;
    if (k === "implementation") list(lines, "implementation", [...spec.implementation].sort((a, b) => a.priority - b.priority).map((x) => `${x.priority}. ${x.change} (${x.where})`));
    else list(lines, k.replace(/_/g, " "), v as Listed[]);
  }
  if (spec.navigation) lines.push("## navigation", "", spec.navigation, "");
  return lines.join("\n") + "\n";
}

const bar = (n: number, max = 5) => "#".repeat(n) + ".".repeat(Math.max(0, max - n));

const num = (v: unknown): number => (typeof v === "number" ? v : v && typeof v === "object" && "score" in v ? Number((v as { score: number }).score) : NaN);
const why = (v: unknown): string => (v && typeof v === "object" && "why" in v ? String((v as { why: string }).why) : v && typeof v === "object" && "note" in v ? String((v as { note: string }).note) : "");

export function screenReviewMarkdown(review: ScreenReview, ctx: { screenName: string; screenshot: string; model: string; effort: string; when: string; instructions: string | null; specPath: string | null; hasReference: boolean; lab?: boolean }): string {
  const lines = [`# Design review: ${ctx.screenName}`, ""];
  lines.push(`Screenshot: \`${path.basename(ctx.screenshot)}\`${ctx.hasReference ? " · Reference: primary" : " · No reference image"}${ctx.specPath ? ` · Against: \`${path.basename(ctx.specPath)}\`` : ""} · Model: ${ctx.model} (${ctx.effort}) · ${ctx.when}`);
  if (ctx.instructions) lines.push(`Instructions: ${ctx.instructions}`);
  lines.push("", `**Verdict.** ${review.verdict}`, "");
  lines.push(`TapMart match ${review.tapmart_match}/10 · Reference match ${review.reference_match}/10 · Premium feel ${review.premium_feel}/10 · Generic AI look ${review.generic_ai_look}/10`, "");
  lines.push(`**${ctx.lab ? "Finished, distinctive TapMart screen" : "Same application as the reference"}: ${review.same_kit ? "yes" : "NO"}.**`, "");
  lines.push("| dimension | 0 to 10 | note |", "| --- | --- | --- |");
  for (const [k, v] of Object.entries(review.kit)) lines.push(`| ${k.replace(/_/g, " ")} | ${num(v)} | ${why(v)} |`);
  lines.push("", `**Three seconds.** ${review.three_second_read}`, "");
  lines.push("| rule | score |", "| --- | --- |");
  for (const [k, v] of Object.entries(review.scores)) lines.push(`| ${k.replace(/_/g, " ")} | ${bar(num(v))} ${num(v)}/5 |`);
  lines.push("");
  if (review.keep.length) { lines.push("## Keep", ""); for (const k of review.keep) lines.push(`- ${k}`); lines.push(""); }
  lines.push("## Checklist", "");
  for (const c of [...review.checklist].sort((a, b) => a.priority - b.priority)) lines.push(`${c.priority}. **${c.change}** (${c.where}). ${c.why}`);
  lines.push("");
  if (review.animation.length) { lines.push("## Motion", ""); for (const a of review.animation) lines.push(`- ${a}`); lines.push(""); }
  return lines.join("\n");
}
