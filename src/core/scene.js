import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("webgl");
if (!canvas) throw new Error("Canvas #webgl not found");

export const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(2));

// Parse camera position from URL params
function getCameraFromURL() {
  const params = new URLSearchParams(window.location.search);
  const cam = params.get("cam");

  if (cam) {
    const [x, y, z] = cam.split(",").map(Number);
    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      return { x, y, z };
    }
  }

  return { x: 10, y: 7, z: 13 };
}

const initialPosition = getCameraFromURL();

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
scene.add(camera);

export const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Save camera position to URL params on change
function saveCameraToURL() {
  const params = new URLSearchParams(window.location.search);
  const { x, y, z } = camera.position;

  params.set("cam", `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`);

  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newURL);
}

controls.addEventListener("end", saveCameraToURL);

export const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setClearColor(0x111111, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener("resize", resize);
resize();
