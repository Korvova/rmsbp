import { Handle, Position, NodeToolbar } from 'reactflow';
import { useState, useEffect } from 'react';
import StatusToggle from './StatusToggle';
import RuleMenu from './RuleMenu';
import DescriptionModal from './DescriptionModal';
import './card.css';

export default function CardNode({ id, data }) {
  const {
    label, color, done, rule, status = 'pending',
    initials, avatarUrl, difficulty, taskType,
    description = '',
    onTitle, onToggle, onDelete, onRuleChange,
    onCancel, onFreeze,
    onCancelPolicyToggle, onCancelPolicyChange,
    deps, selectedDeps, onToggleDep,
    cancelPolicy, cancelSelectedDeps, onToggleCancelDep,
    onDescription, // сохраняем описание
  } = data;

  // Локальный стейт для модалки
  const [descOpen, setDescOpen]   = useState(false);
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
      <input className="title" value={label} onChange={e => onTitle?.(id, e.target.value)} />

      <div className="meta-row">
        <StatusToggle avatarUrl={avatarUrl} initials={initials} />
        {typeof difficulty === 'number' && difficulty > 0 && (
          <span className="difficulty-badge" title="Сложность">{difficulty}</span>
        )}
      </div>

      <div className="type-pill">{taskType || 'Без типа'}</div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <NodeToolbar position={Position.Bottom} align="center" offset={10}>
        <button title="Готово / Сброс" onClick={() => onToggle?.(id, !done)}>{done ? '↺' : '✓'}</button>
        <button title="Удалить" onClick={() => onDelete?.(id)}>🗑</button>
        <button title="Наблюдатели">👁</button>
        <button title="Описание" onClick={() => setDescOpen(true)}>📋</button>
        <button title="Уведомления">🔔</button>
        <button title="Комментарий">💬</button>
            <button title="Дедлайн">📅</button>

        <RuleMenu
          value={rule}
          onChange={(val) => onRuleChange?.(id, val)}
          deps={deps}
          selectedDeps={selectedDeps}
          onToggleDep={(edgeId, checked) => onToggleDep?.(id, edgeId, checked)}
          cancelPolicy={cancelPolicy}
          onCancelPolicyToggle={(enabled) => onCancelPolicyToggle?.(id, enabled)}
          onCancelPolicyChange={(mode) => onCancelPolicyChange?.(id, mode)}
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

      {/* Модалка описания */}
      <DescriptionModal
        open={descOpen}
        value={descDraft}
        onChange={setDescDraft}
        onClose={() => { setDescOpen(false); setDescDraft(description || ''); }}
        onSave={() => { onDescription?.(id, descDraft); setDescOpen(false); }}
        title="Описание задачи"
      />
    </div>
  );
}
