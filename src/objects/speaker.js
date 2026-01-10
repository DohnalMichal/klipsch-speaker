import { scene } from "../core/scene.js";

import * as THREE from "three";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";

const textureLoader = new THREE.TextureLoader();

export const ebonyTexture = textureLoader.load("/textures/ebony.jpg", () => {
  console.log("texture loaded", ebonyTexture.image);
});
ebonyTexture.colorSpace = THREE.SRGBColorSpace;
ebonyTexture.wrapS = THREE.RepeatWrapping;
ebonyTexture.wrapT = THREE.RepeatWrapping;
ebonyTexture.repeat.set(1, 2);

const rotatedTexture = ebonyTexture.clone();
rotatedTexture.rotation = Math.PI / 2;
rotatedTexture.center.set(0.5, 0.5);

export const materials = [
  new THREE.MeshStandardMaterial({ map: rotatedTexture }), // right
  new THREE.MeshStandardMaterial({ map: rotatedTexture }), // left
  new THREE.MeshStandardMaterial({ map: ebonyTexture }), // top
  new THREE.MeshStandardMaterial({ map: ebonyTexture }), // bottom
  new THREE.MeshStandardMaterial({ color: "#000000" }), // front (hidden by grille)
  new THREE.MeshStandardMaterial({ map: rotatedTexture }), // back
];

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
  segments: 64, // sphere resolution (higher = smoother)
  // Rubber surround (torus)
  surroundRadius: 0.55, // distance from center to tube center
  surroundTube: 0.07, // tube thickness
};

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

// Cabinet (wooden box)
const cabinetGeometry = new THREE.BoxGeometry(
  speakerDimensions.width,
  speakerDimensions.height,
  speakerDimensions.depth,
  2,
  2,
  2,
);
export const cabinet = new THREE.Mesh(cabinetGeometry, materials);
cabinet.name = "cabinet";

// Grille material (slightly shiny)
export const grilleMaterial = new THREE.MeshStandardMaterial({
  color: "#1a1a1a",
  roughness: 0.4,
  metalness: 0.2,
});

// Woofer surround material (rubbery)
export const surroundMaterial = new THREE.MeshStandardMaterial({
  color: "#0a0a0a",
  roughness: 0.95,
  metalness: 0.0,
});

// CSG evaluator for boolean operations
const csgEvaluator = new Evaluator();

function createGrilleWithHole() {
  // Create grille brush
  const grilleGeometry = new THREE.ExtrudeGeometry(createGrilleShape(), {
    ...bevelSettings,
    bevelEnabled: true,
  });
  const grilleBrush = new Brush(grilleGeometry, grilleMaterial);
  grilleBrush.position.z = speakerDimensions.depth / 2;
  grilleBrush.updateMatrixWorld();

  // Calculate woofer Y position
  const wooferY = -speakerDimensions.height / 2 + wooferSettings.yFromBottom;

  // Create woofer sphere brush for subtraction
  // Position sphere forward so it protrudes, creating a dome-shaped cutout
  const wooferGeometry = new THREE.SphereGeometry(
    wooferSettings.radius,
    wooferSettings.segments,
    wooferSettings.segments,
  );
  const wooferBrush = new Brush(wooferGeometry);
  wooferBrush.position.set(0, wooferY, speakerDimensions.depth / 2 + wooferSettings.protrusion);
  wooferBrush.updateMatrixWorld();

  // Subtract woofer from grille
  const result = csgEvaluator.evaluate(grilleBrush, wooferBrush, SUBTRACTION);
  result.geometry.computeVertexNormals();

  // Clean up
  grilleGeometry.dispose();
  wooferGeometry.dispose();

  return result.geometry;
}

export const grille = new THREE.Mesh(createGrilleWithHole(), grilleMaterial);
grille.name = "grille";

// Woofer rubber surround (torus)
const wooferY = -speakerDimensions.height / 2 + wooferSettings.yFromBottom;

const surroundGeometry = new THREE.TorusGeometry(wooferSettings.surroundRadius, wooferSettings.surroundTube, 24, 64);
export const wooferSurround = new THREE.Mesh(surroundGeometry, surroundMaterial);
wooferSurround.name = "wooferSurround";
wooferSurround.rotation.x = -Math.PI; // rotate to face forward (flipped)
// Position at grille surface where the sphere dome ends
wooferSurround.position.set(0, wooferY, speakerDimensions.depth / 2);

// Speaker group
export const speaker = new THREE.Group();
speaker.name = "speaker";
speaker.add(cabinet);
speaker.add(grille);
speaker.add(wooferSurround);
speaker.userData.bevelSettings = bevelSettings;
scene.add(speaker);

export function rebuildGrille() {
  grille.geometry.dispose();
  grille.geometry = createGrilleWithHole();

  // Update woofer surround position and geometry
  const newWooferY = -speakerDimensions.height / 2 + wooferSettings.yFromBottom;
  wooferSurround.position.set(0, newWooferY, speakerDimensions.depth / 2);

  wooferSurround.geometry.dispose();
  wooferSurround.geometry = new THREE.TorusGeometry(wooferSettings.surroundRadius, wooferSettings.surroundTube, 24, 64);
}
