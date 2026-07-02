export type CountryCode = 'NL' | 'BE' | 'UK' | 'DE' | 'INT';

export type Station = {
  name: string;
  url: string;
  country: CountryCode;
};

export type Country = {
  code: CountryCode;
  name: string;
  flag: string;
  order: number;
};

// Registry — display + sorteervolgorde. Aantallen worden afgeleid uit STATIONS.
// Nieuw land toevoegen = hier 1 regel + entries taggen.
export const COUNTRIES: Country[] = [
  { code: 'NL', name: 'Nederland', flag: '🇳🇱', order: 1 },
  { code: 'BE', name: 'België', flag: '🇧🇪', order: 2 },
  { code: 'UK', name: 'UK', flag: '🇬🇧', order: 3 },
  { code: 'DE', name: 'Duitsland', flag: '🇩🇪', order: 4 },
  { code: 'INT', name: 'Internationaal', flag: '🌍', order: 99 },
];

export function countryOf(code: CountryCode): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

// Voorkeur: directe icecast/cdn-stream waar beschikbaar, anders streamtheworld
// `playerservices.streamtheworld.com/api/livestream-redirect/...` (canoniek).
// MP3 boven AAC voor brede Sonos-compatibiliteit. Alle URL's geverifieerd op
// bereikbaarheid + audio content-type (2026-06-22).

