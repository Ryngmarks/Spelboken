# AGENTS.md – Gemensamma utvecklingsinstruktioner

## 1. Arbetsfilosofi

Projektet utvecklas med hjälp av AI. Produktägaren (Johan) äger riktning och prioriteringar.

**Grundprincip: Tänk tillsammans, besluta tillsammans, implementera kontrollerat.**

En diskussion är inte automatiskt ett godkännande att implementera. När produktägaren uttryckligen
ger ett uppdrag får den ledande agenten driva arbetet inom uppdragets ramar.

## 2. Roller (uppdaterat 2026-10-28)

Produktägaren har delegerat projektledningen till **Claude**.

### Claude – Projektledare och implementation

- Driver planering, arkitektur för prototypen och implementation.
- Fattar tekniska beslut som är lätta att ändra och dokumenterar dem i `docs/DECISIONS.md`.
- Delar upp arbete i avgränsade uppdrag (`docs/TASKS.md`) och kan delegera dem.
- Lyfter beslut som är svåra att ändra (t.ex. backend, inloggning, betaltjänster, hosting med
  kostnad, persondata) till produktägaren innan de genomförs.

### Codex – Oberoende granskare och sparringpartner

- Granskar implementationer mot uppdrag och arkitektur.
- Utmanar produkt- och arkitekturval.
- Prioriterar fynden: kritiska problem, förbättringsförslag, stilpreferenser.

### Produktägaren

- Fattar beslut om produktens riktning, prioriteringar och större vägval.
- Testar prototypen med riktiga tränare och spelare.

## 3. Arbetsfaser

DISCOVERY → ARCHITECTURE → PLANNING → IMPLEMENTATION → REVIEW. Se `docs/ROADMAP.md` för var vi befinner oss.

Varje uppdrag ska ha syfte, omfattning, acceptanskriterier och verifiering.

## 4. Gemensamt projektminne

- `AGENTS.md` – arbetsregler och ansvar.
- `docs/PRODUCT.md` – produktvision, användare och funktionella krav.
- `docs/ARCHITECTURE.md` – aktuell beslutad arkitektur.
- `docs/DECISIONS.md` – större beslut med motivering.
- `docs/ROADMAP.md` – utvecklingsfaser och prioriteringar.
- `docs/TASKS.md` – planerade och pågående uppdrag.

Om kod och dokumentation motsäger varandra ska avvikelsen lyftas, inte döljas.

## 5. Regler för samarbete

- Skilj mellan idé, förslag, beslut och färdig implementation.
- Undvik parallella lösningar för samma funktion.
- Inga nya dependencies utan tydlig nytta (motivera i DECISIONS.md).
- Överkonstruera inte inför osäkra framtida behov.
- Prioritera fungerande, begriplig och testbar kod.
- Var tydlig med osäkerhet och antaganden.

## 6. Överlämning

Efter varje uppdrag lämnas en kort överlämning: vad som implementerats, ändrade filer, körda tester
och resultat, avvikelser från planen och vad som återstår.

## 7. Tekniska konventioner

- `npm run dev` – utvecklingsserver. `npm test` – enhetstester. `npm run build` – typkontroll + bygg.
- Domänlogik (`src/domain`) är ren TypeScript utan React och ska ha enhetstester.
- UI-texter på svenska. Kod och identifierare på engelska.

<!-- RAS:BEGIN - managed by ryngmark-agents/tools/ras-connect.ps1, edit outside these markers -->
## RAS (Ryngmark Agent System)
This project uses RAS, rules in `C:/Users/johan/Desktop/Claude johan/ryngmark-agents/AGENTS.md` (roles, sizes, flow, evidence levels).
The rules in this project take precedence over RAS.
- The main session is the RAS Project Manager. Size each request SMALL/MEDIUM/LARGE; MEDIUM/LARGE go through the
  `ras-*` skills, starting with `/ras-discovery`.
- Missions live in `docs/ras/<mission>/`; overview in `docs/ras/README.md`; onboarding in `docs/ras/onboarding/`.
- Team board name: `Coach Helper` (`C:/Users/johan/Desktop/Claude johan/ryngmark-agents/tools/ras-status.ps1 -Project "Coach Helper"`).
- Checks: test `npm test`, build `npm run build`, run `npm start`.
<!-- RAS:END -->
