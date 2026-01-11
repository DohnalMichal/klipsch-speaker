import { scene } from "../core/scene.js";

import * as THREE from "three";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Speaker dimensions (scale: 1 unit = 10cm)
export const speakerDimensions = {
  width: 1.7,
  height: 7.17,
  depth: 3.75,
};

// Grille bevel settings
export const bevelSettings = {
  depth: 0,
  bevelThickness: 0.14,
  bevelSize: 0.2,
  bevelSegments: 1,
};

// Woofer settings (scale: 1 unit = 10cm)
export const wooferSettings = {
  radius: 1.45 / 2, // 14.5cm diameter
  yFromBottom: 4.0, // 40cm from bottom
  protrusion: 0.5, // how far the dome sticks out
  // Rubber surround (torus)
  surroundRadius: 0.55, // distance from center to tube center
  surroundTube: 0.07, // tube thickness
  // Cone (inner sphere)
  coneRadius: 0.45, // radius of the bronze cone
  coneProtrusion: 0.3, // how far the cone sticks out
  // Geometry resolution
  sphereSegments: 64, // sphere resolution (higher = smoother)
  coneSegments: 48, // cone sphere segments
  coneRings: 24, // cone sphere rings
  torusRadialSegments: 24,
  torusTubularSegments: 64,
};

// ═══════════════════════════════════════════════════════════════════════════
// TEXTURES
// ═══════════════════════════════════════════════════════════════════════════

const textureLoader = new THREE.TextureLoader();

// Wood texture for cabinet sides
export const ebonyTexture = textureLoader.load("/textures/ebony.jpg");
ebonyTexture.colorSpace = THREE.SRGBColorSpace;
ebonyTexture.wrapS = THREE.RepeatWrapping;
ebonyTexture.wrapT = THREE.RepeatWrapping;
ebonyTexture.repeat.set(1, 2);

// Rotated variant for side panels
const rotatedTexture = ebonyTexture.clone();
rotatedTexture.rotation = Math.PI / 2;
rotatedTexture.center.set(0.5, 0.5);

// Copper texture for woofer cone
const copperTexture = textureLoader.load("/textures/circular-brushed-copper-texture.jpg");
copperTexture.colorSpace = THREE.SRGBColorSpace;

// ═══════════════════════════════════════════════════════════════════════════
// MATERIALS
// ═══════════════════════════════════════════════════════════════════════════

// Cabinet face materials (indexed by BoxGeometry face order)
export const materials = [
  new THREE.MeshStandardMaterial({ map: rotatedTexture }), // right
  new THREE.MeshStandardMaterial({ map: rotatedTexture }), // left
  new THREE.MeshStandardMaterial({ map: ebonyTexture }), // top
  new THREE.MeshStandardMaterial({ map: ebonyTexture }), // bottom
  new THREE.MeshStandardMaterial({ color: "#000000" }), // front (hidden by grille)
  new THREE.MeshStandardMaterial({ map: rotatedTexture }), // back
];

// Cabinet front face (mostly hidden by grille)
export const cabinetFrontMaterial = new THREE.MeshStandardMaterial({
  color: "#000000",
});

// Grille (slightly shiny fabric/metal mesh look)
export const grilleMaterial = new THREE.MeshStandardMaterial({
  color: "#1a1a1a",
  roughness: 0.4,
  metalness: 0.2,
});

// Woofer rubber surround
export const surroundMaterial = new THREE.MeshStandardMaterial({
  color: "#0a0a0a",
  roughness: 0.95,
  metalness: 0.0,
});

// Woofer cone (brushed copper)
export const coneMaterial = new THREE.MeshPhysicalMaterial({
  map: copperTexture,
  color: "#ffffff",
  roughness: 0.7,
  metalness: 0.81,
  side: THREE.DoubleSide,
});

// ═══════════════════════════════════════════════════════════════════════════
// GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Calculate woofer Y position relative to speaker center */
function getWooferY() {
  return -speakerDimensions.height / 2 + wooferSettings.yFromBottom;
}

/** Get Z position of speaker front face */
function getFrontZ() {
  return speakerDimensions.depth / 2;
}

/**
 * Apply planar UV projection to a hemisphere geometry (dome pointing +Y).
 * Makes the texture project straight onto the dome like a decal.
 */
function applyPlanarUVsToHemisphere(geometry, radius) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    // Map X,Z position to UV (0-1), centered at 0.5
    uv.setXY(i, x / (2 * radius) + 0.5, z / (2 * radius) + 0.5);
  }

  uv.needsUpdate = true;
}

/** Create the grille outer shape (rectangle minus bevel insets) */
function createGrilleShape() {
  const width = speakerDimensions.width - 2 * bevelSettings.bevelSize;
  const height = speakerDimensions.height - 2 * bevelSettings.bevelSize;

  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();

  return shape;
}

// ═══════════════════════════════════════════════════════════════════════════
// CSG OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

const csgEvaluator = new Evaluator();

