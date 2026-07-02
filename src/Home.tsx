import { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonRange,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonSpinner,
  IonToast,
  IonButtons,
  IonSearchbar,
  IonPopover,
  IonRadioGroup,
  IonRadio,
  IonTabBar,
  IonTabButton
} from '@ionic/react';
import {
  play,
  stop,
  refresh,
  addCircleOutline,
  star,
  starOutline,
  alarm as alarmIcon,
  trash,
  create as editIcon,
  radio as radioIcon,
  playCircle,
  volumeHigh,
  chevronBack
} from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';

import { STATIONS, Station, COUNTRIES, countryOf, CountryCode } from './stations';
import {
  Speaker,
  NowPlaying,
  Alarm,
  Recurrence,
  discover,
  checkSpeaker,
  playRadio,
  stop as sonosStop,
  setVolume as sonosSetVolume,
  getVolume as sonosGetVolume,
  getNowPlaying,
  listAlarms,
  createAlarm,
  updateAlarm,
  deleteAlarm,
  setAlarmEnabled,
  timesToDuration,
  durationToStop
} from './sonos';

const PREF_SPEAKERS = 'speakers';
const PREF_SELECTED = 'selectedIp';
const PREF_CUSTOM = 'customStations';
const PREF_FAVORITES = 'favoriteUrls';
const PREF_VIEW = 'browseView';
const PREF_RECENT = 'recentUrls';
const RECENT_MAX = 5;

// Welke "map" toont de Zenders-tab. 'picker' = landenlijst, anders een
// landcode of de virtuele groepen 'fav' / 'recent'.
type BrowseView = 'picker' | 'fav' | 'recent' | CountryCode;

type CustomStation = Station;

