"use client";

import { Suspense, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NetworkCanvas } from "./network-canvas";
import { SideHud } from "./side-hud";
import { CaseStudyPanel } from "./case-study-panel";
import { NetworkCommandPalette } from "./network-command-palette";
import { ReducedMotionMap } from "./reduced-motion-map";
import { useNetworkStore } from "@/hooks/use-network-store";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export function NetworkExperience() {
  const reducedMotion = usePrefersReducedMotion();
  const hoveredNodeId = useNetworkStore((state) => state.hoveredNodeId);
  const spotlightNodeId = useNetworkStore((state) => state.spotlightNodeId);
  const nodes = useNetworkStore((state) => state.nodes);
  const setSpotlightNode = useNetworkStore((state) => state.setSpotlightNode);
  const cycleSpotlight = useNetworkStore((state) => state.cycleSpotlight);
  const triggerRecenter = useNetworkStore((state) => state.triggerRecenter);
  const selectNode = useNetworkStore((state) => state.selectNode);
  const setCommandPaletteOpen = useNetworkStore((state) => state.setCommandPaletteOpen);

  const hoveredNode = useMemo(
    () => nodes.find((node) => node.id === hoveredNodeId),
    [nodes, hoveredNodeId],
  );

  useEffect(() => {
    if (!spotlightNodeId) {
      setSpotlightNode("smit-core");
    }
  }, [setSpotlightNode, spotlightNodeId]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        triggerRecenter();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        cycleSpotlight(1);
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        cycleSpotlight(-1);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const currentFocus =
          useNetworkStore.getState().selectedNodeId ??
          useNetworkStore.getState().spotlightNodeId ??
          useNetworkStore.getState().hoveredNodeId;
        if (currentFocus) {
          selectNode(currentFocus);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cycleSpotlight, selectNode, setCommandPaletteOpen, triggerRecenter]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent px-6 pb-10 pt-8 text-white lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute right-[-180px] top-32 h-[620px] w-[620px] rounded-full bg-violet-500/20 blur-[160px]" />
        <div className="absolute bottom-[-220px] left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-[180px]" />
      </div>

      <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/40 shadow-[0_0_50px_rgba(18,25,40,0.55)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(138,79,255,0.18),_transparent_60%)]" />
          <div className="relative aspect-[16/10] w-full">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Initializing network…</div>}>
              {reducedMotion ? <ReducedMotionMap /> : <NetworkCanvas />}
            </Suspense>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B0D12]/90" />
          <div className="pointer-events-none absolute left-8 top-8 max-w-xl space-y-4">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-[12px] uppercase tracking-[0.5em] text-emerald-200/80"
            >
              Packet Atlas • Living Network Map
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 80, damping: 20 }}
              className="text-4xl font-semibold leading-tight drop-shadow-[0_0_25px_rgba(29,233,182,0.25)] md:text-5xl"
            >
              SMIT DHAMELIYA routes experiences across web, mobile, and living networks.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="max-w-lg text-sm text-muted-foreground"
            >
              Pan, zoom, and trace packets through a bioluminescent atlas of projects, stacks, and IoT systems. Hover any node to ping, click to launch a traceroute into a case study.
            </motion.p>
          </div>
          <AnimatePresence>
            {hoveredNode ? (
              <motion.div
                key={hoveredNode.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute bottom-8 left-8 max-w-md rounded-2xl border border-white/10 bg-black/60 p-4 text-sm"
              >
                <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/80">Ping</p>
                <p className="mt-1 text-lg font-semibold text-white">{hoveredNode.label}</p>
                <p className="mt-1 text-muted-foreground">{hoveredNode.summary}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
                  <div>
                    <span className="uppercase tracking-[0.3em]">Latency</span>
                    <p className="mt-1 text-white/80">{hoveredNode.latency}</p>
                  </div>
                  <div>
                    <span className="uppercase tracking-[0.3em]">Throughput</span>
                    <p className="mt-1 text-white/80">{hoveredNode.throughput}</p>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-6">
          <SideHud />
          <CaseStudyPanel />
        </div>
      </div>

      <footer className="relative z-10 mt-10 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.3em] text-emerald-200/80">
            React • Next.js • Hono • Node.js
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.3em] text-emerald-200/80">
            IoT • Networking • PostgreSQL • MySQL
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em]">
          <span>Reach Out →</span>
          <a
            href="mailto:smitdhameliya.sd@gmail.com"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white transition hover:border-teal-300/80 hover:text-emerald-200"
          >
            smitdhameliya.sd@gmail.com
          </a>
        </div>
      </footer>

      <NetworkCommandPalette />
    </div>
  );
}
