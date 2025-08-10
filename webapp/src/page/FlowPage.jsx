// src/page/FlowPage.jsx
import {
  ReactFlowProvider,
  useReactFlow,
  ReactFlow,
  addEdge,
  Controls,
  Background,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'reactflow/dist/style.css';

import { loadFlow, saveFlow } from '../service/storage';
import CardNode      from '../companet/CardNode';
import Toolbar       from '../companet/Toolbar';
import DeletableEdge from '../companet/DeletableEdge';
import QuickMenu     from '../companet/QuickMenu';




const NODE_TYPES = { card: CardNode };
const EDGE_TYPES = { deletable: DeletableEdge };

const initialDraft = { title:null, conditionId:'', conditionLabel:'', assignee:null, difficulty:null, type:null };

export default function FlowPage() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}

function Canvas() {
  const rf            = useReactFlow();
  const connectRef    = useRef(null);
  const wrapperRef    = useRef(null);
  const didConnectRef = useRef(false);

  // ↓ НОВОЕ: подавляем клик, который приходит сразу после mouseup
const suppressClickRef = useRef(false);

const cloneDragRef = useRef({
  active: false,
  nodeId: null,
  startPos: null,
  placeholderId: null,
});




  const [quickMenu, setQuickMenu] = useState({ show: false, x: 0, y: 0 });
  const [draft, setDraft]         = useState(initialDraft);
  const [composing, setComposing] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // фабрика узла с коллбэками
  const makeNode = useCallback(
    (raw) => ({
      ...raw,
      data: {
        done: false,
        status: 'pending',
        cancelPolicy: { enabled: false, mode: 'none' },
        selectedDeps: [], cancelSelectedDeps: [],
        overdue: false,
        initials: '', avatarUrl: '',
        difficulty: 0, taskType: '', description: '',
        ...raw.data,

        onTitle: (id, t) =>
          setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, label:t } } : n)),
        onColor: (id, c) =>
          setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, color:c } } : n)),
        onToggle: (id, val) =>
          setNodes(ns => ns.map(n =>
            n.id === id ? { ...n, data:{ ...n.data, done:val, status: val ? 'done' : n.data.status } } : n
          )),

        onCancel: (id) =>
          setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, status:'cancel' } } : n)),
        onFreeze: (id) =>
          setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, status:'frozen' } } : n)),

        onCancelPolicyToggle: (id, enabled) =>
          setNodes(ns => ns.map(n =>
            n.id === id ? { ...n, data:{ ...n.data, cancelPolicy:{ ...n.data.cancelPolicy, enabled } } } : n
          )),
        onCancelPolicyChange: (id, mode) =>
          setNodes(ns => ns.map(n =>
            n.id === id ? { ...n, data:{ ...n.data, cancelPolicy:{ ...n.data.cancelPolicy, mode } } } : n
          )),

        onDescription: (id, text) =>
          setNodes(ns => ns.map(n =>
            n.id === id ? { ...n, data:{ ...n.data, description: text } } : n
          )),

        onToggleDep: (id, edgeId, checked) =>
          setNodes(ns => ns.map(n => {
            if (n.id !== id) return n;
            const cur  = n.data.selectedDeps || [];
            const next = checked ? Array.from(new Set([...cur, edgeId])) : cur.filter(x => x !== edgeId);
            return { ...n, data:{ ...n.data, selectedDeps: next } };
          })),
        onToggleCancelDep: (id, edgeId, checked) =>
          setNodes(ns => ns.map(n => {
            if (n.id !== id) return n;
            const cur  = n.data.cancelSelectedDeps || [];
            const next = checked ? Array.from(new Set([...cur, edgeId])) : cur.filter(x => x !== edgeId);
            return { ...n, data:{ ...n.data, cancelSelectedDeps: next } };
          })),

        onDelete: (id) => {
          setNodes(ns => ns.filter(n => n.id !== id));
          setEdges(es => es.filter(e => e.source !== id && e.target !== id));
        },

        onRuleChange: (id, val) =>
          setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, rule:val } } : n)),

        onOverdue: (id, val) =>
          setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, overdue: !!val } } : n)),
      },
    }),
    [setNodes, setEdges]
  );

  // загрузка
  useEffect(() => {
    const { nodes: n, edges: e } = loadFlow();
    setNodes(n.map(makeNode));
    setEdges(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);






useEffect(() => {
  const apply = () => wrapperRef.current?.classList.add('rf-copy-cursor');
  const remove = () => wrapperRef.current?.classList.remove('rf-copy-cursor');

  const onKeyDown = (e) => { if (e.ctrlKey || e.metaKey) apply(); };
  const onKeyUp   = (e) => { if (!e.ctrlKey && !e.metaKey) remove(); };
  const onBlur    = remove;

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
  };
}, []);







  // стили рёбер по правилам/политике
  const edgeStyleForRule = (rule) => {
    switch (rule) {
      case 'afterAny':
      case 'afterAll':
      case 'afterSelected':
        return { animated:true, style:{ stroke:'#4CAF50', strokeDasharray:'6 4', strokeWidth:2 } };
      case 'afterAnyDelay':
        return { animated:true, style:{ stroke:'#007BFF', strokeDasharray:'6 4', strokeWidth:2 }, label:'⏰' };
      case 'afterAnyDate':
        return { animated:true, style:{ stroke:'#007BFF', strokeDasharray:'6 4', strokeWidth:2 }, label:'📅' };
      case 'atDate':
        return { animated:false, style:{ stroke:'#007BFF', strokeWidth:2 }, label:'📅' };
      case 'cancelIfPrevCanceled':
        return { animated:true, style:{ stroke:'#9C27B0', strokeDasharray:'6 4', strokeWidth:2 } };
      case 'cancelIfAnySelectedCanceled':
        return { animated:true, style:{ stroke:'url(#blueRed)', strokeDasharray:'6 4', strokeWidth:2 } };
      default:
        return { animated:false, style:{ stroke:'#007BFF', strokeWidth:2 } };
    }
  };

  const cancelOverlay = (policy) => {
    if (!policy?.enabled) return {};
    switch (policy.mode) {
      case 'prevCanceled':
        return { animated:true, style:{ stroke:'#9C27B0', strokeDasharray:'6 4', strokeWidth:2 } };
      case 'anySelectedCanceled':
        return { animated:true, style:{ stroke:'#FF5252', strokeDasharray:'6 4', strokeWidth:2 } };
      default:
        return {};
    }
  };

  // перекрашиваем рёбра + статусы
  useEffect(() => {
    setEdges(es => {
      let changed = false;
      const next = es.map(e => {
        const srcNode = nodes.find(n => n.id === e.source);
        const trgNode = nodes.find(n => n.id === e.target);

        const ruleStyled   = edgeStyleForRule(trgNode?.data.rule);
        const cancelStyled = cancelOverlay(trgNode?.data.cancelPolicy);

        let styled = {
          ...e,
          ...ruleStyled,
          animated: cancelStyled.animated ?? ruleStyled.animated,
          style: { ...ruleStyled.style, ...cancelStyled.style },
          label: cancelStyled.label ?? ruleStyled.label,
        };

        const srcStatus = srcNode?.data.status;
        const trgStatus = trgNode?.data.status;

        if (srcStatus === 'cancel' || trgStatus === 'cancel') {
          styled = { ...styled, animated:false, style:{ ...styled.style, stroke:'#F44336', strokeDasharray: undefined } };
        } else if (srcStatus === 'done' || trgStatus === 'done') {
          styled = { ...styled, animated:false, style:{ ...styled.style, stroke:'#4CAF50', strokeDasharray: undefined } };
        }

        if (!changed &&
            (e.animated !== styled.animated ||
             e.style?.stroke !== styled.style?.stroke ||
             e.style?.strokeDasharray !== styled.style?.strokeDasharray ||
             e.label !== styled.label)) {
          changed = true;
        }
        return styled;
      });
      return changed ? next : es;
    });
  }, [nodes, edges]);

  // авто "working" при afterAny
  useEffect(() => {
    setNodes(ns => {
      let changed = false;
      const next = ns.map(t => {
        if (t.data.rule !== 'afterAny' || t.data.status !== 'pending') return t;
        const incoming = edges.filter(e => e.target === t.id);
        const anyDone  = incoming.some(e => ns.find(n => n.id === e.source)?.data.done);
        if (anyDone) {
          changed = true;
          return { ...t, data:{ ...t.data, status:'working' } };
        }
        return t;
      });
      return changed ? next : ns;
    });
  }, [nodes, edges]);

  // автокэнсел по политике
  useEffect(() => {
    setNodes(ns => {
      let changed = false;
      const next = ns.map(t => {
        const policy = t.data.cancelPolicy;
        if (!policy?.enabled || policy.mode === 'none') return t;

        const incoming = edges.filter(e => e.target === t.id);
        const anyCanceled = incoming.some(e => ns.find(n => n.id === e.source)?.data.status === 'cancel');

        if (anyCanceled && t.data.status !== 'cancel' && t.data.status !== 'done') {
          changed = true;
          return { ...t, data:{ ...t.data, status:'cancel' } };
        }
        return t;
      });
      return changed ? next : ns;
    });
  }, [nodes, edges]);

  const baseEdge = {
    type: 'deletable',
    animated: false,
    style: { stroke: '#007BFF', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#007BFF' },
    label: '',
    labelStyle: { fill: '#007BFF', fontWeight: 600 },
  };

  const addNode = useCallback(() => {
    const raw = {
      id: crypto.randomUUID(),
      type: 'card',
      position: { x: 100, y: 100 },
      data: {
        label: 'Новая карточка',
        color: '#fcf9e9',
        rule: '',
        cancelPolicy: { enabled: false, mode: 'none' },
        selectedDeps: [], cancelSelectedDeps: [],
        overdue: false,
        status: 'pending',
        initials: '', avatarUrl: '',
        difficulty: 0, taskType: '', description: '',
      },
    };
    setNodes(ns => [...ns, makeNode(raw)]);
  }, [makeNode]);




const onConnect = useCallback((params) => {
  didConnectRef.current = true;
  setEdges(es => addEdge({ ...params, ...baseEdge }, es));

  // закрываем меню и выходим из режима набора
  setQuickMenu(m => ({ ...m, show: false }));
  setComposing(false);
  connectRef.current = null;
  if (wrapperRef.current) wrapperRef.current.style.cursor = '';
}, [setEdges]);






  const onNodesDelete = useCallback(
    (deleted) => setEdges(es => es.filter(e => !deleted.some(d => e.source === d.id || e.target === d.id))),
    [setEdges]
  );

  // показать квик-меню
  const onConnectStart = (event, { nodeId }) => {
    connectRef.current = nodeId;
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const startX = event.clientX - bounds.left;
    const startY = event.clientY - bounds.top;

    const MENU_OFFSET_X = 200;
    const MENU_OFFSET_Y = -150;

    setQuickMenu({ show: true, x: startX + MENU_OFFSET_X, y: startY + MENU_OFFSET_Y });
    setComposing(true); // включили режим набора
  };

// src/page/FlowPage.jsx — заменить onConnectEnd
const onConnectEnd = useCallback((ev) => {
  if (!composing || !wrapperRef.current || !connectRef.current) return;

  // Создаём ноду только если отпустили мышь на полотне
  const isPane = ev?.target?.classList?.contains?.('react-flow__pane');
  if (!isPane) return;

  const bounds = wrapperRef.current.getBoundingClientRect();
  const pos    = rf.project({ x: ev.clientX - bounds.left, y: ev.clientY - bounds.top });

  const label      = draft.title || 'Новая карточка';
  const rule       = draft.conditionId || '';
  const initials   = draft.assignee ? draft.assignee.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase() : '';
  const difficulty = draft.difficulty ? Number(draft.difficulty) : 0;
  const taskType   = draft.type || '';

  const newId = crypto.randomUUID();
  const srcId = connectRef.current; // фиксируем источник до очистки

  const raw = {
    id: newId,
    type: 'card',
    position: pos,
    data: {
      label, color:'#eeebdd', rule,
      cancelPolicy:{ enabled:false, mode:'none' },
      selectedDeps:[], cancelSelectedDeps:[], overdue:false,
      status:'pending', initials, avatarUrl:'', difficulty, taskType,
    },
  };

  // 1) добавляем ноду
  setNodes(ns => [...ns, makeNode(raw)]);

  // 2) добавляем ребро после обновления стора
  requestAnimationFrame(() => {
    setEdges(es => [
      ...es,
      { id: crypto.randomUUID(), source: srcId, target: newId, ...baseEdge },
    ]);
  });

  // 3) выходим из режима
  setDraft(initialDraft);
  setQuickMenu(m => ({ ...m, show:false }));
  setComposing(false);
  connectRef.current = null;

  // 4) подавляем следующий клик ТОЛЬКО в этом сценарии,
  //    чтобы не создать вторую карточку
  suppressClickRef.current = true;
}, [composing, draft, rf, makeNode]);






// Ctrl + drag = копировать ноду
const onNodeCtrlDragStart = useCallback((event, node) => {
  const isCtrl = event.ctrlKey || event.metaKey;

  // обычный драг — выходим и убираем курсор, если вдруг остался
  if (!isCtrl) {
    wrapperRef.current?.classList.remove('rf-copy-cursor');
    cloneDragRef.current = { active:false, nodeId:null, startPos:null, placeholderId:null };
    return;
  }

  // уже в процессе копирования? игнорим повторные dragStart (при мультивыборе RF дергает на каждую ноду)
  if (cloneDragRef.current.active) return;

  const startPos = { ...node.position };
  cloneDragRef.current = {
    active: true,
    nodeId: node.id,
    startPos,
    placeholderId: null,
  };

  // ДЕЛАЕМ ОДИНОЧНЫЙ ВЫБОР — только текущий узел
  setNodes(ns => ns.map(n => ({
    ...n,
    selected: n.id === node.id
  })));

  // Создаём placeholder на месте исходника
  setNodes(ns => {
    const src = ns.find(n => n.id === node.id);
    if (!src) return ns;
    const ghostId = `ghost-${node.id}-${Date.now()}`;
    cloneDragRef.current.placeholderId = ghostId;

    const placeholder = {
      id: ghostId,
      type: src.type,
      position: startPos,
      data: { ...src.data, isPlaceholder: true },
      draggable: false,
      selectable: false,
      style: { opacity: 0.45, pointerEvents: 'none' },
    };

    return [...ns, placeholder];
  });

  wrapperRef.current?.classList.add('rf-copy-cursor');
}, [setNodes]);












const onNodeCtrlDragStop = useCallback((event, node) => {
  const ref = cloneDragRef.current;

  // не копируем — просто сброс визуала
  if (!ref.active || node.id !== ref.nodeId) {
    wrapperRef.current?.classList.remove('rf-copy-cursor');
    cloneDragRef.current = { active:false, nodeId:null, startPos:null, placeholderId:null };
    return;
  }

  // исходник
  const src = nodes.find(n => n.id === ref.nodeId);
  if (!src) {
    // уборка призраков «на всякий»
    setNodes(ns => ns.filter(n => !String(n.id).startsWith('ghost-')));
    wrapperRef.current?.classList.remove('rf-copy-cursor');
    cloneDragRef.current = { active:false, nodeId:null, startPos:null, placeholderId:null };
    return;
  }

  // куда бросили
  const droppedPos = { ...node.position };
  const newId = crypto.randomUUID();

  const raw = {
    id: newId,
    type: src.type,
    position: droppedPos,
    data: {
      label: src.data.label,
      color: src.data.color,
      done: src.data.done,
      rule: src.data.rule,
      status: src.data.status,
      cancelPolicy: src.data.cancelPolicy,
      selectedDeps: src.data.selectedDeps || [],
      cancelSelectedDeps: src.data.cancelSelectedDeps || [],
      overdue: !!src.data.overdue,
      initials: src.data.initials || '',
      avatarUrl: src.data.avatarUrl || '',
      difficulty: typeof src.data.difficulty === 'number' ? src.data.difficulty : 0,
      taskType: src.data.taskType || '',
      description: src.data.description || '',
    },
  };

  setNodes(ns => {
    // 1) убираем ЛЮБЫЕ призраки на всякий (если вдруг осталось из-за мультистарта)
    const noGhosts = ns.filter(n => !String(n.id).startsWith('ghost-'));

    // 2) возвращаем оригинал на стартовую позицию
    const originalBack = noGhosts.map(n =>
      n.id === src.id ? { ...n, position: ref.startPos } : n
    );

    // 3) снимаем выделение со всех и добавляем копию выделенной
    const cleared = originalBack.map(n => ({ ...n, selected: false }));
    const withCopy = [...cleared, makeNode(raw)];
    return withCopy.map(n => n.id === newId ? { ...n, selected: true } : n);
  });

  // финальный сброс
  wrapperRef.current?.classList.remove('rf-copy-cursor');
  cloneDragRef.current = { active:false, nodeId:null, startPos:null, placeholderId:null };
}, [nodes, setNodes, makeNode]);













  // клик по пустому месту — создать карточку

  const onPaneClick = useCallback((ev) => {
  if (!composing) return;

  // если это "хвостовой" клик сразу после mouseup — пропускаем один раз
  if (suppressClickRef.current) {
    suppressClickRef.current = false;
    return;
  }

  if (!wrapperRef.current || !connectRef.current) return;

  const bounds = wrapperRef.current.getBoundingClientRect();
  const pos    = rf.project({ x: ev.clientX - bounds.left, y: ev.clientY - bounds.top });

  const label      = draft.title || 'Новая карточка';
  const rule       = draft.conditionId || '';
  const initials   = draft.assignee ? draft.assignee.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase() : '';
  const difficulty = draft.difficulty ? Number(draft.difficulty) : 0;
  const taskType   = draft.type || '';

  const newId = crypto.randomUUID();
  const srcId = connectRef.current;           // ← фиксируем ИД источника заранее!

  const raw = {
    id: newId,
    type: 'card',
    position: pos,
    data: {
      label, color:'#eeebdd', rule,
      cancelPolicy:{ enabled:false, mode:'none' },
      selectedDeps:[], cancelSelectedDeps:[], overdue:false,
      status:'pending', initials, avatarUrl:'', difficulty, taskType,
    },
  };

  // 1) сначала добавляем НОДУ
  setNodes(ns => [...ns, makeNode(raw)]);

  // 2) потом — РЕБРО, когда DOM/стор уже успел обновиться
  requestAnimationFrame(() => {
    setEdges(es => [
      ...es,
      {
        id: crypto.randomUUID(),
        source: srcId,
        target: newId,
        ...baseEdge,
      },
    ]);
  });

  // 3) выходим из режима
  setDraft(initialDraft);
  setQuickMenu(m => ({ ...m, show:false }));
  setComposing(false);
  connectRef.current = null;
  if (wrapperRef.current) wrapperRef.current.style.cursor = '';
}, [composing, draft, rf, makeNode]);
















  // Esc — отмена режима
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && composing) {
        setComposing(false);
        setQuickMenu(m => ({ ...m, show:false }));
        connectRef.current = null;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [composing]);

  // persist
  useEffect(() => {
    const plain = nodes.map(({ data, ...n }) => ({
      ...n,
      data: {
        label: data.label,
        color: data.color,
        done: data.done,
        rule: data.rule,
        status: data.status,
        cancelPolicy: data.cancelPolicy,
        selectedDeps: data.selectedDeps || [],
        cancelSelectedDeps: data.cancelSelectedDeps || [],
        overdue: !!data.overdue,

        initials: data.initials || '',
        avatarUrl: data.avatarUrl || '',
        difficulty: typeof data.difficulty === 'number' ? data.difficulty : 0,
        taskType: data.taskType || '',
        description: data.description || '',
      },
    }));
    saveFlow({ nodes: plain, edges });
  }, [nodes, edges]);

  // deps для RuleMenu
  const nodesView = useMemo(() =>
    nodes.map(n => {
      const incoming = edges.filter(e => e.target === n.id);
      const deps = incoming.map(e => ({
        edgeId: e.id,
        label: nodes.find(nn => nn.id === e.source)?.data.label || `Задача ${e.source}`,
      }));
      return { ...n, data:{ ...n.data, deps } };
    }),
  [nodes, edges]);

  return (
    <>
      <Toolbar
        onAdd={addNode}
        onReset={() => {
          localStorage.removeItem('rf-demo');
          setNodes([]); setEdges([]);
        }}
      />

<div
  ref={wrapperRef}
  className={composing ? 'rf-draft-cursor' : ''}
  style={{ width:'100%', height:'100vh' }}
>



        <ReactFlow
          nodes={nodesView}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onPaneClick={onPaneClick}
          deleteKeyCode={['Delete','Backspace']}
          defaultEdgeOptions={baseEdge}
          fitView
          panOnDrag={!composing}   // ← добавили

          onNodeDragStart={onNodeCtrlDragStart}
          onNodeDragStop={onNodeCtrlDragStop}

          selectionOnDrag={composing ? false : true}
          nodesDraggable={composing ? false : true}



        >
          <Controls />
          <MiniMap nodeColor={n => n.data.status === 'working'
            ? '#2196F3'
            : n.data.done ? '#8BC34A' : n.data.color } />
          <Background />
        </ReactFlow>

        {quickMenu.show && (
          <QuickMenu
            x={quickMenu.x}
            y={quickMenu.y}
            onDraftChange={setDraft}
          />
        )}
      </div>
    </>
  );
}
