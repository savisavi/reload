// RELOAD server: serves the built game from dist/ and a small JSON API for accounts, saves and the leaderboard.
// No dependencies — plain Node.js 18+.
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { createStore } from './store.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(root, 'dist');
const PORT = +process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || join(root, 'data');
const SESSION_DAYS = 60, MAX_SAVE = 2 * 1024 * 1024;

const store = createStore(DATA_DIR);
const { db } = store;
console.log('data dir:', DATA_DIR);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };

const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const readBody = (req, limit) => new Promise((ok, fail) => {
  let size = 0; const chunks = [];
  req.on('data', c => { size += c.length; if (size > limit) { fail(Object.assign(new Error('too large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
  req.on('end', () => { try { ok(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { fail(Object.assign(new Error('bad json'), { code: 400 })); } });
  req.on('error', fail);
});
const idOf = login => 'p' + createHash('sha256').update('reload:' + login.trim().toLowerCase()).digest('hex').slice(0, 24);
const hashPw = (pw, salt) => scryptSync(pw, salt, 32).toString('hex');
const LOGIN_RE = /^[\wА-Яа-яЁё\-]{3,16}$/u;

// brute-force brake: 10 failed logins per IP per 10 minutes
const fails = new Map();
const tooMany = ip => { const f = fails.get(ip); return f && f.n >= 10 && Date.now() - f.t < 600000; };
const noteFail = ip => { const f = fails.get(ip); if (!f || Date.now() - f.t > 600000) fails.set(ip, { n: 1, t: Date.now() }); else f.n++; };

function userFromToken(req) {
  const m = /^Bearer (\w{20,})$/.exec(req.headers.authorization || ''); if (!m) return null;
  const s = db.sessions[m[1]]; if (!s || s.exp < Date.now()) return null;
  return db.users[s.uid] ? s.uid : null;
}
const cleanStats = s => {
  const n = v => Math.max(0, Math.min(1e12, Math.round(+v || 0)));
  return { mercs: n(s && s.mercs), loot: n(s && s.loot), cash: n(s && s.cash), depth: n(s && s.depth) };
};

async function api(req, res, path) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (path === 'health') return send(res, 200, { ok: true, reload: 1 });

  if (path === 'auth' && req.method === 'POST') {
    if (tooMany(ip)) return send(res, 429, { error: 'Слишком много попыток — подождите 10 минут' });
    const { login = '', password = '' } = await readBody(req, 4096);
    const L = String(login).trim(), P = String(password);
    if (!LOGIN_RE.test(L)) return send(res, 400, { error: 'Логин: 3–16 букв, цифр, _ или -' });
    if (P.length < 4 || P.length > 100) return send(res, 400, { error: 'Пароль: от 4 символов' });
    const id = idOf(L); let u = db.users[id], created = false;
    if (u) {
      const ok = timingSafeEqual(Buffer.from(hashPw(P, u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
      if (!ok) { noteFail(ip); return send(res, 401, { error: `Неверный пароль для «${u.login}»` }); }
    } else {
      const salt = randomBytes(16).toString('hex');
      u = db.users[id] = { login: L, salt, hash: hashPw(P, salt), stats: cleanStats({ mercs: 1, depth: 1 }), created: Date.now(), t: Date.now() };
      created = true;
    }
    const token = randomBytes(24).toString('hex');
    db.sessions[token] = { uid: id, exp: Date.now() + SESSION_DAYS * 864e5 };
    for (const [k, s] of Object.entries(db.sessions)) if (s.exp < Date.now()) delete db.sessions[k];
    store.persist();
    return send(res, 200, { token, id, login: u.login, created, save: await store.readSave(id) });
  }

  if (path === 'save') {
    const uid = userFromToken(req); if (!uid) return send(res, 401, { error: 'Нужно войти заново' });
    if (req.method === 'GET') return send(res, 200, (await store.readSave(uid)) || {});
    if (req.method === 'PUT') {
      const body = await readBody(req, MAX_SAVE + 4096);
      if (typeof body.data === 'string' && body.data.length <= MAX_SAVE) await store.writeSave(uid, body.data);
      if (body.stats) { db.users[uid].stats = cleanStats(body.stats); db.users[uid].t = Date.now(); store.persist(); }
      return send(res, 200, { ok: true });
    }
  }

  if (path === 'top' && req.method === 'GET') {
    const list = Object.values(db.users).map(u => ({ login: u.login, stats: u.stats || {} }))
      .sort((a, b) => (b.stats.depth || 0) - (a.stats.depth || 0) || (b.stats.loot || 0) - (a.stats.loot || 0)).slice(0, 200);
    return send(res, 200, list);
  }
  send(res, 404, { error: 'not found' });
}

function serveStatic(req, res, urlPath) {
  let p = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  if (p === '/' || p === '\\') p = '/index.html';
  let file = join(DIST, p);
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  if (!existsSync(file)) { res.writeHead(500); return res.end('dist/ is missing — run "npm run build"'); }
  const ext = extname(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
  createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url.pathname.slice(5).replace(/\/$/, ''));
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    serveStatic(req, res, url.pathname);
  } catch (e) {
    if (!res.headersSent) send(res, e.code === 413 ? 413 : e.code === 400 ? 400 : 500, { error: e.code === 413 ? 'Сохранение слишком большое' : e.code === 400 ? 'Неверный запрос' : 'Ошибка сервера' });
    if (!e.code) console.error(e);
  }
});
server.listen(PORT, () => console.log(`RELOAD is running on http://localhost:${PORT}`));
const bye = () => { store.flush().finally(() => process.exit(0)); };
process.on('SIGTERM', bye); process.on('SIGINT', bye);
