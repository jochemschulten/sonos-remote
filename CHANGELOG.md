# Changelog

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
