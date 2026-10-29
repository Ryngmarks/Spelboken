# sb01-improvement-research-C2 (frontend): Touch, curves, R2/R4 boundary

Base: `owner-decisions.md` > `draft.md`. Question from the Architect (verbatim):
"In this React 19 + SVG setup without libraries: (1) how should hit areas of at least 44 CSS px on a 375 px phone be achieved for players and arrows when the pitch renders ~355 px wide (screen-px based hit radius, enlarge on touch, or rotate the editor to portrait like the player view – which, and what does each cost)? (2) how should an optional curve (one quadratic Bézier control point on run/dribble arrows) be stored (optional field, schemaVersion stays 1) and played back so the player animates along the curve in usePlayback? (3) for the drag-to-run model, where should the logic live (pure domain function in src/domain + reducer action) so it is unit-testable, and how should pitch dimensions be abstracted now (e.g. a PitchSpec passed through instead of PITCH_LENGTH/PITCH_WIDTH constants) so R4 game formats do not need a second rewrite of the gesture code?"

Profile: `C:/Users/johan/Desktop/Claude johan/ryngmark-agents/profiles/application/frontend.md`.

## 1. Recommendation

Use screen-space targets now; prototype portrait separately. Keep business rules pure.

| Claim / recommendation | Evidence |
|---|---|
| Players have radius 1.9 m, arrow hit strokes 2.5 m, snapping 2.6 m. Interactive portrait is disabled. Playback calls linear interpolation; editor reducer supports grouped undo. | VERIFIED: PitchView.tsx, EditorPitch.tsx, styles.css, scenario.ts, usePlayback.ts, editorReducer.ts. |
| Including padding, 355/(105+8)=3.14 px/m: player diameter 11.94 px; 44 px target radius 7.00 m. Portrait gives 4.67 px/m and 17.75 px visible players: rotation alone is insufficient. | VERIFIED: code constants + PowerShell arithmetic, assuming supplied 355 px SVG width; no device measurement. |
| Add invisible player/ball/handle circles with radius `max(visualRadius,22/s)`, `s=hypot(ctm.a,ctm.b)` from the pitch-content group's CTM. Arrows get transparent 44 CSS px non-scaling strokes, round caps, explicit `pointer-events:stroke`; hit-test the curved centreline, not today's chord. Visual sizes stay unchanged. | HYPOTHESIS: proposed uniform-scale implementation; cost M [T]. |
| Resolve candidates centrally on pointer-down in client coordinates: selected handle first, nearest entity next, nearest eligible arrow last; deterministic ties plus cycle/list fallback for crowding. Suppress competing child handlers. Snap by client-pixel distance, initially 24 px [T]. Recompute after resize/orientation; inverse **content-group** CTM maps back to metres. | HYPOTHESIS: replaces DOM paint-order selection; prototype required. |
| Add `control?: Point` only for run/dribble and `entityId?: string` for linked movers. Absolute metre coordinates; absent control means straight; `schemaVersion:1`. Validator must retain finite bounded points, reject malformed/present-null controls, unsupported arrow types and dangling links. Keep fallback `from/to`. Old readers drop additions on re-save. | VERIFIED: validate.ts reconstructs arrows, dropping unknown fields. HYPOTHESIS: additive contract. |
| Pure `pathPoint(P0,C,P1,u)=(1-u)^2 P0+2(1-u)u C+u^2 P1`; missing C uses lerp. Extend `interpolatePositions` to select the source frame's uniquely linked run/dribble per entity and evaluate with existing `easeInOut(t)`. Legacy/unlinked arrows stay decorative; other entities stay linear. `usePlayback` keeps its call; `playbackReducer` timing/pause and the hook's reduced-motion path remain unchanged. | VERIFIED: existing hook/interpolation/reducer separation. HYPOTHESIS: extension, not constant-speed playback. |
| Share centreline with SVG Q rendering; dribble waves are bounded decorative normal offsets only. Trim visible endpoints along the curve, never playback endpoints. Mid-handle `H=B(0.5)` implies `C=2H-(P0+P1)/2`. Endpoint edits translate C by midpoint displacement; zero-length paths stay stationary. Dribbling ball uses the same curve plus agreed carrier offset. | HYPOTHESIS: proposed geometry; tests required. |
| EditorPitch owns capture, coordinate conversion and transient preview only. Release dispatches one `planMove`; reducer calls pure `src/domain/movement.ts: planMove(scenario,frameIndex,command,pitchSpec)` and commits once. Supply IDs in command. Keep N fixed; upsert one linked arrow in N, update N+1/create if absent; no N+2 propagation initially. Cancel discards preview. | VERIFIED: current moves commit during pointer-move; history already exists. HYPOTHESIS: atomic replacement. |
| Introduce readonly `PitchSpec {length,width}` and `DEFAULT_PITCH` (105×68) in R2. Resolve once at editor/player boundary; thread through PitchView, EditorPitch, clamping/domain commands and validation bounds. Derive viewBox/transforms from it; metres remain canonical. Add a markings/guide resolver seam with only 11v11 implemented. R4 adds scenario format persistence/resolver/markings/formations, not another gesture rewrite. | HYPOTHESIS: limited preparatory refactor; no format picker or per-scenario dimensions now. |

## 2. Alternatives (1–2)

| Alternative | Cost / trade-off | Evidence |
|---|---|---|
| Enlarge visible tokens on touch | S [T]; optional feedback only. Enlargement after contact cannot fix an initial miss; hybrid devices complicate touch detection. More occlusion; screen-space targets still needed. | HYPOTHESIS |
| Portrait editor | M–L [T]: enable interactive rotation, invert content CTM, counter-rotate labels/handles, audit previews/guides/page height. More separation, but still needs 44 px targets; test first. | VERIFIED: current group rotation and root-only input transform. HYPOTHESIS: cost/usability. |

## 3. Risks

| Risk | Check / mitigation | Evidence |
|---|---|---|
| Overlap, scrolling, cancellation | Real 375 px phone with 22 players, ball, crossing curves; wrong selection <1/10 [T]. Check 44 px bounds at edges, resize, hybrid input and cancel-without-history. | HYPOTHESIS; no device test run. |
| Divergent links | Test endpoint edits, duplicate/remapped IDs, reorder/delete, final-frame links and undo/redo. Centralise reconciliation; clear links lacking a following frame, retaining decorative geometry. | VERIFIED: existing frame/duplicate operations lack link handling. HYPOTHESIS: policy. |
| Curve/import regressions | Test u=0/0.5/1, absent/malformed controls, coincident endpoints, pause/resume, dribble-ball coupling, JSON round-trip and injected alternative PitchSpec. | HYPOTHESIS: required checks, not executed. |

## 4. Needs from others

- UX/owner: confirm forward-plan, crowd-selection fallback and propagation policy in prototype.
- Architect: approve control/endpoint semantics and reconciliation invariants.
- Security: Veo link validation/new-tab attributes; no embeds.

## 5. Changes vs the draft

- Replace `bend` with explicit `control`; arbitrary handle movement needs no perpendicular constraint.
- Pull only PitchSpec seams into R2; formats remain R4, 11v11 only now.
- Owner's Veo-only/new-tab decision supersedes embed experiments. These are recommendations, not implementation approval.
