export type Speaker = {
  ip: string;
  name: string;
  room: string;
  modelName: string;
  uuid?: string; // RINCON_xxx — nodig voor alarms
};

const AV_PATH = '/MediaRenderer/AVTransport/Control';
const RC_PATH = '/MediaRenderer/RenderingControl/Control';
const AV_NS = 'urn:schemas-upnp-org:service:AVTransport:1';
const RC_NS = 'urn:schemas-upnp-org:service:RenderingControl:1';

// In Vite dev (browser) zit er CORS tussen ons en Sonos. Vite middleware proxiet alle
// /sonos-proxy/{ip}/... naar http://{ip}:1400/... Op native (Capacitor WebView) is er
// geen CORS en gaan we direct.
const isDev = typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;
const baseUrl = (ip: string, path: string): string =>
  isDev ? `/sonos-proxy/${ip}${path}` : `http://${ip}:1400${path}`;

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

async function soap(ip: string, path: string, ns: string, action: string, bodyInner: string): Promise<string> {
  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:${action} xmlns:u="${ns}">${bodyInner}</u:${action}>
  </s:Body>
</s:Envelope>`;

  const url = baseUrl(ip, path);
  const t0 = performance.now();
  console.log(`[sonos] → ${action} @ ${ip}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        SOAPACTION: `"${ns}#${action}"`
      },
      body: envelope
    });

    const text = await res.text();
    const ms = Math.round(performance.now() - t0);
    if (!res.ok) {
      console.warn(`[sonos] ✗ ${action} @ ${ip} (${res.status}, ${ms}ms)`);
      throw new Error(`Sonos ${action} faalde (${res.status}): ${text.slice(0, 200)}`);
    }
    console.log(`[sonos] ← ${action} @ ${ip} (${ms}ms)`);
    return text;
  } catch (e) {
    const ms = Math.round(performance.now() - t0);
    console.error(`[sonos] ✗ ${action} @ ${ip} (${ms}ms)`, e);
    throw e;
  }
}

function radioMetadata(title: string): string {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item id="R:0/0/0" parentID="R:0/0" restricted="true"><dc:title>${xmlEscape(title)}</dc:title><upnp:class>object.item.audioItem.audioBroadcast</upnp:class><desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON65031_</desc></item></DIDL-Lite>`;
}

function radioUri(streamUrl: string): string {
  if (streamUrl.startsWith('x-')) return streamUrl;
  // Strip protocol — Sonos forms its own
  const stripped = streamUrl.replace(/^https?:\/\//, '');
  return `x-rincon-mp3radio://${stripped}`;
}

export async function playRadio(ip: string, streamUrl: string, title: string): Promise<void> {
  const uri = radioUri(streamUrl);
  const meta = radioMetadata(title);
  await soap(
    ip,
    AV_PATH,
    AV_NS,
    'SetAVTransportURI',
    `<InstanceID>0</InstanceID><CurrentURI>${xmlEscape(uri)}</CurrentURI><CurrentURIMetaData>${xmlEscape(meta)}</CurrentURIMetaData>`
  );
  await soap(ip, AV_PATH, AV_NS, 'Play', `<InstanceID>0</InstanceID><Speed>1</Speed>`);
}

export async function stop(ip: string): Promise<void> {
  await soap(ip, AV_PATH, AV_NS, 'Stop', `<InstanceID>0</InstanceID>`);
}

export async function pause(ip: string): Promise<void> {
  await soap(ip, AV_PATH, AV_NS, 'Pause', `<InstanceID>0</InstanceID>`);
}

export async function setVolume(ip: string, volume: number): Promise<void> {
  const v = Math.max(0, Math.min(100, Math.round(volume)));
  await soap(
    ip,
    RC_PATH,
    RC_NS,
    'SetVolume',
    `<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>${v}</DesiredVolume>`
  );
}

