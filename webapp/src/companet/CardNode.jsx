import { Handle, Position, NodeToolbar } from 'reactflow';
import StatusToggle from './StatusToggle';          // ← новый компонент
import './card.css';

 export default function CardNode({ id, data }) {
  const {
    label,
    color,
    done,              // ✔ состояние чек-бокса
    onTitle,
    onColor,
    onToggle,          // ← новый коллбэк
    onDelete,
  } = data;

   return (
    <div
      className="card"
      style={{ background: done ? '#8BC34A' : color }}  // зелёный если done
    >



      {/* ─── тулбар ─────────────── */}
      <NodeToolbar showOnHover position={Position.Top}>
        <button onClick={() => onToggle?.(id, !done)}>
          {done ? '↺' : '✓'}
        </button>
        <button onClick={() => onDelete?.(id)}>🗑</button>
      </NodeToolbar>
      {/* ────────────────────────── */}



       {/* название */}
       <input
         className="title"
         value={label}
         onChange={e => onTitle?.(id, e.target.value)}
       />

      {/* чек-бокс */}
      <StatusToggle
        checked={done}
        onChange={val => onToggle?.(id, val)}
      />

       {/* выбор цвета */}
       <input
         type="color"
         value={color}
         onChange={e => onColor?.(id, e.target.value)}
         title="Цвет"
       />

       {/* удалить */}
       <button className="close" onClick={() => onDelete?.(id)}>×</button>

       {/* коннекторы */}
       <Handle type="target" position={Position.Left}  />
       <Handle type="source" position={Position.Right} />
     </div>
   );
 }
