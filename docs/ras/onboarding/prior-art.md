# Prior art – onboarding review: Coach Helper / "Spelboken"

Date 2026-10-29 · Author: RAS Engineering Analyst · Scope: read-only review, no project code changed.
Project rules (`AGENTS.md`, `docs/`) take precedence over RAS. Evidence levels: RAS AGENTS.md §5.

**Runs done today:** `npm test` → 9 files, 56 tests passed (vitest 5.0.5). `npm run build` → `tsc` + `vite build` OK,
37 modules, 281 kB JS (87 kB gzip). Both VERIFIED by run. Git: 11 commits, all 2026-10-28/29.

## 1. Architecture map
Static React 19 + TS (strict) + Vite SPA, no backend, no state/router libs (D2, D7). Layers, one-way (ARCHITECTURE.md):

| Layer | Path | Role |
|---|---|---|
| Domain (pure TS) | `src/domain/` | `types.ts` (Scenario = entities + frames, 105×68 m), `scenario.ts` (immutable ops, interpolation), `formations.ts`, `pitch.ts` (corridors/thirds geometry), `roster.ts` (Person, personId links), `samples.ts`, `suggestions.ts` (10 generated build-up scenarios) |
| Editor state | `src/editor/` | `editorReducer.ts` (pure, undo `past[]`, merge key for drags), `autosave.ts` (debounced, flush on `pagehide`) |
| Storage | `src/storage/` | `scenarioStore.ts` (`ScenarioStore` + localStorage impl, JSON export/import/conflict resolution), `rosterStore.ts`, `validate.ts` (runtime parse of untrusted data) |
| UI | `src/components/`, `src/App.tsx` | Library, Editor, EditorPitch, PitchView (shared SVG renderer), Player, Squad, `usePlayback` + `playbackReducer` |
| Backend (prepared, unused) | `supabase/migrations/0001_initial.sql` | teams, team_members (coach/player), people, scenarios (`data jsonb`), RLS via `has_team_role()` |
| CI/CD | `.github/workflows/deploy.yml` | push to main → `npm ci`, `npm test`, `npm run build` → GitHub Pages (D12) |

**Persistence seam (T7):** `ScenarioStore` / `RosterStore` are the only code touching `localStorage`; `App.tsx:20-21`
instantiates them at module level and is the only consumer (Library/Squad get data via props). The seam is real but
**synchronous** (`list(): Scenario[]`), so T7 changes signatures, the `useState(() => store.list())` initialisers, the
`tryStore` try/catch pattern (`App.tsx:40`) and the `Autosaver` save callback. No Supabase client dependency exists yet.

## 2. What works
| Claim | Evidence | Backed by |
|---|---|---|
| Domain ops (create/move/frames/drawings/interpolate/duplicate), formations, guide geometry | VERIFIED | `scenario.test.ts`, `pitch.test.ts`; `npm test` 2026-10-29 |
| Editor reducer incl. undo/redo, guide toggles undoable | VERIFIED | `editorReducer.test.ts` |
| Autosave never drops last change, reports failure | VERIFIED | `autosave.test.ts` |
| Import/export round-trip, invalid + out-of-bounds data skipped, conflict → copy | VERIFIED | `scenarioStore.test.ts` |
| Roster linking/unlinking; exports carry no names | VERIFIED | `roster.test.ts` (names live only in roster) |
| 10 generated scenarios: structure, mirroring, clear passing lanes | VERIFIED | `suggestions.test.ts` |
| Pause freezes animation | VERIFIED | `playbackReducer.test.ts` |
| Production build | VERIFIED | `npm run build` 2026-10-29 |
| Live Pages deploy | OBSERVED | workflow read; live URL not fetched by me |
| UI behaviour (touch drag, 375 px layout, playback look) | OBSERVED (docs claim browser checks) | **no component/DOM tests**; vitest env is `node` |

## 3. Known issues, risks, gaps
1. **KNOWN ISSUE – silent data-loss path in storage.** `readAll()` drops scenarios that fail `parseScenario` (e.g. any
   `schemaVersion !== 1`, `validate.ts:62`) and `save()` rewrites the filtered list, permanently deleting them. Corrupt JSON →
   `[]`, next save overwrites the key (`scenarioStore.ts:17-36`; the test only asserts `list()` returns `[]`). Harmless with one
   schema version; a format bump needs a migration *before* the reader changes (RAS §7). Code reading → OBSERVED.
2. **KNOWN ISSUE – id shape vs Supabase.** `scenarios.id` / `people.id` are `uuid`; `parseScenario` accepts any string id,
   so imported or hand-made files with non-UUID ids would be rejected on upload. App-generated ids are `randomUUID()` (OK). OBSERVED.
3. **Risk – RLS untested.** T7 acceptance requires "two accounts can't see each other's team"; no RLS tests and no evidence the
   migration was applied. Policies read plausibly → HYPOTHESIS until run. `people.user_id` and role `player` are unused.
4. **Risk – squad has no export/import path**; names stay in one browser (by design, D10), so switching device before T7 loses the squad.
5. **Risk – delete is `confirm()` + hard delete** (`Library.tsx:214`); no undo/trash (backlog).
6. **Doc/code mismatches (flagged, not fixed):** D3 says rendering is isolated in `PitchCanvas` – no such file (it is `PitchView.tsx` /
   `EditorPitch.tsx`). ARCHITECTURE.md tech table says hosting "ej beslutat", D12 decided GitHub Pages. TASKS T5 lists
   save-on-`pagehide` as done; the `autosave.ts` helper is tested, its wiring in `Editor.tsx` is not (no component tests).
