# Twin Builder Phase 1C: precision evidence, $5 validation batch

Status: validation batch finished and stopped. Spend on the paid step: $0.3664 of the $5 cap
(15 calls, list price). The full pass was not run and needs approval first.
No Phase 2, no surfaces, no new 3D generation, nothing on production or main.

Scripts, results and inspection sheets are in `docs/captures/twin-builder/phase1c/`.

## 1. What ran

| Step | What | Cost |
| --- | --- | --- |
| Full resolution | 28 of the Class A Wikimedia references re-fetched at the largest rendition Wikimedia serves this client (3840 px, or 1920 px); provenance, licence, creator and sha256 kept per file in `provenance.json`. The original file endpoint answered 429 every time, so these are renditions, not the untouched originals. | $0 |
| Local SAM 2.1 pass | 102 components on 30 references, cropped from the Phase 1B skeleton projection, SAM 2.1 (hiera large) with a box prompt, an interior point, outward negatives and prompt jitter for stability | $0 |
| Local-first routing | ACCEPT only when the mask fits the registered geometry, SAM score is at least 0.85, the boundary is stable within 1.5 px and there is no rival mask; everything else goes to VISION | $0 |
| Wheels | SAM rim evidence, locked chassis, joint camera solve, held-out wheel test | $0 |
| Validation batch | 12 crop-mode calls (hardest cases) plus 3 whole-image calls covering 8 of the same regions | $0.3664 |
| Apply | Vision points go back into SAM 2.1 locally with four prompt strategies; SAM draws every final boundary | $0 |
| Measure | Multi-view refit per component, single-view floor, held-out camera re-registration | $0 |

## 2. Local-first routing (SAM only)

- SAM alone was confident on 9 of 102 components (9%). 93 (91%) went to vision:
  66 had a low score or an unstable boundary (dark glass on dark cars is the usual case), 16 had no mask
  that fit the registered geometry (the taillight priors are badly off), and 11 had a rival mask
  (headlight lens against headlight housing).
- Several correct masks sat just under the 0.85 gate. The gate was not lowered.

## 3. Validation batch: per case

Cost is the actual call cost. "Semantic" is an eyeball check of the final SAM boundary against the photograph.

| Case | Call | Cost | Result | Semantic |
| --- | --- | --- | --- | --- |
| Windshield, ref213 | crop | $0.0409 | accepted, SAM 0.71 | correct |
| Windshield, ref082 | crop | $0.0340 | accepted, SAM 0.94 | **wrong**: a reflection band across the glass, not the glass |
| Front side glass, ref117 | crop | $0.0324 | accepted, SAM 0.92 | correct (mirror sail notch) |
| Front side glass, ref072 | crop | $0.0156 | rejected, SAM 0.60 | partial mask, correctly rejected |
| Quarter glass, ref061 | crop | $0.0192 | rejected, SAM 0.33 | sliver, correctly rejected |
| Quarter glass, ref072 | crop | $0.0491 | rejected | vision placed it on a different pane than whole-image mode did: disagreement, needs human review |
| Headlight lens, ref084 (lens vs housing rival) | crop | $0.0135 | accepted, SAM 0.73 | correct |
| Headlight lens, ref213 | crop | $0.0250 | accepted, SAM 0.93 | correct (the vision pick among local masks was wrong; its points were right) |
| Taillight left, ref108 | crop | $0.0159 | accepted, SAM 0.88 | correct |
| Taillight left, ref088 | crop | $0.0170 | accepted, SAM 0.90 | correct |
| Taillight right, ref108 (problem case) | crop | $0.0168 | accepted, SAM 0.93 | partial: misses the smoked upper part of the trunk piece |
| Taillight right, ref061 | crop | $0.0145 | accepted, SAM 0.84 | correct, both pieces |

Crop mode: 10 of 12 accepted, 8 correct, 1 partial, 1 wrong. Average $0.0245 per region.

Whole-image mode (one image, numbered boxes, several regions per call): 3 calls, $0.0725, $0.0091 per region.
4 of 8 regions accepted (ref072 headlight, front side glass and quarter glass; ref108 left taillight),
3 of them correct and 1 in disagreement with crop mode. The grid on a 1600 px whole image is too coarse
for points on small parts: negatives landed on the lens itself. Whole-image mode costs about a third as
much per region and gives roughly half the usable results. Recommended only as a cheap first look, not for boundaries.

What the vision model adds: semantics. Its points were right far more often than its pick among the
local masks (ref213 headlight: pick wrong, points right). The pipeline therefore uses the points, and SAM
draws the boundary.

What it does not catch: ref082. The mask obeys every vision point and scores 0.94, and an area check
against the skeleton cannot flag it, because the correct taillight masks are also 0.24 to 0.32 of the
(oversized) Phase 1B taillight prior. Only multi-view consistency or a person catches this kind of error.

## 4. Measured reprojection error (1264 px working width)

