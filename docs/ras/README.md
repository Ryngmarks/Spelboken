# RAS in Coach Helper

Coach Helper is the pilot project for the Ryngmark Agent System (RAS). RAS itself lives in its own repo,
`C:/Users/johan/Desktop/Claude johan/ryngmark-agents` (rules: its `AGENTS.md`); this folder holds the missions run here.

**Team board (live):** https://ryngmarks.github.io/ras-board/ – which role works on which project right now, across
all projects. Updated by the PM at every hand-over; refreshes every minute.

## The team
| Role | Does | Runs as |
|---|---|---|
| Product owner (Johan) | Vision, priorities, approves blueprints, decisions and merges | – |
| Project Manager | Main session. Sizes work, starts every other agent, verifies, talks to the owner | the main chat |
| Solution Architect | Draft → consultation requests → blueprint | own T3 chat `[RAS] <mission> · architect` |
| Engineering Analyst | Prior art before a mission, retro after it | own T3 chat |
| Research | External facts with sources | own T3 chat |
| Implementer | Builds one work order, loaded with a specialist profile | own T3 chat, Claude or Codex, often a worktree |
| Reviewer | Code, security and critical review – the model that did not write the code | own T3 chat |

Size decides the process: SMALL = PM does it directly; MEDIUM = mini blueprint → owner's yes → work orders;
LARGE = brief → prior art → research → draft → owner decisions → consultations → blueprint → work orders → review → retro.

## Where things are
| What | Where |
|---|---|
| Missions | `docs/ras/<mission>/` – brief, prior-art, draft, consult/, owner-decisions, blueprint, wo/ (work orders, handoffs, reviews, `STATUS.md`), retro |
| Research reports | `docs/research/` |
| Project decisions | `docs/DECISIONS.md` |
| Agents, profiles, skills, templates, knowledge | the RAS repo (`agents/`, `profiles/`, `skills/`, `templates/`, `knowledge/`) |
| Team board | repo `Ryngmarks/ras-board` (public), written by `ryngmark-agents/tools/ras-status.ps1` |

## Missions here
| Mission | Size | Status |
|---|---|---|
| `onboarding` | – | prior art for the pilot |
| `sb01-improvement-research` | LARGE | work orders running on `sb01-integration` – see `wo/STATUS.md` |
