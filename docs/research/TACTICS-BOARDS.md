# Tactics boards and playbook tools – how others do movement, roles and player view

Mission: sb01-improvement-research · Date: 2026-10-29 · Agent: RAS Research
Question: How do existing tactics-board/playbook products let coaches create movement patterns quickly, make positions/roles clear and present to players – and which interaction patterns should a small web app copy?

Evidence levels: **VERIFIED** = fetched primary source (vendor page/store listing). **OBSERVED** = search snippet, aggregator, forum. **HYPOTHESIS** = my synthesis, untested.

Important caveat: vendor pages say *that* a feature exists, rarely *how it feels*. No independent usability reviews were found (see section 5). Rankings in section 3 are HYPOTHESIS.

## 1. Product table

| Product | Platforms | Price tier | How multi-step movement is made | Roles/positions | Player-facing / sharing | Evidence |
|---|---|---|---|---|---|---|
| **TacticalPad** | Win, Mac, iOS, Android | Paid, yearly: US$63 full / $39 PC-Mac / $24 mobile | Lists "Animations in 2D/3D"; method **not documented** on page | Not described | "Share & Communicate" heading only | VERIFIED https://www.tacticalpad.com |
| **Tactics Manager (SoccerTutor)** | Desktop/tablet app | One-time purchase (Pro, OBSERVED); Premier plan £29.95 adds cloud, branding, practice library; Animations is an optional add-on, "added April 2026" | Animation method **not found** (page 429 on fetch) | 43 pitch angles, 288 "player actions" | PDF export with club logo (Premier) | OBSERVED (search snippet) https://www.soccertutor.com/tacticsmanager/ |
| **Easy2Coach Tactics** | Browser + iOS + Android, same account | "Free to use", no card to sign up (paid options exist, not seen) | "Animate step by step", "draw runs with arrows and curves", multiple steps per drawing, **convert an existing drawing into an animation** | Icons in kit colours, GK/referee icons, text labels, lineups with optional opponent mirroring; no named-role system described | Share board to staff/squad via WhatsApp/e-mail/link; "Play the animation and share directly"; print; 600+ templates (lineups, set pieces, drills) copy-and-adapt | VERIFIED https://www.easy2coach.net/en/tactics/ |
| **Tacticsboard (web)** | Desktop + mobile browser, no install | Free tier + $4–15/mo (listings conflict on what free includes) | Keyframes: "animate player movements frame by frame"; player and ball | Drawing tools for pass/run/dribble/shot | Share drills by link; export image/GIF; practice plans | OBSERVED https://alternativeto.net/software/tacticsboard-app/about ; https://www.getapp.com/all-software/a/tacticsboard/ |
| **TacticSlate (web)** | Browser; autosave in browser, no account | Not stated | Frame-by-frame, with **timing and ghost positions** (previous frame shown faintly) | Ball and player tokens | Export PNG/PDF/WebM | VERIFIED https://hunted.space/product/tacticslate |
| **Tactix (web)** | Browser | Free / Pro $20/mo (no watermark) / Team $399/mo | **Draw the run by hand; it becomes a Bézier path, constant-velocity motion, no keyframes**; sequential phases with "ripple editing"; timeline scrubbing | Not described | Export (watermark on free) | VERIFIED https://alternativeto.net/software/tactix/about (store-style listing, vendor text) |
| **TheManagerBoard – TacBoard (iOS)** | iPhone/iPad | Free / Pro / Coach, annual sub (no amounts shown) | Multi-frame editing, **curve control per movement path**, playback speed + easing; **connection lines/polygons follow players** (defensive line, build-up shape) | Tokens with number, name, optional photo | MP4 export (Pro); training log (Coach) | VERIFIED https://mwm.ai/apps/themanagerboard-tacboard/6763226753 (aggregator page of App Store text) |
| **Tactics Board – Football (iOS, Censabella)** (+ web tacticboardsoccer.com) | iOS, web | Free + IAP (premium monthly/annual/lifetime) | "Add a frame for each moment and move the players; app interpolates"; speed setting, customisable movement paths, connections that follow | Numbered players with names **and roles**; **formations applied in one tap**, squads saved and reused | Image/video/PDF drill sheets with club logo; ready-made plays library | VERIFIED https://apps.apple.com/kr/app/%EC%A0%84%EC%88%A0-%EB%B3%B4%EB%93%9C-%EC%B6%95%EA%B5%AC/id6743544146?l=en-GB |
| **TacBoard "Soccer Coach Lineup" (iOS)** | iOS | Free | "Build frame-by-frame animations"; custom photos+names by double-tap | Photos/names on tokens | MP4 export | VERIFIED https://apps.apple.com/us/app/-/id6749962256 (4.0/5, 4 ratings, no text reviews) |
| **XPS Network / XPS Playbook (Sideline Sports)** | Web/app (multi-sport; examples use soccer) | Not found | Tutorial chapters: new animation, **timing and editing paths, managing frames, path speed and delay**, text on animations | Not found | "Share with athletes", library of animations/diagrams | OBSERVED https://sidelinesports.com/blog/xps-tutorial-creating-animations-in-playbook (page text only lists chapters; video not watched) |
| **Hudl (FastModel/Playbook)** | – | – | A FastModel support article on "animation" exists (timeline with start/end handles, per OBSERVED snippet) but fetch returned 404/redirect; football-soccer Playbook not verified | – | – | OBSERVED https://support.fastmodelsports.com/support/solutions/articles/9000230150-animation |
| **Hudl Studio Coach Mode** (video telestration, not a board) | Desktop/iPad | Free with Sportscode Elite | Live drawing on clips; **drawings clear on play**, clip speed control, restart clip, beam tool, connected discs on players | – | Presentation tool for meetings; Apple Pencil for 1-to-1; no player sharing described | VERIFIED https://www.hudl.com/blog/new-coach-mode-features-enhance-studio-feedback |
| **Coach Paint (ChyronHego)** (video telestration) | Pro desktop | Trial 30 days; price not found | Draw on video: spotlight, zoom, player cut-out, tracking; "non-technical staff learn in 1–2 h" (vendor claim) | – | Clubs use for post-match review | OBSERVED https://www.live-production.tv/news/products/coach-paint-engage-teach-prepare-and-recruit.html ; https://www.sportsvideo.org/2019/04/23/qatars-al-arabi-sc-utilizes-chyronhegos-coach-paint-telestration-for-video-analysis/ |
| **Metrica Play** | Pro analysis suite | Was made free in 2020 (news) | Overlay visualisations (spotlights, trails, areas) on video/tracking data; hand-drawn animated paths **not found** | – | – | OBSERVED https://pypi.org/project/codeball ; https://www.pressreader.com/uk/sunday-mirror/20201129/282973927594137 |
| **Playmaker X (American football, iOS)** | iOS | Free + $7.99–12.99/mo | "One tap to animate any play", speed setting, animated football annotation; **no pause** (workaround: extra route points) | – | Team plan shares in app; wristband/call-sheet printing | VERIFIED https://apps.apple.com/app/id1466962634 (4.5/5, 267 ratings) |

