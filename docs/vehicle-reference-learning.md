# Vehicle reference learning: research and proposed Phase 1B changes

Status: research only. No code, no credits, no downloads of questionable models, no Phase 2.
Date: 2026-09-24. Companion to `docs/vehicle-twin-engine-v1-plan.md` (revision 2) and
`docs/twin-builder-phase1.md`.

This document is engineering research. Where it touches licences and law it records what the sources say and
how the engine should behave; it is not legal advice, and a lawyer should review the reference pack policy
before third party images are stored at scale.

## Headline

The reference learning stage is practical and mostly zero cost, and it fixes the two weaknesses Phase 1
exposed: a generic sedan prior deciding what a G80 looks like, and synthetic images with the wrong
proportions deciding the dimensions. Three sources carry almost all the value, and all three are legally
clean for the way we would use them:

1. Official specifications (BMW press specification sheet, brochure, wheel and tyre fitment data): facts,
   freely usable, already verified below.
2. Openly licensed photography of real G80s (Wikimedia Commons, Flickr through Openverse): hundreds of
   images under CC BY and CC BY SA with machine readable licence metadata, usable as measurement and
   validation evidence with attribution kept in provenance.
3. Our own paid AI 3D candidates (the Meshy and Tripo G80 meshes we already own, plus new ones only if
   approved): hypotheses to be voted on, never copied as the answer.

The famous professional G80 models (Squir, Hum3D) are class B at best: they can be bought and studied
internally, they can never feed a vertex, a curve or a training example into our product, and their branded
subject makes even their own licences uneasy. They are not needed. What a professional modeller knows about
building a car is not copyrightable and is well documented in the open; that knowledge, not their meshes, is
what the builder should learn.

The clearest single finding for Phase 1B: the official dimensions plus a few scaled orthographic photographs
of a real G80 give a generation specific curve prior that is far stronger than the authored sedan prior, and
they expose that the controlled synthetic car is 8 to 10 percent off in proportions. With the evidence
hierarchy below, the 21 uncertain and 31 partial curves of Phase 1 should mostly move to recovered or
reference confirmed, and the 7 prior only curves (shoulder line, hood creases, fender belt, roof crown)
become measurable for the first time.

## 1. Exact G80 reference sources that exist

Rights classes used throughout: A legally reusable (data, geometry or images we may store, derive from and
build on, with attribution where required); B usable for internal research and reference under a licence
that forbids redistribution or extraction (never in the product, never as training data unless the licence
says so); C view only (a person or a vision model may look, we store notes and measurements, not copies);
D unusable (unclear provenance, editorial only, research only or terms that forbid our use).

