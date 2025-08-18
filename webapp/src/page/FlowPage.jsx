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
import TaskModal     from '../companet/TaskModal';

import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import CheckerNode   from '../companet/CheckerNode';
import CheckersPanel from '../companet/checkers/CheckersPanel';

const NODE_TYPES = { card: CardNode, checker: CheckerNode };
const EDGE_TYPES = { deletable: DeletableEdge };

const getDefaultStages = () => ([
  { id:'backlog', name:'Бэклог' },
  { id:'todo',    name:'В работу' },
  { id:'doing',   name:'В процессе' },
  { id:'done',    name:'Готово' },
  { id:'cancel',  name:'Отменено' },
  { id:'frozen',  name:'Заморожено' },
]);

const initialDraft = {
  title: null, conditionId: '', conditionLabel: '',
  assignee: null, difficulty: null, type: null, group: null,
};

export default function FlowPage() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}

function Canvas() {
  const { groupId = 'default' } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();

  const rf               = useReactFlow();
  const connectRef       = useRef(null);
  const wrapperRef       = useRef(null);
  const didConnectRef    = useRef(false);
  const suppressClickRef = useRef(false);
  const focusedTaskRef   = useRef(null);

  const [focusId, setFocusId] = useState(null);

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
  const [stages, setStages] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [showCheckers, setShowCheckers] = useState(false);

  // таймеры для чекера "at-datetime"
  const timersRef = useRef({}); // { [nodeId]: timeoutId }

  // ===== модалка полной карточки (TaskModal)
  const [detailsId, setDetailsId] = useState(null);
  const detailsTask = useMemo(
    () => nodes.find(n => n.id === detailsId) || null,
    [nodes, detailsId]
  );
  const updateDetails = useCallback((patch) => {
    if (!detailsId) return;
    setNodes(ns => ns.map(n =>
      n.id === detailsId ? ({ ...n, data: { ...n.data, ...patch } }) : n
    ));
  }, [detailsId, setNodes]);
  const deleteDetails = useCallback(() => {
    if (!detailsId) return;
    setNodes(ns => ns.filter(n => n.id !== detailsId));
    setEdges(es => es.filter(e => e.source !== detailsId && e.target !== detailsId));
    setDetailsId(null);
  }, [detailsId, setNodes, setEdges]);

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
        showIcon: false,
        group: '',
        ...raw.data,
        groupId: raw.data?.groupId ?? groupId,

        onTitle: (id, t) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, label:t } } : n)),
        onColor: (id, c) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, color:c } } : n)),
        onToggle: (id, val) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, done:val, status: val ? 'done' : n.data.status } } : n)),
        onShowIcon: (id, val) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, showIcon: !!val } } : n)),
        onCancel: (id) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, status:'cancel' } } : n)),
        onFreeze: (id) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, status:'frozen' } } : n)),
        onCancelPolicyToggle: (id, enabled) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, cancelPolicy:{ ...n.data.cancelPolicy, enabled } } } : n)),
        onCancelPolicyChange: (id, mode) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, cancelPolicy:{ ...n.data.cancelPolicy, mode } } } : n)),
        onDescription: (id, text) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, description:text } } : n)),
        onToggleDep: (id, edgeId, checked) => setNodes(ns => ns.map(n => {
          if (n.id !== id) return n;
          const cur  = n.data.selectedDeps || [];
          const next = checked ? Array.from(new Set([...cur, edgeId])) : cur.filter(x => x !== edgeId);
          return { ...n, data:{ ...n.data, selectedDeps: next } };
        })),
        onToggleCancelDep: (id, edgeId, checked) => setNodes(ns => ns.map(n => {
          if (n.id !== id) return n;
          const cur  = n.data.cancelSelectedDeps || [];
          const next = checked ? Array.from(new Set([...cur, edgeId])) : cur.filter(x => x !== edgeId);
          return { ...n, data:{ ...n.data, cancelSelectedDeps: next } };
        })),
        onDelete: (id) => { setNodes(ns => ns.filter(n => n.id !== id)); setEdges(es => es.filter(e => e.source !== id && e.target !== id)); },
        onRuleChange: (id, val) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, rule:val } } : n)),
        onOverdue: (id, val) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, overdue: !!val } } : n)),
        onCalendarChange: (id, calendar) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, calendar: calendar || null } } : n)),

        // чекеры
        onUrlChange:  (id, url)   => setNodes(ns => ns.map(n => n.id === id ? ({ ...n, data:{ ...n.data, url } })   : n)),
        onDueAtChange:(id, dueAt) => setNodes(ns => ns.map(n => n.id === id ? ({ ...n, data:{ ...n.data, dueAt } }) : n)),
      },
    }),
    [setNodes, setEdges, groupId]
  );

  // загрузка диаграммы текущей группы
  useEffect(() => {
    setLoaded(false);
    const { nodes: n = [], edges: e = [], stages: s = [] } = loadFlow(groupId);
    const fixed = n.map(node => ({
      ...node,
      data: {
        ...node.data,
        group: node.data?.group || node.data?.groupId || groupId,
        groupId: node.data?.groupId || groupId,
      },
    }));
    setNodes(fixed.map(makeNode));
    setEdges(e);
    setStages(Array.isArray(s) && s.length ? s : getDefaultStages());
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // deep-link ?task=ID
  useEffect(() => {
    if (!loaded) return;
    const taskId = search.get('task');
    if (!taskId) return;
    if (focusedTaskRef.current === taskId) return;
    const node = nodes.find(n => n.id === taskId);
    if (!node) return;
    try {
      rf.fitView({ nodes: [node], padding: 0.2, duration: 300 });
      setNodes(ns => {
        let changed = false;
        const next = ns.map(n => {
          const sel = n.id === taskId;
          if (n.selected !== sel) changed = true;
          return n.selected === sel ? n : { ...n, selected: sel };
        });
        return changed ? next : ns;
      });
      focusedTaskRef.current = taskId;
      setFocusId(taskId);
    } catch {}
  }, [loaded, nodes, search, rf, setNodes]);

  // курсор copy при Ctrl/⌘
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
      case 'prevCanceled':        return { animated:true, style:{ stroke:'#9C27B0', strokeDasharray:'6 4', strokeWidth:2 } };
      case 'anySelectedCanceled': return { animated:true, style:{ stroke:'#FF5252', strokeDasharray:'6 4', strokeWidth:2 } };
      default:                    return {};
    }
  };

  // стиль рёбер по статусам/правилам
  useEffect(() => {
    setEdges(prevEs => {
      let changed = false;
      const next = prevEs.map(e => {
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
      return changed ? next : prevEs;
    });
  }, [nodes]);

  // правило afterAny → working
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

  // политика отмены
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
        showIcon: false,
        group: groupId || '',
        groupId,
        stage: 'backlog',
      },
    };
    setNodes(ns => [...ns, makeNode(raw)]);
  }, [makeNode, groupId]);

  const onConnect = useCallback((params) => {
    didConnectRef.current = true;
    setEdges(es => addEdge({ ...params, ...baseEdge }, es));
    setQuickMenu(m => ({ ...m, show: false }));
    setComposing(false);
    connectRef.current = null;
    if (wrapperRef.current) wrapperRef.current.style.cursor = '';
  }, [setEdges]);

  const onNodesDelete = useCallback(
    (deleted) => setEdges(es => es.filter(e => !deleted.some(d => e.source === d.id || e.target === d.id))),
    [setEdges]
  );

  const onConnectStart = (event, { nodeId }) => {
    connectRef.current = nodeId;
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const startX = event.clientX - bounds.left;
    const startY = event.clientY - bounds.top;

    const MENU_OFFSET_X = 200;
    const MENU_OFFSET_Y = -150;

    setQuickMenu({ show: true, x: startX + MENU_OFFSET_X, y: startY + MENU_OFFSET_Y });
    setComposing(true);
  };

  const onConnectEnd = useCallback((ev) => {
    if (!composing || !wrapperRef.current || !connectRef.current) return;

    const isPane = ev?.target?.classList?.contains?.('react-flow__pane');
    if (!isPane) return;

    const pos = rf.screenToFlowPosition({ x: ev.clientX, y: ev.clientY });

    const label      = draft.title || 'Новая карточка';
    const rule       = draft.conditionId || '';
    const initials   = draft.assignee ? draft.assignee.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase() : '';
    const difficulty = draft.difficulty ? Number(draft.difficulty) : 0;
    const taskType   = draft.type || '';

    const groupLabel = (draft.group?.trim() || groupId);

    const newId = crypto.randomUUID();
    const srcId = connectRef.current;

    const raw = {
      id: newId,
      type: 'card',
      position: pos,
      data: {
        label, color:'#eeebdd', rule,
        cancelPolicy:{ enabled:false, mode:'none' },
        selectedDeps:[], cancelSelectedDeps:[], overdue:false,
        status:'pending', initials, avatarUrl:'', difficulty, taskType,
        group: groupLabel,
        groupId,
        stage: 'backlog',
      },
    };

    setNodes(ns => [...ns, makeNode(raw)]);

    requestAnimationFrame(() => {
      setEdges(es => [
        ...es,
        { id: crypto.randomUUID(), source: srcId, target: newId, ...baseEdge },
      ]);
    });

    setDraft(initialDraft);
    setQuickMenu(m => ({ ...m, show:false }));
    setComposing(false);
    connectRef.current = null;
    suppressClickRef.current = true;
  }, [composing, draft, rf, makeNode, groupId]);

  const onNodeCtrlDragStart = useCallback((event, node) => {
    const isCtrl = event.ctrlKey || event.metaKey;
    if (!isCtrl) {
      wrapperRef.current?.classList.remove('rf-copy-cursor');
      cloneDragRef.current = { active:false, nodeId:null, startPos:null, placeholderId:null };
      return;
    }
    if (cloneDragRef.current.active) return;

    const startPos = { ...node.position };
    cloneDragRef.current = {
      active: true,
      nodeId: node.id,
      startPos,
      placeholderId: null,
    };

    setNodes(ns => ns.map(n => ({ ...n, selected: n.id === node.id })));

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

    if (!ref.active || node.id !== ref.nodeId) {
      wrapperRef.current?.classList.remove('rf-copy-cursor');
      cloneDragRef.current = { active:false, nodeId:null, startPos:null, placeholderId:null };
      return;
    }

    const src = nodes.find(n => n.id === ref.nodeId);
    if (!src) {
      setNodes(ns => ns.filter(n => !String(n.id).startsWith('ghost-')));
      wrapperRef.current?.classList.remove('rf-copy-cursor');
      cloneDragRef.current = { active:false, nodeId:null, startPos:null, placeholderId:null };
      return;
    }

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
        group: src.data.group || '',
        showIcon: !!src.data.showIcon,
        groupId: src.data.groupId || groupId,
        stage: 'backlog',
      },
    };

    setNodes(ns => {
      const noGhosts = ns.filter(n => !String(n.id).startsWith('ghost-'));
      const originalBack = noGhosts.map(n =>
        n.id === src.id ? { ...n, position: ref.startPos } : n
      );
      const cleared = originalBack.map(n => ({ ...n, selected: false }));
      const withCopy = [...cleared, makeNode(raw)];
      return withCopy.map(n => n.id === newId ? { ...n, selected: true } : n);
    });

    wrapperRef.current?.classList.remove('rf-copy-cursor');
    cloneDragRef.current = { active:false, nodeId:null, startPos:null, placeholderId:null };
  }, [nodes, setNodes, makeNode, groupId]);

  const onPaneClick = useCallback((ev) => {
    if (!composing) return;
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!wrapperRef.current || !connectRef.current) return;

    const pos = rf.screenToFlowPosition({ x: ev.clientX, y: ev.clientY });

    const label      = draft.title || 'Новая карточка';
    const rule       = draft.conditionId || '';
    const initials   = draft.assignee ? draft.assignee.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase() : '';
    const difficulty = draft.difficulty ? Number(draft.difficulty) : 0;
    const taskType   = draft.type || '';

    const newId = crypto.randomUUID();
    const srcId = connectRef.current;
    const groupLabel = (draft.group?.trim() || groupId);

    const raw = {
      id: newId,
      type: 'card',
      position: pos,
      data: {
        label, color:'#eeebdd', rule,
        cancelPolicy:{ enabled:false, mode:'none' },
        selectedDeps:[], cancelSelectedDeps:[], overdue:false,
        status:'pending', initials, avatarUrl:'', difficulty, taskType,
        showIcon: false,
        group: groupLabel,
        groupId,
        stage: 'backlog',
      },
    };

    setNodes(ns => [...ns, makeNode(raw)]);

    requestAnimationFrame(() => {
      setEdges(es => [
        ...es,
        { id: crypto.randomUUID(), source: srcId, target: newId, ...baseEdge },
      ]);
    });

    setDraft(initialDraft);
    setQuickMenu(m => ({ ...m, show:false }));
    setComposing(false);
    connectRef.current = null;
    if (wrapperRef.current) wrapperRef.current.style.cursor = '';
  }, [composing, draft, rf, makeNode, groupId]);

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

  // Автозапуск чекеров: http-get → GET и завершить
  useEffect(() => {
    const toRun = nodes.filter(n =>
      n.type === 'checker' &&
      n.data?.checkerKind === 'http-get' &&
      n.data?.status === 'working' &&
      !n.data?._runStarted
    );
    if (toRun.length === 0) return;

    // пометить как стартовавшие
    setNodes(ns => ns.map(n => {
      if (toRun.some(t => t.id === n.id)) {
        return { ...n, data: { ...n.data, _runStarted: true } };
      }
      return n;
    }));

    toRun.forEach(node => {
      const url = (node.data?.url || '').trim();
      if (!url) {
        setNodes(ns => ns.map(n => n.id === node.id
          ? ({ ...n, data: { ...n.data, status:'done', _runFinished: Date.now() } })
          : n
        ));
        return;
      }
      try {
        fetch(url, { method:'GET', mode:'no-cors' })
          .catch(() => {})
          .finally(() => {
            setNodes(ns => ns.map(n => n.id === node.id
              ? ({ ...n, data: { ...n.data, status:'done', _runFinished: Date.now() } })
              : n
            ));
          });
      } catch {
        setNodes(ns => ns.map(n => n.id === node.id
          ? ({ ...n, data: { ...n.data, status:'done', _runFinished: Date.now() } })
          : n
        ));
      }
    });
  }, [nodes, setNodes]);





 // Автозавершение чекера "at-datetime": в dueAt → done
