# Event Verification — Apollo 11 Key Event Times

**Phase**: 0
**Source**: `docs/audit/EVENT-VERIFICATION.md`
**Date**: 2026-07-13
**Scope**: Verify the Appendix A seed event table against the downloaded NASA primary sources, especially `NASA-A11-MR` (Apollo 11 Mission Report, MSC-00171) Table 3-I, and resolve the documented first-step timing discrepancy.

## Verification sources used

| Source ID                 | Form                 | Local file                                                               | Hash (sha256)                                                                                                                                      |
| ------------------------- | -------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NASA-A11-MR`             | PDF + extracted text | `assets/raw/NASA-A11-MR.pdf` (`NASA-A11-MR.txt`)                         | `3314d99654ebb2ac3e3ef0ab70a84be9519a5f071cf1362118b2b20a6f161dea` (pdf), `19ba185ee4fee429f73dd2c64b39056f8a1d25702c880f62bd0398ae1f579412` (txt) |
| `NASA-A11-SCIENCE-PRELIM` | PDF + extracted text | `assets/raw/NASA-A11-SCIENCE-PRELIM.pdf` (`NASA-A11-SCIENCE-PRELIM.txt`) | `99b1984f2e0e66682d2a33331f39915447e89032055683d283620c52b2f9fdcb` (pdf), `fa5921ec3493d1dae99aa0fdbc81abc96acc9c4e1b31b720940631d54b4518d9` (txt) |
| `NASA-APOLLO-NUMBERS`     | PDF                  | `assets/raw/NASA-APOLLO-NUMBERS.pdf`                                     | `2b8051684d39e0e8dfd914320908e3d67b3729b68ffc17d5ee96449fdeeb18af`                                                                                 |

## Mission Report Table 3-I location

Printed pages 3-4 and 3-5 (PDF pp. 18–19). Extracted text is in `assets/raw/NASA-A11-MR.txt`. The NTRS-provided full-text transcript (`...19700008096.txt`) preserves the table rows in the order recorded below. OCR has minor artefacts (`ii ii` column separators, occasional `]` for `1`); values below are the production-spec transcriptions verified against the extracted text.

## Verification table — Appendix A events

The `metSeconds` is a mechanical conversion of the original `hr:min:sec` string. Verification status:

- **CONFIRMED** — value present in `NASA-A11-MR` Table 3-I text, byte-level or near-byte-level match.
- **CONFIRMED-WITH-OCR-NOISE** — value present but with single-character OCR ambiguity (e.g. `]` vs `1`); value is unambiguous after context.
- **DEFERRED** — not in Table 3-I; requires Phase 0 follow-up from another source per spec §A.3.

| Event ID                               | Spec label                            |   Original MET | `metSeconds` | Source locator                                                         | Status                   | Note                                                                                                                                                                                                                                           |
| -------------------------------------- | ------------------------------------- | -------------: | -----------: | ---------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `a11-liftoff`                          | LIFTOFF                               |   `00:00:00.6` |        `0.6` | `NASA-A11-MR` Table 3-I, p. 3-4; range zero `13:32:00 GMT Jul 16 1969` | CONFIRMED                | Range-zero line precedes liftoff row in the table.                                                                                                                                                                                             |
| `a11-sic-outboard-cutoff`              | S-IC OUTBOARD ENGINE CUTOFF           |   `00:02:41.7` |      `161.7` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | OCR shows `00:02:41.7`. Note this is **engine cutoff**, not stage separation.                                                                                                                                                                  |
| `a11-sii-ignition-command`             | S-II ENGINE IGNITION CMD              |   `00:02:43.0` |      `163.0` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Labelled "(command)" in source.                                                                                                                                                                                                                |
| `a11-les-jettison`                     | LAUNCH ESCAPE TOWER JETTISON          |   `00:03:17.9` |      `197.9` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                |                                                                                                                                                                                                                                                |
| `a11-sii-cutoff`                       | S-II ENGINE CUTOFF                    |   `00:09:08.3` |      `548.3` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Not stage separation.                                                                                                                                                                                                                          |
| `a11-sivb-first-ignition`              | S-IVB ENGINE IGNITION CMD             |   `00:09:12.2` |      `552.2` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                |                                                                                                                                                                                                                                                |
| `a11-sivb-first-cutoff`                | S-IVB ENGINE CUTOFF                   |   `00:11:39.3` |      `699.3` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                |                                                                                                                                                                                                                                                |
| `a11-tli-ignition`                     | TRANSLUNAR INJECTION                  |  `02:44:16.2*` |     `9856.2` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Asterisk = engine ignition time per source footnote.                                                                                                                                                                                           |
| `a11-csm-sivb-separation`              | CSM / S-IVB SEPARATION                |   `03:17:04.6` |    `11824.6` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                |                                                                                                                                                                                                                                                |
| `a11-first-docking`                    | FIRST DOCKING                         |   `03:24:03.1` |    `12243.1` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                |                                                                                                                                                                                                                                                |
| `a11-spacecraft-ejection`              | SPACECRAFT EJECTION                   |   `04:16:59.1` |    `15419.1` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Per spec note: must correlate with LM extraction complete semantics in Phase 2 — Table 3-I row is "Spacecraft ejection" only; the spec maps this to "LM extraction complete" but the precise extraction-complete MET may need AFJ cross-check. |
| `a11-sivb-separation-maneuver`         | SEPARATION MANEUVER FROM S-IVB        |  `04:40:01.8*` |    `16801.8` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-mcc1-ignition`                    | MIDCOURSE CORRECTION 1                |  `26:44:58.7*` |    `96298.7` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-loi-ignition`                     | LUNAR ORBIT INSERTION                 |  `75:49:50.4*` |   `272990.4` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-lunar-orbit-circularization`      | LUNAR ORBIT CIRCULARIZATION           |  `80:11:36.8*` |   `288696.8` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-undocking`                        | COLUMBIA / EAGLE UNDOCKING            |    `100:12:00` |     `360720` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED-WITH-OCR-NOISE | OCR shows `100:12:00` (integer seconds).                                                                                                                                                                                                       |
| `a11-lm-separation-maneuver`           | SEPARATION MANEUVER FROM LM           | `100:39:52.9*` |   `362392.9` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-doi-ignition`                     | DESCENT ORBIT INSERTION               |   `101:36:14*` |     `365774` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED-WITH-OCR-NOISE | OCR shows `10].:36:].4"` — bracket-as-`1` artefact; the production-spec reading `101:36:14` matches the source (source table has no fractional second for this row). Engine ignition time.                                                     |
| `a11-pdi-ignition`                     | POWERED DESCENT INITIATION            | `102:33:05.2*` |   `369185.2` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-touchdown`                        | LUNAR LANDING / TOUCHDOWN             |  `102:45:39.9` |   `369939.9` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED-WITH-OCR-NOISE | OCR `±02:45:39.9` — `±` is an OCR artefact for `1`. Spec value `102:45:39.9` is the correct reading.                                                                                                                                           |
| `a11-lm-hatch-open`                    | LM HATCH OPEN (Egress)                |    `109:07:33` |     `392853` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED-WITH-OCR-NOISE | OCR `]09:07:33` — bracket is `1`. Integer seconds.                                                                                                                                                                                             |
| `a11-lm-hatch-close`                   | LM HATCH CLOSED (Ingress)             |    `111:39:13` |     `401953` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED-WITH-OCR-NOISE | OCR `1].1:39:13` — brackets are `0` and `0`. Integer seconds.                                                                                                                                                                                  |
| `a11-lunar-liftoff`                    | LUNAR LIFTOFF                         | `124:22:00.8*` |   `447720.8` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-csi-ignition`                     | COELLIPTIC SEQUENCE INITIATION        |   `125:19:36*` |     `451176` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Engine ignition time; integer seconds in source.                                                                                                                                                                                               |
| `a11-cdh-ignition`                     | CONSTANT DIFFERENTIAL HEIGHT          | `126:17:49.6*` |   `454669.6` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-tpi-ignition`                     | TERMINAL PHASE INITIATION             | `127:03:51.8*` |   `457431.8` | `NASA-A11-MR` Table 3-I, p. 3-4                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-lm-csm-docking`                   | EAGLE / COLUMBIA DOCKING              |    `128:03:00` |     `460980` | `NASA-A11-MR` Table 3-I, p. 3-5                                        | CONFIRMED                | Integer seconds.                                                                                                                                                                                                                               |
| `a11-ascent-stage-jettison`            | ASCENT STAGE JETTISON                 |  `130:09:31.2` |   `468571.2` | `NASA-A11-MR` Table 3-I, p. 3-5                                        | CONFIRMED                |                                                                                                                                                                                                                                                |
| `a11-ascent-stage-separation-maneuver` | SEPARATION MANEUVER FROM ASCENT STAGE |   `130:30:01*` |     `469801` | `NASA-A11-MR` Table 3-I, p. 3-5                                        | CONFIRMED                | Engine ignition time; integer seconds in source.                                                                                                                                                                                               |
| `a11-tei-ignition`                     | TRANSEARTH INJECTION                  | `135:23:42.3*` |   `487422.3` | `NASA-A11-MR` Table 3-I, p. 3-5                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-mcc2-ignition`                    | MIDCOURSE CORRECTION 2                | `150:29:57.4*` |   `541797.4` | `NASA-A11-MR` Table 3-I, p. 3-5                                        | CONFIRMED                | Engine ignition time.                                                                                                                                                                                                                          |
| `a11-cm-sm-separation`                 | CM / SM SEPARATION                    |  `194:49:12.7` |   `701352.7` | `NASA-A11-MR` Table 3-I, p. 3-5                                        | CONFIRMED                |                                                                                                                                                                                                                                                |
| `a11-entry-interface`                  | ENTRY INTERFACE                       |  `195:03:05.7` |   `702185.7` | `NASA-A11-MR` Table 3-I, p. 3-5                                        | CONFIRMED                |                                                                                                                                                                                                                                                |
| `a11-splashdown`                       | SPLASHDOWN (Landing)                  |    `195:18:35` |     `703115` | `NASA-A11-MR` Table 3-I, p. 3-5                                        | CONFIRMED                | Source row label is "Landing"; spec relabels to "SPLASHDOWN" to disambiguate from lunar landing. Integer seconds.                                                                                                                              |

**Result**: 33 of 34 Appendix A.1 events CONFIRMED or CONFIRMED-WITH-OCR-NOISE against `NASA-A11-MR` Table 3-I extracted text. No conflicts detected. OCR noise is single-character and resolvable from context.

## First step timing discrepancy (Appendix A.2)

The `a11-first-step` event is **not** in Mission Report Table 3-I. Per spec §A.2, multiple NASA publications give differing second-level times:

| Source                                               |                                                                         MET given | Located in extracted text                                                                                                                                                                                                                                                                     | Hash of source text                                                                      | Page-level locator                                                                                                                                                                                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NASA-A11-SCIENCE-PRELIM` (SP-214)                   |                                                                `109:24:19 g.e.t.` | offset 44365 — "the camera recorded man's first step on the Moon at 109:24:19 g.e.t."                                                                                                                                                                                                         | `fa5921ec3493d1dae99aa0fdbc81abc96acc9c4e1b31b720940631d54b4518d9` (txt)                 | Phase 2 must extract printed page from SP-214 PDF (PDF text extraction deferred to Phase 2 for this source)                                                                                                                                                             |
| `NASA-A11-SCIENCE-PRELIM` (SP-214, second reference) |                                                                `109:24:20 g.e.t.` | offset 184232 — "Armstrong ... at 109:24:20 g.e.t. (quotation 12): The surface is fine and powdery..."                                                                                                                                                                                        | (same source, different paragraph)                                                       | (same — Phase 2)                                                                                                                                                                                                                                                        |
| `NASA-APOLLO-NUMBERS` (SP-4029) — narrative          |                                                                       `109:24:15` | PDF page 104 (1-indexed), char offset 3423 — "The commander's left foot made first contact with the lunar surface at 02:56:15 GMT on 21 July (22:56:15 EDT on 20 July) at 109:24:15. His first words on the lunar surface were, 'That's one small step for man, one giant leap for mankind.'" | `2b8051684d39e0e8dfd914320908e3d67b3729b68ffc17d5ee96449fdeeb18af` (pdf, 36037981 bytes) | **PDF page 104** (0-indexed 103); printed page TBD (SP-4029 uses chapter-prefixed page labels like "11-N" but the relevant page-label search did not find an "11-N" label on PDF page 104 — Phase 2 must locate the printed-page label). Verification date: 2026-07-13. |
| `NASA-APOLLO-NUMBERS` (SP-4029) — timeline table     |                                                                    `109:24:15.00` | PDF page 118 (1-indexed), char offset 175 — "1st step taken on lunar surface (CDR). 'That's one small step for a man ... one giant leap for mankind:' 109:24:15.00 02:56:15 21 Jul 1969"                                                                                                      | (same PDF)                                                                               | **PDF page 118** (0-indexed 117); this is the "Apollo 11 Timeline" table page. Verification date: 2026-07-13.                                                                                                                                                           |
| ALSJ "One Small Step" page (per spec §A.2)           | `109:24:15` initial contact; other releases `109:24:20`; video-synced `109:24:18` | (not yet verified — ALSJ One Small Step HTML not separately archived in Phase 0; the ALSJ landing page `NASA-A11-LANDING` is archived but the specific `a11.step.html` sub-page is not)                                                                                                       | n/a                                                                                      | Phase 2 action                                                                                                                                                                                                                                                          |

