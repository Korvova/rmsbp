import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadGroups, saveGroups, loadFlow } from '../service/storage';

export default function GroupsPage() {
  const nav = useNavigate();
  const [groups, setGroups] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { setGroups(loadGroups()); }, []);

  const createGroup = () => {
    const id = crypto.randomUUID();
    const newGroups = [...groups, { id, name: name.trim() || 'Без имени', createdAt: Date.now() }];
    setGroups(newGroups);
    saveGroups(newGroups);
    setCreating(false);
    setName('');
  };

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ margin:0 }}>Группы</h2>
        <button onClick={() => setCreating(true)}>Создать группу</button>
      </header>

      {creating && (
        <div style={{ display:'grid', gap:8, maxWidth:360, marginBottom:16 }}>
          <input
            placeholder="Название группы"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={createGroup} disabled={!name.trim()}>Создать</button>
            <button onClick={() => { setCreating(false); setName(''); }}>Отмена</button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
        {groups.map(g => {
          // можно посчитать задачки в группе
          const flow = loadFlow(g.id);
          const count = (flow?.nodes || []).length;
          return (
            <div
              key={g.id}
              onClick={() => nav(`/groups/${g.id}`)}
              style={{
                border:'1px solid #ddd', borderRadius:12, padding:12, cursor:'pointer',
                background:'#fff', boxShadow:'0 2px 6px rgba(0,0,0,.06)'
              }}
            >
              <div style={{ fontWeight:600, marginBottom:6 }}>{g.name}</div>
              <div style={{ fontSize:12, opacity:.7 }}>{count} задач</div>
            </div>
          );
        })}
        {groups.length === 0 && <div style={{ opacity:.6 }}>Пока нет групп — создайте первую.</div>}
      </div>
    </div>
  );
}
