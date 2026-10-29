# sb01-improvement-research – draft (v1)

Author: Solution Architect, 2026-10-29. Status: **draft – not approved**. No owner-decisions.md yet; team age/format and
video source are open (section 7). Inputs: brief.md, prior-art.md, the three research handoffs and full reports in
`docs/research/`, `src/domain/types.ts`, `scenario.ts`, `validate.ts`, `EditorPitch.tsx`, `PitchView.tsx`, `editorReducer.ts`.

Evidence levels are carried over unchanged: **VERIFIED**, **OBSERVED**, **HYPOTHESIS**. Numbers: **[F]** fixed by the
owner (none yet), **[T]** to be tuned in a prototype, otherwise an evidence level. Sizes: S ≤ 1 day, M 2–4 days,
L ≥ 1 week of agent work (rough).

---

## 1. Strongest findings

| # | Finding | Evidence | Consequence |
|---|---|---|---|
| F1 | Arrows and movement are disconnected: moving a player draws nothing, drawing a run moves nothing; the ball must be dragged by hand after a pass. "3 players move + 1 pass over 3 steps" ≈ **26 actions (14 min.)**. | VERIFIED (code + run, prior-art (a)1, (b)) | Biggest single speed-up is to make one drag produce both the move and the arrow. |
| F2 | Arrows in step N already mean "what happens next" (they fade while N animates to N+1). | VERIFIED (`ARCHITECTURE.md`, `Player.tsx` `drawingOpacity`) | A drag in step N can write the target position into step N+1 without changing what the player view means. |
| F3 | Other tools solve movement as keyframes + ghost (TacticSlate) or "draw the run = the animation" (Tactix, Easy2Coach); optional one-handle curves are common. | VERIFIED (vendor/store text) – how they *feel* is not known | Copy the pattern, not a product. Ranking of patterns is HYPOTHESIS. |
| F4 | No product found that moves the ball automatically with a pass, and none that explains *what a role does* on the board. | OBSERVED absence (not proof) | Possible differentiators; both are HYPOTHESIS as user value. |
| F5 | Phone editor: buttons 38 px (< 44), toolbar becomes icon-only at 375 px, pitch ≈ 3.4 px/m, player ≈ 13 px. | VERIFIED (measured) | Touch editing needs larger hit areas and visible labels before more features. Usability impact OBSERVED. |
| F6 | Position codes mix languages and are never explained; role label is free text unrelated to `POSITIONS`; name replaces role. | VERIFIED | A glossary + per-step "task" text fills a gap. The DM/CM/OM/CF codes also read as Swedish (Defensiv/Central/Offensiv mittfältare, Centralforward), so a rename is not needed (HYPOTHESIS). |
| F7 | SvFF formats: 3v3 15×10–12, 5v5 30×15–20, 7v7 50–55×30–35, 9v9 65–72×50–55 (offside from 9v9); 11v11 105×68 not SvFF-sourced. | VERIFIED (SvFF rulebook 2022) except 11v11 (HYPOTHESIS) | The app only draws 11v11; if the owner's team plays 7v7/9v9 this jumps in priority. |
| F8 | SvFF phases: Anfallsspel (speluppbyggnad, avslut), Omställning (kontring, återerövring), Försvarsspel (förhindra speluppbyggnad, förhindra/rädda avslut). App's "Anfallsspel" clashes with SvFF's main phase name. | VERIFIED via districts (SUP original not read) | Relabel and group; no data change needed. |
| F9 | Video: YouTube embeds via `youtube-nocookie.com` with integer `start`/`end`; Vimeo `#t=` + `dnt`; Veo share needs **Public**, no embed code found; localStorage cannot hold video. | YouTube/Vimeo/localStorage VERIFIED, Veo OBSERVED | Store links only; embed YouTube/Vimeo after a click; everything else opens in a new tab. |
| F10 | IMY 2026: recordings for internal coaching are not covered by its streaming guidance; publishing online is; guardian consent recommended under 13. RF advises against streaming children's sport. | VERIFIED (not legal advice) | Default to unlisted, warn on public/Veo, never host video, keep names out of clip labels. |

---

## 2. Proposals in four releases

Order = value ÷ effort, with the risky movement model gated by a prototype (section 4). R1 needs no data-format change.
R2's prototype can run in parallel with R1. **If the owner answers "7v7" or "9v9", P4.1 (formats) moves up into R2.**

