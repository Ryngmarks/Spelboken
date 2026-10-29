# sb01-improvement-research – Easier movement, positions and Veo links: Solution Blueprint (for owner approval)

Status: **DRAFT for approval**, 2026-10-29. Base branch `main`; every WO gets its own branch `wo/sb01-NN` in a worktree.
Binding inputs: `owner-decisions.md` round 1 items [F #1]–[F #4] (they win), item #5 still open (O5, O6, O8, O9 –
written here with the draft's recommendation and marked **pending owner [#5]**), `consult/ux-ui.md` (C1),
`consult/frontend.md` (C2), `draft.md` v1, `prior-art.md`. Markers: [F #n] = fixed by the owner, [T] = tuned in the
prototype, evidence levels VERIFIED / OBSERVED / HYPOTHESIS per RAS AGENTS.md §5.

## 1. Goal and scope

**Goal:** A coach builds a multi-step build-up on a phone in about half the actions of today (≈ 26 → ≤ 12 for "3 runs +
1 pass over 3 steps", HYPOTHESIS, measured in the prototype) because one drag both moves the player and draws the arrow,
and the ball follows the pass. Every position code gets a Swedish name and one neutral sentence, the coach can write each
player's task per step, and a scenario can carry Veo links that open in a new tab with a plain privacy note.

| In | Out (later / never) |
|---|---|
| R1 quick wins: tool reset after "+ Steg", ghost of previous step, ≥ 44 px targets and labelled phone toolbar, scenario sheet on phones, first-use hints, position glossary (draft P1.1–P1.5, P1.7) | Game formats 3v3–9v9, per-format pitch, formations and markings – R4 [F #1]. Only the `PitchSpec` seam is laid now (WO-03). |
| `PitchSpec` + screen-px hit-area seam so R4 needs no gesture rewrite (C2 §1) | Embedded video, iframes, YouTube/Vimeo players, CSP work for embeds [F #2] |
| Movement data model (linked arrows, ball follows pass) + prototype of both gestures, then R2 production with the winner [F #4] | Built-in full role texts per position × phase; team role sheet (draft P4.3) [F #3] |
| Optional curve on run/dribble arrows (draft P2.3, C2 `control`) – after R2, owner go at checkpoint | Clips per step (draft P4.2), local phone video files, any video hosting |
| Player task per step + editable Uppspel template + player-view token label option (P3.1, P3.2) [F #3], O8 pending | Propagation of a move into steps N+2… (C2 §1 "no N+2 propagation initially"; prototype observes the need) |
| Veo/https link field on the scenario + privacy note [F #2] | Derived "visa alla rörelser" arrows (draft alt. B as rendering), per-arrow speed/delay, pinch-zoom, portrait editor (C2 §2) |
| SvFF phase names in library/editor (P1.6), O9 pending | Backend/Supabase (brief), export as image/video, SvFF shirt-number map, new dependencies |

## 2. Requirements and rules (the spec the implementers build)

### 2.0 Key rules (binding for every WO)

1. **Data format – additive and optional.** Every new persisted field is optional; `schemaVersion` stays **1**; a missing
   field means today's behaviour. `src/storage/validate.ts` parses each new field with explicit bounds and drops (not
   keeps) anything malformed. Every new field gets a **round-trip test** (create → `JSON.stringify` → `parseScenario`
   → deep-equal) and an **old-fixture test** (a v1 scenario without the field loads unchanged). A change in the meaning
   of an existing field is a version bump to 2 with `migrate()` – none is planned. Known limit: a stale tab running the
   old app drops unknown fields on save (validate rebuilds objects, C2 §1, VERIFIED) – accepted on one Pages deployment.
2. **Arrows tied to entities.** A *linked* arrow lives in frame *k*, has `entityId`, and means "entity moves from its
   frame-*k* position to its frame-*k+1* position". Its `from`/`to` are always recomputed by one pure
   `reconcileLinks(scenario)` (`src/domain/movement.ts`) after every edit; stored `from`/`to` stay as the fallback for old
   readers. Invariants: ≤ 1 linked arrow per entity per frame; a link with no frame *k+1* or a missing entity is turned
   into a free arrow (geometry kept, `entityId`/`targetId` removed); `duplicateScenario` remaps `entityId`/`targetId`;
   free arrows (no `entityId`) behave exactly as today.
3. **URL rule.** Only `https:` links, parsed with `new URL()`, ≤ 2048 chars, no username/password, no other scheme ever
   rendered. Rendered only as `<a href target="_blank" rel="noopener noreferrer">`; never `iframe`, `embed`, `object`,
   `window.open` with a string from data, or `dangerouslySetInnerHTML`. Validated on input **and** on import (bad clip
   dropped, scenario still loads). [F #2]
4. **No new dependencies.** React + DOM/SVG only; nothing is added to `package.json` (D7). **pending owner [#5] (O5)** –
   nothing in this plan needs a library, so the plan does not change if the owner keeps D7.
5. **Pure core, one commit per gesture.** Rules live in `src/domain` as pure TypeScript with Vitest tests; components own
   pointer capture, coordinate conversion and transient preview only; a gesture dispatches **one** reducer action on
   release (= one undo step), cancel dispatches nothing (C2 §1). No new render/gesture code reads `PITCH_LENGTH` /
   `PITCH_WIDTH` – it takes a `PitchSpec`. UI text Swedish, code English.

### 2.1 Functional

**Movement gesture – decision.** Both consults agree on the *data* (C1 §1 "both gestures write the same data", C2 §1
`entityId` + `planMove`), and only disagree on the *gesture*. Decision:
- **Data model = draft alternative A** (linked arrow in the frame where the move starts + position in the next frame).
  Hard-to-change part, fixed now.
- **Gesture = decided by the prototype**, which builds both on that one data shape (`?proto=a|b`). Hypothesis lead =
  **B, keyframe-with-ghost** (C1 claims 1–2: market default, VERIFIED/OBSERVED in `docs/research/TACTICS-BOARDS.md` §1;
  no second drag mode on the same token, so no silent mode errors). The draft's argument for A – what the coach sees in
  step N is what the player view plays from step N (F2, VERIFIED) – is real, so C1's task T4 ("Är det så du menade?")
  tests exactly that. Both satisfy [F #4] ("arrow drawn automatically, ball follows the pass").
- **Production rule** (C1 decision rule [T]): a variant passes if every counted coach passes T2–T4 with hint ≤ 1 and no
  T4 > 3 min. Both pass → fewer errors, then coach preference; still tied → **B** (fewer concepts). Neither passes →
  stop R2 and build fallback C (P1.1 + P1.2 already in R1 + ball follows pass), which WO-04 already supports.
- **Tool set: C1 over draft P2.4** – no separate Passning/Dribbling tools. Dragging the ball = pass, dragging the ball
  holder = dribble, arrow type is automatic, "Press" via chips on a selected arrow. Reason: fewer buttons fit one row at
  375 px (C1 toolbar table) and the type is implied by what is dragged.

**Shared command** (`planMove(scenario, k, cmd)` in `movement.ts`; C2 §1): `cmd = { entityId, to: Point, newFrameId?,
arrowId }` with `to` already clamped by the UI using the `PitchSpec`. Effect: frame *k+1* is created as a copy if missing
(`newFrameId`), entity's position in *k+1* := `to`, linked arrow in *k* upserted. Variant A calls it with *k = current*
step; variant B with *k = current − 1* (in step 1, B is a plain `moveEntity` = line-up, no arrow).
- **Arrow threshold:** a linked move shorter than **2 m [T]** creates no arrow and removes an existing one (C1 claim 5).
- **Arrow type:** entity is the ball → `pass`; player holding the ball (ball ≤ **1.5 m [T]** from the player in frame
  *k*) → `dribble`; other player → `run`. A run may be changed to `press` via chips; type change keeps the link.
- **Ball follows** – **pending owner [#5] (O6)**, recommendation "yes, with undo": pass dropped within **44 screen-px
  [T]** of a team-mate sets `targetId` (receiver highlighted with a ring and "→ 9 CF" in the hint line while in range,
  C1 claim 4); the ball's *k+1* position = receiver's *k+1* position + **0.8 m [T]** toward the receiver's attacking
  direction, recomputed by `reconcileLinks` when the receiver moves later. Pass released on grass = pass into space (ball
  at `to`). Dribble: ball's *k+1* position = carrier's *k+1* + the same offset. One exported flag `BALL_FOLLOWS = true` in
  `movement.ts` turns this off if the owner says no (then the pass arrow is drawn and the coach moves the ball by hand).
- **Remove:** "Ta bort löpning" on a selected linked arrow removes it and returns the entity's *k+1* position to its
  *k* position (C1 claim 5). Undo/redo restores all of it in one step.
- **Propagation:** none – later steps are not changed [T, observed in prototype T4; C2 §1].

**R1 rules** (draft section 2 R1 unless noted)
- After `insertFrame` the tool returns to `select` ("Flytta") – P1.1.
- Ghost: in step ≥ 2 the previous step's entities render at **35 % opacity [T]** without labels, always on in the editor
  (no toggle; hint line says so, C1); the player view never shows ghosts – P1.2.
- Every button in topbar, toolbar and timeline ≥ **44 × 44 CSS px**; phone toolbar ≤ 900 px shows icon + text label
  (≤ 7 chars, C1 toolbar table) in one horizontally scrollable row – P1.3. Before R2 the labels are today's tools
  (Flytta · Löpning · Passning · Dribbling · Press · Yta · + Eget · + Motst.); WO-06 reduces them to C1's 5.
- Player/ball hit circle radius = `max(visualRadius, 22 / s)` m, `s = hypot(ctm.a, ctm.b)` of the pitch-content group;
  arrows get a transparent 44 px non-scaling hit stroke; pointer-down resolves centrally: selected handle → nearest entity
  centre → nearest arrow; snapping by **24 screen-px [T]** instead of 2.6 m (C2 §1).
- Scenario metadata opens as a sheet over the pitch from a "Scenario" button at ≤ 900 px – P1.4.
- Empty-state hint per step (C1: step 1 "Ställ upp spelarna", step ≥ 2 "Dra spelarna dit de springer – förra steget
  syns svagt"; before R2: "Dra en spelare för att flytta den") and a "?" button listing keyboard shortcuts – P1.7.
- `POSITION_INFO: Record<Position, { name, alias?, description }>` – Swedish name + **one neutral sentence** per code
  [F #3], e.g. "MB – Mittback (innerback)", "DM – Defensiv mittfältare". Shown in squad, library filter chips, player
  view filter and as a "Positioner" help list; the editor label field becomes a dropdown of `POSITIONS` + "Egen…" free
  text (stored `label` unchanged) – P1.5.

**Player task per step** (P3.1, [F #3]): selecting a player in the editor shows "Uppgift i detta steg" (≤ **140 chars
[T]**, hint "skriv roll, inte namn"); the player view shows "Din uppgift just nu: …" for the tapped player or the
filtered position. The app ships an **editable Uppspel template**: one example task line per position for build-up
(`UPPSPEL_TEMPLATE` in `positions.ts`), inserted with "Använd mall" into the empty task field and then edited freely.
No other role texts ship (assumption on the meaning of "mall för Uppspel" – see §8 question 5).

**Token content** (P3.2) – **pending owner [#5] (O8)**, recommendation: number inside the circle, position code under it;
player view option "Visa: Nummer / Position / Namn" (in-memory, default Position); in the editor a linked person's name
shows as a second line instead of replacing the role.

**Veo link field** [F #2]: side panel "Klipp" on the scenario: paste link, label (≤ 80 chars [T]), optional start time
mm:ss shown as text ("Spola till 12:34") – not written into the URL, because the Veo start-time URL format is not
verified (research OBSERVED). Max **10 clips [T]**. Links whose host is `veo.co` or a subdomain are shown as "Veo"; any
other https link as "Länk" (generic fallback). Player view and library card show "▶ Öppna klipp" (new tab). Privacy
note: shown as a one-time dialog on the first clip (flag in localStorage) and as a permanent short line under the field:
> "Veo-länken fungerar bara om inspelningen är **publik** i Veo – då kan alla som har länken se den. Dela bara inom
> laget, skriv inte spelarnas namn i klippets namn, ta bort länken om en spelare eller vårdnadshavare ber om det, och
> följ klubbens rutin för samtycke (särskilt barn under 13 år och barn med skyddad identitet)."
The export dialog adds "Filen innehåller länkar till videoklipp." (IMY/RF basis: draft F10, VERIFIED, not legal advice.)

**SvFF phase names** – **pending owner [#5] (O9)**, recommendation per draft P1.6: library groups by main phase
(Anfallsspel › Uppspel, Avslut och göra mål; Omställning › Kontring, Återerövring; Försvarsspel › Press; Fasta
situationer); the app's "Anfallsspel" label becomes "Avslut och göra mål". `Phase` ids unchanged → no data change.

### 2.2 Non-functional
- Works at 375 × 700 (touch) and 1280 × 800 without horizontal page overflow; portrait player view keeps working.
- Playback unchanged in timing; linked straight arrows play exactly as today (linear + `easeInOut`); reduced-motion path
  unchanged (C2 §1).
- Offline-capable static app as today; no network calls added (links only open on click).
- Accessibility: all new buttons have text or `aria-label`; the hint line is `aria-live="polite"`.

### 2.3 Security
- The only new untrusted input is the clip URL and label from typing or imported JSON → rule 2.0.3. Labels/tasks are
  rendered as React text (escaped), bounded in length, never as HTML.
- No third-party content is loaded by the app (no embeds [F #2]), so no CSP or iframe sandbox work is needed now; the
  draft's security consultation (#3) is replaced by rule 2.0.3 plus a security-lens review of WO-04 and WO-09.
- Personal data (D10): exported files still contain no names; tasks and clip labels are free text, so the UI hints
  "skriv roll, inte namn". The prototype keeps everything in memory and logs no names.

## 3. Architecture

**Modules** (new / changed)
- `src/domain/pitch.ts` (changed, WO-03): `PitchSpec { length, width }`, `DEFAULT_PITCH` (105 × 68), `clampToPitch(p,
  spec = DEFAULT_PITCH)`, `corridors(spec)`, `thirds(spec)`, `pitchMarkings(spec)` (11v11 only). `PITCH_LENGTH/WIDTH`
  stay as aliases for not-yet-migrated domain code (formations, suggestions, scenario) – R4 replaces them.
- `src/components/hitTest.ts` (new, WO-03): pure `pickTarget(candidates, clientPoint, scale)` + `hitRadius(visual, scale)`
  – shared by `EditorPitch` and the prototype so T1's result transfers to production.
- `src/domain/movement.ts` (new, WO-04): `planMove`, `removeLinkedMove`, `reconcileLinks`, `arrowTypeFor`, `ballHolder`,
  `BALL_FOLLOWS`, thresholds as named [T] constants.
- `src/domain/positions.ts` (new, WO-01; `UPPSPEL_TEMPLATE` added in WO-08).
- `src/domain/clips.ts` (new, WO-09): `parseClipUrl(url) → { url, kind: 'veo' | 'link' } | null`, `formatStart`.
- `src/prototype/` (new, WO-05, removed in WO-06): `Prototype.tsx`, `eventLog.ts`, setup scenario; entered from
  `main.tsx` when the URL has `?proto=a|b`.
- Changed: `types.ts`, `scenario.ts` (frame ops call `reconcileLinks`; `interpolatePositions` follows linked arrows),
  `validate.ts`, `editorReducer.ts`, `EditorPitch.tsx`, `PitchView.tsx`, `Editor.tsx`, `Player.tsx`, `Library.tsx`,
  `Squad.tsx`, `styles.css`; new `ClipList.tsx` (WO-09).
- Call direction unchanged: components → reducer → domain; storage → domain types.

**Data model (all optional, schemaVersion 1)**
```ts
ArrowDrawing { id, type, from, to,
  entityId?: string,   // WO-04: linked mover ('ball' for passes)
  targetId?: string,   // WO-04: pass receiver (player id) – ball follows
  control?: Point }    // WO-07: quadratic Bézier control, run/dribble only (C2 replaces draft `bend`)
Frame    { …, tasks?: Record<entityId, string> }                         // WO-08, ≤ 140 chars, home players only
Scenario { …, clips?: { id, url, label, startSec? }[] }                  // WO-09, ≤ 10, url per rule 2.0.3
```
Validation: `entityId`/`targetId` must name an existing entity (else dropped → free arrow); `targetId` only on `pass`;
`control` finite, inside coordinate bounds, only on run/dribble, `null` rejected (C2 §1); `tasks` keys must be existing
player ids, values strings ≤ 140; `startSec` integer 0–36000. Nothing resets; no migration.

**Integrations / environment:** GitHub Pages deploy on push to `main` (D12). The prototype is merged to `main` behind
`?proto=a|b` (not linked from the UI, in-memory only) so the owner can open it on a phone via the live URL – see §8 Q1.

**Technology choices:** quadratic Bézier with explicit `control` vs a perpendicular `bend` – `control` chosen (C2 §5:
free handle movement, no constraint). Screen-px hit circles vs larger visible tokens or a portrait editor – hit circles
chosen (C2 §1–2: enlarging after contact cannot fix the first miss; portrait alone gives 17.75 px tokens and costs M–L).

## 4. Reuse

| Existing (path) | Reused for |
|---|---|
| `src/domain/scenario.ts` `insertFrameAfter`, `moveEntity`, `removeFrame`, `moveFrame`, `duplicateScenario`, `interpolatePositions`, `easeInOut` | `planMove` frame creation; link reconciliation hooks; curve playback |
| `src/editor/editorReducer.ts` history + `coalesceKey` | one undo step per gesture |
| `src/components/PitchView.tsx` `overlay`, `trimmedArrow`, `arrowPath`, `orientation` | ghost layer, prototype rendering, curved arrows |
| `src/components/EditorPitch.tsx` pointer-id gesture model, `toPitch` | central hit resolution, drag preview |
| `src/domain/formations.ts` `FORMATIONS` (4-2-3-1, 4-4-2) | prototype setup scenario (C1 test script) |
| `src/domain/types.ts` `POSITIONS`, `ARROW_LABELS`, `PHASES` | glossary keys, arrow chips, phase grouping |
| `src/storage/validate.ts` bounded parsers | all new optional fields |

## 5. Work orders

Size: S ≤ 1 day, M 2–4 days, L ≥ 1 week of agent work. Every WO: `npm test` and `npm run build` green, handoff per
AGENTS.md §6. Isolation = worktree for all (they run in parallel or touch `main` code).

| WO | Agent (+ profile) / isolation | Files it may touch | Acceptance + tests | Size | Order |
|---|---|---|---|---|---|
| **01** R1a – positions glossary + tool reset | **Codex** (fully specified) + frontend / worktree | `src/domain/positions.ts` (new) + `positions.test.ts`, `src/editor/editorReducer.ts` + test, `src/components/Squad.tsx`, `src/components/Library.tsx`, `src/components/Player.tsx` (filter labels only) | `POSITION_INFO` has an entry for every `POSITIONS` code and every label in `FORMATIONS` (test); one sentence each, neutral [F #3]; "Positioner" help list reachable from squad and library; tool is `select` after `insertFrame` (reducer test) | S | ∥ 03, 04; first |
| **02** R1b – editor chrome on phones | Claude + frontend, ux-ui / worktree | `src/components/Editor.tsx`, `src/styles.css` | All topbar/toolbar/timeline buttons ≥ 44 × 44 px at 375 and 1280 (measured with `getBoundingClientRect`); toolbar labels visible at 375 px, one scrollable row; "Scenario" sheet at ≤ 900 px; hint line + "?" shortcut list; label field = `POSITIONS` dropdown + "Egen…" (uses WO-01); no page overflow | M | after 01 (needs `positions.ts`); ∥ 03, 04, 05 |
| **03** PitchSpec + hit-area seam + ghost | Claude + frontend / worktree | `src/domain/pitch.ts` + `pitch.test.ts`, `src/components/hitTest.ts` (new) + `hitTest.test.ts`, `src/components/PitchView.tsx`, `src/components/EditorPitch.tsx` | `PitchView`/`EditorPitch` take `pitch?: PitchSpec` (default 105 × 68) and read no `PITCH_*` constant; viewBox, markings, guides and portrait transform derived from it; test renders with an injected 55 × 35 spec without code change in `EditorPitch` (C2 §3); hit radius ≥ 22 CSS px for players/ball, 44 px arrow hit stroke, nearest-centre wins, snap 24 px [T]; ghost of previous step in editor step ≥ 2; visuals unchanged at 1280 (screenshot compare) | M | ∥ 01, 04; before 05 |
| **04** Movement domain + schema | **Codex** (pure, fully specified) + frontend / worktree | `src/domain/types.ts`, `src/domain/movement.ts` (new) + `movement.test.ts`, `src/domain/scenario.ts` + test (frame ops call `reconcileLinks`), `src/storage/validate.ts`, `src/storage/scenarioStore.test.ts` | Rules 2.0.1–2.0.2 and §2.1 command as tests: planMove creates *k+1* if missing; < 2 m → no arrow; type pass/dribble/run; `targetId` ball follow incl. receiver moved later; `BALL_FOLLOWS=false` path; remove returns entity; `removeFrame`/`moveFrame`/`insertFrameAfter`/`removeEntity`/`duplicateScenario` keep invariants; round-trip + old-fixture + hostile-input tests (dangling ids, `targetId` on run, NaN) | M | ∥ 01, 03; before 05 |
| **05** R2 prototype – both gestures | Claude + ux-ui, frontend / worktree | `src/prototype/**` (new), `src/main.tsx` (≤ 10 lines: `?proto=a|b` switch), `docs/ras/sb01-improvement-research/prototype-test.md` (new: C1 test sheet) | `?proto=a` = forward-plan, `?proto=b` = keyframe-with-ghost, same data via `planMove`; C1 toolbar per variant; setup 4-2-3-1 vs 4-4-2, ball at MB, one empty step + "Återställ"; ball-drag pass with receiver ring and hint; in-memory event log (drags, wrong picks, undos, time per task, no names) shown on a "Resultat" screen with "Kopiera"; nothing read from or written to localStorage; playable on 375 px portrait + landscape | M | after 03 + 04; then **GATE P** |
| — | **GATE P** – owner + 1–2 coaches run `prototype-test.md` | — | §6 thresholds; PM writes `prototype-result.md`, owner confirms the winner (new owner-decisions round) | — | blocks 06, 07 |
| **06** R2 production – winning gesture | Claude + frontend, ux-ui / worktree | `src/components/EditorPitch.tsx`, `src/components/Editor.tsx`, `src/editor/editorReducer.ts` + test, `src/components/PitchView.tsx` (receiver ring, arrow chips), `src/styles.css`, delete `src/prototype/**` + its `main.tsx` lines | **Waits for GATE P.** Winner per §2.1 rule; toolbar = C1's 5 buttons; one `planMove` action per release = one undo; arrow chips Löpning/Passning/Dribbling/Press + "Ta bort löpning"; free arrows still drawable; T4 task in the real editor ≤ 12 actions (PM re-count); old scenarios open and play unchanged | L | after GATE P and after whichever of 08–10 is in flight has merged (shared files) |
| **07** Optional curve | Claude + frontend / worktree | `src/domain/types.ts`, `src/domain/movement.ts`, `src/domain/scenario.ts` (+ tests), `src/storage/validate.ts`, `src/components/PitchView.tsx`, `src/components/EditorPitch.tsx`, `src/components/usePlayback.ts` | **Waits for GATE P + WO-06 + owner go.** `control` per §3; one mid-handle `H = B(0.5)`, `C = 2H − (P0+P1)/2`; endpoint edits translate C by midpoint displacement; `pathPoint` tests u = 0/0.5/1, coincident endpoints; player and dribbled ball animate along the curve; round-trip test | M | after 06 |
| **08** Player task per step + token labels | Claude + frontend / worktree | `src/domain/types.ts`, `src/domain/positions.ts` (`UPPSPEL_TEMPLATE`), `src/domain/scenario.ts` + test, `src/storage/validate.ts` + test, `src/editor/editorReducer.ts` + test, `src/components/Editor.tsx`, `src/components/Player.tsx`, `src/components/PitchView.tsx` (labels) | §2.1 task rules; `removeEntity`/`duplicateScenario` clean/remap `tasks`; round-trip + old-fixture tests; "Använd mall" inserts the template line for the player's position; token content per O8 (**pending owner [#5]**) | M | after 02, 03, 04 merged; does **not** wait for GATE P; runs during the test window; before 09 |
| **09** Veo/https link field + privacy note | Claude + frontend, security (`clips.ts` + validate part is a **Codex candidate** if split) / worktree | `src/domain/types.ts`, `src/domain/clips.ts` (new) + `clips.test.ts`, `src/storage/validate.ts` + test, `src/components/ClipList.tsx` (new), `src/components/Editor.tsx`, `src/components/Player.tsx`, `src/components/Library.tsx` | Rule 2.0.3 tests: `javascript:`, `data:`, `http:`, `https://user:pw@…`, > 2048 chars, whitespace, `veo.co` vs `evilveo.co` → correct result; imported file with a bad clip loads without it; every rendered link has `target="_blank" rel="noopener noreferrer"` (DOM check); no `iframe` anywhere (`grep`); privacy dialog once + permanent line; export note [F #2] | M | after 08 (shared files); does **not** wait for GATE P |
| **10** SvFF phase names | **Codex** + frontend / worktree | `src/domain/types.ts` (`PHASES` labels + `mainPhase`), `src/components/Library.tsx`, `src/components/Editor.tsx` (phase select `optgroup`), test in `src/domain/` | **pending owner [#5] (O9)**; ids unchanged; library groups by main phase; old scenarios keep their phase; test that every `Phase` has a main phase | S | after 09; skip if owner says no |

Parallel sets (disjoint files): {01, 03, 04} → {02, 05} → GATE P window {08 → 09 → 10} → 06 → 07. 02 needs 01;
05 needs 03 + 04; 08/09/10 and 06 share `types.ts`, `validate.ts`, `Editor.tsx`, so they run in sequence.

## 6. Verification

- **Every WO:** `npm test` and `npm run build` green on the WO branch and again after merge to `main`.
- **Browser (PM, `vite preview`, Chrome) at 375 × 700 touch and 1280 × 800** after WO-02, 03, 06, 08, 09:
  no horizontal page overflow; every button ≥ 44 × 44 CSS px (script over `getBoundingClientRect`); toolbar labels
  visible at 375; player/ball hit circle radius ≥ 22 CSS px at 375 (measured); player view portrait still plays;
  screenshots attached to the handoff.
- **Data:** an exported scenario from today's `main` (fixture) imports unchanged after every schema WO (04, 07, 08, 09).
- **GATE P – prototype thresholds** (C1 test script, [T]): T1 hint 0, ≤ 20 s, ≤ 1 wrong pick; T2 hint 0, ≤ 60 s,
  ≤ 1 error; T3 hint 0, ≤ 60 s, ball at the right player both times; T4 ≤ 2 min, ≤ 12 actions, ≤ 2 errors, coach says
  playback is what they meant; T5 hint 0, ≤ 45 s, 0 stray changes. Variant passes = every counted coach passes T2–T4
  with hint ≤ 1 and no T4 > 3 min; wrong-pick rate < 1 in 10 drags overall (C2 §3). Owner run = pilot, not counted (C1
  §3 risk 3); counterbalanced order coach 1 B→A, coach 2 A→B. With only the owner available, the result is OBSERVED, not
  a pass – PM flags it.
- **After WO-06:** PRODUCT.md acceptance "scenario in 3 steps in < 5 min" re-run on the phone by the PM.
- **Reviewer** (other model than the author): Codex reviews 02, 03, 05, 06, 07, 08 (code lens); Claude reviews 01, 04,
  10 (code lens) and 04 + 09 also with the **security lens** (validation, URL rule, hostile import).

## 7. Risks

| Risk | Mitigation |
|---|---|
| Linked arrows drift from positions after frame ops (C2 §3, draft P2.1 Med–High) | One `reconcileLinks` called by every op; invariant tests in WO-04; reviewer checks every `scenario.ts` export |
| B: adjusting a start position in step ≥ 2 creates an unwanted run (C1 §3) | 2 m threshold [T], one-tap undo, T5 measures it |
| Crowded box: 44 px hit circles overlap at ≈ 3.1 px/m (C2 §1) | Nearest centre wins, highlight before release, landscape allowed; T1 + wrong-pick rate |
| Prototype tested only by the owner | Result marked OBSERVED; PM asks owner to recruit 1–2 coaches before GATE P closes [F #4] |
| Veo hostnames / start-time format unverified (research OBSERVED) | Generic https fallback; start time shown as text only; PM asks owner for one real Veo share link to test WO-09 |
| WO-06 conflicts with 08–10 on shared files | Strict sequence in §5; 06 starts from fresh `main` |
| Prototype live on the public site | Unlinked query flag, no storage, no names; removed in WO-06 |

## 8. Remaining owner decisions (in Swedish)

1. **Får prototypen ligga på den publicerade sidan bakom en dold adress (`…/Spelboken/?proto=a` och `?proto=b`) så att
   du och tränarna kan öppna den direkt i mobilen?** Den sparar ingenting och tas bort när vi bygger på riktigt.
   **Rek: Ja** (alternativet är att köra den på din dator via wifi, vilket är krångligare för tränarna).
2. **O5 – inga extra bibliotek (D7)?** **Rek: Ja, behåll** – inget i planen behöver ett bibliotek. *(pending [#5])*
3. **O6 – ska bollen följa med automatiskt vid passning och dribbling?** **Rek: Ja, med ångra** – prototypen visar om
   det känns rätt. *(pending [#5])*
4. **O8 – vad står på spelarbrickan?** **Rek: nummer i cirkeln, position under; i spelarvyn kan man välja
   Nummer/Position/Namn.** *(pending [#5])*
5. **O9 – SvFF:s fasnamn och "Anfallsspel" → "Avslut och göra mål"?** **Rek: Ja** – ingen data ändras. *(pending [#5])*
6. **"Mall för Uppspel": menar du en exempelrad per position som tränaren kan infoga och ändra i stegets
   "Uppgift"-fält?** **Rek: Ja** – en lagövergripande rollsida per position och fas ligger kvar i paket 4.
7. **Kurvor på pilar (WO-07) – bygga efter R2 eller vänta tills tränare frågar?** **Rek: bestäm efter prototypen**;
   frågan ställs igen vid GATE P.

## 9. Size and cost (rough)

| Part | Size |
|---|---|
| Code | ~1 800–2 300 lines changed/added; 5 new modules (`positions`, `movement`, `hitTest`, `clips`, `ClipList`) + throwaway `src/prototype/` (~500, deleted) |
| Tests | ~700–900 lines (movement invariants and URL rule are the bulk) |
| Work orders | 10: S × 2 (01, 10), M × 7 (02, 03, 04, 05, 07, 08, 09), L × 1 (06); WO-07 optional |
| Agent runs | 10 implementer runs (3 Codex: 01, 04, 10) + ~8 reviews + ~4 fix rounds ≈ **22 runs** |
| PM | merges in §5 order, 5 browser checks at 375/1280, fixture import checks, GATE P set-up and `prototype-result.md`, docs after approval: DECISIONS D13 (additive optional fields), D14 (movement model + gesture result), D15 (video = Veo/https links only, new tab, privacy note); ARCHITECTURE data model; TASKS |
| Owner | one decision round (§8), GATE P sessions (~15 min per coach + pilot), one real Veo share link |