7. **Gap – no migration framework**; `schemaVersion` is the literal type `1`. Branching (desired/undesired) or new Frame fields need version 2 + tests.
8. **Gap – CI runs only on push to main** (tests gate the deploy, not merges); no lint/format config. OBSERVED.
9. Very new major versions (TypeScript ^7, vitest 5, vite 8, React 19.3): green today, upgrade churn unmeasured.
10. Large files (`Editor.tsx` 505, `suggestions.ts` 364, `PitchView.tsx` 356 lines) – acceptable per RAS §7, single-purpose.

## 4. Reuse candidates by upcoming work
| Mission | Reuse (path) | What it gives |
|---|---|---|
| T7 Supabase | `storage/scenarioStore.ts`, `rosterStore.ts` (interfaces); `storage/validate.ts`; `editor/autosave.ts`; `resolveImport`/`findConflicts`; `supabase/migrations/0001_initial.sql` | run server rows through `parseScenario`/`parsePerson`; autosaver is the spot for "local draft until server confirms"; one-time local→account move can reuse import resolution |
| Export step as image | `components/PitchView.tsx` (exposes `svgRef`) | serialise SVG → canvas → PNG; one renderer shared by editor and player |
| Export animation as video | `components/usePlayback.ts`, `playbackReducer.ts`; `domain/scenario.ts` `interpolatePositions`/`easeInOut` | deterministic frame stepping independent of the DOM clock |
| Desired vs undesired behaviour | `domain/types.ts` Frame/Scenario; `storage/validate.ts`; `scenario.ts` `duplicateScenario`, `insertFrameAfter` | needs schemaVersion 2 (risk 7); Player stepping reusable |
| More example scenarios | `domain/suggestions.ts` (builder + mirror + lane test), `samples.ts`, "Förslag" button in `Library.tsx` | pattern: builder fn + structural test; add press/transition/set-piece builders |
| Trash / undo delete | `editor/editorReducer.ts` `past[]` pattern; `Library.tsx` delete handler; `ScenarioStore.remove` | soft-delete flag or deleted list in the store; same for Supabase (`deleted_at`) |
| More guide lines | `domain/pitch.ts` (`PitchBand`, `CORRIDORS`, `THIRDS`), `GuideToggles.tsx`, `PITCH_GUIDES` in `types.ts`, guides filter in `parseScenario` | add geometry + one `PitchGuide` id; tests exist for the pattern |

## 5. Matching RAS knowledge entries
Only 13 entries exist; none are football/React/Supabase-specific.
- `owner-decisions-per-round` (OBSERVED) – project already has `DECISIONS.md`; a per-round log only fits mission-level choices (e.g. T7 auth/hosting options).
- `t3-delegate-task-own-chat` (VERIFIED) – how RAS agents are started for this repo.
- `t3-html-render-for-visuals` (VERIFIED) – owner cannot see markdown images; relevant when showing pitch/export visuals.
- `claude-md-imports-agents-md` (OBSERVED) – repo has `AGENTS.md` but no `CLAUDE.md`; `@AGENTS.md` import is the known pattern if Claude Code is used here.
- `worktree-relative-paths` (VERIFIED) – parallel worktree delegates will not see `.env.local` (gitignored) needed for Supabase.
- `sim-first-before-code` (VERIFIED) – nothing numbers-driven in the backlog; only relevant if video-export performance becomes a question.
- Gap: no entry on Supabase/RLS, SVG/video export or localStorage migration.

## 6. Proposed knowledge entries (propose only; not written to `knowledge/`)
| id | Title | Type | Evidence | Content | Source |
|---|---|---|---|---|---|
| `local-store-silent-drop` | A load-filter-save localStorage store silently deletes records its parser rejects | lesson | OBSERVED (code reading, no test) | Filtering invalid rows on read and rewriting the whole array on save destroys unknown-version or corrupt data; keep raw rows or migrate before parsing. | `src/storage/scenarioStore.ts:17-36`, `src/storage/validate.ts:62` |
| `store-seam-sync-vs-async` | A synchronous store interface hides the async cost of a later server backend | lesson | OBSERVED (to be confirmed during T7) | `list(): T[]` "replaceable by a server later" does not hold; make the seam Promise-based from the start or budget a UI-state rewrite. | `docs/ARCHITECTURE.md`, `src/App.tsx:20-60` |
| `pure-reducer-plus-node-tests` | Pure domain + reducer + autosaver gives 56 fast tests without a DOM | pattern | VERIFIED (`npm test`: 56 pass, ~190 ms, vitest env `node`) | Keep logic in pure modules and test in node; accept the UI layer is checked manually and say so. | `src/domain`, `src/editor`, commit `cca6a84` |
| `parser-id-shape-vs-db-uuid` | Validate id shape in the import parser when the future DB column is uuid | lesson | HYPOTHESIS (until a T7 upload is run) | A parser that accepts any string id passes data a uuid column rejects; check the format at the parse boundary. | `src/storage/validate.ts`, `supabase/migrations/0001_initial.sql` |

Suggestion: promote #1 to VERIFIED with a small test (store a `schemaVersion: 2` scenario, save another, assert the first is gone) before it enters the knowledge base.