Data-format rule used below (proposed D13): *additive optional fields keep `schemaVersion: 1`*; `validate.ts` must parse
them (bounded), old data without them must load unchanged, and each gets a round-trip test (create → export → parse).
Any change in the meaning of an existing field bumps to 2 with a `migrate()` step. Caveat: a stale tab of the old app
drops unknown fields on save/import (validate rebuilds objects) – acceptable on a single GitHub Pages deployment.

### R1 – "Easier right now" (no schema change, low risk) – total ≈ M

| ID | Coach/player experiences | Fits the model | Modules | Size | Risk |
|---|---|---|---|---|---|
| P1.1 Tool resets after "+ Steg" | After adding a step the tool goes back to Flytta, so the next drag moves a player instead of drawing an arrow. | Reducer only. | `editorReducer.ts` (+test) | S | Low |
| P1.2 Ghost of previous step | In step N ≥ 2 the previous step's players show faint, with that step's arrows, so the coach sees where everyone came from. Toggle "Visa förra steget". | Render-only: `PitchView` gets optional `ghostPositions`; nothing persisted. | `PitchView.tsx`, `EditorPitch.tsx`, `Editor.tsx` | S | Low |
| P1.3 Touch targets and labels | All buttons ≥ 44 px [T, from guideline]; phone toolbar shows icon + short text ("Flytta", "Löpning", "+ Eget", "+ Motst."), scrollable row; players get an invisible hit circle ≥ 44 CSS px regardless of zoom; snap radius in screen px (≈ 24 px [T]) not 2.6 m. | CSS + hit-area in SVG units computed from the CTM. | `styles.css`, `Editor.tsx`, `EditorPitch.tsx`, `PitchView.tsx` | M | Low–Med (hit areas may overlap in crowded areas; nearest-wins rule) |
| P1.4 Scenario panel on phones | "Scenario"-button opens metadata (title, phase, principle, focus positions) as a sheet over the pitch instead of below the timeline. | UI only. | `Editor.tsx`, `styles.css` | S–M | Low |
| P1.5 Position glossary | Everywhere a code appears (chips, filters, squad, editor label field) the full Swedish name is available: "HB – Högerback", "MB – Mittback (innerback)", "DM – Defensiv mittfältare", "CF – Centralforward". A short "Positioner"-help lists all with one plain sentence each. Label field becomes a dropdown of `POSITIONS` + "Egen…" free text. | New pure `POSITION_INFO: Record<Position, {name, alias?, description}>` in `src/domain/positions.ts` (+test that every `POSITIONS` code and every formation label has an entry). No stored data changes; codes stay. | `domain/positions.ts` (new), `types.ts`, `Editor.tsx`, `Library.tsx`, `Squad.tsx` | S | Low. Description texts are content: keep to neutral one-liners (see O4). |
| P1.6 Phase vocabulary aligned with SvFF | Library groups by SvFF main phase with sub-phase label: **Anfallsspel** › Uppspel (speluppbyggnad), Avslut och göra mål; **Omställning** › Kontring, Återerövring; **Försvarsspel** › Press (förhindra speluppbyggnad); **Fasta situationer**. The app's "Anfallsspel" becomes "Avslut och göra mål". | Labels + a `mainPhase` lookup in `types.ts`; `Phase` ids unchanged → no migration. Optional later: split `defence` into press / "Förhindra och rädda avslut" as a new enum value (additive; `validate` + test). | `types.ts`, `Library.tsx`, `Editor.tsx` | S | Low (wording – owner may prefer "Uppspel"; easy to change) |
| P1.7 Editor first-use hints | Empty-state line on the pitch for the first step ("Dra en spelare dit hen ska springa"), shortcut list behind a "?" button. | UI only. | `Editor.tsx` | S | Low |

### R2 – "Movement in one drag" (behind a prototype, section 4) – total ≈ L

Recommended model: **A – linked movement arrows, planned forward** (alternatives in section 3).

