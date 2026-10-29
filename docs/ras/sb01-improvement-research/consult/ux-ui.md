# sb01-improvement-research-C1 (ux-ui): Movement gesture, pass, toolbar, prototype test

Base: `owner-decisions.md` > `draft.md` (v1). Question from the Architect (verbatim): "For a coach on a 375 px phone and on a laptop: is *forward-plan* (dragging a player in step N writes their position in step N+1 and draws a run arrow in step N; the player stays put in N) or *keyframe-with-ghost* (dragging moves the player in the current step; a ghost of the previous step is shown and the arrow is derived from the difference) the more learnable movement interaction? How should a pass be made so the ball follows the receiver? What is the smallest tool set and label scheme that fits one row at 375 px? Write the 5-task prototype test script with pass/fail thresholds (time, errors, unaided success) that the owner can run with 1–3 coaches in ~15 minutes each."
Profile: `ryngmark-agents/profiles/application/ux-ui.md`. Evidence: **V** VERIFIED, **O** OBSERVED, **H** HYPOTHESIS; numbers **[T]** are tuned in the prototype.

## 1. Recommendation

**Lead with keyframe-with-ghost (B-gesture); test forward-plan (A) against it in the same prototype.** Both gestures write the *same data* – a linked arrow (`entityId`, `targetId`) in the step the move starts from, plus the position in the next step – so the choice is UI-only and cheap to reverse (H, follows from draft P2.1).

| # | Claim | Evidence |
|---|---|---|
| 1 | B is the market's default: frame-by-frame + ghost (TacticSlate, Tacticsboard, TacBoard, Censabella). | V/O (TACTICS-BOARDS §1) |
| 2 | B needs no movement mode: the token follows the finger in every step; step 1 = line-up, step ≥ 2 = movement. A needs two drag behaviours on the same token (Flytta vs Rörelse) → silent mode errors. | Code V (`EditorPitch` drag = move); learnability H |
| 3 | A's strength: what the coach sees in step N (arrow + caption) is what the player view shows in step N (F2). B shows the arrow in step N but plays it in N−1. | V (F2); impact H – test T4 |
| 4 | **Pass = drag the ball** onto a team-mate (no pass tool). Receiver gets a highlight ring + "→ 9 CF" in the hint line while within **44 screen-px [T]**; release attaches the ball (`targetId`) and it follows the receiver's end position. Release on grass = pass into space. Dragging the player who has the ball (≤ 1.5 m [T]) = dribble, ball follows. Arrow type is automatic; Press via chips on the selected arrow. | H |
| 5 | Moves < 2 m [T] create no arrow (fine-tuning without clutter). "Ta bort löpning" returns the player to the start position. | H |

**Toolbar, one row at 375 px:** 359 px usable → 5 buttons of ~68 × 48 px, icon above text, labels ≤ 7 chars (H; current 38 px icon-only row is V).

| Variant | Buttons | Off the row |
|---|---|---|
| B (lead) | Flytta · Pil · Yta · + Eget · + Motst. | "+ Boll" as empty-state hint; "+ Steg" stays in the timeline; Undo in top bar |
| A (test) | Flytta · Rörelse · Yta · + Eget · + Motst. | Free arrows = Rörelse from empty grass (draft) |

Arrow chips: Löpning · Passning · Dribbling · Press (existing `ARROW_LABELS`). Hint line per step: step 1 "Ställ upp spelarna", step ≥ 2 "Dra spelarna dit de springer – förra steget syns svagt".

## 2. Alternatives

- **A as default:** better if T4 shows coaches are confused by B's step offset (claim 3). Costs a mode and a sixth concept.
- **A-gesture with a pulled ghost:** in A, the finger drags a translucent copy while the original stays; the copy remains at the arrow tip. Use if A wins but "nothing moved" errors appear.

## 3. Risks

1. B: adjusting a start position in step ≥ 2 creates a run → 2 m threshold, one-tap undo, T5.
2. 13 px tokens and overlapping 44 px hit circles in the box → nearest centre wins, highlight before release, landscape allowed.
3. Owner knows the app → owner run is a pilot, not counted.

## 4. Needs from others

- **Frontend:** variant toggle `?v=a|b`, screen-px hit radius, in-memory event log (drags, undos, time per task; no names).
- **Architect:** confirm both gestures share one data shape; decide propagation into N+2… before T4.
- **PM/owner:** recruit coaches, counterbalance order (coach 1: B→A, coach 2: A→B), fill in the sheet.

## 5. Changes vs the draft

- Draft recommends A's gesture; I lead with B's gesture on A's data model. Drop the separate Passning/Dribbling tools (P2.4 keeps Passning).

## Test script (~15 min per coach, phone 375 px, portrait first)

Setup: 4-2-3-1 vs 4-4-2, ball at MB, one empty step. Hints: **0** none (unaided), **1** "titta på verktygsraden/planen", **2** shown how. Error = result that needs undo or that the coach did not intend. Owner notes time from "kör" to "klar", errors, hint level, a quote. Order: intro 1 min, T1–T5 in first variant 10 min, T2 + T4 in second variant 3 min, "Vilken var lättast, och varför?" 1 min.

| Task (said aloud) | Measures | Pass | Fail |
|---|---|---|---|
| T1 "Flytta vänsterbacken 10 meter framåt i steg 1." | Picking the right token | Hint 0, ≤ 20 s, ≤ 1 wrong pick in the task | Hint 2 or ≥ 2 wrong picks |
| T2 "Låt 8:an löpa in bakom deras mittfält." | Movement gesture | Hint 0, ≤ 60 s, ≤ 1 error | Hint 2, > 90 s or ≥ 2 errors |
| T3 "Spela bollen från mittbacken till 6:an." then "…och vidare till 8:an där hen landar." | Pass + ball follows | Hint 0, ≤ 60 s, ball at the right player both times | Ball on wrong player or hint 2 |
| T4 "Gör uppspelet: tre spelare rör sig och en passning, över tre steg. Spela upp." Ask: "Är det så du menade?" | Whole flow, step semantics | ≤ 2 min, ≤ 12 actions, ≤ 2 errors, coach says yes | > 3 min, or coach says playback is wrong |
| T5 "8:an ska springa kortare. Ta sedan bort 9:ans löpning." | Edit and remove | Hint 0, ≤ 45 s, 0 stray changes | Hint 2 or another player/step changed |

Decision rule [T]: a variant **passes** if every counted coach passes T2–T4 with hint ≤ 1 and no T4 > 3 min. Both pass → fewer errors, then coach preference. Neither passes → stop R2, fall back to draft alternative C (P1.1 + P1.2 + ball follows pass).
