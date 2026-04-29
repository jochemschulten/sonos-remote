import { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
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
  IonChip,
  IonSearchbar,
  IonPopover,
  IonRadioGroup,
  IonRadio
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
  chevronDown,
  create as editIcon
} from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';

import { STATIONS, Station } from './stations';
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
  const [browseAll, setBrowseAll] = useState(false);
  const [speakerPopoverOpen, setSpeakerPopoverOpen] = useState(false);

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

  // Persist speakers
  useEffect(() => {
    Preferences.set({ key: PREF_SPEAKERS, value: JSON.stringify(speakers) });
  }, [speakers]);

  useEffect(() => {
    if (selectedIp) Preferences.set({ key: PREF_SELECTED, value: selectedIp });
  }, [selectedIp]);

  useEffect(() => {
    Preferences.set({ key: PREF_CUSTOM, value: JSON.stringify(customStations) });
  }, [customStations]);

  useEffect(() => {
    if (hydrated) Preferences.set({ key: PREF_FAVORITES, value: JSON.stringify(favorites) });
  }, [favorites, hydrated]);

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
        customSubnet || undefined
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
    setCustomStations((prev) => [...prev, { name: newStationName.trim(), url: newStationUrl.trim() }]);
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
      if (editingAlarmId) {
        await updateAlarm(selectedIp, editingAlarmId, input);
        setToast(`Alarm bijgewerkt: ${alarmStart} → ${alarmStop}`);
      } else {
        await createAlarm(selectedIp, input);
        setToast(`Alarm aangemaakt: ${alarmStart} → ${alarmStop}`);
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

  const visibleStations: Station[] = (() => {
    const q = search.trim().toLowerCase();
    if (q) {
      // Bij zoeken altijd alle treffers tonen
      return allStations.filter(
        (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
      );
    }
    // Bladeren — toon alles
    if (browseAll || favorites.length === 0) {
      return allStations;
    }
    // Default: alleen favorieten in volgorde van toevoegen
    const byUrl = new Map(allStations.map((s) => [s.url, s]));
    return favorites.map((url) => byUrl.get(url)).filter((s): s is Station => !!s);
  })();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <img src="/icon.svg" alt="" style={{ width: 22, height: 22, borderRadius: 5 }} />
              Sonos Radio
            </span>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton id="speaker-trigger" fill="clear" onClick={() => setSpeakerPopoverOpen(true)}>
              {scanning ? (
                <IonSpinner name="dots" style={{ marginRight: 6 }} />
              ) : (
                <IonIcon icon={alarmIcon} slot="start" style={{ marginRight: 6, opacity: 0.6 }} />
              )}
              <span style={{ fontSize: 14 }}>
                {selectedSpeaker ? selectedSpeaker.room : speakers.length === 0 ? 'Geen speaker' : 'Kies speaker'}
              </span>
              <IonIcon icon={chevronDown} style={{ marginLeft: 4, fontSize: 14 }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
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
        {/* Volume + nu speelt */}
        {selectedIp && (
          <section style={{ marginBottom: 24 }}>
            {nowPlaying && nowPlaying.state !== 'STOPPED' && (
              <div
                style={{
                  background: 'var(--ion-color-light)',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <IonChip color={nowPlaying.state === 'PLAYING' ? 'success' : 'medium'} style={{ margin: 0 }}>
                    <IonLabel>{nowPlaying.state === 'PLAYING' ? 'Speelt' : nowPlaying.state}</IonLabel>
                  </IonChip>
                  {nowPlaying.stationName && (
                    <span style={{ fontWeight: 600 }}>{nowPlaying.stationName}</span>
                  )}
                </div>
                {nowPlaying.streamContent ? (
                  <div style={{ fontSize: 14 }}>{nowPlaying.streamContent}</div>
                ) : nowPlaying.title ? (
                  <div style={{ fontSize: 14 }}>
                    {nowPlaying.artist ? `${nowPlaying.artist} — ` : ''}
                    {nowPlaying.title}
                  </div>
                ) : null}
              </div>
            )}
            <IonItem>
              <IonLabel>Volume</IonLabel>
              <IonNote slot="end">{volume}</IonNote>
            </IonItem>
            <IonRange
              min={0}
              max={100}
              value={volume}
              onIonChange={(e) => handleVolume(e.detail.value as number)}
            />
            <IonButton expand="block" color="medium" onClick={handleStop} disabled={busy || !selectedIp}>
              <IonIcon icon={stop} slot="start" />
              Stop
            </IonButton>
          </section>
        )}

        {/* Stations */}
        <section style={{ marginBottom: 24 }}>
          <h2>Zenders</h2>

          <IonSearchbar
            value={search}
            onIonInput={(e) => setSearch(e.detail.value ?? '')}
            placeholder="Zoek zender..."
            debounce={150}
          />

          {!search && favorites.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 4px' }}>
              <IonNote style={{ fontSize: 12 }}>
                {browseAll ? `Alle zenders (${allStations.length})` : `Favorieten (${favorites.length})`}
              </IonNote>
              <IonButton fill="clear" size="small" onClick={() => setBrowseAll((b) => !b)}>
                {browseAll ? 'Alleen favorieten' : 'Bladeren'}
              </IonButton>
            </div>
          )}

          {!search && favorites.length === 0 && (
            <IonNote style={{ display: 'block', marginBottom: 8 }}>
              Klik het sterretje bij een zender om aan favorieten toe te voegen.
            </IonNote>
          )}

          <IonList>
            {visibleStations.length === 0 && (
              <IonItem>
                <IonLabel>
                  <IonNote>Geen zender gevonden voor "{search}".</IonNote>
                </IonLabel>
              </IonItem>
            )}
            {visibleStations.map((s) => (
              <IonItem key={s.url} button onClick={() => handlePlay(s)} disabled={busy || !selectedIp}>
                <IonIcon icon={play} slot="start" color="primary" />
                <IonLabel>
                  <h3>{s.name}</h3>
                  <p style={{ fontSize: 11, opacity: 0.6 }}>{s.url}</p>
                </IonLabel>
                <IonButton
                  slot="end"
                  fill="clear"
                  color={isFavorite(s.url) ? 'warning' : 'medium'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(s.url);
                  }}
                  aria-label={isFavorite(s.url) ? 'Verwijder uit favorieten' : 'Toevoegen aan favorieten'}
                >
                  <IonIcon icon={isFavorite(s.url) ? star : starOutline} slot="icon-only" />
                </IonButton>
                {customStations.some((c) => c.url === s.url) && (
                  <IonButton
                    slot="end"
                    fill="clear"
                    color="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCustom(s.url);
                    }}
                  >
                    Verwijder
                  </IonButton>
                )}
              </IonItem>
            ))}
          </IonList>

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

        {/* Alarms */}
        {selectedIp && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <IonIcon icon={alarmIcon} />
              <h2 style={{ margin: 0 }}>Alarms</h2>
              <IonButton size="small" fill="clear" onClick={refreshAlarms}>
                <IonIcon icon={refresh} slot="icon-only" />
              </IonButton>
            </div>

            {!selectedSpeaker?.uuid && (
              <IonNote>Speaker UUID onbekend — scan opnieuw om alarms te kunnen instellen.</IonNote>
            )}

            <IonList>
              {alarms.length === 0 && (
                <IonItem>
                  <IonLabel>
                    <IonNote>Nog geen alarms — voeg er één toe hieronder.</IonNote>
                  </IonLabel>
                </IonItem>
              )}
              {alarms.map((a) => {
                const stopLabel = a.duration && a.duration !== '00:00:00'
                  ? durationToStop(a.startTime.slice(0, 5), a.duration.slice(0, 5))
                  : 'door';
                const stationFromUri = a.programMetaData.match(/<dc:title>([^<]+)<\/dc:title>/)?.[1] ?? a.programURI;
                return (
                  <IonItem key={a.id}>
                    <IonLabel>
                      <h3>
                        {a.startTime.slice(0, 5)} → {stopLabel}
                        {!a.enabled && <span style={{ opacity: 0.5 }}> (uit)</span>}
                      </h3>
                      <p>
                        {recurrenceLabel(a.recurrence)} · vol {a.volume} · {stationFromUri}
                      </p>
                    </IonLabel>
                    <IonButton
                      slot="end"
                      fill="clear"
                      color={a.enabled ? 'success' : 'medium'}
                      onClick={() => handleToggleAlarm(a)}
                    >
                      {a.enabled ? 'aan' : 'uit'}
                    </IonButton>
                    <IonButton slot="end" fill="clear" onClick={() => openEditAlarmForm(a)}>
                      <IonIcon icon={editIcon} slot="icon-only" />
                    </IonButton>
                    <IonButton slot="end" fill="clear" color="danger" onClick={() => handleDeleteAlarm(a.id)}>
                      <IonIcon icon={trash} slot="icon-only" />
                    </IonButton>
                  </IonItem>
                );
              })}
            </IonList>

            {!showAlarmForm ? (
              <IonButton
                fill="clear"
                size="small"
                onClick={openCreateAlarmForm}
                disabled={!selectedSpeaker?.uuid}
                style={{ marginTop: 4 }}
              >
                + Alarm toevoegen
              </IonButton>
            ) : (
              <div style={{ marginTop: 8 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{editingAlarmId ? 'Alarm bewerken' : 'Nieuw alarm'}</h3>
                <IonItem>
                  <IonLabel>Zender</IonLabel>
                  <IonSelect
                    value={alarmStationUrl}
                    onIonChange={(e) => setAlarmStationUrl(e.detail.value)}
                    interface="action-sheet"
                  >
                    {allStations.map((s) => (
                      <IonSelectOption key={s.url} value={s.url}>
                        {s.name}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
                <IonItem>
                  <IonLabel>Start</IonLabel>
                  <input
                    type="time"
                    value={alarmStart}
                    onChange={(e) => setAlarmStart(e.target.value)}
                    style={{ marginLeft: 'auto', padding: 6, fontSize: 16 }}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Stop</IonLabel>
                  <input
                    type="time"
                    value={alarmStop}
                    onChange={(e) => setAlarmStop(e.target.value)}
                    style={{ marginLeft: 'auto', padding: 6, fontSize: 16 }}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Herhaling</IonLabel>
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
                </IonItem>
                <IonItem>
                  <IonLabel>Volume</IonLabel>
                  <IonNote slot="end">{alarmVolume}</IonNote>
                </IonItem>
                <IonRange
                  min={0}
                  max={100}
                  value={alarmVolume}
                  onIonChange={(e) => setAlarmVolume(e.detail.value as number)}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
