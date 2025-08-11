// src/components/GroupsPanel.jsx
import { useEffect, useState } from 'react';


import { useNavigate } from 'react-router-dom';

import { listGroups, deleteGroup, renameGroup, createGroup } from '../service/groupsStorage';

export default function GroupsPanel({ menuId }) {
  const [items, setItems] = useState([]);
  const nav = useNavigate();
  const refresh = () => setItems(listGroups(menuId));

  useEffect(() => { if (menuId) refresh(); }, [menuId]);

  if (!menuId) {
    return <div style={{ padding: 16, opacity: .7 }}>Выберите раздел слева</div>;
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h3 style={{ margin:0 }}>Группы</h3>
        <button onClick={() => { const g = createGroup(menuId); refresh(); }}>+ Создать группу</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>


        
   {items.map(g => (
  <div key={g.id}>
    <div>{g.name}</div>
    <button onClick={() => nav(`/groups/${g.groupId}`)}>Открыть</button>
    <button onClick={() => { const t = prompt('Название', g.name); if (t) { renameGroup(g.id, t); refresh(); } }}>Переименовать</button>
    <button onClick={() => { if (confirm('Удалить?')) { deleteGroup(g.id); refresh(); } }}>Удалить</button>
  </div>
))}



      </div>
    </div>
  );
}
