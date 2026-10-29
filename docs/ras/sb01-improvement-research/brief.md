# sb01-improvement-research – brief

## Idea (owner's words, 2026-10-29)
"Gör en större analys vad vi kan fortsätta förbättra i appen, inget med Supabase ännu utan först jobba med
funktioner och tydlighet, skapa lättare rörelsemönster, göra den lätt använd, skapa tydlighet kring positioner,
koppla klipp genom kanske länkar eller annat – men gör först ett stort research-uppdrag."

## Goal
A prioritised, evidence-backed improvement plan for Spelboken (football playbook web app) before any backend work.
Five focus areas:
1. **Features and clarity** – what coaches and players actually need from a tactical playbook.
2. **Easier movement patterns** – creating multi-step player/ball movement must be fast and obvious.
3. **Ease of use** – first-time coach should succeed without instructions, on laptop and phone/tablet.
4. **Clarity around positions** – what each position/role does in a scenario; Swedish naming conventions.
5. **Video clips** – attach clips to scenarios/steps (links to Veo, YouTube, phone video, etc.).

## Size: LARGE
Broad, several unknowns (competitor patterns, video embedding/privacy, coaching conventions), and the result decides
the next months of work. Research first, then a draft with owner decisions.

## Current state (already built, see docs/TASKS.md, docs/DECISIONS.md)
- React 19 + TS + Vite, no runtime libraries except React (D7). SVG pitch 105×68 m. localStorage + JSON export/import.
- Scenario = entities (players, ball) + frames (positions per step, arrows run/pass/dribble/press, zones, caption).
- Editor with tools, undo/redo, autosave; player view with animated playback, portrait mode on phones.
- Library grouped by phase/principle, filters by position/phase/person. Squad (name, number, positions) linked to
  players. Pitch guides (corridors, thirds). 10 generated build-up suggestions (3+1 vs 4-2-3-1).
- Live: https://ryngmarks.github.io/Spelboken/

## Constraints
- No Supabase / backend work in this mission (T7 stays parked).
- No new runtime dependencies without the owner's yes (project AGENTS.md, D7).
- Personal data minimal (D10): players are likely minors – video of minors needs care (GDPR, consent).
- Veo has no public API (docs/research/VEO.md, D8 parked) – links/manual timestamps are the realistic path.
- UI in Swedish; code and RAS files in English.

## Out of scope
Backend, accounts, payments, AI analysis of video, native apps.

## Deliverables of this mission (discovery part)
prior-art.md (incl. a usability review of the current app), research reports in docs/research/ + research-handoff.md,
then draft.md with prioritised proposals and open owner decisions.
