import { Handle, Position, NodeToolbar } from 'reactflow';
import StatusToggle from './StatusToggle';
import DifficultyBadge from './DifficultyBadge';
import RuleMenu from './RuleMenu';
import './card.css';

export default function CardNode({ id, data }) {
  const {
    label,
    color,
    done,
    rule,
    status = 'pending',
    // 👇 новые поля (можешь позже заполнять через меню-быстрого создания)
    initials,
    avatarUrl,
    difficulty,         // число 1..10
    taskType,           // строка, например "кодинг"
    onTitle,
    onColor,
    onToggle,
    onDelete,
    onRuleChange,
    onCancel,
    onFreeze,
  } = data;

  const cardColor = {
    pending: done ? '#8BC34A' : color,
    working: '#2196F3',
    done:    '#8BC34A',
    cancel:  '#F44336',
    frozen:  '#B0BEC5',
  }[status];

  return (
    <div className="card" style={{ background: cardColor }}>
     <NodeToolbar position={Position.Top}>
        <button onClick={() => onToggle?.(id, !done)}>{done ? '↺' : '✓'}</button>
        <button onClick={() => onDelete?.(id)}>🗑</button>
        <RuleMenu
          value={rule}
          onChange={val => onRuleChange?.(id, val)}
          onCancel={() => onCancel?.(id)}
          onFreeze={() => onFreeze?.(id)}
        />
      </NodeToolbar>

      {/* Заголовок */}
      <input
        className="title"
        value={label}
        onChange={(e) => onTitle?.(id, e.target.value)}
      />

      {/* Ряд: аватар/инициалы + кружок сложности */}
      <div className="meta-row">
        <StatusToggle avatarUrl={avatarUrl} initials={initials} />
        <DifficultyBadge value={difficulty} />
      </div>

      {/* Тип задачи (по умолчанию «без типа») */}
      <div className="type-pill">Тип: {taskType?.trim() || 'без типа'}</div>

      {/* Выбор цвета (оставим как было) */}
      <input
        type="color"
        value={color}
        onChange={e => onColor?.(id, e.target.value)}
        title="Цвет"
      />

      <button className="close" onClick={() => onDelete?.(id)}>×</button>

      <Handle type="target" position={Position.Left}  />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
