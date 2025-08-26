// src/service/docsStorage.js
const TREE_KEY = 'docs-tree';
const DOC_KEY_PREFIX = 'doc:content:';
export const DOCS_TREE_CHANGED_EVENT = 'docs-tree:changed';

// начальное дерево
const initialTree = [{ id: 'root', type: 'folder', name: 'Документы', children: [] }];




export function loadDocsTree() {
  try {
    const raw = localStorage.getItem(TREE_KEY);
    if (!raw) return initialTree;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : initialTree;
  } catch {
    return initialTree;
  }
}
export function saveDocsTree(tree) {
  localStorage.setItem(TREE_KEY, JSON.stringify(tree));
  window.dispatchEvent(new Event(DOCS_TREE_CHANGED_EVENT));
  return tree;
}

function findNodeById(tree, id) {
  const stack = [...tree];
  while (stack.length) {
    const n = stack.shift();
    if (n.id === id) return n;
    if (n.children?.length) stack.push(...n.children);
  }
  return null;
}
function findParent(tree, id) {
  const stack = [...tree];
  while (stack.length) {
    const n = stack.shift();
    if (n.children?.some(c => c.id === id)) return n;
    if (n.children?.length) stack.push(...n.children);
  }
  return null;
}

export function createFolder(parentId = 'root', name = 'Новая папка') {
  const tree = loadDocsTree();
  const parent = findNodeById(tree, parentId) || tree[0];
  parent.children = parent.children || [];
  parent.children.push({ id: crypto.randomUUID(), type: 'folder', name, children: [] });
  return saveDocsTree(tree);
}

export function createDoc(parentId = 'root', name = 'Новый документ') {
  const tree = loadDocsTree();
  const parent = findNodeById(tree, parentId) || tree[0];
  parent.children = parent.children || [];
  const id = crypto.randomUUID();
  const node = { id, type: 'doc', name, docId: id };
  parent.children.push(node);
  // создать пустой документ


  const emptyLexical = {
    root: {
      children: [
        { children: [], direction: null, format: "", indent: 0, type: "paragraph", version: 1 }
      ],
      direction: null, format: "", indent: 0, type: "root", version: 1
    }
  };
  localStorage.setItem(
    DOC_KEY_PREFIX + id,
    JSON.stringify({ title: name, raw: emptyLexical, updatedAt: Date.now() })
  );








  return saveDocsTree(tree);
}

export function renameNode(id, name) {
  const tree = loadDocsTree();
  const node = findNodeById(tree, id);
  if (!node) return tree;
  node.name = name;
  // синхронизируем заголовок документа
  if (node.type === 'doc' && node.docId) {
    const key = DOC_KEY_PREFIX + node.docId;
    const cur = loadDoc(node.docId) || {};
    localStorage.setItem(key, JSON.stringify({ ...cur, title: name, updatedAt: Date.now() }));
  }
  return saveDocsTree(tree);
}

export function deleteNode(id) {
  const tree = loadDocsTree();
  if (id === 'root') return tree;
  const parent = findParent(tree, id);
  if (!parent) return tree;
  const idx = parent.children.findIndex(c => c.id === id);
  if (idx === -1) return tree;

  const node = parent.children[idx];
  // каскадно удалить документы
  const stack = [node];
  while (stack.length) {
    const n = stack.pop();
    if (n.type === 'doc' && n.docId) {
      localStorage.removeItem(DOC_KEY_PREFIX + n.docId);
    }
    if (n.children?.length) stack.push(...n.children);
  }

  parent.children.splice(idx, 1);
  return saveDocsTree(tree);
}

export function moveNode(id, newParentId = 'root', index = 0) {
  const tree = loadDocsTree();
  if (id === 'root') return tree;
  const parent = findParent(tree, id);
  if (!parent) return tree;
  const idx = parent.children.findIndex(c => c.id === id);
  if (idx === -1) return tree;
  const [node] = parent.children.splice(idx, 1);

  const dest = findNodeById(tree, newParentId) || tree[0];
  dest.children = dest.children || [];
  dest.children.splice(Math.max(0, Math.min(index, dest.children.length)), 0, node);
  return saveDocsTree(tree);
}

export function listDocsDirect(folderId = 'root') {
  const tree = loadDocsTree();
  const folder = findNodeById(tree, folderId) || tree[0];
  return (folder.children || []).filter(c => c.type === 'doc').map(d => ({
    id: d.id, name: d.name, docId: d.docId,
  }));
}

// ===== содержимое документа =====
export function loadDoc(docId) {
  try {
    const raw = localStorage.getItem(DOC_KEY_PREFIX + docId);
    if (!raw) return null;


    const doc = JSON.parse(raw);
    // миграция со старого Draft.js формата (нет root)
    if (doc?.raw && !doc.raw.root) {
      const emptyLexical = {
        root: {
          children: [
            { children: [], direction: null, format: "", indent: 0, type: "paragraph", version: 1 }
          ],
          direction: null, format: "", indent: 0, type: "root", version: 1
        }
      };
      const fixed = { ...doc, raw: emptyLexical, updatedAt: Date.now() };
      localStorage.setItem(DOC_KEY_PREFIX + docId, JSON.stringify(fixed));
      return fixed;
    }
    return doc;




  } catch {
    return null;
  }
}
export function saveDoc(docId, { title, raw }) {
  const cur = loadDoc(docId) || {};
  const next = {
    title: title ?? cur.title ?? 'Документ',
    raw: raw ?? cur.raw ?? { blocks: [], entityMap: {} },
    updatedAt: Date.now(),
  };
  localStorage.setItem(DOC_KEY_PREFIX + docId, JSON.stringify(next));
  return next;
}
