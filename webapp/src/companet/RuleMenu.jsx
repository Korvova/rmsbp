import { useState } from 'react';
import './rulemenu.css';

const START_RULES = [
  { id: '',              label: 'Без условия' },
  { id: 'afterAny',      label: 'После завершения любой связанной' },
  { id: 'afterAnyDelay', label: '…через X-дней (⏰)' },
  { id: 'afterAnyDate',  label: '…в дату (📅)' },
  { id: 'atDate',        label: 'Запуск в конкретную дату (📅)' },
  { id: 'afterAll',      label: 'Только после завершения всех связанных' },
  { id: 'afterSelected', label: 'После завершения выбранных связей' },
];

const CANCEL_MODES = [
  { id: 'none',                label: 'Ничего не делать' },
  { id: 'prevCanceled',        label: 'Отменить, если предыдущая отменена' },
  { id: 'anySelectedCanceled', label: 'Отменить, если одна из выбранных отменена' },
];

export default function RuleMenu({
  value, onChange,

  cancelPolicy,
  onCancelPolicyToggle,
  onCancelPolicyChange,

  deps = [],

  selectedDeps = [],
  onToggleDep,

  cancelSelectedDeps = [],
  onToggleCancelDep,

  onCancel, onFreeze,
}) {
  const [open, setOpen] = useState(false);

  const showStartPicker  = value === 'afterSelected';
  const showCancelPicker = !!(cancelPolicy?.enabled && cancelPolicy?.mode === 'anySelectedCanceled');

  return (
    <div className="rule-wrapper">
      <button
        type="button"
        className="rule-btn"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Настройки"
      >
        ⚙️
      </button>

      {open ? (
        <div className="rule-menu" role="dialog">
          {/* ── Запуск ── */}
          <section className="rule-section">
            <div className="rule-title">Запустить после:</div>

            <div className="rule-options">
              {START_RULES.map(r => (
                <div key={r.id}>
                  <label>
                    <input
                      type="radio"
                      name="start_rule"
                      checked={value === r.id}
                      onChange={() => onChange(r.id)}
                    />
                    {r.label}
                  </label>

                  {/* список ВСТАВЛЯЕМ ПРЯМО ПОД afterSelected */}
                  {r.id === 'afterSelected' && showStartPicker && (
                    <div className="deps-inline">
                      {deps.length === 0 ? (
                        <div className="muted">Нет входящих связей</div>
                      ) : (
                        deps.map(d => (
                          <label key={d.edgeId}>
                            <input
                              type="checkbox"
                              checked={selectedDeps.includes(d.edgeId)}
                              onChange={e => onToggleDep?.(d.edgeId, e.target.checked)}
                            />
                            {d.label}
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Отмена ── */}
          <section className="rule-section">
            <div className="rule-title">Политика отмены:</div>

            <div className="rule-options">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={!!cancelPolicy?.enabled}
                  onChange={e => onCancelPolicyToggle?.(e.target.checked)}
                />
                Включить
              </label>

              <fieldset disabled={!cancelPolicy?.enabled} className="cancel-group">
                {CANCEL_MODES.map(m => (
                  <div key={m.id}>
                    <label>
                      <input
                        type="radio"
                        name="cancel_mode"
                        checked={cancelPolicy?.mode === m.id}
                        onChange={() => onCancelPolicyChange?.(m.id)}
                      />
                      {m.label}
                    </label>

                    {/* список ВСТАВЛЯЕМ ПРЯМО ПОД anySelectedCanceled */}
                    {m.id === 'anySelectedCanceled' && showCancelPicker && (
                      <div className="deps-inline">
                        {deps.length === 0 ? (
                          <div className="muted">Нет входящих связей</div>
                        ) : (
                          deps.map(d => (
                            <label key={d.edgeId}>
                              <input
                                type="checkbox"
                                checked={cancelSelectedDeps.includes(d.edgeId)}
                                onChange={e => onToggleCancelDep?.(d.edgeId, e.target.checked)}
                              />
                              {d.label}
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </fieldset>
            </div>
          </section>

          <hr />
          <div className="rule-actions">
            <button type="button" onClick={onCancel}>❌ Отмена</button>
            <button type="button" onClick={onFreeze}>❄️ Заморозить</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
