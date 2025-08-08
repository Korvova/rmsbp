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
import QuickMenu from '../companet/QuickMenu';

import 'reactflow/dist/style.css';

import { loadFlow, saveFlow } from '../service/storage';
import CardNode      from '../companet/CardNode';
import Toolbar       from '../companet/Toolbar';
import DeletableEdge from '../companet/DeletableEdge';

export default function FlowPage() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}

function Canvas() {
  const rf           = useReactFlow();
  const nodeTypes    = useMemo(() => ({ card: CardNode }), []);
  const edgeTypes    = useMemo(() => ({ deletable: DeletableEdge }), []);
  const connectRef   = useRef(null);
  const wrapperRef   = useRef(null);
  const didConnectRef = useRef(false);


const [quickMenu, setQuickMenu] = useState({ show: false, x: 0, y: 0 });


  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  /* фабрика узла с коллбэками */
  const makeNode = useCallback(
    (raw) => ({
      ...raw,
      data: {
        done: false,
        status: 'pending',
        cancelPolicy: { enabled: false, mode: 'none' },
        selectedDeps: [],
        cancelSelectedDeps: [],
        overdue: false,
        ...raw.data,

        onTitle: (id, t) =>
          setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: t } } : n))),
        onColor: (id, c) =>
          setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, color: c } } : n))),
        onToggle: (id, val) =>
          setNodes((ns) =>
            ns.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, done: val, status: val ? 'done' : n.data.status } } : n
            )
          ),

        onCancel: (id) =>
          setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: 'cancel' } } : n))),
        onFreeze: (id) =>
          setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: 'frozen' } } : n))),

        onCancelPolicyToggle: (id, enabled) =>
          setNodes((ns) =>
            ns.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, cancelPolicy: { ...n.data.cancelPolicy, enabled } } } : n
            )
          ),
        onCancelPolicyChange: (id, mode) =>
          setNodes((ns) =>
            ns.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, cancelPolicy: { ...n.data.cancelPolicy, mode } } } : n
            )
          ),

        onToggleDep: (id, edgeId, checked) =>
          setNodes((ns) =>
            ns.map((n) => {
              if (n.id !== id) return n;
              const cur = n.data.selectedDeps || [];
              const next = checked ? Array.from(new Set([...cur, edgeId])) : cur.filter((x) => x !== edgeId);
              return { ...n, data: { ...n.data, selectedDeps: next } };
            })
          ),
        onToggleCancelDep: (id, edgeId, checked) =>
          setNodes((ns) =>
            ns.map((n) => {
              if (n.id !== id) return n;
              const cur = n.data.cancelSelectedDeps || [];
              const next = checked ? Array.from(new Set([...cur, edgeId])) : cur.filter((x) => x !== edgeId);
              return { ...n, data: { ...n.data, cancelSelectedDeps: next } };
            })
          ),

        onDelete: (id) => {
          setNodes((ns) => ns.filter((n) => n.id !== id));
          setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
        },

        onRuleChange: (id, val) =>
          setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, rule: val } } : n))),

        /* ВАЖНО: просрочка */
        onOverdue: (id, val) =>
          setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, overdue: !!val } } : n))),
      },
    }),
    [setNodes, setEdges]
  );

  /* загрузка */
  useEffect(() => {
    const { nodes: n, edges: e } = loadFlow();
    setNodes(n.map(makeNode));
    setEdges(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* стили рёбер по правилам/политике */
  const edgeStyleForRule = (rule) => {
    switch (rule) {
      case 'afterAny':
      case 'afterAll':
      case 'afterSelected':
        return { animated: true, style: { stroke: '#4CAF50', strokeDasharray: '6 4', strokeWidth: 2 } };
      case 'afterAnyDelay':
        return { animated: true, style: { stroke: '#007BFF', strokeDasharray: '6 4', strokeWidth: 2 }, label: '⏰' };
      case 'afterAnyDate':
        return { animated: true, style: { stroke: '#007BFF', strokeDasharray: '6 4', strokeWidth: 2 }, label: '📅' };
      case 'atDate':
        return { animated: false, style: { stroke: '#007BFF', strokeWidth: 2 }, label: '📅' };
      case 'cancelIfPrevCanceled':
        return { animated: true, style: { stroke: '#9C27B0', strokeDasharray: '6 4', strokeWidth: 2 } };
      case 'cancelIfAnySelectedCanceled':
        return { animated: true, style: { stroke: 'url(#blueRed)', strokeDasharray: '6 4', strokeWidth: 2 } };
      default:
        return { animated: false, style: { stroke: '#007BFF', strokeWidth: 2 } };
    }
  };

  const cancelOverlay = (policy) => {
    if (!policy?.enabled) return {};
    switch (policy.mode) {
      case 'prevCanceled':
        return { animated: true, style: { stroke: '#9C27B0', strokeDasharray: '6 4', strokeWidth: 2 } };
      case 'anySelectedCanceled':
        return { animated: true, style: { stroke: '#FF5252', strokeDasharray: '6 4', strokeWidth: 2 } };
      default:
        return {};
    }
  };

  /* перекрашиваем рёбра по правилам/политике + статусам узлов */
  useEffect(() => {
    setEdges((es) => {
      let changed = false;
      const next = es.map((e) => {
        const srcNode = nodes.find((n) => n.id === e.source);
        const trgNode = nodes.find((n) => n.id === e.target);

        const ruleStyled = edgeStyleForRule(trgNode?.data.rule);
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
          styled = { ...styled, animated: false, style: { ...styled.style, stroke: '#F44336', strokeDasharray: undefined } };
        } else if (srcStatus === 'done' || trgStatus === 'done') {
          styled = { ...styled, animated: false, style: { ...styled.style, stroke: '#4CAF50', strokeDasharray: undefined } };
        }

        if (
          !changed &&
          (e.animated !== styled.animated ||
            e.style?.stroke !== styled.style?.stroke ||
            e.style?.strokeDasharray !== styled.style?.strokeDasharray ||
            e.label !== styled.label)
        ) {
          changed = true;
        }
        return styled;
      });
      return changed ? next : es;
    });
  }, [nodes, edges]);

  /* автопереход в work при afterAny */
  useEffect(() => {
    setNodes((ns) => {
      let changed = false;
      const next = ns.map((t) => {
        if (t.data.rule !== 'afterAny' || t.data.status !== 'pending') return t;
        const incoming = edges.filter((e) => e.target === t.id);
        const anyDone = incoming.some((e) => ns.find((n) => n.id === e.source)?.data.done);
        if (anyDone) {
          changed = true;
          return { ...t, data: { ...t.data, status: 'working' } };
        }
        return t;
      });
      return changed ? next : ns;
    });
  }, [nodes, edges]);

  /* автокэнсел по политике */
  useEffect(() => {
    setNodes((ns) => {
      let changed = false;
      const next = ns.map((t) => {
        const policy = t.data.cancelPolicy;
        if (!policy?.enabled || policy.mode === 'none') return t;

        const incoming = edges.filter((e) => e.target === t.id);
        const anyCanceled = incoming.some((e) => ns.find((n) => n.id === e.source)?.data.status === 'cancel');

        if (anyCanceled && t.data.status !== 'cancel' && t.data.status !== 'done') {
          changed = true;
          return { ...t, data: { ...t.data, status: 'cancel' } };
        }
        return t;
      });
      return changed ? next : ns;
    });
  }, [nodes, edges]);

  /* базовый стиль ребра */
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
        selectedDeps: [],
        cancelSelectedDeps: [],
        overdue: false,

  status: 'pending',
  initials: '',        // например: 'ИС'
  avatarUrl: '',       // URL, если появится
  difficulty: 0,    // 1..10, либо null
  taskType: '',        // строка или ''


      },
    };
    setNodes((ns) => [...ns, makeNode(raw)]);
  }, [makeNode, setNodes]);

  const onConnect = useCallback(
    (params) => {
      didConnectRef.current = true;
      setEdges((es) => addEdge({ ...params, ...baseEdge }, es));
       setQuickMenu(m => ({ ...m, show: false }));
    },
    [setEdges]
  );

  const onNodesDelete = useCallback(
    (deleted) => setEdges((es) => es.filter((e) => !deleted.some((d) => e.source === d.id || e.target === d.id))),
    [setEdges]
  );




