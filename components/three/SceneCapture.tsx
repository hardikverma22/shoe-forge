"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCapture, type CaptureOptions } from "@/lib/export/capture";

/**
 * Registers a capture function. It renders one frame at the requested resolution and
 * reads it out in the same task, so no preserveDrawingBuffer is needed.
 */
export function SceneCapture() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useEffect(() => {
    const capture = async ({ scale, transparent, background, view }: CaptureOptions): Promise<Blob> => {
      const prevRatio = gl.getPixelRatio();
      const prevClear = new THREE.Color();
      gl.getClearColor(prevClear);
      const prevAlpha = gl.getClearAlpha();

      const cam = camera.clone();
      if (view) cam.position.set(...view);
      cam.lookAt(0, 0, 0);
      cam.aspect = size.width / size.height;
      cam.updateProjectionMatrix();

      const maxSize = gl.capabilities.maxTextureSize;
      const ratio = Math.min(scale, maxSize / Math.max(size.width, size.height));
      gl.setPixelRatio(ratio);
      gl.setSize(size.width, size.height, false);
      if (transparent) gl.setClearColor(0x000000, 0);
      else gl.setClearColor(background ?? "#eef1f4", 1);

      gl.render(scene, cam);
      const blob = await new Promise<Blob>((resolve, reject) =>
        gl.domElement.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image"))), "image/png"),
      );

      gl.setPixelRatio(prevRatio);
      gl.setSize(size.width, size.height, false);
      gl.setClearColor(prevClear, prevAlpha);
      return blob;
    };

    useCapture.getState().setCapture(capture);
    return () => useCapture.getState().setCapture(null);
  }, [gl, scene, camera, size]);

  return null;
}
