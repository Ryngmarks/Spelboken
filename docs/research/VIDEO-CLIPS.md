# Research: Videoklipp kopplade till scenario/steg (2026-10-29)

Utfört av research-agent. Evidensnivåer: **VERIFIED** = hämtad primärkälla, **OBSERVED** = sökträff/forum/sekundärkälla, **HYPOTHESIS** = min slutsats, ej testad.
Ingen kod. Veos API-fråga är parkerad (se `VEO.md`).

## Kort svar

Appen ska **bara lagra en länk + tider + etikett**, aldrig kopiera in video. Visa klippet via
(1) inbäddad spelare där leverantören tillåter det (YouTube, Vimeo), annars (2) "Öppna i ny flik"-länk.
Veo, Google Drive, OneDrive och Hudl ska behandlas som **endast länk** (HYPOTHESIS, se luckor). Lokala telefonfiler kan inte
sparas i localStorage; de kan spelas upp tillfälligt men inte följa med exporten.
Integritet: barn är registrerade; IMY:s vägledning täcker publicering av inspelningar, men **inspelningar för intern coachning
omfattas inte** (VERIFIED). Rekommendera olistad/privat länk och visa varning.

## Jämförelse per källa

| Källa | Inbäddning (iframe) | Start/slut | Kräver inloggning | Mobil | Integritet/cookies | Evidens |
|---|---|---|---|---|---|---|
| **Veo** | Ingen dokumenterad embed-kod. Länk som öppnar Veos spelare | Länk kan innehålla aktuell uppspelningsposition (checkbox). Ingen sluttid | Nej för tittare, men inspelningen måste vara **Public**; delning kräver editor/admin | Webbspelare, ej testad | Public = alla med länken. Barn i bild | OBSERVED (support.veo.com blockerar agent, 403; från sökresumé) |
| **YouTube** | Ja, `<iframe>`. Ägaren kan stänga av inbäddning (fel 101/150) | `start` och `end` i heltal sekunder, båda räknas från videons början. Sökning kan landa ~2 s tidigt (närmaste keyframe) | Nej för olistad/publik. Privat video kräver inloggning och kan inte bäddas in för andra (HYPOTHESIS) | Ja. `playsinline=1` för inline på iOS. Autoplay kan blockeras | `youtube-nocookie.com` = "Privacy-enhanced mode": visningar påverkar inte rekommendationer, icke-personliga annonser. Sidan säger inte uttryckligen "inga cookies" | VERIFIED |
| **Vimeo** | Ja. Alla integritetslägen utom Private kan bäddas in. Domänlåsning ej på Free/Basic | `#t=1m2s` i embed-URL (start). Sluttid via Player SDK (HYPOTHESIS, ej verifierad) | Nej för olistad länk; Private kräver inlogg | Troligen ja (ej testat) | Parametern `dnt` stoppar insamling av session/analysdata | VERIFIED (`#t`, `dnt`); OBSERVED (integritetslägen/planer) |
| **Google Drive** | Ja via "Embed item" / `/preview`; filen måste vara "Anyone with the link" | Drive kan "kopiera länk till denna tid" (start). URL-format ej verifierat | Nej om "anyone with link", annars ja | Ja i webbläsare, ej testat | Länken är i praktiken publik för den som har den. Barn i bild | OBSERVED |
| **OneDrive** | Okänt. Ingen träff | Okänt | Beror på delningsinställning | Okänt | Okänt | Ej funnet |
| **Hudl** | Endast publika *highlights* ska gå att bädda in; hela matcher inte (tredjepartsguide) | Ingen info | Delning mellan konton kräver inloggning | Okänt | Publik highlight = publik | OBSERVED (Hudls egna sidor ej lästa) |
| **Telefonfil (MP4)** | Ja lokalt via `<video>` + `URL.createObjectURL(file)` | Via `#t=start,end` (media fragments, HYPOTHESIS) eller JS | Nej | Ja | Stannar på enheten. Ingen uppladdning | VERIFIED (objekt-URL) / HYPOTHESIS |
| **Generell länk** | Nej, bara `<a target="_blank" rel="noopener">` | Endast om leverantörens URL stöder det | Beror på mål | Ja | Appen skickar inget; mål-sajten styr | HYPOTHESIS |

