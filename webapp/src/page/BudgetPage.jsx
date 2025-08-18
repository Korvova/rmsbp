// src/page/BudgetPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadFlow, saveFlow } from '../service/storage';

export default function BudgetPage() {
  const { groupId = 'default' } = useParams();
  const navigate = useNavigate();

  // грузим flow и берём бюджеты + задачи
  const initial = useMemo(() => loadFlow(groupId), [groupId]);
  const [nodes, setNodes] = useState(initial.nodes || []);
  const [edges] = useState(initial.edges || []);
  const [stages] = useState(initial.stages || []);
  const [events] = useState(initial.events || []);
  const [budgets, setBudgets] = useState(Array.isArray(initial.budgets) ? initial.budgets : []);

  useEffect(() => {
    saveFlow(groupId, { nodes, edges, stages, events, budgets });
  }, [groupId, nodes, edges, stages, events, budgets]);

  // агрегируем траты по задачам
  const spentByBudget = useMemo(() => {
    const acc = {};
    for (const n of nodes) {
      const bid = n.data?.budgetId || '';
      const val = Number(n.data?.expense || 0);
      if (!bid || !Number.isFinite(val)) continue;
      acc[bid] = (acc[bid] || 0) + val;
    }
    return acc;
  }, [nodes]);

  // модалка
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', amount: '' });

  const openAdd = () => { setForm({ id: null, name: '', amount: '' }); setModalOpen(true); };
  const openEdit = (b) => { setForm({ id: b.id, name: b.name, amount: String(b.amount ?? '') }); setModalOpen(true); };
  const close = () => setModalOpen(false);

  const saveItem = () => {
    const name = form.name.trim();
    const amount = Number(form.amount);
    if (!name || !Number.isFinite(amount)) return;
    if (form.id) {
      setBudgets(prev => prev.map(b => b.id === form.id ? { ...b, name, amount } : b));
    } else {
      setBudgets(prev => [...prev, { id: crypto.randomUUID(), name, amount }]);
    }
    setModalOpen(false);
  };
  const removeItem = (id) => {
    if (!confirm('Удалить статью бюджета?')) return;
    // снимаем привязку у задач
    setNodes(prev => prev.map(n => (n.data?.budgetId === id ? ({ ...n, data:{ ...n.data, budgetId:'', expense: n.data?.expense || 0 } }) : n)));
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateRows:'auto 1fr' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px' }}>
        <button onClick={() => navigate(`/groups/${groupId}`)}>⟵ К схеме</button>
        <div style={{ fontWeight:600, opacity:.75 }}>Бюджет — группа: {groupId}</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={openAdd}>+ Добавить статью бюджета</button>
        </div>
      </div>

      <div style={{ padding:12, overflow:'auto' }}>
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 6px 18px rgba(0,0,0,.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ background:'#f8fafc' }}>
              <tr>
                {['Статья бюджета','Сумма','Затраты','Остаток','Действия'].map((h,i)=>(
                  <th key={i} style={{ textAlign:'left', padding:'10px 12px', borderTop:'1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {budgets.map(b => {
                const spent = Number(spentByBudget[b.id] || 0);
                const rest = Number(b.amount || 0) - spent;
                return (
                  <tr key={b.id}>
                    <td style={td}>{b.name}</td>
                    <td style={td}>{fmt(Number(b.amount || 0))}</td>
                    <td style={td}>{fmt(spent)}</td>
                    <td style={{ ...td, color: rest < 0 ? '#dc2626' : '#0f172a' }}>{fmt(rest)}</td>
                    <td style={td}>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <button onClick={() => openEdit(b)}>Редактировать</button>
                        <button onClick={() => removeItem(b.id)}>Удалить</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {budgets.length === 0 && (
                <tr><td style={{ ...td, padding:'16px', opacity:.6 }} colSpan={5}>Статей бюджета пока нет.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(2,6,23,.45)', display:'grid', placeItems:'center', zIndex:50 }}
          onClick={close}
        >
          <div
            onClick={(e)=>e.stopPropagation()}
            style={{ width:'min(520px, 95vw)', background:'#fff', border:'1px solid #e5e7eb',
                     borderRadius:12, boxShadow:'0 30px 80px rgba(2,6,23,.35)', padding:16 }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0 }}>{form.id ? 'Редактировать статью' : 'Добавить статью'}</h3>
              <button onClick={close} style={{ border:'1px solid #e5e7eb', borderRadius:8 }}>✖</button>
            </div>
            <div style={{ display:'grid', gap:10 }}>
              <input
                placeholder="Название статьи бюджета"
                value={form.name}
                onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                style={inp}
              />
              <input
                type="number" min="0" step="0.01"
                placeholder="Сумма"
                value={form.amount}
                onChange={e => setForm(s => ({ ...s, amount: e.target.value }))}
                style={inp}
              />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
              <button onClick={close} style={btn}>Отмена</button>
              <button onClick={saveItem} style={{ ...btn, background:'#4f46e5', color:'#fff', borderColor:'#4f46e5' }}>
                {form.id ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const td  = { padding:'10px 12px', borderTop:'1px solid #f1f5f9', verticalAlign:'top' };
const inp = { width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 };
const btn = { padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8, background:'#f3f4f6' };
const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
