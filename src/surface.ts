// Builds the surface mesh (and optional wireframe overlay) for f(x, y).

import * as THREE from 'three';
import { evaluateFunction } from './evaluator';
import type { AppState } from './state';

/** World-space Y of the plane the surface sits on. */
export const SURFACE_BASE_Y = -0.5;

const HEIGHT_COLOR_FROM = new THREE.Color(0x0000ff);
const HEIGHT_COLOR_TO = new THREE.Color(0xff0000);
const GRADIENT_COLOR_FROM = new THREE.Color(0x0066cc);
const GRADIENT_COLOR_TO = new THREE.Color(0xcc3300);

/**
 * Build the surface as a Group containing the mesh and (in wireframe mode)
 * a line overlay. The caller is responsible for adding/removing it from the scene.
 */
export function buildSurface(state: AppState): THREE.Group {
  const group = new THREE.Group();

  const countX = state.resolution;
  const countY = state.resolution;
  const stepX = (state.xMax - state.xMin) / countX;
  const stepY = (state.yMax - state.yMin) / countY;

  const fn = evaluateFunction(state.functionExpr);

  const positions: number[] = [];
  const colors: number[] = [];
  const zGrid: number[][] = [];

  for (let i = 0; i <= countX; i++) {
    const row: number[] = [];
    for (let j = 0; j <= countY; j++) {
      const x = state.xMin + i * stepX;
      const y = state.yMin + j * stepY;

      let z = fn(x, y);
      if (!isFinite(z)) z = 0;
      row.push(z);

      // World Y is the function output; world Z carries the domain's y.
      positions.push(x, SURFACE_BASE_Y + z, y);

      const color = getColorForZ(z, x, y, state.colorMode);
      colors.push(color.r, color.g, color.b);
    }
    zGrid.push(row);
  }

  // Triangle indices for the grid (vertex [i][j] has index i * (countY + 1) + j).
  const indices: number[] = [];
  for (let i = 0; i < countX; i++) {
    for (let j = 0; j < countY; j++) {
      const a = i * (countY + 1) + j;
      indices.push(a, a + countY + 1, a + 1, a + 1, a + countY + 1, a + countY + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    shininess: 0,
    specular: 0x404060,
    transparent: state.opacity > 0,
    opacity: state.opacity,
    side: THREE.DoubleSide,
  });

  group.add(new THREE.Mesh(geometry, material));

  if (state.colorMode === 'wireframe') {
    const edges: THREE.Vector3[] = [];
    for (let i = 0; i <= countX; i++) {
      for (let j = 0; j <= countY; j++) {
        const x = state.xMin + i * stepX;
        const y = state.yMin + j * stepY;

        if (i > 0) {
          edges.push(
            new THREE.Vector3(x - stepX, SURFACE_BASE_Y + zGrid[i - 1][j], y),
            new THREE.Vector3(x, SURFACE_BASE_Y + zGrid[i][j], y),
          );
        }
        if (j > 0) {
          edges.push(
            new THREE.Vector3(x, SURFACE_BASE_Y + zGrid[i][j - 1], y - stepY),
            new THREE.Vector3(x, SURFACE_BASE_Y + zGrid[i][j], y),
          );
        }
      }
    }

    const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edges);
    const wireMaterial = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.5,
    });
    group.add(new THREE.LineSegments(edgeGeometry, wireMaterial));
  }

  return group;
}

/** Dispose all geometry/materials of a surface group. */
export function disposeSurface(group: THREE.Group): void {
  for (const child of [...group.children]) {
    const mesh = child as THREE.Mesh | THREE.LineSegments;
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => m.dispose());
    } else {
      mesh.material?.dispose();
    }
  }
}

function getColorForZ(z: number, x: number, y: number, mode: AppState['colorMode']): THREE.Color {
  const color = new THREE.Color();
  switch (mode) {
    case 'height': {
      // Assumes typical z range ~[-2, 2]; clamp outside.
      const t = Math.min(1, Math.max(0, (z + 2) / 4));
      return color.copy(HEIGHT_COLOR_FROM).lerp(HEIGHT_COLOR_TO, t);
    }
    case 'gradient': {
      const t = (Math.sin(x * 0.3) + Math.cos(y * 0.3) + 2) / 4;
      return color.copy(GRADIENT_COLOR_FROM).lerp(GRADIENT_COLOR_TO, t);
    }
    case 'wireframe':
      return color.set(0xffffff);
  }
}
