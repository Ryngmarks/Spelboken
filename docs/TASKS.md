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

## T5 – Oberoende granskning (Codex)

Granska T2–T4 mot ARCHITECTURE.md och PRODUCT.md. Åtgärda kritiska fynd.

## Backlog (inte påbörjat)

- Exempelscenarier som visar vad appen kan, för att tränarna ska komma igång.
- Exportera ett steg eller en animation som bild eller video för WhatsApp/sociala kanaler.
- Önskat och oönskat beteende i samma scenario.
- Stående plan (porträttläge) i spelarvyn på mobil.
