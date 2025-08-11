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

  return (
    <div style={{ width: 280, borderRight: '1px solid #e5e7eb', overflow: 'auto' }}>
      <div style={{ padding: 8, display: 'flex', gap: 6 }}>
        <button onClick={() => { createFolder(selectedId || 'root', 'Новая папка'); }}>
          + Папка
        </button>
        <button onClick={() => { createGroup(selectedId || 'root', 'Новая группа'); }}>
          + Группа
        </button>
      </div>

      <Tree
        key={version}              // форсируем пересоздание при изменениях
        data={treeData}
        onReady={(api) => {        // мягко выделим текущий/рутовый узел
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
          // saveTree сам пробросит событие → перерисуемся
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

            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const t = prompt('Переименовать', node.data.name);
                if (t) renameNode(node.id, t);   // событие обновит дерево
              }}
              title="Переименовать"
            >
              ✏️
            </button>

            {node.id !== 'root' && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Удалить?')) deleteNode(node.id); // событие обновит дерево
                }}
                title="Удалить"
              >
                🗑
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
}
