import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { loadFlow, saveFlow } from '../service/storage';
import CardNode  from '../companet/CardNode';
import Toolbar   from '../companet/Toolbar';
import { MarkerType } from 'reactflow';

export default function FlowPage() {
  /* ─ helpers ─ */
  const nodeTypes = useMemo(() => ({ card: CardNode }), []);

  /* ─ state ─ */
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);





const defaultEdgeOptions = {
  type: 'default',
  animated: true,
  style: {
    stroke: '#007BFF',
    strokeWidth: 2,
    strokeDasharray: '6 4',
  },
  label: '📅',              // ← календарь-эмодзи
  labelStyle: {
    fill: '#007BFF',
    fontWeight: 600,
  },

 /* <<< стрелка */
  markerEnd: {
    type: MarkerType.ArrowClosed,   // Arrow, ArrowClosed, ArrowClosedAlt …
    width: 20,                      // размер
    height: 20,
    color: '#007BFF',               // цвет наконечника
  },



  labelBgStyle: {           // фон под текстом (необязательно)
    fill: 'white',
    fillOpacity: 0.8,
  },
  labelBgPadding: [4, 2],
  labelBgBorderRadius: 4,
};












  /* ─ factory: прикручивает onColor / onTitle / onDelete ─ */
  const makeNode = useCallback(
    raw => ({
      ...raw,
      data: {
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

  /* ─ загрузка сохранённого графа один раз ─ */
  useEffect(() => {
    const { nodes: savedNodes, edges: savedEdges } = loadFlow();
    setNodes(savedNodes.map(makeNode));
    setEdges(savedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // выполняем только при первом рендере

  /* ─ добавление новой карточки ─ */
  const addNode = useCallback(() => {
    const raw = {
      id: crypto.randomUUID(),
      type: 'card',
      position: { x: 100, y: 100 },
      data: {
        label: 'Новая карточка',
        color: '#FFD700',
         done: false,
      },
    };
    setNodes(ns => [...ns, makeNode(raw)]);
  }, [makeNode, setNodes]);

  /* ─ соединение ─ */
  const onConnect = useCallback(
    params => setEdges(es => addEdge(params, es)),
    [setEdges],
  );

  /* ─ удаление клавишами Delete/Backspace ─ */
  const onNodesDelete = useCallback(
    deleted =>
      setEdges(es =>
        es.filter(e => !deleted.some(d => e.source === d.id || e.target === d.id)),
      ),
    [setEdges],
  );

  /* ─ автосохранение, но без функций ─ */
  useEffect(() => {
    const plainNodes = nodes.map(({ data, ...n }) => ({
      ...n,
      data: { label: data.label, color: data.color, done: data.done },
    }));
    saveFlow({ nodes: plainNodes, edges });
  }, [nodes, edges]);

  /* ─ очистка графа кнопкой 🗑 ─ */
  const resetFlow = () => {
    localStorage.removeItem('rf-demo');
    setNodes([]);
    setEdges([]);
  };

  /* ─ UI ─ */
  return (
    <>
      <Toolbar onAdd={addNode} onReset={resetFlow} />

      <div style={{ width: '100%', height: '100vh' }}>
        <ReactFlow


          defaultEdgeOptions={defaultEdgeOptions}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          deleteKeyCode={['Delete', 'Backspace']}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap nodeColor={n => n.data.color} />
          <Background />
        </ReactFlow>
      </div>
    </>
  );
}
