# sb01-improvement-research – owner decisions

Answers from the owner to the drafts and the blueprint. **These override the drafts and the blueprint where they
differ.** One section per round, items numbered continuously across rounds. Newest round wins.

## 2026-10-29, round 1 (draft.md, section 7)
1. **Format: 11 mot 11** (O1). Game formats stay in R4; no reprioritisation.
2. **Video: "Bara Veo-länkar"** (O2/O3). Primary source is Veo. Veo links open in a new tab (no embed found) with a
   note that the recording must be public in Veo. Embedded YouTube/Vimeo is not a priority; a generic link fallback
   is enough. Privacy note for minors still applies.
3. **Role texts: the coach writes them** (O4). The app ships position names, one neutral sentence per position and an
   editable template for Uppspel – no full default role texts.
4. **Prototype approved: "Ja, kör"** (O7). Build a prototype of drag-to-run (arrow drawn automatically, ball follows the
   pass) and test it with the owner (and 1–2 coaches) on a phone before production. R1 is built in parallel.
5. O5 (D7 no libraries), O6 (ball follows pass automatically), O8 (player token content), O9 (SvFF phase names)
   → **next step:** PM presents the recommendations to the owner; not yet decided.

## 2026-10-29, round 2 (blueprint.md) – BLUEPRINT APPROVED
6. **Blueprint approved: "Godkänd (Rek.)"** – with all PM recommendations. Start WOs in blueprint §5 order. Merge to
   main only with the owner's yes, except #8.
7. **Pending items from #5 decided as recommended:** O5 keep D7 (no new libraries); O6 ball follows pass/dribble
   automatically, with undo; O8 token shows number in the circle and position below, player view can switch to name;
   O9 SvFF phase names, "Anfallsspel" → "Avslut och göra mål". "Mall för Uppspel" = an example line per position the
   coach can insert into a step's task field. Curves (WO-07) decided after the prototype.
8. **Prototype on the live site: "Ja, på sidan"** – behind `?proto=a` / `?proto=b`, stores nothing, removed when the
   winner is built. PM may push to main to publish the prototype.

## 2026-10-29, round 3 (WO-01–05 done, publish for GATE P)
9. **Publish everything: "Ja, publicera allt"** – merge `sb01-integration` into `main` and push: the R1 app improvements
   (WO-01–04) and the prototype (WO-05) go live together.
