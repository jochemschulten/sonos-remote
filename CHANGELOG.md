# Changelog

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