## 2. How movement creation is solved – four models seen

1. **Keyframe per step** (Tacticsboard, TacticSlate, TacBoard, Censabella): add a frame, drag every player to the new spot, app interpolates. Simple model, but N players × M steps drags. TacticSlate's *ghost positions* mitigate this. VERIFIED/OBSERVED sources above.
2. **Draw a run, it animates along it** (Tactix, Easy2Coach "draw runs with arrows and curves… convert existing drawings into animations"): the arrow *is* the animation data. Tactix: constant velocity, no keyframes. VERIFIED.
3. **Per-path timing controls** (XPS: path speed + delay; Playmaker X: animation speed; TacBoard: easing): lets steps overlap. OBSERVED/VERIFIED.
4. **Derived/linked visuals**: connection lines that follow players (TacBoard, Censabella). VERIFIED.

Not found in any source: automatic *ball follows passer* behaviour (only Playmaker X's "animated football annotation"); explicit *copy-forward of positions* wording (it is implicit in keyframe tools because a new frame starts from the previous one – HYPOTHESIS).

## 3. Interaction patterns ranked by expected speed-up of movement creation (HYPOTHESIS)

1. **New step starts as a copy of the previous step's end positions** (nobody retypes the 8 players that don't move). Plus ghost/faint previous positions (TacticSlate).
2. **Drag a player = draw its run** for this step: the drag path becomes the arrow *and* the animation (Tactix, Easy2Coach). Removes the separate "place arrow" action.
3. **Ball follows the passer automatically**: when a pass arrow is drawn, the ball moves from passer to receiver and attaches to the receiver in the next step. No product showed it; likely a differentiator.
4. **Curved paths via one handle** (Easy2Coach, TacBoard, Tactix) – straight line default, optional bend.
5. **Per-arrow delay/speed, default automatic** (XPS): only expose when needed; defaults must make overlapping runs look right.
6. **One-tap formations / template library to copy and adapt** (Censabella, Easy2Coach 600+ templates). Biggest first-use win for a new coach.
7. **Follow-the-players lines** (back line, press shape) – good for explaining shape, not for speed.
8. **No account, autosave, share by link** (TacticSlate, Easy2Coach, Tacticsboard) – removes onboarding friction.