**Discrepancy confirmed** across sources:

- SP-4029 (two independent citations, PDF pages 104 + 118): `109:24:15` / `109:24:15.00`
- SP-214 (two citations in same document): `109:24:19` and `109:24:20`

Spec §A.2 anticipated this discrepancy. The SP-4029 citations are now **page-level verified** (PDF pages 104 and 118, extraction recorded in `docs/audit/SP4029-extraction.txt`).

### Phase 0 first-step decision (per spec §A.2 / §60)

- Adopt `109:24:15` (per spec seed and `NASA-APOLLO-NUMBERS` SP-4029 PDF pages 104 + 118) as the canonical MET for `a11-first-step` in the event table.
- Tag precision as `source-rounded / timing varies by source`.
- Maintain Decision Record `ADR-P0-002` in `docs/audit/DECISIONS.md` listing all sources and second-level values.
- UI Source Room must explain the discrepancy; the spec forbids silently smoothing it.
- When syncing to specific audio/video media, use that media's calibrated clip time — not the canonical MET.

**SP-4029 page-level verification status**: COMPLETE for PDF page numbers (104 + 118). The printed-page labels in SP-4029 use chapter-prefixed numbering (e.g. "11-N" for the Apollo 11 chapter); the extraction script searched for "11-N" labels but did not find one on PDF pages 104 or 118 specifically — the labels may be on adjacent pages or rendered as image rather than text. Phase 2 must locate the exact printed-page labels if required for citation fidelity. The PDF page numbers (104, 118) are sufficient for Phase 0 verification.

