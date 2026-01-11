import { scene } from "../core/scene.js";

import * as THREE from "three";
import { speakerDimensions } from "./speaker.js";

const textureLoader = new THREE.TextureLoader();
const oakTexture = textureLoader.load("/textures/oak.jpg");
oakTexture.colorSpace = THREE.SRGBColorSpace;
oakTexture.wrapS = THREE.RepeatWrapping;
oakTexture.wrapT = THREE.RepeatWrapping;
oakTexture.repeat.set(4, 4);

const geometry = new THREE.PlaneGeometry(20, 20);
const material = new THREE.MeshStandardMaterial({
  map: oakTexture,
  side: THREE.DoubleSide,
});

export const floor = new THREE.Mesh(geometry, material);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -speakerDimensions.height / 2; // Level with speaker bottom
floor.receiveShadow = true;
scene.add(floor);