export default function Home() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [manualIp, setManualIp] = useState('');
  const [customSubnet, setCustomSubnet] = useState('');
  const [volume, setVolumeState] = useState(20);
  const [busy, setBusy] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [customStations, setCustomStations] = useState<CustomStation[]>([]);
  const [newStationName, setNewStationName] = useState('');
  const [newStationUrl, setNewStationUrl] = useState('');
  const [toast, setToast] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);
  const autoScanned = useRef(false);
  const [showAddSpeaker, setShowAddSpeaker] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showAddStation, setShowAddStation] = useState(false);
  const [view, setView] = useState<BrowseView>('picker');
  const [recent, setRecent] = useState<string[]>([]);
  const [speakerPopoverOpen, setSpeakerPopoverOpen] = useState(false);
  const [tab, setTab] = useState<'now' | 'browse' | 'alarms'>('now');
  const [lastStation, setLastStation] = useState<Station | null>(null);

  // Alarms
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [alarmStationUrl, setAlarmStationUrl] = useState<string>('');
  const [alarmStart, setAlarmStart] = useState('07:30');
  const [alarmStop, setAlarmStop] = useState('08:00');
  const [alarmRecurrence, setAlarmRecurrence] = useState<Recurrence>('DAILY');
  const [alarmVolume, setAlarmVolume] = useState(20);

  // Load persisted state
  useEffect(() => {
    (async () => {
      const sp = await Preferences.get({ key: PREF_SPEAKERS });
      if (sp.value) setSpeakers(JSON.parse(sp.value));
      const sel = await Preferences.get({ key: PREF_SELECTED });
      if (sel.value) setSelectedIp(sel.value);
      const cs = await Preferences.get({ key: PREF_CUSTOM });
      if (cs.value) setCustomStations(JSON.parse(cs.value));
      const fav = await Preferences.get({ key: PREF_FAVORITES });
      if (fav.value) setFavorites(JSON.parse(fav.value));
      const rc = await Preferences.get({ key: PREF_RECENT });
      if (rc.value) setRecent(JSON.parse(rc.value));
      const vw = await Preferences.get({ key: PREF_VIEW });
      if (vw.value) setView(vw.value as BrowseView);
      setHydrated(true);
    })();
  }, []);

  // Auto-scan on first load if no speakers known yet
  useEffect(() => {
    if (!hydrated || autoScanned.current) return;
    if (speakers.length === 0) {
      autoScanned.current = true;
      handleScan();
    }
  }, [hydrated, speakers.length]);

  // Persist speakers — pas na hydratie, anders overschrijft de initiële lege
  // state de opgeslagen lijst vóór de load-effect 'm gelezen heeft.
  useEffect(() => {
    if (hydrated) Preferences.set({ key: PREF_SPEAKERS, value: JSON.stringify(speakers) });
  }, [speakers, hydrated]);

  useEffect(() => {
    if (selectedIp) Preferences.set({ key: PREF_SELECTED, value: selectedIp });
  }, [selectedIp]);

  useEffect(() => {
    if (hydrated) Preferences.set({ key: PREF_CUSTOM, value: JSON.stringify(customStations) });
  }, [customStations, hydrated]);

  useEffect(() => {
    if (hydrated) Preferences.set({ key: PREF_FAVORITES, value: JSON.stringify(favorites) });
  }, [favorites, hydrated]);

  useEffect(() => {
    if (hydrated) Preferences.set({ key: PREF_RECENT, value: JSON.stringify(recent) });
  }, [recent, hydrated]);

  useEffect(() => {
    if (hydrated) Preferences.set({ key: PREF_VIEW, value: view });
  }, [view, hydrated]);

  // Sync volume when speaker changes
  useEffect(() => {
    if (!selectedIp) return;
    sonosGetVolume(selectedIp).then(setVolumeState).catch(() => {});
  }, [selectedIp]);

  // Re-probe geselecteerde speaker wanneer UUID ontbreekt (oude opslag voor schemawijziging)
  useEffect(() => {
    if (!hydrated || !selectedIp) return;
    const sp = speakers.find((s) => s.ip === selectedIp);
    if (sp && !sp.uuid) {
      checkSpeaker(selectedIp).then((updated) => {
        if (updated) setSpeakers((prev) => mergeSpeakers(prev, [updated]));
      });
    }
  }, [hydrated, selectedIp, speakers]);

  // Load alarms when speaker changes
  useEffect(() => {
    if (!selectedIp) {
      setAlarms([]);
      return;
    }
    listAlarms(selectedIp).then(setAlarms).catch(() => setAlarms([]));
  }, [selectedIp]);

  // Poll now-playing every 5s while a speaker is selected
  useEffect(() => {
    if (!selectedIp) {
      setNowPlaying(null);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const np = await getNowPlaying(selectedIp);
        if (!cancelled) setNowPlaying(np);
      } catch {
        // negeer netwerkfouten tijdens polling
      }
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [selectedIp]);

  async function handleScan() {
    setScanning(true);
    setScanProgress(0);
    try {
      const found = await discover(
        (done, total) => setScanProgress(Math.round((done / total) * 100)),
        customSubnet || undefined,
        (sp) => {
          // Toon de speaker meteen + selecteer de eerste, zonder op de hele scan te wachten
          setSpeakers((prev) => mergeSpeakers(prev, [sp]));
          setSelectedIp((cur) => cur || sp.ip);
        }
      );
      if (found.length === 0) {
        setToast('Geen Sonos gevonden. Probeer handmatig IP toevoegen.');
      } else {
        setSpeakers((prev) => mergeSpeakers(prev, found));
        if (!selectedIp) setSelectedIp(found[0].ip);
        setToast(`${found.length} speaker(s) gevonden.`);
      }
    } catch (e) {
      setToast(`Scan mislukt: ${(e as Error).message}`);
    } finally {
      setScanning(false);
    }
  }

  async function handleAddManual() {
    if (!manualIp.trim()) return;
    setBusy(true);
    try {
      const sp = await checkSpeaker(manualIp.trim());
      if (sp) {
        setSpeakers((prev) => mergeSpeakers(prev, [sp]));
        if (!selectedIp) setSelectedIp(sp.ip);
        setManualIp('');
        setToast(`Toegevoegd: ${sp.room}`);
      } else {
        setToast('Geen Sonos op dat IP gevonden.');
      }
    } catch (e) {
      setToast(`Fout: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handlePlay(station: Station) {
    if (!selectedIp) {
      setToast('Selecteer eerst een speaker.');
      return;
    }
    setLastStation(station);
    setRecent((prev) => [station.url, ...prev.filter((u) => u !== station.url)].slice(0, RECENT_MAX));
    setBusy(true);
    try {
      await playRadio(selectedIp, station.url, station.name);
      // Direct refreshen voor snelle feedback (anders pas na 5s poll)
      setTimeout(() => getNowPlaying(selectedIp).then(setNowPlaying).catch(() => {}), 800);
    } catch (e) {
      setToast(`Afspelen mislukt: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    if (!selectedIp) return;
    setBusy(true);
    try {
      await sonosStop(selectedIp);
      setNowPlaying((prev) => (prev ? { ...prev, state: 'STOPPED' } : null));
    } catch (e) {
      setToast(`Stop mislukt: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleResume() {
    // Hervat de laatst gespeelde zender (of, als die onbekend is, de zender die de
    // speaker nog geladen heeft); anders stuur de gebruiker naar de zenderlijst.
    const target = lastStation ?? allStations.find((s) => s.name === nowPlaying?.stationName);
    if (!target) {
      setTab('browse');
      return;
    }
    await handlePlay(target);
  }

  async function handleVolume(v: number) {
    setVolumeState(v);
    if (!selectedIp) return;
    try {
      await sonosSetVolume(selectedIp, v);
    } catch {
      // negeer korte fouten tijdens slepen
    }
  }

  function handleAddCustom() {
    if (!newStationName.trim() || !newStationUrl.trim()) return;
    setCustomStations((prev) => [...prev, { name: newStationName.trim(), url: newStationUrl.trim(), country: 'INT' }]);
    setNewStationName('');
    setNewStationUrl('');
  }

  function handleRemoveCustom(url: string) {
    setCustomStations((prev) => prev.filter((s) => s.url !== url));
  }

  function toggleFavorite(url: string) {
    setFavorites((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  }

  // -------- Alarms (op de geselecteerde speaker) --------
  const selectedSpeaker = speakers.find((s) => s.ip === selectedIp);

  async function refreshAlarms() {
    if (!selectedIp) return;
    try {
      setAlarms(await listAlarms(selectedIp));
    } catch (e) {
      setToast(`Alarms ophalen mislukt: ${(e as Error).message}`);
    }
  }

  function openCreateAlarmForm() {
    setEditingAlarmId(null);
    setAlarmStationUrl(favorites[0] ?? allStations[0]?.url ?? '');
    setAlarmStart('07:30');
    setAlarmStop('08:00');
    setAlarmRecurrence('DAILY');
    setAlarmVolume(20);
    setShowAlarmForm(true);
  }

  function openEditAlarmForm(a: Alarm) {
    setEditingAlarmId(a.id);
    // Match programURI (x-rincon-mp3radio://...) terug naar een bekende zender
    const stripped = a.programURI.replace(/^x-rincon-mp3radio:\/\//, '');
    const matched = allStations.find((s) =>
      a.programURI.includes(s.url.replace(/^https?:\/\//, '')) || stripped.includes(s.url.replace(/^https?:\/\//, ''))
    );
    setAlarmStationUrl(matched?.url ?? a.programURI);
    setAlarmStart(a.startTime.slice(0, 5));
    const stopHHMM = a.duration && a.duration !== '00:00:00'
      ? durationToStop(a.startTime.slice(0, 5), a.duration.slice(0, 5))
      : a.startTime.slice(0, 5);
    setAlarmStop(stopHHMM);
    setAlarmRecurrence((a.recurrence as Recurrence) ?? 'DAILY');
    setAlarmVolume(a.volume);
    setShowAlarmForm(true);
  }

  async function handleSaveAlarm() {
    if (!selectedIp || !selectedSpeaker?.uuid) {
      setToast('Speaker UUID onbekend — scan opnieuw.');
      return;
    }
    if (!alarmStationUrl) {
      setToast('Kies een zender voor het alarm.');
      return;
    }
    const station = allStations.find((s) => s.url === alarmStationUrl);
    if (!station) {
      setToast('Zender niet gevonden in lijst.');
      return;
    }
    setBusy(true);
    try {
      const input = {
        startTime: `${alarmStart}:00`,
        duration: timesToDuration(alarmStart, alarmStop),
        recurrence: alarmRecurrence,
        enabled: true,
        roomUUID: selectedSpeaker.uuid,
        streamUrl: station.url,
        stationName: station.name,
        volume: alarmVolume
      };
      console.log(`[alarm] ${editingAlarmId ? 'update' : 'create'} input:`, {
        ...input,
        volume: input.volume,
        startTime: input.startTime,
        duration: input.duration
      });
      if (editingAlarmId) {
        await updateAlarm(selectedIp, editingAlarmId, input);
        setToast(`Alarm bijgewerkt: ${alarmStart} → ${alarmStop} · vol ${input.volume}`);
      } else {
        await createAlarm(selectedIp, input);
        setToast(`Alarm aangemaakt: ${alarmStart} → ${alarmStop} · vol ${input.volume}`);
      }
      await refreshAlarms();
      setShowAlarmForm(false);
      setEditingAlarmId(null);
    } catch (e) {
      setToast(`Alarm opslaan mislukt: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleAlarm(a: Alarm) {
    if (!selectedIp) return;
    try {
      await setAlarmEnabled(selectedIp, a, !a.enabled);
      await refreshAlarms();
    } catch (e) {
      setToast(`Toggle mislukt: ${(e as Error).message}`);
    }
  }

  async function handleDeleteAlarm(id: string) {
    if (!selectedIp) return;
    setBusy(true);
    try {
      await deleteAlarm(selectedIp, id);
      await refreshAlarms();
      setToast('Alarm verwijderd.');
    } catch (e) {
      setToast(`Verwijderen mislukt: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const allStations = [...STATIONS, ...customStations];
  const isFavorite = (url: string) => favorites.includes(url);
  const byUrl = new Map(allStations.map((s) => [s.url, s]));
  const searching = search.trim().length > 0;

  const countByCountry = (code: CountryCode) =>
    allStations.filter((s) => s.country === code).length;

  // Zenders voor de huidige stationlijst (bij zoeken: globaal; anders per view).
  const visibleStations: Station[] = (() => {
    const q = search.trim().toLowerCase();
    if (q) {
      return allStations.filter(
        (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
      );
    }
    if (view === 'fav') {
      return favorites.map((u) => byUrl.get(u)).filter((s): s is Station => !!s);
    }
    if (view === 'recent') {
      return recent.map((u) => byUrl.get(u)).filter((s): s is Station => !!s);
    }
    if (view === 'picker') return [];
    return allStations.filter((s) => s.country === view);
  })();

  // Titel van de huidige (niet-picker) view, voor de terug-balk.
  const viewTitle =
    view === 'fav'
      ? 'Favorieten'
      : view === 'recent'
        ? 'Recent'
        : view === 'picker'
          ? ''
          : `${countryOf(view).flag} ${countryOf(view).name}`;

  // Eén stationrij — herbruikt in picker-views én zoekresultaten.
  const renderStationRow = (s: Station, showFlag = false) => {
    const on = nowPlaying?.state === 'PLAYING' && nowPlaying.stationName === s.name;
    return (
      <div
        key={s.url}
        className={`sr-station-row${on ? ' on' : ''}`}
        onClick={() => !busy && selectedIp && handlePlay(s)}
      >
        <div className="sr-play">
          <IonIcon icon={on ? volumeHigh : play} />
        </div>
        <div className="sr-meta">
          <div className="sr-name">{s.name}</div>
          <div className="sr-url">
            {showFlag && <span style={{ marginRight: 6 }}>{countryOf(s.country).flag}</span>}
            {s.url}
          </div>
        </div>
        <button
          className="sr-fav"
          style={{ color: isFavorite(s.url) ? 'var(--ion-color-primary)' : '#74778b' }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(s.url);
          }}
          aria-label={isFavorite(s.url) ? 'Verwijder uit favorieten' : 'Toevoegen aan favorieten'}
        >
          <IonIcon icon={isFavorite(s.url) ? star : starOutline} />
        </button>
        {customStations.some((c) => c.url === s.url) && (
          <button
            className="sr-fav"
            style={{ color: 'var(--ion-color-danger)' }}
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveCustom(s.url);
            }}
            aria-label="Eigen zender verwijderen"
          >
            <IonIcon icon={trash} />
          </button>
        )}
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <span className="sr-brand">
              <img src="/icon.svg" alt="" />
              SonoRadio
            </span>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton id="speaker-trigger" fill="clear" onClick={() => setSpeakerPopoverOpen(true)} aria-label="Speakers beheren">
              {scanning ? <IonSpinner name="dots" /> : <IonIcon icon={refresh} slot="icon-only" />}
            </IonButton>
          </IonButtons>
        </IonToolbar>

        {/* Kamer-balk — de actieve Sonos is de context voor alles eronder */}
        {speakers.length > 0 && (
          <IonToolbar>
            <div className="sr-rooms">
              {speakers.map((s) => {
                const playingHere = s.ip === selectedIp && !!nowPlaying && nowPlaying.state === 'PLAYING';
                return (
                  <button
                    key={s.ip}
                    className={`sr-room${s.ip === selectedIp ? ' active' : ''}`}
                    onClick={() => setSelectedIp(s.ip)}
                  >
                    {playingHere && <span className="sr-dot" />}
                    {s.room}
                  </button>
                );
              })}
              <button className="sr-room add" onClick={() => setSpeakerPopoverOpen(true)}>
                {scanning ? `Zoeken ${scanProgress}%` : '+'}
              </button>
            </div>
          </IonToolbar>
        )}
      </IonHeader>

      {/* Speaker-popover (rechtsboven) */}
      <IonPopover
        trigger="speaker-trigger"
        isOpen={speakerPopoverOpen}
        onDidDismiss={() => setSpeakerPopoverOpen(false)}
        showBackdrop={true}
        dismissOnSelect={false}
      >
        <IonContent>
          <IonList>
            {speakers.length === 0 && (
              <IonItem>
                <IonLabel>
                  <IonNote>Nog geen speaker — scan je netwerk of voeg een IP toe.</IonNote>
                </IonLabel>
              </IonItem>
            )}
            {speakers.length > 0 && (
              <IonRadioGroup
                value={selectedIp}
                onIonChange={(e) => {
                  setSelectedIp(e.detail.value);
                  setSpeakerPopoverOpen(false);
                }}
              >
                {speakers.map((s) => (
                  <IonItem key={s.ip}>
                    <IonRadio slot="start" value={s.ip} />
                    <IonLabel>
                      <h3>{s.room}</h3>
                      <p style={{ fontSize: 11, opacity: 0.6 }}>
                        {s.ip} · {s.modelName}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonRadioGroup>
            )}

            {scanning && (
              <IonItem>
                <IonSpinner slot="start" />
                <IonLabel>Zoeken… {scanProgress}%</IonLabel>
              </IonItem>
            )}
          </IonList>

          {!showAddSpeaker ? (
            <div style={{ padding: 8 }}>
              <IonButton expand="block" fill="clear" size="small" onClick={() => setShowAddSpeaker(true)}>
                <IonIcon icon={refresh} slot="start" />
                Scannen / IP toevoegen
              </IonButton>
            </div>
          ) : (
            <div style={{ padding: 8 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-end' }}>
                <IonItem style={{ flex: 1 }}>
                  <IonLabel position="stacked">Subnet</IonLabel>
                  <IonInput
                    placeholder="192.168.1"
                    value={customSubnet}
                    onIonInput={(e) => setCustomSubnet(e.detail.value ?? '')}
                  />
                </IonItem>
                <IonButton size="small" onClick={handleScan} disabled={scanning}>
                  Scan
                </IonButton>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                <IonItem style={{ flex: 1 }}>
                  <IonLabel position="stacked">IP</IonLabel>
                  <IonInput
                    placeholder="192.168.1.50"
                    value={manualIp}
                    onIonInput={(e) => setManualIp(e.detail.value ?? '')}
                  />
                </IonItem>
                <IonButton size="small" onClick={handleAddManual} disabled={busy}>
                  Voeg toe
                </IonButton>
              </div>
              <IonButton
                expand="block"
                fill="clear"
                size="small"
                color="medium"
                onClick={() => setShowAddSpeaker(false)}
                style={{ marginTop: 4 }}
              >
                Verbergen
              </IonButton>
            </div>
          )}
        </IonContent>
      </IonPopover>

      <IonContent className="ion-padding">
        {/* ---- Tab: Nu — geen speaker ---- */}
        {tab === 'now' && !selectedIp && (
          <div className="sr-empty">
            <IonIcon icon={radioIcon} className="sr-empty-icon" />
            <p>Nog geen Sonos geselecteerd.</p>
            <IonButton size="small" onClick={() => setSpeakerPopoverOpen(true)}>
              <IonIcon icon={refresh} slot="start" />
              Sonos zoeken
            </IonButton>
          </div>
        )}

        {/* ---- Tab: Nu — now-playing hero + volume + transport ---- */}
        {tab === 'now' && selectedIp && (
          <>
            <div className={`sr-hero${nowPlaying?.state === 'PLAYING' ? ' playing' : ''}`}>
              <div className="sr-hero-glow" />
              {nowPlaying && nowPlaying.state !== 'STOPPED' ? (
                <>
                  <span className={`sr-eyebrow${nowPlaying.state === 'PLAYING' ? '' : ' idle'}`}>
                    {nowPlaying.state === 'PLAYING' && (
                      <span className="sr-eq">
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                    )}
                    {nowPlaying.state === 'PLAYING' ? 'Speelt nu' : 'Gepauzeerd'} · {selectedSpeaker?.room}
                  </span>
                  <h1 className="sr-station">{nowPlaying.stationName ?? 'Radio'}</h1>
                  {(nowPlaying.streamContent || nowPlaying.title) && (
                    <div className="sr-track">
                      {nowPlaying.streamContent
                        ? nowPlaying.streamContent
                        : `${nowPlaying.artist ? nowPlaying.artist + ' — ' : ''}${nowPlaying.title ?? ''}`}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="sr-eyebrow idle">Stil · {selectedSpeaker?.room}</span>
                  <div className="sr-hero-idle">Niets aan het afspelen. Kies een zender om te starten.</div>
                </>
              )}
            </div>

            <div className="sr-card sr-vol-card">
              <div className="sr-vol-top">
                <span className="sr-h2">Volume</span>
                <span className="sr-vol-val">{volume}</span>
              </div>
              <IonRange
                min={0}
                max={100}
                value={volume}
                onIonChange={(e) => handleVolume(e.detail.value as number)}
              />
            </div>

            <div className="sr-transport">
              {nowPlaying?.state === 'PLAYING' ? (
                <IonButton expand="block" fill="solid" className="sr-btn-stop" onClick={handleStop} disabled={busy}>
                  <IonIcon icon={stop} slot="start" />
                  Stop
                </IonButton>
              ) : (
                <IonButton
                  expand="block"
                  onClick={handleResume}
                  disabled={busy || (!lastStation && !nowPlaying?.stationName)}
                >
                  <IonIcon icon={play} slot="start" />
                  Afspelen
                </IonButton>
              )}
              <IonButton expand="block" fill="outline" onClick={() => setTab('browse')}>
                <IonIcon icon={radioIcon} slot="start" />
                Zenders
              </IonButton>
            </div>
          </>
        )}

        {/* ---- Tab: Zenders ---- */}
        {tab === 'browse' && (
        <section style={{ marginBottom: 24 }}>
          <IonSearchbar
            value={search}
            onIonInput={(e) => setSearch(e.detail.value ?? '')}
            placeholder="Zoek zender..."
            debounce={150}
          />

          {/* Zoeken — globaal over alle landen, plat met land-vlag per rij */}
          {searching && (
            <div className="sr-list">
              {visibleStations.length === 0 && (
                <div className="sr-empty">
                  <IonIcon icon={radioIcon} className="sr-empty-icon" />
                  <p>Geen zender gevonden voor "{search}".</p>
                </div>
              )}
              {visibleStations.map((s) => renderStationRow(s, true))}
            </div>
          )}

          {/* Picker — landen + virtuele groepen */}
          {!searching && view === 'picker' && (
            <div className="sr-list">
              {favorites.length > 0 && (
                <button className="sr-country-row" onClick={() => setView('fav')}>
                  <span className="sr-country-flag">★</span>
                  <span className="sr-country-name">Favorieten</span>
                  <span className="sr-country-count">{favorites.length}</span>
                </button>
              )}
              {recent.length > 0 && (
                <button className="sr-country-row" onClick={() => setView('recent')}>
                  <span className="sr-country-flag">↻</span>
                  <span className="sr-country-name">Recent</span>
                  <span className="sr-country-count">{recent.length}</span>
                </button>
              )}
              {COUNTRIES.slice()
                .sort((a, b) => a.order - b.order)
                .filter((c) => countByCountry(c.code) > 0)
                .map((c) => (
                  <button key={c.code} className="sr-country-row" onClick={() => setView(c.code)}>
                    <span className="sr-country-flag">{c.flag}</span>
                    <span className="sr-country-name">{c.name}</span>
                    <span className="sr-country-count">{countByCountry(c.code)}</span>
                  </button>
                ))}
            </div>
          )}

          {/* Stationlijst binnen een view (land / favorieten / recent) */}
          {!searching && view !== 'picker' && (
            <>
              <button className="sr-back-row" onClick={() => setView('picker')}>
                <IonIcon icon={chevronBack} />
                <span>Alle landen</span>
                <span className="sr-back-title">{viewTitle}</span>
              </button>
              <div className="sr-list">
                {visibleStations.length === 0 && (
                  <div className="sr-empty">
                    <IonIcon icon={radioIcon} className="sr-empty-icon" />
                    <p>
                      {view === 'fav'
                        ? 'Nog geen favorieten — tik het sterretje bij een zender.'
                        : view === 'recent'
                          ? 'Nog niets afgespeeld.'
                          : 'Geen zenders.'}
                    </p>
                  </div>
                )}
                {visibleStations.map((s) => renderStationRow(s))}
              </div>
            </>
          )}

          {!showAddStation ? (
            <IonButton
              fill="clear"
              size="small"
              onClick={() => setShowAddStation(true)}
              style={{ marginTop: 4 }}
            >
              + Eigen zender toevoegen
            </IonButton>
          ) : (
            <div style={{ marginTop: 8 }}>
              <IonItem>
                <IonLabel position="stacked">Naam</IonLabel>
                <IonInput
                  placeholder="Mijn radio"
                  value={newStationName}
                  onIonInput={(e) => setNewStationName(e.detail.value ?? '')}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Stream URL</IonLabel>
                <IonInput
                  placeholder="https://..."
                  value={newStationUrl}
                  onIonInput={(e) => setNewStationUrl(e.detail.value ?? '')}
                />
              </IonItem>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <IonButton
                  onClick={() => {
                    handleAddCustom();
                    setShowAddStation(false);
                  }}
                  style={{ flex: 1 }}
                >
                  <IonIcon icon={addCircleOutline} slot="start" />
                  Toevoegen
                </IonButton>
                <IonButton fill="clear" color="medium" onClick={() => setShowAddStation(false)}>
                  Annuleer
                </IonButton>
              </div>
            </div>
          )}
        </section>
        )}

        {/* ---- Tab: Wekker — geen speaker ---- */}
        {tab === 'alarms' && !selectedIp && (
          <div className="sr-empty">
            <IonIcon icon={alarmIcon} className="sr-empty-icon" />
            <p>Selecteer eerst een Sonos.</p>
          </div>
        )}

        {/* ---- Tab: Wekker (alarms op eigen pagina) ---- */}
        {tab === 'alarms' && selectedIp && (
          <section style={{ marginBottom: 24 }}>
            <div className="sr-card-head">
              <IonIcon icon={alarmIcon} color="primary" />
              <h2 className="sr-h2" style={{ flex: 1 }}>Wekkers · {selectedSpeaker?.room}</h2>
              <IonButton size="small" fill="clear" onClick={refreshAlarms}>
                <IonIcon icon={refresh} slot="icon-only" />
              </IonButton>
            </div>

            {!selectedSpeaker?.uuid && (
              <IonNote style={{ display: 'block', marginBottom: 12 }}>
                Speaker-UUID onbekend — scan opnieuw om wekkers te kunnen instellen.
              </IonNote>
            )}

            {alarms.length === 0 && (
              <div className="sr-empty" style={{ padding: '32px 16px' }}>
                <IonIcon icon={alarmIcon} className="sr-empty-icon" />
                <p>Nog geen wekkers. Voeg er één toe hieronder.</p>
              </div>
            )}
            {alarms.map((a) => {
              const stopLabel = a.duration && a.duration !== '00:00:00'
                ? durationToStop(a.startTime.slice(0, 5), a.duration.slice(0, 5))
                : 'door';
              const stationFromUri = a.programMetaData.match(/<dc:title>([^<]+)<\/dc:title>/)?.[1] ?? a.programURI;
              return (
                <div key={a.id} className={`sr-alarm${a.enabled ? '' : ' off'}`}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sr-alarm-time">
                      {a.startTime.slice(0, 5)}{' '}
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#74778b' }}>→ {stopLabel}</span>
                    </div>
                    <div className="sr-alarm-sub">
                      {recurrenceLabel(a.recurrence)} · vol {a.volume} · {stationFromUri}
                    </div>
                  </div>
                  <IonButton fill="clear" size="small" color={a.enabled ? 'success' : 'medium'} onClick={() => handleToggleAlarm(a)}>
                    {a.enabled ? 'aan' : 'uit'}
                  </IonButton>
                  <IonButton fill="clear" size="small" onClick={() => openEditAlarmForm(a)}>
                    <IonIcon icon={editIcon} slot="icon-only" />
                  </IonButton>
                  <IonButton fill="clear" size="small" color="danger" onClick={() => handleDeleteAlarm(a.id)}>
                    <IonIcon icon={trash} slot="icon-only" />
                  </IonButton>
                </div>
              );
            })}

            {!showAlarmForm ? (
              <IonButton
                fill="clear"
                size="small"
                onClick={openCreateAlarmForm}
                disabled={!selectedSpeaker?.uuid}
                style={{ marginTop: 4 }}
              >
                + Wekker toevoegen
              </IonButton>
            ) : (
              <div className="sr-card sr-form" style={{ marginTop: 12 }}>
                <h3 className="sr-form-title">{editingAlarmId ? 'Wekker bewerken' : 'Nieuwe wekker'}</h3>

                <div className="sr-field">
                  <span className="sr-field-label">Zender</span>
                  <div className="sr-select-box">
                    <IonSelect
                      value={alarmStationUrl}
                      onIonChange={(e) => setAlarmStationUrl(e.detail.value)}
                      interface="action-sheet"
                      placeholder="Kies een zender"
                    >
                      {allStations.map((s) => (
                        <IonSelectOption key={s.url} value={s.url}>
                          {s.name}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </div>
                </div>

                <div className="sr-field-row">
                  <label className="sr-field">
                    <span className="sr-field-label">Start</span>
                    <input
                      type="time"
                      className="sr-time"
                      value={alarmStart}
                      onChange={(e) => setAlarmStart(e.target.value)}
                    />
                  </label>
                  <label className="sr-field">
                    <span className="sr-field-label">Stop</span>
                    <input
                      type="time"
                      className="sr-time"
                      value={alarmStop}
                      onChange={(e) => setAlarmStop(e.target.value)}
                    />
                  </label>
                </div>

                <div className="sr-field">
                  <span className="sr-field-label">Herhaling</span>
                  <div className="sr-select-box">
                    <IonSelect
                      value={alarmRecurrence}
                      onIonChange={(e) => setAlarmRecurrence(e.detail.value)}
                      interface="action-sheet"
                    >
                      <IonSelectOption value="DAILY">Dagelijks</IonSelectOption>
                      <IonSelectOption value="WEEKDAYS">Werkdagen (ma-vr)</IonSelectOption>
                      <IonSelectOption value="WEEKENDS">Weekend (za-zo)</IonSelectOption>
                      <IonSelectOption value="ONCE">Eenmalig</IonSelectOption>
                    </IonSelect>
                  </div>
                </div>

                <div className="sr-field">
                  <div className="sr-vol-top">
                    <span className="sr-field-label" style={{ marginBottom: 0 }}>Volume</span>
                    <span className="sr-vol-val">{alarmVolume}</span>
                  </div>
                  <IonRange
                    key={editingAlarmId ?? 'new'}
                    min={0}
                    max={100}
                    value={alarmVolume}
                    onIonInput={(e) => setAlarmVolume(e.detail.value as number)}
                    onIonChange={(e) => setAlarmVolume(e.detail.value as number)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <IonButton onClick={handleSaveAlarm} disabled={busy} style={{ flex: 1 }}>
                    {editingAlarmId ? 'Bijwerken' : 'Opslaan'}
                  </IonButton>
                  <IonButton
                    fill="clear"
                    color="medium"
                    onClick={() => {
                      setShowAlarmForm(false);
                      setEditingAlarmId(null);
                    }}
                  >
                    Annuleer
                  </IonButton>
                </div>
              </div>
            )}
          </section>
        )}

        <IonToast
          isOpen={!!toast}
          message={toast}
          duration={2500}
          onDidDismiss={() => setToast('')}
        />
      </IonContent>

      <IonTabBar slot="bottom">
        <IonTabButton tab="now" selected={tab === 'now'} onClick={() => setTab('now')}>
          <IonIcon icon={playCircle} />
          <IonLabel>Nu</IonLabel>
        </IonTabButton>
        <IonTabButton tab="browse" selected={tab === 'browse'} onClick={() => setTab('browse')}>
          <IonIcon icon={radioIcon} />
          <IonLabel>Zenders</IonLabel>
        </IonTabButton>
        <IonTabButton tab="alarms" selected={tab === 'alarms'} onClick={() => setTab('alarms')}>
          <IonIcon icon={alarmIcon} />
          <IonLabel>Wekker</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonPage>
  );
}

function recurrenceLabel(r: string): string {
  switch (r) {
    case 'DAILY':
      return 'Dagelijks';
    case 'WEEKDAYS':
      return 'Werkdagen';
    case 'WEEKENDS':
      return 'Weekend';
    case 'ONCE':
      return 'Eenmalig';
    default:
      return r;
  }
}

function mergeSpeakers(prev: Speaker[], next: Speaker[]): Speaker[] {
  const map = new Map(prev.map((s) => [s.ip, s]));
  for (const s of next) map.set(s.ip, s);
  return Array.from(map.values()).sort((a, b) => a.room.localeCompare(b.room));
}
