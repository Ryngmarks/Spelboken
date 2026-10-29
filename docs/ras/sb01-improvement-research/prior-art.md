# sb01 – prior art and current-state review

Author: Engineering Analyst, 2026-10-29. Evidence: VERIFIED (read code or ran app), OBSERVED, HYPOTHESIS.
App run: `npm run build` + `vite preview` on port 4175 (4174 was occupied by another process, left untouched), Chrome via playwright-core in a scratch dir outside the repo; server stopped. Tested 1280×800 and 375×700 touch.

## Prior art
- **RAS knowledge base** (13 entries, `knowledge/INDEX.md`): nothing on football, tactics boards, video embedding or UX review. Only process entries apply: `owner-decisions-per-round` (OBSERVED, record owner answers per round), `sim-first-before-code` (VERIFIED, prototype before building when numbers matter), `t3-html-render-for-visuals` (VERIFIED, show the owner visuals via html_render, not markdown images). → no domain prior art; external research is needed.
- **Project decisions that constrain proposals** (VERIFIED, `docs/DECISIONS.md`): D7 no state/router/UI libs; D5 scenario = entities + frames with absolute positions (movement = difference between frames; changing it is "Medel" to change); D6 principle is free text, `Principle` entity deferred until testers want principle-first; D8 Veo parked, plan = Veo share links with start time + uploaded MP4, no API (`docs/research/VEO.md`: no public API, ToS forbids scraping, no embed code); D9/T7 Supabase parked by this mission; D10 only name/number/position, exported files never contain names, minors likely.
- **Backlog already naming our topics** (`docs/TASKS.md`): export step/animation as image/video; wanted vs unwanted behaviour in one scenario; more sample scenarios; trash for deleted scenarios; more guides (zone 14, halves). PRODUCT.md acceptance: "scenario in 3 steps in < 5 min" and "usable on mobile" – both unmeasured with real users.

## Reusable code
- `src/domain/scenario.ts`: pure `insertFrameAfter` (:148, copies positions, drops drawings), `moveEntity` (:140), `addDrawing`, `interpolatePositions` (:233, `easeInOut`), `applyFormation` (:56), `duplicateScenario`. New "movement" features should be added here (pure + tests).
- `src/domain/suggestions.ts` (364 lines): generator pattern for multi-step scenarios; template for a "pattern library" / role presets.
- `src/domain/formations.ts`: `FORMATIONS` with labels per slot, `formationSlots` (mirrors away team). Extend for roles/descriptions.
- `src/editor/editorReducer.ts`: undo/redo with `coalesceKey`, one action per feature. `src/components/EditorPitch.tsx`: `snap()` (:43, SNAP_DISTANCE 2.6 m) and gesture model with `pointerId` – base for auto-arrows, drag-from-ball, etc.
- `src/components/PitchView.tsx`: renderer shared by editor, player and library previews; `trimmedArrow` ties arrows to positions.
- `src/domain/roster.ts` + `types.ts`: `POSITIONS`, `Person.positions`, `focusPositions`, `isRelevantFor` for any position-based feature.
- `src/storage/validate.ts` + `schemaVersion: 1`: any new field (e.g. `videos`, role text) needs validation and a migration plan.

## Pitfalls / constraints
- Schema change (`Frame`/`Scenario`) hits storage, validate, export/import, suggestions and samples at once (VERIFIED by grep of types usage); add optional fields, keep `schemaVersion` handling.
- Video of minors: link-only keeps files off our storage (D10); uploaded MP4 in localStorage is not feasible (HYPOTHESIS: ~5 MB quota). Embeds (YouTube iframe) add third-party requests/cookies → privacy decision for owner.
- GitHub Pages is static: no server-side video handling, no redirects.

## Current-state findings
Severity: H/M/L.

### (a) Features and clarity
1. **Arrows are not tied to movement.** A step is a snapshot; arrows are free-floating drawings; moving a player draws nothing, drawing a run moves nothing. VERIFIED (`scenario.ts:148-156`, `editorReducer.ts` moveEntity/addDrawing; run: new step had 0 drawings). **H**
2. **No previous-step "ghost"** while editing step N, so the coach cannot see where players came from. VERIFIED by reading `EditorPitch`/`PitchView` props (only current frame). **M**
3. **Scenario metadata is hidden below the pitch on phones** (side panel stacks under the timeline at ≤900 px; `styles.css:810`) and phase/principle/focus positions are easy to miss. OBSERVED (375 px screenshot). **M**
4. Scenario title defaults to "Nytt scenario" with 22 players pre-placed (`App.tsx:163`, 4-3-3 vs 4-4-2): good start, but the formation names are not explained and "Ersätter lagets spelare i alla steg" is a destructive action behind a dropdown + confirm. VERIFIED. **L**

