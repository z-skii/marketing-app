import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { pool, rebuildSchema, truncateAll, q, createUser, TEST_DB } from "./helpers/db";
import { assessCapture } from "../src/lib/vehicles/quality";
import { SCAN_ANGLES, type ScanCapture } from "../src/lib/vehicles/types";

/**
 * The smart vehicle system: capture quality, the scan pipeline with no
 * providers configured (the honest path), the job queue and the local
 * catalog. Application modules use src/lib/db.ts, so point it at the test
 * database before anything queries.
 */

process.env.DATABASE_URL = `postgresql://app:app@127.0.0.1:5432/${TEST_DB}`;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.RECON_PROVIDER;
delete process.env.RECON_API_URL;
delete process.env.RECON_API_KEY;
delete process.env.VEHICLE_CATALOG_PROVIDER;

const db = await import("../src/lib/db");
const jobs = await import("../src/lib/jobs");
const scans = await import("../src/lib/vehicles/scans");
const catalog = await import("../src/lib/vehicles/catalog");
const opportunities = await import("../src/lib/v2/opportunities");
await import("../src/lib/jobs/handlers");

beforeAll(() => rebuildSchema());
beforeEach(() => truncateAll());
afterAll(async () => {
  await db.pool().end();
  await pool.end();
});

function capture(angles: readonly string[], extra: Partial<ScanCapture> = {}): ScanCapture {
  return {
    photos: angles.map((angle) => ({ angle: angle as ScanCapture["photos"][number]["angle"], url: `https://cdn.example.test/${angle}.jpg` })),
    detail_photos: [],
    video_urls: [],
    device: null,
    ...extra,
  };
}

describe("assessCapture", () => {
  it("scores each angle at 12.5 percent and labels full coverage excellent", () => {
    const quality = assessCapture(capture(SCAN_ANGLES));
    expect(quality.coverage_pct).toBe(100);
    expect(quality.photo_count).toBe(8);
    expect(quality.issues).toEqual([]);
    expect(quality.label).toBe("Excellent coverage");
  });

  it("lists missing angles by label and grades six of eight as good", () => {
    const quality = assessCapture(capture(SCAN_ANGLES.slice(0, 6)));
    expect(quality.coverage_pct).toBe(75);
    expect(quality.label).toBe("Good coverage");
    const missing = quality.issues.filter((i) => i.code === "missing_angle");
    expect(missing.map((i) => i.angle)).toEqual(["right", "front_right"]);
    expect(missing.map((i) => i.label)).toEqual(["Missing Passenger side", "Missing Front right"]);
    expect(quality.issues.some((i) => i.code === "too_few_photos")).toBe(true);
  });

  it("asks for more angles under 75 and reports no media when empty", () => {
    const three = assessCapture(capture(["front", "rear", "left"]));
    expect(three.coverage_pct).toBe(38);
    expect(three.label).toBe("Needs more angles");
    expect(three.issues.filter((i) => i.code === "missing_angle")).toHaveLength(5);

    const empty = assessCapture(capture([]));
    expect(empty.coverage_pct).toBe(0);
    expect(empty.issues[0].code).toBe("no_media");
    expect(empty.has_video).toBe(false);
  });

  it("counts video as full coverage only alongside at least four photos", () => {
    const withVideo = assessCapture(capture(["front", "rear", "left", "right"], { video_urls: ["https://cdn.example.test/walk.mp4"] }));
    expect(withVideo.coverage_pct).toBe(100);
    expect(withVideo.has_video).toBe(true);
    expect(withVideo.issues).toEqual([]);

    const videoOnly = assessCapture(capture(["front"], { video_urls: ["https://cdn.example.test/walk.mp4"] }));
    expect(videoOnly.coverage_pct).toBe(13);
    expect(videoOnly.label).toBe("Needs more angles");
  });
});

