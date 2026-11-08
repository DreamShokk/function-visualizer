// Simple drag-to-rotate controls. Dragging rotates the scene group;
// the UI panel is excluded so sliders are clickable.

import type * as THREE from 'three';
import { resetView } from './scene';

export interface CameraControls {
  dispose(): void;
}

export function createCameraControls(
  scene: THREE.Scene,
  uiSelector = '#ui-panel',
): CameraControls {
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  const onPointerDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(uiSelector)) return;
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const onPointerMove = (e: MouseEvent) => {
    if (!isDragging) return;

    scene.rotation.y += (e.clientX - lastX) * 0.01;
    scene.rotation.x -= (e.clientY - lastY) * 0.01;

    // Clamp vertical rotation so the floor stays visible.
    scene.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, scene.rotation.x));

    lastX = e.clientX;
    lastY = e.clientY;
  };

  const onPointerUp = () => {
    isDragging = false;
  };

  document.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);

  return {
    dispose() {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
    },
  };
}

/** Keyboard shortcuts: R = reset view, +/- = zoom. */
export function createKeyboardControls(
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
): CameraControls {
  const onKeyDown = (e: KeyboardEvent) => {
    // Don't hijack keys while typing in an input.
    if ((e.target as HTMLElement).tagName === 'INPUT') return;

    switch (e.key.toLowerCase()) {
      case 'r':
        resetView(camera, scene);
        break;
      case '+':
      case '=':
        camera.position.multiplyScalar(0.95);
        break;
      case '-':
        camera.position.multiplyScalar(1.05);
        break;
    }
  };

  window.addEventListener('keydown', onKeyDown);

  return {
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
