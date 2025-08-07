import { useState } from 'react';
import './rulemenu.css';

const RULES = [
   { id: '',           label: 'Без условия' },
  { id: 'afterAny',  label: 'После завершения любой связанной' },
  { id: 'afterAnyDelay',  label: '…через X-дней (⏰)' },
  { id: 'afterAnyDate',   label: '…в дату (📅)' },
  { id: 'atDate',         label: 'Запуск в конкретную дату (📅)' },
  { id: 'afterAll',       label: 'Только после завершения всех связанных' },
  { id: 'afterSelected',  label: 'После завершения выбранных связей' },
  { id: 'cancelIfPrevCanceled',          label: 'Отменить, если предыдущая отменена' },
  { id: 'cancelIfAnySelectedCanceled',   label: 'Отменить, если одна из выбранных отменена' },
];

export default function RuleMenu({ value, onChange, onCancel, onFreeze }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rule-wrapper">
      <button className="rule-btn" onClick={() => setOpen(o => !o)}>⚙️</button>

      {open && (
        <div className="rule-menu">
          <strong style={{ fontSize: 11 }}>Запустить после:</strong>
          {RULES.map(r => (
            <label key={r.id}>
              <input
                type="radio"
                name="rule"
                checked={value === r.id}
                onChange={() => onChange(r.id)}
              />
              {r.label}
            </label>
          ))}

          <hr />
          <button onClick={onCancel}>❌ Отмена</button>
          <button onClick={onFreeze}>❄️ Заморозить</button>
        </div>
      )}
    </div>
  );
}
