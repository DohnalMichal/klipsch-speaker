import { scene } from "../core/scene.js";

import * as THREE from "three";

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

// Speaker dimensions
const speakerWidth = 2.7;
const speakerHeight = 9.17;
const speakerDepth = 3.75;

// Grille bevel settings
export const bevelSettings = {
  depth: 0,
  bevelThickness: 0.14,
  bevelSize: 0.2,
  bevelSegments: 1,
};

function createGrilleShape() {
  const width = speakerWidth - 2 * bevelSettings.bevelSize;
  const height = speakerHeight - 2 * bevelSettings.bevelSize;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();
  return shape;
}

// Cabinet (wooden box)
const cabinetGeometry = new THREE.BoxGeometry(speakerWidth, speakerHeight, speakerDepth, 2, 2, 2);
export const cabinet = new THREE.Mesh(cabinetGeometry, materials);
cabinet.name = "cabinet";

// Grille (rubber bevel frame)
export const rubberMaterial = new THREE.MeshStandardMaterial({
  color: "#1a1a1a",
  roughness: 0.9,
  metalness: 0.0,
});

export const grille = new THREE.Mesh(
  new THREE.ExtrudeGeometry(createGrilleShape(), { ...bevelSettings, bevelEnabled: true }),
  rubberMaterial,
);
grille.name = "grille";
grille.position.z = speakerDepth / 2;

// Speaker group
export const speaker = new THREE.Group();
speaker.name = "speaker";
speaker.add(cabinet);
speaker.add(grille);
speaker.userData.bevelSettings = bevelSettings;
scene.add(speaker);

export function rebuildGrille() {
  grille.geometry.dispose();
  grille.geometry = new THREE.ExtrudeGeometry(createGrilleShape(), {
    ...bevelSettings,
    bevelEnabled: true,
  });
}
