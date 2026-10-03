// Flow.tsx — React Flow + ELK.js: event-driven system with a message bus
//
//   raw edges ──▶ buildGraph() ──▶ nodes with derived handles + typed edges
//                             ──▶ ELK layered layout (self-invoking effect)
//
// deps: npm i @xyflow/react elkjs

import { useEffect, useMemo, useState } from 'react';
import {
    Background,
    Controls,
    Handle,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    type Edge,
    type Node,
    type NodeProps,
    type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs';

/* ────────────────────────────────────────────────────────────
   1. RAW DATA — your edge list
   s2s:   direct call  from → to
   event: from publishes, to consumes  (routed via the bus)
──────────────────────────────────────────────────────────── */

type RawEdge = { from: string; to: string; method: 's2s' | 'event' };

const RAW: RawEdge[] = [
    // synchronous service-to-service
    { from: 'api-gateway', to: 'orders', method: 's2s' },
    { from: 'api-gateway', to: 'users', method: 's2s' },
    { from: 'api-gateway', to: 'auth', method: 's2s' }, // auth: s2s only
    { from: 'orders', to: 'payments', method: 's2s' },

    // events (expand to: publisher → bus → consumer)
    { from: 'orders', to: 'notifications', method: 'event' },
    { from: 'payments', to: 'orders', method: 'event' },
    { from: 'users', to: 'notifications', method: 'event' },
    { from: 'payments', to: 'audit-log', method: 'event' }, // audit-log: events only
];

const BUS = 'bus';

/* ────────────────────────────────────────────────────────────
   2. HANDLE MODEL
   services: 4 fixed shared handles (s2s horizontal, events vertical)
   bus:      one handle per edge, fanned out (pub-* top / sub-* bottom)
──────────────────────────────────────────────────────────── */

type HandleDef = { id: string; position: Position };

const HANDLE_POS: Record<string, { side: 'source' | 'target'; position: Position }> = {
    's2s-out': { side: 'source', position: Position.Right },
    's2s-in': { side: 'target', position: Position.Left },
    'event-pub': { side: 'source', position: Position.Top },
    'event-sub': { side: 'target', position: Position.Bottom },
};

// pub-/sub- ids belong to the bus and are not in the static map
const handlePos = (id: string) =>
    HANDLE_POS[id] ??
    (id.startsWith('pub-')
        ? { side: 'target' as const, position: Position.Top }
        : { side: 'source' as const, position: Position.Bottom });

// derive a node's handles from the edges that actually reference it:
// a service with no s2s edges gets no dangling s2s dots
function buildHandles(nodeId: string, edges: Edge[]) {
    const used = new Set<string>();
    for (const e of edges) {
        if (e.source === nodeId && e.sourceHandle) used.add(e.sourceHandle);
        if (e.target === nodeId && e.targetHandle) used.add(e.targetHandle);
    }
    const pick = (side: 'source' | 'target'): HandleDef[] =>
        [...used]
            .filter((id) => handlePos(id).side === side)
            .map((id) => ({ id, position: handlePos(id).position }));
    return { targetHandles: pick('target'), sourceHandles: pick('source') };
}

/* ────────────────────────────────────────────────────────────
   3. RAW DATA → nodes + edges
──────────────────────────────────────────────────────────── */

const S2S_STYLE = { stroke: '#475569', strokeWidth: 1.5 };
const EVT_STYLE = { stroke: '#0ea5e9', strokeWidth: 1.5, strokeDasharray: '5 4' };

type ElkNodeData = {
    label: string;
    variant: 'service' | 'bus';
    width: number;
    height: number;
    targetHandles: HandleDef[];
    sourceHandles: HandleDef[];
};
type ElkFlowNode = Node<ElkNodeData, 'elk'>;

function buildGraph(raw: RawEdge[]) {
    // collect service ids
    const services = new Set<string>();
    for (const e of raw) {
        services.add(e.from);
        if (e.to !== BUS) services.add(e.to);
    }

    const edges: Edge[] = [];
    const seen = new Set<string>(); // dedupe shared bus edges (payments publishes twice)
    const publishers = new Set<string>();
    const subscribers = new Set<string>();

    for (const e of raw) {
        if (e.method === 's2s') {
            edges.push({
                id: `${e.from}->${e.to}`,
                source: e.from, sourceHandle: 's2s-out',
                target: e.to, targetHandle: 's2s-in',
                style: S2S_STYLE,
            });
            continue;
        }

        // event pair → two edges through the bus
        publishers.add(e.from);
        subscribers.add(e.to);

        const pub: Edge = {
            id: `${e.from}->${BUS}`,
            source: e.from, sourceHandle: 'event-pub',
            target: BUS, targetHandle: `pub-${e.from}`,
            style: EVT_STYLE,
        };
        const sub: Edge = {
            id: `${BUS}->${e.to}`,
            source: BUS, sourceHandle: `sub-${e.to}`,
            target: e.to, targetHandle: 'event-sub',
            style: EVT_STYLE,
        };
        if (!seen.has(pub.id)) { edges.push(pub); seen.add(pub.id); }
        if (!seen.has(sub.id)) { edges.push(sub); seen.add(sub.id); }
    }

    // bus width grows with its fan-out so handles don't crowd
    const busFan = Math.max(publishers.size, subscribers.size, 1);
    const busWidth = 40 * busFan + 60;

    const nodes: ElkFlowNode[] = [
        ...[...services].map((id) => ({
            id,
            type: 'elk' as const,
            position: { x: 0, y: 0 },
            data: {
                label: id,
                variant: 'service' as const,
                width: 150,
                height: 44,
                ...buildHandles(id, edges),
            },
        })),
        {
            id: BUS,
            type: 'elk' as const,
            position: { x: 0, y: 0 },
            data: {
                label: '🚌 Message Bus',
                variant: 'bus' as const,
                width: busWidth,
                height: 44,
                ...buildHandles(BUS, edges),
            },
        },
    ];

    return { nodes, edges };
}

/* ────────────────────────────────────────────────────────────
   4. CUSTOM NODE — renders the derived handles with fan-out
──────────────────────────────────────────────────────────── */

// N handles on one side spread out evenly instead of stacking
const offset = (i: number, n: number) => `${(((i + 1) / (n + 1)) * 100).toFixed(2)}%`;

function ElkNode(props: NodeProps) {
    const data = props.data as ElkNodeData;
    const isBus = data.variant === 'bus';

    const renderHandles = (defs: HandleDef[], type: 'source' | 'target') =>
        defs.map((h, i) => (
            <Handle
                key={h.id}
                id={h.id}
                type={type}
                position={h.position}
                style={{
                    ...(h.position === Position.Top || h.position === Position.Bottom
                        ? { left: offset(i, defs.length) }
                        : { top: offset(i, defs.length) }),
                    background: h.id.startsWith('s2s') ? '#475569' : '#0ea5e9',
                    width: 8,
                    height: 8,
                    border: 'none',
                }}
            />
        ));

    return (
        <div
            style={{
                width: data.width,
                height: data.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                padding: '0 10px',
                boxSizing: 'border-box',
                background: isBus ? '#e0f2fe' : '#ffffff',
                border: isBus ? '2px dashed #0ea5e9' : '1px solid #cbd5e1',
                color: isBus ? '#0369a1' : '#0f172a',
            }}
        >
            {renderHandles(data.targetHandles, 'target')}
            <span>{data.label}</span>
            {renderHandles(data.sourceHandles, 'source')}
        </div>
    );
}

const nodeTypes: NodeTypes = { elk: ElkNode };

/* ────────────────────────────────────────────────────────────
   5. ELK LAYOUT
──────────────────────────────────────────────────────────── */

const elk = new ELK();

const getLayoutedNodes = async (nodes: ElkFlowNode[], edges: Edge[]) => {
    const layout = await elk.layout({
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'RIGHT',
            'elk.layered.spacing.nodeNodeBetweenLayers': '70',
            'elk.layered.spacing.nodeNode': '40',
            // for bigger hub-and-spoke graphs try:
            // 'elk.algorithm': 'stress',
        },
        children: nodes.map((n) => ({ id: n.id, width: n.data.width, height: n.data.height })),
        edges: edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
    });

    return nodes.map((n) => {
        const l = layout.children?.find((c) => c.id === n.id);
        return l ? { ...n, position: { x: l.x ?? 0, y: l.y ?? 0 } } : n;
    });
};

/* ────────────────────────────────────────────────────────────
   6. FLOW + APP
──────────────────────────────────────────────────────────── */

export function Flow2() {
    const { getNodes, getEdges, setNodes, fitView } = useReactFlow();
    const { nodes, edges } = useMemo(() => buildGraph(RAW), []);
    const [init, setInit] = useState(true);

    // self-invoking layout effect
    useEffect(() => {
        (async () => {
            if (!init) return;

            const laid = await getLayoutedNodes(getNodes() as ElkFlowNode[], getEdges());
            setNodes(laid);
            requestAnimationFrame(() => fitView({ padding: 0.15 }));
        })();
    }, [init, getNodes, getEdges, setNodes, fitView]);

    return (
        <ReactFlow defaultNodes={nodes} defaultEdges={edges} nodeTypes={nodeTypes} minZoom={0.2}>
            <Background />
            <Controls />
        </ReactFlow>
    );
}