| Source | What it gives | Rights class | How the engine uses it |
| --- | --- | --- | --- |
| BMW Group PressClub specification sheet, "BMW M3 Sedan / M3 Competition Sedan", Media Information 03/2021 (attachment T0316649EN) | Length, width, height 4794 / 1903 / 1433 mm; wheelbase 2857; track front / rear 1617 / 1605; ground clearance 120; drag area 0.33 x 2.34; weights | Facts: A. The PDF itself stays where it is; we store the numbers and the URL | Trusted dimensions, top of the evidence hierarchy. Verified in this research by reading the PDF text |
| BMW Australia Specification Guide G80 (public PDF on bmw.com.au) | Equipment, wheel sizes, options per trim | Facts: A | Trim and variant table in the knowledge graph |
| BMW Group PressClub photos and videos (press.bmwgroup.com) | Studio and location photography of the launch car, ten images plus video for the G80 launch article; later galleries for the 2024 LCI | C. PressClub states the material may be used free of charge for editorial purposes; our use is not editorial | A person or a vision critic may compare our twin against them and write notes. Not stored in the pack, not used as fit evidence, not used for training |
| Wikimedia Commons, Category "BMW M3 Competition (G80)" (214 files) and "BMW M3 CS (G80)" (32 files) | Real cars, many angles, several colours, front and rear straight views, 2021 to 2025 cars, mostly CC BY SA 4.0 (for example the Alexander Migl series) | A for reference and measurement with attribution; share alike applies only if we publish adaptations of the photos themselves | Fit evidence (tier 2), orthographic references, headlight and taillight references, LCI versus pre LCI identification. Licence, author and URL come from the API's extmetadata |
| Openverse API (api.openverse.org, no key) | 212 commercially licensed results for "BMW M3 G80" at the time of writing, mostly Flickr CC BY SA 2.0 (for example Alexandre Prevot's series) and CC BY | A (CC BY, CC BY SA) or B (CC BY NC) per item, flagged per item | Same as Commons; the API returns licence, licence version, creator and attribution per image |
| Wheel-size.com G80 pages (2020 to 2022, 2022 to 2024, LCI 2024 on) | OEM rim and tyre sizes per year and trim (Competition: 275/35 R19 front, 285/30 R20 rear on the standard staggered set), bolt pattern, offset | Facts: A. The site's own text is theirs | Tyre and rim radii per variant (Phase 1 had to fit the tyre radius; this makes it a known) |
| NHTSA vPIC (vpic.nhtsa.dot.gov, US government, free) | VIN decode: make, model, year, trim, body class, plant | A (public data) | Identity from a VIN when the owner provides one; year and trim resolution |
| the-blueprints.com "BMW M3 Competition G80" vector drawing (front, top, rear, side at 1:25, USD 25, royalty free illustration licence) | Four orthographic outlines drawn by a third party | B. Usable as internal reference under its licence; the drawing is copyrighted and not redistributable; its accuracy is unverified | Optional cross check for the orthographic curve prior. Not needed if Commons side and front photos are good; measurements derived from it are facts but should be labelled "third party drawing" in provenance |
| getoutlines.com | M3 sets E30 to F80 only; no G80 | not applicable | none |
| BMW ETK parts diagrams (RealOEM, 7zap, dealer sites) | Which body panels exist and how they split (front side panel, doors, rear side panel, hood, trunk lid, bumper trim panels, side sill trim) | C (copyrighted diagrams) | Panel list and seam layout for the knowledge graph: facts, written by us, no diagram stored |
| BMW online configurator (new 3D configurator, 2025) and dealer 360 spins (Impel, SpinCar) | Interactive turntables | C for the configurator (view only, terms forbid scraping), D for dealer spins (third party photos, no licence to reuse) | A person may look while reviewing. Nothing automated |
| YouTube reviews and walkarounds | Motion references | C (YouTube's terms forbid downloading; automated frame extraction is D) | A person may look. Nothing automated |
| 3DRealCar (ICCV 2025): 2,500 real cars scanned with iPhone 14 and ARKit, about 200 views each at 1920 x 1440, three lighting conditions, 100+ brands, 13 class parsing maps, OBJ reconstructions with real world scale | Real capture statistics: what phone captures of dark, glossy cars look like; arch, sill and lower body evidence in the wild | A with a caveat: the GitHub toolkit says Apache 2.0 and "commercial usage for free", the paper says CC BY 4.0, the download page carries a Li Auto copyright line and no licence text. Record both, confirm before ingesting | Training and validation data for the evidence extractor (Phase 1 sills and arches), not for the G80 shape (brand is annotated, model is not) |
| MeshFleet (2025): 1,620 vehicle meshes filtered from Objaverse XL with category and size metadata (CSV on Hugging Face, Apache 2.0 code); meshes downloaded from Objaverse XL by hash | Many artist made vehicles, mixed quality, per object licence from Objaverse XL | A for CC BY and CC0 objects, B for CC BY NC, D for the rest, decided per object from Objaverse XL metadata | Topology and construction statistics for the general builder (section 3), never a G80 lookup |
| Objaverse XL (10M objects, ODC By for the collection, per object licence in metadata) | Includes Sketchfab objects; may include the G80s listed in section 2 | per object | Only through MeshFleet's filtered subset |
| ShapeNet, PASCAL3D+, ApolloCar3D (industry grade CAD cars with keypoints) | Research CAD cars | D for the product (research and non commercial terms) | Reading the papers for method only |
| TapMart's own previous twins (Meshy and Tripo G80 meshes from paid plans, the refined GLB, the Phase 1 skeleton) | Two independent AI hypotheses of this exact car, one cleaned mesh, one fitted curve network | A (paid plan outputs are ours; Meshy paid plans grant full private ownership, Tripo paid plans grant broad rights) | Candidate hypotheses in section 6; the skeleton is the current best estimate |

Identity checkpoint that the pack must resolve: the 2024 LCI (facelift, production from July 2024) changed
the headlight inner graphics only ("negative shape" slanted DRL elements); the kidney grille, body and rear
are unchanged. So one G80 body geometry serves 2021 to 2027 with two headlight variants and a wheel table per
year. Trim differences that change geometry: M3 versus M3 Competition (same body), CS (different hood with
vents, different splitter and spoiler lip), M Performance parts (splitter, diffuser, spoiler), Touring G81
(different rear body, a separate generation entry).

## 2. 3D G80 references that exist

| Model | Where | Quality | Licence as published | Class | What we may do |
| --- | --- | --- | --- | --- | --- |
| SQUIR "BMW M3 Competition G80 2021" | squir.com, Sketchfab Store, formerly TurboSquid | Professional, full exterior and interior, multiple formats | Store licence: use in derivative works, no stand alone redistribution; branded real car, so a commercial buyer is exposed to design and trade mark claims that the licence does not clear; no AI training grant | B | Buy for internal study only if a person needs it. Never ingest. Its public preview renders and wireframe images are C: a person or a vision critic may study them and write construction notes; the images are not stored in the pack |
| Hum3D / 3dmodels.org "BMW M3 Competition G80 2021" | 3dmodels.org (hum3d.com now redirects there) | Professional | 3DModels Team licence: use in presentations, advertising and applications, modification for business purposes allowed; distribution of the product or any modification or part of it outside the purchasing organisation forbidden; must not be used where others could extract it; the product remains their property | B | Same as Squir. A curve network derived from it would be "a part or modification" and the twin ships to users, so nothing derived from it may enter the builder |
| TurboSquid BMW models | TurboSquid | any | BMW sued TurboSquid in 2016 (trade mark, trade dress, six design patents); dismissed without prejudice; TurboSquid no longer sells BMW or MINI models, and its licence limits branded models to editorial use and forbids AI derived use without authorisation | D | Nothing |
| "BMW M3 (G80)" by Cherk on Sketchfab (2023) | Sketchfab, free download | 102.7k triangles, low poly, no interior, no logos | CC BY 4.0 | A | May be downloaded, studied, measured and used as a reference or training example with attribution. Its shape is an artist's approximation, so it is a hypothesis with a provenance record, not truth. The underlying vehicle design right is a separate question that applies to any G80 shaped mesh, including ours (see section 5) |
| "2025 BMW G80 M3 Adro" by Sleet on Sketchfab (2026) | Sketchfab, free download | Modified body kit | CC BY NC | B | Research viewing only; non commercial |
| Other free Sketchfab G80s (Sloftm_Carz, Drifter Models, SharkyStudios low poly, ImperialBlue, Eihab_3D) | Sketchfab | Mixed; several look like game extractions | Various, provenance unclear | D unless a CC licence and a credible author are confirmed | Nothing automated. The AI critic may not learn from them |
| Objaverse XL entries of the above | Objaverse XL | as above | per object metadata | as above | Only CC BY and CC0 with a credible source |
| Our Meshy and Tripo G80 meshes | TapMart | Rough, synthetic image derived | Ours | A | Hypotheses (section 6) |
| Meshy community cars (CC0) and other AI cars | Meshy, Sketchfab "CreatedWithAI" | Low | CC0 or CC BY | A | Not useful for the G80; not needed |

Open and licensed vehicles from other makes that can teach construction (section 3):

- "Vehicle topology kit CC0" on Sketchfab (2023): 60.8k triangles of practice car bodies made to show
  vehicle topology; CC0. Class A.
- BlendSwap CC0 and CC BY car files (848 car entries, a subset CC0), Blender native, quad topology visible.
  Class A per file.
- MeshFleet's CC BY and CC0 subset (per object check). Class A per object.
- 3DRealCar scans (real cars, not artist topology): teach what captures look like, not how to model.
- Kenney and similar CC0 low poly packs: too simple to teach anything.

## 3. How professional car models are constructed (what the builder must learn)

This knowledge is not protected by anyone's copyright; it is the craft. Sources consulted: the Polycount wiki
(Subdivision Surface Modeling, Topology), Car Body Design "Modeling cars in polygons", Autodesk Alias
"Understanding Class A modeling", the Class A surface literature, published curricula of car modelling
courses (3D Cars Inside and Out, Realistic 3D Car Creation), and the CC0 topology kit. Distilled rules, each
of which becomes a checkable constraint in Phases 2 to 5:

- Topology flow. Edge loops follow the design lines: along the beltline, the shoulder, the sill, the
  character creases, around the arches and around every opening (lights, grille, windows). A flow line never
  crosses a deep panel gap; topology breaks at seams as the metal does. This is exactly why Phase 1 fits a
  curve network first: the curves are the future edge loops.
- Subdivision cage. The body is built as one continuous low resolution cage with quads, subdivided (Catmull
  Clark) for the smooth surface. Hard features use holding edges (support loops) placed close to the feature
  edge; spacing controls the crease radius. Fewer edges, softer surface; more edges, harder line.
- Order of work. Block the whole body as one piece, make its reflections clean, then cut panel gaps last.
  Cutting doors early ripples the surface. Gaps are cut with a small uniform width, with parallel edges on
  both sides and a return flange going inward (so the gap reads as a dark line with depth, not a crack).
- Wheel arch. The opening is a concentric ring of loops (typically 24 to 32 segments around) that transitions
  into the body grid; a hard edge at the lip keeps the inner wheel well from disturbing the outer shading.
  The arch lip has a flare (on the M3, a pronounced one) and a return into the well.
- Hood. Outer skin with a crowned centre and two creases (the G80 has a power dome with two ridges), a return
  flange all round, a cowl gap at the windshield, a shut line to the fenders; the front edge wraps down to
  meet the bumper and the kidney grille surround.
- Bumper. A separate part, not the body skin: its skin carries the intake openings framed by holding loops,
  the lower splitter as its own shape, and its seam to the fender and hood is a real gap with a return.
- Doors. A skin panel with return flanges, a window frame (the G80 sedan has framed doors), a recessed glass
  plane with a black surround, a handle recess, a mirror mount on the front door (the G80 mirror sits on the
  door skin, not the window triangle).
- Window recesses. Glass sits a few millimetres inside the frame; the black trim surround and the seals form
  a small step. The Hofmeister kink at the rear side window is a specific corner geometry on the C pillar.
- Grille. A recess in the front skin with a frame lip; the slats or mesh are a separate insert inside the
  recess with depth. The G80's kidneys are tall, vertical, frameless, with a black surround.
- Light housings. A recess with a lens surface (the outer glass, slightly convex) and inner geometry (DRL
  strips, reflectors) behind it; the lens edge follows a crisp holding loop pair.
- Mirrors. Base, arm, cap and glass as separate parts; the M mirror has a distinctive twin stalk base.
- Handles. A separate part in a recess; the G80 has conventional pull handles.
- Wheels. Rim from a lathe profile (barrel, lip, spoke face) with radial symmetry for the spokes (the M
  double spoke pattern), tyre as a torus with a sidewall profile and tread band; tyre width and rim size from
  the fitment table.
- Character lines. Paired holding edges with tight spacing along the crease; a crease line is the
  intersection of two surfaces, and its sharpness varies along its length (the G80 shoulder line fades into
  the rear quarter).
- Surface continuity. Within a panel the surface should be G2 (curvature continuous); across panel gaps the
  two skins should read as one surface (G1 at least, G2 ideally) as if the gap had been cut from one skin.
  Reflection lines (zebra stripes) are the test: they must flow without kinks.
- Typical numbers (industry typical, not BMW's proprietary data): panel gaps 3 to 5 mm, flange returns 10 to
  15 mm, glass recess 3 to 6 mm, crease radii 2 to 10 mm. They are starting values the critic checks against
  reference photographs, not rules.

The builder learns these in two ways. Rules with numbers become constraints and checks (the critic renders
zebra stripes and checks gap widths). Statistical shape knowledge (what an arch loop looks like, how loops
converge at the A pillar) is learned only from class A meshes (CC0 and CC BY vehicles from other makes, the
topology kit, MeshFleet's open subset), with every training example recorded by hash and licence.

## 4. VehicleReferencePack

One pack per identified generation and facelift state, created automatically, approved by a person before
it is used by the builder.

```
VehicleReferencePack
  identity            make, model, generation code (G80), body (sedan), years (2021 to 2027),
                      facelift (pre LCI | LCI), trim (M3 | Competition | CS | with M Performance parts),
                      drive (RWD | xDrive), market
  dimensions          length, width, height, wheelbase, track front, track rear, ground clearance,
                      overhang front, overhang rear (derived), width with mirrors (derived)
                      each value: {value, unit, source_id, confidence}
  wheels_tyres        per year and trim: rim diameter and width, tyre size, computed tyre radius and
                      section width, offset {value, source_id}
  references          typed list, each: {view: front | rear | driver_side | passenger_side |
                      front_34 | rear_34 | roof | grille | headlight | taillight | wheel | mirror |
                      panel_layout | character_line | interior_excluded, url, provider, licence,
                      licence_url, attribution, author, capture_date, colour, trim_seen,
                      facelift_seen, rights_class, permitted_uses, checksum, local_copy (only if
                      rights_class A or B), camera_estimate (az, el, focal from the fitter),
                      quality_score, approved_by}
  panel_layout        panels and seams as facts (front side panel, doors, rear side panel, hood, trunk,
                      bumpers, sill trim, gills), with source_ids (ETK viewing notes, photos)
  character_lines     named lines with descriptions and the reference ids that show them
  variants            known exterior variants and what changes geometrically
  knowledge_graph     section 8
  hypotheses          AI 3D candidates and third party CC meshes with provenance and their votes
  provenance_log      every fetch, every decision, every rejection with reason
  pack_version, created_at, approved_at, approved_by, expires_at (re check for a new facelift)
```

Automatic build, in order, all zero cost except the last optional step:

1. Identity from the identification stage (or a VIN through vPIC). Resolve generation, years, facelift.
2. Specifications: fetch the official specification sheet and brochure (URLs are curated per make in a
   small source registry that grows as we add makes), extract numbers, store values with source ids.
   Wheel and tyre table from the fitment site. Cross check three sources; disagreements are flagged.
3. Open image harvest: Wikimedia Commons API (category members and extmetadata for licence, author,
   date) and Openverse API (licence filters) for "<make> <model> <generation>" and variant names. Respect
   the Wikimedia API etiquette (contactable User Agent, serial requests, back off on 429; our test call
   without a User Agent was rate limited immediately). Reject anything without a clear CC licence.
4. Classify each image with the vision reviewer we already use (route "minor_qa"): view type, facelift
   state (from the headlight graphics), trim cues, colour, occlusion, whether the car is stock, whether
   the image is a real photograph. Reject renders, modified cars and mirrored images.
5. Register each accepted image to the current best twin (the Phase 1 fitter's coarse camera search
   works on any image with a silhouette) so every reference carries an estimated camera. Pick the best
   orthographic candidates (side views with azimuth within 5 degrees, front and rear within 5 degrees).
6. Build the knowledge graph draft (section 8) from the specification, the panel facts and the vision
   reviewer's descriptions of the accepted images.
7. Attach existing hypotheses (our AI meshes, CC BY meshes) with provenance.
8. Present the pack for approval: a contact sheet of the accepted references with licence badges, the
   dimensions table with sources, the knowledge graph. A person approves, removes or adds.
9. Optional and paid, only if approved: generate new AI candidates (section 6), buy a class B model for
   human review, or use a commercial image search API (Google's Custom Search JSON API is closed to new
   customers and ends on 1 January 2027, Bing's was retired in August 2025; SerpAPI style services cost
   about USD 2 to 5 per thousand queries). None of these are needed for the G80.

## 5. 3D references are used differently from photographs

Rule set, enforced by the rights class on every record:

- Class A meshes (CC0, CC BY, our own outputs): may be loaded, measured, rendered and used as training or
  reference examples, with attribution and hash recorded. Their shape is still only a hypothesis.
- Class B meshes (commercial licences that forbid redistribution or extraction): may be bought and opened
  by a person for review and for scoring our twin against them (a comparison render, a distance measure
  reported as a number). No vertex, curve, measurement table or training example derived from them enters
  the builder or the pack. The reason is not only the licence wording ("any part or modification"): the
  twin is shipped to users, and a derived curve network is a part of the model in every sense that matters.
- Class C previews (store renders, wireframe screenshots, press photos, configurators, videos): a person or
  the vision critic may look and write construction notes ("the arch lip flares 25 mm and returns at 90
  degrees", "the shoulder crease softens 300 mm before the taillight"). Notes are facts and are stored with
  the source URL; the images are not stored.
- Class D: nothing, and the provenance log records the rejection.
- Never silently copy vertices or topology. Every mesh the builder touches has a provenance record; the
  build/render/critique loop of the plan logs which references influenced which decision.

The design right question is separate from all of the above and applies to our own twin regardless of
source: the EU design reform (Regulation 2024/2822, applicable from 1 May 2025; Directive 2024/2823,
transposition by 9 December 2027) protects the car's appearance including in "computer imaging or computer
modelling", gives the holder a right against "creating, downloading, copying, sharing or distributing any
medium or software which records the design for the purpose of enabling a product ... to be made", and adds
limitations for referential use ("identifying or referring to a product as that of the design right holder"),
comment, critique and parody, subject to fair trade practices. A twin of an owner's own car, shown as that
car in that owner's advertisement, sits under referential use; a twin offered as a generic 3D BMW asset does
not. This is unchanged from revision 2 of the plan and needs a lawyer's confirmation before launch, not
before Phase 1B.

Training on photographs: for CC BY and CC BY SA images the licence itself permits our use. For everything
else we rely on exceptions that differ by jurisdiction (the EU text and data mining exception in Article 4
of the DSM Directive applies to commercial mining but respects machine readable opt outs, which a press
site's terms can be; the 2025 US district court decisions in Bartz v Anthropic and Kadrey v Meta treated
training on lawfully acquired works as fair use but not the retention of pirated libraries). The safe policy
for TapMart: only CC licensed and our own images are stored and used as evidence; everything else is view
only.

## 6. AI 3D as a teacher, not the final model

Would several independent AI candidates materially help? Yes for structure, no for surfaces:

- What they agree on is reliable at the level of "what exists where": four doors, gill position, quad
  exhaust, spoiler lip, mirror position, headlight extent, the rough proportions of the greenhouse. Phase 1
  already showed that a single AI mesh reproduces the greenhouse and the lights well and the lower body
  badly; several candidates from different models make that pattern measurable.
- What they disagree on (grille depth, arch flare, sill shape, trunk edge height) marks exactly the regions
  the fitter should not trust to them, which is itself valuable: disagreement drives the uncertainty map.
- None of them measure. Their scale, symmetry and dimensions are wrong by percent level amounts; they are
  always rescaled by the wheelbase and aligned by the wheel centres before voting.

Method (zero cost to start, since two candidates exist):

1. Candidates: Meshy 7 and Tripo 3.x outputs we own; TRELLIS.2 (MIT) if a GPU is available; Hunyuan3D 3.x
   only through a hosted API and only after checking that its licence exclusion of the EU, UK and South
   Korea does not bind the hosted use (the open weights licence excludes those territories, so treat it as
   unavailable for now). Cost of a new candidate on hosted APIs is roughly USD 0.3 to 1 each; three to five
   candidates per vehicle would be the budget, and none is generated without approval.
2. Alignment: scale each candidate so its wheelbase matches the trusted value, align wheel centres and the
   ground plane, mirror average left and right.
3. Evidence extraction from candidates: render each through the 16 registered cameras (and the pack's
   reference cameras), run the same evidence extractor as Phase 1 (silhouette, part contours, creases from
   curvature), so a candidate contributes curve evidence in the same units as a photograph.
4. Voting: for each skeleton curve, the median of the candidates' evidence with the inter candidate spread
   as its confidence; candidate evidence enters the fitter at tier 5 (below all real evidence) and is
   dropped where the spread exceeds a threshold.
5. Validation: every feature taken from candidates must also be seen in at least one real reference
   (photograph or specification) or it stays marked "hypothesis".

## 7. Reference consensus

The fitter's evidence hierarchy, top to bottom, with the weight class each tier gets in Phase 1B:

| Tier | Evidence | Weight in the fit | Example on the G80 |
| --- | --- | --- | --- |
| 1 | Trusted dimensions (official specification, fitment table) | Hard constraints (wheelbase, track, length, width, height, tyre radius, ground clearance) | The synthetic car is 8 to 10 percent narrower than spec; the spec wins and the cameras absorb it |
| 2 | Validated generation reference consensus (CC photographs of real G80s, registered and measured; knowledge graph facts) | Strong prior on every curve the references show; orthographic references become 2D curve constraints scaled by the wheelbase | Roofline seen in every reference at the same height ratio: very high confidence. Headlight outline agrees between references and user capture: high confidence |
| 3 | Consistent multi view user evidence (the same contour seen in at least two user views) | Data term as in Phase 1, full weight | Door seams seen in six views |
| 4 | Single view user evidence | Data term, reduced weight, flagged | A crease visible only in one high view |
| 5 | AI generated hypotheses (aligned candidates, voted) | Weak prior, dropped where candidates disagree | Candidates disagree on grille depth: ignored |
| 6 | Generic body style prior (the authored sedan network) | Only where nothing above exists; keeps the network connected | Underbody, interior side of pillars |

Consensus is computed per curve: agreement between tiers raises confidence, disagreement between a lower
tier and a higher tier is resolved in favour of the higher tier and logged; disagreement between references
in the same tier (for example two Commons side views giving different sill heights) lowers that tier's
weight for that curve and marks it for review.

## 8. Knowledge graph of the vehicle

A structured description written before geometry, from the specification, the references and the panel
facts, every node with source ids and confidence. Draft for the G80 (statements from public descriptions
and the references above; each would carry its provenance in the pack):

```
BMW M3 G80 (sedan, 2021 to 2027, facelift 2024 headlights only)
BODY
  four door sedan, framed doors, flared arches front and rear, carbon fibre roof with two ridges on
  Competition, trunk lip spoiler (carbon on Competition, taller on CS)
FRONT
  vertical twin kidney grille: tall, frameless, black surround, horizontal slats, extends below the
  headlight line into the bumper; front badge above between the kidneys
  headlights: slim, angled outer edge, pre LCI DRL as two hexagonal rings, LCI DRL as slanted
  "negative shape" strips; same housing outline
  bumper: three intakes (two side, one centre), black lower splitter, side blades
  hood: power dome with two creases running to the cowl
SIDE
  wheel arches: strongly flared, lip returns into the well, arch opening ends near the sill
  gill: vertical black vent behind the front arch on the fender, with M3 badge
  window profile: six light greenhouse with quarter glass behind the rear door and a Hofmeister kink
  at the C pillar; black window surrounds on Competition (shadowline)
  doors: front and rear, pull handles at the beltline, mirror on the front door skin (M mirror,
  twin stalk base, cap)
  rocker: black side sill trim with a lower lip
  shoulder line: from the headlight tip along the fender and doors, softening into the rear quarter
  beltline: rising toward the rear
REAR
  taillights: slim L shaped LED units wrapping into the quarter, dark lens on Competition
  trunk: high deck with a lip spoiler; badge and model script on the lid
  bumper: black diffuser with quad round exhaust tips (two each side), lower valance
WHEELS
  staggered 19 inch front and 20 inch rear on Competition (275/35 R19, 285/30 R20), M double spoke
  designs (825 M, 826 M and others), black or bicolour
DIMENSIONS
  4794 x 1903 x 1433 mm, wheelbase 2857, track 1617 / 1605, ground clearance 120 (official)
VARIANTS
  M3 (single exhaust tips finish differs), Competition, Competition xDrive (same body), CS (vented
  hood, specific splitter and lip), M Performance parts (splitter, diffuser, spoiler), Touring G81
  (separate generation entry)
```

The graph is the construction specification for the geometry builder: which parts exist, where they sit,
which curves must appear, which variants change what. It is also the list of things the critic checks.

## 9. Proposed changes to Phase 1B

Phase 1B stays "16 images to a skeleton", with the reference pack in front of it and the hierarchy inside it.

1. Generation prior replaces the generic prior. Build a G80 curve network from the pack: the official
   dimensions set the frame; the orthographic references (registered CC side, front and rear photographs,
   scaled by the wheelbase and corrected for perspective with their estimated cameras) give 2D curves for the
   roofline, beltline, shoulder line, sills, arches, hood and trunk edges, light and grille outlines; mirror
   symmetry and the side plus front pairs lift them to 3D. The authored sedan network remains only as the
   fallback (tier 6) and for connectivity.
2. Hard dimensions. Wheelbase, track, tyre and rim radii, length, width, height and ground clearance become
   hard constraints, not soft priors. The synthetic capture's distortion is then absorbed by the cameras,
   which is what should happen with a real capture whose lens and distance are unknown.
3. Tiered weights in the fitter. Each evidence source carries its tier; the robust weights are multiplied
   by a tier factor; single view evidence is flagged; AI candidate evidence enters at tier 5 with spread
   based confidence; a per curve consensus record (which tiers agreed) is written to the skeleton.
4. Knowledge graph drives the curve set. Curves exist because the graph says so (gill, Hofmeister kink,
   quad exhaust, spoiler lip, two hood creases), not because the sedan prior happened to include them.
   Phase 1 had no gill, no exhaust, no spoiler lip curves; the graph adds them.
5. Reference registered cameras. The coarse camera search of Phase 1 runs on every pack reference, so the
   references are overlays too and the lab shows them next to the user views.
6. Statuses. "recovered" splits into "reference confirmed" (agrees with tier 2 within tolerance) and
   "capture only" (seen in user views, no reference for it); "prior" is expected to shrink to underbody
   and hidden curves.
7. Lab. `/labs/twin-builder` gains a REFERENCE stage before SKELETON: the pack contact sheet with licence
   badges, the dimension table with sources, the knowledge graph, the approval state. The SKELETON stage
   shows per curve which tiers agreed.
8. Provenance in the output. Every curve in `skeleton.json` lists the reference ids and tiers that shaped
   it; every reference id resolves to a provenance record with licence and attribution.

## 10. Effect on the current uncertain and partial curves

Phase 1 today: 38 recovered, 31 partial, 21 uncertain, 7 prior only, from 118 curve instances. Expected
after Phase 1B, by group:

- Wheel arches (4 instances, uncertain and partial): registered side references show the arch opening
  cleanly (dark tyre against painted lip in daylight photographs, unlike the dark studio synthetic set) and
  the fitment table fixes the tyre radius; expect recovered or reference confirmed.
- Rocker and sill (10 instances, mostly partial and uncertain): side references plus the knowledge graph's
  sill trim description; expect most to become reference confirmed, the sill lower lip may stay partial.
- Trunk perimeter and rear bumper seams (about 12 instances uncertain and partial): rear and rear three
  quarter references plus the diffuser and taillight facts; expect recovered.
- C pillar lower and quarter glass region (uncertain): the Hofmeister kink geometry in the graph plus side
  references; expect recovered.
- Prior only curves (shoulder line, hood creases, fender belt, roof crown, 7 instances): side and front
  three quarter references in daylight show the shoulder crease and the hood dome; expect the shoulder and
  hood creases to become measured (partial or recovered), the roof crown to stay a construction curve.
- Grille (partial): front references at higher resolution than the synthetic set; expect recovered.

Honest estimate: uncertain from 21 to under 8, prior only from 7 to 2 or 3, and the dimensional errors
reported today (length minus 44 mm, width minus 32 mm, tyre radius plus 18 mm) become zero by construction
with the residual moved into the camera parameters where it belongs. The remaining uncertain curves will be
the ones no photograph shows well: the underside of the bumpers, the inner sill edge, the hood to cowl seam.

## 11. Cost and what is paid

Zero cost: specification sheets, Commons and Openverse APIs, vPIC, the CC BY Sketchfab G80 for study, the
CC0 topology kit and BlendSwap CC0 cars, MeshFleet metadata and Objaverse XL downloads, 3DRealCar (after
licence confirmation), our existing AI meshes, all fitting on the container CPU.

Paid and not needed now: new AI candidates (about USD 0.3 to 1 each on hosted APIs, plus Meshy or Tripo
credits), a class B professional model for human review (Squir and Hum3D list prices are in the low
hundreds of dollars), commercial image search APIs (only if Commons and Openverse run dry for a rarer
vehicle), a GPU host for TRELLIS.2 or SAM 3. Each of these stays behind an approval.

## Answers to the eleven questions in the request

1. Exact G80 reference sources: section 1 (official specification with verified numbers, Australia
   specification guide, PressClub photos as view only, 214 plus 32 Commons files, 212 Openverse results,
   wheel fitment tables, vPIC, a third party blueprint, ETK diagrams as view only, configurator and videos as
   view only, 3DRealCar, MeshFleet, our own twins).
2. 3D G80 references: section 2 (Squir, Hum3D, the removed TurboSquid listings, one CC BY Sketchfab model,
   one CC BY NC model, several unclear free models, our two AI meshes).
3. Legally usable and how: class A rows in sections 1 and 2: specification facts, CC licensed photographs
   with attribution, the CC BY Sketchfab mesh, CC0 and CC BY vehicles of other makes, MeshFleet's open subset,
   3DRealCar after licence confirmation, our own outputs.
4. View or reference only: PressClub imagery, ETK diagrams, the configurator, videos, store previews of the
   Squir and Hum3D models; the Squir and Hum3D models themselves are internal review only if bought.
5. Whether professional models can teach without copying: yes, through the craft rules in section 3 (not
   copyrightable) and through statistics learned only from class A meshes; class B and C models contribute
   notes, never geometry.
6. Multiple AI hypotheses: materially helpful for structure and for the uncertainty map, useless for
   surfaces; section 6 gives the method and the cost (zero to start with the two we own).
7. Automatic pack build: section 4, steps 1 to 9, with a person approving the pack.
8. Provenance and licensing storage: per record fields in the pack schema (licence, licence URL,
   attribution, rights class, permitted uses, checksum, local copy rule) plus a provenance log; the builder
   reads geometry only from class A records and the critic only writes notes from class C.
9. How consensus changes the skeleton: section 9 (generation prior, hard dimensions, tiered weights, graph
   driven curve set, reference cameras, new statuses, lab stage, provenance in the output).
10. Whether it reduces the uncertain and partial curves: section 10, yes, with the expected numbers.
11. Research before code: done here; the proposed code changes are only those in section 9 and wait for
    approval.
