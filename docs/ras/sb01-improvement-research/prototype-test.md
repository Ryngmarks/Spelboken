# Prototyptest – dra-för-att-springa (GATE P)

För dig som leder testet (ägaren). Källa: `consult/ux-ui.md` (testskript och tröskelvärden) och blueprint §6.
Syftet är att avgöra vilken dragrörelse tränare lär sig snabbast, **innan** vi bygger den på riktigt:

- **Variant A – framåtplanering:** man drar en spelare i steg N. Spelaren står kvar i steg N, en pil ritas, och spelaren
  hamnar vid pilens slut i steg N+1. Två lägen: *Flytta* (ändrar det här steget) och *Rörelse* (ritar löpningar).
- **Variant B – nyckelbild med spöke:** man drar spelaren i det steg där den ska stå. Förra stegets placering syns svagt
  (spöke) och pilen ritas automatiskt från spöket till den nya platsen. Steg 1 är uppställning, steg 2 och framåt är rörelse.

I båda varianterna gäller: drar man **bollen** till en lagkamrat är det en passning och bollen följer med honom; drar man
spelaren som har bollen är det en dribbling; drar man någon annan är det en löpning. Rörelser kortare än 2 meter ritar ingen pil.
Berätta inte för tränaren vilken variant som är vilken – hen ser bara "A" eller "B" i hörnet.

## 1. Öppna länkarna

Efter att prototypen publicerats på sidan (PM pushar till `main`, ca 1–2 minuter):

- Variant A: <https://ryngmarks.github.io/Spelboken/?proto=a>
- Variant B: <https://ryngmarks.github.io/Spelboken/?proto=b>

Öppna dem i mobilens webbläsare. De är inte länkade från appen, och **ingenting sparas** – varken i webbläsaren eller på någon
server. Läser du om sidan eller stänger den är loggen borta, så kopiera loggen (avsnitt 5) innan du stänger.
**Håll mobilen liggande** – planen blir då mycket större (kontrollerna hamnar i en kolumn till höger). Stående fungerar men planen blir liten; notera om tränaren vänder mobilen själv.

Det vanliga appen öppnas som vanligt på `https://ryngmarks.github.io/Spelboken/` (utan `?proto=`).

## 2. Uppställning och spelare

Alltid samma start: blå lag (4-2-3-1, anfaller åt höger) mot rött (4-4-2), bollen hos mittbacken, steg 1 plus ett tomt steg 2.
"Återställ" återgår till det här (och går att ångra). Siffrorna står i brickorna, positionen under:

| Nr (blå) | Position | Används i |
|---|---|---|
| 2 | VB, vänsterback | T1 |
| 3 | MB, mittback – har bollen | T3 |
| 6 | DM, defensiv mittfältare | T3 |
| 8 | VY, vänsterytter | T2, T3, T4, T5 |
| 9 | OM, offensiv mittfältare | T4, T5 |

## 3. Så kör du testet (ca 15 min per tränare)

Knappen **Test** (uppe till höger) öppnar observatörspanelen: välj uppgift **T1–T5**, tryck **Kör** när tränaren får
uppgiften och **Klar** när hen säger att hen är klar. Tiden, antal drag, ångra och "fel bricka" loggas då automatiskt.
Panelen visar också uppgiftstexten så att du kan läsa den högt. Stäng panelen innan tränaren börjar (tryck Test igen).

| Tid | Moment |
|---|---|
| 1 min | Intro: "Du bygger ett uppspel på planen. Jag mäter appen, inte dig. Säg högt vad du tänker." Visa inget mer. |
| 10 min | **T1–T5** i första varianten |
| 3 min | **T2 och T4** i andra varianten (öppna den andra länken) |
| 1 min | "Vilken var lättast, och varför?" – skriv ner citatet |

**Ordning mellan tränare (motviktning):** tränare 1 kör B först, sedan A. Tränare 2 kör A först, sedan B. Tränare 3 (om det finns)
som tränare 1. **Din egen körning är en pilot och räknas inte** (du kan appen).

**Hjälpnivå** (skriv ner per uppgift): **0** ingen hjälp, **1** du säger "titta på verktygsraden / på planen", **2** du visar hur.
**Fel** = ett resultat som tränaren måste ångra eller som hen inte menade.

### Uppgifterna (läs högt)

Kör T1–T3 i följd utan att trycka Återställ (T3 bygger på T2). Tryck **Återställ** före T4. T5 kör du direkt efter T4.