export const STATIONS: Station[] = [
  // ---------- NPO ----------
  { name: 'NPO Radio 1', url: 'https://icecast.omroep.nl/radio1-bb-mp3', country: 'NL' },
  { name: 'NPO Radio 2', url: 'https://icecast.omroep.nl/radio2-bb-mp3', country: 'NL' },
  { name: 'NPO Radio 2 Soul & Jazz', url: 'https://icecast.omroep.nl/radio6-bb-mp3', country: 'NL' },
  { name: 'NPO Sterren.nl', url: 'https://icecast.omroep.nl/radio2-sterrennl-mp3', country: 'NL' },
  { name: 'NPO 3FM', url: 'https://icecast.omroep.nl/3fm-bb-mp3', country: 'NL' },
  { name: 'NPO 3FM Campus', url: 'https://icecast.omroep.nl/3fm-serioustalent-mp3', country: 'NL' },
  { name: 'NPO Radio 4', url: 'https://icecast.omroep.nl/radio4-bb-mp3', country: 'NL' },
  { name: 'NPO Radio 5', url: 'https://icecast.omroep.nl/radio5-bb-mp3', country: 'NL' },
  { name: 'NPO Blend', url: 'https://icecast.omroep.nl/npoblend-bb-mp3', country: 'NL' },
  { name: 'NPO FunX', url: 'https://icecast.omroep.nl/funx-bb-mp3', country: 'NL' },

  // ---------- 100% NL ----------
  { name: '100% NL', url: 'https://stream.100p.nl/100pctnl.mp3', country: 'NL' },
  { name: '100% NL Feest', url: 'https://stream.100p.nl/web01_mp3', country: 'NL' },
  { name: '100% NL Liefde', url: 'https://stream.100p.nl/web03_mp3', country: 'NL' },
  { name: '100% NL Nederpop', url: 'https://stream.100p.nl/web04_mp3', country: 'NL' },
  { name: '100% NL Non-Stop', url: 'https://stream.100p.nl/web02_mp3', country: 'NL' },
  // 100% NL Puur (web06) overgeslagen — identiek aan Veronica Top 1000 Allertijden
  { name: '100% NL Zomer', url: 'https://stream.100p.nl/web05_mp3', country: 'NL' },

  // ---------- 538 ----------
  { name: 'Radio 538', url: 'https://22533.live.streamtheworld.com/RADIO538.mp3', country: 'NL' },
  { name: '538 Classics', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR08.mp3', country: 'NL' },
  { name: '538 Dance Dept.', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR01.mp3', country: 'NL' },
  { name: '538 Hitzone', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR11.mp3', country: 'NL' },
  { name: '538 Ibiza', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR19.mp3', country: 'NL' },
  { name: '538 Non-Stop', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR09.mp3', country: 'NL' },
  { name: '538 Party', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR16.mp3', country: 'NL' },
  { name: '538 Top 50', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR13.mp3', country: 'NL' },
  { name: '538 90s Hits', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR21.mp3', country: 'NL' },
  { name: '538 Zomer', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR06.mp3', country: 'NL' },
  { name: '538 Oranje Beat', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR07.mp3', country: 'NL' },

  // ---------- Sky ----------
  { name: 'Sky Radio', url: 'https://19993.live.streamtheworld.com/SKYRADIO.mp3', country: 'NL' },
  { name: 'Sky Hits', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR01.mp3', country: 'NL' },
  { name: 'Sky LoveSongs', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR03.mp3', country: 'NL' },
  { name: 'Sky Non-Stop @ Work', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR24.mp3', country: 'NL' },
  { name: 'Sky Smooth Hits', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR15.mp3', country: 'NL' },
  { name: 'Sky 80s Hits', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR04.mp3', country: 'NL' },
  { name: 'Sky 90s Hits', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR05.mp3', country: 'NL' },
  { name: 'Sky Nice & Easy', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR07.mp3', country: 'NL' },
  { name: 'Sky Christmas', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR08.mp3', country: 'NL' },

  // ---------- Qmusic ----------
  { name: 'Qmusic', url: 'https://stream.qmusic.nl/qmusic/mp3', country: 'NL' },
  { name: 'Q Nederlandstalig', url: 'https://stream.qmusic.nl/nederlandstalig/mp3', country: 'NL' },
  { name: 'Q Foute Uur', url: 'https://stream.qmusic.nl/fouteuur/mp3', country: 'NL' },
  { name: 'Q Non-Stop', url: 'https://stream.qmusic.nl/nonstop/mp3', country: 'NL' },
  { name: 'Q Top 40', url: 'https://stream.qmusic.nl/top40/mp3', country: 'NL' },
  { name: 'Q One World Radio (Tomorrowland)', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/OWR_WORLD_RADIO_NL.mp3', country: 'NL' },

  // ---------- Veronica ----------
  { name: 'Radio Veronica', url: 'https://22533.live.streamtheworld.com/VERONICA.mp3', country: 'NL' },
  { name: 'Veronica Alternative', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR12.mp3', country: 'NL' },
  { name: 'Veronica Vintage', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR09.mp3', country: 'NL' },
  { name: 'Veronica Rockradio', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR11.mp3', country: 'NL' },
  { name: 'Veronica Top 1000 Allertijden', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR10.mp3', country: 'NL' },

  // ---------- Radio 10 ----------
  { name: 'Radio 10', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO10.mp3', country: 'NL' },
  { name: 'Radio 10 60s & 70s', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR18.mp3', country: 'NL' },
  { name: 'Radio 10 80s', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR20.mp3', country: 'NL' },
  { name: 'Radio 10 90s', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR22.mp3', country: 'NL' },
  { name: 'Radio 10 Love Songs', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR04.mp3', country: 'NL' },
  { name: 'Radio 10 Disco Classics', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR23.mp3', country: 'NL' },
  { name: 'Radio 10 Non-Stop', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR15.mp3', country: 'NL' },
  { name: 'Radio 10 Top 4000', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR24.mp3', country: 'NL' },

  // ---------- SLAM! ----------
  { name: 'SLAM!', url: 'https://stream.slam.nl/slam_mp3', country: 'NL' },
  { name: 'Slam! 40', url: 'https://stream.slam.nl/web14_mp3', country: 'NL' },
  { name: 'Slam! 00', url: 'https://stream.slam.nl/web15_mp3', country: 'NL' },
  { name: 'Slam! Hardstyle', url: 'https://stream.slam.nl/web11_mp3', country: 'NL' },
  { name: 'Slam! Housuh In De Pauzuh', url: 'https://stream.slam.nl/web16_mp3', country: 'NL' },
  { name: 'Slam! MixMarathon', url: 'https://stream.slam.nl/web13_mp3', country: 'NL' },
  { name: 'Slam! Non-Stop', url: 'https://stream.slam.nl/web10_mp3', country: 'NL' },
  { name: 'Slam! Summer', url: 'https://stream.slam.nl/web08_mp3', country: 'NL' },
  { name: 'Slam! The Boom Room', url: 'https://stream.slam.nl/web12_mp3', country: 'NL' },
  { name: 'Slam! Juize', url: 'https://stream.slam.nl/web09_mp3', country: 'NL' },

  // ---------- KINK ----------
  { name: 'KINK', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KINK.mp3', country: 'NL' },
  { name: 'KINK Distortion', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KINK_DISTORTION.mp3', country: 'NL' },
  { name: 'KINK 80s', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KINK_DNA.mp3', country: 'NL' },
  { name: 'KINK 90s', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KINK_90S.mp3', country: 'NL' },

  // ---------- Sublime ----------
  { name: 'Sublime', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SUBLIME.mp3', country: 'NL' },
  { name: 'Sublime Jazz', url: 'https://stream.sublime.nl/web21_mp3', country: 'NL' },
  { name: 'Sublime Soul Classics', url: 'https://stream.sublime.nl/web22_mp3', country: 'NL' },
  { name: 'Sublime R&B 90s & 00s', url: 'https://stream.sublime.nl/web20_mp3', country: 'NL' },
  { name: 'Sublime Sunday Chill', url: 'https://stream.sublime.nl/web23_mp3', country: 'NL' },

  // ---------- Pinguin ----------
  { name: 'Pinguin Indie', url: 'https://streams.pinguinradio.com/PinguinRadio192.mp3', country: 'NL' },
  { name: 'Pinguin Classics', url: 'https://streams.pinguinradio.com/PinguinClassics192.mp3', country: 'NL' },
  { name: 'Pinguin On the Rocks', url: 'https://streams.pinguinradio.com/PinguinOnTheRocks192.mp3', country: 'NL' },
  { name: 'Pinguin Aardschok', url: 'https://streams.pinguinradio.com/Aardschok192.mp3', country: 'NL' },

  // ---------- Arrow ----------
  { name: 'Arrow Classic Rock', url: 'https://stream.player.arrow.nl/arrow', country: 'NL' },
  { name: 'Arrow Rock Radio', url: 'https://stream.arrowrockradio.com/arrowrockradio', country: 'NL' },
  { name: 'Arrow Bluesbox', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/ARROWBLUESBOX.mp3', country: 'NL' },
  { name: 'Arrow CAZ!', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/ARROWCAZ.mp3', country: 'NL' },

  // ---------- BNR ----------
  { name: 'BNR Nieuwsradio', url: 'https://stream.bnr.nl/bnr_mp3_128_03', country: 'NL' },
  { name: 'BNR Business Beats', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/BNR_BUSINESS_BEATS.mp3', country: 'NL' },

  // ---------- Joe ----------
  { name: 'Joe 70s, 80s & 90s', url: 'https://stream.joe.nl/joe/mp3', country: 'NL' },

  // ---------- Classic NL ----------
  { name: 'Classic NL', url: 'https://stream.classic.nl/classicnl.mp3', country: 'NL' },
  { name: 'Classic NL Mind', url: 'https://stream.classic.nl/classicnl-mindradio.mp3', country: 'NL' },
  { name: 'Classic NL Opera', url: 'https://stream.classic.nl/classicnl-opera.mp3', country: 'NL' },
  { name: 'Classic NL Soundtracks', url: 'https://stream.classic.nl/classicnl-soundtracks.mp3', country: 'NL' },

  // ---------- Overig commercieel ----------
  { name: '4EVER49 Radio', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/4EVER49.mp3', country: 'NL' },
  { name: 'Cream', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/CREAM.mp3', country: 'NL' },
  { name: 'Jumbo Radio', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/JUMBORADIO.mp3', country: 'NL' },
  { name: 'Kiss FM', url: 'https://stream.kissfm.nl/kissfm', country: 'NL' },
  { name: 'Nora FM', url: 'https://caster05.streampakket.com/proxy/rein1234', country: 'NL' },
  { name: 'Nostalgie', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/NOSTALGIENL.mp3', country: 'NL' },
  { name: 'Radio 972', url: 'https://20133.live.streamtheworld.com/RADIO972.mp3', country: 'NL' },
  { name: 'Radio Noordzee', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR17.mp3', country: 'NL' },
  { name: 'Sunlite', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SUNLITE_MP3.mp3', country: 'NL' },
  { name: 'Yoursafe Radio', url: 'https://streams.radiomast.io/7f5e877e-8c01-4a7b-9435-c8bfd21f25cc', country: 'NL' },
  { name: 'ZTACK', url: 'https://audio.ztack.nl/radio/8000/ztack', country: 'NL' },

  // ---------- Themaradio ----------
  { name: 'ALLsportradio', url: 'https://streaming.hofhosting.nl/proxy/allsports_main', country: 'NL' },
  { name: 'GoodLIFE Radio', url: 'https://streaming.hofhosting.nl/proxy/goodlife_main', country: 'NL' },
  { name: 'New Business Radio', url: 'http://2.trafficstream.nl/business_main.mp3', country: 'NL' },
  { name: 'Traffic Radio', url: 'http://2.trafficstream.nl/traffic_main.mp3', country: 'NL' },

  // ---------- België ----------
  { name: 'Studio Brussel', url: 'https://icecast.vrtcdn.be/stubru-high.mp3', country: 'BE' },
  { name: 'StuBru Bruut', url: 'https://icecast.vrtcdn.be/stubru_bruut-high.mp3', country: 'BE' },
  { name: 'StuBru De Tijdloze', url: 'https://icecast.vrtcdn.be/stubru_tijdloze-high.mp3', country: 'BE' },
  { name: 'MNM', url: 'https://icecast.vrtcdn.be/mnm-high.mp3', country: 'BE' },
  { name: 'VRT Radio 1', url: 'https://icecast.vrtcdn.be/radio1-high.mp3', country: 'BE' },
  { name: 'Klara', url: 'https://icecast.vrtcdn.be/klara-high.mp3', country: 'BE' },
  { name: 'Qmusic België', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/QMUSIC.mp3', country: 'BE' },
  { name: 'Joe België', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/JOE.mp3', country: 'BE' },

  // ---------- UK ----------
  { name: 'Capital', url: 'https://media-ssl.musicradio.com/CapitalMP3', country: 'UK' },
  { name: 'Heart', url: 'https://media-ssl.musicradio.com/HeartLondonMP3', country: 'UK' },
  { name: 'Heart 80s', url: 'https://media-ssl.musicradio.com/Heart80s', country: 'UK' },
  { name: 'Classic FM', url: 'https://media-ssl.musicradio.com/ClassicFMMP3', country: 'UK' },
  { name: 'Smooth Radio', url: 'https://media-ssl.musicradio.com/SmoothLondonMP3', country: 'UK' },
  { name: 'Radio X', url: 'https://media-ssl.musicradio.com/RadioXUK', country: 'UK' },
  { name: 'Gold', url: 'https://media-ssl.musicradio.com/GoldMP3', country: 'UK' },
  { name: 'LBC', url: 'https://media-ssl.musicradio.com/LBCLondonMP3', country: 'UK' },
  { name: 'talkSPORT', url: 'https://radio.talksport.com/stream', country: 'UK' },

  // ---------- Duitsland ----------
  { name: '1LIVE', url: 'https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3', country: 'DE' },
  { name: 'WDR 2', url: 'https://wdr-wdr2-rheinland.icecastssl.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3', country: 'DE' },
  { name: 'SWR3', url: 'https://liveradio.swr.de/sw282p3/swr3/play.mp3', country: 'DE' },
  { name: 'NDR 2', url: 'https://icecast.ndr.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3', country: 'DE' },
  { name: 'Bayern 3', url: 'https://dispatcher.rndfnk.com/br/br3/live/mp3/mid', country: 'DE' },
  { name: 'Antenne Bayern', url: 'https://stream.antenne.de/antenne', country: 'DE' },
  { name: 'Rock Antenne', url: 'https://stream.rockantenne.de/rockantenne/stream/mp3', country: 'DE' },
  { name: 'bigFM', url: 'https://streams.bigfm.de/bigfm-deutschland-128-mp3', country: 'DE' },
  { name: 'sunshine live', url: 'https://stream.sunshine-live.de/live/mp3-192', country: 'DE' },
  { name: 'Deutschlandfunk', url: 'https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3', country: 'DE' },

  // ---------- Internationaal ----------
  { name: 'SomaFM Groove Salad', url: 'https://ice1.somafm.com/groovesalad-128-mp3', country: 'INT' },
  { name: 'SomaFM Lush', url: 'https://ice1.somafm.com/lush-128-mp3', country: 'INT' },
  { name: 'SomaFM Drone Zone', url: 'https://ice1.somafm.com/dronezone-128-mp3', country: 'INT' },
  { name: 'SomaFM Indie Pop Rocks', url: 'https://ice1.somafm.com/indiepop-128-mp3', country: 'INT' },
  { name: 'FIP', url: 'https://icecast.radiofrance.fr/fip-midfi.mp3', country: 'INT' },
  { name: 'FIP Jazz', url: 'https://icecast.radiofrance.fr/fipjazz-midfi.mp3', country: 'INT' },
  { name: 'Radio Swiss Jazz', url: 'https://stream.srg-ssr.ch/m/rsj/mp3_128', country: 'INT' },
  { name: 'Radio Swiss Pop', url: 'https://stream.srg-ssr.ch/m/rsp/mp3_128', country: 'INT' },
  { name: 'Radio Paradise', url: 'https://stream.radioparadise.com/mp3-128', country: 'INT' },
  { name: 'Radio Paradise Mellow', url: 'https://stream.radioparadise.com/mellow-128', country: 'INT' },
  { name: 'KEXP Seattle', url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3', country: 'INT' },
  { name: 'Greatest Hits Non-Stop (Scotland)', url: 'https://listen.openstream.co/7465/audio', country: 'INT' },
];
