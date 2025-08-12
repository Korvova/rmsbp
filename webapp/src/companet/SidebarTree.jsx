// src/companet/SidebarTree.jsx
import { useEffect, useState, useCallback } from 'react';
import { Tree } from 'react-arborist';
import {
  loadTree, createFolder, createGroup, renameNode, deleteNode, moveNode,
  TREE_CHANGED_EVENT,
} from '../service/groupsStorage';

export default function SidebarTree({ onPick }) {
  const [treeData, setTreeData] = useState([]);
  const [selectedId, setSelectedId] = useState('root');
  const [version, setVersion] = useState(0);
  const [menu, setMenu] = useState(null); // { x, y, id, name, isRoot }
  const bump = () => setVersion(v => v + 1);

  const reload = useCallback(() => {
    const t = loadTree();
    setTreeData(Array.isArray(t) ? t : []);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ловим внешние изменения стораджа (rename/delete/move/create)
  useEffect(() => {
    const h = () => { reload(); bump(); };
    window.addEventListener(TREE_CHANGED_EVENT, h);
    return () => window.removeEventListener(TREE_CHANGED_EVENT, h);
  }, [reload]);

  // авто-закрытие контекстного меню (клик, скролл, Esc)
  useEffect(() => {
    const close = () => setMenu(null);
    const esc = (e) => { if (e.key === 'Escape') setMenu(null); };
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', esc);
    };
  }, []);

  const toIds = (items) =>
    Array.isArray(items)
      ? items.map(x => (x && typeof x === 'object' ? x.id : x)).filter(Boolean)
      : [];

  const findInLocal = (id) => {
    const stack = [...treeData];
    while (stack.length) {
      const n = stack.shift();
      if (n.id === id) return n;
      if (n.children?.length) stack.push(...n.children);
    }
    return null;
  };

  // действия меню
  const doRename = () => {
    if (!menu || menu.isRoot) return;
    const t = prompt('Переименовать', menu.name);
    if (t && t.trim()) renameNode(menu.id, t.trim());
    setMenu(null);
  };
  const doDelete = () => {
    if (!menu || menu.isRoot) return;
    if (confirm('Удалить?')) {
      deleteNode(menu.id);
      if (menu.id === selectedId) setSelectedId('root');
    }
    setMenu(null);
  };

  // Рендер строки: здесь ловим ПКМ. ВАЖНО — вернуть attrs и ref!
  const Row = ({ node, innerRef, attrs, children }) => {
    const onContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setMenu({
        x: e.clientX,
        y: e.clientY,
        id: node.id,
        name: node.data?.name ?? '',
        isRoot: node.id === 'root',
      });
    };
    return (
      <div
        {...attrs}
        ref={innerRef}
        onContextMenu={(e) => {
          // сохраним поведение дерева + наш ПКМ
          attrs?.onContextMenu?.(e);
          onContextMenu(e);
        }}
      >
        {children}
      </div>
    );
  };

  return (
    <div style={{ position:'relative', width: 280, borderRight: '1px solid #e5e7eb', overflow: 'auto' }}>
      <div style={{ padding: 8, display: 'flex', gap: 6 }}>
        <button onClick={() => { createFolder(selectedId || 'root', 'Новая папка'); }}>
          + Папка
        </button>
        <button onClick={() => { createGroup(selectedId || 'root', 'Новая группа'); }}>
          + Группа
        </button>
      </div>

      <Tree
        key={version}
        data={treeData}
        renderRow={Row}  // <-- добавили
        onReady={(api) => {
          const init = selectedId || 'root';
          api.select([init]);
          const node = findInLocal(init);
          onPick?.(node || { id: 'root', type: 'folder', name: 'Все группы' });
        }}
        onSelect={(items) => {
          const ids = toIds(items);
          const id = ids[0] || 'root';
          setSelectedId(id);
          const node = findInLocal(id);
          onPick?.(node || { id, type: 'folder', name: 'Папка' });
        }}
        onMove={({ dragIds, parentId, index }) => {
          dragIds.forEach((id, i) => moveNode(id, parentId || 'root', (index ?? 0) + i));
        }}
        renderNode={({ node, style }) => (
          <div
            style={{ ...style, display: 'flex', gap: 8, alignItems: 'center', padding: '4px 8px' }}
          >
            <span style={{ width: 18 }}>{node.data.type === 'folder' ? '📁' : '🧩'}</span>
            <span
              style={{ flex: 1, cursor: node.isInternal ? 'pointer' : 'default' }}
              onDoubleClick={() => { if (node.isInternal) node.toggle(); }}
            >
              {node.data.name}
            </span>
            {/* ✏️ и 🗑 — по твоей просьбе убраны, теперь только через ПКМ */}
          </div>
        )}
      />

      {/* Контекстное меню */}
      {menu && (
        <div
          style={{
            position: 'fixed',
            left: menu.x,
            top: menu.y,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,.12)',
            padding: 6,
            zIndex: 1000,
            minWidth: 180,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '6px 10px', fontSize: 12, color: '#6b7280' }}>
            {menu.name}{menu.isRoot ? ' (root)' : ''}
          </div>
          <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />
          <button
            style={{ width: '100%', textAlign: 'left', padding: '6px 10px', background: 'none', border: 'none',
                     cursor: menu.isRoot ? 'not-allowed' : 'pointer', opacity: menu.isRoot ? .5 : 1 }}
            disabled={menu.isRoot}
            onClick={doRename}
          >
            Переименовать
          </button>
          <button
            style={{ width: '100%', textAlign: 'left', padding: '6px 10px', background: 'none', border: 'none',
                     color: '#dc2626', cursor: menu.isRoot ? 'not-allowed' : 'pointer', opacity: menu.isRoot ? .5 : 1 }}
            disabled={menu.isRoot}
            onClick={doDelete}
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}
