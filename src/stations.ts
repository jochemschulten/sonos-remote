export type Station = {
  name: string;
  url: string;
};

// Voorkeur: directe icecast/cdn-stream waar beschikbaar, anders streamtheworld
// `playerservices.streamtheworld.com/api/livestream-redirect/...` (canoniek).
// MP3 boven AAC voor brede Sonos-compatibiliteit.

export const STATIONS: Station[] = [
  // ---------- NPO ----------
  { name: 'NPO Radio 1', url: 'https://icecast.omroep.nl/radio1-bb-mp3' },
  { name: 'NPO Radio 2', url: 'https://icecast.omroep.nl/radio2-bb-mp3' },
  { name: 'NPO Radio 2 Soul & Jazz', url: 'https://icecast.omroep.nl/radio6-bb-mp3' },
  { name: 'NPO Sterren.nl', url: 'https://icecast.omroep.nl/radio2-sterrennl-mp3' },
  { name: 'NPO 3FM', url: 'https://icecast.omroep.nl/3fm-bb-mp3' },
  { name: 'NPO 3FM Campus', url: 'https://icecast.omroep.nl/3fm-serioustalent-mp3' },
  { name: 'NPO Radio 4', url: 'https://icecast.omroep.nl/radio4-bb-mp3' },
  { name: 'NPO Radio 5', url: 'https://icecast.omroep.nl/radio5-bb-mp3' },
  { name: 'NPO Blend', url: 'https://icecast.omroep.nl/npoblend-bb-mp3' },
  { name: 'NPO FunX', url: 'https://icecast.omroep.nl/funx-bb-mp3' },

  // ---------- 100% NL ----------
  { name: '100% NL', url: 'https://stream.100p.nl/100pctnl.mp3' },
  { name: '100% NL Feest', url: 'https://stream.100p.nl/web01_mp3' },
  { name: '100% NL Liefde', url: 'https://stream.100p.nl/web03_mp3' },
  { name: '100% NL Nederpop', url: 'https://stream.100p.nl/web04_mp3' },
  { name: '100% NL Non-Stop', url: 'https://stream.100p.nl/web02_mp3' },
  // 100% NL Puur (web06) overgeslagen — identiek aan Veronica Top 1000 Allertijden
  { name: '100% NL Zomer', url: 'https://stream.100p.nl/web05_mp3' },

  // ---------- 538 ----------
  { name: 'Radio 538', url: 'https://22533.live.streamtheworld.com/RADIO538.mp3' },
  { name: '538 Classics', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR08.mp3' },
  { name: '538 Dance Dept.', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR01.mp3' },
  { name: '538 Hitzone', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR11.mp3' },
  { name: '538 Ibiza', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR19.mp3' },
  { name: '538 Non-Stop', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR09.mp3' },
  { name: '538 Party', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR16.mp3' },
  { name: '538 Top 50', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR13.mp3' },
  { name: '538 90s Hits', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR21.mp3' },
  { name: '538 Zomer', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR06.mp3' },
  { name: '538 Oranje Beat', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR07.mp3' },

  // ---------- Sky ----------
  { name: 'Sky Radio', url: 'https://19993.live.streamtheworld.com/SKYRADIO.mp3' },
  { name: 'Sky Hits', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR01.mp3' },
  { name: 'Sky LoveSongs', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR03.mp3' },
  { name: 'Sky Non-Stop @ Work', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR24.mp3' },
  { name: 'Sky Smooth Hits', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR15.mp3' },
  { name: 'Sky 80s Hits', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR04.mp3' },
  { name: 'Sky 90s Hits', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR05.mp3' },
  { name: 'Sky Nice & Easy', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR07.mp3' },
  { name: 'Sky Christmas', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR08.mp3' },

  // ---------- Qmusic ----------
  { name: 'Qmusic', url: 'https://stream.qmusic.nl/qmusic/mp3' },
  { name: 'Q Nederlandstalig', url: 'https://stream.qmusic.nl/nederlandstalig/mp3' },
  { name: 'Q Foute Uur', url: 'https://stream.qmusic.nl/fouteuur/mp3' },
  { name: 'Q Non-Stop', url: 'https://stream.qmusic.nl/nonstop/mp3' },
  { name: 'Q Top 40', url: 'https://stream.qmusic.nl/top40/mp3' },
  { name: 'Q One World Radio (Tomorrowland)', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/OWR_WORLD_RADIO_NL.mp3' },

  // ---------- Veronica ----------
  { name: 'Radio Veronica', url: 'https://22533.live.streamtheworld.com/VERONICA.mp3' },
  { name: 'Veronica Alternative', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR12.mp3' },
  { name: 'Veronica Vintage', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR09.mp3' },
  { name: 'Veronica Rockradio', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR11.mp3' },
  { name: 'Veronica Top 1000 Allertijden', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SRGSTR10.mp3' },

  // ---------- Radio 10 ----------
  { name: 'Radio 10', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO10.mp3' },
  { name: 'Radio 10 60s & 70s', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR18.mp3' },
  { name: 'Radio 10 80s', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR20.mp3' },
  { name: 'Radio 10 90s', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR22.mp3' },
  { name: 'Radio 10 Love Songs', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR04.mp3' },
  { name: 'Radio 10 Disco Classics', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR23.mp3' },
  { name: 'Radio 10 Non-Stop', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR15.mp3' },
  { name: 'Radio 10 Top 4000', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR24.mp3' },

  // ---------- SLAM! ----------
  { name: 'SLAM!', url: 'https://stream.slam.nl/slam_mp3' },
  { name: 'Slam! 40', url: 'https://stream.slam.nl/web14_mp3' },
  { name: 'Slam! 00', url: 'https://stream.slam.nl/web15_mp3' },
  { name: 'Slam! Hardstyle', url: 'https://stream.slam.nl/web11_mp3' },
  { name: 'Slam! Housuh In De Pauzuh', url: 'https://stream.slam.nl/web16_mp3' },
  { name: 'Slam! MixMarathon', url: 'https://stream.slam.nl/web13_mp3' },
  { name: 'Slam! Non-Stop', url: 'https://stream.slam.nl/web10_mp3' },
  { name: 'Slam! Summer', url: 'https://stream.slam.nl/web08_mp3' },
  { name: 'Slam! The Boom Room', url: 'https://stream.slam.nl/web12_mp3' },
  { name: 'Slam! Juize', url: 'https://stream.slam.nl/web09_mp3' },

  // ---------- KINK ----------
  { name: 'KINK', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KINK.mp3' },
  { name: 'KINK Distortion', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KINK_DISTORTION.mp3' },
  { name: 'KINK 80s', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KINK_DNA.mp3' },
  { name: 'KINK 90s', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KINK_90S.mp3' },

  // ---------- Sublime ----------
  { name: 'Sublime', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SUBLIME.mp3' },
  { name: 'Sublime Jazz', url: 'https://stream.sublime.nl/web21_mp3' },
  { name: 'Sublime Soul Classics', url: 'https://stream.sublime.nl/web22_mp3' },
  { name: 'Sublime R&B 90s & 00s', url: 'https://stream.sublime.nl/web20_mp3' },
  { name: 'Sublime Sunday Chill', url: 'https://stream.sublime.nl/web23_mp3' },

  // ---------- Pinguin ----------
  { name: 'Pinguin Indie', url: 'https://streams.pinguinradio.com/PinguinRadio192.mp3' },
  { name: 'Pinguin Classics', url: 'https://streams.pinguinradio.com/PinguinClassics192.mp3' },
  { name: 'Pinguin On the Rocks', url: 'https://streams.pinguinradio.com/PinguinOnTheRocks192.mp3' },
  { name: 'Pinguin Aardschok', url: 'https://streams.pinguinradio.com/Aardschok192.mp3' },

  // ---------- Arrow ----------
  { name: 'Arrow Classic Rock', url: 'https://stream.player.arrow.nl/arrow' },
  { name: 'Arrow Rock Radio', url: 'https://stream.arrowrockradio.com/arrowrockradio' },
  { name: 'Arrow Bluesbox', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/ARROWBLUESBOX.mp3' },
  { name: 'Arrow CAZ!', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/ARROWCAZ.mp3' },

  // ---------- BNR ----------
  { name: 'BNR Nieuwsradio', url: 'https://stream.bnr.nl/bnr_mp3_128_03' },
  { name: 'BNR Business Beats', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/BNR_BUSINESS_BEATS.mp3' },

  // ---------- Joe ----------
  { name: 'Joe 70s, 80s & 90s', url: 'https://stream.joe.nl/joe/mp3' },

  // ---------- Classic NL ----------
  { name: 'Classic NL', url: 'https://stream.classic.nl/classicnl.mp3' },
  { name: 'Classic NL Mind', url: 'https://stream.classic.nl/classicnl-mindradio.mp3' },
  { name: 'Classic NL Opera', url: 'https://stream.classic.nl/classicnl-opera.mp3' },
  { name: 'Classic NL Soundtracks', url: 'https://stream.classic.nl/classicnl-soundtracks.mp3' },

  // ---------- Overig commercieel ----------
  { name: '4EVER49 Radio', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/4EVER49.mp3' },
  { name: 'Cream', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/CREAM.mp3' },
  { name: 'Jumbo Radio', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/JUMBORADIO.mp3' },
  { name: 'Kiss FM', url: 'https://stream.kissfm.nl/kissfm' },
  { name: 'Nora FM', url: 'https://caster05.streampakket.com/proxy/rein1234' },
  { name: 'Nostalgie', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/NOSTALGIENL.mp3' },
  { name: 'Radio 972', url: 'https://20133.live.streamtheworld.com/RADIO972.mp3' },
  { name: 'Radio Noordzee', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR17.mp3' },
  { name: 'Sunlite', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SUNLITE_MP3.mp3' },
  { name: 'Yoursafe Radio', url: 'https://streams.radiomast.io/7f5e877e-8c01-4a7b-9435-c8bfd21f25cc' },
  { name: 'ZTACK', url: 'https://audio.ztack.nl/radio/8000/ztack' },

  // ---------- Themaradio ----------
  { name: 'ALLsportradio', url: 'https://streaming.hofhosting.nl/proxy/allsports_main' },
  { name: 'GoodLIFE Radio', url: 'https://streaming.hofhosting.nl/proxy/goodlife_main' },
  { name: 'New Business Radio', url: 'http://2.trafficstream.nl/business_main.mp3' },
  { name: 'Traffic Radio', url: 'http://2.trafficstream.nl/traffic_main.mp3' },

  // ---------- Internationaal ----------
  { name: 'Greatest Hits Non-Stop (Scotland)', url: 'https://listen.openstream.co/7465/audio' }
];
