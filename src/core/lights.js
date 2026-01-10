import * as THREE from "three";
import { scene } from "./scene.js";

export const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

export const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 8, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

export const lightHelper = new THREE.DirectionalLightHelper(
  directionalLight,
  2,
  0xffff00
);
scene.add(lightHelper);