### Tekniska detaljer med källa

- YouTube `start`/`end`: heltal sekunder, `end` mäts från videons början, inte från `start`; seek till närmaste keyframe (VERIFIED) – https://developers.google.com/youtube/player_parameters
- YouTube: minsta spelare 200×200 px, rekommenderat 480×270; fel 101/150 = ägaren tillåter ej inbäddning; fel 153 = saknar Referer; `endSeconds` stöds i `loadVideoById` med objekt-syntax; autoplay kan blockeras (`onAutoplayBlocked`) (VERIFIED) – https://developers.google.com/youtube/iframe_api_reference
- YouTube kräver HTTP Referer från embeds; sätt inte `Referrer-Policy: no-referrer` (rekommenderat `strict-origin-when-cross-origin`) (VERIFIED) – https://developers.google.com/youtube/terms/required-minimum-functionality. **Konsekvens:** GitHub Pages-appen skickar normal Referer, så det fungerar; kontrollera att inga meta-referrer-taggar sätts.
- `enablejsapi=1` + `origin=<vår domän>` rekommenderas (VERIFIED) – player_parameters ovan.
- Privacy-enhanced mode: byt domän till `youtube-nocookie.com` (VERIFIED) – https://support.google.com/youtube/answer/171780. Samma sida nämner varken cookies eller olistade videor.
- Vimeo `#t=1m2s` och `dnt` (VERIFIED) – https://help.vimeo.com/hc/en-us/articles/12426260232977-About-privacy-settings (sidan visar player-parametrar; titeln i URL:en gäller inställningar). Integritetslägen: "alla utom Private kan bäddas in", domänlåsning ej på Free/Basic (OBSERVED, sökresumé av https://help.vimeo.com/hc/articles/12427906892689 – ej själv hämtad).
- Vimeo olistad kräver full länk (med hash) i oEmbed (OBSERVED, sökresumé).
- Drive: embed via "Embed item…", kräver delning "Anyone with the link"; "Copy link to this time" finns (OBSERVED) – https://xebia.com/blog/share-a-link-to-a-specific-time-in-google-drive-video/ (sökträff, ej hämtad).
- Veo delning: måste vara Public, kan inkludera aktuell position, kräver editor/admin, tittare behöver inget konto, utgångna inspelningar kan inte delas (OBSERVED, sökresumé) – https://support.veo.com/hc/en-us/articles/4451490513169 (403 vid hämtning; `support.veo.co` redirectar dit).
- Veo-embed: sökning gav ingen träff på embed-kod (**ej funnet**, inte bevis på frånvaro). Tidigare slutsats i `VEO.md` är densamma.
- Hudl: embed endast för publika highlights, inte hela matcher (OBSERVED, tredjepart) – https://help.sportsrecruits.com/hc/en-us/articles/214957263; Hudl-sida om embed-länkar för highlights https://www.hudl.com/support/athletes-guide-to-hudl/guides/highlights (snippet).
- `X-Frame-Options` / CSP `frame-ancestors` styr om en sida får visas i iframe; saknas båda kan vem som helst bädda in; ALLOW-FROM är obsolet (VERIFIED) – https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options. **Jag kunde inte verifiera faktiska headers för Veo, Drive, OneDrive eller Hudl** (inga curl-prov gjorda). Rekommendation: testa med riktig länk innan "bädda in" erbjuds för en leverantör.
- Objekt-URL: giltig tills `URL.revokeObjectURL()` anropas; Blob hålls i minnet; försvinner i praktiken vid sidladdning (VERIFIED/HYPOTHESIS) – https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static
- localStorage: endast strängar, `QuotaExceededError` vid fullt (VERIFIED); ~5 MiB per origin är allmänkunskap, ej från källan – https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API. En videofil ryms inte; IndexedDB är tekniskt möjligt men bryter mot principen "kopiera aldrig in video" och JSON-exporten.

