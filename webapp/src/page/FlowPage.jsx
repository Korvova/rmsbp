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
import CardNode from '../companet/CardNode';
import Toolbar  from '../companet/Toolbar';
import DeletableEdge from '../companet/DeletableEdge';

export default function FlowPage() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}

function Canvas() {
  const rf          = useReactFlow();


const nodeTypes   = useMemo(() => ({ card: CardNode }), []);
const edgeTypes   = useMemo(() => ({ deletable: DeletableEdge }), []);

  const connectRef  = useRef(null);
  const wrapperRef  = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const didConnectRef = useRef(false);   // ← флаг: была ли нормальная связь

  /* ---------- фабрика узла ---------- */
  const makeNode = useCallback(raw => ({
    ...raw,
    data: {
      done: false,
      status: 'pending',
       cancelPolicy: { enabled: false, mode: 'none' },
      ...raw.data,

      onTitle: (id, t) => setNodes(ns =>
        ns.map(n => n.id === id ? { ...n, data:{ ...n.data, label:t }} : n)
      ),
      onColor: (id, c) => setNodes(ns =>
        ns.map(n => n.id === id ? { ...n, data:{ ...n.data, color:c }} : n)
      ),
      onToggle: (id, val) => setNodes(ns =>
        ns.map(n => n.id === id
          ? { ...n, data:{ ...n.data, done:val, status: val ? 'done' : n.data.status }}
          : n),
      ),

      onCancel: id => setNodes(ns =>
        ns.map(n => n.id === id ? { ...n, data:{ ...n.data, status:'cancel' }} : n)
      ),
      onFreeze: id => setNodes(ns =>
        ns.map(n => n.id === id ? { ...n, data:{ ...n.data, status:'frozen'}} : n)
      ),



   onCancelPolicyToggle: (id, enabled) => setNodes(ns =>
     ns.map(n => n.id === id ? { ...n, data:{ ...n.data, cancelPolicy:{ ...n.data.cancelPolicy, enabled } } } : n)
   ),
   onCancelPolicyChange: (id, mode) => setNodes(ns =>
     ns.map(n => n.id === id ? { ...n, data:{ ...n.data, cancelPolicy:{ ...n.data.cancelPolicy, mode } } } : n)
   ),





      onDelete: id => {
        setNodes(ns => ns.filter(n => n.id !== id));
        setEdges(es => es.filter(e => e.source !== id && e.target !== id));
      },

      onRuleChange: (id, val) => setNodes(ns =>
        ns.map(n => n.id === id ? { ...n, data:{ ...n.data, rule:val }} : n)
      ),
    },
  }), [setNodes, setEdges]);

  /* ---------- загрузка ---------- */
  useEffect(() => {
    const { nodes: n, edges: e } = loadFlow();
    setNodes(n.map(makeNode));
    setEdges(e);
  }, []); // eslint-disable-line

  /* ---------- стили рёбер ---------- */
  const edgeStyleForRule = rule => {
    switch (rule) {
      case 'afterAny':
      case 'afterAll':
      case 'afterSelected':
        return { animated:true, style:{ stroke:'#4CAF50', strokeDasharray:'6 4', strokeWidth:2 }};
      case 'afterAnyDelay':
        return { animated:true, style:{ stroke:'#007BFF', strokeDasharray:'6 4', strokeWidth:2 }, label:'⏰' };
      case 'afterAnyDate':
        return { animated:true, style:{ stroke:'#007BFF', strokeDasharray:'6 4', strokeWidth:2 }, label:'📅' };
      case 'atDate':
        return { animated:false, style:{ stroke:'#007BFF', strokeWidth:2 }, label:'📅' };
      case 'cancelIfPrevCanceled':
        return { animated:true, style:{ stroke:'#9C27B0', strokeDasharray:'6 4', strokeWidth:2 }};
      case 'cancelIfAnySelectedCanceled':
        return { animated:true, style:{ stroke:'url(#blueRed)', strokeDasharray:'6 4', strokeWidth:2 }};
      default:
        return { animated:false, style:{ stroke:'#007BFF', strokeWidth:2 }};
    }
  };




const cancelOverlay = (policy) => {
  if (!policy?.enabled) return {};
  switch (policy.mode) {
    case 'prevCanceled':
      return { animated:true, style:{ stroke:'#9C27B0', strokeDasharray:'6 4', strokeWidth:2 } };
    case 'anySelectedCanceled':
      return { animated:true, style:{ stroke:'#FF5252',  strokeDasharray:'6 4', strokeWidth:2 } }; // красный пунктир
    case 'none':
    default:
      return {};
  }
};








  /* перекрашиваем рёбра, если rule изменился */
                     // edges не в зависимостях

useEffect(() => {
  setEdges(es => {
    let changed = false;

    const next = es.map(e => {
      const srcNode = nodes.find(n => n.id === e.source);
      const trgNode = nodes.find(n => n.id === e.target);

      // 1) базовый стиль по правилу ЦЕЛИ
      const ruleStyled   = edgeStyleForRule(trgNode?.data.rule);
      // 2) оверлей политики отмены ЦЕЛИ
      const cancelStyled = cancelOverlay(trgNode?.data.cancelPolicy);

      let styled = {
        ...e,
        ...ruleStyled,
        animated: cancelStyled.animated ?? ruleStyled.animated,
        style: { ...ruleStyled.style, ...cancelStyled.style },
        label: cancelStyled.label ?? ruleStyled.label,
      };

      // 3) принудительные перекрытия по статусам узлов
      const srcStatus = srcNode?.data.status;
      const trgStatus = trgNode?.data.status;

      if (srcStatus === 'cancel' || trgStatus === 'cancel') {
        styled = {
          ...styled,
          animated: false,
          style: { ...styled.style, stroke: '#F44336', strokeDasharray: undefined },
        };
      } else if (srcStatus === 'done' || trgStatus === 'done') {
        styled = {
          ...styled,
          animated: false,
          style: { ...styled.style, stroke: '#4CAF50', strokeDasharray: undefined },
        };
      }

      if (
        !changed &&
        (
          e.animated !== styled.animated ||
          e.style?.stroke !== styled.style?.stroke ||
          e.style?.strokeDasharray !== styled.style?.strokeDasharray ||
          e.label !== styled.label
        )
      ) {
        changed = true;
      }

      return styled;
    });

    return changed ? next : es;
  });
}, [nodes, edges]); // ← добавили edges





  

  /* карточка переключается в working, если любая предыдущая done */
  useEffect(() => {
  setNodes(ns => {
    let changed = false;
    const next = ns.map(t => {
      if (t.data.rule !== 'afterAny' || t.data.status !== 'pending') return t;
      const incoming = edges.filter(e => e.target === t.id);
      const anyDone = incoming.some(e => {
        const src = ns.find(n => n.id === e.source);
        return src?.data.done;
      });
      if (anyDone) {
        changed = true;
        return { ...t, data:{ ...t.data, status:'working' } };
      }
      return t;
    });
    return changed ? next : ns;      // обновляем только при реальном переходе
  });
}, [nodes, edges]);                      // зависим только от edges!




/* если включена политика отмены, и любая предыдущая = cancel → текущая = cancel */
useEffect(() => {
  setNodes(ns => {
    let changed = false;
    const next = ns.map(t => {
      const policy = t.data.cancelPolicy;
      if (!policy?.enabled || policy.mode === 'none') return t;

      const incoming = edges.filter(e => e.target === t.id);
      const anyCanceled = incoming.some(e => {
        const src = ns.find(n => n.id === e.source);
        return src?.data.status === 'cancel';
      });

      // отмена сильнее "в работу"; не трогаем, если уже done или cancel
      if (anyCanceled && t.data.status !== 'cancel' && t.data.status !== 'done') {
        changed = true;
        return { ...t, data: { ...t.data, status: 'cancel' } };
      }
      return t;
    });
    return changed ? next : ns;
  });
}, [nodes, edges]);




  /* ---------- базовый стиль рёбер ---------- */
  const baseEdge = {
     type:'deletable',
  animated:false,
  style:{ stroke:'#007BFF', strokeWidth:2 },   // ← сплошная
    markerEnd:{ type:MarkerType.ArrowClosed, color:'#007BFF' },
    label:'',
    labelStyle:{ fill:'#007BFF', fontWeight:600 },
  };

  /* ---------- добавление карточки ---------- */
  const addNode = useCallback(() => {
    const raw = {
      id: crypto.randomUUID(),
      type:'card',
      position:{ x:100, y:100 },
      data:{ label:'Новая карточка', color:'#fcf9e9', rule:'',
       cancelPolicy:{ enabled:false, mode:'none' } },


    };
    setNodes(ns => [...ns, makeNode(raw)]);
  }, [makeNode]);

  /* ---------- onConnect ---------- */
 const onConnect = useCallback(params => {
   didConnectRef.current = true;                             // отметим успех
   setEdges(es => addEdge({ ...params, ...baseEdge }, es));
 }, [setEdges]);

  /* ---------- Delete / Backspace ---------- */
  const onNodesDelete = useCallback(deleted =>
    setEdges(es => es.filter(e =>
      !deleted.some(d => e.source === d.id || e.target === d.id))),
  [setEdges]);

  /* ---------- Add-Node-On-Edge-Drop ---------- */
  const onConnectStart = (_, { nodeId }) => (connectRef.current = nodeId);

  const onConnectEnd = useCallback(ev => {
    const src = connectRef.current;

    connectRef.current = null;


   // если связь уже создана штатно — ничего не добавляем
   if (didConnectRef.current) {
     didConnectRef.current = false;
     return;
   }




    if (!src || !wrapperRef.current || !ev.target.classList.contains('react-flow__pane'))
      return;

    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = rf.project({ x: ev.clientX - bounds.left, y: ev.clientY - bounds.top });

    const newId = crypto.randomUUID();
    const raw   = { id:newId, type:'card', position,
                    data:{ label:'Новая карточка', color:'#eeebdd', rule:'' } };

    setNodes(ns => [...ns, makeNode(raw)]);
    setEdges(es => addEdge({ id:crypto.randomUUID(), source:src, target:newId, ...baseEdge }, es));
  }, [rf, makeNode]);

  /* ---------- persist ---------- */
  useEffect(() => {
    const plain = nodes.map(({ data, ...n }) => ({
      ...n,
      data:{
        label:data.label, color:data.color, done:data.done,
        rule:data.rule,   status:data.status, cancelPolicy:data.cancelPolicy,
      },
    }));
    saveFlow({ nodes:plain, edges });
  }, [nodes, edges]);

  /* ---------- UI ---------- */
  return (
    <>
      <Toolbar onAdd={addNode} onReset={() => {
        localStorage.removeItem('rf-demo');
        setNodes([]); setEdges([]);
      }}/>

      <div ref={wrapperRef} style={{ width:'100%', height:'100vh' }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          deleteKeyCode={['Delete','Backspace']}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={baseEdge}
          fitView
        >
          <Controls/>
          <MiniMap nodeColor={n => n.data.status === 'working'
            ? '#2196F3'
            : n.data.done ? '#8BC34A' : n.data.color}/>
          <Background/>
        </ReactFlow>
      </div>
    </>
  );
}