export async function getVolume(ip: string): Promise<number> {
  const xml = await soap(
    ip,
    RC_PATH,
    RC_NS,
    'GetVolume',
    `<InstanceID>0</InstanceID><Channel>Master</Channel>`
  );
  const m = xml.match(/<CurrentVolume>(\d+)<\/CurrentVolume>/);
  return m ? parseInt(m[1], 10) : 0;
}

export async function getTransportState(ip: string): Promise<string> {
  const xml = await soap(
    ip,
    AV_PATH,
    AV_NS,
    'GetTransportInfo',
    `<InstanceID>0</InstanceID>`
  );
  const m = xml.match(/<CurrentTransportState>(\w+)<\/CurrentTransportState>/);
  return m ? m[1] : 'UNKNOWN';
}

export type NowPlaying = {
  state: string;        // PLAYING, PAUSED_PLAYBACK, STOPPED, TRANSITIONING
  title?: string;       // Track titel (bij radio: streamTitle of "artiest - nummer")
  artist?: string;
  album?: string;
  streamContent?: string; // Ruwe r:streamContent uit DIDL (bij radio meestal "artiest - nummer")
  stationName?: string;   // Naam van de radiozender
  uri?: string;
};

const decodeXmlEntities = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

export async function getNowPlaying(ip: string): Promise<NowPlaying> {
  const [transportXml, positionXml, mediaXml] = await Promise.all([
    soap(ip, AV_PATH, AV_NS, 'GetTransportInfo', `<InstanceID>0</InstanceID>`),
    soap(ip, AV_PATH, AV_NS, 'GetPositionInfo', `<InstanceID>0</InstanceID>`),
    soap(ip, AV_PATH, AV_NS, 'GetMediaInfo', `<InstanceID>0</InstanceID>`)
  ]);

  const state = transportXml.match(/<CurrentTransportState>(\w+)<\/CurrentTransportState>/)?.[1] ?? 'UNKNOWN';
  const uri = positionXml.match(/<TrackURI>([^<]*)<\/TrackURI>/)?.[1];

  // TrackMetaData zit dubbel-gencodeerd in de SOAP response
  const trackMetaEnc = positionXml.match(/<TrackMetaData>([\s\S]*?)<\/TrackMetaData>/)?.[1] ?? '';
  const trackMeta = decodeXmlEntities(trackMetaEnc);
  const mediaMetaEnc = mediaXml.match(/<CurrentURIMetaData>([\s\S]*?)<\/CurrentURIMetaData>/)?.[1] ?? '';
  const mediaMeta = decodeXmlEntities(mediaMetaEnc);

  const title = trackMeta.match(/<dc:title>([^<]+)<\/dc:title>/)?.[1];
  const artist = trackMeta.match(/<dc:creator>([^<]+)<\/dc:creator>/)?.[1];
  const album = trackMeta.match(/<upnp:album>([^<]+)<\/upnp:album>/)?.[1];
  const streamContent = trackMeta.match(/<r:streamContent>([^<]+)<\/r:streamContent>/)?.[1];
  const stationName = mediaMeta.match(/<dc:title>([^<]+)<\/dc:title>/)?.[1];

  return { state, title, artist, album, streamContent, stationName, uri };
}

// ---------- Alarms ----------

const ALARM_PATH = '/AlarmClock/Control';
const ALARM_NS = 'urn:schemas-upnp-org:service:AlarmClock:1';

export type Recurrence = 'ONCE' | 'DAILY' | 'WEEKDAYS' | 'WEEKENDS';

export type Alarm = {
  id: string;
  startTime: string; // HH:MM:SS lokale tijd
  duration: string;  // HH:MM:SS
  recurrence: Recurrence | string; // soms 'ON_135' voor specifieke dagen
  enabled: boolean;
  roomUUID: string;
  programURI: string;
  programMetaData: string;
  playMode: string;
  volume: number;
  includeLinkedZones: boolean;
};

export type CreateAlarmInput = {
  startTime: string;
  duration: string;
  recurrence: Recurrence | string;
  enabled: boolean;
  roomUUID: string;
  streamUrl: string;
  stationName: string;
  volume: number;
  includeLinkedZones?: boolean;
};

