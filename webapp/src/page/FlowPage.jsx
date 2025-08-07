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
import { useCallback, useEffect, useMemo, useRef } from 'react';
import 'reactflow/dist/style.css';

import { loadFlow, saveFlow } from '../service/storage';
import CardNode     from '../companet/CardNode';
import Toolbar      from '../companet/Toolbar';

/* ---------- обёртка ---------- */
export default function FlowPage() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}

/* ---------- основная логика внутри провайдера ---------- */
function Canvas() {
  /* helpers */
  const rf          = useReactFlow();
  const nodeTypes   = useMemo(() => ({ card: CardNode }), []);
  const connectRef  = useRef(null);              // id исходного узла

  /* состояние */
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);


const wrapperRef = useRef(null);


  /* фабрика: «ре-гидрирует» узел коллбэками */
  const makeNode = useCallback(
    raw => ({
      ...raw,
      data: {
        done: false,
        ...raw.data,
        onTitle: (id, t) =>
          setNodes(ns =>
            ns.map(n => (n.id === id ? { ...n, data: { ...n.data, label: t } } : n)),
          ),
        onColor: (id, c) =>
          setNodes(ns =>
            ns.map(n => (n.id === id ? { ...n, data: { ...n.data, color: c } } : n)),
          ),
        onToggle: (id, val) =>
          setNodes(ns =>
            ns.map(n => (n.id === id ? { ...n, data: { ...n.data, done: val } } : n)),
          ),
        onDelete: id => {
          setNodes(ns => ns.filter(n => n.id !== id));
          setEdges(es => es.filter(e => e.source !== id && e.target !== id));
        },
      },
    }),
    [setNodes, setEdges],
  );

  /* загрузка из localStorage */
  useEffect(() => {
    const { nodes: n, edges: e } = loadFlow();
    setNodes(n.map(makeNode));
    setEdges(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* добавить карточку (кнопка «+») */
  const addNode = useCallback(() => {
    const raw = {
      id: crypto.randomUUID(),
      type: 'card',
      position: { x: 100, y: 100 },
      data: { label: 'Новая карточка', color: '#FFD700', done: false },
    };
    setNodes(ns => [...ns, makeNode(raw)]);
  }, [makeNode, setNodes]);

  /* базовый стиль рёбер */
  const edgeStyle = {
    type: 'straight',
    animated: true,
    style: { stroke: '#007BFF', strokeWidth: 2, strokeDasharray: '6 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#007BFF' },
    label: '📅',
    labelStyle: { fill: '#007BFF', fontWeight: 600 },
  };

  /* соединение двух узлов (обычное) */
  const onConnect = useCallback(
    params => setEdges(es => addEdge({ ...params, ...edgeStyle }, es)),
    [setEdges],
  );

  /* Delete / Backspace */
  const onNodesDelete = useCallback(
    deleted =>
      setEdges(es =>
        es.filter(e => !deleted.some(d => e.source === d.id || e.target === d.id)),
      ),
    [setEdges],
  );

  /* ---------- add-node-on-edge-drop ---------- */
  const onConnectStart = (_, { nodeId }) => (connectRef.current = nodeId);

  const onConnectEnd = useCallback(
    event => {
      const sourceId = connectRef.current;
      connectRef.current = null;

      if (
   !sourceId ||
   !rf ||
   !event.target.classList.contains('react-flow__pane') ||
   !wrapperRef.current            // ← контейнер ещё не смонтирован
 )
        return;

   const bounds = wrapperRef.current.getBoundingClientRect();
   const position = rf.project({
     x: event.clientX - bounds.left,
     y: event.clientY - bounds.top,
   });
      const newId = crypto.randomUUID();
      const raw   = {
        id: newId,
        type: 'card',
        position,
        data: { label: 'Новая карточка', color: '#FFD700', done: false },
      };
      setNodes(ns => [...ns, makeNode(raw)]);
      setEdges(es => addEdge({ id: crypto.randomUUID(), source: sourceId, target: newId, ...edgeStyle }, es));
    },
    [makeNode, rf, setEdges, setNodes],
  );
  /* ------------------------------------------- */

  /* автосохраняем без функций */
  useEffect(() => {
    const plain = nodes.map(({ data, ...n }) => ({
      ...n,
      data: { label: data.label, color: data.color, done: data.done },
    }));
    saveFlow({ nodes: plain, edges });
  }, [nodes, edges]);

  /* сброс графа */
  const resetFlow = () => {
    localStorage.removeItem('rf-demo');
    setNodes([]);
    setEdges([]);
  };

  /* ---------- UI ---------- */
  return (
    <>
      <Toolbar onAdd={addNode} onReset={resetFlow} />

   <div ref={wrapperRef} style={{ width: '100%', height: '100vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          deleteKeyCode={['Delete', 'Backspace']}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={edgeStyle}
          fitView
        >
          <Controls />
          <MiniMap nodeColor={n => (n.data.done ? '#8BC34A' : n.data.color)} />
          <Background />
        </ReactFlow>
      </div>
    </>
  );
}