/** Create grille geometry with woofer and cone holes cut out */
function createGrilleWithHole() {
  const wooferY = getWooferY();
  const frontZ = getFrontZ();

  // Create grille brush
  const grilleGeometry = new THREE.ExtrudeGeometry(createGrilleShape(), {
    ...bevelSettings,
    bevelEnabled: true,
  });
  const grilleBrush = new Brush(grilleGeometry, grilleMaterial);
  grilleBrush.position.z = frontZ;
  grilleBrush.updateMatrixWorld();

  // Create woofer sphere brush for subtraction
  const wooferGeometry = new THREE.SphereGeometry(
    wooferSettings.radius,
    wooferSettings.sphereSegments,
    wooferSettings.sphereSegments,
  );
  const wooferBrush = new Brush(wooferGeometry);
  wooferBrush.position.set(0, wooferY, frontZ + wooferSettings.protrusion);
  wooferBrush.updateMatrixWorld();

  // Subtract woofer from grille
  const afterWoofer = csgEvaluator.evaluate(grilleBrush, wooferBrush, SUBTRACTION);

  // Create cone sphere brush for subtraction
  const coneGeometry = new THREE.SphereGeometry(
    wooferSettings.coneRadius,
    wooferSettings.coneSegments,
    wooferSettings.coneSegments,
    0,
    Math.PI,
  );
  const coneBrush = new Brush(coneGeometry);
  coneBrush.position.set(0, wooferY, frontZ + wooferSettings.coneProtrusion);
  coneBrush.updateMatrixWorld();

  // Subtract cone from grille
  const result = csgEvaluator.evaluate(afterWoofer, coneBrush, SUBTRACTION);
  result.geometry.computeVertexNormals();

  // Clean up intermediate geometries
  grilleGeometry.dispose();
  wooferGeometry.dispose();
  coneGeometry.dispose();

  return result.geometry;
}

/** Create cabinet geometry with cone hole cut out */
function createCabinetWithHole() {
  const wooferY = getWooferY();
  const frontZ = getFrontZ();

  // Create cabinet brush
  const cabinetGeometry = new THREE.BoxGeometry(
    speakerDimensions.width,
    speakerDimensions.height,
    speakerDimensions.depth,
  );
  const cabinetBrush = new Brush(cabinetGeometry, materials);
  cabinetBrush.updateMatrixWorld();

  // Create cone sphere brush for subtraction (only cone goes through cabinet)
  const coneGeometry = new THREE.SphereGeometry(
    wooferSettings.coneRadius,
    wooferSettings.coneSegments,
    wooferSettings.coneSegments,
  );
  const coneBrush = new Brush(coneGeometry);
  coneBrush.position.set(0, wooferY, frontZ + wooferSettings.coneProtrusion);
  coneBrush.updateMatrixWorld();

  // Subtract cone from cabinet
  const result = csgEvaluator.evaluate(cabinetBrush, coneBrush, SUBTRACTION);
  result.geometry.computeVertexNormals();

  // Clean up
  cabinetGeometry.dispose();
  coneGeometry.dispose();

  return result.geometry;
}

// ═══════════════════════════════════════════════════════════════════════════
// MESH ASSEMBLY
// ═══════════════════════════════════════════════════════════════════════════

// Cabinet (main speaker body)
export const cabinet = new THREE.Mesh(createCabinetWithHole(), materials);
cabinet.name = "cabinet";
cabinet.castShadow = true;

// Grille (front panel with holes)
export const grille = new THREE.Mesh(createGrilleWithHole(), grilleMaterial);
grille.name = "grille";
grille.castShadow = true;

// Woofer rubber surround (torus ring)
const surroundGeometry = new THREE.TorusGeometry(
  wooferSettings.surroundRadius,
  wooferSettings.surroundTube,
  wooferSettings.torusRadialSegments,
  wooferSettings.torusTubularSegments,
);
export const wooferSurround = new THREE.Mesh(surroundGeometry, surroundMaterial);
wooferSurround.name = "wooferSurround";
wooferSurround.castShadow = true;
wooferSurround.rotation.x = -Math.PI; // rotate to face forward
wooferSurround.position.set(0, getWooferY(), getFrontZ());

// Woofer cone (bronze hemisphere)
const coneHemisphereGeometry = new THREE.SphereGeometry(
  wooferSettings.coneRadius,
  wooferSettings.coneSegments,
  wooferSettings.coneRings,
  0,
  Math.PI * 2,
  0,
  Math.PI / 2, // hemisphere (half sphere)
);
applyPlanarUVsToHemisphere(coneHemisphereGeometry, wooferSettings.coneRadius);

export const wooferCone = new THREE.Mesh(coneHemisphereGeometry, coneMaterial);
wooferCone.name = "wooferCone";
wooferCone.castShadow = true;
wooferCone.rotation.x = -Math.PI / 2; // rotate hemisphere to face forward
wooferCone.position.set(0, getWooferY(), getFrontZ() + wooferSettings.coneProtrusion);

// Speaker group (combines all parts)
export const speaker = new THREE.Group();
speaker.name = "speaker";
speaker.add(cabinet, grille, wooferSurround, wooferCone);
speaker.userData.bevelSettings = bevelSettings;
scene.add(speaker);

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/** Rebuild all speaker geometries (call after changing settings) */
export function rebuildGrille() {
  const wooferY = getWooferY();
  const frontZ = getFrontZ();

  // Rebuild cabinet with holes
  cabinet.geometry.dispose();
  cabinet.geometry = createCabinetWithHole();

  // Rebuild grille with holes
  grille.geometry.dispose();
  grille.geometry = createGrilleWithHole();

  // Update woofer surround
  wooferSurround.geometry.dispose();
  wooferSurround.geometry = new THREE.TorusGeometry(
    wooferSettings.surroundRadius,
    wooferSettings.surroundTube,
    wooferSettings.torusRadialSegments,
    wooferSettings.torusTubularSegments,
  );
  wooferSurround.position.set(0, wooferY, frontZ);

  // Update woofer cone
  wooferCone.geometry.dispose();
  wooferCone.geometry = new THREE.SphereGeometry(
    wooferSettings.coneRadius,
    wooferSettings.coneSegments,
    wooferSettings.coneRings,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  applyPlanarUVsToHemisphere(wooferCone.geometry, wooferSettings.coneRadius);
  wooferCone.position.set(0, wooferY, frontZ + wooferSettings.coneProtrusion);
}
