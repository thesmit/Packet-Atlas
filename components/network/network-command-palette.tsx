"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useNetworkStore } from "@/hooks/use-network-store";
import { NodeKind } from "@/lib/network-data";

const KIND_ORDER: Array<{ label: string; kinds: NodeKind[] }> = [
  { label: "Project Routes", kinds: ["project"] },
  { label: "Skill Mesh", kinds: ["skill"] },
  { label: "Signal Nodes", kinds: ["section", "service", "core"] },
];

export function NetworkCommandPalette() {
  const { open, setOpen } = useNetworkStore((state) => ({
    open: state.commandPaletteOpen,
    setOpen: state.setCommandPaletteOpen,
  }));
  const nodes = useNetworkStore((state) => state.nodes);
  const selectNode = useNetworkStore((state) => state.selectNode);

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Packet Atlas Command Palette"
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 p-6 text-sm text-white"
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-3xl border border-white/10 bg-[#0B0F18]/95 shadow-[0_40px_120px_rgba(13,18,32,0.7)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
          <span className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/70">Trace</span>
          <Command.Input
            autoFocus
            placeholder="Jump to project, skill, or signal node..."
            className="flex-1 border-none bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Command.List className="max-h-[380px] overflow-y-auto px-2 py-3">
          <Command.Empty className="px-4 py-6 text-center text-[12px] text-muted-foreground">
            No matching routes. Try searching for “React”, “Hono”, or “Relay”.
          </Command.Empty>
          {KIND_ORDER.map((group) => {
            const groupNodes = nodes.filter((node) => group.kinds.includes(node.kind));
            if (!groupNodes.length) return null;
            return (
              <Command.Group key={group.label} heading={group.label} className="px-3">
                {groupNodes.map((node) => (
                  <Command.Item
                    key={node.id}
                    value={node.label}
                    onSelect={() => {
                      selectNode(node.id);
                      setOpen(false);
                    }}
                    className="flex flex-col gap-1 rounded-2xl px-3 py-3 text-left text-[13px] aria-selected:bg-white/10 aria-selected:text-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{node.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-200/80">
                        {node.kind}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">{node.summary}</p>
                  </Command.Item>
                ))}
                <Command.Separator className="my-3 h-px bg-white/5" />
              </Command.Group>
            );
          })}
        </Command.List>
        <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-5 py-3 text-[11px] text-muted-foreground">
          <span>Enter ↵ to trace route • Esc to close</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.3em]">Packet Atlas</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
