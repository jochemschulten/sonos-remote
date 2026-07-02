# SonoRadio - Landen + meer zenders

Datum: 2026-06-22

## Doel

Meer default-zenders toevoegen en de zenderlijst per land organiseren, zo dat
de UI ook werkbaar blijft bij 10+ landen.

## Probleem

`stations.ts` is nu een platte `{ name, url }[]` (~95 NL-zenders + 1 Scotland),
gerenderd als een enkele scrollbare lijst met search + favorieten/alle-toggle.
Filter-chips of section-headers schalen slecht voorbij ~5-6 landen.

## Oplossing: country-first drill-down (TuneIn-model)

### Data model (`stations.ts`)

```ts
export type CountryCode = 'NL' | 'BE' | 'UK' | 'DE' | 'INT';

export type Station = {
  name: string;
  url: string;
  country: CountryCode;
};

export type Country = { code: CountryCode; name: string; flag: string; order: number };
export const COUNTRIES: Country[] = [
  { code: 'NL', name: 'Nederland', flag: '🇳🇱', order: 1 },
  { code: 'BE', name: 'België',    flag: '🇧🇪', order: 2 },
  { code: 'UK', name: 'UK',        flag: '🇬🇧', order: 3 },
  { code: 'DE', name: 'Duitsland', flag: '🇩🇪', order: 4 },
  { code: 'INT',name: 'Internationaal', flag: '🌍', order: 99 },
];
```

Aantallen per land worden afgeleid uit de lijst. Nieuw land toevoegen = entries
taggen + 1 registry-regel. Bestaande NL-zenders krijgen `country: 'NL'`, de
Scotland-zender wordt `'INT'` (of `'UK'`).

### Navigatie - twee niveaus in de Zenders-tab

State: `view` = `'picker' | CountryCode | 'fav' | 'recent'`.

- **Picker (parent):** lijst van rijen:
  - `★ Favorieten (n)` - alleen als n > 0
  - `↻ Recent (n)` - alleen als n > 0
  - per land `🇳🇱 Nederland · 95` (gesorteerd op `order`)
- **Stationlijst (child):** bestaande row-UI (`sr-station-row`). Bovenaan een
  terug-rij `‹ Alle landen` die `view='picker'` zet.
- **Persistentie:** `view` opslaan in Preferences (`PREF_VIEW`). Bij opstarten
  direct naar de opgeslagen view (land/fav/recent), anders picker.

### Recent

- Laatste 5 gespeelde zenders, elk land, in Preferences (`PREF_RECENT`,
  array van url's, meest recent eerst, dedup, cap 5). Gevuld in `handlePlay`.

### Search = globaal

- Zoeken in de searchbar zoekt over ALLE landen plat (huidige gedrag), ongeacht
  `view`. Elke resultaat-rij toont een land-vlag/tag. Search leeg => terug naar
  huidige `view`.

### Favorieten

- Blijft cross-country. Bereikbaar als top-rij in de picker (`'fav'` view).
  Vervangt de oude favorieten/alle-segment-toggle.

## Nieuwe zenders (initiële batch)

BE, UK, DE + kleine INT/US-set. **Elke URL wordt geverifieerd** (HTTP bereikbaar
+ audio content-type via `curl -sI`) vóór opname. Dode streams gaan er niet in.

Richt-set (definitief na verificatie):
- **BE:** Studio Brussel, MNM, Radio 1, Radio 2, Klara, Qmusic BE, Joe BE,
  Nostalgie BE, Topradio, Willy
- **UK:** BBC Radio 1, 2, 4, 6 Music, 1Xtra, Capital, Heart, Kiss, Classic FM,
  Absolute Radio, Jazz FM
- **DE:** 1LIVE, WDR 2, SWR3, Bayern 3, NDR 2, Antenne Bayern, Deutschlandfunk,
  Rock Antenne, sunshine live, bigFM
- **INT:** een handvol (lo-fi/jazz/worldwide/US public)

## Niet in scope (YAGNI)

- Continent/regio/stad-nesting (TuneIn doet dit; wij blijven op landniveau).
- Zender-logo's (alleen vlag per land).
- Eigen-zender krijgt voorlopig `country: 'INT'` (geen land-keuze in het
  toevoeg-formulier; kan later).

## Test

- Build debug-APK, push naar Galaxy S22 (192.168.2.20:35001), live testen:
  picker → land → speel zender op Sonos One Kantoor (192.168.2.19), search
  globaal, favorieten/recent rijen, persistentie na herstart app.
