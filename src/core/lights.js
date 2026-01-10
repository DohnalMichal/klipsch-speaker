import * as THREE from "three";
import { scene } from "./scene.js";

export const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

export const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 8, 10);
scene.add(directionalLight);

export const lightHelper = new THREE.DirectionalLightHelper(
  directionalLight,
  2,
  0xffff00
);
scene.add(lightHelper);
