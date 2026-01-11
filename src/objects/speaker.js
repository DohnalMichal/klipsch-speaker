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
  protrusion: 0.5, // how far the dome sticks out
  // Rubber surround (torus)
  surroundRadius: 0.55, // distance from center to tube center
  surroundTube: 0.07, // tube thickness
  // Cone protrusion
  coneProtrusion: 0, // how far the cone sticks out
  // Geometry resolution
  sphereSegments: 64, // sphere resolution (higher = smoother)
  coneSegments: 48, // cone sphere segments
  coneRings: 24, // cone sphere rings
  torusRadialSegments: 32,
  torusTubularSegments: 64,
};

/**
 * Woofer positions (Y from bottom of speaker).
 * The speaker has two woofers at different heights.
 */
export const wooferPositions = [
  { yFromBottom: 4.0 }, // Lower woofer (40cm from bottom)
  { yFromBottom: 5.5 }, // Upper woofer (55cm from bottom)
];

/**
 * Cone radius is derived from the surround inner hole.
 * This ensures the cone fits exactly inside the rubber surround torus.
 * Formula: surroundRadius - surroundTube = inner edge of torus
 */
function getConeRadius() {
  return wooferSettings.surroundRadius - wooferSettings.surroundTube;
}

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

// Copper texture for decorative circle (adjusted for torus UV mapping)
const decorativeCircleTexture = textureLoader.load("/textures/circular-brushed-copper-texture.jpg");
decorativeCircleTexture.colorSpace = THREE.SRGBColorSpace;
decorativeCircleTexture.wrapS = THREE.RepeatWrapping;
decorativeCircleTexture.wrapT = THREE.RepeatWrapping;
// For torus: U = around tube cross-section, V = around ring circumference
// High V repeat for the circumference, low U for the thin tube
decorativeCircleTexture.repeat.set(1, 12);

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

// Decorative circle material (brushed copper, optimized for thin torus)
export const decorativeCircleMaterial = new THREE.MeshPhysicalMaterial({
  map: decorativeCircleTexture,
  color: "#ffffff",
  roughness: 0.5,
  metalness: 0.9,
});

/**
 * Debug tube material (red wireframe).
 * Used to visualize the cylinder that creates the cone hole in grille and cabinet.
 */
const debugTubeMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
});

/**
 * Cone hole cylinder settings (used for CSG subtraction).
 * Radius matches the cone (which fits inside the surround inner hole).
 */
const coneHoleCylinder = {
  get radius() {
    return getConeRadius();
  },
  height: 2, // Long enough to cut through both grille and cabinet
  segments: 32,
};

