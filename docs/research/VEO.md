# Research: Kan vi hämta data från Veo? (2026-10-28)

Utfört av research-agent. Fakta med källa; bedömningar är markerade.

## Kort svar

Det finns **inget öppet API** idag. Det som går att få ut är **video** (MP4 för hel match eller klipp)
och **delningslänkar**. Veo håller på att bygga ett partner-API ("Public API initiative", nämnt i
jobbannonser från feb 2026), men det är inte lanserat och har ingen publik dokumentation.

## Officiellt API / integrationer

- Jobbannonser (Berlin, feb 2026) beskriver ett nytt API-team för "external partners to integrate
  with Veo's platform". Det visar en avsikt, inte en lansering.
- Veos villkor nämner ett "Veo API" för partnerappar. Det finns inga publika API-villkor.
- Bekräftade partnerskap gäller förbund (Football NSW, Voetbal Vlaanderen), inte mjukvaruintegrationer.

## Export i gränssnittet

- Hel match som MP4, bara i follow-cam-vy (inte panorama). Matchen måste tillhöra ditt lag, eller så måste du vara clubhouse admin.
- Klipp som MP4, ett i taget eller alla på en gång som ZIP. Kräver rollen Admin, Editor eller Contributor.
- Delningslänk för publika inspelningar, med starttid. Ingen dokumenterad inbäddningskod (embed).
- Statistik som CSV/JSON/XML hittades inte (troligen finns det inte, men obekräftat).

## Vilken data som finns (Veo Analytics 2, betalt tillägg, bara fotboll)

Matchstatistik, heatmap, skottkarta, pass- och possessionpositioner, momentum, 2D-radar, Analytics Studio, matchrapport,
Coach Assist. Fysisk data (distans, fart, sprinter) för matcher efter 18 aug 2026.
**Rå koordinat- eller spårningsdata exponeras inte.**

## Inofficiella vägar och villkor

Inga kända skrapningsprojekt. Villkoren förbjuder åtkomst utöver tjänsten (7.4), reverse engineering
(8.1.5) och användning för andra ändamål (8.1.2). Veo äger "insights and results" som genereras ur
innehållet (6.3). **Skrapning är inte ett alternativ.**

## Rekommendation

1. Fas 3 (video): låt tränaren koppla en Veo-delningslänk med starttid till en princip eller ett scenario
   (öppnas i ny flik). Stöd även uppladdade MP4-klipp.
2. Bygg inte funktioner som är beroende av Veo-data.
3. Produktägaren kan kontakta Veo om partnerskap och fråga om tidplan, åtkomst och om koordinatdata ingår.

## Källor

- https://support.veo.com/hc/en-us/articles/11873714080657-Veo-Analytics-2-Overview-and-features
- https://support.veo.com/hc/en-us/articles/4451733961361
- https://support.veo.com/hc/en-us/articles/4520551312017-How-to-download-individual-clips-from-your-Veo-recordings
- https://support.veo.com/hc/en-us/articles/4520649230225
- https://support.veo.com/hc/en-us/articles/4451490513169
- https://www.veo.com/terms
- https://resumegeni.com/jobs/senior-software-engineer-api-at-veo-berlin
- https://footballnsw.com.au/2025/04/11/football-nsw-partners-up-with-veo/
