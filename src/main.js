// Three.js is loaded globally from CDN, accessed as window.THREE
const THREE = window.THREE;

// ============================================
// State & Configuration
// ============================================
const state = {
  functionExpr: 'sin(x)*cos(y)',
  xMin: -5,
  xMax: 5,
  yMin: -5,
  yMax: 5,
  resolution: 30,
  colorMode: 'height',
  opacity: 0.85,
  autoRotate: false,
};

// ============================================
// Scene Setup
// ============================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 6, 8);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// ============================================
// Lighting
// ============================================
const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 8, 5);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x7dd3fc, 0.5, 100);
pointLight.position.set(-3, 4, -3);
scene.add(pointLight);

// ============================================
// Grid Helper (floor)
// ============================================
const gridHelper = new THREE.GridHelper(20, 20, 0x7dd3fc, 0x1e293b);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// Axes helper
const axesHelper = new THREE.AxesHelper(2);
axesHelper.position.y = -0.5;
scene.add(axesHelper);

// ============================================
// Surface Mesh Generation
// ============================================
let surfaceMesh = null;
let wireframeMesh = null;

function createSurfaceMesh() {
  // Remove existing meshes
  if (surfaceMesh) scene.remove(surfaceMesh);
  if (wireframeMesh) scene.remove(wireframeMesh);

  const xRange = state.xMax - state.xMin;
  const yRange = state.yMax - state.yMin;
  const zScale = Math.max(xRange, yRange) * 0.3; // Scale Z to fit nicely

  // Generate grid points
  const countX = state.resolution + 1;
  const countY = state.resolution + 1;
  const stepX = xRange / (countX - 1);
  const stepY = yRange / (countY - 1);

  const positions = [];
  const colors = [];
  const zGrid = []; // store z per grid point for later wireframe use

  for (let i = 0; i <= countX; i++) {
    zGrid.push([]);
    for (let j = 0; j <= countY; j++) {
      const x = state.xMin + i * stepX;
      const y = state.yMin + j * stepY;

      // Parse and evaluate the function
      let z = evaluateFunction(x, y);

      if (isNaN(z) || !isFinite(z)) {
        z = 0;
      }
      zGrid[i].push(z);

      positions.push(
        x,
        -0.5 + j * stepY, // Y offset for grid
        z * zScale
      );

      const color = getColorForZ(z, x, y);
      colors.push(color.r, color.g, color.b);
    }
  }

  // Build triangle indices for the grid (vertex at [i][j] has index i * countY + j)
  const indices = [];
  for (let i = 0; i < countX; i++) {
    for (let j = 0; j < countY; j++) {
      const a = i * (countY + 1) + j;
      const b = a + 1;
      const c = a + (countY + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  // Create geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Material with flat shading
  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    shininess: 0,
    specular: 0x404060,
    transparent: state.opacity > 0,
    opacity: state.opacity,
    side: THREE.DoubleSide,
  });

  surfaceMesh = new THREE.Mesh(geometry, material);
  scene.add(surfaceMesh);

  // Wireframe overlay (optional)
  if (state.colorMode === 'wireframe') {
    const wireMaterial = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.5,
    });
    
    // Create grid lines from vertices
    const edges = [];
    for (let i = 0; i <= countX; i++) {
      for (let j = 0; j <= countY; j++) {
        const x = state.xMin + i * stepX;
        const y = state.yMin + j * stepY;
        const z = zGrid[i][j];

        if (i > 0) {
          edges.push(
            new THREE.Vector3(x - stepX, -0.5 + j * stepY, zGrid[i - 1][j] * zScale),
            new THREE.Vector3(x, -0.5 + j * stepY, z * zScale)
          );
        }
        if (j > 0) {
          edges.push(
            new THREE.Vector3(x, -0.5 + (j - 1) * stepY, zGrid[i][j - 1] * zScale),
            new THREE.Vector3(x, -0.5 + j * stepY, z * zScale)
          );
        }
      }
    }

    const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edges);
    wireframeMesh = new THREE.LineSegments(edgeGeometry, wireMaterial);
    scene.add(wireframeMesh);
  }
}

function evaluateFunction(x, y) {
  try {
    // Sanitize input: trim whitespace and remove common issues
    const expr = state.functionExpr.trim();
    
    // Create a safe function evaluation context
    const func = new Function('x', 'y', `return ${expr};`);
    return func(x, y);
  } catch (e) {
    console.error(`Error evaluating "${state.functionExpr}" at (${x}, ${y}):`, e.message);
    // Return a safe fallback value on error
    return Math.sin(x) * Math.cos(y);
  }
}

function getColorForZ(z, x, y) {
  if (state.colorMode === 'height') {
    // Color based on height - use a gradient from blue to red
    const normalized = Math.max(0, Math.min(1, (z + 2) / 4)); // Assuming z range ~[-2, 2]
    return interpolateColor([0x0000ff], [0xff0000], normalized);
  } else if (state.colorMode === 'gradient') {
    const t = Math.sin(x * 0.3) + Math.cos(y * 0.3);
    return interpolateColor([0x0066cc], [0xcc3300], (t + 2) / 4);
  } else if (state.colorMode === 'wireframe') {
    // For wireframe mode, use a neutral color
    return new THREE.Color(0xffffff);
  }
  return new THREE.Color(0x7dd3fc);
}

