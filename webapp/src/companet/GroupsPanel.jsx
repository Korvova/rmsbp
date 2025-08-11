// src/companet/GroupsPanel.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listGroups, createGroup, renameNode, deleteNode,
  TREE_CHANGED_EVENT,
} from '../service/groupsStorage';

export default function GroupsPanel({ folderId }) {
  const nav = useNavigate();
  const [items, setItems] = useState([]);

  const refresh = () => setItems(listGroups(folderId || 'root'));

  useEffect(() => { refresh(); }, [folderId]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener(TREE_CHANGED_EVENT, h);
    return () => window.removeEventListener(TREE_CHANGED_EVENT, h);
  }, []);

  if (!folderId) {
    return <div style={{ padding: 16, opacity: .7 }}>Выберите папку слева</div>;
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h3 style={{ margin:0 }}>Группы</h3>
        <button onClick={() => { createGroup(folderId, 'Новая группа'); }}>
          + Создать группу
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
        {items.map(g => (
          <div key={g.id}
               style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:12, background:'#fff' }}>
            <div style={{ fontWeight:600, marginBottom:8 }}>
              {g.name}
            </div>
            {g.path && (
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:8 }}>/{g.path}</div>
            )}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={() => nav(`/groups/${g.groupId}`)}>Открыть</button>
              <button onClick={() => {
                const t = window.prompt('Название группы', g.name);
                if (t) renameNode(g.id, t);
              }}>Переименовать</button>
              <button onClick={() => {
                if (confirm('Удалить группу?')) deleteNode(g.id);
              }}>Удалить</button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ opacity:.6, padding:8 }}>В этой папке пока нет групп</div>
        )}
      </div>
    </div>
  );
}
