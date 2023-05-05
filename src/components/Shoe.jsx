import { Decal, useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useSnapshot } from "valtio";
import { state } from "../store";
import { useFrame } from "@react-three/fiber";

const Shoe = () => {
  const { nodes, materials } = useGLTF("/shoe/shoe.gltf");
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
      "shoe/blue-texture.jpg",
      "shoe/color-texture.jpg",
      "shoe/floor-texture.jpg",
      "shoe/jeans-texture.jpg",
      "shoe/pattern-texture.jpg",
      "shoe/table-texture.jpg",
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
    groupRef.current.position.y += Math.sin(state.clock.getElapsedTime()) / 250;
  });

  const groupRef = useRef();

  return (
    <group
      castShadow
      dispose={null}
      scale={snap.isMobile ? 1.5 : 3}
      rotation={snap.rotation}
      ref={groupRef}
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

useGLTF.preload("/shoe/shoe.gltf");
[
  "shoe/blue-texture.jpg",
  "shoe/color-texture.jpg",
  "shoe/floor-texture.jpg",
  "shoe/jeans-texture.jpg",
  "shoe/pattern-texture.jpg",
  "shoe/table-texture.jpg",
].forEach(useTexture.preload);

export default Shoe;
