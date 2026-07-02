import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.SHOOT_URL || 'http://localhost:4321';
const OUT = 'store/screenshots/raw';
mkdirSync(OUT, { recursive: true });

const fav = [
  'https://icecast.omroep.nl/radio2-bb-mp3',
  'https://stream.qmusic.nl/qmusic/mp3',
  'https://icecast.vrtcdn.be/stubru-high.mp3',
  'https://ice1.somafm.com/groovesalad-128-mp3',
];
const recent = [
  'https://icecast.omroep.nl/3fm-bb-mp3',
  'https://media-ssl.musicradio.com/ClassicFMMP3',
  'https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3',
];
const speakers = [
  { ip: '192.168.1.42', name: 'Woonkamer', room: 'Woonkamer', modelName: 'Sonos One', uuid: 'RINCON_AAAA01400' },
  { ip: '192.168.1.43', name: 'Keuken', room: 'Keuken', modelName: 'Sonos Era 100', uuid: 'RINCON_BBBB01400' },
];
const seed = {
  speakers: JSON.stringify(speakers),
  selectedIp: '192.168.1.42',
  favoriteUrls: JSON.stringify(fav),
  recentUrls: JSON.stringify(recent),
  browseView: 'picker',
};

// ---- Gefakete SOAP-responses voor een "afspelend" Nu-scherm ----
const enc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const trackDidl = enc(
  '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/">' +
  '<item><dc:title>Bohemian Rhapsody</dc:title><dc:creator>Queen</dc:creator><r:streamContent>Queen - Bohemian Rhapsody</r:streamContent></item></DIDL-Lite>'
);
const stationDidl = enc(
  '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/"><item><dc:title>NPO Radio 2</dc:title></item></DIDL-Lite>'
);
const envelope = (action, inner) =>
  `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><u:${action}Response>${inner}</u:${action}Response></s:Body></s:Envelope>`;

const soapResponses = {
  GetTransportInfo: envelope('GetTransportInfo', '<CurrentTransportState>PLAYING</CurrentTransportState><CurrentSpeed>1</CurrentSpeed>'),
  GetPositionInfo: envelope('GetPositionInfo', `<Track>1</Track><TrackURI>x-rincon-mp3radio://stream</TrackURI><TrackMetaData>${trackDidl}</TrackMetaData>`),
  GetMediaInfo: envelope('GetMediaInfo', `<CurrentURI>x-rincon-mp3radio://stream</CurrentURI><CurrentURIMetaData>${stationDidl}</CurrentURIMetaData>`),
  GetVolume: envelope('GetVolume', '<CurrentVolume>28</CurrentVolume>'),
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  serviceWorkers: 'block',
});
const page = await ctx.newPage();

await page.addInitScript((s) => {
  for (const [k, v] of Object.entries(s)) localStorage.setItem('CapacitorStorage.' + k, v);
}, seed);

// Fake alle SOAP-calls naar de proxy
await page.route('**/sonos-proxy/**', (route) => {
  const body = route.request().postData() || '';
  const action = Object.keys(soapResponses).find((a) => body.includes(`<u:${a} `) || body.includes(`<u:${a}>`));
  if (action) return route.fulfill({ status: 200, contentType: 'text/xml', body: soapResponses[action] });
  return route.fulfill({ status: 200, contentType: 'text/xml', body: '<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body/></s:Envelope>' });
});
await page.route('**/sonos-discover**', (r) => r.abort());

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const shot = async (name) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
};
const tap = async (text) => {
  await page.getByText(text, { exact: true }).first().click();
  await page.waitForTimeout(600);
};

// 1. Nu (afspelend)
await page.waitForTimeout(1200); // wacht op now-playing poll
await shot('01-now');

// 2. Picker
await tap('Zenders');
await shot('02-picker');

// 3. Nederland
await tap('Nederland');
await shot('03-nederland');
await tap('Alle landen');

// 4. Favorieten
await tap('Favorieten');
await shot('04-favorieten');
await tap('Alle landen');

// 5. Zoeken
const sb = page.locator('input[type="search"], .searchbar-input').first();
await sb.click();
await sb.fill('jazz');
await shot('05-zoeken');
await sb.fill('');

// 6. Wekker (toevoeg-formulier open voor een vollere shot)
await tap('Wekker');
await page.getByText('Wekker toevoegen', { exact: false }).first().click();
await page.waitForTimeout(700);
await shot('06-wekker');

await browser.close();
console.log('done');
