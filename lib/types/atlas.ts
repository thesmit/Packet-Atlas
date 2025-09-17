export type Vec3 = [number, number, number];

export type AtlasFilter =
  | "frontend"
  | "backend"
  | "mobile"
  | "iot"
  | "networking"
  | "data"
  | "ops";

export type AtlasNodeKind =
  | "core"
  | "cluster"
  | "project"
  | "skill"
  | "database"
  | "service"
  | "writing";

export interface AtlasNode {
  id: string;
  label: string;
  kind: AtlasNodeKind;
  categories: AtlasFilter[];
  orbit: number;
  position: Vec3;
  energy: number;
  latency: number;
  bandwidth: number;
  summary?: string;
  accent?: AtlasFilter;
  badges?: string[];
}

export interface AtlasEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  latency: number;
  bandwidth: number;
  packetColor?: string;
  protocol?: string;
}

export interface AtlasTracerouteHop {
  hop: number;
  label: string;
  latency: string;
  jitter?: string;
  description: string;
}

export interface AtlasMetric {
  label: string;
  value: string;
  delta?: string;
  intent?: "positive" | "neutral" | "negative";
  hint?: string;
}

export interface AtlasArchitectureLayer {
  layer: string;
  technology: string;
  description: string;
}

export interface AtlasDatabaseModel {
  name: string;
  engine: string;
  notes: string;
  tables: {
    name: string;
    role: string;
    retention?: string;
  }[];
}

export interface AtlasApiRoute {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  tech: string;
  description: string;
}

export interface AtlasCaseStudy {
  nodeId: string;
  slug: string;
  tagline: string;
  overview: string;
  challenge: string;
  outcome: string;
  highlights: string[];
  architecture: AtlasArchitectureLayer[];
  databases: AtlasDatabaseModel[];
  apis: AtlasApiRoute[];
  metrics: AtlasMetric[];
  traceroute: AtlasTracerouteHop[];
  relatedSkills: string[];
}

export interface PacketAtlasDataset {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  caseStudies: AtlasCaseStudy[];
}

export const atlasFilters: { id: AtlasFilter; label: string; tint: string }[] = [
  { id: "frontend", label: "Frontend", tint: "#8a4fff" },
  { id: "backend", label: "Backend", tint: "#1de9b6" },
  { id: "mobile", label: "Mobile", tint: "#ffb300" },
  { id: "iot", label: "IoT", tint: "#4dd1ff" },
  { id: "networking", label: "Networking", tint: "#1de9b6" },
  { id: "data", label: "Data", tint: "#ff7ac3" },
  { id: "ops", label: "Ops", tint: "#55ffd6" },
];

export const atlasFilterOrder: AtlasFilter[] = [
  "frontend",
  "backend",
  "mobile",
  "iot",
  "networking",
  "data",
  "ops",
];

