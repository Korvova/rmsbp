// /opt/rms-filesvc/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// === константы ===
const HOST   = process.env.HOST || '0.0.0.0';
const PORT   = Number(process.env.PORT || 8765);
const BASE   = process.env.BASE_DIR || '/var/www/rmsbp/storage/Groups';
const SECRET = process.env.FILESVC_SECRET || 'CHANGE_ME';

app.use(express.json());

// CORS (разрешаем preflight и заголовок x-auth)
const corsOptions = {
  origin: true, // можно указать конкретно 'http://localhost:5174'
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth'],
  maxAge: 86400,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ОДИН общий auth (пропускаем preflight и /health)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  if (req.path === '/health') return next();
  const token = req.headers['x-auth'];
  if (!token || token !== SECRET) return res.status(401).json({ error: 'unauthorized' });
  next();
});


app.get('/health', (_req, res) => res.json({ ok: true }));

// создать папку группы
// body: { groupId, slug, makeDefaultSubdirs?: boolean }
app.post('/group', async (req, res) => {
  try {
    const { groupId, slug, makeDefaultSubdirs = true } = req.body || {};
    if (!groupId) return res.status(400).json({ error: 'groupId required' });
    const safe = safeSlug(slug || groupId);
    const dirName = `${groupId}-${safe}`;
    const root = ensureInside(BASE, path.join(BASE, dirName));

    await fs.mkdir(root, { recursive: true });
    if (makeDefaultSubdirs) {
      const sub = ['Design','Specs','Contracts','Media','Tasks','Archive'];
      await Promise.all(sub.map(d => fs.mkdir(path.join(root, d), { recursive: true })));
    }
    return res.json({ ok: true, path: root });
  } catch (e) {
    const msg = e && e.message || String(e);
    return res.status(500).json({ error: msg });
  }
});

// удалить папку группы
// body: { groupId, slug }
app.delete('/group', async (req, res) => {
  try {
    const { groupId, slug } = req.body || {};
    if (!groupId) return res.status(400).json({ error: 'groupId required' });
    const safe = safeSlug(slug || groupId);
    const dirName = `${groupId}-${safe}`;
    const root = ensureInside(BASE, path.join(BASE, dirName));
    // rm -rf безопасно (внутри BASE)
    await fs.rm(root, { recursive: true, force: true });
    return res.json({ ok: true });
  } catch (e) {
    const msg = e && e.message || String(e);
    return res.status(500).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`rms-filesvc on :${PORT}, BASE=${BASE}`);
});


