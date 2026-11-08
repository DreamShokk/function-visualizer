// Application entry point: wires scene, surface, UI and animation loop together.

import * as THREE from 'three';
import { defaultState } from './state';
import type { AppState } from './state';
import { createScene, resetView } from './scene';
import { buildSurface, disposeSurface } from './surface';
import { bindUI } from './ui';
import { createCameraControls, createKeyboardControls } from './camera-controls';

import './style.css';

const state: AppState = { ...defaultState };

const container = document.getElementById('canvas-container');
if (!container) throw new Error('Missing #canvas-container element');

const { scene, camera, renderer } = createScene(container);

// Surface: rebuilt in place whenever inputs change.
let surface: THREE.Group | null = null;

function applyState(): void {
  if (surface) {
    scene.remove(surface);
    disposeSurface(surface);
  }
  surface = buildSurface(state);
  scene.add(surface);
}

const ui = bindUI(state, {
  onApply: applyState,
  onAutoRotateToggle: () => {}, // state.autoRotate is read by the loop below
  onResetView: () => resetView(camera, scene),
});

const dragControls = createCameraControls(scene);
const keyControls = createKeyboardControls(camera, scene);

// Animation loop (handles auto-rotate).
let rotationDirection = 1;

function animate(): void {
  requestAnimationFrame(animate);

  if (state.autoRotate) {
    scene.rotation.y += 0.5 * rotationDirection;
    const limit = Math.PI / 2 + Math.PI;
    if (scene.rotation.y > limit || scene.rotation.y < -limit) {
      rotationDirection *= -1;
    }
  }

  renderer.render(scene, camera);
}

applyState(); // initial build (also validates the default expression)
animate();

console.log('📊 3D Function Visualizer initialized');

// Cleanup hook (useful if this ever runs in an HMR / hot-reload context).
window.addEventListener('pagehide', () => {
  ui.dispose();
  dragControls.dispose();
  keyControls.dispose();
  renderer.dispose();
});