| ID | Coach/player experiences | Fits the model | Modules | Size | Risk |
|---|---|---|---|---|---|
| P2.1 Drag-to-run | With tool **Rörelse** the coach drags a player in step N to where they should go. The player stays put in step N, a run arrow appears, and the player's position in step N+1 is set (step N+1 is created as a copy if N is the last step). Later steps that were untouched copies follow [T: propagation rule]. Selecting the arrow offers type chips Löpning / Dribbling / Press. Moving the player in N or N+1 with Flytta keeps the arrow attached. | `ArrowDrawing` gets optional **`entityId?: string`** (the mover). For linked arrows, `from`/`to` are recomputed from frame N / N+1 positions by a pure `syncLinkedArrows(scenario)` after every edit; stored `from`/`to` stay as a fallback so older readers still draw them. Arrow still lives in frame N (= "what happens next", F2). | `types.ts`, `scenario.ts` (`planMove`, `syncLinkedArrows`, propagation), `validate.ts`, `editorReducer.ts` (one action, one undo step), `EditorPitch.tsx`, `Editor.tsx` + tests | L | **Med–High**: hidden coupling between steps; deleting/reordering steps must drop or re-link arrows (`removeFrame`, `moveFrame`, `insertFrameAfter`, `duplicateScenario` remap `entityId`). |
| P2.2 Ball follows the pass | Dragging the ball from its holder to a team-mate draws a pass and puts the ball at the receiver's feet in step N+1; if the receiver also runs, the ball goes to where the receiver ends up. Dragging the ball to empty space = pass into space. A dribble moves the ball with the carrier. Undo reverses all of it in one step. | Pass arrow: `entityId = 'ball'`, optional **`targetId?: string`** (receiver). Ball's N+1 position derived from receiver's N+1 position + small offset [T]. Dribble: if ball is within ~1.5 m [T] of the mover in step N, ball follows in N+1. | same as P2.1 | M | Med: "holder" is inferred from distance – may surprise; prototype question. |
| P2.3 Optional curve | A selected arrow shows one round handle at its middle; dragging it bends the arrow, and the player/ball animates along the curve. | Optional **`bend?: number`** (signed perpendicular offset in metres, bounded ±30 in validate). New pure `pathPoint(from, to, bend, t)` (quadratic Bézier) used by both `arrowPath` and playback; linear when absent. | `types.ts`, `validate.ts`, `scenario.ts` (interpolation per entity), `PitchView.tsx`, `EditorPitch.tsx`, `usePlayback.ts` + tests | M | Low–Med (dribble wave along a curve needs care). |
| P2.4 Simplified tool set | Toolbar: **Flytta · Rörelse · Passning · Yta · + Spelare** (team chosen in a toggle). Free (unlinked) arrows stay possible: drag from empty grass with Rörelse. | UI only; existing free arrows untouched. | `Editor.tsx`, `editorReducer.ts` (`Tool`) | S | Low–Med (existing users relearn; few users today). |

Expected effect (HYPOTHESIS, to measure in prototype): the 3-step example drops from ≈ 26 to ≈ **11 actions**
(step 1: tool 1 + 3 runs + 1 pass = 5; step 2: select the auto-created step 2 + 5 = 6, which creates step 3; no "+ Steg", no separate arrow drawing).
Left out on purpose: per-arrow delay/speed (research HYPOTHESIS, add only if coaches ask), "hold/pause" step (an
unchanged copy step already does it), follow-the-player shape lines (explanation value, not speed).

### R3 – "Roles and clips" – total ≈ M–L

| ID | Coach/player experiences | Fits the model | Modules | Size | Risk |
|---|---|---|---|---|---|
| P3.1 Player task per step | In the editor, selecting a player shows "Uppgift i detta steg" (short text, ≤ 140 chars [T]). In the player view, tapping a player — or opening the scenario filtered on a person/position — shows "Din uppgift just nu: …". Few words per step (FIFA over-annotation caveat). | Optional **`Frame.tasks?: Record<entityId, string>`**; validate bounds length/count; `removeEntity` and `duplicateScenario` must clean/remap keys. | `types.ts`, `scenario.ts`, `validate.ts`, `editorReducer.ts`, `Editor.tsx`, `Player.tsx` + tests | M | Low–Med (must not contain names – text is free; add hint "skriv roll, inte namn"). |
| P3.2 Token labels | Number inside the circle, label below = position code; linked person's name shown as a second line in the editor and as a player-view option "Visa: Nummer / Position / Namn". | Render-only. | `PitchView.tsx`, `Player.tsx` | S | Low (crowding on phone – test). |
| P3.3 Video clips on scenario | Side panel "Klipp": paste a link, the app recognises YouTube/Vimeo/Veo/Drive/other, coach adds label, start (and end for YouTube) as mm:ss, and "Vem kan se länken?" (Olistad – förvald / Privat / Publik / Vet inte). Player view and library card show "▶ Visa klipp". YouTube/Vimeo load an embedded player **only after the click** (`youtube-nocookie.com/embed/<id>?start=&end=&playsinline=1`, Vimeo `player.vimeo.com/video/<id>?dnt=1#t=`); all others show "Öppna i ny flik". | Optional **`Scenario.clips?: VideoClip[]`** with `{id, url, provider, startSec?, endSec?, label, access}` (from research, `matchLabel` folded into `label`). New pure `src/domain/video.ts`: `parseVideoUrl(url)` → provider/id/start, `embedUrl(clip)`; https only, max length 2048, max 10 clips [T]. Unknown provider → link only. | `types.ts`, `domain/video.ts` (new, heavy tests), `validate.ts`, `Editor.tsx`, `Player.tsx`, `Library.tsx`, new `ClipView.tsx` | M | Med: hostile URLs in imported JSON (`javascript:` etc.), iframe permissions, third-party requests – see security consultation. |
| P3.4 Privacy note | First time a clip is added: one dialog in plain Swedish – internal coaching only, prefer unlisted, don't share on open social media, remove if a player/guardian objects, check the club's routine and children with protected identity. Yellow warning on Publik/Vet inte and always on Veo links ("Veo-länkar måste vara publika"). Export dialog notes that the file contains working links. | UI + one localStorage flag "seen". | `Editor.tsx`, `Library.tsx` (export) | S | Low (wording should be read by the club). |

