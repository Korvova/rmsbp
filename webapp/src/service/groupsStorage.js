// src/service/groupsStorage.js
const KEY = 'rf-groups-tree';

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
  const node = {
    id: genId('grp'),
    name,
    type: 'group',
    groupId: crypto.randomUUID(), // ← это ид, который использует /groups/:groupId
  };
  parent.children = parent.children || [];
  parent.children.push(node);
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
  removeNode(tree, id);
  return saveTree(tree);
}

export function moveNode(id, newParentId = 'root', index = 0) {
  const tree = loadTree();
  const node = detachNode(tree, id);
  const parent = findNode(tree, newParentId) ?? ensureRoot(tree);
  parent.children = parent.children || [];
  // нормализуем index
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

function genId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

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
    if (idx !== -1) {
      n.children.splice(idx, 1);
      return true;
    }
    stack.push(...n.children);
  }
  return false;
}





// Вернуть плоский список всех групп (для плиток / списка)
export function listGroups() {
  const tree = loadTree();
  const root = ensureRoot(tree);

  const out = [];

  function walk(nodes, folderPath = []) {
    for (const n of nodes || []) {
      if (n.type === 'folder') {
        // Спускаемся в папку, накапливая путь
        walk(n.children || [], [...folderPath, n.name]);
      } else if (n.type === 'group') {
        // На всякий случай подстрахуем старые данные без groupId
        if (!n.groupId) n.groupId = crypto.randomUUID();
        out.push({
          id: n.id,            // id узла в дереве
          name: n.name,        // имя группы
          groupId: n.groupId,  // то, что используем в /groups/:groupId
          path: folderPath.join(' / '), // путь папок, где лежит группа
        });
      }
    }
  }

  walk(root.children || [], []);
  return out;
}









function detachNode(tree, id) {
  // вырезаем узел и возвращаем его
  const stack = [...tree];
  while (stack.length) {
    const n = stack.shift();
    if (!n.children) continue;
    const idx = n.children.findIndex(c => c.id === id);
    if (idx !== -1) {
      const [picked] = n.children.splice(idx, 1);
      return picked;
    }
    stack.push(...n.children);
  }
  // если это корень верхнего уровня
  const i = tree.findIndex(n => n.id === id);
  if (i !== -1) {
    const [picked] = tree.splice(i, 1);
    return picked;
  }
  // не нашли — создадим пустышку чтоб не падать
  return { id, name: 'unknown', type: 'folder', children: [] };
}

export { deleteNode as deleteGroup };


export { renameNode as renameGroup };
export { moveNode as moveGroup };
export { loadTree as getTree }; // если где-то удобнее так читать
