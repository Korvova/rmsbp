// src/companet/SidebarTree.jsx
import { useEffect, useState, useCallback } from 'react';
import { Tree } from 'react-arborist';
import {
  loadTree,
  createFolder,
  createGroup,
  renameNode,
  deleteNode,
  moveNode,
} from '../service/groupsStorage';

export default function SidebarTree({ onPick }) {
  const [treeData, setTreeData] = useState([]);
  const [selectedId, setSelectedId] = useState('root'); // держим выбранный id только у себя

  const reload = useCallback(() => {
    const t = loadTree();
    setTreeData(Array.isArray(t) ? t : []);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Унифицируем то, что приходит из onSelect: там могут быть id или объекты-узлы
  const toIds = (items) =>
    Array.isArray(items)
      ? items.map(x => (x && typeof x === 'object' ? x.id : x)).filter(Boolean)
      : [];

  return (
    <div style={{ width: 280, borderRight: '1px solid #e5e7eb', overflow: 'auto' }}>
      <div style={{ padding: 8, display: 'flex', gap: 6 }}>
        <button onClick={() => { createFolder(selectedId || 'root', 'Новая папка'); reload(); }}>
          + Папка
        </button>
        <button onClick={() => { createGroup(selectedId || 'root', 'Новая группа'); reload(); }}>
          + Группа
        </button>
      </div>

      <Tree
        data={treeData}
        // НЕ передаём selection проп — даём дереву управлять выделением самому
        onReady={(api) => {
          // когда дерево готово — мягко выделим root, если он есть
          const hasRoot = (treeData || []).some(n => n?.id === 'root');
          if (hasRoot) api.select(['root']);
          onPick?.('root');
        }}
        onSelect={(items) => {
          const ids = toIds(items);
          const id = ids[0] || 'root';
          setSelectedId(id);
          onPick?.(id);
        }}
        onMove={({ dragIds, parentId, index }) => {
          dragIds.forEach((id, i) => moveNode(id, parentId || 'root', (index ?? 0) + i));
          reload();
        }}
        renderNode={({ node, style }) => (
          <div
            style={{ ...style, display: 'flex', gap: 8, alignItems: 'center', padding: '4px 8px' }}
          >
            <span style={{ width: 18 }}>{node.data.type === 'folder' ? '📁' : '🧩'}</span>
            <span
              style={{ flex: 1, cursor: 'default' }}
              onDoubleClick={() => { if (node.isInternal) node.toggle(); }}
            >
              {node.data.name}
            </span>
            <button
              onClick={() => {
                const t = prompt('Переименовать', node.data.name);
                if (t) { renameNode(node.id, t); reload(); }
              }}
            >
              ✏️
            </button>
            {node.id !== 'root' && (
              <button
                onClick={() => { if (confirm('Удалить?')) { deleteNode(node.id); reload(); } }}
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
