// src/service/groupsStorage.js
const KEY = 'rf-groups-tree';
const EVT = 'rf-groups-tree:changed';




// === RMS file service (интеграция с папками групп) ===
const FILESVC_URL   = 'http://217.114.10.226:8765';
const FILESVC_TOKEN = 'supersecret_change_me'; // тот же, что в pm2

function safeSlug(s) {
  return String(s || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').toLowerCase().slice(0, 64);
}

async function provisionGroupFolder(groupId, slug) {
  try {
    await fetch(`${FILESVC_URL}/group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth': FILESVC_TOKEN },
      body: JSON.stringify({ groupId, slug, makeDefaultSubdirs: true }),
    });
  } catch (e) {
    console.warn('filesvc create failed', e);
  }
}

async function removeGroupFolder(groupId, slug) {
  try {
    await fetch(`${FILESVC_URL}/group`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-auth': FILESVC_TOKEN },
      body: JSON.stringify({ groupId, slug }),
    });
  } catch (e) {
    console.warn('filesvc delete failed', e);
  }
}







export function loadTree() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [{ id: 'root', name: 'Все группы', type: 'folder', children: [] }];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [{ id: 'root', name: 'Все группы', type: 'folder', children: [] }];
  } catch {
    return [{ id: 'root', name: 'Все группы', type: 'folder', children: [] }];
  }
}

export function saveTree(tree) {
  localStorage.setItem(KEY, JSON.stringify(tree));
  window.dispatchEvent(new Event(EVT));
  return tree;
}

// === CRUD ===
export function createFolder(parentId = 'root', name = 'Новая папка') {
  const tree = loadTree();
  const parent = findNode(tree, parentId) ?? ensureRoot(tree);
  const node = { id: genId('fld'), name, type: 'folder', children: [] };
  parent.children = parent.children || [];
  parent.children.push(node);
  return saveTree(tree);
}

export function createGroup(parentId = 'root', name = 'Новая группа') {
  const tree = loadTree();
  const parent = findNode(tree, parentId) ?? ensureRoot(tree);

  const groupId = crypto.randomUUID();
  const slug = safeSlug(name || groupId);

  const node = { id: genId('grp'), name, type: 'group', groupId, slug };
  parent.children = parent.children || [];
  parent.children.push(node);

  // создаём папку для группы (в фоне, UI не блокируем)
  provisionGroupFolder(groupId, slug);

  return saveTree(tree);
}


export function renameNode(id, name) {
  const tree = loadTree();
  const n = findNode(tree, id);
  if (!n) return tree;
  n.name = name;
  return saveTree(tree);
}

export function deleteNode(id) {
  const tree = loadTree();
  if (id === 'root') return tree;

  // найдём узел ДО удаления, чтобы были данные для файлового сервиса
  const n = findNode(tree, id);

  if (n?.type === 'group' && n.groupId) {
    // удаляем папку группы на диске (не ждём ответа, чтобы не блокировать UI)
    removeGroupFolder(n.groupId, n.slug || safeSlug(n.name || n.groupId));
  }

  removeNode(tree, id);
  return saveTree(tree);
}

export function moveNode(id, newParentId = 'root', index = 0) {
  const tree = loadTree();
  const node = detachNode(tree, id);
  const parent = findNode(tree, newParentId) ?? ensureRoot(tree);
  parent.children = parent.children || [];
  const i = Math.max(0, Math.min(index, parent.children.length));
  parent.children.splice(i, 0, node);
  return saveTree(tree);
}

// === helpers ===
function ensureRoot(tree) {
  let root = tree.find(n => n.id === 'root');
  if (!root) {
    root = { id: 'root', name: 'Все группы', type: 'folder', children: [] };
    tree.unshift(root);
  }
  return root;
}
function genId(prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 8)}`; }
function findNode(tree, id) {
  const stack = [...tree];
  while (stack.length) {
    const n = stack.shift();
    if (n.id === id) return n;
    if (n.children?.length) stack.push(...n.children);
  }
  return null;
}
function removeNode(tree, id) {
  const stack = [...tree];
  while (stack.length) {
    const n = stack.shift();
    if (!n.children) continue;
    const idx = n.children.findIndex(c => c.id === id);
    if (idx !== -1) { n.children.splice(idx, 1); return true; }
    stack.push(...n.children);
  }
  return false;
}
function detachNode(tree, id) {
  const stack = [...tree];
  while (stack.length) {
    const n = stack.shift();
    if (!n.children) continue;
    const idx = n.children.findIndex(c => c.id === id);
    if (idx !== -1) { const [picked] = n.children.splice(idx, 1); return picked; }
    stack.push(...n.children);
  }
  const i = tree.findIndex(n => n.id === id);
  if (i !== -1) { const [picked] = tree.splice(i, 1); return picked; }
  return { id, name: 'unknown', type: 'folder', children: [] };
}

// === списки групп ===

// рекурсивно (как было)
export function listGroups(parentId = 'root') {
  const tree = loadTree();
  const parent = parentId === 'root' ? ensureRoot(tree) : findNode(tree, parentId) || ensureRoot(tree);

  const out = [];
  function walk(nodes, folderPath = []) {
    for (const n of nodes || []) {
      if (n.type === 'folder') {
        walk(n.children || [], [...folderPath, n.name]);
      } else if (n.type === 'group') {
        if (!n.groupId) n.groupId = crypto.randomUUID();
        out.push({ id: n.id, name: n.name, groupId: n.groupId, path: folderPath.join(' / ') });
      }
    }
  }
  walk(parent.children || [], []);
  return out;
}

// ТОЛЬКО прямые группы внутри выбранной папки (без вложенных)
export function listGroupsDirect(parentId = 'root') {
  const tree = loadTree();
  const parent = parentId === 'root'
    ? ensureRoot(tree)
    : findNode(tree, parentId) || ensureRoot(tree);

  // путь до родителя (без самой папки)
  function findPathToId(id, nodes = tree, acc = []) {
    for (const n of nodes) {
      if (n.id === id) return acc;
      if (n.type === 'folder' && n.children?.length) {
        const res = findPathToId(id, n.children, [...acc, n.name]);
        if (res) return res;
      }
    }
    return null;
  }
  const folderPath = findPathToId(parent.id) || [];

  const out = [];
  for (const n of parent.children || []) {
    if (n.type === 'group') {
      if (!n.groupId) n.groupId = crypto.randomUUID();
      out.push({ id: n.id, name: n.name, groupId: n.groupId, path: folderPath.join(' / ') });
    }
  }
  return out;
}

// алиасы
export { deleteNode as deleteGroup };
export { renameNode as renameGroup };
export { moveNode as moveGroup };
export const TREE_CHANGED_EVENT = EVT;