### R4 – "Formats, step clips, team roles" – total ≈ L

| ID | Coach/player experiences | Fits the model | Modules | Size | Risk |
|---|---|---|---|---|---|
| P4.1 Game formats 3v3–11v11 | New scenario asks "Spelform": 3 mot 3 (6–7 år) … 11 mot 11. The pitch is drawn at that format's size, filling the screen (so a 7v7 pitch on a phone gets ~2× the px per metre), with that format's goals/penalty area; offside-related guides only from 9v9. Formations offered per format. Changing format on an existing scenario rescales positions after a confirm. | Optional **`Scenario.format?: '3v3'\|'5v5'\|'7v7'\|'9v9'\|'11v11'`**, missing = 11v11 (old data unchanged). `pitch.ts` gets `pitchFor(format)` → `{length, width, goal, box}`; defaults **3v3 15×12, 5v5 30×20, 7v7 55×35, 9v9 70×52** (inside VERIFIED SvFF ranges; chosen value [T]), 11v11 105×68 (HYPOTHESIS for SvFF). Every user of `PITCH_LENGTH/WIDTH` (10 files) takes dims from the scenario; `validate` checks coords against the format. Small-format formations (7v7 2-3-1/3-2-1, 9v9 3-3-2/3-2-3) are HYPOTHESIS – owner/coach confirms. Corridors on small pitches: proportional fifths [T]. | `types.ts`, `pitch.ts`, `formations.ts`, `scenario.ts`, `suggestions.ts` (stays 11v11), `validate.ts`, `PitchView.tsx`, `EditorPitch.tsx`, `Editor.tsx`, `Library.tsx` + tests | L | Med–High: broadest refactor; do it after R2 so the gesture code is not changed twice. Rejected alt.: sub-pitch drawn inside 105×68 (zero refactor, but wastes most of a phone screen – conflicts with F5). |
| P4.2 Clips per step | "Klipp" also on a step; player view shows "▶ Så såg det ut" at that step. | Optional `Frame.clips?: VideoClip[]`, same validation. | as P3.3 + `scenario.ts` (insert/duplicate) | S–M | Low once P3.3 exists. |
| P4.3 Team role sheet | Squad area gets "Roller": per position × main phase, 2–4 short verb sentences (Skåne P15 pattern). Player view links "Din roll i Uppspel". | New team-level object (like roster) in its own `RoleStore` in localStorage, own export. Not part of `Scenario` → no scenario schema change. Relates to D6/ROADMAP fas 2 ("roller per position"). | `domain/roles.ts` (new), `storage/roleStore.ts` (new), `Squad.tsx`, `Player.tsx` | M | Med: content ownership (O4); grows into the Principle entity of D6 – decide then, not now. |

---

## 3. Movement model – alternatives

**A (recommended): linked arrows, planned forward.** Drag in step N → arrow in N + position in N+1. *For:* one gesture does
both jobs; keeps D5 (frames with absolute positions) and the existing "arrows = what happens next" meaning, so the
player view and old scenarios are untouched; additive optional fields only; free arrows still possible. *Against:*
arrows and positions in two frames must stay in sync (all frame operations need care, real bug risk); "player stays,
arrow goes" may feel odd to coaches who expect the token to move (prototype question); the rule for propagating into
later steps is a judgement call.

