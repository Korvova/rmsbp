import { useEffect, useMemo, useState } from 'react';
import {
  ORG_CHANGED_EVENT,
  listDepartments, createDepartment, renameDepartment, deleteDepartment,
  listMembers, createMember, updateMember, deleteMember,
} from '../service/orgStorage';
import ProfileMenu from '../companet/ProfileMenu';
import './MembersPage.css';

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
    <div className="members-layout">
      {/* Верхняя панель */}
      <div className="topbar">
        <h2 className="topbar__title" onClick={() => (window.location.href = '/')}>
          <span aria-hidden>←</span> На главную
        </h2>
        <ProfileMenu />
      </div>

      {/* Контент */}
      <div className="members-content">
        {/* LEFT: Departments */}
        <aside className="side">
          <h3>Подразделения</h3>

          <div className="side__add">
            <input
              className="input"
              value={newDepName}
              onChange={e => setNewDepName(e.target.value)}
              placeholder="Название подразделения"
            />
            <button className="btn btn--primary" onClick={onAddDep}>+ Добавить</button>
          </div>

          <div className="dep-list">
            <div className={`dep-item dep-item--ghost ${currentDepId === null ? 'dep-item--active' : ''}`}>
              <button
                className="dep-item__title"
                onClick={() => setCurrentDepId(null)}
              >
                Все подразделения
              </button>
            </div>

            {departments.map(d => (
              <div
                key={d.id}
                className={`dep-item ${currentDepId === d.id ? 'dep-item--active' : ''}`}
              >
                <button
                  className="dep-item__title"
                  onClick={() => setCurrentDepId(d.id)}
                  title="Показать участников этого подразделения"
                >
                  {d.name}
                </button>
                <button className="icon-btn" onClick={() => onRenameDep(d)} title="Переименовать">✏️</button>
                <button className="icon-btn" onClick={() => onDeleteDep(d)} title="Удалить">🗑</button>
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT: Members Table */}
        <main className="main">
          <div className="main__head">
            <div>
              <h2 className="h2">Участники</h2>
              <div className="muted">
                {currentDepId
                  ? `Фильтр: ${depNameById(currentDepId)}`
                  : 'Фильтр: все подразделения'}
              </div>
            </div>
            <button className="btn btn--primary" onClick={openAdd}>+ Добавить пользователя</button>
          </div>

          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>ФИО</Th>
                  <Th>Телефон</Th>
                  <Th>Почта</Th>
                  <Th>Подразделение</Th>
                  <Th style={{ minWidth: 220 }}>Функциональные обязанности</Th>
                  <Th>Статус</Th>
                  <Th>Ред.</Th>
                </tr>
              </thead>
              <tbody>
                {membersFiltered.map(m => (
                  <tr key={m.id}>
                    <Td><code className="code">{m.uniqueId || '—'}</code></Td>
                    <Td>{m.fullName || '—'}</Td>
                    <Td>{m.phone || '—'}</Td>
                    <Td>{m.email || '—'}</Td>
                    <Td>{depNameById(m.departmentId) || '—'}</Td>
                    <Td>
                      {(m.responsibilities || []).length
                        ? (m.responsibilities || []).join(', ')
                        : '—'}
                    </Td>
                    <Td>{renderStatusChip(m.status)}</Td>
                    <Td>
                      <button className="btn btn--small" onClick={() => openEdit(m)}>Редактировать</button>
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
        </main>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal__dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h3 style={{ margin:0 }}>
                {memberForm.id ? 'Редактировать участника' : 'Добавить участника'}
              </h3>
              <button className="icon-btn" onClick={closeModal} title="Закрыть">✖</button>
            </div>

            <div className="modal__grid">
              <input
                className="input"
                placeholder="ФИО"
                value={memberForm.fullName}
                onChange={e => setMemberForm(s => ({ ...s, fullName: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Почта"
                value={memberForm.email}
                onChange={e => setMemberForm(s => ({ ...s, email: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Телефон"
                value={memberForm.phone}
                onChange={e => setMemberForm(s => ({ ...s, phone: e.target.value }))}
              />
              <select
                className="select"
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
                className="input"
                placeholder="Уникальный ID (можно оставить пустым)"
                value={memberForm.uniqueId}
                onChange={e => setMemberForm(s => ({ ...s, uniqueId: e.target.value }))}
                title="Если оставить пустым при создании — будет сгенерирован"
                style={{ gridColumn:'1 / -1' }}
              />

              <select
                className="select"
                value={memberForm.departmentId ?? ''}
                onChange={e => setMemberForm(s => ({ ...s, departmentId: e.target.value || null }))}
                title="Привязка к подразделению"
                style={{ gridColumn:'1 / -1' }}
              >
                <option value="">Без подразделения</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <textarea
                className="textarea"
                placeholder="Функциональные обязанности (каждая с новой строки)"
                value={memberForm.responsibilitiesText}
                onChange={e => setMemberForm(s => ({ ...s, responsibilitiesText: e.target.value }))}
                style={{ gridColumn:'1 / -1', minHeight:120 }}
              />
            </div>

            <div className="modal__footer">
              {memberForm.id ? (
                <button className="btn btn--danger" onClick={removeMember}>Удалить</button>
              ) : <span />}
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn--ghost" onClick={closeModal}>Отмена</button>
                <button className="btn btn--primary" onClick={saveMember}>
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
    <th style={style} {...rest}>{children}</th>
  );
}
function Td({ children, style, ...rest }) {
  return (
    <td style={style} {...rest}>{children}</td>
  );
}
function renderStatusChip(s) {
  if (s === 'authorized') return <span className="chip chip--authorized">авторизован</span>;
  if (s === 'pending') return <span className="chip chip--pending">отправлено, ждём</span>;
  if (s === 'invited') return <span className="chip chip--invited">приглашение отправить</span>;
  return <span className="chip">—</span>;
}