| # | Säg högt | Mäter | Godkänt | Underkänt |
|---|---|---|---|---|
| T1 | "Flytta vänsterbacken 10 meter framåt i steg 1." | Rätt bricka | Hjälp 0, ≤ 20 s, ≤ 1 fel bricka | Hjälp 2 eller ≥ 2 fel bricka |
| T2 | "Låt 8:an löpa in bakom deras mittfält." | Dragrörelsen | Hjälp 0, ≤ 60 s, ≤ 1 fel | Hjälp 2, > 90 s eller ≥ 2 fel |
| T3 | "Spela bollen från mittbacken till 6:an." och sedan "…och vidare till 8:an där hen landar." | Passning, bollen följer | Hjälp 0, ≤ 60 s, bollen hos rätt spelare båda gångerna | Bollen hos fel spelare eller hjälp 2 |
| T4 | "Gör uppspelet: tre spelare rör sig och en passning, över tre steg. Spela upp." Fråga sedan: "Är det så du menade?" | Hela flödet och stegens innebörd | ≤ 2 min, ≤ 12 handlingar, ≤ 2 fel, tränaren säger ja | > 3 min, eller tränaren säger att uppspelningen är fel |
| T5 | "8:an ska springa kortare. Ta sedan bort 9:ans löpning." | Ändra och ta bort | Hjälp 0, ≤ 45 s, 0 oavsiktliga ändringar | Hjälp 2 eller en annan spelare/ett annat steg ändrades |

Anmärkningar:
- **T4:** be tränaren låta 8:an och 9:an vara två av de tre som rör sig – annars finns inget att ändra i T5.
- **T3 andra passningen** går på 8:ans plats i steget där 8:an har landat (det är T2:s landning).
- Hjälp "Ångra" och "Återställ" finns i översta raden; säg inte var de finns om tränaren inte frågar (räknas som hjälpnivå 1).
- **Handlingar** i T4 räknar loggen själv: drag, verktygsbyte, steg framåt/bakåt, nytt steg, ångra, byte av pil. "Spela upp" räknas inte.

### Vad loggen räknar åt dig

| Kolumn | Betydelse |
|---|---|
| Tid | från Kör till Klar |
| Drag | dragna brickor som gav en ändring (tryck utan att dra räknas inte) |
| Ångra (snabbt) | antal ångra; "snabbt" = inom 8 s efter ett drag, alltså troligen en oavsiktlig flytt |
| Fel bricka | drag på en annan bricka än uppgiften gäller (T1: 2:an, T2: 8:an, T3: bollen, T5: 8:an/9:an; T4 räknas inte) |
| Handl. | handlingar enligt ovan |

Loggen ersätter **inte** dina anteckningar: hjälpnivå, om bollen hamnade rätt, om tränaren säger "ja" i T4 och citatet
skriver du själv (använd tabellen längst ner).

## 4. Så avgörs testet

En variant **klarar** testet om **varje räknad tränare** klarar T2–T4 med hjälp ≤ 1 och ingen T4 tar över 3 min. Mer än ett fel
bricka-drag på tio drag totalt är också ett varningstecken (blueprint §6).

- Båda klarar: den med färre fel vinner, sedan tränarnas val. Fortfarande lika: **B** (färre begrepp).
- Ingen klarar: stoppa R2 och bygg reservplanen (bollen följer passningen, utan dra-för-att-springa).
- Bara du har testat: resultatet är **observerat**, inte godkänt – be om 1–2 tränare.

## 5. Skicka loggen

1. När varianten är klar: tryck **Resultat**.
2. Välj **Deltagare** (Pilot / Tränare 1–3) och **Ordning** (första eller andra varianten). Inga namn.
3. Tryck **Kopiera** ("Kopierat ✓" visas; om mobilen stoppar kopieringen markerar du texten i rutan och kopierar själv).
4. Klistra in i ett meddelande till PM tillsammans med dina anteckningar. Skicka **en logg per variant och tränare**
   (två öppna flikar = två loggar). Tryck *Rensa logg* först när den är kopierad.

Loggen innehåller bara tider, antal, vilka positioner som drogs (t.ex. "8 VY") och steg. Inga namn, inget personuppgiftsmaterial.

## 6. Känt i prototypen (så du inte tror att det är ett fel)

- Bollen ligger 0,8 m från spelaren som har den, alltså 2–3 pixlar ifrån på en telefon. Prototypen väljer **bollen** om man trycker
  rakt på den och spelaren om man trycker på den fria delen av spelarens bricka. Det är en av sakerna testet ska visa om den räcker.
- Ändrar man en rörelse i ett tidigare steg ändras inte senare steg (ingen "fortplantning"); bollens plats i ett steg som styrs
  av en passning flyttas genom att passningen ritas om.
- Pilar nära en bricka: ett tryck i brickans ytterkant, nära en pil, väljer pilen (för att Ta bort / byta Löpning ↔ Press).
- Det finns inget "gör om" (redo) och ingen sparfunktion; bara Ångra och Återställ.

## 7. Anteckningsblad (kopiera per tränare och variant)

Tränare: ______ Variant: A / B Första/andra: ______

| # | Tid (s) | Hjälp 0/1/2 | Fel | Godkänd? | Citat / vad hände |
|---|---|---|---|---|---|
| T1 | | | | | |
| T2 | | | | | |
| T3 | | | | | |
| T4 | | | | | "Är det så du menade?" ja / nej |
| T5 | | | | | |

"Vilken var lättast, och varför?": ______________________________________________
