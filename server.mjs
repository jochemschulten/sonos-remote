import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT ?? '4173', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

// ----------- Sonos discovery & proxy ------------

function probeSonos(ip, timeoutMs = 400) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: ip, port: 1400, path: '/xml/device_description.xml', timeout: timeoutMs },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const xml = Buffer.concat(chunks).toString('utf8');
          if (!/Sonos/i.test(xml)) return resolve(null);
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

function localSubnets() {
  const ifaces = os.networkInterfaces();
  const subs = new Set();
  for (const list of Object.values(ifaces)) {
    if (!list) continue;
    for (const iface of list) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const [a, b] = iface.address.split('.').map((n) => parseInt(n, 10));
        if (a === 100 && b >= 64 && b <= 127) continue; // skip Tailscale CGNAT
        subs.add(iface.address.split('.').slice(0, 3).join('.'));
      }
    }
  }
  return Array.from(subs);
}

async function scanSubnets(subnets, concurrency = 128) {
  const ips = [];
  for (const sub of subnets) for (let i = 1; i < 255; i++) ips.push(`${sub}.${i}`);
  const found = [];
  let cursor = 0;
  async function worker() {
    while (cursor < ips.length) {
      const sp = await probeSonos(ips[cursor++]);
      if (sp) found.push(sp);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return found;
}

async function handleDiscover(req, res) {
  const t0 = Date.now();
  try {
    const url = new URL(req.url, 'http://localhost');
    const customSubnet = url.searchParams.get('subnet');
    const subnets = customSubnet ? [customSubnet] : localSubnets();
    console.log(`[server] discover start — ${subnets.join(', ')}`);
    const found = await scanSubnets(subnets);
    console.log(
      `[server] discover done — ${found.length} speaker(s) in ${Date.now() - t0}ms: ${
        found.map((s) => `${s.room}@${s.ip}`).join(', ') || '(none)'
      }`
    );
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ subnets, found }));
  } catch (e) {
    console.error('[server] discover error', e);
    res.statusCode = 500;
    res.end(`Discover error: ${e.message}`);
  }
}

function handleProxy(req, res) {
  const url = req.url.replace(/^\/sonos-proxy/, '');
  const match = url.match(/^\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(\/.*)$/);
  if (!match) {
    res.statusCode = 400;
    res.end('Bad proxy URL');
    return;
  }
  const [, ip, soapPath] = match;
  const action = (req.headers['soapaction'] || '').toString().replace(/^.*#/, '').replace(/"/g, '');
  console.log(`[server] proxy ${req.method} ${ip}${soapPath}${action ? ` (${action})` : ''}`);

  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string') headers[k] = v;
      else if (Array.isArray(v)) headers[k] = v.join(', ');
    }
    headers.host = `${ip}:1400`;
    if (body.length) headers['content-length'] = String(body.length);

    const proxyReq = http.request(
      { host: ip, port: 1400, path: soapPath, method: req.method, headers, timeout: 2000 },
      (proxyRes) => {
        res.statusCode = proxyRes.statusCode || 500;
        for (const [k, v] of Object.entries(proxyRes.headers)) {
          if (v !== undefined) res.setHeader(k, v);
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
}

// ----------- Static SPA ------------

async function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(DIST, urlPath);

  // Path traversal guard
  if (!filePath.startsWith(DIST)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    res.setHeader('Content-Type', MIME[path.extname(filePath)] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
    res.end(data);
  } catch {
    // SPA fallback — alle onbekende paths terug naar index.html
    try {
      const data = await fs.readFile(path.join(DIST, 'index.html'));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end('Not found (build dist/ first: npm run build)');
    }
  }
}

// ----------- Server ------------

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';
  if (url.startsWith('/sonos-discover')) return handleDiscover(req, res);
  if (url.startsWith('/sonos-proxy/')) return handleProxy(req, res);
  return serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  const ifaces = os.networkInterfaces();
  console.log(`\n  Sonos Radio — productie-server\n`);
  console.log(`  ➜  Local:    http://localhost:${PORT}/`);
  for (const [, list] of Object.entries(ifaces)) {
    if (!list) continue;
    for (const i of list) {
      if (i.family === 'IPv4' && !i.internal) {
        const [a, b] = i.address.split('.').map((n) => parseInt(n, 10));
        const tail = a === 100 && b >= 64 && b <= 127 ? ' (Tailscale)' : '';
        console.log(`  ➜  Network:  http://${i.address}:${PORT}/${tail}`);
      }
    }
  }
  console.log(`\n  Stop met Ctrl+C\n`);
});