## 4. Roles and positions clarity

- Seen: numbered tokens + name + photo (TacBoard, Censabella), "names and roles" (Censabella), text labels (Easy2Coach), kit colours/GK icons. No product showed an on-board explanation of *what a role does in this scenario*. That gap is the opportunity for the owner's focus area 4 (HYPOTHESIS: step caption/role note per player, shown in player view).
- Telestration research (FIFA Training Centre brief, 14 EFL Championship players): annotated video gave 25–30% higher tactical recall, benefit grew over time; **caveat**: tiny sample, over-annotation can overwhelm, raw video also valuable. VERIFIED https://www.fifatrainingcentre.com/en/environment/research-brief/high-performance/train/francis-telestration.php → show few things per step.
- Hudl Coach Mode "drawings clear when you press play" (VERIFIED) is a pattern for keeping the screen uncluttered during playback.

## 5. What coaches find slow or confusing – evidence is thin

- **No independent reviews found** for TacticalPad, Tactics Manager, Easy2Coach, Hudl. Capterra/GetApp listings for Tacticsboard show 0 users. Store listings for newer apps have 4–6 ratings and no text. OBSERVED.
- Only concrete complaints: Playmaker X reviewers asked for a **pause** in routes and reported a freeze when printing many items (VERIFIED, App Store text); a snippet of another tactics-board listing said animation "extra player follows the moved player" (OBSERVED, truncated, unnamed product).
- Absence of evidence ≠ proof; Reddit/forums were not reachable through the search tool.

## 6. What to avoid (HYPOTHESIS, supported by gaps above)

- Per-player-per-step drag-everything keyframing without copy-forward.
- Paywalled core animation / watermarks (Tactix, Tacticsboard free-tier confusion) – irrelevant for this app but shows friction owners complain about in listings (OBSERVED).
- Dense toolbars with hundreds of "player actions" (Tactics Manager: 288) – bad for first-time success.
- Over-annotation in the player view (FIFA brief caveat).
- No pause/hold: provide a simple "hold" step or delay.

## 7. Research limits

- tacticalpad.com gave no animation mechanics; soccertutor.com returned 429; Hudl/FastModel support pages returned 404; tacticsboard.com did not resolve; XPS video not watched (page lists chapters only); Metrica Play docs not found; Coach Paint pricing not found.
- Search tool returned many aggregator pages; "price" values are listing text, not checked at checkout.
- No hands-on use of any product; "speed-up" ranking is reasoning, not measurement.