## Events not in Table 3-I (Appendix A.3)

Per spec §A.3, these visual/configuration events cannot be inferred from adjacent engine cutoff / ignition times. The original Phase 0 release deferred all A.3 investigation to Phase 2 — that was incorrect. The remediation establishes all A.3 Event IDs with source candidates, verification status, and non-ACTUAL processing rules in a dedicated document:

➡️ **See `docs/audit/EVENT-VERIFICATION-A3.md` for the complete A.3 Event ID table.**

Summary: 28 Event IDs established across the 10 A.3 categories. Verification status breakdown:

- 2 Event IDs with MET-CONFIRMED (`a11-first-step` per A.2 above, `a11-aps-ignition` same as `a11-lunar-liftoff`)
- 5 Event IDs with MET-LOCATED-NOT-VERIFIED (1201/1202 alarms, PDI sub-phases, LM extraction)
- 9 Event IDs with QUALITATIVE-ONLY (staging events, parachute, recovery)
- 12 Event IDs with SOURCE-IDENTIFIED-PENDING-MET (EVA activities, APS cutoff, SLA panels)

No A.3 sub-event is labelled `ACTUAL` for animation unless its MET was verified in Phase 0, per spec §A.3: _"没有可靠 MET 时，可以保留在 Archive 叙事中，但不能驱动标为 `ACTUAL` 的精确动画。"_

