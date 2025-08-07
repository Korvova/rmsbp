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
import CardNode from '../companet/CardNode';
import Toolbar   from '../companet/Toolbar';

export default function FlowPage() {
  /* начальное состояние из localStorage */
  const initial               = useMemo(() => loadFlow(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  /* фикс ворнинга #002 ― мемоизируем nodeTypes */
  const nodeTypes = useMemo(() => ({ card: CardNode }), []);

  /* ────────── callbacks ────────── */

  /* добавить карточку */
  const addNode = useCallback(() => {
    setNodes(nds => [
      ...nds,
      {
        id: crypto.randomUUID(),
        type: 'card',
        position: { x: 100, y: 100 },
        data: {
          label: 'Новая карточка',
          color: '#FFD700',
          onTitle:  (id, t) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, label:t }} : n)),
          onColor:  (id, c) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data:{ ...n.data, color:c }} : n)),
          onDelete: deleteNode,
        },
      },
    ]);
  }, [setNodes, deleteNode]);







 const deleteNode = useCallback(
    id => {
      setNodes(ns => ns.filter(n => n.id !== id));
      setEdges(es => es.filter(e => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges],
  );






  /* соединить два узла линией */
  const onConnect = useCallback(
    params => setEdges(eds => addEdge(params, eds)),
    [setEdges],
  );

  /* удаляем связи, если удалили узел */
  const onNodesDelete = useCallback(
    deleted =>
      setEdges(eds =>
        eds.filter(e => !deleted.some(d => d.id === e.source || d.id === e.target))
      ),
    [setEdges],
  );

  /* автосохраняем в localStorage */
  useEffect(() => saveFlow({ nodes, edges }), [nodes, edges]);

  /* ────────── UI ────────── */
  return (
    <>
      <Toolbar onAdd={addNode} />

      {/* родитель с явной шириной/высотой ⇣⇣⇣ */}
      <div style={{ width: '100%', height: '100vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />                      {/* панель зума/центрирования */}
          <MiniMap nodeColor={n => n.data.color} />
          <Background />
        </ReactFlow>
      </div>
    </>
  );
}
