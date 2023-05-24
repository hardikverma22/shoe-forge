import { Decal, useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useSnapshot } from "valtio";
import { state } from "../store";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useControls } from "leva";

const Shoe = () => {
  const { nodes, materials } = useGLTF("shoe.gltf");
  const [
    blueTexture,
    colorTexture,
    floorTexture,
    jeansTexture,
    patternTexture,
    tableTexture,
    nikeTexture,
    pumaTexture,
  ] = useTexture(
    [
      "blue-texture.jpg",
      "color-texture.jpg",
      "floor-texture.jpg",
      "jeans-texture.jpg",
      "pattern-texture.jpg",
      "table-texture.jpg",
      "nike.png",
      "puma.png",
    ],
    () => {
      nikeTexture.wrapS = nikeTexture.wrapT = THREE.RepeatWrapping;
      materials.mesh.map = textureMapping[snap.mesh.texture];
      materials.laces.map = textureMapping[snap.laces.texture];
      materials.inner.map = textureMapping[snap.inner.texture];
      materials.sole.map = textureMapping[snap.sole.texture];
      materials.caps.map = textureMapping[snap.caps.texture];
      materials.stripes.map = textureMapping[snap.stripes.texture];
      materials.band.map = textureMapping[snap.band.texture];
      materials.patch.map = textureMapping[snap.patch.texture];
    }
  );

  const tl = gsap.timeline();
  const { camera, scene } = useThree();

  const textureMapping = {
    "floor-texture": floorTexture,
    "blue-texture": blueTexture,
    "color-texture": colorTexture,
    "jeans-texture": jeansTexture,
    "pattern-texture": patternTexture,
    "table-texture": tableTexture,
    nike: nikeTexture,
    puma: pumaTexture,
  };

  const snap = useSnapshot(state);
  const meshColor = useMemo(
    () => new THREE.Color(snap.mesh.color),
    [snap.mesh.color]
  );
  const innerColor = useMemo(
    () => new THREE.Color(snap.inner.color),
    [snap.inner.color]
  );
  const lacesColor = useMemo(
    () => new THREE.Color(snap.laces.color),
    [snap.laces.color]
  );
  const capsColor = useMemo(
    () => new THREE.Color(snap.caps.color),
    [snap.caps.color]
  );

  const soleColor = useMemo(
    () => new THREE.Color(snap.sole.color),
    [snap.sole.color]
  );

  const stripesColor = useMemo(
    () => new THREE.Color(snap.stripes.color),
    [snap.stripes.color]
  );
  const bandColor = useMemo(
    () => new THREE.Color(snap.band.color),
    [snap.band.color]
  );
  const patchColor = useMemo(
    () => new THREE.Color(snap.patch.color),
    [snap.patch.color]
  );

  // const { cameraPosition, scenePosition, sceneRotation } = useControls({
  //   cameraPosition: {
  //     value: {
  //       x: -0.68,
  //       y: -0.84,
  //       z: 3.12,
  //     },
  //     step: 0.05,
  //   },
  //   scenePosition: {
  //     value: {
  //       x: -1.85,
  //       y: -2.5,
  //       z: 0.1,
  //     },
  //     step: 0.05,
  //   },

  //   sceneRotation: {
  //     value: {
  //       x: 0.84,
  //       y: 2.22,
  //       z: 0.16,
  //     },
  //     step: 0.01,
  //   },
  // });

  // useFrame(() => {
  //   camera.position.x = cameraPosition.x;
  //   camera.position.y = cameraPosition.y;
  //   camera.position.z = cameraPosition.z;

  //   scene.position.x = scenePosition.x;
  //   scene.position.y = scenePosition.y;
  //   scene.position.z = scenePosition.z;

  //   scene.rotation.x = sceneRotation.x;
  //   scene.rotation.y = sceneRotation.y;
  //   scene.rotation.z = sceneRotation.z;
  // });

  useEffect(() => {
    camera.position.set(
      1.9178048557224552,
      -0.9446855085124252,
      4.519910820511158
    );
  }, [snap.intro]);

  useLayoutEffect(() => {
    if (snap.intro) {
      new ScrollTrigger({});
      tl.to(camera.position, {
        x: -0.68,
        y: -0.84,
        z: 3.12,
        scrollTrigger: {
          trigger: ".second-section",
          start: "top bottom",
          end: "top top",
          scrub: true, // smooth animations
          immediateRender: false,
          // markers: true,
        },
      })
        .to(scene.position, {
          x: -2.2,
          y: -2.05,
          z: 0.1,
          scrollTrigger: {
            trigger: ".second-section",
            start: "top bottom",
            end: "top top",
            scrub: true, // smooth animations
            immediateRender: false,
            // markers: true,
          },
        })
        .to(scene.rotation, {
          x: 0.84,
          y: 2.22,
          z: 0.16,
          scrollTrigger: {
            trigger: ".second-section",
            start: "top bottom",
            end: "top top",
            scrub: true, // smooth animations
            immediateRender: false,
            // markers: true,
          },
        });
    }
  });

  useEffect(() => {
    materials.mesh.color = meshColor;
    materials.mesh.map = textureMapping[snap.mesh.texture];
    materials.laces.color = lacesColor;
    materials.laces.map = textureMapping[snap.laces.texture];
    materials.inner.color = innerColor;
    materials.inner.map = textureMapping[snap.inner.texture];
    materials.sole.color = soleColor;
    materials.sole.map = textureMapping[snap.sole.texture];

    materials.caps.color = capsColor;
    materials.caps.map = textureMapping[snap.caps.texture];
    materials.stripes.color = stripesColor;
    materials.stripes.map = textureMapping[snap.stripes.texture];
    materials.band.color = bandColor;
    materials.band.map = textureMapping[snap.band.texture];
    materials.patch.color = patchColor;
    materials.patch.map = textureMapping[snap.patch.texture];
  }, [
    snap.inner.color,
    snap.mesh.color,
    snap.laces.color,
    snap.sole.color,

    snap.caps.color,
    snap.band.color,
    snap.patch.color,
    snap.stripes.color,

    snap.mesh.texture,
    snap.laces.texture,
    snap.inner.texture,
    snap.sole.texture,

    snap.caps.texture,
    snap.band.texture,
    snap.patch.texture,
    snap.stripes.texture,
  ]);

  useFrame((state, delta) => {
    if (!snap.intro)
      groupRef.current.position.y +=
        Math.sin(state.clock.getElapsedTime()) / 250;
  });

  const groupRef = useRef();

  return (
    <group
      castShadow
      dispose={null}
      scale={snap.isMobile ? 1.5 : snap.intro ? 2 : 3}
      rotation={snap.rotation}
      ref={groupRef}
      position={snap.intro ? [3, -0.2, 1] : [0, 0, 0]}
    >
      <mesh
        castShadow
        geometry={nodes.shoe.geometry}
        material={materials.laces}
      />
      <mesh
        castShadow
        geometry={nodes.shoe_1.geometry}
        material={materials.mesh}
        material-roughness={0.1}
      >
        <Decal
          position={[0.64, -0.13, -0.09]}
          rotation={[-1.5, 0.7, 1.3]}
          scale={0.29}
          map={textureMapping[snap.selectedDecal]}
        />
      </mesh>
      <mesh
        castShadow
        geometry={nodes.shoe_2.geometry}
        material={materials.caps}
      />
      <mesh
        castShadow
        geometry={nodes.shoe_3.geometry}
        material={materials.inner}
      />
      <mesh
        castShadow
        geometry={nodes.shoe_4.geometry}
        material={materials.sole}
      />
      <mesh
        castShadow
        geometry={nodes.shoe_5.geometry}
        material={materials.stripes}
      />
      <mesh
        castShadow
        geometry={nodes.shoe_6.geometry}
        material={materials.band}
      />
      <mesh
        castShadow
        geometry={nodes.shoe_7.geometry}
        material={materials.patch}
      />
    </group>
  );
};

useGLTF.preload("shoe.gltf");
[
  "blue-texture.jpg",
  "color-texture.jpg",
  "floor-texture.jpg",
  "jeans-texture.jpg",
  "pattern-texture.jpg",
  "table-texture.jpg",
].forEach(useTexture.preload);

export default Shoe;
