import { Handle, Position, NodeToolbar } from 'reactflow';
import StatusToggle from './StatusToggle';
import RuleMenu from './RuleMenu';
import FlameBadge from './FlameBadge';
import './card.css';

export default function CardNode({ id, data }) {
  const {
    label, color, done, rule, status = 'pending',
    cancelPolicy, selectedDeps = [], cancelSelectedDeps = [], deps = [],
    overdue = false,
    onTitle, onColor, onToggle, onDelete,
    onRuleChange, onCancel, onFreeze,
    onCancelPolicyToggle, onCancelPolicyChange,
    onToggleDep, onToggleCancelDep,
    onOverdue,
  } = data;

  const cardColor = {
    pending: done ? '#8BC34A' : color,
    working: '#2196F3',
    done:    '#8BC34A',
    cancel:  '#F44336',
    frozen:  '#B0BEC5',
  }[status];

  return (
    <div className="card" style={{ background: cardColor, position: 'relative' }}>
      {overdue && <FlameBadge />}

      <NodeToolbar showOnHover position={Position.Top}>
        <button onClick={() => onToggle?.(id, !done)}>{done ? '↺' : '✓'}</button>
        <button onClick={() => onDelete?.(id)}>🗑</button>

        <RuleMenu
          value={rule}
          onChange={(val) => onRuleChange?.(id, val)}

          cancelPolicy={cancelPolicy}
          onCancelPolicyToggle={(enabled) => onCancelPolicyToggle?.(id, enabled)}
          onCancelPolicyChange={(mode) => onCancelPolicyChange?.(id, mode)}

          deps={deps}
          selectedDeps={selectedDeps}
          onToggleDep={(edgeId, checked) => onToggleDep?.(id, edgeId, checked)}
          cancelSelectedDeps={cancelSelectedDeps}
          onToggleCancelDep={(edgeId, checked) => onToggleCancelDep?.(id, edgeId, checked)}

          overdue={overdue}
          onOverdueChange={(v) => onOverdue?.(id, v)}

          onCancel={() => onCancel?.(id)}
          onFreeze={() => onFreeze?.(id)}
        />
      </NodeToolbar>

      <input className="title" value={label} onChange={(e) => onTitle?.(id, e.target.value)} />

      <StatusToggle checked={done} onChange={(val) => onToggle?.(id, val)} />

      <input type="color" value={color} onChange={(e) => onColor?.(id, e.target.value)} title="Цвет" />

      <button className="close" onClick={() => onDelete?.(id)}>×</button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