describe("createScan", () => {
  it("stores the capture and enqueues a process job", async () => {
    const owner = await createUser();
    const scan = await scans.createScan(owner, null, capture(SCAN_ANGLES));
    expect(scan.status).toBe("queued");
    expect(scan.owner_id).toBe(owner);
    expect(scan.vehicle_id).toBeNull();
    expect(scan.capture.photos).toHaveLength(8);
    expect(scan.recognition).toBeNull();

    const rows = await q<{ kind: string; status: string; payload: { scanId: string } }>(
      `select kind, status, payload from jobs`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("vehicle_scan.process");
    expect(rows[0].status).toBe("queued");
    expect(rows[0].payload.scanId).toBe(scan.id);
  });

  it("refuses a vehicle the person does not own", async () => {
    const owner = await createUser();
    const other = await createUser();
    const [v] = await q<{ id: string }>(
      `insert into vehicles (owner_id, year, make, model) values ($1, 2020, 'Honda', 'Civic') returning id`, [other],
    );
    await expect(scans.createScan(owner, v.id, capture(SCAN_ANGLES))).rejects.toThrow("Not your vehicle.");
  });
});

describe("processScan", () => {
  it("with eight angles and no providers ends in waiting_provider, recognition null, owner told once", async () => {
    const owner = await createUser();
    const scan = await scans.createScan(owner, null, capture(SCAN_ANGLES));

    const after = await scans.processScan(scan.id);
    expect(after?.status).toBe("waiting_provider");
    expect(after?.stage).toBe("Waiting for reconstruction provider");
    expect(after?.progress).toBe(60);
    expect(after?.recognition).toBeNull();
    expect(after?.model).toBeNull();
    expect(after?.quality?.coverage_pct).toBe(100);
    expect(after?.provider).toBe("unconfigured");

    const notes = await q<{ title: string; body: string; href: string }>(
      `select title, body, href from notifications where profile_id = $1`, [owner],
    );
    expect(notes).toHaveLength(1);
    expect(notes[0].body).toBe("Your scan is saved. 3D reconstruction is not set up in this environment yet.");
    expect(notes[0].href).toBe(`/me/vehicles/scan/${scan.id}`);

    // Running again (a retry) does not repeat the message.
    await scans.processScan(scan.id);
    const again = await q(`select 1 from notifications where profile_id = $1`, [owner]);
    expect(again).toHaveLength(1);
  });

  it("with three photos ends in needs_retake listing the missing angles", async () => {
    const owner = await createUser();
    const scan = await scans.createScan(owner, null, capture(["front", "left", "rear"]));

    const after = await scans.processScan(scan.id);
    expect(after?.status).toBe("needs_retake");
    expect(after?.progress).toBe(25);
    expect(after?.stage).toBe("Rescan these angles: Front left, Rear left, Rear right, Passenger side, Front right");
    expect(after?.quality?.issues.filter((i) => i.code === "missing_angle").map((i) => i.angle))
      .toEqual(["front_left", "rear_left", "rear_right", "right", "front_right"]);
    expect(after?.recognition).toBeNull();

    const notes = await q<{ title: string; body: string }>(`select title, body from notifications where profile_id = $1`, [owner]);
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("Rescan these angles");
    expect(notes[0].body).toContain("Front left");
  });

  it("a retake merges photos, re-queues, and then passes validation", async () => {
    const owner = await createUser();
    const scan = await scans.createScan(owner, null, capture(["front", "left", "rear"]));
    await scans.processScan(scan.id);

    const retaken = await scans.addCapture(scan.id, owner, capture(SCAN_ANGLES.slice(1)).photos);
    expect(retaken.status).toBe("queued");
    expect(retaken.capture.photos).toHaveLength(8);
    const queued = await q(`select 1 from jobs where status = 'queued' and kind = 'vehicle_scan.process'`);
    expect(queued).toHaveLength(2);

    const after = await scans.processScan(scan.id);
    expect(after?.status).toBe("waiting_provider");
  });
});

describe("confirmRecognition", () => {
  it("creates a draft vehicle with the front photo as poster when the scan has no vehicle", async () => {
    const owner = await createUser();
    const scan = await scans.createScan(owner, null, capture(SCAN_ANGLES));
    await scans.processScan(scan.id);

    const { scan: confirmed, vehicleId } = await scans.confirmRecognition(scan.id, owner, {
      year_min: 2021, make: "Honda", model: "Civic", body_type: "Sedan", color: "Blue",
    });
    expect(confirmed.vehicle_id).toBe(vehicleId);
    expect(confirmed.recognition?.make).toBe("Honda");
    expect(confirmed.recognition?.year_max).toBe(2021);
    expect(confirmed.recognition?.confidence).toBe(1);

    const [v] = await q<{
      owner_id: string; year: number; make: string; model: string; body_type: string; color: string;
      status: string; poster_url: string; scan_id: string; model_glb_url: string | null;
    }>(`select owner_id, year, make, model, body_type, color, status, poster_url, scan_id, model_glb_url
          from vehicles where id = $1`, [vehicleId]);
    expect(v.owner_id).toBe(owner);
    expect(v.status).toBe("draft");
    expect(v.year).toBe(2021);
    expect(v.make).toBe("Honda");
    expect(v.model).toBe("Civic");
    expect(v.body_type).toBe("Sedan");
    expect(v.color).toBe("Blue");
    expect(v.poster_url).toBe("https://cdn.example.test/front.jpg");
    expect(v.scan_id).toBe(scan.id);
    expect(v.model_glb_url).toBeNull();

    const mine = await opportunities.getMyVehicles(owner);
    expect(mine).toHaveLength(1);
    expect(mine[0].poster_url).toBe("https://cdn.example.test/front.jpg");
    expect(mine[0].photo_url).toBe("https://cdn.example.test/front.jpg");
    expect(mine[0].model_glb_url).toBeNull();
    expect(mine[0].scan_status).toBe("waiting_provider");
    expect(mine[0].scan_id).toBe(scan.id);
  });

  it("updates an existing vehicle and refuses without make and model", async () => {
    const owner = await createUser();
    const [v] = await q<{ id: string }>(
      `insert into vehicles (owner_id, year, make, model, color) values ($1, 2018, 'Toyota', 'Camry', 'Silver') returning id`,
      [owner],
    );
    const scan = await scans.createScan(owner, v.id, capture(SCAN_ANGLES));
    await expect(scans.confirmRecognition(scan.id, owner, { year_min: 2021 })).rejects.toThrow("Add the make and model.");

    const { vehicleId } = await scans.confirmRecognition(scan.id, owner, { year_min: 2021, make: "Toyota", model: "Camry", trim: "SE" });
    expect(vehicleId).toBe(v.id);
    const [row] = await q<{ year: number; trim: string; color: string; poster_url: string }>(
      `select year, trim, color, poster_url from vehicles where id = $1`, [v.id],
    );
    expect(row.year).toBe(2021);
    expect(row.trim).toBe("SE");
    expect(row.color).toBe("Silver");
    expect(row.poster_url).toBe("https://cdn.example.test/front.jpg");
  });
});

describe("runDueJobs", () => {
  it("claims due jobs, runs the scan pipeline, and records the result", async () => {
    const owner = await createUser();
    const scan = await scans.createScan(owner, null, capture(SCAN_ANGLES));

    const result = await jobs.runDueJobs(5);
    expect(result).toEqual({ ran: 1, failed: 0 });

    const [job] = await q<{ status: string; attempts: number; result: { status: string }; locked_at: string | null }>(
      `select status, attempts, result, locked_at from jobs`,
    );
    expect(job.status).toBe("done");
    expect(job.attempts).toBe(1);
    expect(job.result.status).toBe("waiting_provider");
    expect(job.locked_at).toBeNull();

    const after = await scans.getScan(scan.id, owner);
    expect(after?.status).toBe("waiting_provider");
    expect(await jobs.runDueJobs(5)).toEqual({ ran: 0, failed: 0 });
  });

  it("leaves future jobs alone and backs off a failing job", async () => {
    await jobs.enqueueJob("vehicle_scan.process", { scanId: "later" }, { runAfter: new Date(Date.now() + 3_600_000) });
    expect(await jobs.runDueJobs(5)).toEqual({ ran: 0, failed: 0 });

    const { id } = await jobs.enqueueJob("no.such.kind", {}, { maxAttempts: 2 });
    expect(await jobs.runDueJobs(5)).toEqual({ ran: 0, failed: 1 });
    let job = await jobs.getJob(id);
    expect(job?.status).toBe("queued");
    expect(job?.attempts).toBe(1);
    expect(job?.error).toContain("No handler registered");
    expect(new Date(job!.run_after).getTime()).toBeGreaterThan(Date.now() + 60_000);

    // Pull the retry forward and exhaust it.
    await q(`update jobs set run_after = now() where id = $1`, [id]);
    expect(await jobs.runDueJobs(5)).toEqual({ ran: 0, failed: 1 });
    job = await jobs.getJob(id);
    expect(job?.status).toBe("failed");
    expect(job?.attempts).toBe(2);
  });

  it("does not hand the same job to two concurrent workers", async () => {
    const owner = await createUser();
    await scans.createScan(owner, null, capture(SCAN_ANGLES));
    await scans.createScan(owner, null, capture(SCAN_ANGLES));
    const [a, b] = await Promise.all([jobs.runDueJobs(5), jobs.runDueJobs(5)]);
    expect(a.ran + b.ran).toBe(2);
    expect(a.failed + b.failed).toBe(0);
    const done = await q(`select 1 from jobs where status = 'done' and attempts = 1`);
    expect(done).toHaveLength(2);
  });
});

describe("local catalog", () => {
  it("answers makes and models from the development seed", async () => {
    expect(catalog.catalogProviderStatus().id).toBe("local");
    const makes = await catalog.catalogMakes(2022);
    expect(makes).toContain("Honda");
    expect(makes).toContain("Toyota");
    expect(makes).toEqual([...makes].sort());

    const models = await catalog.catalogModels(2022, "honda");
    expect(models.map((m) => m.model)).toEqual(["Civic"]);
    expect(models[0].source).toBe("local");
    expect(models[0].body_type).toBe("Hatchback");
    expect(models[0].dims?.length_mm).toBe(4550);

    const entry = await catalog.findCatalogEntry(2025, "TESLA", "model y");
    expect(entry?.make).toBe("Tesla");
    expect(entry?.year).toBe(2025);
    expect(await catalog.findCatalogEntry(1999, "Tesla", "Model Y")).toBeNull();
    expect(await catalog.catalogMakes(1999)).toEqual([]);
  });
});
