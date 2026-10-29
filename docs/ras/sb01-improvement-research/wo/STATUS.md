# sb01 work order status

Integration branch: `sb01-integration` (main is merged only with the owner's yes, owner-decisions #6).

| WO | Status | Verified by PM | Review |
|---|---|---|---|
| 01 | DONE, merged to sb01-integration | diff scope OK, `npm test` 74/74, `npm run build` OK | skipped (S, low risk) |
| 03 | running | | |
| 04 | in review | diff scope OK, `npm test` 103/103, build OK | Claude Opus (author Codex) |
| 02 | DONE, merged to sb01-integration | diff scope OK, `npm test` 74/74, build OK; 44 px + no overflow measured by implementer | skipped (UI only, reversible) |

PM decisions inside scope: sheet does not auto-open on selection (accent dot only); toolbar scroll at 375 px accepted until WO-06 (5 buttons).
