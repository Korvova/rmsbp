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
  { id: 'none',                    label: 'Ничего не делать' },
  { id: 'prevCanceled',            label: 'Отменить, если предыдущая отменена' },
  { id: 'anySelectedCanceled',     label: 'Отменить, если одна из выбранных отменена' },
];

export default function RuleMenu({
  value,                         // старт-правило
  onChange,
  cancelPolicy,                  // { enabled:boolean, mode:'none'|'prevCanceled'|'anySelectedCanceled' }
  onCancelPolicyToggle,          // (enabled:boolean)=>void
  onCancelPolicyChange,          // (mode)=>void
  onCancel,                      // кнопка ❌
  onFreeze,                      // кнопка ❄️
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rule-wrapper">
      <button className="rule-btn" onClick={() => setOpen(o => !o)}>⚙️</button>

      {open && (
        <div className="rule-menu">
          <div className="rule-section">
            <div className="rule-title">Запустить после:</div>
            {START_RULES.map(r => (
              <label key={r.id}>
                <input
                  type="radio"
                  name="start_rule"
                  checked={value === r.id}
                  onChange={() => onChange(r.id)}
                />
                {r.label}
              </label>
            ))}
          </div>

          <div className="rule-section">
            <div className="rule-title">Политика отмены:</div>
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
                <label key={m.id}>
                  <input
                    type="radio"
                    name="cancel_mode"
                    checked={cancelPolicy?.mode === m.id}
                    onChange={() => onCancelPolicyChange?.(m.id)}
                  />
                  {m.label}
                </label>
              ))}
            </fieldset>
          </div>

          <hr />
          <div className="rule-actions">
            <button onClick={onCancel}>❌ Отмена</button>
            <button onClick={onFreeze}>❄️ Заморозить</button>
          </div>
        </div>
      )}
    </div>
  );
}
