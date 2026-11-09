import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import { SignJWT, jwtVerify } from 'jose';

const app = express();
app.set('trust proxy', 1);
// Vercel rewrites /api/* to this single Express function and passes the original route in __path.
app.use((req, _res, next) => {
  const parsed = new URL(req.url, 'http://localhost');
  const routedPath = parsed.searchParams.get('__path');
  if (routedPath) { parsed.searchParams.delete('__path'); req.url = `/api/${routedPath.replace(/^\/+/, '')}${parsed.search ? parsed.search : ''}`; }
  next();
});
app.use(express.json({ limit: '15mb' }));
const COOKIE = 'wedding_master_session';
const STATE_COOKIE = 'wedding_oauth_state';
const redis = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN wajib diisi.');
  return new Redis({ url, token });
};
const secret = () => {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET wajib diisi minimal 32 karakter.');
  return new TextEncoder().encode(value);
};
const secureCookie = process.env.NODE_ENV === 'production';
const cookie = (name: string, value: string, maxAge: number) => `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secureCookie ? '; Secure' : ''}`;
const clearCookie = (name: string) => `${name}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie ? '; Secure' : ''}`;
const getCookie = (req: Request, name: string) => (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1);
const randomState = () => crypto.randomBytes(24).toString('hex');

async function allowedEmails(): Promise<string[]> {
  const db = redis();
  const key = 'wedding:master-whitelist';

  let emails: string[] = await db.smembers(key);

  if (emails.length === 0) {
    const seed = (process.env.MASTER_EMAILS || '')
      .split(',')
      .map((email: string) => email.trim().toLowerCase())
      .filter(Boolean);

    if (seed.length > 0) {
      await db.sadd(key, seed);
      emails = seed;
    }
  }

  return emails.map((email: string) => String(email).toLowerCase());
}
async function sessionEmail(req: Request) {
  const token = getCookie(req, COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(decodeURIComponent(token), secret());
    if (typeof payload.email !== 'string' || payload.role !== 'master') return null;
    const emails = await allowedEmails();
    return emails.includes(payload.email.toLowerCase()) ? payload.email.toLowerCase() : null;
  } catch { return null; }
}
async function requireMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const email = await sessionEmail(req);
    if (!email) return res.status(401).json({ error: 'Login Master diperlukan.' });
    res.locals.masterEmail = email;
    next();
  } catch (error) { next(error); }
}
function youtubeId(input: string) {
  try {
    const u = new URL(input);
    if (u.hostname === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(u.hostname)) return null;
    if (u.pathname === '/watch') return u.searchParams.get('v');
    const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
    return m?.[2] || null;
  } catch { return null; }
}

