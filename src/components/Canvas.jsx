import { Canvas } from "@react-three/fiber";
import "./App.css";

import {
  Center,
  OrbitControls,
  Environment,
  Lightformer,
} from "@react-three/drei";
import { Suspense, useRef } from "react";
import Shoe from "./Shoe";
import { snapshot, useSnapshot } from "valtio";
import { state } from "../store";

const CanvasContainer = () => {
  return (
    <Canvas>
      <mesh>
        <ambientLight intensity={1} />
        <pointLight intensity={1} />
        <directionalLight />
        <Center>
          <Suspense fallback={null}>
            <Shoe />
          </Suspense>
        </Center>
        <OrbitControls enableDamping={false} enablePan={false} />
        <Env perfSucks={true} />
      </mesh>
    </Canvas>
  );
};

function Env({ perfSucks }) {
  const ref = useRef();
  const snap = useSnapshot(state);
  // Runtime environments can be too slow on some systems, better safe than sorry with PerfMon
  return (
    <Environment
      frames={perfSucks ? 1 : Infinity}
      preset="city"
      resolution={256}
      background
      blur={0.8}
    >
      <Lightformer
        intensity={4}
        rotation-x={Math.PI / 2}
        position={[0, 5, -9]}
        scale={[10, 10, 1]}
      />
      <Lightformer
        intensity={4}
        rotation-x={Math.PI / 2}
        position={[0, 5, -9]}
        scale={[10, 10, 1]}
      />
      <group rotation={[Math.PI / 2, 1, 0]}>
        {[2, -2, 2, -4, 2, -5, 2, -9].map((x, i) => (
          <Lightformer
            key={i}
            intensity={1}
            rotation={[Math.PI / 4, 0, 0]}
            position={[x, 4, i * 4]}
            scale={[4, 1, 1]}
          />
        ))}
        <Lightformer
          intensity={0.5}
          rotation-y={Math.PI / 2}
          position={[-5, 1, -1]}
          scale={[50, 2, 1]}
        />
        <Lightformer
          intensity={0.5}
          rotation-y={Math.PI / 2}
          position={[-5, -1, -1]}
          scale={[50, 2, 1]}
        />
        <Lightformer
          intensity={0.5}
          rotation-y={-Math.PI / 2}
          position={[10, 1, 0]}
          scale={[50, 2, 1]}
        />
      </group>
      <group ref={ref}>
        <Lightformer
          intensity={5}
          form="ring"
          color={snap.mesh.color === "#FFFFFF" ? "yellow": snap.mesh.color}
          rotation-y={Math.PI / 2}
          position={[-5, 2, -1]}
          scale={[10, 10, 1]}
        />
      </group>
    </Environment>
  );
}

export default CanvasContainer;
