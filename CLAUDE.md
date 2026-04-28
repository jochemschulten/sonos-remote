# Sonos Radio

Cross-platform mobile app (iOS + Android) om radiostreams op een Sonos te zetten.

## Stack

- **Ionic React** (UI components)
- **Capacitor** (native shell voor iOS + Android)
- **Vite + TypeScript** (build)
- Geen backend — directe SOAP-calls naar de Sonos op poort 1400

## Hoe Sonos wordt aangestuurd

Elke Sonos-speaker draait een UPnP-server op `http://{ip}:1400`. We sturen drie SOAP-acties:

- `SetAVTransportURI` op `/MediaRenderer/AVTransport/Control` — zet de stream-URL (radio gebruikt `x-rincon-mp3radio://` prefix + DIDL metadata)
- `Play` / `Stop` op zelfde endpoint
- `SetVolume` op `/MediaRenderer/RenderingControl/Control`

Discovery: subnet-scan over poort 1400 (`/xml/device_description.xml` retourneert Sonos device info). Geen SSDP/UDP nodig — werkt vanuit WebView.

## Development

```bash
npm install
npm run build
npx cap add ios
npx cap add android
npx cap sync
npx cap run ios       # of android
```

**Browser dev (`npm run dev`) werkt niet voor SOAP-calls** vanwege CORS — Sonos retourneert geen CORS-headers. Test op een echt device of simulator.

## iOS extra

In `ios/App/App/Info.plist` toevoegen:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsLocalNetworking</key>
  <true/>
</dict>
<key>NSLocalNetworkUsageDescription</key>
<string>Nodig om je Sonos-speakers in het lokale netwerk te vinden.</string>
<key>NSBonjourServices</key>
<array>
  <string>_sonos._tcp</string>
</array>
```

## Android extra

`cleartext: true` staat aan in `capacitor.config.ts` — nodig voor HTTP naar lokaal IP.
