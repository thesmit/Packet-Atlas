"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { filterCategories, NodeCategory, NetworkNode } from "@/lib/network-data";
import { useNetworkStore } from "@/hooks/use-network-store";

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  Frontend: "#1DE9B6",
  Backend: "#8A4FFF",
  Mobile: "#FFB300",
  IoT: "#4DD1FF",
  Networking: "#FF7AC3",
  Data: "#4DD1FF",
  Core: "#FFFFFF",
  Writing: "#8A4FFF",
};

const HUD_GLOW = "shadow-[0_0_50px_rgba(29,233,182,0.12)]";

function useThroughputPulse() {
  const [value, setValue] = useState(72);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((prev) => {
        const target = 50 + Math.random() * 45;
        return prev + (target - prev) * 0.35;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return Math.round(value);
}

export function SideHud() {
  const nodes = useNetworkStore((state) => state.nodes);
  const edges = useNetworkStore((state) => state.edges);
  const activeFilters = useNetworkStore((state) => state.activeFilters);
  const toggleFilter = useNetworkStore((state) => state.toggleFilter);
  const hoveredNodeId = useNetworkStore((state) => state.hoveredNodeId);
  const selectedNodeId = useNetworkStore((state) => state.selectedNodeId);
  const spotlightNodeId = useNetworkStore((state) => state.spotlightNodeId);
  const traceRoute = useNetworkStore((state) => state.traceRoute);
  const cycleSpotlight = useNetworkStore((state) => state.cycleSpotlight);
  const triggerRecenter = useNetworkStore((state) => state.triggerRecenter);

  const nodeMap = useMemo(() => {
    const map = new Map<string, NetworkNode>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  const focusNodeId = selectedNodeId ?? hoveredNodeId ?? spotlightNodeId ?? "smit-core";
  const focusNode = focusNodeId ? nodeMap.get(focusNodeId) ?? nodeMap.get("smit-core") : nodeMap.get("smit-core");

  const trace = useMemo(() => traceRoute(focusNode?.id ?? null), [traceRoute, focusNode?.id]);

  const endorsements = useMemo(() => {
    if (!focusNode || focusNode.kind !== "project") return [];
    const connected = edges
      .filter((edge) => edge.from === focusNode.id || edge.to === focusNode.id)
      .map((edge) => (edge.from === focusNode.id ? edge.to : edge.from));
    const unique = Array.from(new Set(connected));
    return unique
      .map((id) => nodeMap.get(id))
      .filter((node): node is NetworkNode => Boolean(node && node.kind === "skill"))
      .slice(0, 6);
  }, [edges, focusNode, nodeMap]);

  const throughput = useThroughputPulse();

  return (
    <aside className="pointer-events-auto w-[320px] xl:w-[360px] rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-5 py-6 text-xs text-foreground/90 shadow-[0_0_40px_rgba(17,24,39,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-teal-200/70">HUD</p>
          <h2 className="mt-1 font-semibold text-lg text-white">Packet Atlas Console</h2>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => triggerRecenter()}
          className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80 transition hover:border-teal-300/60 hover:text-white"
        >
          Recenter
        </motion.button>
      </div>

      <section className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.4em] text-muted-foreground/70">
            Filter Topology
          </p>
          <div className="flex flex-wrap gap-2">
            {filterCategories.map((category) => {
              const active = activeFilters.includes(category);
              return (
                <motion.button
                  key={category}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggleFilter(category)}
                  className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                    active
                      ? `${HUD_GLOW} border-teal-300/70 bg-teal-400/20 text-white`
                      : "border-white/15 bg-white/5 text-muted-foreground hover:border-white/30 hover:text-white"
                  }`}
                >
                  <span
                    className="block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[category] }}
                  />
                  {category}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.4em] text-muted-foreground/70">
            Throughput
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Live Packets</span>
              <span>{throughput} Gbps</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <motion.div
                key={throughput}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, throughput)}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 28 }}
                className="h-2 rounded-full bg-gradient-to-r from-teal-300 via-amber-300 to-violet-300"
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              TTL decay animates packet density in the 3D canvas.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Focus Node</p>
          <div className="flex gap-1 text-[10px] uppercase tracking-[0.3em] text-emerald-200/80">
            <button
              className="rounded px-2 py-1 transition hover:bg-white/10"
              onClick={() => cycleSpotlight(-1)}
            >
              Prev
            </button>
            <button
              className="rounded px-2 py-1 transition hover:bg-white/10"
              onClick={() => cycleSpotlight(1)}
            >
              Next
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {focusNode ? (
            <motion.div
              key={focusNode.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="mt-3 space-y-3 rounded-xl border border-white/10 bg-black/40 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-white">{focusNode.label}</p>
                  <p className="text-[11px] text-muted-foreground">{focusNode.summary}</p>
                </div>
                <span
                  className="mt-1 h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor]"
                  style={{ color: CATEGORY_COLORS[focusNode.category] ?? "#1DE9B6" }}
                />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
                <div>
                  <dt className="uppercase tracking-[0.25em]">Latency</dt>
                  <dd className="mt-1 text-white/90">{focusNode.latency}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.25em]">Throughput</dt>
                  <dd className="mt-1 text-white/90">{focusNode.throughput}</dd>
                </div>
              </dl>
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Trace Route</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {trace.map((nodeId, index) => (
                    <span
                      key={`${nodeId}-${index}`}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
                    >
                      {nodeMap.get(nodeId)?.label ?? nodeId}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  BGP Endorsements
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {endorsements.length ? (
                    endorsements.map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full border border-white/10 bg-gradient-to-r from-white/10 to-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-emerald-200/90"
                      >
                        {skill.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Related skills pulse when a project is in focus.
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-[11px] text-muted-foreground">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Legend</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {filterCategories.map((category) => (
            <div key={category} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor]"
                style={{ color: CATEGORY_COLORS[category] }}
              />
              <span className="uppercase tracking-[0.24em] text-white/70">{category}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1">
          <p>Space → Recenter camera</p>
          <p>Arrow keys → Cycle focus nodes</p>
          <p>Enter → Open project case study</p>
          <p>Cmd/Ctrl + K → Command palette</p>
        </div>
      </section>
    </aside>
  );
}