app.get('/api/auth/login', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL || `${req.protocol}://${req.get('host')}`}/api/auth/callback`;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET || !process.env.SESSION_SECRET) return res.status(503).send('Google OAuth belum dikonfigurasi. Periksa environment variable.');
  const state = randomState();
  res.setHeader('Set-Cookie', cookie(STATE_COOKIE, state, 600));
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId); url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code'); url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state); url.searchParams.set('prompt', 'select_account');
  res.redirect(url.toString());
});
app.get('/api/auth/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query;
    const stateCookie = getCookie(req, STATE_COOKIE);
    res.setHeader('Set-Cookie', clearCookie(STATE_COOKIE));
    if (error || typeof code !== 'string' || typeof state !== 'string' || !stateCookie || state !== decodeURIComponent(stateCookie)) return res.redirect('/?authError=oauth');
    const redirectUri = `${process.env.APP_URL || `${req.protocol}://${req.get('host')}`}/api/auth/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID || '', client_secret: process.env.GOOGLE_CLIENT_SECRET || '', redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
    const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };
    if (!tokenResponse.ok || !tokenData.access_token) return res.redirect('/?authError=oauth');
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${tokenData.access_token}` } });
    const profile = await profileResponse.json() as { email?: string; email_verified?: boolean };
    const email = profile.email?.toLowerCase();
    if (!email || profile.email_verified !== true || !(await allowedEmails()).includes(email)) return res.redirect('/?authError=not-whitelisted');
    const jwt = await new SignJWT({ email, role: 'master' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret());
    res.setHeader('Set-Cookie', [clearCookie(STATE_COOKIE), cookie(COOKIE, encodeURIComponent(jwt), 8 * 60 * 60)]);
    res.redirect('/?mode=master');
  } catch (error) { next(error); }
});
app.get('/api/auth/me', async (req, res, next) => { try { const email = await sessionEmail(req); res.json({ authenticated: !!email, email }); } catch (e) { next(e); } });
app.post('/api/auth/logout', (_req, res) => { res.setHeader('Set-Cookie', clearCookie(COOKIE)); res.json({ ok: true }); });

// Public invitation content is read-only for guests; only authenticated Masters can publish changes.
app.get('/api/wedding-data', async (_req, res, next) => {
  try {
    const saved = await redis().get<any>('wedding:published-data');
    res.setHeader('Cache-Control', 'no-store');
    res.json(saved || null);
  } catch (e) { next(e); }
});
app.put('/api/wedding-data', requireMaster, async (req, res, next) => {
  try {
    const data = req.body?.data;
    if (!data || typeof data !== 'object' || !data.groom || !data.bride || !data.events || !data.music) {
      return res.status(400).json({ error: 'Data undangan tidak lengkap dan tidak dapat disimpan.' });
    }
    await redis().set('wedding:published-data', data);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) { next(e); }
});

const NO_ORDER_MENU = 'Tidak memesan makan/minum';
async function allowedMenuChoices(db: Redis): Promise<string[]> {
  const published = await db.get<any>('wedding:published-data');
  const menuPhotos = Array.isArray(published?.referencePhotos?.menu) ? published.referencePhotos.menu : [];
  const configuredMenus = menuPhotos
    .map((photo: any) => typeof photo === 'string' ? '' : String(photo?.caption || '').trim())
    .filter(Boolean);
  // Keep validation in sync with the menu captions shown to guests in RSVPSection.
  return [...new Set([...configuredMenus, NO_ORDER_MENU])];
}

const DEFAULT_PRESETS: any[] = [];
// One-time migration: remove old built-in presets so the Master can start with a clean list.

// Invitation links are individual, quota-bound records stored in Redis.
app.post('/api/master/invitations', requireMaster, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const quota = Number(req.body?.quota);
    if (!name || !Number.isInteger(quota) || quota < 1 || quota > 30) return res.status(400).json({ error: 'Nama wajib diisi dan jumlah orang harus 1–30.' });
    const readableName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '+').replace(/^\+|\+$/g, '') || 'Tamu';
    const token = `${crypto.randomBytes(5).toString('hex')}-${readableName}`;
    const record = { token, name, quota, attendance: null, foodChoices: [], respondedAt: null, createdAt: new Date().toISOString() };
    const db = redis();
    await db.set(`wedding:invitation:${token}`, record);
    await db.sadd('wedding:invitation-tokens', token);
    res.status(201).json(record);
  } catch (e) { next(e); }
});
app.get('/api/master/invitations', requireMaster, async (_req, res, next) => {
  try {
    const db = redis();
    const tokens = await db.smembers('wedding:invitation-tokens');
    const records = await Promise.all(tokens.map((token: string) => db.get<any>(`wedding:invitation:${token}`)));
    res.setHeader('Cache-Control', 'no-store');
    res.json(records.filter(Boolean));
  } catch (e) { next(e); }
});
app.put('/api/master/invitations/:token', requireMaster, async (req, res, next) => {
  try {
    const db = redis();
    const key = `wedding:invitation:${req.params.token}`;
    const record = await db.get<any>(key);
    if (!record) return res.status(404).json({ error: 'Undangan tidak ditemukan.' });
    const name = req.body?.name === undefined ? record.name : String(req.body.name).trim();
    const quota = req.body?.quota === undefined ? record.quota : Number(req.body.quota);
    if (!name || !Number.isInteger(quota) || quota < 1 || quota > 30) return res.status(400).json({ error: 'Nama wajib diisi dan kuota harus 1–30.' });
    record.name = name;
    record.quota = quota;
    if (req.body?.attendance !== undefined) {
      const attendance = req.body.attendance;
      if (![null, 'hadir', 'tidak_hadir'].includes(attendance)) return res.status(400).json({ error: 'Status kehadiran tidak valid.' });
      record.attendance = attendance;
      if (attendance === 'hadir') {
        const choices = Array.isArray(req.body?.foodChoices) ? req.body.foodChoices.map((v: unknown) => String(v)) : (record.foodChoices || []);
        const allowed = await allowedMenuChoices(db);
        if (choices.length !== quota || choices.some((v: string) => !allowed.includes(v))) return res.status(400).json({ error: `Untuk status hadir, pilih tepat ${quota} menu yang valid.` });
        record.foodChoices = choices;
      } else {
        record.foodChoices = [];
      }
      record.respondedAt = attendance ? (record.respondedAt || new Date().toISOString()) : null;
    } else if (record.attendance === 'hadir' && Array.isArray(record.foodChoices) && record.foodChoices.length !== quota) {
      return res.status(400).json({ error: 'Sesuaikan pilihan menu dengan kuota sebelum mengubah kuota undangan.' });
    }
    await db.set(key, record);
    res.json(record);
  } catch (e) { next(e); }
});
app.delete('/api/master/invitations/:token', requireMaster, async (req, res, next) => {
  try {
    const db = redis();
    await db.del(`wedding:invitation:${req.params.token}`);
    await db.srem('wedding:invitation-tokens', req.params.token);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.get('/api/invitations/:token', async (req, res, next) => {
  try {
    const record = await redis().get<any>(`wedding:invitation:${req.params.token}`);
    if (!record) return res.status(404).json({ error: 'Link undangan tidak ditemukan atau tidak valid.' });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ token: record.token, name: record.name, quota: record.quota, attendance: record.attendance, respondedAt: record.respondedAt });
  } catch (e) { next(e); }
});
const DEFAULT_GUESTBOOK_AVATARS = [
  { id: 'cat-1', label: 'Milo', emoji: '😺', color: '#FDE7C7', image: '/avatars/cat-1.webp' },
  { id: 'cat-2', label: 'Mimi', emoji: '😸', color: '#F8DDE7', image: '/avatars/cat-2.webp' },
  { id: 'cat-3', label: 'Mochi', emoji: '😻', color: '#E5E7F9', image: '/avatars/cat-3.webp' },
  { id: 'cat-4', label: 'Oyen', emoji: '😽', color: '#DDF2E5', image: '/avatars/cat-4.webp' },
  { id: 'cat-5', label: 'Luna', emoji: '🙀', color: '#F2E4D8', image: '/avatars/cat-5.webp' },
];
app.get('/api/guestbook/avatars', async (_req, res, next) => {
  try { const avatars = await redis().get<any[]>('wedding:guestbook-avatars') || DEFAULT_GUESTBOOK_AVATARS; res.setHeader('Cache-Control', 'no-store'); res.json(avatars); }
  catch (e) { next(e); }
});
app.get('/api/master/guestbook/avatars', requireMaster, async (_req, res, next) => {
  try { const avatars = await redis().get<any[]>('wedding:guestbook-avatars') || DEFAULT_GUESTBOOK_AVATARS; res.setHeader('Cache-Control', 'no-store'); res.json(avatars); }
  catch (e) { next(e); }
});
app.put('/api/master/guestbook/avatars', requireMaster, async (req, res, next) => {
  try {
    const avatars = req.body?.avatars;
    if (!Array.isArray(avatars) || avatars.length !== 5 || avatars.some((a: any) => !a || typeof a.id !== 'string' || typeof a.label !== 'string' || typeof a.emoji !== 'string' || typeof a.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(a.color) || typeof a.image !== 'string' || a.image.length > 5_000_000 || !(/^https:\/\//i.test(a.image) || /^data:image\/(?:webp|png|jpeg);base64,/i.test(a.image) || /^\/avatars\/cat-[1-5]\.webp$/.test(a.image)) || a.label.trim().length > 24 || a.emoji.length > 12)) return res.status(400).json({ error: 'Harus mengatur tepat 5 avatar kucing yang valid. Gunakan URL HTTPS atau unggah gambar.' });
    const clean = avatars.map((a: any, i: number) => ({ id: `cat-${i + 1}`, label: a.label.trim() || `Kucing ${i + 1}`, emoji: a.emoji.trim() || '🐱', color: a.color, image: a.image }));
    await redis().set('wedding:guestbook-avatars', clean); res.json(clean);
  } catch (e) { next(e); }
});

app.get('/api/guestbook', async (_req, res, next) => {
  try { const entries = await redis().get<any[]>('wedding:guestbook') || []; res.setHeader('Cache-Control', 'no-store'); res.json(entries); }
  catch (e) { next(e); }
});
app.get('/api/master/guestbook', requireMaster, async (_req, res, next) => {
  try { const entries = await redis().get<any[]>('wedding:guestbook') || []; res.setHeader('Cache-Control', 'no-store'); res.json(entries); }
  catch (e) { next(e); }
});
app.delete('/api/master/guestbook/:id', requireMaster, async (req, res, next) => {
  try { const db = redis(); const entries = await db.get<any[]>('wedding:guestbook') || []; const nextEntries = entries.filter(entry => entry.id !== req.params.id); await db.set('wedding:guestbook', nextEntries); res.json({ ok: true }); }
  catch (e) { next(e); }
});

app.post('/api/invitations/:token/rsvp', async (req, res, next) => {
  try {
    const db = redis();
    const key = `wedding:invitation:${req.params.token}`;
    const record = await db.get<any>(key);
    if (!record) return res.status(404).json({ error: 'Link undangan tidak valid.' });
    if (record.respondedAt) return res.status(409).json({ error: 'Konfirmasi untuk undangan ini sudah dikirim.' });
    const attendance = req.body?.attendance;
    if (!['hadir', 'tidak_hadir'].includes(attendance)) return res.status(400).json({ error: 'Pilih hadir atau tidak hadir.' });
    const guestMessage = String(req.body?.message || '').trim().slice(0, 1000);
    if (!guestMessage) return res.status(400).json({ error: 'Ucapan atau doa wajib diisi.' });
    const avatarId = String(req.body?.avatarId || '');
    const avatarOptions = await db.get<any[]>('wedding:guestbook-avatars') || DEFAULT_GUESTBOOK_AVATARS;
    if (!avatarOptions.some((avatar: any) => avatar.id === avatarId)) return res.status(400).json({ error: 'Silakan pilih avatar kucing terlebih dahulu.' });
    const foodChoices = attendance === 'hadir' && Array.isArray(req.body?.foodChoices) ? req.body.foodChoices.map((v: unknown) => String(v)) : [];
    const allowed = await allowedMenuChoices(db);
    if (attendance === 'hadir' && (foodChoices.length !== record.quota || foodChoices.some((v: string) => !allowed.includes(v)))) return res.status(400).json({ error: `Pilih tepat ${record.quota} menu sesuai jumlah orang yang diundang.` });
    record.attendance = attendance;
    record.foodChoices = foodChoices;
    record.respondedAt = new Date().toISOString();
    record.message = guestMessage;
    await db.set(key, record);
    const guestbook = await db.get<any[]>('wedding:guestbook') || [];
    guestbook.unshift({ id: `guestbook_${crypto.randomBytes(8).toString('hex')}`, name: record.name, avatarId, message: guestMessage, createdAt: record.respondedAt });
    await db.set('wedding:guestbook', guestbook.slice(0, 500));
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.get('/api/music-presets', async (_req, res, next) => {
  try {
    const db = redis();
    const migrationKey = 'wedding:music-presets-clean-v1';
    const migrated = await db.get<boolean>(migrationKey);
    if (!migrated) {
      await db.set('wedding:music-presets', []);
      await db.set(migrationKey, true);
      return res.json([]);
    }
    const saved = await db.get<any[]>('wedding:music-presets');
    if (Array.isArray(saved)) return res.json(saved);
    await db.set('wedding:music-presets', DEFAULT_PRESETS);
    res.json(DEFAULT_PRESETS);
  } catch (e) { next(e); }
});
app.post('/api/music-presets', requireMaster, async (req, res, next) => {
  try {
    const input = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    const id = youtubeId(input);
    if (!id || !/^[\w-]{6,20}$/.test(id)) return res.status(400).json({ error: 'Masukkan URL video YouTube yang valid.' });
    const metaResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`);
    if (!metaResponse.ok) return res.status(400).json({ error: 'Judul video tidak dapat diambil. Pastikan video tersedia dan dapat diakses.' });
    const meta = await metaResponse.json() as { title?: string; author_name?: string };
    const db = redis(); const key = 'wedding:music-presets';
    const list = (await db.get<any[]>(key)) || DEFAULT_PRESETS;
    if (list.some(p => p.youtubeId === id)) return res.status(409).json({ error: 'Video tersebut sudah ada di daftar preset.' });
    const preset = { id: `yt_${id}`, title: meta.title || 'YouTube music', artist: meta.author_name || 'YouTube', genre: 'YouTube', url: `https://www.youtube.com/watch?v=${id}`, youtubeId: id };
    const next = [...list, preset]; await db.set(key, next); res.status(201).json(preset);
  } catch (e) { next(e); }
});
app.delete('/api/music-presets/:id', requireMaster, async (req, res, next) => {
  try { const db = redis(); const key = 'wedding:music-presets'; const list = (await db.get<any[]>(key)) || DEFAULT_PRESETS; const next = list.filter(p => p.id !== req.params.id); if (next.length === list.length) return res.status(404).json({ error: 'Preset tidak ditemukan.' }); await db.set(key, next); res.json(next); } catch (e) { next(e); }
});
app.get('/api/master/whitelist', requireMaster, async (_req, res, next) => { try { res.json(await allowedEmails()); } catch (e) { next(e); } });
app.post('/api/master/whitelist', requireMaster, async (req, res, next) => { try { const email = String(req.body?.email || '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Format email tidak valid.' }); await redis().sadd('wedding:master-whitelist', email); res.status(201).json(await allowedEmails()); } catch (e) { next(e); } });
app.delete('/api/master/whitelist/:email', requireMaster, async (req, res, next) => { try { const email = decodeURIComponent(req.params.email).toLowerCase(); if (email === res.locals.masterEmail) return res.status(400).json({ error: 'Tidak bisa menghapus email yang sedang digunakan.' }); await redis().srem('wedding:master-whitelist', email); res.json(await allowedEmails()); } catch (e) { next(e); } });
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => { console.error(err); res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan server.' : String(err?.message || err) }); });
export default app;
