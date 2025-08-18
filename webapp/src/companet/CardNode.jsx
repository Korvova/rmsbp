import { Handle, Position, NodeToolbar } from 'reactflow';
import { useState, useEffect } from 'react';
import StatusToggle from './StatusToggle';
import RuleMenu from './RuleMenu';
import DescriptionModal from './DescriptionModal';
import './card.css';
import './flame.css';
import iconUrl from '../assets/icon.jpg';


// Читабельные названия для дефолтных id стадий
const STAGE_LABELS = {
  backlog: 'Бэклог',
  todo: 'В работу',
  doing: 'В процессе',
  done: 'Готово',
  cancel: 'Отменено',
  frozen: 'Заморожено',
};


export default function CardNode({ id, data }) {
  const {
    label, color, done, rule, status = 'pending',
    initials, avatarUrl, difficulty, taskType, group,
    stage, stageLabel,    
    calendarLabel,
    onOpenCalendar,   
    description = '',
    onTitle, onToggle, onDelete, onRuleChange,
    onCancel, onFreeze,
    onCancelPolicyToggle, onCancelPolicyChange,
    deps, selectedDeps, onToggleDep,
    cancelPolicy, cancelSelectedDeps, onToggleCancelDep,

  onOpenTask,


    onDescription,
    overdue = false,          // ⬅️ добавили
    onOverdue,                // ⬅️ добавили (коллбэк из Canvas)

   showIcon = false,
   onShowIcon,


  } = data;

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



    <div
      className="card"
      style={{
        background: cardColor,
        opacity: data.isPlaceholder ? 0.45 : 1,
        pointerEvents: data.isPlaceholder ? 'none' : 'auto',
      }}
    >



  {/* Кнопка "полная задача" над карточкой */}
      {!data.isPlaceholder && (
        <button
          className="open-task-btn"
          title="Открыть полную карточку"
          onClick={(e) => { e.stopPropagation(); onOpenTask?.(id); }}
        >
          🗂
        </button>
      )}




      {/* строка календаря */}
      {calendarLabel && !data.isPlaceholder && (
        <div className="calendar-line" title="Открыть в календаре" onClick={() => onOpenCalendar?.(id)}>
          <span>📅</span>
          <span>{calendarLabel}</span>
        </div>
      )}




   {showIcon && !data.isPlaceholder && (
  <img className="card-icon" src={iconUrl} alt="" />
 )}


{overdue && !data.isPlaceholder && (
  <div className="flame-wrap" title="Просрочено">
    <div className="flame-container">
      <div className="flame flame-red" />
      <div className="flame flame-orange" />
      <div className="flame flame-yellow" />
      <div className="flame flame-white" />
    </div>
  </div>
)}



      <input className="title" value={label} onChange={e => onTitle?.(id, e.target.value)} />

      <div className="meta-row">
        <StatusToggle avatarUrl={avatarUrl} initials={initials} />
        {typeof difficulty === 'number' && difficulty > 0 && (
          <span className="difficulty-badge" title="Сложность">{difficulty}</span>
        )}
      </div>

      <div className="meta-tags">
        <span className="type-pill">{taskType || 'Без типа'}</span>
        <span className="stage-pill">
          {stageLabel || STAGE_LABELS[stage] || stage || 'Без стадии'}
        </span>
        <span className="group-pill">{group || 'Без группы'}</span>
      </div>


     {/* Затраты на карточке */}
     {Number(data?.expense) > 0 && (
       <div style={{ fontSize: 12, opacity: .85, marginBottom: 6 }}>
         💶 Затраты: {new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
           .format(Number(data.expense))}
       </div>
     )}




      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <NodeToolbar position={Position.Bottom} align="center" offset={10}>
        <button title="Готово / Сброс" onClick={() => onToggle?.(id, !done)}>{done ? '↺' : '✓'}</button>
        <button title="Удалить" onClick={() => onDelete?.(id)}>🗑</button>
        <button title="Наблюдатели">👁</button>
        <button title="Описание" onClick={() => setDescOpen(true)}>📋</button>
        <button title="Уведомления">🔔</button>
        <button title="Комментарий">💬</button>
        <button title="Календарь" onClick={() => onOpenCalendar?.(id)}>📅</button>
        <button title="Дедлайн">🚩</button>

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
