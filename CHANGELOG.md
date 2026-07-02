# Changelog

## 2026-06-22

### Completed
- Landen-drill-down in Zenders-tab + 39 nieuwe default-zenders. Spec: `docs/superpowers/specs/2026-06-22-country-stations-design.md`.
  - `stations.ts`: `Station` krijgt `country` (`NL|BE|UK|DE|INT`), `COUNTRIES`-registry + `countryOf()`. Alle bestaande zenders getagd, Scotland → INT.
  - Nieuwe zenders (elke URL geverifieerd op bereikbaarheid + audio content-type): BE 8 (StuBru/MNM/VRT R1/Klara/Qmusic BE/Joe BE/...), UK 9 (Global-brands Capital/Heart/Classic FM/Smooth/Radio X/Gold/LBC + talkSPORT), DE 10 (1LIVE/WDR2/SWR3/NDR2/Bayern3/Antenne/Rock Antenne/bigFM/sunshine live/Dlf), INT 12 (SomaFM x4/FIP x2/Swiss Jazz+Pop/Radio Paradise x2/KEXP/Scotland). BBC overgeslagen (HLS-only, niet door Sonos af te spelen).
  - `Home.tsx`: country-first picker (Favorieten + Recent + landen met aantallen) → stationlijst per view, terug-balk `‹ Alle landen`. Laatste view + recent (laatste 5) persistent via Preferences. Search blijft globaal over alle landen met land-vlag per resultaat.
  - `theme.css`: `.sr-country-row` + `.sr-back-row` toegevoegd.
  - Gebouwd, gesynced, debug-APK geïnstalleerd + gelaunched op Galaxy S22 (192.168.2.20) — start zonder crash.
- App Store-voorbereiding (iOS): naam overal → "SonoRadio" (incl. risicovolle iOS `CFBundleDisplayName`, stond op "Sonos Radio"). Signing-team `DEVELOPMENT_TEAM = TBH425X27A` (Schulten Media, company-ADP) gezet in pbxproj. Gesigneerde archive + App Store-IPA headless gebouwd (`xcodebuild archive` + `-exportArchive` met `-allowProvisioningUpdates`): bundle-id `nl.schultenmedia.sonosradio` automatisch geregistreerd als expliciete App ID, distributie-cert + App Store-profiel aangemaakt. IPA: `/tmp/SonoRadio-ipa/App.ipa`.
  - BLOKKADE: geen App Store Connect-credentials voor het SM-account (alleen Coachio individuele key, ander account). Nodig: ASC **Team API key** voor Schulten Media (issuer-id + key-id + .p8) om app-record aan te maken + te uploaden.
