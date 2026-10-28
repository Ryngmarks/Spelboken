# Arkitektur – prototyp (fas 1)

Status: **beslutad för prototypen** (2026-10-28). Se `DECISIONS.md` för motiveringar.
Allt nedan är valt för att vara enkelt att byta ut när vi vet mer.

## Översikt

En statisk webbapp (SPA) utan backend. All data lagras lokalt i webbläsaren och kan
exporteras/importeras som JSON-fil.

```
React-komponenter (src/components)
        │  dispatch(action)
        ▼
Editor-reducer (src/editor)  ── ren funktion, undo-historik
        │
        ▼
Domänlogik (src/domain)      ── typer, scenarioformat, interpolering, formationer
        │
        ▼
Lagring (src/storage)        ── ScenarioStore-gränssnitt, localStorage-implementation, import/export
```

## Teknik

| Område | Val |
|---|---|
| Språk | TypeScript (strict) |
| UI | React 19 |
| Bygg/dev | Vite |
| Rendering av plan | SVG (inga ritbibliotek) |
| State | `useReducer` + ren reducer (inga state-bibliotek) |
| Lagring | `localStorage` bakom `ScenarioStore`-gränssnitt |
| Test | Vitest för domän, reducer och lagring |
| Hosting | Valfri statisk hosting (ej beslutat, kostnadsfritt alternativ räcker) |

## Datamodell

Koordinater anges i **meter** på en plan som är 105 × 68. x = 0 är hemmalagets eget mål,
hemmalaget anfaller åt höger. Detta gör modellen oberoende av skärmstorlek.

```ts
Scenario {
  id, schemaVersion, title, description,
  phase: 'build-up' | 'attack' | 'transition-attack' | 'defence' | 'transition-defence' | 'set-piece',
  principle: string,          // fritext, grupperar scenarier inom en fas
  focusPositions: string[],   // t.ex. ['VY', 'VB'] – för spelarens filtrering
  guides: ('corridors' | 'thirds')[], // hjälplinjer på planen; saknas i äldre data → []
  entities: Entity[],         // spelare (team, nummer, etikett) och boll – gemensamma för alla steg
  frames: Frame[],            // minst ett steg
  createdAt, updatedAt
}
Frame {
  id, caption,                // förklaring för steget
  positions: Record<entityId, {x, y}>,
  drawings: Drawing[]         // pilar (run | pass | dribble | press) och zoner
}
```

- Entiteter definieras en gång per scenario; varje steg har bara positioner. Det gör animation
  mellan steg trivial (linjär interpolering med easing) och håller datan liten.
- Pilar och zoner hör till ett steg och beskriver "vad som händer härnäst".
- `schemaVersion` finns för framtida migreringar.

## Animation

Uppspelning interpolerar positioner från steg *i* till *i+1*. Stegets pilar tonas ut under
övergången. Ingen tidslinje med nyckelbilder per entitet – steg räcker för prototypen.

## Vyer

- **Bibliotek** – scenarier grupperade efter fas och princip, filter på position, import/export.
- **Editor** – plan, verktyg, steg, metadata. Autosparar.
- **Spelarvy** – uppspelning stegvis med text, mobilanpassad.

## Medvetet utelämnat

Backend, inloggning, föreningsstruktur, video, AI, delning via länk. Gränssnittet `ScenarioStore`
är platsen där en serverlagring kopplas in senare.

## Under arbete: Supabase och trupp (2026-10-28, se D9–D11 och TASKS T6–T8)

- **Trupp (klar, lokalt):** `src/domain/roster.ts` – `Person` (namn, nummer, positioner). En spelare i eget
  lag kan ha `personId`. Namn hålls utanför scenariodatan; de slås upp i truppen vid visning.
- **Supabase (förberett):** schema och RLS i `supabase/migrations/0001_initial.sql`.

```
auth.users ──< team_members >── teams ──< people      (people.user_id → framtida spelarkonto)
                (coach|player)        └──< scenarios   (data = scenario-JSON)
```

- Allt läses och skrivs via `ScenarioStore` och `RosterStore` i `src/storage`. När T7 genomförs blir de
  asynkrona och får en Supabase-implementation. Avsnittet "Översikt" ovan beskriver läget innan T7.
