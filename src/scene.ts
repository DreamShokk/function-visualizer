// Scene, camera, renderer and static scene decorations (lights, grid, axes).

import * as THREE from 'three';
import { defaultCameraPosition } from './camera-controls';

export interface SceneHandles {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export function createScene(container: HTMLElement): SceneHandles {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.copy(defaultCameraPosition());
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Lighting
  scene.add(new THREE.AmbientLight(0x404060, 0.5));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 8, 5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0x7dd3fc, 0.5, 100);
  pointLight.position.set(-3, 4, -3);
  scene.add(pointLight);

  // Floor grid + axes (surface sits at y = -0.5)
  const gridHelper = new THREE.GridHelper(20, 20, 0x7dd3fc, 0x1e293b);
  gridHelper.position.y = -0.5;
  scene.add(gridHelper);

  const axesHelper = new THREE.AxesHelper(2);
  axesHelper.position.y = -0.5;
  scene.add(axesHelper);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

