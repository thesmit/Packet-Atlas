"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { projectDetails } from "@/lib/network-data";
import { useNetworkStore } from "@/hooks/use-network-store";

const TAB_ORDER = ["architecture", "database", "apis"] as const;
type PanelTab = (typeof TAB_ORDER)[number];

const TAB_LABELS: Record<PanelTab, string> = {
  architecture: "Architecture",
  database: "Data Layer",
  apis: "API Surface",
};

export function CaseStudyPanel() {
  const selectedNodeId = useNetworkStore((state) => state.selectedNodeId);
  const selectNode = useNetworkStore((state) => state.selectNode);
  const nodes = useNetworkStore((state) => state.nodes);
  const [activeTab, setActiveTab] = useState<PanelTab>("architecture");

  const node = useMemo(
    () => nodes.find((item) => item.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const detail = selectedNodeId ? projectDetails[selectedNodeId] : undefined;

  useEffect(() => {
    setActiveTab("architecture");
  }, [selectedNodeId]);

  if (!detail || !node) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.aside
        key={detail.tagline}
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 24 }}
        className="pointer-events-auto w-full max-w-[420px] rounded-3xl border border-white/10 bg-black/60 p-6 shadow-[0_0_50px_rgba(29,233,182,0.12)] backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-teal-200/70">Case Study</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">{node.label}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{detail.tagline}</p>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:bg-white/20"
          >
            Close
          </button>
        </div>
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              key={selectedNodeId}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4.2, ease: "linear" }}
              className="h-full bg-gradient-to-r from-emerald-300 via-amber-200 to-violet-300"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            TTL microloading visualizes packet focus for this case study.
          </p>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">{detail.overview}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {detail.stack.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-200/90"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex gap-2">
            {TAB_ORDER.map((tab) => {
              const active = activeTab === tab;
              return (
                <motion.button
                  key={tab}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                    active
                      ? "border-teal-300/80 bg-teal-400/20 text-white"
                      : "border-white/15 bg-white/5 text-muted-foreground hover:border-white/30 hover:text-white"
                  }`}
                >
                  {TAB_LABELS[tab]}
                </motion.button>
              );
            })}
          </div>
          <div className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground"
              >
                {activeTab === "architecture" && (
                  <ul className="space-y-3 text-[13px]">
                    {detail.architecture.map((item) => (
                      <li key={item.label} className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/80">
                          {item.label}
                        </p>
                        <p className="mt-1 text-white/90">{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {activeTab === "database" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/80">Engine</p>
                      <p className="mt-1 text-white/90">{detail.database.engine}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/80">Schema</p>
                      <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-black/50 p-3">
                        {detail.database.schema.map((line) => (
                          <code
                            key={line}
                            className="block text-[12px] text-white/80"
                          >
                            {line}
                          </code>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/80">Replication</p>
                      <p className="mt-1 text-white/90">{detail.database.replication}</p>
                    </div>
                  </div>
                )}
                {activeTab === "apis" && (
                  <ul className="space-y-3 text-[13px]">
                    {detail.apis.map((api) => (
                      <li key={`${api.method}-${api.route}`} className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/80">
                            {api.method}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.3em] text-white/80">
                            {api.runtime}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[12px] text-amber-200">{api.route}</p>
                        <p className="mt-1 text-white/90">{api.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-white/90">
          {detail.metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/80">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold">{metric.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{metric.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-[11px] text-muted-foreground">
          <p className="uppercase tracking-[0.35em] text-emerald-200/80">Timeline</p>
          <p className="mt-1 text-white/90">{detail.timeline}</p>
          <p className="mt-3 uppercase tracking-[0.35em] text-emerald-200/80">Status</p>
          <p className="mt-1 text-white/90">{detail.status}</p>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