function parseAlarmAttrs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out[m[1]] = decodeXmlEntities(m[2]);
  return out;
}

export async function listAlarms(ip: string): Promise<Alarm[]> {
  const xml = await soap(ip, ALARM_PATH, ALARM_NS, 'ListAlarms', '');
  const listEnc = xml.match(/<CurrentAlarmList>([\s\S]*?)<\/CurrentAlarmList>/)?.[1] ?? '';
  const list = decodeXmlEntities(listEnc);
  const alarms: Alarm[] = [];
  // Vangt zowel self-closing (<Alarm .../>) als met child (<Alarm ...><Content/></Alarm>)
  const re = /<Alarm\s+([^>]+?)\s*\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(list)) !== null) {
    const a = parseAlarmAttrs(m[1]);
    alarms.push({
      id: a.ID ?? '',
      startTime: a.StartTime ?? '',
      duration: a.Duration ?? '',
      recurrence: a.Recurrence ?? 'ONCE',
      enabled: a.Enabled === '1',
      roomUUID: a.RoomUUID ?? '',
      programURI: a.ProgramURI ?? '',
      programMetaData: a.ProgramMetaData ?? '',
      playMode: a.PlayMode ?? 'NORMAL',
      volume: parseInt(a.Volume ?? '0', 10),
      includeLinkedZones: a.IncludeLinkedZones === '1'
    });
  }
  return alarms;
}

function buildAlarmBody(idOrEmpty: string, input: CreateAlarmInput, isUpdate: boolean): string {
  const programURI = radioUri(input.streamUrl);
  const meta = radioMetadata(input.stationName);
  const vol = Math.max(0, Math.min(100, Math.round(input.volume)));
  return (
    (isUpdate ? `<ID>${idOrEmpty}</ID>` : '') +
    `<StartLocalTime>${input.startTime}</StartLocalTime>` +
    `<Duration>${input.duration}</Duration>` +
    `<Recurrence>${input.recurrence}</Recurrence>` +
    `<Enabled>${input.enabled ? 1 : 0}</Enabled>` +
    `<RoomUUID>${input.roomUUID}</RoomUUID>` +
    `<ProgramURI>${xmlEscape(programURI)}</ProgramURI>` +
    `<ProgramMetaData>${xmlEscape(meta)}</ProgramMetaData>` +
    `<PlayMode>NORMAL</PlayMode>` +
    `<Volume>${vol}</Volume>` +
    `<IncludeLinkedZones>${input.includeLinkedZones ? 1 : 0}</IncludeLinkedZones>`
  );
}

export async function createAlarm(ip: string, input: CreateAlarmInput): Promise<string> {
  const xml = await soap(ip, ALARM_PATH, ALARM_NS, 'CreateAlarm', buildAlarmBody('', input, false));
  return xml.match(/<AssignedID>(\d+)<\/AssignedID>/)?.[1] ?? '';
}

export async function updateAlarm(ip: string, id: string, input: CreateAlarmInput): Promise<void> {
  await soap(ip, ALARM_PATH, ALARM_NS, 'UpdateAlarm', buildAlarmBody(id, input, true));
}

export async function deleteAlarm(ip: string, id: string): Promise<void> {
  await soap(ip, ALARM_PATH, ALARM_NS, 'DestroyAlarm', `<ID>${id}</ID>`);
}