Risk R-016 RESOLVED: the Apollo 11 launch vehicle flight evaluation report (MPR-SAT-FE-69-9 / NASA-TM-X-62558) is now archived from archive.org mirror (NTRS de-indexed). S-IC/S-II separation command = 162.3 sec, S-II/S-IVB separation command = 549.0 sec — both MET-CONFIRMED. See `docs/audit/SATV-FE-SEPARATION-VERIFICATION.txt` for full extraction.

## UTC derivation rule (Appendix A.4)

The Mission Report defines range zero as `1969-07-16 13:32:00 GMT` and the liftoff event as `MET 00:00:00.6`. The implementation must:

1. Treat `rangeZeroUtc = '1969-07-16T13:32:00.000Z'` and `liftoffMetSeconds = 0.6` as the canonical epoch.
2. Compute UTC for any event as `rangeZeroUtc + metSeconds` — meaning the liftoff UTC is `1969-07-16T13:32:00.600Z`, not `13:32:00.000Z`.
3. Preserve source precision: events with integer-second MET stay integer-second in UTC; events with `.6`, `.7`, `.9` etc. retain that decimal.
4. Tag UTC as `DERIVED` (per spec §6 — UTC is mechanical calculation from epoch + MET).

**Phase 0 status**: epoch rule documented; actual `MissionEpochs` type + tests land in Phase 1 (`mission-core`).

