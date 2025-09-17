"use client";

import { create } from "zustand";
import {
  NodeCategory,
  NetworkEdge,
  NetworkNode,
  filterCategories,
  networkEdges,
  networkNodes,
} from "@/lib/network-data";

export interface NetworkState {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  activeFilters: NodeCategory[];
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  spotlightNodeId: string | null;
  commandPaletteOpen: boolean;
  recenterTick: number;
  toggleFilter: (category: NodeCategory) => void;
  setHoveredNode: (nodeId: string | null) => void;
  selectNode: (nodeId: string | null) => void;
  clearSelection: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSpotlightNode: (nodeId: string | null) => void;
  cycleSpotlight: (direction: 1 | -1) => string | null;
  triggerRecenter: () => void;
  traceRoute: (targetId: string | null) => string[];
  visibleNodes: () => NetworkNode[];
  isNodeVisible: (nodeId: string) => boolean;
}

const CORE_ROUTER_ID = "smit-core";

const sortByOrbit = (items: NetworkNode[]) =>
  [...items].sort((a, b) => (a.orbit ?? 0) - (b.orbit ?? 0));

const buildAdjacency = (edges: NetworkEdge[]) => {
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, new Set());
    }
    if (!adjacency.has(edge.to)) {
      adjacency.set(edge.to, new Set());
    }
    adjacency.get(edge.from)!.add(edge.to);
    adjacency.get(edge.to)!.add(edge.from);
  }
  return adjacency;
};

const computeRoute = (
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  targetId: string | null,
): string[] => {
  if (!targetId) return [];
  if (targetId === CORE_ROUTER_ID) return [CORE_ROUTER_ID];
  const adjacency = buildAdjacency(edges);
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; path: string[] }> = [
    { nodeId: CORE_ROUTER_ID, path: [CORE_ROUTER_ID] },
  ];

  while (queue.length) {
    const { nodeId, path } = queue.shift()!;
    if (nodeId === targetId) {
      return path;
    }
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const neighbors = adjacency.get(nodeId);
    if (!neighbors) continue;
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      queue.push({ nodeId: neighbor, path: [...path, neighbor] });
    }
  }

  const exists = nodes.some((node) => node.id === targetId);
  return exists ? [CORE_ROUTER_ID, targetId] : [CORE_ROUTER_ID];
};

export const useNetworkStore = create<NetworkState>((set, get) => ({
  nodes: networkNodes,
  edges: networkEdges,
  activeFilters: [...filterCategories],
  hoveredNodeId: null,
  selectedNodeId: null,
  spotlightNodeId: null,
  commandPaletteOpen: false,
  recenterTick: 0,
  toggleFilter: (category) => {
    if (!filterCategories.includes(category)) return;
    set((state) => {
      const isActive = state.activeFilters.includes(category);
      let nextFilters = state.activeFilters;
      if (isActive) {
        const filtered = state.activeFilters.filter((item) => item !== category);
        nextFilters = filtered.length ? filtered : [...filterCategories];
      } else {
        nextFilters = [...state.activeFilters, category];
      }
      return { activeFilters: nextFilters };
    });
  },
  setHoveredNode: (nodeId) => {
    set({ hoveredNodeId: nodeId ?? null });
  },
  selectNode: (nodeId) => {
    set((state) => ({
      selectedNodeId: nodeId,
      spotlightNodeId: nodeId ?? state.spotlightNodeId,
      commandPaletteOpen: false,
    }));
  },
  clearSelection: () => set({ selectedNodeId: null }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSpotlightNode: (nodeId) =>
    set({ spotlightNodeId: nodeId, hoveredNodeId: nodeId }),
  cycleSpotlight: (direction) => {
    const state = get();
    const visible = sortByOrbit(state.visibleNodes());
    if (!visible.length) return null;
    const currentIndex = visible.findIndex((node) => node.id === state.spotlightNodeId);
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + direction + visible.length) % visible.length;
    const nextNode = visible[nextIndex];
    if (!nextNode) return null;
    set({ spotlightNodeId: nextNode.id, hoveredNodeId: nextNode.id });
    return nextNode.id;
  },
  triggerRecenter: () => set((state) => ({ recenterTick: state.recenterTick + 1 })),
  traceRoute: (targetId) => {
    const state = get();
    return computeRoute(state.nodes, state.edges, targetId);
  },
  visibleNodes: () => {
    const state = get();
    return state.nodes.filter((node) => state.isNodeVisible(node.id));
  },
  isNodeVisible: (nodeId) => {
    const state = get();
    const node = state.nodes.find((item) => item.id === nodeId);
    if (!node) return false;
    if (node.kind === "core" || node.kind === "section") return true;
    return state.activeFilters.includes(node.category);
  },
}));

export const useNetworkNodes = () =>
  useNetworkStore((state) => state.nodes);

export const useVisibleNetworkNodes = () =>
  useNetworkStore((state) => state.visibleNodes());

export const useNetworkEdges = () =>
  useNetworkStore((state) => state.edges);

export const useActiveFilters = () =>
  useNetworkStore((state) => state.activeFilters);

export const useHoveredNodeId = () =>
  useNetworkStore((state) => state.hoveredNodeId);

export const useSelectedNodeId = () =>
  useNetworkStore((state) => state.selectedNodeId);

export const useCommandPaletteState = () =>
  useNetworkStore((state) => ({
    open: state.commandPaletteOpen,
    setOpen: state.setCommandPaletteOpen,
  }));
