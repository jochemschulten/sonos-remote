import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'node:http';
import os from 'node:os';

type FoundSpeaker = { ip: string; name: string; room: string; modelName: string; uuid?: string };

function probeSonos(ip: string, timeoutMs = 400): Promise<FoundSpeaker | null> {
  return new Promise((resolve) => {
    const req = http.get(
      { host: ip, port: 1400, path: '/xml/device_description.xml', timeout: timeoutMs },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const xml = Buffer.concat(chunks).toString('utf8');
          if (!/Sonos/i.test(xml)) {
            resolve(null);
            return;
          }
          const room = xml.match(/<roomName>([^<]+)<\/roomName>/)?.[1] ?? 'Onbekend';
          const name = xml.match(/<friendlyName>([^<]+)<\/friendlyName>/)?.[1] ?? room;
          const modelName = xml.match(/<modelName>([^<]+)<\/modelName>/)?.[1] ?? '';
          const uuid = xml.match(/<UDN>uuid:(RINCON_[A-F0-9]+)<\/UDN>/i)?.[1];
          resolve({ ip, name, room, modelName, uuid });
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function localSubnets(): string[] {
  const ifaces = os.networkInterfaces();
  const subs = new Set<string>();
  for (const list of Object.values(ifaces)) {
    if (!list) continue;
    for (const iface of list) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Sla CGNAT (Tailscale 100.64.0.0/10) over — Sonos zit nooit op die range
        const first = parseInt(iface.address.split('.')[0], 10);
        const second = parseInt(iface.address.split('.')[1], 10);
        if (first === 100 && second >= 64 && second <= 127) continue;
        const parts = iface.address.split('.');
        subs.add(parts.slice(0, 3).join('.'));
      }
    }
  }
  return Array.from(subs);
}

async function scanSubnets(subnets: string[], concurrency = 128): Promise<FoundSpeaker[]> {
  const ips: string[] = [];
  for (const sub of subnets) for (let i = 1; i < 255; i++) ips.push(`${sub}.${i}`);
  const found: FoundSpeaker[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < ips.length) {
      const idx = cursor++;
      const sp = await probeSonos(ips[idx]);
      if (sp) found.push(sp);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return found;
}

function sonosDevPlugin(): Plugin {
  return {
    name: 'sonos-dev',
    configureServer(server) {
      // Server-side discovery — much faster than going through proxy from the browser
      server.middlewares.use('/sonos-discover', async (req, res) => {
        const t0 = Date.now();
        try {
          const url = new URL(req.url || '', 'http://localhost');
          const customSubnet = url.searchParams.get('subnet');
          const subnets = customSubnet ? [customSubnet] : localSubnets();
          console.log(`[sonos-dev] discover start — subnets: ${subnets.join(', ')}`);
          const found = await scanSubnets(subnets);
          console.log(
            `[sonos-dev] discover done — ${found.length} speaker(s) in ${Date.now() - t0}ms: ${found
              .map((s) => `${s.room}@${s.ip}`)
              .join(', ') || '(none)'}`
          );
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ subnets, found }));
        } catch (e) {
          console.error(`[sonos-dev] discover error`, e);
          res.statusCode = 500;
          res.end(`Discover error: ${(e as Error).message}`);
        }
      });

      // SOAP / per-IP proxy for Play/Stop/Volume control from the browser
      server.middlewares.use('/sonos-proxy', (req, res) => {
        const url = req.url || '';
        const match = url.match(/^\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(\/.*)$/);
        if (!match) {
          res.statusCode = 400;
          res.end('Bad proxy URL');
          return;
        }
        const [, ip, path] = match;
        const action = (req.headers['soapaction'] || '')
          .toString()
          .replace(/^.*#/, '')
          .replace(/"/g, '');
        console.log(`[sonos-dev] proxy ${req.method} ${ip}${path}${action ? ` (${action})` : ''}`);

        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          const body = Buffer.concat(chunks);
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string') headers[k] = v;
            else if (Array.isArray(v)) headers[k] = v.join(', ');
          }
          headers.host = `${ip}:1400`;
          if (body.length) headers['content-length'] = String(body.length);

          const proxyReq = http.request(
            { host: ip, port: 1400, path, method: req.method, headers, timeout: 2000 },
            (proxyRes) => {
              res.statusCode = proxyRes.statusCode || 500;
              for (const [k, v] of Object.entries(proxyRes.headers)) {
                if (v !== undefined) res.setHeader(k, v as string | string[]);
              }
              res.setHeader('Access-Control-Allow-Origin', '*');
              proxyRes.pipe(res);
            }
          );
          proxyReq.on('error', () => {
            if (!res.headersSent) {
              res.statusCode = 502;
              res.end('Proxy error');
            }
          });
          proxyReq.on('timeout', () => proxyReq.destroy());
          if (body.length) proxyReq.write(body);
          proxyReq.end();
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), sonosDevPlugin()],
  server: {
    host: true,
    port: 5173
  }
});
