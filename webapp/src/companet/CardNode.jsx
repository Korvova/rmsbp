import { Handle, Position } from 'reactflow';
import './card.css';           //-— стили остаются
                                //   (кнопку "×" добавим ниже)

export default function CardNode({ id, data }) {
  const { label, color, onTitle, onColor, onDelete } = data;

  return (
    <div className="card" style={{ background: color }}>
      {/* название */}
      <input
        className="title"
        value={label}
        onChange={e => onTitle(id, e.target.value)}
      />

      {/* выбор цвета */}
      <input
        type="color"
        value={color}
        onChange={e => onColor(id, e.target.value)}
        title="Цвет карточки"
      />

      {/* удалить */}
     <button className="close" onClick={() => onDelete?.(id)}>×</button>

      {/* коннекторы */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