### (b) Effort for "3 players move + 1 pass over 3 steps" (VERIFIED by code + run; counts are my derivation)
- Step 1: pass arrow = tool (1) + drag (1) = 2. Steps 2 and 3, each: "+ Steg" (1), "Flytta" (1), drag 3 players (3) + ball (1), optionally "Löpning" (1) + 3 run arrows (3), "Passning" (1) + drag (1) → **12 actions per step with arrows, 6 without**. Total ≈ **26 actions (14 minimum)**, plus caption typing per step.
- Slow/unclear: the ball is a separate entity that must be dragged by hand after a pass; run arrows duplicate the move; tool switching each time (tool stays on last arrow tool, so a drag after "+ Steg" draws an arrow instead of moving – VERIFIED `editorReducer` setTool/insertFrame leave tool unchanged). **H**
- The tool's hint is shown only in a small line (`Editor.tsx:119`); no onboarding or empty-state guidance in the editor. VERIFIED. **M**

### (c) First-time coach, laptop and touch
1. **Touch targets are 38 px high**, below the 44 px recommendation; all 27 toolbar/timeline/topbar buttons measured < 44 in one dimension on laptop and phone. VERIFIED (playwright getBoundingClientRect; `styles.css:70,385`). **M**
2. **On 375 px the toolbar is icons only** (`styles.css:~833`): "+ Eget lag" and "+ Motståndare" are just a blue and a red dot, "Flytta"/"Löpning" rely on tiny icons; labels vanish with no `title` on touch. VERIFIED (screenshot). **H**
3. **Pitch is small in the phone editor** (355×239 px → ~3.4 px/m, player circle ≈ 13 px), so precise dragging and snapping (2.6 m ≈ 9 px) is hard; player view rotates to portrait, editor does not. VERIFIED (measured), usability impact OBSERVED. **H**
4. Keyboard shortcuts (V R P D T Y H M) exist but are only visible as tooltips. VERIFIED. **L**
5. No page overflow at 375 px; autosave and error banner work (T5). VERIFIED. (positive)

### (d) Positions and roles
1. **Position codes are unexplained jargon**: `POSITIONS = MV HB MB VB DM CM OM HY VY CF` mixes Swedish (MV, HB, VB, HY, VY, MB) and English (DM, CM, OM, CF); no full names or descriptions anywhere. VERIFIED (`types.ts`, `formations.ts`). **H**
2. **Role label on the pitch is a 4-char free text** (`Editor.tsx:338`), unlinked to `POSITIONS`; focus positions are chips only. A scenario cannot say what each position must do. VERIFIED. **H**
3. Labels render at ~1.7 m below the player in small SVG text; a linked person's name replaces the role label, so role and name never show together. VERIFIED (`PitchView.tsx:349`). **M**
4. Formations offer only 4-3-3, 4-4-2, 4-2-3-1 (`formations.ts`); no 3-back or 7-/9-a-side formations although the target seems to be youth football (HYPOTHESIS: age group not stated in docs). **M**

### (e) Where a video clip could attach
- Scenario-level: add optional `videos: {url, label, startSeconds?}[]` to `Scenario` (`types.ts:73`), shown in player view and library card; edit UI in the side panel "Scenario" section (`Editor.tsx:157`). Step-level: optional on `Frame` (caption already lives there, `Player.tsx:101`). VERIFIED (code inspection; not built). Needs validate/export changes (see pitfalls). **M**
- Principle-level (D6 free text) has no entity to hang a clip on. VERIFIED. **L**

## Gaps for research (no internal experience)
1. How other tactics tools (Tactical Pad, Coach Tactical Board, Sportplan/Hudl, Veo) create multi-step movement and show roles. 2. Swedish position and role terminology (SvFF Spelarutvecklingsplan, 7-/9-/11-manna) and typical role descriptions. 3. Video: link formats (Veo, YouTube timestamp, Drive), embed vs link-out, GDPR for minors' video. 4. Touch tactics-board UX (tool palettes, drag-from-player to draw). 5. Prototype suggested: auto-arrow on move + ghost of previous step; measure actions again.
