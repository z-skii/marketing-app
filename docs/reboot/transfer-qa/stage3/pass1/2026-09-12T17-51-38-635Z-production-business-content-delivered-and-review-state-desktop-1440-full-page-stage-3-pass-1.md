# Transfer QA: Production Business Content, delivered and review state (desktop 1440, full page), stage 3 pass 1

Production: `d-business_content-full.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-12T17:51:38.635Z
Instructions: Stage 3 transfers the approved Frame Shift Design Lab to production for the business core. The Lab captures are the approved design: judge whether the real production screen keeps the approved language and composition (mineral canvas, graphite rail and media regions, cobalt only for decisions, the source-to-commitment joint, real media at source ratio, short operational copy, literal status words, restrained borders, strong typography, honest provenance, no generic dashboard cards) and whether real functionality survived. Real data replaces the Lab's fictional people, cars, files and business; treat those as expected differences, not drift. Do not propose a new design system. The full page of the delivered and review state: two files need approval, one has an edit requested, one is approved, one scheduled video whose post failed; shoots completed, booked and being scheduled; the failed post with Open Connections.

**Verdict.** The Frame Shift composition and visible production workflow largely survived, but caption-control parity, date honesty and small desktop layout corrections prevent release sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture retains the real records, independent states, navigation and principal review/recovery actions; it does not establish that their handlers work. Hold this viewport for the corrections below and verify caption permissions against the existing production implementation. Then exercise file selection, video/original inspection, approval, edit requests, tabs, shoot navigation and connection recovery.

The principal Frame Shift geometry survives: the graphite rail, mineral canvas, contained source, 24px source-to-commitment separation and flat white decision panel closely match the Lab. Real file and publication states remain distinct, and the failed post retains its recovery action. However, the caption control no longer matches, the page starts 12px too low, one control is reduced, and real dates expose misleading range labeling and weaker scheduling context. No monetary values appear on this screen, so money treatment cannot be evaluated here.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 9 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 7 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- The 200px graphite rail, restrained TapMart mark, labeled navigation and selected Content edge.
- Mineral canvas, flat white review plane, restrained dividers and absence of generic elevated dashboard cards.
- The desktop source-to-decision assembly: 816px source region, 24px separation and 336px commitment panel.
- The 420px-high inspection region, source-faithful media, four-column thumbnail strip and cobalt selected-source outline.
- Strong page and section headings, operational metadata, literal status words and cobalt concentrated on the approval decision.
- Approve content, Request an edit, Skip, Open original, content tabs, shoot navigation and Open Connections remain visibly available.

## Expected differences (real data)

- Demo Coffee Co., its D initial, Essential plan and notification counts replace the Lab business and account fixtures. Do not add Lab demo labels.
- Four delivered files and two needing approval correctly replace the Lab's five files and one needing approval.
- The selected file is Edit requested rather than New; its actual edit note, uploader, caption and delivery provenance belong in production.
- The real photo is contained at its source ratio with graphite letterboxing. It should not be cropped to imitate the Lab's wider photograph.
- The video tile identifies a real video without inventing a poster or substituting Lab photography.
- Completed, booked and being-scheduled shoots, including an unassigned creator, correctly expose the real records.
- The approved video's failed post and actual connection-error explanation correctly replace the Lab's scheduled-photo and failed-photo examples. File approval and publication status remain independent.

## Drift and usability

1. [usability] **Restore the approved Caption field treatment: width 100%, min-height 72px, 12px padding, 1px solid #788595 border, 8px radius and IBM Plex Sans 16/24px. Preserve the actual edit note separately. Apply existing production permissions: bind the field to the existing caption-update path when editing is allowed; if this state is intentionally read-only, expose that restriction clearly rather than implying an editable action. Do not introduce a Lab-only mutation.** (Right review panel, Caption). The Lab exposes a caption textarea; production renders unbounded static text. The capture does not establish whether this is a legitimate Edit requested restriction or a lost editing affordance, so complete control parity cannot yet be signed off.
2. [data_honesty] **Change the section heading from "This month's shoots" to "Shoots" for this multi-month result set. Preserve all three records and their existing ordering and actions.** (Shoot-list heading). The visible list contains Sep 4, Sep 18 and Oct 18. A single-month heading contradicts the dates now supplied by production.
2. [usability] **Include the year in dated shoot and post records, and include the actual scheduling time zone wherever a time is shown. Format timestamps using the record's or configured business scheduling zone with year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" and timeZoneName: "short". Do not copy the Lab's Central zone or silently substitute the browser zone; expose an unavailable zone honestly.** (Shoot timestamps and Upcoming posts timestamp). Production shows appointments such as "Sep 18 at 2 PM" and a failed post at "Sep 11 at 11:30 AM" without year or time zone. The Lab supplied both, making operational dates less ambiguous.
2. [usability] **Restore Brand kit to 48px height with 16/20px IBM Plex Sans 600 text, 16px horizontal padding and an 8px radius. Ensure Open Connections has an actual hit target at least 44px high; its visible border may remain compact if the target expands without overlap.** (Top-right Brand kit and failed-post Open Connections controls). Brand kit is visibly reduced to approximately 40px high from the Lab's 48px treatment. Open Connections also appears approximately 40px high; its recovery action must satisfy the system's 44px target minimum.
3. [drift] **Set the desktop content wrapper's top padding to 32px and remove the extra 12px top offset. Preserve the 32px horizontal gutter and existing internal gaps. At this viewport, the inspection assembly should begin at y=218px rather than y=230px.** (Main desktop content wrapper). The title, plan line, tabs, review heading, media and commitment panel are consistently 12px lower than the approved capture. This is a shell-spacing difference, not a consequence of real content.