export async function setAlarmEnabled(ip: string, alarm: Alarm, enabled: boolean): Promise<void> {
  // UpdateAlarm vereist alle velden — we hergebruiken de bestaande waarden
  const inner =
    `<ID>${alarm.id}</ID>` +
    `<StartLocalTime>${alarm.startTime}</StartLocalTime>` +
    `<Duration>${alarm.duration}</Duration>` +
    `<Recurrence>${alarm.recurrence}</Recurrence>` +
    `<Enabled>${enabled ? 1 : 0}</Enabled>` +
    `<RoomUUID>${alarm.roomUUID}</RoomUUID>` +
    `<ProgramURI>${xmlEscape(alarm.programURI)}</ProgramURI>` +
    `<ProgramMetaData>${xmlEscape(alarm.programMetaData)}</ProgramMetaData>` +
    `<PlayMode>${alarm.playMode}</PlayMode>` +
    `<Volume>${alarm.volume}</Volume>` +
    `<IncludeLinkedZones>${alarm.includeLinkedZones ? 1 : 0}</IncludeLinkedZones>`;
  await soap(ip, ALARM_PATH, ALARM_NS, 'UpdateAlarm', inner);
}

// ---------- Helpers ----------

export function timesToDuration(start: string, stop: string): string {
  // start/stop = "HH:MM" — geeft duration "HH:MM:SS" terug, wrapping over middernacht
  const [sh, sm] = start.split(':').map((n) => parseInt(n, 10));
  const [eh, em] = stop.split(':').map((n) => parseInt(n, 10));
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60; // wrap
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

export function durationToStop(start: string, duration: string): string {
  const [sh, sm] = start.split(':').map((n) => parseInt(n, 10));
  const [dh, dm] = duration.split(':').map((n) => parseInt(n, 10));
  const total = (sh * 60 + sm + dh * 60 + dm) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function probe(ip: string, timeoutMs = 800): Promise<Speaker | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(baseUrl(ip, '/xml/device_description.xml'), { signal: ctrl.signal });
    if (!res.ok) return null;
    const xml = await res.text();
    if (!/Sonos/i.test(xml)) return null;
    const room = xml.match(/<roomName>([^<]+)<\/roomName>/)?.[1] ?? 'Onbekend';
    const name = xml.match(/<friendlyName>([^<]+)<\/friendlyName>/)?.[1] ?? room;
    const modelName = xml.match(/<modelName>([^<]+)<\/modelName>/)?.[1] ?? '';
    const uuid = xml.match(/<UDN>uuid:(RINCON_[A-F0-9]+)<\/UDN>/i)?.[1];
    return { ip, name, room, modelName, uuid };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function checkSpeaker(ip: string): Promise<Speaker | null> {
  return probe(ip, 1500);
}

const SUBNETS = ['192.168.1', '192.168.0', '192.168.2', '10.0.0', '10.0.1'];

export async function discover(
  onProgress?: (done: number, total: number) => void,
  customSubnet?: string
): Promise<Speaker[]> {
  // In dev: laat de Vite Node-server zelf scannen — veel sneller en kent automatisch
  // de echte subnets van de host (geen guessing).
  if (isDev) {
    const t0 = performance.now();
    console.log(`[sonos] → discover (server-side, subnet=${customSubnet ?? 'auto'})`);
    onProgress?.(0, 1);
    const url = customSubnet ? `/sonos-discover?subnet=${encodeURIComponent(customSubnet)}` : '/sonos-discover';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Discover faalde (${res.status})`);
    const data = (await res.json()) as { subnets: string[]; found: Speaker[] };
    onProgress?.(1, 1);
    const ms = Math.round(performance.now() - t0);
    console.log(`[sonos] ← discover: ${data.found.length} speaker(s) gevonden in ${data.subnets.join(', ')} (${ms}ms)`);
    return data.found;
  }

  // Native: client-side scan via directe HTTP (geen CORS in WebView)
  const subnets = customSubnet ? [customSubnet] : SUBNETS;
  const ips: string[] = [];
  for (const sub of subnets) {
    for (let i = 1; i < 255; i++) ips.push(`${sub}.${i}`);
  }

  const found: Speaker[] = [];
  let done = 0;
  const concurrency = 32;
  let cursor = 0;

  async function worker() {
    while (cursor < ips.length) {
      const idx = cursor++;
      const speaker = await probe(ips[idx], 800);
      if (speaker) found.push(speaker);
      done++;
      onProgress?.(done, ips.length);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return found;
}
