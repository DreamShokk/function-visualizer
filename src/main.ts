// Application entry point: wires scene, surface, UI and animation loop together.

import * as THREE from 'three';
import { defaultState } from './state';
import type { AppState } from './state';
import { createScene } from './scene';
import { buildSurface, disposeSurface } from './surface';
import { bindUI } from './ui';
import { createCameraControls } from './camera-controls';

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

const controls = createCameraControls(camera);

const ui = bindUI(state, {
  onApply: applyState,
  onAutoRotateToggle: (enabled) => controls.setAutoRotate(enabled),
  onResetView: () => controls.reset(),
});

// Animation loop.
let lastFrameTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);

  const now = performance.now();
  controls.update(now - lastFrameTime);
  lastFrameTime = now;

  renderer.render(scene, camera);
}

applyState(); // initial build (also validates the default expression)
animate();

console.log('📊 3D Function Visualizer initialized');

// Cleanup hook (useful if this ever runs in an HMR / hot-reload context).
window.addEventListener('pagehide', () => {
  ui.dispose();
  controls.dispose();
  renderer.dispose();
});
