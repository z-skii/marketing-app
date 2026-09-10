import "server-only";
import { z } from "zod";
import type {
  ReconstructionProvider, ReconstructionStatus, VehicleModelAsset, VehicleScan,
} from "./types";

/**
 * 3D reconstruction providers. A model is only ever produced by a real
 * provider; with none configured the pipeline stops at `waiting_provider`.
 *
 *   unconfigured   available() false; carries the plain-language reason
 *   httpProvider   generic HTTP scaffold, selected with RECON_PROVIDER=http.
 *                  Talks to RECON_API_URL with a bearer RECON_API_KEY using
 *                  the contract below (also in docs/vehicles.md).
 *
 * HTTP contract
 *   POST {RECON_API_URL}/jobs
 *     headers: Authorization: Bearer {RECON_API_KEY}, Content-Type: application/json
 *     body:    { "scan_id": string,
 *                "photos": [{ "angle": string, "url": string }],
 *                "detail_photos": [{ "label": string, "url": string }],
 *                "video_urls": [string],
 *                "callback_url": string | null }
 *     200/201: { "job_id": string }
 *
 *   GET {RECON_API_URL}/jobs/{job_id}
 *     headers: Authorization: Bearer {RECON_API_KEY}
 *     200: { "status": "queued" | "running" | "done" | "failed",
 *            "progress": 0..100,
 *            "error": string | null,
 *            "model": null | { "glb_url": string, "poster_url": string | null,
 *                              "lod_urls": [string], "quality_label": string | null } }
 *
 * Photo and video URLs must be reachable by the provider, so local dev
 * uploads under /uploads cannot be reconstructed even with a provider set.
 */

const REQUEST_TIMEOUT_MS = 20_000;

const SubmitResponse = z.object({ job_id: z.string().min(1) });

const PollResponse = z.object({
  status: z.enum(["queued", "running", "done", "failed"]),
  progress: z.number().min(0).max(100).catch(0),
  error: z.string().nullable().optional(),
  model: z
    .object({
      glb_url: z.string().url(),
      poster_url: z.string().url().nullable().optional(),
      lod_urls: z.array(z.string().url()).catch([]),
      quality_label: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const UNCONFIGURED_LABEL =
  "No reconstruction provider configured. Set RECON_PROVIDER and RECON_API_KEY.";

export const unconfigured: ReconstructionProvider = {
  id: "unconfigured",
  label: UNCONFIGURED_LABEL,
  available() {
    return false;
  },
  async submit() {
    throw new Error(UNCONFIGURED_LABEL);
  },
  async poll() {
    return { status: "failed" as ReconstructionStatus, progress: 0, model: null, error: UNCONFIGURED_LABEL };
  },
};

function httpConfig(): { url: string; key: string } | null {
  const provider = (process.env.RECON_PROVIDER ?? "").trim().toLowerCase();
  const url = (process.env.RECON_API_URL ?? "").trim().replace(/\/+$/, "");
  const key = (process.env.RECON_API_KEY ?? "").trim();
  if (provider !== "http" || !url || !key) return null;
  return { url, key };
}

async function httpJson(url: string, key: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${key}`,
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`Reconstruction provider answered ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const httpProvider: ReconstructionProvider = {
  id: "http",
  label: "HTTP reconstruction provider",
  available() {
    return httpConfig() !== null;
  },
  async submit(scan: VehicleScan) {
    const cfg = httpConfig();
    if (!cfg) throw new Error(UNCONFIGURED_LABEL);
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
    const body = {
      scan_id: scan.id,
      photos: scan.capture.photos ?? [],
      detail_photos: scan.capture.detail_photos ?? [],
      video_urls: scan.capture.video_urls ?? [],
      callback_url: site ? `${site}/api/jobs/run` : null,
    };
    const data = await httpJson(`${cfg.url}/jobs`, cfg.key, { method: "POST", body: JSON.stringify(body) });
    const parsed = SubmitResponse.safeParse(data);
    if (!parsed.success) throw new Error("Reconstruction provider did not return a job id.");
    return { external_id: parsed.data.job_id };
  },
  async poll(externalId: string) {
    const cfg = httpConfig();
    if (!cfg) throw new Error(UNCONFIGURED_LABEL);
    const data = await httpJson(`${cfg.url}/jobs/${encodeURIComponent(externalId)}`, cfg.key, { method: "GET" });
    const parsed = PollResponse.safeParse(data);
    if (!parsed.success) throw new Error("Reconstruction provider returned an unexpected status shape.");
    const r = parsed.data;
    let model: VehicleModelAsset | null = null;
    if (r.status === "done") {
      if (!r.model) throw new Error("Reconstruction provider reported done without a model.");
      model = {
        glb_url: r.model.glb_url,
        poster_url: r.model.poster_url ?? null,
        lod_urls: r.model.lod_urls,
        provider: this.id,
        quality_label: r.model.quality_label ?? "Standard scan",
        built_at: new Date().toISOString(),
      };
    }
    return { status: r.status, progress: Math.round(r.progress), model, error: r.error ?? null };
  },
};

export function reconstructionProvider(): ReconstructionProvider {
  return httpProvider.available() ? httpProvider : unconfigured;
}

export function reconstructionProviderStatus(): { id: string; available: boolean; label: string } {
  const provider = reconstructionProvider();
  return { id: provider.id, available: provider.available(), label: provider.label };
}
