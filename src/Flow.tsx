import {
  ReactFlow, type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ElkNode from './ElkNode';
import useLayoutNodes from './useLayoutNodes';

export type ElkNodeData = {
  label: string;
  sourceHandles: { id: string }[];
  targetHandles: { id: string }[];
};

export type ElkNode = Node<ElkNodeData, 'elk'>;

const nodeTypes = {
  elk: ElkNode,
};


const Flow = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  useLayoutNodes();
  return (
    <ReactFlow
      style={{
        border: "1px solid lime"
      }}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
    />
  );
};

export default Flow;


const initialNodes: ElkNode[] = [
  {
    id: 'a',
    data: {
      label: 'A',
      // we need unique ids for the handles (called 'ports' in elkjs) for the layouting
      // an id is structured like: nodeId-source/target-id
      sourceHandles: [{ id: 'a-s-a' }, { id: 'a-s-b' }, { id: 'a-s-c' }],
      targetHandles: [],
    },
    position: { x: 0, y: 0 },
    type: 'elk',
  },
  {
    id: 'b',
    data: {
      label: 'B',
      sourceHandles: [{ id: 'b-s-a' }, { id: 'b-s-b' }],
      targetHandles: [{ id: 'b-t-a' }, { id: 'b-t-b' }, { id: 'b-t-c' }],
    },
    position: { x: 0, y: 0 },
    type: 'elk',
  },
  {
    id: 'c',
    data: {
      label: 'C',
      sourceHandles: [{ id: 'c-s-a' }, { id: 'c-s-b' }],
      targetHandles: [{ id: 'c-t-a' }, { id: 'c-t-b' }, { id: 'c-t-c' }],
    },
    position: { x: 0, y: 0 },
    type: 'elk',
  },
  {
    id: 'd',
    data: {
      label: 'D',
      sourceHandles: [{ id: 'd-s-a' }],
      targetHandles: [{ id: 'd-t-a' }, { id: 'd-t-b' }, { id: 'd-t-c' }],
    },
    position: { x: 0, y: 0 },
    type: 'elk',
  },
  {
    id: 'e',
    data: {
      label: 'E',
      sourceHandles: [{ id: 'e-s-a' }],
      targetHandles: [{ id: 'e-t-a' }],
    },
    position: { x: 0, y: 0 },
    type: 'elk',
  },
  {
    id: 'f',
    data: {
      label: 'F',
      sourceHandles: [{ id: 'f-s-a' }],
      targetHandles: [{ id: 'f-t-a' }, { id: 'f-t-b' }],
    },
    position: { x: 0, y: 0 },
    type: 'elk',
  },
  {
    id: 'g',
    data: {
      label: 'G',
      sourceHandles: [{ id: 'g-s-a' }],
      targetHandles: [{ id: 'g-t-a' }, { id: 'g-t-b' }],
    },
    position: { x: 0, y: 0 },
    type: 'elk',
  },
];



const initialEdges: Edge[] = [
  {
    id: 'a-b',
    source: 'a',
    sourceHandle: 'a-s-a',
    target: 'b',
    targetHandle: 'b-t-a',
  },
  {
    id: 'a-c',
    source: 'a',
    sourceHandle: 'a-s-c',
    target: 'c',
    targetHandle: 'c-t-c',
  },
  {
    id: 'a-d',
    source: 'a',
    sourceHandle: 'a-s-b',
    target: 'd',
    targetHandle: 'd-t-b',
  },
  {
    id: 'b-e',
    source: 'b',
    sourceHandle: 'b-s-a',
    target: 'e',
    targetHandle: 'e-t-a',
  },
  {
    id: 'd-e',
    source: 'd',
    sourceHandle: 'd-s-a',
    target: 'e',
    targetHandle: 'e-t-a',
  },
  {
    id: 'e-f',
    source: 'e',
    sourceHandle: 'e-s-a',
    target: 'f',
    targetHandle: 'f-t-b',
  },
  {
    id: 'e-g',
    source: 'e',
    sourceHandle: 'e-s-a',
    target: 'g',
    targetHandle: 'g-t-a',
  },
];


