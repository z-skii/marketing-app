# Smart vehicle system

A person walks around their car with a phone. The app turns that into a
recognized year / make / model, a poster image, and (when a reconstruction
provider is configured) a 3D model businesses can place artwork on.

Nothing in this system fakes a result. If a provider is missing, the scan
stops at an honest state and says so in plain language. The vehicle keeps its
poster photo.

## Where things live

| Piece | File |
| --- | --- |
| Shared types (the contract) | `src/lib/vehicles/types.ts` |
| Capture quality rules | `src/lib/vehicles/quality.ts` |
| Recognition providers | `src/lib/vehicles/recognition.ts` |
| Year / make / model catalog | `src/lib/vehicles/catalog.ts` |
| Reconstruction providers | `src/lib/vehicles/reconstruction.ts` |
| Scan records and the pipeline | `src/lib/vehicles/scans.ts` |
| Job queue | `src/lib/jobs.ts`, handlers in `src/lib/jobs/handlers.ts` |
| Worker route (cron) | `src/app/api/jobs/run/route.ts` |
| Dev worker route | `src/app/api/dev/jobs/route.ts` |
| Server actions | `src/app/(v2)/me/vehicles/scan/actions.ts` |
| Schema | `supabase/migrations/0023_vehicle_scans.sql` |
| Tests | `tests/vehicle-scans.test.ts` |

## Pipeline

`createScan` inserts a `vehicle_scans` row and enqueues a `vehicle_scan.process`
job. The worker moves the scan through these stages. `status` is one of the
`ScanStatus` values; `stage` is the sentence the UI shows; `progress` is 0 to 100.

| Status | Progress | What happens |
| --- | --- | --- |
| `queued` | 0 | Waiting for a worker. |
| `validating` | 10 | `assessCapture` scores the capture (see Quality rules). |
| `needs_retake` | 25 | Coverage under 75 percent. The stage text lists the missing angles and the owner gets a "Rescan these angles" notification. `retakeScan` merges new photos and re-queues. |
| `recognizing` | 40 to 55 | The recognition provider looks at up to four photos. The result is stored even when it is null; null means "we could not tell", never a guess. |
| `reconstructing` | 60 to 97 | A provider is configured: the capture is submitted, `external_id` stored, and a `vehicle_scan.poll` job runs every 60 seconds until the provider is done. |
| `waiting_provider` | 60 | No reconstruction provider. Stage reads "Waiting for reconstruction provider"; the owner is told once: "Your scan is saved. 3D reconstruction is not set up in this environment yet." |
| `complete` | 100 | The model is stored on the scan and on `vehicles.model_glb_url` / `vehicles.poster_url`; the owner is told "Your 3D car is ready". |
| `failed` | | `error` explains why. Job retries back off exponentially. |

`confirmRecognition` is the person's confirmation (or correction) of what the
car is. It writes year / make / model / body type / color / trim onto the
vehicle, or creates a draft vehicle owned by the person when the scan was not
attached to one, links `vehicles.scan_id`, and sets `poster_url` to the front
photo until a real model replaces it.

Notifications are deduplicated per scan and title, so re-running a job never
repeats a message.

## Quality rules (`assessCapture`)

Deterministic, no image analysis:

- Eight walk-around angles (`SCAN_ANGLES`), each worth 12.5 percent of coverage.
- `missing_angle` issue per angle without a photo, labelled with `SCAN_ANGLE_LABEL`.
- `too_few_photos` when there are fewer than 8 photos and no video.
- `no_media` when there are no photos and no video.
- Labels: "Excellent coverage" at 100, "Good coverage" at 75 or more, otherwise "Needs more angles".
- A video counts as full coverage only when `video_urls` is non-empty and at
  least 4 photos exist. Video cannot be analyzed server-side (no ffmpeg in this
  runtime), so we still require photos for recognition and the poster.

The pipeline asks for a retake when coverage is under 75.

## Provider interfaces

All three interfaces are in `src/lib/vehicles/types.ts`. Every provider has
`available()`; the pipeline checks it before doing anything.

### Recognition (`VehicleRecognitionProvider`)

- `anthropicVision`: available when `ANTHROPIC_API_KEY` is set. Uses the
  Anthropic SDK with model `claude-opus-5` (override with `AI_MODEL`) and
  adaptive thinking, sends up to four image URLs, asks for strict JSON
  `{year_min, year_max, make, model, body_type, color, trim, confidence}` and
  parses it defensively with zod. Only `http(s)` URLs are sent (local
  `/uploads` paths are skipped). Any failure returns null.
- `unavailable`: always null.

