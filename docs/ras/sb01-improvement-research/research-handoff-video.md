# Research handoff: videoklipp (2026-10-29) – rapport: docs/research/VIDEO-CLIPS.md

**Found**
- YouTube: iframe med `start`/`end` (heltal sek), `youtube-nocookie.com`, kräver Referer; ägaren kan stänga av inbäddning (VERIFIED). Vimeo `#t=` + `dnt` (VERIFIED).
- Veo: delningslänk kräver Public, kan ha startposition, tittare behöver inget konto, ingen embed-kod hittad (OBSERVED).
- IMY (2026-06-26): inspelningar för internt coachningsbruk omfattas inte; publicering av inspelningar på nätet gör det; samtycke av vårdnadshavare rekommenderas under 13 år (VERIFIED). RF: avstå från streaming av barnidrott (VERIFIED).
- Lokal video kan inte sparas i localStorage; objekt-URL är bara sessionsbunden (VERIFIED).

**Not found**: Veo/OneDrive embed, headers (X-Frame-Options) per leverantör, SvFF-riktlinje om efterhandsklipp, Vimeo/Drive sluttid. Frånvaro är inget bevis.

**Top recommendation**: lagra bara `{url, provider, startSec, endSec, label, access}` per scenario (steg senare). Bädda in YouTube (nocookie)/Vimeo efter klick; allt annat som "Öppna i ny flik". Förvälj olistad, varna vid public/Veo, aldrig kopiera in video.

**Avoid**: lagra video i appen/IndexedDB; Veo-skrapning; offentliga länkar utan varning; spelarnamn i etiketter; ladda tredjepartsiframes vid sidladdning.

**Open questions för ägaren**: Använder era tränare Veo (Public-krav) eller kan de ladda upp olistat till YouTube? Ska lokala telefonfiler stödjas? Har klubben samtyckesrutin och barn med skyddad identitet? Ska JSON-exporten få innehålla länkar?

**Evidence limits**: support.veo.com/Hudl blockerade (403), Veo/Hudl/Drive/Vimeo-planer från sökresuméer; ingen mobiltest; lagtext ej läst; ingen juridisk rådgivning.
