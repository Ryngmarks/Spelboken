# Beslutslogg

Format: datum – beslut – motivering – alternativ – hur lätt det är att ändra.

## D1 – 2026-10-28 – Claude leder projektet

Produktägaren delegerade projektledningen till Claude. Codex blir oberoende granskare.
Beslut som är svåra att ändra lyfts fortfarande till produktägaren.

## D2 – 2026-10-28 – Statisk webbapp med React + TypeScript + Vite

- **Motivering:** Snabbast väg till en visuell prototyp som körs på dator, surfplatta och mobil utan
  installation. Stort ekosystem, bra verktyg för AI-assisterad utveckling.
- **Alternativ:** Svelte (mindre ekosystem), native-app (långsammare, kräver appbutik),
  Next.js (serverdelen behövs inte än).
- **Ändringsbarhet:** Medel. Domänlogiken är ramverksoberoende.

## D3 – 2026-10-28 – SVG för spelplanen, inget ritbibliotek

- **Motivering:** Under 30 objekt per plan. SVG ger skarp grafik i alla storlekar, inbyggd träffyta
  för klick och touch, enkel styling och export. Inga beroenden.
- **Alternativ:** Canvas/Konva/PixiJS. Det lönar sig först med hundratals objekt eller avancerade
  effekter.
- **Ändringsbarhet:** Hög. Renderingen ligger isolerad i `PitchCanvas`.

## D4 – 2026-10-28 – Lokal lagring och export/import istället för backend

- **Motivering:** Hypotesen om användarvärde ska valideras innan vi bygger konton, servrar och
  driftkostnader. Export/import som JSON-fil räcker för att dela med några spelare under testperioden.
- **Alternativ:** Supabase/Firebase (snabbt men ger inloggning, persondata och GDPR redan i början).
- **Ändringsbarhet:** Hög. Allt går via `ScenarioStore`.
- **Öppen fråga till produktägaren:** När tester visar värde: vilken backend, och hur ska spelare
  komma åt spelboken (länk, inloggning, föreningskonto)?

## D5 – 2026-10-28 – Scenario = entiteter + steg med positioner (metrisk plan 105×68)

- **Motivering:** Enkel att förstå, att animera och att låta en AI generera i framtiden (kompakt JSON).
- **Alternativ:** Tidslinje med nyckelbilder per entitet (kraftfullare, men mer komplex UI).
- **Ändringsbarhet:** Medel. `schemaVersion` gör migrering möjlig.

## D6 – 2026-10-28 – Spelprinciper som fritextfält på scenariot (inte en egen entitet än)

- **Motivering:** Det täcker "enkel struktur för spelprinciper" med minimal UI. Biblioteket grupperar
  per fas och princip.
- **Nästa steg:** En egen `Principle`-entitet (titel, beskrivning, kopplade roller) i fas 2, om
  testerna visar att tränarna vill arbeta princip-först.

## D7 – 2026-10-28 – Inga state-, router- eller UI-bibliotek

- **Motivering:** Tre vyer och en reducer klarar sig utan. Färre beroenden och mindre att lära sig.
- **Ändringsbarhet:** Hög.

## D8 – 2026-10-28 – Ingen integration mot Veo-data (än)

- **Underlag:** `docs/research/VEO.md`. Inget publikt API; villkoren förbjuder skrapning.
- **Beslut:** Videokoppling i fas 3 bygger på Veo-delningslänkar med starttid och uppladdade MP4-klipp.
- **Status 2026-10-29:** Parkerad av produktägaren. Veo kontaktas inte nu; idén och underlaget sparas
  för framtiden. Veos statistik (Analytics 2) tas troligen fram automatiskt med AI, men kan inte exporteras.

## D9 – 2026-10-28 – Supabase som backend, inloggning med e-postlänk (beslut av produktägaren)

- **Beslut:** Supabase (Postgres + Auth) ersätter localStorage som lagring. Tränaren loggar in med
  e-postlänk (magic link). Lokala scenarier erbjuds en engångsflytt till kontot; därefter är Supabase
  enda lagringen. Export/import av fil finns kvar.
- **Motivering:** Gratisnivå, inbyggd auth och radnivåsäkerhet (RLS), ingen egen server att drifta.
  Förbereder spelarkonton: samma auth, ny roll.
- **Förutsättningar:** Projekt i EU-region (Stockholm). Gratisprojekt pausas efter en veckas inaktivitet.
- **Beroende:** `@supabase/supabase-js` (officiell klient; alternativet är att skriva REST-anrop själva).
- **Ändringsbarhet:** Medel. All åtkomst går via store-gränssnitten i `src/storage`.

## D10 – 2026-10-28 – Trupp: spelare på planen kopplas till riktiga personer

- **Beslut:** Ett lag har en trupp (`Person`: namn, tröjnummer, positioner). En spelare på planen kan
  kopplas till en person via `personId`. Bara eget lag kopplas, motståndare är anonyma.
- **Persondata (minimering):** Bara namn, nummer och positioner. Ingen e-post, födelsedata eller bild
  förrän spelarkonton byggs. Exporterade scenariofiler innehåller `personId` men aldrig namn.
- **Förberett för spelarkonton:** `team_members` (användare ↔ lag med roll `coach`/`player`) och
  `people.user_id` finns i schemat från början, men bara rollen `coach` används nu.

## D11 – 2026-10-28 – Publikt GitHub-repo (beslut av produktägaren)

- **Beslut:** Koden ligger i ett publikt repo. Inga hemligheter i koden: Supabase-URL och den publika
  nyckeln läses från `.env.local` (ignoreras av git). Säkerheten ligger i RLS-reglerna, inte i nyckeln.
