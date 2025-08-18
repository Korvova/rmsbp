import { useEffect, useState } from 'react';
import './taskmodal.css';

function formatMoney(n){
  const v = Number(n || 0);
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}
function formatRest(budgetId, budgets, spentMap){
  if (!budgetId) return '—';
  const b = (budgets || []).find(x => x.id === budgetId);
  if (!b) return '—';
  const spent = Number(spentMap?.[budgetId] || 0);
  const rest = Number(b.amount || 0) - spent;
  return `${formatMoney(rest)} (из ${formatMoney(b.amount)})`;
}

export default function TaskModal({
  open,
  task,
  stages = [],
  onClose,
  onChange,       // (patch) => void
  onDelete,       // () => void
  onOpenCalendar, // () => void
  budgets = [],
  spentByBudget = {},
}) {
  // хуки всегда вызываем (для стабильного порядка)
  const [activePanel, setActivePanel] = useState(null); // 'comments'|'people'|'settings'|'watch'|null
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !task) return null;

  const d = task.data || {};
  const STATUS_ITEMS = [
    { key: 'pending',   label: 'Новая' },
    { key: 'working',   label: 'В работе' },
    { key: 'review',    label: 'Ждет' },
    { key: 'done',      label: 'Готово' },
    { key: 'deferred',  label: 'Отложено' },
    { key: 'declined',  label: 'Отклонено' },
  ];

  const togglePanel = (id) => setActivePanel(cur => (cur === id ? null : id));

  const addComment = () => {
    const t = commentText.trim();
    if (!t) return;
    const next = [...(d.comments || []), { id: crypto?.randomUUID?.() ?? String(Date.now()), text: t, ts: Date.now() }];
    onChange?.({ comments: next });
    setCommentText('');
  };

  return (
    <div className="tm-wrap" onClick={onClose}>
      <div className="tm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tm-head">
          <div className="tm-title">Задача</div>
          <div className="tm-actions">
            <button className="tm-icon" title="Открыть в календаре" onClick={onOpenCalendar}>📅</button>
            <button className="tm-icon" title="Удалить" onClick={onDelete}>🗑</button>
            <button className="tm-icon" title="Закрыть" onClick={onClose}>✖</button>
          </div>
        </div>

        {/* Внутренняя «узкая» колонка для гармоничной ширины полей */}
        <div className="tm-inner">
          <div className="tm-grid">
            <div className="tm-col-span-2 tm-field">
              <label>Название</label>
              <input
                className="tm-input"
                value={d.label || ''}
                onChange={(e) => onChange?.({ label: e.target.value })}
              />
            </div>

            <div className="tm-col-span-2 tm-field">
              <label>Описание</label>
              <textarea
                className="tm-textarea"
                value={d.description || ''}
                onChange={(e) => onChange?.({ description: e.target.value })}
              />
            </div>

            <div className="tm-col-span-2 tm-field">
              <label>Ответственный</label>
              <input
                className="tm-input"
                placeholder="ФИО"
                value={d.responsible || ''}
                onChange={(e) => onChange?.({ responsible: e.target.value })}
              />
            </div>

            <div className="tm-field tm-field--range">
              <label>Сложность</label>
              <input
                className="tm-input"
                type="range" min={0} max={10} step={1}
                value={typeof d.difficulty === 'number' ? d.difficulty : 0}
                onChange={(e) => onChange?.({ difficulty: Number(e.target.value) })}
              />
            </div>

            <div className="tm-field">
              <label>Стадия</label>
              <select
                className="tm-input"
                value={d.stage || stages[0]?.id || 'backlog'}
                onChange={(e) => onChange?.({ stage: e.target.value })}
              >
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Бюджет и затраты */}
            <div className="tm-field">
              <label>Статья бюджета</label>
              <select
                className="tm-input"
                value={d.budgetId || ''}
                onChange={(e) => onChange?.({ budgetId: e.target.value })}
              >
                <option value="">— не выбрано</option>
                {(budgets || []).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="tm-muted" style={{ marginTop:6 }}>
                Остаток по статье: {formatRest(d.budgetId, budgets, spentByBudget)}
              </div>
            </div>

            <div className="tm-field">
              <label>Затраты</label>
              <input
                className="tm-input"
                type="number" min="0" step="0.01"
                value={typeof d.expense === 'number' || d.expense ? d.expense : ''}
                onChange={(e) => onChange?.({ expense: Number(e.target.value || 0) })}
                placeholder="0.00"
              />
            </div>

            <div className="tm-col-span-2 tm-field">
              <label>Статус</label>
              <div className="tm-status-row">
                {STATUS_ITEMS.map(s => (
                  <button
                    key={s.key}
                    className={`tm-chip ${d.status === s.key ? 'is-active' : ''}`}
                    onClick={() => onChange?.({ status: s.key })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="tm-foot">
            <div className="tm-id">ID: {task.id}</div>
            <div className="tm-foot-actions">
              <button className="tm-btn" onClick={onOpenCalendar}>Открыть календарь</button>
              <button className="tm-btn tm-btn--primary" onClick={onClose}>Готово</button>
            </div>
          </div>
        </div>

        {/* Боковые круглые кнопки */}
        <div className={`tm-side ${activePanel ? 'tm-side--inset' : ''}`}>
          <button
            className={`tm-side__btn ${activePanel === 'watch' ? 'is-active' : ''}`}
            title="Наблюдать"
            onClick={() => togglePanel('watch')}
          >👁️</button>

          <button
            className={`tm-side__btn ${activePanel === 'settings' ? 'is-active' : ''}`}
            title="Настройки"
            onClick={() => togglePanel('settings')}
          >⚙️</button>

          <button
            className={`tm-side__btn ${activePanel === 'people' ? 'is-active' : ''}`}
            title="Участники"
            onClick={() => togglePanel('people')}
          >👥</button>

          <button
            className={`tm-side__btn ${activePanel === 'comments' ? 'is-active' : ''}`}
            title="Комментарии"
            onClick={() => togglePanel('comments')}
          >💬</button>
        </div>

        {/* Правая выезжающая плашка */}
        <div className={`tm-drawer ${activePanel ? 'is-open' : ''}`}>
          <div className="tm-drawer__head">
            <div className="tm-drawer__title">
              {activePanel === 'comments' && 'Комментарии'}
              {activePanel === 'people'   && 'Участники'}
              {activePanel === 'settings' && 'Настройки'}
              {activePanel === 'watch'    && 'Наблюдать'}
            </div>
            <button className="tm-icon" onClick={() => setActivePanel(null)}>✖</button>
          </div>

          <div className="tm-drawer__body">
            {activePanel === 'comments' && (
              <div className="tm-comments">
                {!(d.comments?.length) ? (
                  <div className="tm-empty">Комментариев пока нет.</div>
                ) : (
                  <ul style={{ paddingLeft: 16, marginTop: 0 }}>
                    {d.comments.map(c => (
                      <li key={c.id} style={{ marginBottom: 8 }}>
                        <div className="tm-muted" style={{ fontSize: 12 }}>
                          {new Date(c.ts).toLocaleString()}
                        </div>
                        <div>{c.text}</div>
                      </li>
                    ))}
                  </ul>
                )}

                <textarea
                  className="tm-textarea"
                  placeholder="Напишите комментарий…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button className="tm-btn tm-btn--primary" onClick={addComment}>Отправить</button>

                <div className="tm-hint">Двойной клик для создания задачи</div>
              </div>
            )}

            {activePanel === 'people' && (
              <div className="tm-people">
                <h4>Постановщик</h4>
                <ul><li>{d.creator || 'Неизвестно'}</li></ul>

                <h4>Наблюдатели</h4>
                {Array.isArray(d.observers) && d.observers.length > 0
                  ? <ul>{d.observers.map((o,i) => <li key={i}>{o}</li>)}</ul>
                  : <div className="tm-muted">Нет наблюдателей</div>
                }

                <h4>Соисполнители</h4>
                {Array.isArray(d.accomplices) && d.accomplices.length > 0
                  ? <ul>{d.accomplices.map((o,i) => <li key={i}>{o}</li>)}</ul>
                  : <div className="tm-muted">Нет соисполнителей</div>
                }
              </div>
            )}

            {activePanel === 'settings' && (
              <div>
                <div className="tm-field">
                  <label>Просрочено</label>
                  <div className="tm-switch">
                    <input
                      type="checkbox"
                      checked={!!d.overdue}
                      onChange={(e) => onChange?.({ overdue: e.target.checked })}
                    />
                    <span className="tm-muted">показывать «огонь» на карточке</span>
                  </div>
                </div>

                <div className="tm-field">
                  <label>Показывать иконку над карточкой</label>
                  <div className="tm-switch">
                    <input
                      type="checkbox"
                      checked={!!d.showIcon}
                      onChange={(e) => onChange?.({ showIcon: e.target.checked })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'watch' && (
              <div>
                <div className="tm-muted">Здесь можно будет включать уведомления/наблюдение.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
