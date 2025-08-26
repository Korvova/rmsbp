// src/companet/DocsSidebar.jsx
import { useEffect, useState, useCallback } from 'react';
import { Tree } from 'react-arborist';
import {
  loadDocsTree, createFolder, createDoc, renameNode, deleteNode, moveNode,
  DOCS_TREE_CHANGED_EVENT,
} from '../service/docsStorage';

export default function DocsSidebar({ onPick }) {
  const [treeData, setTreeData] = useState([]);
  const [selectedId, setSelectedId] = useState('root');
  const [menu, setMenu] = useState(null); // {x,y,id,name,isRoot,isFolder}

  const reload = useCallback(() => setTreeData(loadDocsTree()), []);
  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const h = () => reload();
    window.addEventListener(DOCS_TREE_CHANGED_EVENT, h);
    return () => window.removeEventListener(DOCS_TREE_CHANGED_EVENT, h);
  }, [reload]);

  useEffect(() => {
    const close = () => setMenu(null);
    const esc = (e) => e.key === 'Escape' && setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', esc);
    };
  }, []);

  const findInLocal = (id) => {
    const stack = [...treeData];
    while (stack.length) {
      const n = stack.shift();
      if (n.id === id) return n;
      if (n.children?.length) stack.push(...n.children);
    }
    return null;
  };

  const Row = ({ node, innerRef, attrs, children }) => {
    const onContextMenu = (e) => {
      e.preventDefault(); e.stopPropagation();
      setMenu({
        x: e.clientX, y: e.clientY, id: node.id,
        name: node.data?.name ?? '', isRoot: node.id === 'root',
        isFolder: node.data?.type === 'folder',
      });
    };
    return (
      <div {...attrs} ref={innerRef} onContextMenu={(e) => { attrs?.onContextMenu?.(e); onContextMenu(e); }}>
        {children}
      </div>
    );
  };

  return (
    <div style={{ position:'relative', width: 300, borderRight:'1px solid #e5e7eb', overflow:'auto' }}>
      <div style={{ padding: 8, display:'flex', gap:6 }}>
        <button onClick={() => createFolder(selectedId || 'root', 'Новая папка')}>+ Папка</button>
        <button onClick={() => createDoc(selectedId || 'root', 'Новый документ')}>+ Документ</button>
      </div>

      <Tree
        data={treeData}
        renderRow={Row}
        indent={20}
        disableDrag={(node) => node.id === 'root'}
        disableDrop={({ parentNode }) => parentNode?.data?.type === 'doc'}
        onReady={(api) => {
          api.select(['root']);
          onPick?.({ id: 'root', type: 'folder', name: 'Документы' });
        }}
        onSelect={(items) => {
          const id = (Array.isArray(items) && items[0]?.id) || 'root';
          setSelectedId(id);
          const node = findInLocal(id);
          onPick?.(node || { id, type: 'folder', name: 'Папка' });
        }}
        onMove={({ dragIds, parentId, index }) => {
          dragIds.forEach((id, i) => moveNode(id, parentId || 'root', (index ?? 0) + i));
        }}
      >
        {({ node, style, dragHandle }) => {
          const isFolder = node.data.type === 'folder';
          const icon = isFolder ? (node.isOpen ? '📂' : '📁') : '📄';
          return (
            <div
              style={{ ...style, display:'flex', gap:8, alignItems:'center', padding:'4px 8px', userSelect:'none' }}
              onClick={(e) => node.handleClick(e)}
            >
              <span
                ref={dragHandle}
                onClick={(e) => { e.stopPropagation(); if (isFolder) { node.toggle(); node.select(); } }}
                style={{ width:18, cursor: isFolder ? 'pointer' : 'grab' }}
                title={isFolder ? (node.isOpen ? 'Свернуть' : 'Развернуть') : 'Перетащить'}
              >{icon}</span>
              <span style={{ flex:1, cursor:'default' }} onClick={(e) => { e.stopPropagation(); node.handleClick(e); }}>
                {node.data.name}
              </span>
            </div>
          );
        }}
      </Tree>

      {menu && (
        <div
          style={{
            position:'fixed', left:menu.x, top:menu.y, background:'#fff',
            border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,.12)',
            padding:6, zIndex:1000, minWidth:220
          }}
          onClick={(e)=>e.stopPropagation()}
        >
          <div style={{ padding:'6px 10px', fontSize:12, color:'#6b7280' }}>
            {menu.name}{menu.isRoot ? ' (root)' : ''}
          </div>
          <hr style={{ border:0, borderTop:'1px solid #f1f5f9', margin:'6px 0' }} />

          <button
            style={{ width:'100%', textAlign:'left', padding:'6px 10px', background:'none', border:'none',
                     cursor: menu.isFolder ? 'pointer' : 'not-allowed', opacity: menu.isFolder ? 1 : .5 }}
            disabled={!menu.isFolder}
            onClick={() => { const t = prompt('Название папки', 'Новая папка'); if (t && t.trim()) createFolder(menu.id, t.trim()); }}
          >➕ Создать папку</button>

          <button
            style={{ width:'100%', textAlign:'left', padding:'6px 10px', background:'none', border:'none',
                     cursor: menu.isFolder ? 'pointer' : 'not-allowed', opacity: menu.isFolder ? 1 : .5 }}
            disabled={!menu.isFolder}
            onClick={() => { const t = prompt('Название документа', 'Новый документ'); if (t && t.trim()) createDoc(menu.id, t.trim()); }}
          >📄 Создать документ</button>

          <hr style={{ border:0, borderTop:'1px solid #f1f5f9', margin:'6px 0' }} />

          <button
            style={{ width:'100%', textAlign:'left', padding:'6px 10px', background:'none', border:'none',
                     cursor: menu.isRoot ? 'not-allowed' : 'pointer', opacity: menu.isRoot ? .5 : 1 }}
            disabled={menu.isRoot}
            onClick={() => { const t = prompt('Переименовать', menu.name); if (t && t.trim()) renameNode(menu.id, t.trim()); }}
          >✏️ Переименовать</button>

          <button
            style={{ width:'100%', textAlign:'left', padding:'6px 10px', background:'none', border:'none', color:'#dc2626',
                     cursor: menu.isRoot ? 'not-allowed' : 'pointer', opacity: menu.isRoot ? .5 : 1 }}
            disabled={menu.isRoot}
            onClick={() => { if (confirm('Удалить?')) deleteNode(menu.id); }}
          >🗑 Удалить</button>
        </div>
      )}
    </div>
  );
}