## Rekommenderad länkmodell (HYPOTHESIS – design hör till arkitekten)

Ett `VideoClip`-objekt, kopplat till **scenario eller steg** via en lista (`clips: VideoClip[]`) på båda nivåerna, så ett klipp kan visa hela scenariot eller en enskild situation:

| Fält | Typ | Kommentar |
|---|---|---|
| `id` | sträng | |
| `url` | sträng | Originallänken som tränaren klistrade in. Källan till sanning |
| `provider` | `youtube` \| `vimeo` \| `veo` \| `drive` \| `onedrive` \| `hudl` \| `other` | Härleds ur URL-värd; användaren kan ändra |
| `startSec` | heltal ≥ 0, valfri | Heltalssekunder (YouTube kräver heltal) |
| `endSec` | heltal > `startSec`, valfri | Bara meningsfull där leverantören stöder det (YouTube); annars visas som text |
| `label` | sträng | Kort beskrivning, t.ex. "Förlorad boll i 23:e minuten" |
| `matchLabel` | sträng, valfri | "Match mot X, 2026-10-12" – inga spelarnamn |
| `access` | `unlisted` \| `private` \| `public` \| `unknown` | Tränarens egen uppgift, styr varning |

- **Spelaren** väljs av `provider`: YouTube → `youtube-nocookie.com/embed/<id>?start=&end=&playsinline=1`; Vimeo → embed + `#t=`+`dnt=1`; övriga → knapp "Öppna i ny flik" (`rel="noopener noreferrer"`, notera: för YouTube-iframe ska Referer *inte* tas bort).
- **Ladda inte iframen förrän tränaren klickar** ("Visa klipp") så inga tredjepartsförfrågningar sker vid sidladdning (HYPOTHESIS, bra för integritet och prestanda).
- Per steg eller per scenario? Båda. Klipp på steg ger "så här såg det ut" vid rätt situation; klipp på scenario är enklare första version. Börja med scenario-nivå, lägg steg-nivå vid behov (HYPOTHESIS).
- **Lokala filer**: erbjud inte i v1. Om det önskas: spela via objekt-URL under sessionen, spara bara filnamn + tider, visa "Välj filen igen" (HYPOTHESIS).
- Spara inget som kan identifiera barn i fritext; JSON-exporten får innehålla länkar → varna att länkar i en exporterad fil kan delas vidare.

## Juridik och etik (Sverige)

