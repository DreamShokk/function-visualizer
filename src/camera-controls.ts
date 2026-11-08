// Orbit camera controls: drag to rotate around the origin, scroll wheel and
// +/- keys to zoom. The UI panel is excluded so its sliders stay clickable.

import * as THREE from 'three';

export interface CameraControls {
  /** Restore the default orbit position. */
  reset(): void;
  /** Enable/disable continuous auto-rotation (applied in update()). */
  setAutoRotate(enabled: boolean): void;
  /** Advance auto-rotation; call once per frame with elapsed milliseconds. */
  update(elapsedMs?: number): void;
  dispose(): void;
}

const MIN_RADIUS = 3;
const MAX_RADIUS = 80;
// Keep the camera above the floor plane (phi measured from +Y).
const MIN_PHI = 0.15;
const MAX_PHI = Math.PI / 2 - 0.05;
const AUTO_ROTATE_SPEED = 0.4; // radians per second

export const defaultCameraPosition = (): THREE.Vector3 => new THREE.Vector3(8, 6, 8);

/** Spherical orbit matching the classic (8, 6, 8) vantage point. */
const DEFAULT_ORBIT = { radius: Math.sqrt(8 ** 2 + 6 ** 2 + 8 ** 2), theta: Math.PI / 4, phi: 1.09 };

export function createCameraControls(
  camera: THREE.PerspectiveCamera,
  uiSelector = '#ui-panel',
): CameraControls {
  const target = new THREE.Vector3(0, 0, 0);
  let radius = DEFAULT_ORBIT.radius;
  let theta = DEFAULT_ORBIT.theta;
  let phi = DEFAULT_ORBIT.phi;
  let autoRotate = false;

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  const clampRadius = (r: number): number => Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, r));
  const setPhi = (p: number): void => { phi = Math.min(MAX_PHI, Math.max(MIN_PHI, p)); };
  const setRadius = (r: number): void => { radius = clampRadius(r); applyCamera(); };

  function applyCamera(): void {
    camera.position.setFromSphericalCoords(radius, phi, theta).add(target);
    camera.lookAt(target);
  }

  // --- Mouse: drag to orbit -------------------------------------------
  const onPointerDown = (e: MouseEvent): void => {
    if ((e.target as HTMLElement).closest(uiSelector)) return;
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const onPointerMove = (e: MouseEvent): void => {
    if (!isDragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    theta -= dx * 0.008; // drag right -> orbit left (scene appears to turn right)
    setPhi(phi - dy * 0.008); // drag down -> raise camera, never below the floor

    lastX = e.clientX;
    lastY = e.clientY;
    applyCamera();
  };

  const onPointerUp = (): void => { isDragging = false; };

  // --- Wheel: zoom -----------------------------------------------------
  const onWheel = (e: WheelEvent): void => {
    if ((e.target as HTMLElement).closest(uiSelector)) return;
    e.preventDefault();
    setRadius(radius * Math.exp(e.deltaY * 0.001));
  };

  // --- Keyboard: R = reset, +/- = zoom ----------------------------------
  const onKeyDown = (e: KeyboardEvent): void => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;

    switch (e.key.toLowerCase()) {
      case 'r':
        reset();
        break;
      case '+':
      case '=':
        setRadius(radius / 1.05);
        break;
      case '-':
        setRadius(radius * 1.05);
        break;
    }
  };

  const reset = (): void => {
    radius = DEFAULT_ORBIT.radius;
    theta = DEFAULT_ORBIT.theta;
    phi = DEFAULT_ORBIT.phi;
    applyCamera();
  };

  document.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);
  document.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown);

  applyCamera(); // start from the default vantage point

  return {
    reset,
    setAutoRotate(enabled: boolean) {
      autoRotate = enabled;
    },
    update(elapsedMs = 16.7) {
      if (autoRotate) {
        theta += AUTO_ROTATE_SPEED * (elapsedMs / 1000);
        applyCamera();
      }
    },
    dispose() {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
