# Uppdrag

## T1 – Projektgrund och dokumentation ✅

AGENTS.md, docs/, Vite + React + TS + Vitest.

## T2 – Domänmodell och lagring ✅

- Typer för scenario, steg, entiteter och ritobjekt. Formationer (4-3-3, 4-4-2, 4-2-3-1).
- Rena funktioner: skapa scenario, lägg till/ta bort steg och entiteter, flytta, rita, interpolera.
- `ScenarioStore` med localStorage. Validering vid import.
- **Acceptans:** enhetstester för funktionerna ovan passerar.

## T3 – Editor ✅

- SVG-plan med korrekta mått. Dra spelare och boll med mus och touch.
- Verktyg: markera/flytta, löpning, passning, dribbling, press, zon. Radera markerat objekt.
- Steg: lägg till (kopierar aktuellt), ta bort, välj. Text per steg.
- Ångra/gör om. Autosparning.
- **Acceptans:** ett scenario i 3 steg kan skapas och finns kvar efter omladdning.

## T4 – Bibliotek och spelarvy ✅

- Lista per fas och princip, filter på position, skapa, duplicera, ta bort, import/export.
- Spelarvy med uppspelning, stegning och text. Mobilanpassad.
- **Acceptans:** fungerar i en 375 px bred vy.

## T5 – Oberoende granskning (Codex) ✅

Granska T2–T4 mot ARCHITECTURE.md och PRODUCT.md. Åtgärda kritiska fynd.

Resultat 2026-10-28: 2 kritiska och 4 bör-fynd, alla åtgärdade med tester:
- Import frågar vid konflikt (ersätt eller importera som kopia) istället för att skriva över.
- Koordinater valideras vid import; dribblingspilar har tak för antal segment.
- Autosparning sparar direkt vid `pagehide`/`visibilitychange` (`src/editor/autosave.ts`).
- Lagringsfel visas ("Inte sparat!") med möjlighet att exportera.
- Paus fryser pågående animation (`src/components/playbackReducer.ts`).
- Pekargester knyts till sitt `pointerId`; `pointercancel` kastar ofullständig ritning.

Arkitekturen bedömdes som väl avvägd för prototypen.

## T6 – Trupp och koppling till riktiga spelare ✅

- Trupp (`Person`: namn, nummer, positioner) med egen vy. Lagras lokalt tills T7.
- Spelare i eget lag kopplas till en person i editorn; namnet visas på planen, numret följer personen.
- Biblioteksfilter "Visa för spelare": scenarier där personen är med eller som gäller hens positioner.
- Tas en person bort ur truppen försvinner kopplingarna. Exportfiler innehåller aldrig namn.
- **Acceptans:** verifierat med enhetstester och i webbläsare.

## T6b – Hjälplinjer: korridorer och tredjedelar ✅

- Fem korridorer (ytter, inner, central) längs straffområdets och målområdets kanter, tredjedelar på längden.
- Slås på/av per scenario i editorn (ångringsbart) och följer med till spelarvy och förhandsvisning.
  I spelarvyn kan tittaren själv slå av och på utan att ändra scenariot.
- **Acceptans:** enhetstester för geometri, validering och ångra; verifierat liggande och stående i webbläsare.

## T7 – Supabase: inloggning och lagring (väntar på Supabase-projekt)

- Schema och RLS finns i `supabase/migrations/0001_initial.sql` (lag, medlemmar med roll, trupp, scenarier).
- Inloggning med e-postlänk. Första inloggningen skapar ett lag där användaren blir tränare.
- Store-gränssnitten blir asynkrona med Supabase-implementation; localStorage ersätts.
- Engångsflytt av lokala scenarier och trupp till kontot efter första inloggning.
- Autosparning behåller ett lokalt utkast tills servern bekräftat, så inget försvinner vid nätverksfel.
- **Acceptans:** två olika konton ser inte varandras lag (testa RLS), data finns kvar på annan enhet.
- **Kräver av produktägaren:** Supabase-projekt i EU (Stockholm), URL + publik nyckel i `.env.local`,
  redirect-URL `http://localhost:5173` under Authentication → URL Configuration.

## T8 – Publikt GitHub-repo (väntar på inloggning)

- **Kräver av produktägaren:** `gh auth login` i en terminal. Därefter skapar Claude repot och pushar.

## Senare – Spelarkonton (förberett, inte planerat)

- Tränaren bjuder in en spelare via e-post → `team_members` med roll `player` och `people.user_id`.
- Spelaren ser bara sitt lag och läser endast (RLS finns redan). Startvyn filtreras på spelaren själv.
- Kräver beslut om föräldrars samtycke för spelare under 13 år (GDPR).

## Backlog (inte påbörjat)

- Exportera ett steg eller en animation som bild eller video för WhatsApp/sociala kanaler.
- Önskat och oönskat beteende i samma scenario.
- Fler exempelscenarier (press, omställning, fasta situationer).
- Ångra-funktion eller papperskorg för borttagna scenarier.
- Fler hjälplinjer: 18 zoner (Zon 14), halvor, gränser mellan lagdelarna.
