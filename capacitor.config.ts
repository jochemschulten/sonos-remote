import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.schultenmedia.sonosradio',
  appName: 'SonoRadio',
  webDir: 'dist',
  server: {
    // http (niet https) zodat de WebView-origin http://localhost is en directe
    // calls naar http://<sonos-ip>:1400 geen "mixed content" zijn (anders blokkeert
    // Chromium alle Sonos-requests). localhost blijft een secure context -> SW werkt.
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    // Routeert window.fetch via native HTTP -> geen CORS/mixed-content meer.
    // Nodig omdat de Sonos geen CORS-headers stuurt en de WebView die wel handhaaft.
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
