// src/page/KanbanPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { loadFlow, saveFlow } from '../service/storage';

export default function KanbanPage() {
  const { groupId = 'default' } = useParams();
  const navigate = useNavigate();

  const initial = useMemo(() => loadFlow(groupId), [groupId]);
  const [stages, setStages] = useState(initial.stages || []);
  const [nodes, setNodes] = useState(
    (initial.nodes || []).map(n => ({
      ...n,
      data: { stage: 'backlog', ...n.data }, // страховка
    }))
  );
  const [edges] = useState(initial.edges || []);

useEffect(() => {
  const prev = loadFlow(groupId);
  const events = Array.isArray(prev?.events) ? prev.events : [];
  const budgets = Array.isArray(prev?.budgets) ? prev.budgets : [];
  saveFlow(groupId, { nodes, edges, stages, events, budgets });
}, [groupId, nodes, edges, stages]);


  const groupNodesByStage = useMemo(() => {
    const by = Object.fromEntries(stages.map(s => [s.id, []]));
    for (const n of nodes) {
      const st = n.data?.stage || stages[0]?.id;
      if (!by[st]) by[st] = [];
      by[st].push(n);
    }
    return by;
  }, [nodes, stages]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;

    // перетаскиваем колонку
    if (type === 'COLUMN') {
      if (destination.index === source.index) return;
      const copy = [...stages];
      const [moved] = copy.splice(source.index, 1);
      copy.splice(destination.index, 0, moved);
      setStages(copy);
      return;
    }

    // перетаскиваем карточку
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const toStage = destination.droppableId;

    setNodes(prev =>
      prev.map(n => (n.id === draggableId ? { ...n, data: { ...n.data, stage: toStage } } : n))
    );
  };

  const addStage = () => {
    const name = prompt('Название стадии', 'Новая стадия');
    if (!name) return;
    const id = genId('stage');
    setStages(s => [...s, { id, name }]);
  };
  const renameStage = (id) => {
    const cur = stages.find(s => s.id === id);
    if (!cur) return;
    const name = prompt('Переименовать стадию', cur.name);
    if (!name) return;
    setStages(s => s.map(x => (x.id === id ? { ...x, name } : x)));
  };
  const removeStage = (id) => {
    const hasCards = nodes.some(n => (n.data?.stage || stages[0]?.id) === id);
    if (hasCards) return alert('Нельзя удалить стадию с задачами');
    setStages(s => s.filter(x => x.id !== id));
  };

  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateRows:'auto 1fr' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px' }}>
        <button onClick={() => navigate(`/groups/${groupId}`)}>⟵ К схеме</button>
        <div style={{ fontWeight:600, opacity:.75 }}>Канбан — группа: {groupId}</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={addStage}>+ Стадия</button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ display:'flex', gap:12, padding:12, overflow:'auto', height:'100%' }}
            >
              {stages.map((col, colIdx) => {
                const cards = groupNodesByStage[col.id] || [];
                return (
                  <Draggable draggableId={`col-${col.id}`} index={colIdx} key={col.id}>
                    {(colDrag) => (
                      <div
                        ref={colDrag.innerRef}
                        {...colDrag.draggableProps}
                        style={{
                          ...colDrag.draggableProps.style,
                          background:'#fff',
                          border:'1px solid #e5e7eb',
                          borderRadius:12,
                          minWidth:280,
                          maxWidth:320,
                          display:'flex',
                          flexDirection:'column',
                          boxShadow:'0 6px 18px rgba(0,0,0,.06)',
                        }}
                      >
                        <div
                          {...colDrag.dragHandleProps}
                          style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                                   padding:'8px 10px', borderBottom:'1px solid #eef2f7', background:'#f8fafc' }}
                        >
                          <strong>{col.name}</strong>
                          <span style={{ display:'flex', gap:6 }}>
                            <button onClick={() => renameStage(col.id)} title="Переименовать">✏️</button>
                            <button onClick={() => removeStage(col.id)} title="Удалить">🗑</button>
                          </span>
                        </div>

                        <Droppable droppableId={col.id} type="CARD">
                          {(drop) => (
                            <div
                              ref={drop.innerRef}
                              {...drop.droppableProps}
                              style={{ padding:10, display:'grid', gap:8, minHeight:40 }}
                            >
                              {cards.map((n, idx) => (
                                <Draggable draggableId={n.id} index={idx} key={n.id}>
                                  {(drag) => (
                                    <div
                                      ref={drag.innerRef}
                                      {...drag.draggableProps}
                                      {...drag.dragHandleProps}
                                      style={{
                                        ...drag.draggableProps.style,
                                        border:'1px solid #e5e7eb',
                                        borderRadius:10,
                                        padding:'10px 12px',
                                        background:'#ffffff',
                                        boxShadow:'0 2px 6px rgba(0,0,0,.06)',
                                      }}
                                      title={n.data?.description || ''}
                                    >
                                      <div style={{ fontWeight:600 }}>{n.data?.label || 'Без названия'}</div>
                                      <div style={{ fontSize:12, opacity:.7, marginTop:4 }}>
                                        {renderMeta(n)}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {drop.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

function renderMeta(n) {
  const p = [];
  if (n.data?.taskType) p.push(`Тип: ${n.data.taskType}`);
  if (Number.isFinite(n.data?.difficulty)) p.push(`Сложн.: ${n.data.difficulty}`);
  if (n.data?.status) p.push(`Статус: ${n.data.status}`);
  return p.join(' · ');
}
function genId(p='id') { return `${p}_${Math.random().toString(36).slice(2,8)}`; }