// Автозавершение чекера "at-datetime":
//  - если dueAt в будущем → статус 'scheduled' и ставим таймер
//  - если dueAt наступил/прошёл → 'done'
//  - если dueAt очищён/невалидный → убираем таймер и (если был scheduled) возвращаем в 'pending'
//  - если после 'done' dueAt снова выставили в будущее → перезапуск в 'scheduled'
useEffect(() => {
  const clearTimer = (id) => {
    const t = timersRef.current[id];
    if (t) { clearTimeout(t); delete timersRef.current[id]; }
  };

  const now = Date.now();
  let needUpdate = false;
  const updates = new Map(); // id -> partial data patch

  nodes.forEach(n => {
    if (n.type !== 'checker' || n.data?.checkerKind !== 'at-datetime') {
      clearTimer(n.id);
      return;
    }

    const dueRaw = (n.data?.dueAt || '').trim();
    const dueTs = Date.parse(dueRaw);

    // Всегда пересоздаём таймер для этого узла (на случай изменения dueAt)
    clearTimer(n.id);

    // 1) нет даты / невалидно → сброс расписания
    if (!Number.isFinite(dueTs)) {
      if (n.data?.status === 'scheduled') {
        updates.set(n.id, { status: 'pending' });
        needUpdate = true;
      }
      return;
    }

    // 2) дата уже наступила → ставим done, если ещё не done
    if (dueTs <= now) {
      if (n.data?.status !== 'done') {
        updates.set(n.id, { status: 'done', _runFinished: now });
        needUpdate = true;
      }
      return;
    }

    // 3) дата в будущем → статус scheduled (перезапуск, если был done)
    if (n.data?.status !== 'scheduled') {
      updates.set(n.id, { status: 'scheduled' });
      needUpdate = true;
    }

    const delay = Math.min(dueTs - now, 2_147_000_000); // ~24.8 дней
    const timeout = setTimeout(() => {
      setNodes(ns => ns.map(x =>
        x.id === n.id
          ? ({ ...x, data:{ ...x.data, status:'done', _runFinished: Date.now() } })
          : x
      ));
      clearTimer(n.id);
    }, delay);
    timersRef.current[n.id] = timeout;
  });

  if (needUpdate) {
    setNodes(ns => ns.map(n =>
      updates.has(n.id) ? ({ ...n, data:{ ...n.data, ...updates.get(n.id) } }) : n
    ));
  }

  // подчистка таймеров для удалённых узлов
  Object.keys(timersRef.current).forEach(id => {
    if (!nodes.some(n => n.id === id)) clearTimer(id);
  });

  return () => {
    Object.keys(timersRef.current).forEach(id => clearTimer(id));
  };
}, [nodes, setNodes]);









  

  // автосейв
  useEffect(() => {
    if (!loaded) return;
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
        group: data.group || '',
        showIcon: !!data.showIcon,
        groupId,
        stage: data.stage || 'backlog',
        calendar: data.calendar || null,

        // чекеры — чтобы не терялись
        checkerKind: data.checkerKind || undefined,
        url: (data.url ?? undefined),
        dueAt: (data.dueAt ?? undefined),
      },
    }));
    const prev = loadFlow(groupId);
    const events = Array.isArray(prev?.events) ? prev.events : [];
    saveFlow(groupId, { nodes: plain, edges, stages, events });
  }, [nodes, edges, stages, groupId, loaded]);

  const nodesView = useMemo(() =>
    nodes.map(n => {
      const incoming = edges.filter(e => e.target === n.id);
      const deps = incoming.map(e => ({
        edgeId: e.id,
        label: nodes.find(nn => nn.id === e.source)?.data.label || `Задача ${e.source}`,
      }));

      const stageId = n.data?.stage || stages[0]?.id || 'backlog';
      const stageLabel = stages.find(s => s.id === stageId)?.name || stageId;

      let calendarLabel = '';
      if (n.data?.calendar?.start && n.data?.calendar?.end) {
        const fmt = new Intl.DateTimeFormat('ru-RU', {
          day:'2-digit', month:'2-digit', year:'numeric',
          hour:'2-digit', minute:'2-digit'
        });
        const s = fmt.format(new Date(n.data.calendar.start)).replace(', ', ': ');
        const e = fmt.format(new Date(n.data.calendar.end)).replace(', ', ': ');
        calendarLabel = `${s} — ${e}`;
      }

      return {
        ...n,
        data:{
          ...n.data,
          deps,
          stage: stageId,
          stageLabel,
          calendarLabel,
          onOpenCalendar: () => navigate(`/groups/${groupId}/calendar?task=${n.id}`),
          onOpenTask: () => setDetailsId(n.id),
        }
      };
    }),
  [nodes, edges, stages, navigate, groupId]);

  return (
    <>
      <div style={{ display:'flex', gap:12, alignItems:'center', padding:'8px 12px', marginTop: '30px' }}>
        <button onClick={() => navigate('/groups')}>⟵ На главную</button>
        <div style={{ fontWeight:600, opacity:.75 }}>Группа: {groupId}</div>
      </div>

      <Toolbar
        onAdd={addNode}
        onReset={() => {
          setNodes([]); setEdges([]);
          saveFlow(groupId, { nodes: [], edges: [], stages: getDefaultStages(), events: loadFlow(groupId).events || [] });
        }}
        onKanban={() => navigate(`/groups/${groupId}/kanban`)}
        onCalendar={() => navigate(`/groups/${groupId}/calendar`)}
        onCheckers={() => setShowCheckers(v => !v)}
      />

      <div
        ref={wrapperRef}
        className={`${composing ? 'rf-draft-cursor' : ''} ${focusId ? 'focus-mode' : ''}`}
        style={{ width:'100%', height:'100vh', position:'relative' }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={(e) => {
          e.preventDefault();
          const raw = e.dataTransfer.getData('application/reactflow');
          if (!raw) return;
          let payload;
          try { payload = JSON.parse(raw); } catch { return; }

          const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });

          // HTTP GET чекер
          if (payload.kind === 'checker' && payload.type === 'http-get') {
            const newId = crypto.randomUUID();
            const node = {
              id: newId,
              type: 'checker',
              position: pos,
              data: {
                label: 'HTTP GET',
                color: '#eeebdd',
                status: 'pending',
                rule: '',
                cancelPolicy: { enabled:false, mode:'none' },
                selectedDeps: [], cancelSelectedDeps: [],
                overdue: false,
                showIcon: false,
                group: groupId, groupId, stage: 'backlog',

                checkerKind: 'http-get',
                url: '',
              },
            };
            setNodes(ns => [...ns, makeNode(node)]);
            setShowCheckers(false);
            return;
          }

          // Готово в дату/время
          if (payload.kind === 'checker' && payload.type === 'at-datetime') {
            const newId = crypto.randomUUID();
            const node = {
              id: newId,
              type: 'checker',
              position: pos,
              data: {
                label: 'Готово в дату/время',
                color: '#eeebdd',
                status: 'pending',
                rule: '',
                cancelPolicy: { enabled:false, mode:'none' },
                selectedDeps: [], cancelSelectedDeps: [],
                overdue: false,
                showIcon: false,
                group: groupId, groupId, stage: 'backlog',

                checkerKind: 'at-datetime',
                dueAt: '', // '2025-08-18T14:30'
              },
            };
            setNodes(ns => [...ns, makeNode(node)]);
            setShowCheckers(false);
            return;
          }
        }}
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
          panOnDrag={!composing}
          onNodeDragStart={onNodeCtrlDragStart}
          onNodeDragStop={onNodeCtrlDragStop}
          selectionOnDrag={composing ? false : true}
          nodesDraggable={composing ? false : true}
        >
          <Controls />
      