- App Store listing-materiaal gemaakt (in `store/`):
  - Metadata NL + EN (`store/metadata/<locale>/`): name, subtitle, keywords, promo, description, release_notes, privacy/support-url. Copy bewust onderscheidend (privacy/anti-cloud-hoek), met "niet verbonden aan Sonos"-disclaimer.
  - Privacy-policy (tweetalig, branded) live op **https://sonoradio-privacy.pages.dev** (Cloudflare Pages project `sonoradio-privacy`).
  - 6 marketing-screenshots per locale (1290×2796, iPhone 6.7") in `store/screenshots/<locale>/APP_IPHONE_67/`. Recept: web-build seeden via `CapacitorStorage.*` (nep-speakers Woonkamer/Keuken + favorieten/recent) + SOAP-mock voor afspelend Nu-scherm, Playwright-capture (`scripts/shoot-raw.mjs`), framen met brand-gradient + kop (`scripts/frame.mjs`).
  - Bijvangst-fix: `speakers`- en `customStations`-persist-effects in Home.tsx kregen een `hydrated`-guard (overschreven anders de opgeslagen lijst met lege initiële state bij mount - echte race-bug).
- Icoon warm gemaakt (was nog blauw/navy, paste niet bij amber-thema): `public/icon.svg` + `assets/foreground.svg` bg/fills → warm (#241a10/#0e0a06/#15110c), manifest theme/background → #15110c. PNG's geregenereerd via chromium (`scripts/icons.mjs` voor web 192/512/180/32; `scripts/assets-src.mjs` voor capacitor-bron), daarna `npx @capacitor/assets generate --ios --android` → nieuwe iOS AppIcon + Android launcher. Mac PWA herbouwd + service herstart (nieuw icoon geverifieerd geserveerd); Android debug-APK herbouwd + herinstalleerd op S22. LET OP: bestaande `/tmp/SonoRadio-ipa/App.ipa` heeft nog het oude icoon → archive/IPA opnieuw bouwen vóór de definitieve App Store-upload.
- Mac-versie bijgewerkt: `npm run build` + `launchctl kickstart dev.schulten.sonos-radio`, draait op localhost:4173 met landen-features + warm icoon. (Geïnstalleerde Chrome-PWA vereist herinstallatie om nieuw icoon te tonen.)

## 2026-06-19

### Completed
- Bug "Stop mislukt: Failed to fetch" + "UUID onbekend" + "moet IP invullen" opgelost — bleken één oorzaak: de web/PWA-versie heeft `server.mjs` als CORS-proxy nodig, maar die draaide niet. De service worker cachet de UI-schil, dus de app opende wel maar elke SOAP-call faalde op netwerk-niveau.
- `server.mjs` als altijd-aan launchd-service gezet: `~/Library/LaunchAgents/dev.schulten.sonos-radio.plist` (RunAtLoad + KeepAlive, PORT 4173, log → `server.log`). Proxy + auto-discovery nu permanent beschikbaar zolang de Mac op het Sonos-LAN zit.
- Geverifieerd: discovery vindt Sonos One "Kantoor" 192.168.2.19 mét UUID; proxy-SOAP GetTransportInfo → HTTP 200.

### Note
- Einddoel blijft de native iOS/Android (Capacitor) app — daar vervalt CORS/proxy/IP/UUID-gedoe volledig. Desktop-PWA is de tussenoplossing.

### Native installables (gestart)
- `npx cap add android` + `assembleDebug` → **`builds/SonosRadio-debug.apk`** (4 MB, direct sideloadbaar). Build via `ANDROID_HOME=~/Library/Android/sdk`, `local.properties` met sdk.dir.
- `npx cap add ios` + Info.plist aangevuld (NSAllowsLocalNetworking + NSLocalNetworkUsageDescription + NSBonjourServices _sonos._tcp). `cap sync` groen.
- CocoaPods-fix: Homebrew-formula stuk onder Ruby 4.0 (ffi-conflict) → opgelost met `/opt/homebrew/opt/ruby/bin/gem install cocoapods` (1.16.2 in `/opt/homebrew/lib/ruby/gems/4.0.0/bin/pod`). `pod install` daarna groen.
- appId `nl.schultenmedia.sonosradio`. Dev-signing aanwezig (Apple Development jsn@schultenmedia.nl + Jochem Schulten). iPad van Jochem (iOS 18.5, UDID 00008020-000105800E21402E) gekoppeld. iOS-distributiekeuze (TestFlight vs direct naar iPad) nog open.

### Native discovery werkend gemaakt (mobiel)
- Android-app draaide maar vond geen Sonos. Drie gestapelde oorzaken opgelost:
  1. **Mixed content**: `androidScheme` van `https` → `http` (anders blokkeert Chromium de http-calls naar de Sonos vanaf https://localhost).
  2. **CORS**: de Sonos stuurt geen CORS-headers en de WebView handhaaft CORS. Opgelost met `CapacitorHttp` (plugins.CapacitorHttp.enabled = true) → `fetch` loopt via native HTTP, buiten CORS/mixed-content om.
  3. **Trage/fragiele scan**: native HTTP negeert AbortController. Discovery herschreven: eigen subnet via WebRTC-detectie (scan dat eerst), harde per-probe timeout via Promise.race, en speakers worden direct getoond (`onFound`) i.p.v. wachten op de hele scan.
- Geverifieerd op Galaxy S22 (adb wireless): Sonos One "Kantoor" 192.168.2.19 mét UUID binnen ~9s gevonden, zonder IP invullen.

### UI-herontwerp ("night radio")
- Warm donker thema (`src/theme.css`) met amber dial-accent; Ionic-variabelen overschreven.
- 3 tabs onderin: **Nu** (gloeiende now-playing hero + equalizer-puls + volume + transport), **Zenders** (zoeken/favorieten-segment/kaart-rijen, spelende zender amber omrand), **Wekker** (alarms op eigen pagina).
- **Kamer-balk** bovenin voor multi-Sonos: horizontale chips, actieve kamer = context voor alles, groene puls-stip bij spelende kamer. Vervangt het verstopte selector-menu.
- Logo herontworpen naar amber broadcast-golven; launcher-icoon + splash (light/dark) gegenereerd via `@capacitor/assets` uit `assets/` bronnen.
- Bugfix: dubbel-geëncodeerde metadata (`Soul &amp; Jazz`) wordt nu correct gedecodeerd.

### Wekker-formulier + rename
- Edit-wekker "waarden leeg": bleek geen data-bug maar witte native `<input type="time">` op donkere achtergrond (wit-op-wit). Opgelost met `color-scheme: dark` + themed velden (`.sr-time`, `.sr-select-box`), nette form-opmaak op een kaart.
- App hernoemd naar **SonoRadio** (header-merknaam, capacitor.config appName, android strings app_name, index.html title, manifest). Bundle-id blijft voorlopig `nl.schultenmedia.sonosradio` (display-naam los van bundle-id).
- APK heet nu `builds/SonoRadio-debug.apk`.

## 2026-04-28

### Completed
- Sonos Radio app scaffold (Ionic React + Capacitor + Vite + TS)
- Sonos service met SetAVTransportURI / Play / Stop / SetVolume / GetVolume / GetTransportInfo via SOAP op poort 1400
- Speaker discovery via subnet-scan (probe `/xml/device_description.xml`, 32 parallel)
- Home UI: speaker-selectie + persistentie, NL radio presets (NPO 1-5, 538, Sky, Qmusic, Veronica, BNR, SLAM!, 100% NL), custom stations toevoegen/verwijderen, volume slider, manueel IP toevoegen
- Persistentie via @capacitor/preferences
- Build verified: `npm run build` groen

### Updates (zelfde dag)
- Alarms beheren: lijst, aanmaken (start/stop tijd → duration auto-berekend), recurrence (dagelijks/werkdagen/weekend/eenmalig), volume, enable-toggle, verwijderen. Loopt via Sonos AlarmClock SOAP — Sonos doet zelf scheduling én auto-stop via Duration.
- Recents (laatste 10 zenders) + favorieten gecombineerd in één view, search overrulet groepering, dedup, group headers
- Now playing: GetPositionInfo + GetMediaInfo polling elke 5s, parsed DIDL voor titel/artiest/streamContent/zender
- Console-logs op alle SOAP calls (browser + server)
- Server-side discovery endpoint (Vite middleware) — 2.5s ipv 12s, slaat Tailscale CGNAT over
- Speaker UUID (RINCON_xxx) wordt nu opgeslagen — nodig voor alarms; auto-reprobe bij ontbrekende UUID
- Vite dev-proxy `/sonos-proxy/{ip}/...` toegevoegd zodat browser-discovery werkt zonder CORS-block
- Auto-scan bij eerste keer openen (alleen als persistente speakers leeg zijn)
- Greatest Hits Non-Stop (Scotland) toegevoegd aan presets

### TODO (volgende sessie)
- `npx cap add ios` + `npx cap add android` (vereist Xcode / Android Studio op machine waar je deployed)
- iOS Info.plist aanvullen met NSAllowsLocalNetworking + NSLocalNetworkUsageDescription + NSBonjourServices (zie CLAUDE.md)
- Testen op echt device (browser dev werkt niet vanwege CORS op Sonos)
