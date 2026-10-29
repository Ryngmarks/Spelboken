# sb01 work order status

Integration branch: `sb01-integration` (main is merged only with the owner's yes, owner-decisions #6).

| WO | Status | Verified by PM | Review |
|---|---|---|---|
| 01 | DONE, merged to sb01-integration | diff scope OK, `npm test` 74/74, `npm run build` OK | skipped (S, low risk) |
| 03 | merged to sb01-integration, in review | scope OK, CSS append conflict resolved (kept both), `npm test` 132/132 on integration, build OK | Codex (author Claude) |
| 04 | DONE (PASS WITH FIXES), merged to sb01-integration | scope OK; PM fixed M1 (hostile ids, test fails on old code) + m2; `npm test` 104/104 on integration, build OK | Claude Opus: WO-04.review.md |
| 02 | DONE, merged to sb01-integration | diff scope OK, `npm test` 74/74, build OK; 44 px + no overflow measured by implementer | skipped (UI only, reversible) |

PM decisions inside scope: sheet does not auto-open on selection (accent dot only); toolbar scroll at 375 px accepted until WO-06 (5 buttons).

Carried into WO-05/06 from WO-04.review.md: m1 (dribble arrow keeps ball after pass re-target), m3 (manual ball move in k+1 overridden by linked pass/dribble – gesture must explain or prevent), m4 (insert step mid-move gives zero-length arrows), m5 (removing a dribble resets a pass into space).
| 05 | running (prototype) | | |

PM decision inside scope: remaining `PITCH_LENGTH/WIDTH` users (Editor, scenario, formations, …) move to `PitchSpec` with R4 formats, not now.