Multi-view refit per component. Cameras fixed at Phase 1B; left and right share one curve through symmetry;
outliers above max(4 px, median + 3 robust sigma) are rejected.

| Component | Observations | Phase 1B | After refit | Each view fitted alone | Gate |
| --- | --- | --- | --- | --- | --- |
| Headlight lens | 10 (7 SAM-only, 3 vision+SAM) | 19.0 px | 14.3 px | 3.0 px (1.4 to 2.5 for 9 of 10) | 4 px |
| Taillight lens | 4 | 32.5 px | 11.4 px | 6.2 px | 4 px |
| Front side glass | 3 | 19.8 px | 7.4 px | 7.9 px | 3 px |
| Windshield | 2 (one of them the wrong ref082 mask) | 45.9 px | 14.1 px | 14.5 px | 3 px |
| Quarter glass | 1 (disputed) | 8.7 px | 3.7 px | n/a | 3 px |

Two different limits show up:

1. **Camera registration (headlights).** Each photograph fits its own boundary to about 2 px, but the
   photographs only agree to 14 px through their Phase 1B cameras. The boundaries are good enough; the
   cameras are not. The wheels showed the same thing (below).
2. **Curve model (taillights, glass, windshield).** Even a single view cannot get under 6 to 15 px. The
   taillight loop cannot bend into the real L-shaped lamp split by the trunk shut line, and the glass loops
   are over-regularised toward the prior. This is a free model change, not a paid one.

Held-out camera test (headlights): refitting the cameras together with the curves, trained on left-side
observations only, brings the trained left sides to 1.5 to 4.3 px. The held-out right sides go from
15.2 / 14.7 / 27.9 px to 10.5 / 6.8 / 15.9 px. That is better, but not at the gate. One precise component per
photograph cannot pin down a six-parameter camera. Several independent precise components per photograph can.

## 5. Wheels (zero cost)

Chassis locked (wheelbase 2857 mm, tracks 1617 / 1605 mm, tyre radius 338.5 mm). SAM rim evidence with shape
gates: 11 good observations on 8 references.

| | Mean | Median | Max |
| --- | --- | --- | --- |
| Phase 1B cameras | 36.5 mm | 36.2 mm | 79.8 mm |
| Joint camera fit (chassis locked) | 25.7 mm | 19.8 mm | 65.8 mm |
| Held-out wheel (camera fitted without it) | 39.8 mm | 41.6 mm | 74.0 mm |

The chassis did not need to move: the shared body offset came out at 2.5 mm and -0.5 mm. A radial distortion
term made nothing better (held out 41.2 mm). Fitting cameras to the wheels alone reaches 2 to 3 mm, but the body
residual rises 2 to 4 px, so that would just bend each camera onto its wheels. The target is ≤10 mm, and it
is **not met**. The limit is the same camera registration problem as the headlights.

## 6. Did full resolution help?

The same local SAM pass was run twice: on the 1280 px thumbnails and at full resolution (`thumb-vs-full.json`).
26 of the 30 references had a larger rendition (89 components).

| | Thumbnails | Full resolution |
| --- | --- | --- |
| SAM-only accepts (of 102) | 6 | 9 |
| Median boundary stability under prompt jitter (thumbnail px) | 2.02 px | 0.89 px |
| Median SAM score of the best mask | 0.35 | 0.32 |

Yes for precision: boundaries are more than twice as stable, and that is what a 3 px gate needs. No for confidence:
SAM is not more certain at full resolution, so the routing rate barely moves. The three new accepts are
ref020 rocker right, ref062 front side glass right and ref165 headlight left. The ref062 accept fits its own
view at only 12.5 px, so it should get a second look.

## 7. Can the pipeline reach greenhouse ≤3 px and lights ≤4 px?

Not with vision calls alone. The batch shows:

- Semantics: yes. Vision plus SAM gives correct boundaries for about 3 of 4 hard regions, at about $0.025 each.
- Single-view boundary precision: yes for lamps (about 2 px).
- Multi-view agreement: no. It needs the cameras re-registered from several precise components per photograph,
  and it needs taillight and glass curves with enough freedom. Both steps are local and free.

## 8. Revised cost to finish Phase 1C

- Remaining vision-routed components from the local pass: 93, less the 10 done = about 83. At the measured
  $0.0245 average, that is about $2.05. A 25% allowance for re-asks on disagreements brings it to about $2.60.
- Components not yet covered (grille, pillars, roof edge, beltline, door, hood and trunk shut lines, rocker
  top and bottom) on the same 30 references: about 150 regions, of which about 90% will route to vision, so
  roughly $3.30.
- **Revised total for the full Phase 1C paid pass: about $6, with a hard cap of $8**, instead of the
  $30 to $40 estimated before the batch. The earlier estimate assumed two calls per crop, higher output and
  medium effort. The measured calls used low effort and short outputs.
- The paid pass is only worth it together with the free work in section 7 (camera re-registration from
  several components per photograph, and the curve model fix). Without those, more evidence will not move the
  gate numbers.
