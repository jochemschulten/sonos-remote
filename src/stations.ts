export type Station = {
  name: string;
  url: string;
};

export const STATIONS: Station[] = [
  { name: 'NPO Radio 1', url: 'https://icecast.omroep.nl/radio1-bb-mp3' },
  { name: 'NPO Radio 2', url: 'https://icecast.omroep.nl/radio2-bb-mp3' },
  { name: 'NPO 3FM', url: 'https://icecast.omroep.nl/3fm-bb-mp3' },
  { name: 'NPO Radio 4', url: 'https://icecast.omroep.nl/radio4-bb-mp3' },
  { name: 'NPO Radio 5', url: 'https://icecast.omroep.nl/radio5-bb-mp3' },
  { name: 'Radio 538', url: 'https://22533.live.streamtheworld.com/RADIO538.mp3' },
  { name: 'Sky Radio', url: 'https://19993.live.streamtheworld.com/SKYRADIO.mp3' },
  { name: 'Qmusic', url: 'https://stream.qmusic.nl/qmusic/mp3' },
  { name: 'Radio Veronica', url: 'https://22533.live.streamtheworld.com/VERONICA.mp3' },
  { name: 'BNR Nieuwsradio', url: 'https://stream.bnr.nl/bnr_mp3_128_03' },
  { name: 'SLAM!', url: 'https://stream.slam.nl/slam_mp3' },
  { name: '100% NL', url: 'https://stream.100p.nl/100pctnl.mp3' },
  { name: 'Greatest Hits Non-Stop (Scotland)', url: 'https://listen.openstream.co/7465/audio' }
];
