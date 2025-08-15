// /webapp/src/page/MembersPage.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  ORG_CHANGED_EVENT,
  listDepartments, createDepartment, renameDepartment, deleteDepartment,
  listMembers, createMember, updateMember, deleteMember,
} from '../service/orgStorage';

import ProfileMenu from '../companet/ProfileMenu';

export default function MembersPage() {
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentDepId, setCurrentDepId] = useState(null);

  // левая панель — добавление подразделений
  const [newDepName, setNewDepName] = useState('');

  // модалка участника
  const [modalOpen, setModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({
    id: null, fullName: '', email: '', phone: '',
    status: 'none', uniqueId: '', responsibilitiesText: '',
    departmentId: null,
  });

  const refresh = () => {
    setDepartments(listDepartments());
    setMembers(listMembers());
  };

  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener(ORG_CHANGED_EVENT, h);
    return () => window.removeEventListener(ORG_CHANGED_EVENT, h);
  }, []);

  const membersFiltered = useMemo(
    () => members.filter(m => (currentDepId ? m.departmentId === currentDepId : true)),
    [members, currentDepId]
  );

  // ===== Departments (слева) =====
  const onAddDep = () => {
    const name = newDepName.trim() || 'Новое подразделение';
    createDepartment(name);
    setNewDepName('');
  };
  const onRenameDep = (d) => {
    const t = prompt('Переименовать подразделение', d.name);
    if (t && t.trim()) renameDepartment(d.id, t.trim());
  };
  const onDeleteDep = (d) => {
    if (confirm(`Удалить подразделение "${d.name}"? У участников пропадёт привязка.`)) {
      deleteDepartment(d.id);
      if (currentDepId === d.id) setCurrentDepId(null);
    }
  };

  // ===== Modal helpers =====
  const openAdd = () => {
    setMemberForm({
      id: null,
      fullName: '',
      email: '',
      phone: '',
      status: 'none',
      uniqueId: '',
      responsibilitiesText: '',
      departmentId: currentDepId || null,
    });
    setModalOpen(true);
  };
  const openEdit = (m) => {
    setMemberForm({
      id: m.id,
      fullName: m.fullName || '',
      email: m.email || '',
      phone: m.phone || '',
      status: m.status || 'none',
      uniqueId: m.uniqueId || '',
      responsibilitiesText: (m.responsibilities || []).join('\n'),
      departmentId: m.departmentId || null,
    });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const saveMember = () => {
    const payload = {
      fullName: memberForm.fullName.trim(),
      email: memberForm.email.trim(),
      phone: memberForm.phone.trim(),
      status: memberForm.status,
      uniqueId: memberForm.uniqueId.trim(),
      responsibilities: memberForm.responsibilitiesText
        .split('\n').map(s => s.trim()).filter(Boolean),
      departmentId: memberForm.departmentId || null,
    };
    if (memberForm.id) {
      updateMember(memberForm.id, payload);
    } else {
      createMember(payload);
    }
    setModalOpen(false);
  };
  const removeMember = () => {
    if (!memberForm.id) return;
    if (confirm('Удалить участника?')) {
      deleteMember(memberForm.id);
      setModalOpen(false);
    }
  };

  const depNameById = (id) => departments.find(d => d.id === id)?.name || '';

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto 1fr', height:'100vh' }}>
      {/* Верхняя панель */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'8px 16px', borderBottom:'1px solid #e5e7eb', background:'#fff'
      }}>
        <h2
          style={{ margin:0, fontSize:18, cursor:'pointer' }}
          onClick={() => (window.location.href = '/')}
        >
          ← На главную
        </h2>
        <ProfileMenu />
      </div>

      {/* Контент: слева подразделения, справа таблица */}
      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', height:'100%' }}>
        {/* LEFT: Departments */}
        <div style={{ borderRight:'1px solid #e5e7eb', padding:12, overflow:'auto' }}>
          <h3 style={{ marginTop:0 }}>Подразделения</h3>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <input
              value={newDepName}
              onChange={e => setNewDepName(e.target.value)}
              placeholder="Название подразделения"
              style={{ flex:1 }}
            />
            <button onClick={onAddDep}>+ Добавить</button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <button
              style={{
                textAlign:'left', padding:'6px 8px',
                background: currentDepId === null ? '#eef2ff' : 'transparent',
                border:'1px solid #e5e7eb', borderRadius:6
              }}
              onClick={() => setCurrentDepId(null)}
            >
              Все подразделения
            </button>

            {departments.map(d => (
              <div key={d.id}
                   style={{
                     display:'flex', alignItems:'center', gap:6,
                     border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px',
                     background: currentDepId === d.id ? '#eef2ff' : 'transparent'
                   }}>
                <button
                  style={{ flex:1, textAlign:'left', background:'transparent', border:'none', cursor:'pointer' }}
                  onClick={() => setCurrentDepId(d.id)}
                  title="Показать участников этого подразделения"
                >
                  {d.name}
                </button>
                <button onClick={() => onRenameDep(d)} title="Переименовать">✏️</button>
                <button onClick={() => onDeleteDep(d)} title="Удалить">🗑</button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Members Table */}
        <div style={{ padding:16, overflow:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <h2 style={{ margin:0 }}>Участники</h2>
              <div style={{ opacity:.7, fontSize:12 }}>
                {currentDepId
                  ? `Фильтр: ${depNameById(currentDepId)}`
                  : 'Фильтр: все подразделения'}
              </div>
            </div>
            <button onClick={openAdd}>+ Добавить пользователя</button>
          </div>

          <div style={{ border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden', background:'#fff' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead style={{ background:'#f8fafc' }}>
                <tr>
                  <Th>ID</Th>
                  <Th>ФИО</Th>
                  <Th>Телефон</Th>
                  <Th>Почта</Th>
                  <Th>Подразделение</Th>
                  <Th style={{ minWidth:220 }}>Функциональные обязанности</Th>
                  <Th>Статус</Th>
                  <Th>Ред.</Th>
                </tr>
              </thead>
              <tbody>
                {membersFiltered.map(m => (
                  <tr key={m.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <Td><code style={{ fontSize:12 }}>{m.uniqueId}</code></Td>
                    <Td>{m.fullName || '—'}</Td>
                    <Td>{m.phone || '—'}</Td>
                    <Td>{m.email || '—'}</Td>
                    <Td>{depNameById(m.departmentId) || '—'}</Td>
                    <Td>
                      {(m.responsibilities || []).length
                        ? (m.responsibilities || []).join(', ')
                        : '—'}
                    </Td>
                    <Td>{renderStatus(m.status)}</Td>
                    <Td>
                      <button onClick={() => openEdit(m)}>Редактировать</button>
                    </Td>
                  </tr>
                ))}
                {membersFiltered.length === 0 && (
                  <tr>
                    <Td colSpan={8} style={{ textAlign:'center', opacity:.6, padding:'16px 8px' }}>
                      Нет участников в выбранном фильтре
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.25)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
          }}
          onClick={closeModal}
        >
          <div
            style={{
              width:'min(720px, 96vw)', background:'#fff', borderRadius:12,
              border:'1px solid #e5e7eb', boxShadow:'0 20px 60px rgba(0,0,0,.2)',
              padding:16
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0 }}>{memberForm.id ? 'Редактировать участника' : 'Добавить участника'}</h3>
              <button onClick={closeModal} title="Закрыть">✖</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <input
                placeholder="ФИО"
                value={memberForm.fullName}
                onChange={e => setMemberForm(s => ({ ...s, fullName: e.target.value }))}
              />
              <input
                placeholder="Почта"
                value={memberForm.email}
                onChange={e => setMemberForm(s => ({ ...s, email: e.target.value }))}
              />
              <input
                placeholder="Телефон"
                value={memberForm.phone}
                onChange={e => setMemberForm(s => ({ ...s, phone: e.target.value }))}
              />
              <select
                value={memberForm.status}
                onChange={e => setMemberForm(s => ({ ...s, status: e.target.value }))}
                title="Статус приглашения / авторизации"
              >
                <option value="none">— статус</option>
                <option value="invited">приглашение отправить</option>
                <option value="pending">отправлено, ждём</option>
                <option value="authorized">авторизован</option>
              </select>

              <input
                placeholder="Уникальный ID (можно оставить пустым)"
                value={memberForm.uniqueId}
                onChange={e => setMemberForm(s => ({ ...s, uniqueId: e.target.value }))}
                title="Если оставить пустым при создании — будет сгенерирован"
                style={{ gridColumn:'1 / span 2' }}
              />

              <select
                value={memberForm.departmentId ?? ''}
                onChange={e => setMemberForm(s => ({ ...s, departmentId: e.target.value || null }))}
                title="Привязка к подразделению"
                style={{ gridColumn:'1 / span 2' }}
              >
                <option value="">Без подразделения</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <textarea
                placeholder="Функциональные обязанности (каждая с новой строки)"
                value={memberForm.responsibilitiesText}
                onChange={e => setMemberForm(s => ({ ...s, responsibilitiesText: e.target.value }))}
                style={{ gridColumn:'1 / span 2', minHeight:120 }}
              />
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:12 }}>
              {memberForm.id ? (
                <button onClick={removeMember} style={{ color:'#dc2626' }}>Удалить</button>
              ) : <span />}

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={closeModal} style={{ background:'#f3f4f6' }}>Отмена</button>
                <button onClick={saveMember}>
                  {memberForm.id ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ——— helpers ——— */
function Th({ children, style, ...rest }) {
  return (
    <th
      style={{
        textAlign:'left', padding:'10px 12px', fontWeight:600, fontSize:13,
        borderBottom:'1px solid #e5e7eb', ...style
      }}
      {...rest}
    >
      {children}
    </th>
  );
}
function Td({ children, style, ...rest }) {
  return (
    <td
      style={{ padding:'10px 12px', verticalAlign:'top', fontSize:13, ...style }}
      {...rest}
    >
      {children}
    </td>
  );
}
function renderStatus(s) {
  if (s === 'authorized') return 'авторизован';
  if (s === 'pending') return 'отправлено, ждём';
  if (s === 'invited') return 'приглашение отправить';
  return '—';
}
