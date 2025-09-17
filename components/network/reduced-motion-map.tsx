"use client";

import { useMemo } from "react";
import { useNetworkStore } from "@/hooks/use-network-store";
import { NodeCategory } from "@/lib/network-data";

const CATEGORY_COLORS: Record<NodeCategory | "fallback", string> = {
  Frontend: "#1DE9B6",
  Backend: "#8A4FFF",
  Mobile: "#FFB300",
  IoT: "#4DD1FF",
  Networking: "#FF7AC3",
  Data: "#4DD1FF",
  Core: "#FFFFFF",
  Writing: "#8A4FFF",
  fallback: "#8891AA",
};

interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const buildBounds = (positions: Array<[number, number]>) => {
  const xs = positions.map((pos) => pos[0]);
  const ys = positions.map((pos) => pos[1]);
  return {
    minX: Math.min(...xs, -8),
    maxX: Math.max(...xs, 8),
    minY: Math.min(...ys, -8),
    maxY: Math.max(...ys, 8),
  } satisfies ViewportBounds;
};

const scalePoint = (value: number, min: number, max: number, range: number) => {
  if (max - min === 0) return range / 2;
  return ((value - min) / (max - min)) * range;
};

export function ReducedMotionMap() {
  const nodes = useNetworkStore((state) => state.nodes);
  const edges = useNetworkStore((state) => state.edges);
  const hoveredNodeId = useNetworkStore((state) => state.hoveredNodeId);
  const selectedNodeId = useNetworkStore((state) => state.selectedNodeId);
  const spotlightNodeId = useNetworkStore((state) => state.spotlightNodeId);
  const isNodeVisible = useNetworkStore((state) => state.isNodeVisible);
  const traceRoute = useNetworkStore((state) => state.traceRoute);

  const visibleNodes = useMemo(
    () => nodes.filter((node) => isNodeVisible(node.id)),
    [nodes, isNodeVisible],
  );

  const bounds = useMemo(() => {
    const positions = visibleNodes.map((node) => [node.position[0], node.position[1]] as [number, number]);
    return buildBounds(positions);
  }, [visibleNodes]);

  const route = useMemo(
    () => traceRoute(selectedNodeId ?? spotlightNodeId ?? null),
    [selectedNodeId, spotlightNodeId, traceRoute],
  );
  const routeSet = useMemo(() => new Set(route), [route]);

  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 420 420"
      role="presentation"
      aria-hidden
    >
      <defs>
        <radialGradient id="hud" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1DE9B6" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#0B0D12" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width="420" height="420" fill="url(#hud)" opacity={0.45} />
      {edges
        .filter((edge) => isNodeVisible(edge.from) && isNodeVisible(edge.to))
        .map((edge) => {
          const from = nodes.find((node) => node.id === edge.from);
          const to = nodes.find((node) => node.id === edge.to);
          if (!from || !to) return null;
          const x1 = scalePoint(from.position[0], bounds.minX, bounds.maxX, 420);
          const y1 = scalePoint(from.position[1], bounds.minY, bounds.maxY, 420);
          const x2 = scalePoint(to.position[0], bounds.minX, bounds.maxX, 420);
          const y2 = scalePoint(to.position[1], bounds.minY, bounds.maxY, 420);
          const active = routeSet.has(edge.from) && routeSet.has(edge.to);
          return (
            <line
              key={edge.id}
              x1={x1}
              y1={420 - y1}
              x2={x2}
              y2={420 - y2}
              stroke={CATEGORY_COLORS[edge.category] ?? CATEGORY_COLORS.fallback}
              strokeWidth={active ? 2.4 : 1}
              strokeOpacity={active ? 0.8 : 0.35}
            />
          );
        })}
      {visibleNodes.map((node) => {
        const cx = scalePoint(node.position[0], bounds.minX, bounds.maxX, 420);
        const cy = scalePoint(node.position[1], bounds.minY, bounds.maxY, 420);
        const active = node.id === selectedNodeId;
        const highlighted = routeSet.has(node.id) || node.id === hoveredNodeId;
        return (
          <g key={node.id} transform={`translate(${cx}, ${420 - cy})`}>
            <circle
              r={highlighted ? 9 : 6}
              fill={CATEGORY_COLORS[node.category] ?? CATEGORY_COLORS.fallback}
              fillOpacity={active ? 0.95 : 0.7}
              stroke="#0B0D12"
              strokeWidth={1.2}
            />
            <text
              x={12}
              y={4}
              fill="#E4F3FF"
              opacity={active || highlighted ? 1 : 0.7}
              fontSize={10}
              fontFamily="var(--font-sora), 'Sora', sans-serif"
              letterSpacing="0.28em"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