function interpolateColor(colors1, colors2, t) {
  const result = [];
  for (let i = 0; i < colors1.length / 3; i++) {
    for (let c = 0; c < 3; c++) {
      result.push(
        THREE.MathUtils.lerp(colors1[i * 3 + c], colors2[i * 3 + c], t)
      );
    }
  }
  return new THREE.Color(result);
}

// ============================================
// Animation Loop
// ============================================
let autoRotateSpeed = 0.5;
let rotationDirection = 1;

function animate() {
  requestAnimationFrame(animate);

  if (state.autoRotate) {
    scene.rotation.y += autoRotateSpeed * rotationDirection;
    
    // Reverse direction when it goes too far
    const targetRotation = Math.PI / 2;
    if (scene.rotation.y > targetRotation + Math.PI || scene.rotation.y < -targetRotation - Math.PI) {
      rotationDirection *= -1;
    }
  }

  renderer.render(scene, camera);
}

// ============================================
// Event Handlers
// ============================================
function updateFromInputs() {
  state.functionExpr = document.getElementById('function-input').value;
  state.xMin = parseFloat(document.getElementById('domain-x-min').value);
  state.xMax = parseFloat(document.getElementById('domain-x-max').value);
  state.yMin = parseFloat(document.getElementById('domain-y-min').value);
  state.yMax = parseFloat(document.getElementById('domain-y-max').value);
  state.resolution = parseInt(document.getElementById('resolution').value, 10);
  state.colorMode = document.getElementById('color-mode').value;
  state.opacity = parseFloat(document.getElementById('opacity').value);

  // Update displays
  document.getElementById('x-min-val').textContent = state.xMin;
  document.getElementById('x-max-val').textContent = state.xMax;
  document.getElementById('y-min-val').textContent = state.yMin;
  document.getElementById('y-max-val').textContent = state.yMax;
  document.getElementById('res-val').textContent = state.resolution;
  document.getElementById('op-val').textContent = state.opacity.toFixed(2);

  // Update info panel
  const funcDisplay = state.functionExpr.replace(/sin/g, 'sin').replace(/cos/g, 'cos');
  document.getElementById('info-panel').textContent = `Function: ${funcDisplay}`;

  createSurfaceMesh();
}

// Input event listeners
document.getElementById('function-input').addEventListener('input', updateFromInputs);
document.getElementById('domain-x-min').addEventListener('input', updateFromInputs);
document.getElementById('domain-x-max').addEventListener('input', updateFromInputs);
document.getElementById('domain-y-min').addEventListener('input', updateFromInputs);
document.getElementById('domain-y-max').addEventListener('input', updateFromInputs);
document.getElementById('resolution').addEventListener('input', updateFromInputs);
document.getElementById('color-mode').addEventListener('change', updateFromInputs);
document.getElementById('opacity').addEventListener('input', updateFromInputs);

// Button handlers
document.getElementById('reset-view').addEventListener('click', () => {
  camera.position.set(8, 6, 8);
  camera.lookAt(0, 0, 0);
  scene.rotation.set(0, 0, 0);
});

document.getElementById('auto-rotate').addEventListener('click', (e) => {
  state.autoRotate = !state.autoRotate;
  e.target.textContent = state.autoRotate ? '⏸ Auto Rotate' : '▶ Auto Rotate';
});

// ============================================
// Window Resize
// ============================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================
// Mouse Controls (Orbit-like)
// ============================================
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotation = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
  if (e.target.closest('#ui-panel')) return; // Don't drag if clicking UI
  
  isDragging = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const deltaX = e.clientX - previousMousePosition.x;
  const deltaY = e.clientY - previousMousePosition.y;

  // Rotate scene based on mouse movement
  scene.rotation.y += deltaX * 0.01;
  scene.rotation.x -= deltaY * 0.01;

  // Clamp rotation
  if (scene.rotation.x > Math.PI / 2) {
    scene.rotation.x = Math.PI / 2;
  } else if (scene.rotation.x < -Math.PI / 2) {
    scene.rotation.x = -Math.PI / 2;
  }

  previousMousePosition = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// ============================================
// Keyboard Shortcuts
// ============================================
window.addEventListener('keydown', (e) => {
  switch(e.key.toLowerCase()) {
    case 'r':
      document.getElementById('reset-view').click();
      break;
    case '+':
    case '=':
      // Zoom in slightly
      camera.position.multiplyScalar(0.95);
      break;
    case '-':
      // Zoom out slightly
      camera.position.multiplyScalar(1.05);
      break;
  }
});

// ============================================
// Initialize
// ============================================
updateFromInputs();
animate();

console.log('📊 3D Function Visualizer initialized');
console.log(`   Current function: ${state.functionExpr}`);
