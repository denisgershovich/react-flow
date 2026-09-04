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


const initialNodes: ElkNode[] = [

];

const initialEdges: Edge[] = [];

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