<MiniMap nodeColor={n =>
  n.data.status === 'working'   ? '#2196F3' :
  n.data.status === 'scheduled' ? '#FFC107' :
  n.data.status === 'done'      ? '#8BC34A' :
  n.data.color
} />



          <Background />
        </ReactFlow>

        <TaskModal
          open={!!detailsId}
          task={detailsTask}
          stages={stages}
          onClose={() => setDetailsId(null)}
          onChange={updateDetails}
          onDelete={deleteDetails}
          onOpenCalendar={() => {
            if (detailsId) navigate(`/groups/${groupId}/calendar?task=${detailsId}`);
          }}
        />

        {/* Прозрачная «простыня» — клик вне карточки снимает фокус */}
        {focusId && (
          <button
            className="focus-overlay"
            onClick={() => {
              setFocusId(null);
              setNodes(ns => ns.map(n => (n.selected ? { ...n, selected: false } : n)));
              const url = new URL(window.location.href);
              url.searchParams.delete('task');
              window.history.replaceState({}, '', url.toString());
            }}
            aria-label="Снять фокус"
          />
        )}

        {quickMenu.show && (
          <QuickMenu
            x={quickMenu.x}
            y={quickMenu.y}
            onDraftChange={setDraft}
          />
        )}

        {showCheckers && (
          <CheckersPanel open={showCheckers} onClose={() => setShowCheckers(false)} />
        )}
      </div>
    </>
  );
}