**B: derived arrows (no movement arrows stored).** Coach just drags players in each step (keyframes with ghost);
the app draws an arrow for every entity that moved more than ~1 m between N and N+1 (ball → pass, player → run, player
+ ball → dribble). *For:* nothing to keep in sync, zero schema change, simplest code. *Against:* every small shift of 22
players becomes an arrow → over-annotation (FIFA caveat); the coach cannot say "press" vs "run" or hide an unimportant
move without a per-entity flag – which re-introduces stored arrow data; curves need storage anyway; thresholds are
hidden magic; free arrows still exist, so two arrow concepts coexist. Worth testing only as a *rendering option*
("visa alla rörelser") on top of A.

**C: keep arrows independent (status quo + P1.1, P1.2 and an auto-move of the ball on pass).** *For:* cheapest, no
coupling. *Against:* leaves F1 (the H finding) unsolved – the coach still draws every run twice.

Rejected: Tactix-style path animation without frames (contradicts D5, large rewrite, no evidence it is needed).

---

## 4. What a prototype must test before production code

Throwaway prototype (separate branch or `prototype/` page, not merged), on a real 375 px phone and a laptop, 2–3
coaches if possible, else the owner. Knowledge entry `sim-first-before-code` applies.

1. **Drag-to-run on a 375 × 700 phone in landscape and portrait**: can a coach hit and drag the right player at
   ≈ 3.4 px/m with a 44 px hit circle? Error rate (wrong player picked) < 1 in 10 drags [T].
2. **Forward-plan (A) vs keyframe-with-ghost (B-style dragging)**: which do coaches understand without explanation?
   Measure actions and time for the "3 players + 1 pass, 3 steps" task; target ≤ 12 actions and < 2 min [T] vs today ≈ 26.
3. **Ball auto-follow**: is the inferred holder (distance ≤ 1.5 m [T]) ever wrong in normal use; is the ball's
   landing offset readable?
4. **Derived-arrow readability** (option B as rendering): with 22 players, does "show all moves" stay readable on a
   phone, or is curation (A) needed?
5. **Propagation into later steps**: do coaches expect a planned move to carry into steps N+2…?
6. **Curve handle on touch**: can the mid-handle be grabbed without grabbing the player/arrow?
7. **Video embed on the published site** (tiny, can be done in R3 spike): YouTube nocookie with start/end and Vimeo
   `dnt` play inline on iOS Safari and Android Chrome from GitHub Pages; check Veo/Drive links really refuse framing
   (headers not measured – research gap).

---

## 5. Modules touched overall

- **Domain (pure, tested):** `types.ts`, `scenario.ts`, `pitch.ts`, `formations.ts`; new `positions.ts`, `video.ts`,
  `roles.ts` (R4). `suggestions.ts`/`samples.ts` only to keep tests green (they stay 11v11, no linked arrows).
- **Editor:** `editorReducer.ts` (tools, `planMove`, clip/task actions), `autosave.ts` untouched.
- **Storage:** `validate.ts` (all new optional fields, URL checks), `scenarioStore.ts` (unchanged API), new `roleStore.ts` (R4).
- **Components:** `EditorPitch.tsx` (gestures, hit areas, curve handle), `PitchView.tsx` (ghost, curves, labels, format
  dims), `Editor.tsx` (toolbar, sheet, clips, tasks), `Player.tsx` (tasks, clips, label option), `Library.tsx` (phase
  grouping, clip badge, export note), `Squad.tsx` (glossary, roles), `usePlayback.ts` (curved paths), new `ClipView.tsx`.
- **Docs:** DECISIONS D13 (additive optional fields rule), D14 (movement model), D15 (video link-only + privacy),
  ARCHITECTURE data model, TASKS.
- **No new dependencies** in any proposal (D7 holds).

---

## 6. Consultation requests (max 3)

1. **ux-ui** – "For a coach on a 375 px phone and on a laptop: is *forward-plan* (drag in step N writes N+1, player
   stays) or *keyframe-with-ghost* (drag moves the player in the current step, arrow derived) the more learnable
   movement interaction; what is the smallest tool set and label scheme that fits one row at 375 px; and write the
   5-task prototype test script (section 4) with pass/fail thresholds." *Why:* R2 is the biggest and riskiest change and
   rests on an untested interaction hypothesis (F3, F5).
