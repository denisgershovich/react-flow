import { useEffect } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { type Edge, useNodesInitialized, useReactFlow } from '@xyflow/react';
import type { ElkNode } from './Flow';

const opt = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.layered.spacing.edgeNodeBetweenLayers': '40',
  'elk.spacing.nodeNode': '40',
  'elk.layered.nodePlacement.strategy': 'SIMPLE',
};

const elk = new ELK();

export const getLayoutedNodes = async (nodes: ElkNode[], edges: Edge[]) => {
  const g = {
    id: 'root',
    layoutOptions: opt,
    children: nodes.map((n) => {
      const tPorts = n.data.targetHandles.map((t) => ({
        id: t.id,
        properties: {
          side: 'WEST',
        },
      }));
      const sPorts = n.data.sourceHandles.map((s) => ({
        id: s.id,
        properties: {
          side: 'EAST',
        },
      }));

      return {
        id: n.id,
        width: n.width ?? 150,
        height: n.height ?? 50,
        properties: {
          'org.eclipse.elk.portConstraints': 'FIXED_ORDER',
        },
        ports: [{ id: n.id }, ...tPorts, ...sPorts],
      };
    }),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.sourceHandle || e.source],
      targets: [e.targetHandle || e.target],
    })),
  };

  const layouted = await elk.layout(g);

  return nodes.map((node) => {
    const n = layouted.children?.find((lgNode) => lgNode.id === node.id);

    return {
      ...node,
      position: {
        x: n?.x ?? 0,
        y: n?.y ?? 0,
      },
    };
  });

};

export default function useLayoutNodes() {
  const init = useNodesInitialized();
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow<ElkNode>();

  useEffect(() => {
    (async () => {
      if (!init) return;

      const n = await getLayoutedNodes(getNodes() as ElkNode[], getEdges());
      setNodes(n);
      fitView();
    })();
  }, [init, getNodes, getEdges, setNodes, fitView]);

  return null;
}