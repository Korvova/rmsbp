import { Handle, Position, NodeToolbar } from 'reactflow';
import { useState, useEffect } from 'react';
import RuleMenu from './RuleMenu';
import './card.css';

export default function CheckerNode({ id, data }) {
  const {
    label = 'Checker',
    status = 'pending',
    rule, cancelPolicy,
    deps = [], selectedDeps = [], onToggleDep,
    cancelSelectedDeps = [], onToggleCancelDep,
    onRuleChange, onCancelPolicyToggle, onCancelPolicyChange,
    overdue = false, onOverdue, showIcon = false, onShowIcon,

    checkerKind = 'http-get',

    // http-get
    url = '', onUrlChange,

    // at-datetime
    dueAt = '', onDueAtChange,
  } = data || {};

  const [locUrl, setLocUrl] = useState(url || '');
  useEffect(() => setLocUrl(url || ''), [url]);

  const [locDue, setLocDue] = useState(dueAt || '');
  useEffect(() => setLocDue(dueAt || ''), [dueAt]);

const cardColor = {
  pending:   '#eeebdd',
  scheduled: '#FFE082', // 🟨 ожидание времени
  working:   '#2196F3', // 🟦
  done:      '#8BC34A', // 🟩
  cancel:    '#F44336',
  frozen:    '#B0BEC5',
}[status] || '#eeebdd';

  const titleByKind = checkerKind === 'http-get'
    ? 'HTTP GET'
    : checkerKind === 'at-datetime'
    ? 'Готово в дату/время'
    : checkerKind;

  return (
    <div className="card" style={{ background: cardColor }}>
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
        🤖 Чекер: {titleByKind}
      </div>

      <input
        className="title"
        placeholder="Название (необязательно)"
        value={label}
        onChange={(e) => data?.onTitle?.(id, e.target.value)}
      />

      <div className="meta-tags" style={{ alignItems:'center' }}>
        <span className="type-pill">automation</span>
        <span className="group-pill">{data?.group || 'Без группы'}</span>
      </div>

      {checkerKind === 'http-get' && (
        <>
          <div style={{ fontSize:12, opacity:.75, marginBottom:4 }}>URL</div>
          <input
            className="tm-input"
            style={{ fontSize:12, padding:'6px 8px' }}
            placeholder="https://example.com/hook"
            value={locUrl}
            onChange={(e) => setLocUrl(e.target.value)}
            onBlur={() => onUrlChange?.(id, locUrl)}
          />
        </>
      )}

      {checkerKind === 'at-datetime' && (
        <>
          <div style={{ fontSize:12, opacity:.75, marginBottom:4 }}>Дата и время</div>
          <input
            className="tm-input"
            style={{ fontSize:12, padding:'6px 8px' }}
            type="datetime-local"
            value={locDue}
            onChange={(e) => setLocDue(e.target.value)}
            onBlur={() => onDueAtChange?.(id, locDue)}
          />
          <div style={{ fontSize:11, opacity:.65, marginTop:4 }}>
            При переходе в «В работе» завершится автоматически в указанный момент.
          </div>
        </>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <NodeToolbar position={Position.Bottom} align="center" offset={10}>
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
          overdue={overdue}
          onOverdueChange={(val) => onOverdue?.(id, val)}
          showIcon={showIcon}
          onShowIconChange={(val) => onShowIcon?.(id, val)}
          renderTrigger={({ toggle }) => (
            <>
              <button title="Условия" onClick={toggle}>🔀</button>
              <button title="Настройки условий" onClick={toggle}>⚙️</button>
            </>
          )}
        />
      </NodeToolbar>
    </div>
  );
}