2. **frontend** – "In our React 19 + SVG setup without libraries: how should hit areas ≥ 44 CSS px, screen-px snapping,
   a curve handle and Bézier playback be implemented in `EditorPitch`/`PitchView`/`usePlayback`; can the editor rotate
   to portrait like the player view; and what is the cleanest way to make pitch dimensions per scenario (P4.1) so R2's
   gesture code doesn't need a second rewrite?" *Why:* sequencing R2 vs P4.1 and touch precision are the main
   implementation risks.
3. **security** – "For link-only video clips stored in localStorage and exported/imported as JSON: what URL allowlist
   (scheme/host), iframe attributes (`sandbox`, `allow`, `referrerpolicy` – YouTube needs a Referer), and meta-CSP
   (GitHub Pages has no headers) do we need; how do we stop a hostile imported file from injecting `javascript:` or
   tracking URLs; and is the privacy note in P3.4 sufficient for minors?" *Why:* P3.3 introduces the first
   third-party content and user-supplied URLs in the app (F9, F10).

---

## 7. Open decisions for the owner (in Swedish, each with a recommendation)

| # | Fråga | Rekommendation |
|---|---|---|
| O1 | **Vilken spelform och ålder spelar ditt lag (3 mot 3, 5 mot 5, 7 mot 7, 9 mot 9 eller 11 mot 11)?** Och spelar ni i flera olika? | Svara gärna med den ni spelar nu. Är det 7 eller 9 mot 9 flyttar vi spelformer (rätt planstorlek, rätt formationer) från paket 4 till paket 2. Är det 11 mot 11 ligger det kvar sist. |
| O2 | **Var kommer er matchvideo ifrån – Veo, YouTube, mobilen eller något annat?** | Appen sparar bara länkar, aldrig själva videon. YouTube och Vimeo kan spelas direkt i appen; allt annat öppnas i en ny flik. Mobilfiler stöds inte i första versionen. |
| O3 | **Kan tränarna ladda upp klipp som "olistade" på YouTube, eller måste det vara Veo-länkar (som kräver att inspelningen är publik)?** | Olistad YouTube rekommenderas: den kan visas i appen och syns inte i sökningar. Veo-länkar tillåts, men appen visar en varning eftersom de måste vara publika. Kontrollera klubbens rutin för samtycke och barn med skyddad identitet. |
| O4 | **Rollbeskrivningar: ska tränaren skriva dem själv, eller ska appen komma med färdiga standardtexter?** | Tränaren skriver själv (spelidén är er). Appen levererar bara positionsnamn och en neutral mening per position, plus ett exempel/mall för Uppspel som går att ändra. Färdiga rolltexter från oss riskerar att inte matcha er spelidé. |
| O5 | **Gäller fortfarande "inga extra bibliotek" (D7)?** | Ja. Allt i planen går att bygga utan nya bibliotek, även video (vanlig inbäddning) och kurvor. |
| O6 | **Ska bollen automatiskt följa med när man ritar en passning?** | Ja, med ångra. Testas i prototypen först. |
| O7 | **Får vi bygga en enkel prototyp av "dra spelaren dit hen ska springa" och testa den med dig (och gärna 1–2 tränare) på mobil innan vi bygger på riktigt?** | Ja. Det är den största ändringen och den enda som behöver testas med riktiga händer först. Paket 1 kan byggas samtidigt. |
| O8 | **Vad ska stå på spelarbrickan i spelarvyn: tröjnummer, position eller namn?** | Nummer i cirkeln, position under; spelaren kan själv välja namn i spelarvyn. |
| O9 | **Fasnamnen: OK att följa SvFF (Anfallsspel › Uppspel/Avslut, Omställning › Kontring/Återerövring, Försvarsspel › Press) och byta appens "Anfallsspel" till "Avslut och göra mål"?** | Ja – det matchar tränarutbildningen och kräver ingen datamigrering. |

---

## Left out and why

Backend/sharing links (brief), per-arrow timing (no evidence of need yet), pinch-zoom on the pitch (high gesture
complexity; formats + hit areas address precision first), local phone video files (cannot persist, research), "önskat
vs oönskat" branches and Principle entity (ROADMAP fas 2, not in the five focus areas), SvFF shirt-number map
(left/right of 2–5 unverified – do not ship until checked), 1:a/2:a/3:e anfallare labels (interesting, but derived
logic is a separate idea – revisit after P3.1).
