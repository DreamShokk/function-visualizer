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

// Single place that syncs auto-rotate state, the camera and the button label.
function setAutoRotate(enabled: boolean): void {
  state.autoRotate = enabled;
  controls.setAutoRotate(enabled);
  const btn = document.getElementById('auto-rotate');
  if (btn) btn.textContent = enabled ? '⏸ Auto Rotate' : '▶ Auto Rotate';
}

const controls = createCameraControls(camera, '#ui-panel', {
  // A manual drag cancels auto-rotation.
  onUserInteract: () => {
    if (state.autoRotate) setAutoRotate(false);
  },
});

const ui = bindUI(state, {
  onApply: applyState,
  onAutoRotateToggle: setAutoRotate,
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
