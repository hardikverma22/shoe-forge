import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Suspense, useRef } from "react";
import { useSnapshot } from "valtio";
import { state } from "../store";
import CanvasLoader from "./CanvasLoader";
import Shoe from "./Shoe";
gsap.registerPlugin(ScrollTrigger);

const MainCanvas = () => {
  const snap = useSnapshot(state);

  return (
    <Canvas
      camera={{
        position: snap.intro
          ? [1.9178048557224563, -0.9446855085124255, 4.519910820511159]
          : [0.10339436526544493, -0.5747297609365829, 2.936178360954702],
      }}
      eventSource={document.getElementById("root")}
      gl={{ preserveDrawingBuffer: true }}
      eventPrefix="client"
    >
      <pointLight intensity={1} />
      <OrbitControls
        enablePan={!snap.intro}
        enableRotate={!snap.intro}
        enableZoom={!snap.intro}
      />
      {/* <FrontShoe /> */}
      <Suspense fallback={null}>
        <Shoe />
      </Suspense>
      <ambientLight intensity={1} />
      {/* {!snap.intro ? <Env perfSucks={true} /> : null} */}
    </Canvas>
  );
};

const Env = ({ perfSucks }) => {
  const ref = useRef();
  const snap = useSnapshot(state);
  // Runtime environments can be too slow on some systems, better safe than sorry with PerfMon
  return (
    <Environment
      frames={perfSucks ? 1 : Infinity}
      preset="forest"
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
          color={snap.mesh.color === "#FFFFFF" ? "yellow" : snap.mesh.color}
          rotation-y={Math.PI / 2}
          position={[-5, 2, -1]}
          scale={[10, 10, 1]}
        />
      </group>
    </Environment>
  );
};

export default MainCanvas;
