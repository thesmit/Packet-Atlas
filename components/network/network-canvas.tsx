"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  NodeCategory,
  NetworkEdge,
  NetworkNode,
} from "@/lib/network-data";
import { useNetworkStore } from "@/hooks/use-network-store";
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls";

const CATEGORY_COLORS: Record<NodeCategory | "fallback", string> = {
  Frontend: "#1DE9B6",
  Backend: "#8A4FFF",
  Mobile: "#FFB300",
  IoT: "#4DD1FF",
  Networking: "#FF7AC3",
  Data: "#4DD1FF",
  Core: "#FFFFFF",
  Writing: "#8A4FFF",
  fallback: "#7E89AA",
};

const EDGE_ALPHA = 0.4;
const EDGE_ALPHA_ACTIVE = 0.85;

const tempPosition = new THREE.Vector3();
const tempDirection = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempObject = new THREE.Object3D();

interface EdgeDescriptor {
  edge: NetworkEdge;
  from: [number, number, number];
  to: [number, number, number];
}

function PanZoomControls({ recenterTick }: { recenterTick: number }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    const controls = new OrbitControlsImpl(camera, gl.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.75;
    controls.minDistance = 6;
    controls.maxDistance = 42;
    controls.enablePan = true;
    controls.panSpeed = 0.8;

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    controls.target.set(0, 0, 0);
    camera.position.set(0, 0, 28);
    controls.update();
  }, [camera, recenterTick]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
}