## Phase 0 verification verdict (remediation)

- ✅ All 33 Table 3-I events in Appendix A.1 verified against `NASA-A11-MR` extracted text.
- ✅ First-step discrepancy confirmed in SP-214 (`109:24:19` vs `109:24:20`); spec §A.2 anticipated this.
- ✅ **SP-4029 `109:24:15.00` page-level verification COMPLETE** (remediation): PDF pages 104 (narrative) and 118 (timeline table) both confirm `109:24:15` / `109:24:15.00`. Extraction recorded in `docs/audit/SP4029-extraction.txt`. Canonical MET 393855s adopted per `ADR-P0-002`.
- ✅ **Appendix A.3 Event IDs established** (remediation): 28 Event IDs across 10 categories, each with source candidates, verification status, and non-ACTUAL processing rules. See `docs/audit/EVENT-VERIFICATION-A3.md`.
- ✅ UTC epoch rule locked in.
- ⚠ Some A.3 sub-events have `MET-LOCATED-NOT-VERIFIED` status (1201/1202 alarms at ~102:38:22 and ~102:39:31); Phase 2 must verify against Technical Air-to-Ground Transcript and ALSJ landing page.
- ✅ Launch vehicle flight evaluation report (R-016) archived from archive.org mirror; S-IC/S-II and S-II/S-IVB separation METs confirmed (162.3 sec and 549.0 sec).
- ❌ No event may be tagged `ACTUAL` in the production event table until Phase 2 completes the locator + page-number pass and writes the citations into `src/missions/apollo11/events.ts`.

## Commands run

```bash
# Download NTRS-extracted full text for the Mission Report
curl.exe -sS -L -A 'Mozilla/5.0' -o assets/raw/NASA-A11-MR.txt \
  'https://ntrs.nasa.gov/api/citations/19700008096/downloads/19700008096.txt'
# Result: STATUS 200, 475421 bytes, sha256 19ba185ee4fee429f73dd2c64b39056f8a1d25702c880f62bd0398ae1f579412

# Download NTRS-extracted full text for the Preliminary Science Report
curl.exe -sS -L -A 'Mozilla/5.0' -o assets/raw/NASA-A11-SCIENCE-PRELIM.txt \
  'https://ntrs.nasa.gov/api/citations/19700000726/downloads/19700000726.txt'
# Result: STATUS 200, 460194 bytes, sha256 fa5921ec3493d1dae99aa0fdbc81abc96acc9c4e1b31b720940631d54b4518d9

# Remediation: extract SP-4029 (NASA-APOLLO-NUMBERS.pdf) text with PyMuPDF (fitz)
python E:\系统缓存\opencode\extract_sp4029.py
# Result: Wrote docs/audit/SP4029-extraction.txt
# Found 109:24:15 on PDF page 104 (narrative) and PDF page 118 (timeline table)
# SP-4029 PDF sha256 verified: 2b8051684d39e0e8dfd914320908e3d67b3729b68ffc17d5ee96449fdeeb18af

# Remediation: download correct NASA-A11-POSTTRAJ PDF
curl.exe -sS -L -A 'Mozilla/5.0' -o assets/raw/NASA-A11-POSTTRAJ.pdf \
  'https://ntrs.nasa.gov/api/citations/19690026499/downloads/19690026499.pdf'
# Result: STATUS 200, 8004579 bytes, sha256 55b94c5947c91a3cd0539601517c82941a04ec9631dbb90458275664b855a7b3
```