`recognizeVehicle(imageUrls)` and `recognitionProviderStatus()` pick the
provider. Confidence under 0.6 is the UI's cue to ask rather than assert.

### Catalog (`VehicleCatalogProvider`)

- `localCatalog`: rows in `vehicle_catalog` with `source = 'local'`.
- `vpicCatalog`: NHTSA vPIC (`https://vpic.nhtsa.dot.gov/api`). Written
  against the documented JSON shape of `GetMakesForVehicleType/car` and
  `GetModelsForMakeYear/make/{make}/modelyear/{year}` with a 6 second
  timeout. `available()` is true only when `VEHICLE_CATALOG_PROVIDER=vpic`
  and a cached reachability probe (10 minute TTL) succeeded.

`catalogProvider()` returns vpic when configured and reachable, else local.
`catalogMakes(year)`, `catalogModels(year, make)` fall back to local on a
vpic error. `findCatalogEntry(year, make, model)` checks local rows first
(they have a database id and dimensions), then vpic.

### Reconstruction (`ReconstructionProvider`)

- `unconfigured`: `available()` false, label "No reconstruction provider
  configured. Set RECON_PROVIDER and RECON_API_KEY."
- `httpProvider`: selected by `RECON_PROVIDER=http` with `RECON_API_URL` and
  `RECON_API_KEY`. Generic scaffold using the contract below.

`reconstructionProvider()` and `reconstructionProviderStatus()` pick between
them. A model is never produced without a provider.

#### HTTP provider contract

Submit:

```
POST {RECON_API_URL}/jobs
Authorization: Bearer {RECON_API_KEY}
Content-Type: application/json

{
  "scan_id": "uuid",
  "photos": [{ "angle": "front", "url": "https://..." }, ...],
  "detail_photos": [{ "label": "wheel", "url": "https://..." }],
  "video_urls": ["https://..."],
  "callback_url": "https://your-site/api/jobs/run" | null
}

200 or 201: { "job_id": "provider-job-id" }
```

Poll:

```
GET {RECON_API_URL}/jobs/{job_id}
Authorization: Bearer {RECON_API_KEY}

200: {
  "status": "queued" | "running" | "done" | "failed",
  "progress": 0..100,
  "error": string | null,
  "model": null | {
    "glb_url": "https://...",
    "poster_url": "https://..." | null,
    "lod_urls": ["https://..."],
    "quality_label": "High-quality scan" | "Standard scan" | null
  }
}
```

The photo and video URLs must be reachable by the provider. Local development
uploads under `/uploads` are not, so reconstruction cannot run against them
even with a provider set.

## Job queue

`jobs` table with `FOR UPDATE SKIP LOCKED` claiming, so several workers can
run at once. On failure a job goes back to `queued` with
`run_after = now + 2^attempts minutes`; after `max_attempts` (default 5) it is
marked `failed` with its error.

- `enqueueJob(kind, payload, { runAfter?, maxAttempts? })`
- `registerJobHandler(kind, handler)` (registrations live in `src/lib/jobs/handlers.ts`)
- `runDueJobs(limit)` returns `{ ran, failed }`

`/api/jobs/run` (GET or POST, `CRON_SECRET` as a bearer token or `?secret=`)
runs up to 20 jobs; `vercel.json` schedules it every five minutes. In
development `/api/dev/jobs` and the `runScanNow` action run due jobs on demand
when `AUTH_DEV_MODE=true`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VEHICLE_CATALOG_PROVIDER` | `vpic` to use NHTSA vPIC when reachable; anything else means the local seed. |
| `RECON_PROVIDER` | `http` selects the generic HTTP reconstruction provider. Unset means no reconstruction. |
| `RECON_API_URL` | Base URL of the reconstruction service. |
| `RECON_API_KEY` | Bearer token for the reconstruction service. |
| `ANTHROPIC_API_KEY` | Enables Claude-based recognition. |
| `AI_MODEL` | Optional override of the recognition model (default `claude-opus-5`). |
| `CRON_SECRET` | Protects `/api/jobs/run` and `/api/cron`. |
| `AUTH_DEV_MODE` | `true` enables the dev-only routes and `runScanNow`. Never active in production builds. |

## What is a development seed

`vehicle_catalog` ships with about 45 rows marked `source = 'local'`: a
hand-typed sample of common US vehicles from 2018 to 2025 with approximate
exterior dimensions. It exists so the catalog works offline and in tests. It
is not a licensed vehicle catalog and should not be presented as complete.
Production should set `VEHICLE_CATALOG_PROVIDER=vpic`.

Tests (`tests/vehicle-scans.test.ts`) use only the local catalog and run with
no recognition or reconstruction provider, so they exercise the honest
`waiting_provider` path.
