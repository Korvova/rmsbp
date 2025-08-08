// src/companet/DeletableEdge.jsx
import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,        // ← вместо getStraightPath
  useReactFlow,
} from 'reactflow';

export default function DeletableEdge(props) {
  const {
    id,
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    style,
    markerEnd,
    selected,
    animated,
    label,              // ← берём label и labelStyle
    labelStyle,
  } = props;

  const [hover, setHover] = useState(false);
  const { setEdges } = useReactFlow();

  // «как у default» — плавная бэзье-кривая
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        className={animated ? 'animated' : undefined} // даст анимацию пунктиру, если включена
      />

      <EdgeLabelRenderer>
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          {/* лейбл (📅/⏰/текст) — если задан */}
          {label ? (
            <div
              style={{
                padding: '2px 6px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid #e0e0e0',
                fontSize: 12,
                lineHeight: '14px',
                ...(labelStyle || {}),
              }}
            >
              {label}
            </div>
          ) : null}

          {/* крестик — на ховер или когда edge выбран */}
          {(hover || selected) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEdges(es => es.filter(ed => ed.id !== id));
              }}
              title="Удалить связь"
              style={{
                width: 22,
                height: 22,
                lineHeight: '18px',
                borderRadius: 12,
                border: '1px solid #ccc',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
