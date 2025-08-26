const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const HOST = "0.0.0.0";
const PORT   = Number(process.env.PORT || 8765);
const BASE   = process.env.BASE_DIR || '/var/www/rmsbp/storage/Groups';
const SECRET = process.env.FILESVC_SECRET || 'CHANGE_ME';

app.get('/health', (_req, res) => res.json({ ok: true }));

// простая проверка токена
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const token = req.headers['x-auth'];
  if (!token || token !== SECRET) return res.status(401).json({ error: 'unauthorized' });
  next();
});

function safeSlug(s) {
  return String(s || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').toLowerCase().slice(0, 64);
}
function ensureInside(base, target) {
  const r = path.resolve(target);
  if (!r.startsWith(path.resolve(base) + path.sep)) throw new Error('path_escape');
  return r;
}

// создать папку группы
app.post('/group', async (req, res) => {
  try {
    const { groupId, slug, makeDefaultSubdirs = true } = req.body || {};
    if (!groupId) return res.status(400).json({ error: 'groupId required' });
    const dirName = `${groupId}-${safeSlug(slug || groupId)}`;
    const root = ensureInside(BASE, path.join(BASE, dirName));
    await fs.mkdir(root, { recursive: true });
    if (makeDefaultSubdirs) {
      for (const d of ['Design','Specs','Contracts','Media','Tasks','Archive']) {
        await fs.mkdir(path.join(root, d), { recursive: true });
      }
    }
    res.json({ ok: true, path: root });
  } catch (e) { res.status(500).json({ error: e?.message || String(e) }); }
});

// удалить папку группы
app.delete('/group', async (req, res) => {
  try {
    const { groupId, slug } = req.body || {};
    if (!groupId) return res.status(400).json({ error: 'groupId required' });
    const dirName = `${groupId}-${safeSlug(slug || groupId)}`;
    const root = ensureInside(BASE, path.join(BASE, dirName));
    await fs.rm(root, { recursive: true, force: true });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e?.message || String(e) }); }
});

app.listen(PORT, HOST, () => {
  console.log(`rms-filesvc on ${HOST}:${PORT}, BASE=${BASE}`);
});