// ═══════════════════════════════════════════════════════════════════════════
// GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Calculate woofer Y position relative to speaker center */
function getWooferY(yFromBottom) {
  return -speakerDimensions.height / 2 + yFromBottom;
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

/** Create grille geometry with woofer and cone holes cut out for all woofer positions */
function createGrilleWithHole() {
  const frontZ = getFrontZ();

  // Create grille brush
  const grilleGeometry = new THREE.ExtrudeGeometry(createGrilleShape(), {
    ...bevelSettings,
    bevelEnabled: true,
  });
  let currentBrush = new Brush(grilleGeometry, grilleMaterial);
  currentBrush.position.z = frontZ;
  currentBrush.updateMatrixWorld();

  const geometriesToDispose = [grilleGeometry];

  // Cut holes for each woofer position
  for (const pos of wooferPositions) {
    const wooferY = getWooferY(pos.yFromBottom);

    // Create woofer sphere brush for subtraction
    const wooferGeometry = new THREE.SphereGeometry(
      wooferSettings.radius,
      wooferSettings.sphereSegments,
      wooferSettings.sphereSegments,
    );
    const wooferBrush = new Brush(wooferGeometry);
    wooferBrush.position.set(0, wooferY, frontZ + wooferSettings.protrusion);
    wooferBrush.updateMatrixWorld();

    // Subtract woofer sphere
    currentBrush = csgEvaluator.evaluate(currentBrush, wooferBrush, SUBTRACTION);
    geometriesToDispose.push(wooferGeometry);

    // Create cylinder for cone hole cutout
    const coneHoleGeometry = new THREE.CylinderGeometry(
      coneHoleCylinder.radius,
      coneHoleCylinder.radius,
      coneHoleCylinder.height,
      coneHoleCylinder.segments,
    );
    coneHoleGeometry.rotateX(Math.PI / 2);

    const coneHoleBrush = new Brush(coneHoleGeometry);
    coneHoleBrush.position.set(0, wooferY, frontZ);
    coneHoleBrush.updateMatrixWorld();

    // Subtract cylinder
    currentBrush = csgEvaluator.evaluate(currentBrush, coneHoleBrush, SUBTRACTION);
    geometriesToDispose.push(coneHoleGeometry);
  }

  currentBrush.geometry.computeVertexNormals();

  // Clean up all intermediate geometries
  for (const geo of geometriesToDispose) {
    geo.dispose();
  }

  return currentBrush.geometry;
}

/**
 * Create cabinet geometry with cone holes cut out for all woofer positions.
 * Uses the same cylinder as the grille to ensure the holes align perfectly.
 */
function createCabinetWithHole() {
  const frontZ = getFrontZ();

  // Create cabinet brush
  const cabinetGeometry = new THREE.BoxGeometry(
    speakerDimensions.width,
    speakerDimensions.height,
    speakerDimensions.depth,
  );
  let currentBrush = new Brush(cabinetGeometry, materials);
  currentBrush.updateMatrixWorld();

  const geometriesToDispose = [cabinetGeometry];

  // Cut holes for each woofer position
  for (const pos of wooferPositions) {
    const wooferY = getWooferY(pos.yFromBottom);

    // Create cylinder for cone hole cutout
    const coneHoleGeometry = new THREE.CylinderGeometry(
      coneHoleCylinder.radius,
      coneHoleCylinder.radius,
      coneHoleCylinder.height,
      coneHoleCylinder.segments,
    );
    coneHoleGeometry.rotateX(Math.PI / 2);

    const coneHoleBrush = new Brush(coneHoleGeometry);
    coneHoleBrush.position.set(0, wooferY, frontZ);
    coneHoleBrush.updateMatrixWorld();

    // Subtract cylinder from cabinet
    currentBrush = csgEvaluator.evaluate(currentBrush, coneHoleBrush, SUBTRACTION);
    geometriesToDispose.push(coneHoleGeometry);
  }

  currentBrush.geometry.computeVertexNormals();

  // Clean up all intermediate geometries
  for (const geo of geometriesToDispose) {
    geo.dispose();
  }

  return currentBrush.geometry;
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

/**
 * Decorative circle ring around the woofer sphere protrusion.
 * Sits just outside the sphere cutout edge, very thin profile.
 */
export const decorativeCircleSettings = {
  radius: 0.64, // Just outside the woofer sphere
  tube: 0.004, // Very thin tube
  radialSegments: 32,
  tubularSegments: 64,
};

// ═══════════════════════════════════════════════════════════════════════════
// WOOFER FACTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a woofer group with all components at the specified Y position.
 * The group contains: decorative circle, rubber surround, cone, and debug tube.
 * All components are positioned relative to the group, which is then positioned
 * at the correct Y height on the speaker.
 *
 * @param {number} yFromBottom - Distance from bottom of speaker (in scene units)
 * @param {number} index - Woofer index for naming
 * @returns {THREE.Group} Complete woofer assembly
 */
function createWooferGroup(yFromBottom, index) {
  const wooferY = getWooferY(yFromBottom);
  const frontZ = getFrontZ();

  // Create group for this woofer assembly
  const wooferGroup = new THREE.Group();
  wooferGroup.name = `woofer_${index}`;
  wooferGroup.userData.yFromBottom = yFromBottom;

  // Decorative circle
  const decorativeCircleGeometry = new THREE.TorusGeometry(
    decorativeCircleSettings.radius,
    decorativeCircleSettings.tube,
    decorativeCircleSettings.radialSegments,
    decorativeCircleSettings.tubularSegments,
  );
  const decorativeCircle = new THREE.Mesh(decorativeCircleGeometry, decorativeCircleMaterial);
  decorativeCircle.name = "decorativeCircle";
  decorativeCircle.rotation.x = Math.PI;
  decorativeCircle.position.set(0, wooferY, frontZ + bevelSettings.bevelThickness);
  wooferGroup.add(decorativeCircle);

  // Rubber surround (torus ring)
  const surroundGeometry = new THREE.TorusGeometry(
    wooferSettings.surroundRadius,
    wooferSettings.surroundTube,
    wooferSettings.torusRadialSegments,
    wooferSettings.torusTubularSegments,
  );
  const wooferSurround = new THREE.Mesh(surroundGeometry, surroundMaterial);
  wooferSurround.name = "wooferSurround";
  wooferSurround.castShadow = true;
  wooferSurround.rotation.x = -Math.PI;
  wooferSurround.position.set(0, wooferY, frontZ);
  wooferGroup.add(wooferSurround);

  // Cone (bronze hemisphere) - radius matches surround inner hole
  const coneHemisphereGeometry = new THREE.SphereGeometry(
    getConeRadius(),
    wooferSettings.coneSegments,
    wooferSettings.coneRings,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  applyPlanarUVsToHemisphere(coneHemisphereGeometry, getConeRadius());
  const wooferCone = new THREE.Mesh(coneHemisphereGeometry, coneMaterial);
  wooferCone.name = "wooferCone";
  wooferCone.castShadow = true;
  wooferCone.rotation.x = -Math.PI / 2;
  wooferCone.position.set(0, wooferY, frontZ + wooferSettings.coneProtrusion);
  wooferGroup.add(wooferCone);

  // Debug tube (red wireframe cylinder for CSG visualization)
  const debugTubeGeometry = new THREE.CylinderGeometry(
    coneHoleCylinder.radius,
    coneHoleCylinder.radius,
    coneHoleCylinder.height,
    coneHoleCylinder.segments,
  );
  const debugTube = new THREE.Mesh(debugTubeGeometry, debugTubeMaterial);
  debugTube.visible = false;
  debugTube.name = "debugTube";
  debugTube.rotation.x = Math.PI / 2;
  debugTube.position.set(0, wooferY, frontZ);
  wooferGroup.add(debugTube);

  // Store references for GUI access
  wooferGroup.userData.decorativeCircle = decorativeCircle;
  wooferGroup.userData.wooferSurround = wooferSurround;
  wooferGroup.userData.wooferCone = wooferCone;
  wooferGroup.userData.debugTube = debugTube;

  return wooferGroup;
}

/**
 * Array of woofer groups. Each woofer is a complete assembly that can be
 * controlled together. The speaker has multiple woofers at different heights.
 */
export const woofers = wooferPositions.map((pos, index) => createWooferGroup(pos.yFromBottom, index));

// Export first woofer's components for backwards compatibility with GUI
export const decorativeCircle = woofers[0].userData.decorativeCircle;
export const wooferSurround = woofers[0].userData.wooferSurround;
export const wooferCone = woofers[0].userData.wooferCone;
export const debugTube = woofers[0].userData.debugTube;

// Speaker group (combines all parts)
export const speaker = new THREE.Group();
speaker.name = "speaker";
speaker.add(cabinet, grille, ...woofers);
speaker.userData.bevelSettings = bevelSettings;
scene.add(speaker);

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rebuild geometries for a single woofer group.
 * @param {THREE.Group} wooferGroup - The woofer group to rebuild
 */
function rebuildWooferGroup(wooferGroup) {
  const yFromBottom = wooferGroup.userData.yFromBottom;
  const wooferY = getWooferY(yFromBottom);
  const frontZ = getFrontZ();

  const decCircle = wooferGroup.userData.decorativeCircle;
  const surround = wooferGroup.userData.wooferSurround;
  const cone = wooferGroup.userData.wooferCone;
  const tube = wooferGroup.userData.debugTube;

  // Update decorative circle
  decCircle.geometry.dispose();
  decCircle.geometry = new THREE.TorusGeometry(
    decorativeCircleSettings.radius,
    decorativeCircleSettings.tube,
    decorativeCircleSettings.radialSegments,
    decorativeCircleSettings.tubularSegments,
  );
  decCircle.position.set(0, wooferY, frontZ + bevelSettings.bevelThickness);

  // Update woofer surround
  surround.geometry.dispose();
  surround.geometry = new THREE.TorusGeometry(
    wooferSettings.surroundRadius,
    wooferSettings.surroundTube,
    wooferSettings.torusRadialSegments,
    wooferSettings.torusTubularSegments,
  );
  surround.position.set(0, wooferY, frontZ);

  // Update woofer cone - radius matches surround inner hole
  cone.geometry.dispose();
  cone.geometry = new THREE.SphereGeometry(
    getConeRadius(),
    wooferSettings.coneSegments,
    wooferSettings.coneRings,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  applyPlanarUVsToHemisphere(cone.geometry, getConeRadius());
  cone.position.set(0, wooferY, frontZ + wooferSettings.coneProtrusion);

  // Update debug tube - radius matches cone (surround inner hole)
  tube.geometry.dispose();
  tube.geometry = new THREE.CylinderGeometry(
    coneHoleCylinder.radius,
    coneHoleCylinder.radius,
    coneHoleCylinder.height,
    coneHoleCylinder.segments,
  );
  tube.position.set(0, wooferY, frontZ);
}

/** Rebuild all speaker geometries (call after changing settings) */
export function rebuildGrille() {
  // Rebuild cabinet with holes for all woofers
  cabinet.geometry.dispose();
  cabinet.geometry = createCabinetWithHole();

  // Rebuild grille with holes for all woofers
  grille.geometry.dispose();
  grille.geometry = createGrilleWithHole();

  // Rebuild each woofer group
  for (const wooferGroup of woofers) {
    rebuildWooferGroup(wooferGroup);
  }
}