interface NodeSphereProps {
  node: NetworkNode;
  isHovered: boolean;
  isSelected: boolean;
  isSpotlight: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

function NodeSphere({
  node,
  isHovered,
  isSelected,
  isSpotlight,
  onHover,
  onClick,
}: NodeSphereProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const color = CATEGORY_COLORS[node.category] ?? CATEGORY_COLORS.fallback;

  useFrame((state) => {
    if (!groupRef.current || !sphereRef.current) return;
    const time = state.clock.getElapsedTime();
    const targetScale = isSelected ? 1.35 : isHovered || isSpotlight ? 1.18 : 1;
    const offset = Math.sin(time * 0.6 + node.position[0]) * 0.18;
    const offsetY = Math.cos(time * 0.4 + node.position[1]) * 0.14;
    const offsetZ = Math.sin(time * 0.52 + node.position[2]) * 0.12;

    tempPosition.set(
      node.position[0] + offset,
      node.position[1] + offsetY,
      node.position[2] + offsetZ,
    );
    groupRef.current.position.lerp(tempPosition, 0.3);

    const currentScale = sphereRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.12);
    sphereRef.current.scale.setScalar(nextScale);

    const material = sphereRef.current.material as THREE.MeshStandardMaterial;
    const emissiveTarget = isSelected ? 1.4 : isHovered ? 1.1 : 0.6;
    material.emissiveIntensity = THREE.MathUtils.lerp(
      material.emissiveIntensity,
      emissiveTarget,
      0.1,
    );

    if (rippleRef.current) {
      rippleRef.current.quaternion.copy(state.camera.quaternion);
      const mesh = rippleRef.current;
      const baseScale = isHovered || isSelected || isSpotlight ? 1 : 0.5;
      const scalePulse = 1 + Math.sin(time * 2.5 + node.position[0]) * 0.2;
      const desiredScale = baseScale * scalePulse * (isSelected ? 1.6 : 1.2);
      const next = THREE.MathUtils.lerp(mesh.scale.x, desiredScale, 0.2);
      mesh.scale.set(next, next, next);
      const rippleMaterial = mesh.material as THREE.MeshBasicMaterial;
      const opacityTarget = isHovered || isSelected || isSpotlight ? 0.45 : 0;
      rippleMaterial.opacity = THREE.MathUtils.lerp(
        rippleMaterial.opacity,
        opacityTarget,
        0.12,
      );
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(node.id);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onHover(null);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick(node.id);
      }}
    >
      <mesh ref={sphereRef}>
        <icosahedronGeometry args={[0.52, 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          metalness={0.25}
          roughness={0.3}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh ref={rippleRef} position={[0, 0, 0]}>
        <ringGeometry args={[0.7, 0.95, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

interface EdgeBeamProps extends EdgeDescriptor {
  active: boolean;
}

function EdgeBeam({ edge, from, to, active }: EdgeBeamProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const length = useMemo(() => {
    tempPosition.set(...from);
    return tempPosition.distanceTo(new THREE.Vector3(...to));
  }, [from, to]);

  const geometry = useMemo(() => {
    const radius = active ? 0.11 : 0.07;
    return new THREE.CylinderGeometry(radius, radius, length, 18, 1, true);
  }, [length, active]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: CATEGORY_COLORS[edge.category] ?? CATEGORY_COLORS.fallback,
        transparent: true,
        opacity: active ? EDGE_ALPHA_ACTIVE : EDGE_ALPHA,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [edge.category, active],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const fromVec = new THREE.Vector3(...from);
    const toVec = new THREE.Vector3(...to);
    mesh.position.copy(fromVec).add(toVec).multiplyScalar(0.5);
    tempDirection.subVectors(toVec, fromVec).normalize();
    tempQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tempDirection);
    mesh.setRotationFromQuaternion(tempQuaternion);
  }, [from, to, length]);

  useFrame(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const targetOpacity = active ? EDGE_ALPHA_ACTIVE : EDGE_ALPHA;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.08);
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

interface PacketFieldProps {
  edges: EdgeDescriptor[];
  highlightKeys: Set<string>;
}

function PacketField({ edges, highlightKeys }: PacketFieldProps) {
  const instanceRef = useRef<THREE.InstancedMesh>(null);

  const packets = useMemo(() => {
    const items: Array<{
      start: THREE.Vector3;
      direction: THREE.Vector3;
      length: number;
      speed: number;
      offset: number;
      color: THREE.Color;
    }> = [];
    for (const descriptor of edges) {
      const fromVec = new THREE.Vector3(...descriptor.from);
      const toVec = new THREE.Vector3(...descriptor.to);
      const key = createEdgeKey(descriptor.edge.from, descriptor.edge.to);
      const isHighlight = highlightKeys.has(key);
      const baseCount = isHighlight ? 7 : 3;
      const direction = new THREE.Vector3().subVectors(toVec, fromVec);
      const length = direction.length();
      direction.normalize();
      for (let i = 0; i < baseCount; i += 1) {
        items.push({
          start: fromVec.clone(),
          direction: direction.clone(),
          length,
          speed: isHighlight ? 0.55 + Math.random() * 0.35 : 0.3 + Math.random() * 0.25,
          offset: Math.random(),
          color: new THREE.Color(
            isHighlight ? CATEGORY_COLORS[descriptor.edge.category] ?? "#1DE9B6" : "#4C5D88",
          ),
        });
      }
    }
    return items;
  }, [edges, highlightKeys]);

  useEffect(() => {
    if (!instanceRef.current) return;
    const colors = new Float32Array(packets.length * 3);
    packets.forEach((packet, index) => {
      colors[index * 3 + 0] = packet.color.r;
      colors[index * 3 + 1] = packet.color.g;
      colors[index * 3 + 2] = packet.color.b;
    });
    instanceRef.current.geometry.setAttribute(
      "color",
      new THREE.InstancedBufferAttribute(colors, 3),
    );
  }, [packets]);

  useFrame((state) => {
    if (!instanceRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    packets.forEach((packet, index) => {
      const progress = ((elapsed * packet.speed + packet.offset) % 1 + 1) % 1;
      const intensity = 0.35 + 0.65 * (1 - progress);
      tempPosition
        .copy(packet.direction)
        .multiplyScalar(packet.length * progress)
        .add(packet.start);
      tempObject.position.copy(tempPosition);
      const scaleValue = THREE.MathUtils.lerp(0.08, 0.22, intensity);
      tempObject.scale.setScalar(scaleValue);
      tempObject.lookAt(tempPosition.clone().add(packet.direction));
      tempObject.updateMatrix();
      instanceRef.current!.setMatrixAt(index, tempObject.matrix);
      instanceRef.current!.setColorAt(
        index,
        packet.color.clone().multiplyScalar(isFinite(intensity) ? intensity : 1),
      );
    });
    instanceRef.current.instanceMatrix.needsUpdate = true;
    if (instanceRef.current.instanceColor) {
      instanceRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (!packets.length) return null;

  return (
    <instancedMesh ref={instanceRef} args={[undefined, undefined, packets.length]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial vertexColors transparent opacity={0.9} depthWrite={false} />
    </instancedMesh>
  );
}

interface RouteRibbonProps {
  route: string[];
  nodes: Map<string, NetworkNode>;
}

function RouteRibbon({ route, nodes }: RouteRibbonProps) {
  const points = useMemo(() => {
    return route
      .map((id) => nodes.get(id))
      .filter((node): node is NetworkNode => Boolean(node))
      .map((node) => new THREE.Vector3(...node.position));
  }, [route, nodes]);

  const positions = useMemo(() => {
    if (points.length < 2) return null;
    if (points.length === 2) {
      return new Float32Array([
        points[0].x,
        points[0].y,
        points[0].z,
        points[1].x,
        points[1].y,
        points[1].z,
      ]);
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(Math.max(20, points.length * 12));
    const array = new Float32Array(curvePoints.length * 3);
    curvePoints.forEach((point, index) => {
      array[index * 3 + 0] = point.x;
      array[index * 3 + 1] = point.y;
      array[index * 3 + 2] = point.z;
    });
    return array;
  }, [points]);

  if (!positions) return null;

  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        attach="material"
        color="#1DE9B6"
        linewidth={2}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
}

const createEdgeKey = (from: string, to: string) =>
  [from, to].sort((a, b) => a.localeCompare(b)).join("::");

export function NetworkCanvas() {
  const nodes = useNetworkStore((state) => state.nodes);
  const edges = useNetworkStore((state) => state.edges);
  const hoveredNodeId = useNetworkStore((state) => state.hoveredNodeId);
  const selectedNodeId = useNetworkStore((state) => state.selectedNodeId);
  const spotlightNodeId = useNetworkStore((state) => state.spotlightNodeId);
  const recenterTick = useNetworkStore((state) => state.recenterTick);
  const traceRoute = useNetworkStore((state) => state.traceRoute);
  const setHoveredNode = useNetworkStore((state) => state.setHoveredNode);
  const selectNode = useNetworkStore((state) => state.selectNode);
  const isNodeVisible = useNetworkStore((state) => state.isNodeVisible);

  const nodeMap = useMemo(() => {
    const map = new Map<string, NetworkNode>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  const visibleNodes = useMemo(
    () => nodes.filter((node) => isNodeVisible(node.id)),
    [nodes, isNodeVisible],
  );

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes],
  );

  const visibleEdges: EdgeDescriptor[] = useMemo(() => {
    const result: EdgeDescriptor[] = [];
    edges.forEach((edge) => {
      if (!visibleNodeIds.has(edge.from) || !visibleNodeIds.has(edge.to)) {
        return;
      }
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return;
      result.push({ edge, from: fromNode.position, to: toNode.position });
    });
    return result;
  }, [edges, nodeMap, visibleNodeIds]);

  const route = useMemo(
    () => traceRoute(selectedNodeId ?? spotlightNodeId ?? null),
    [selectedNodeId, spotlightNodeId, traceRoute],
  );

  const highlightKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let index = 0; index < route.length - 1; index += 1) {
      const from = route[index];
      const to = route[index + 1];
      keys.add(createEdgeKey(from, to));
    }
    return keys;
  }, [route]);

  return (
    <Canvas
      camera={{ position: [0, 0, 28], fov: 45 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      dpr={[1, 1.8]}
    >
      <color attach="background" args={["#04060B"]} />
      <fog attach="fog" args={["#04060B", 30, 85]} />
      <ambientLight intensity={0.35} color="#96A6FF" />
      <pointLight position={[0, 16, 16]} intensity={1.8} color="#1DE9B6" />
      <pointLight position={[0, -18, -14]} intensity={1.2} color="#8A4FFF" />
      <PanZoomControls recenterTick={recenterTick} />
      <PacketField edges={visibleEdges} highlightKeys={highlightKeys} />
      <RouteRibbon route={route} nodes={nodeMap} />
      {visibleEdges.map((descriptor) => (
        <EdgeBeam
          key={descriptor.edge.id}
          edge={descriptor.edge}
          from={descriptor.from}
          to={descriptor.to}
          active={highlightKeys.has(createEdgeKey(descriptor.edge.from, descriptor.edge.to))}
        />
      ))}
      {visibleNodes.map((node) => (
        <NodeSphere
          key={node.id}
          node={node}
          isHovered={hoveredNodeId === node.id}
          isSelected={selectedNodeId === node.id}
          isSpotlight={spotlightNodeId === node.id}
          onHover={setHoveredNode}
          onClick={selectNode}
        />
      ))}
    </Canvas>
  );
}