const onConnectStart = (event, { nodeId }) => {
  connectRef.current = nodeId;
  // позиция меню: от точки старта + смещение
  const bounds = wrapperRef.current?.getBoundingClientRect();
  if (!bounds) return;
  const startX = event.clientX - bounds.left;
  const startY = event.clientY - bounds.top;

const MENU_OFFSET_X = 200;  // вправо на 100px
const MENU_OFFSET_Y = -150;  // вверх на 40px

  // смещаем на ~100px вправо и чуть вверх
 setQuickMenu({ show: true, x: startX + MENU_OFFSET_X, y: startY + MENU_OFFSET_Y });
};




  const onConnectEnd = useCallback(
    (ev) => {


      setQuickMenu(m => ({ ...m, show: false }));
      const src = connectRef.current;
      connectRef.current = null;

      if (didConnectRef.current) {
        didConnectRef.current = false;
        return;
      }
      if (!src || !wrapperRef.current || !ev.target.classList.contains('react-flow__pane')) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = rf.project({ x: ev.clientX - bounds.left, y: ev.clientY - bounds.top });

      const newId = crypto.randomUUID();
      const raw = { id: newId, type: 'card', position, data: { label: 'Новая карточка', color: '#eeebdd', rule: '' } };

      setNodes((ns) => [...ns, makeNode(raw)]);
      setEdges((es) => addEdge({ id: crypto.randomUUID(), source: src, target: newId, ...baseEdge }, es));
    },
    [rf, makeNode, setNodes, setEdges]
  );

  /* persist */
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
      },
    }));
    saveFlow({ nodes: plain, edges });
  }, [nodes, edges]);

  /* deps для меню: входящие рёбра каждой цели */
  const nodesView = useMemo(
    () =>
      nodes.map((n) => {
        const incoming = edges.filter((e) => e.target === n.id);
        const deps = incoming.map((e) => ({
          edgeId: e.id,
          label: nodes.find((nn) => nn.id === e.source)?.data.label || `Задача ${e.source}`,
        }));
        return { ...n, data: { ...n.data, deps } };
      }),
    [nodes, edges]
  );

  return (
    <>
      <Toolbar
        onAdd={addNode}
        onReset={() => {
          localStorage.removeItem('rf-demo');
          setNodes([]);
          setEdges([]);
        }}
      />

      <div ref={wrapperRef} style={{ width: '100%', height: '100vh' }}>
        <ReactFlow
          nodes={nodesView}
          edges={edges}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          deleteKeyCode={['Delete', 'Backspace']}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={baseEdge}
          fitView
        >
          <Controls />
          <MiniMap
            nodeColor={(n) => (n.data.status === 'working' ? '#2196F3' : n.data.done ? '#8BC34A' : n.data.color)}
          />
          <Background />
        </ReactFlow>

{quickMenu.show && (
  <QuickMenu x={quickMenu.x} y={quickMenu.y} />
)}


      </div>
    </>
  );
}
