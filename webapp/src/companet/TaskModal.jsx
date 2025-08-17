import { useEffect } from 'react';

export default function TaskModal({
  open,
  task,
  stages = [],
  onClose,
  onChange,          // (patch) => void
  onDelete,          // () => void
  onOpenCalendar,    // () => void
}) {
  if (!open || !task) return null;
  const d = task.data || {};

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const wrap = { position:'fixed', inset:0, background:'rgba(2,6,23,.45)', zIndex:80, display:'grid', placeItems:'center' };
  const box  = { width:'min(820px, 96vw)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 30px 80px rgba(2,6,23,.35)' };
  const head = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid #eef2f7' };
  const body = { display:'grid', gap:12, gridTemplateColumns:'1fr 1fr', padding:14 };
  const foot = { display:'flex', justifyContent:'space-between', padding:'12px 14px', borderTop:'1px solid #eef2f7' };
  const input = { width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 };

  return (
    <div style={wrap} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <div style={head}>
          <div style={{fontWeight:700}}>Задача</div>
          <div style={{display:'flex', gap:8}}>
            <button title="Открыть в календаре" onClick={onOpenCalendar}>📅</button>
            <button title="Удалить" onClick={onDelete}>🗑</button>
            <button title="Закрыть" onClick={onClose}>✖</button>
          </div>
        </div>

        <div style={body}>
          <div style={{gridColumn:'1 / -1'}}>
            <label style={{fontSize:12, opacity:.7}}>Название</label>
            <input
              style={input}
              value={d.label || ''}
              onChange={(e) => onChange?.({ label: e.target.value })}
            />
          </div>

          <div>
            <label style={{fontSize:12, opacity:.7}}>Статус</label>
            <select
              style={input}
              value={d.status || 'pending'}
              onChange={(e) => onChange?.({ status: e.target.value })}
            >
              <option value="pending">pending</option>
              <option value="working">working</option>
              <option value="done">done</option>
              <option value="cancel">cancel</option>
              <option value="frozen">frozen</option>
            </select>
          </div>

          <div>
            <label style={{fontSize:12, opacity:.7}}>Сложность</label>
            <input
              style={{...input, padding:'6px 10px'}}
              type="range" min={0} max={10} step={1}
              value={typeof d.difficulty === 'number' ? d.difficulty : 0}
              onChange={(e) => onChange?.({ difficulty: Number(e.target.value) })}
            />
          </div>

          <div>
            <label style={{fontSize:12, opacity:.7}}>Тип</label>
            <input
              style={input}
              value={d.taskType || ''}
              onChange={(e) => onChange?.({ taskType: e.target.value })}
            />
          </div>

          <div>
            <label style={{fontSize:12, opacity:.7}}>Стадия</label>
            <select
              style={input}
              value={d.stage || stages[0]?.id || 'backlog'}
              onChange={(e) => onChange?.({ stage: e.target.value })}
            >
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{fontSize:12, opacity:.7}}>Группа</label>
            <input
              style={input}
              value={d.group || ''}
              onChange={(e) => onChange?.({ group: e.target.value })}
            />
          </div>

          <div style={{gridColumn:'1 / -1'}}>
            <label style={{fontSize:12, opacity:.7}}>Описание</label>
            <textarea
              style={{...input, minHeight:140, resize:'vertical'}}
              value={d.description || ''}
              onChange={(e) => onChange?.({ description: e.target.value })}
            />
          </div>

          <div>
            <label style={{fontSize:12, opacity:.7}}>Инициалы (аватар)</label>
            <input
              style={input}
              value={d.initials || ''}
              onChange={(e) => onChange?.({ initials: e.target.value })}
            />
          </div>

          <div>
            <label style={{fontSize:12, opacity:.7}}>Просрочено</label>
            <div>
              <input
                type="checkbox"
                checked={!!d.overdue}
                onChange={(e) => onChange?.({ overdue: e.target.checked })}
              /> <span style={{fontSize:12}}>показать “огонь”</span>
            </div>
          </div>
        </div>

        <div style={foot}>
          <div style={{fontSize:12, opacity:.7}}>
            ID: {task.id}
          </div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={onOpenCalendar}>Открыть календарь</button>
            <button onClick={onClose}>Готово</button>
          </div>
        </div>
      </div>
    </div>
  );
}