- **IMY-vägledning om streaming av barn- och ungdomsidrott** (2026-06-26, IMY-2026-9401): gäller personer upp till 18 år; avser direktsändning **och publicering av inspelningar på internet**; **"Inspelningar för internt bruk, exempelvis som en del av coachningen av idrottsutövarna, omfattas däremot inte"**; bild och ljud är personuppgifter; föreningen (inte tränaren personligen) är personuppgiftsansvarig; privatundantaget gäller inte om filmen läggs på öppna konton för en stor/obegränsad krets (VERIFIED, hämtad och textextraherad PDF) – https://www.imy.se/globalassets/dokument/vagledningar/vagledning-om-streaming-av-barn--och-ungdomsidrott.pdf
- Samma dokument: inspelning som ligger kvar och är åtkomlig i efterhand är ett större intrång; mildrande åtgärder är bl.a. begränsad lagringstid, begränsa vem som kan se (t.ex. koder), utzoomad filmning; vid samtycke: "IMY:s rekommendation är dock att alltid be om vårdnadshavarens samtycke om barnet är under 13 år", ingen generell åldersgräns, och återkallat samtycke innebär att materialet måste raderas (i lagsport i praktiken hela inspelningen) (VERIFIED).
- **RF:s riktlinjer** (2025-09-02): barnidrott = under 13, ungdomsidrott = 13–19; RF rekommenderar att föreningar generellt avstår från att streama barnidrott och att streaming av ungdomsidrott bara sker när det är motiverat; risker: mobbning/uthängning om sekvenser delas på sociala medier, skyddade personuppgifter (VERIFIED, textextraherad PDF) – https://www.rf.se/download/18.17c5deb319909b475bc2be91/1756909806301/Riktlinjer%20vid%20streaming%20av%20barn-%20och%20ungdomsidrott.pdf. RF-dokumentet definierar streaming som realtidssändning; det handlar alltså inte direkt om efterhandsklipp, men riskresonemangen gäller (HYPOTHESIS).
- **Ålder 13**: Sverige har satt 13 år som gräns för barns eget samtycke till informationssamhällets tjänster (dataskyddslagen 2018:218, 2 kap. 4 §) (OBSERVED, sekundärkälla https://www.legiscope.com/blog/samtycke-gdpr-krav.html; lagtexten ej läst). Gäller tjänster som riktas direkt till barn; **inte** automatiskt en gräns för filmning/publicering – IMY säger uttryckligen att det inte finns någon generell åldersgräns där.
- **Förälders privata film**: privat bruk och delning inom familjen omfattas inte av GDPR (VERIFIED, IMY ovan). Det är en annan situation än en tränare som länkar klipp i ett verktyg.
- **SvFF**: jag hittade ingen SvFF-specifik riktlinje om efterhandsklipp (**ej funnet**). Fotbollsförbundets egna regler om streaming kunde inte bekräftas.
- **Veo**: ingen svensk vägledning som nämner Veo hittades. En irländsk GAA-policy 2024 bad klubbar avstå från Veo för ungdomslag under granskning (OBSERVED, sökresumé; ej bindande i Sverige).
- Tolkning (HYPOTHESIS, ej juridisk rådgivning): appen lagrar bara länkar lokalt hos tränaren, så den som behandlar personuppgifter är i första hand tränarens förening via sin filmning/länkdelning. Appen bör **inte** själv publicera eller hosta video.

### Vad verktyget bör göra (HYPOTHESIS, grundad i ovanstående)

1. Lagra aldrig videodata; bara länk, tider, etikett.
2. Be tränaren ange `access`; förhandsvälj **olistad**; visa gul varning vid `public`/`unknown`: "Länken kan ses av alla som har den. Klippet visar barn."
3. Varna vid tydliga mönster: Veo-länk (måste vara Public för att fungera → varna särskilt), Drive "anyone with link".
4. Engångsinfo vid första klippet: använd bara i intern coachning; dela inte vidare på öppna sociala medier; ta bort om vårdnadshavare/spelare invänder; kontrollera klubbens rutiner och barn med skyddad identitet.
5. Ingen spelarnamn-fritext i klippetiketter; hellre rollbeskrivning ("vänsterback").
6. YouTube alltid via `youtube-nocookie.com`, Vimeo med `dnt=1`, laddas först efter klick.
7. Exportvarning: JSON-filen innehåller länkar som kan fungera för vem som helst.
8. Visa vem klippet *inte* är avsett för: ej för offentlig webbplats/sociala medier.

## Luckor och osäkerheter

- support.veo.com och hudl.com-sidor blockerar eller gav 403/ej hämtade; Veo- och Hudl-påståenden är OBSERVED via sökresuméer.
- Inga HTTP-headers (X-Frame-Options/CSP) uppmätta för någon leverantör. Test med curl rekommenderas.
- Vimeo sluttid, Drive start-URL-format, OneDrive allt: ej verifierat.
- Mobilbeteende ej testat på riktiga enheter.
- Lagtext (dataskyddslagen 2 kap. 4 §) ej läst direkt.
- Inga juridiska råd; produktägaren/klubben bör få bedömningen bekräftad av klubbens dataskyddsansvarige eller RF/SvFF.
