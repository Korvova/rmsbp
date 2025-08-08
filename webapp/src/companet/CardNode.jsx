import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';

import StatusToggle from './StatusToggle';
import RuleMenu from './RuleMenu';
import './card.css';

export default function CardNode({ id, data }) {
  const {
    label, color,
    done,
    rule,
    status = 'pending',
    initials, avatarUrl,
    difficulty, taskType,
    description = '',

    onTitle, onColor, onToggle, onDelete,
    onRuleChange,
    onCancel, onFreeze,
    onCancelPolicyToggle, onCancelPolicyChange,
    deps, selectedDeps, onToggleDep,
    cancelPolicy, cancelSelectedDeps, onToggleCancelDep,

    /** НОВОЕ: сохраняем описание */
    onDescription,
  } = data;

  // локальное редактирование описания
 const [descOpen, setDescOpen] = useState(false);
 const [descDraft, setDescDraft] = useState(description || '');
 useEffect(() => setDescDraft(description || ''), [description]);

  const cardColor = {
    pending:  done ? '#8BC34A' : color,
    working:  '#2196F3',
    done:     '#8BC34A',
    cancel:   '#F44336',
    frozen:   '#B0BEC5',
  }[status];

  return (
    <div className="card" style={{ background: cardColor }}>
      {/* Заголовок */}
      <input
        className="title"
        value={label}
        onChange={e => onTitle?.(id, e.target.value)}
      />

      {/* ряд под заголовком: аватар + сложность */}
      <div className="meta-row">
        <StatusToggle avatarUrl={avatarUrl} initials={initials} />
        {typeof difficulty === 'number' && difficulty > 0 && (
          <span className="difficulty-badge" title="Сложность">{difficulty}</span>
        )}
      </div>

      {/* тип задачи */}
      <div className="type-pill">{taskType || 'Без типа'}</div>

      {/* коннекторы */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {/* Тулбар СНИЗУ */}
      <NodeToolbar showOnHover position={Position.Bottom}>
        {/* Готово / Сброс */}
        <button title="Готово / Сброс" onClick={() => onToggle?.(id, !done)}>
          {done ? '↺' : '✓'}
        </button>

        {/* Удалить */}
        <button title="Удалить" onClick={() => onDelete?.(id)}>🗑</button>

        {/* Наблюдатели (пока иконка) */}
        <button title="Наблюдатели">👁</button>

        {/* Описание: панель редактирования */}
        <button title="Описание" onClick={() => setDescOpen(v => !v)}>📋</button>

        {/* Уведомления (пока иконка) */}
        <button title="Уведомления">🔔</button>

        {/* Комментарий (пока иконка) */}
        <button title="Комментарий">💬</button>

        {/* Условия: даём и ⚙️ и 🔀 как триггеры одного и того же меню */}
        <RuleMenu
          value={rule}
          onChange={val => onRuleChange?.(id, val)}
          deps={deps}
          selectedDeps={selectedDeps}
          onToggleDep={(edgeId, checked) => onToggleDep?.(id, edgeId, checked)}

          cancelPolicy={cancelPolicy}
          onCancelPolicyToggle={enabled => onCancelPolicyToggle?.(id, enabled)}
          onCancelPolicyChange={mode => onCancelPolicyChange?.(id, mode)}
          cancelSelectedDeps={cancelSelectedDeps}
          onToggleCancelDep={(edgeId, checked) => onToggleCancelDep?.(id, edgeId, checked)}

          onCancel={() => onCancel?.(id)}
          onFreeze={() => onFreeze?.(id)}

          renderTrigger={({ toggle }) => (
            <>
              <button title="Условия" onClick={toggle}>🔀</button>
              <button title="Настройки условий" onClick={toggle}>⚙️</button>
            </>
          )}
        />
      </NodeToolbar>

      {/* Поповер с описанием */}
      {descOpen && (
        <div className="desc-popover">
          <textarea
            value={descDraft}
            onChange={e => setDescDraft(e.target.value)}
            placeholder="Полное описание задачи…"
          />
          <div className="desc-actions">
            <button onClick={() => { setDescOpen(false); setDescDraft(description || ''); }}>Отмена</button>
            <button
              className="primary"
              onClick={() => { onDescription?.(id, descDraft); setDescOpen(false); }}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
