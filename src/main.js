import gsap from "gsap";
import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Debug
 */
const gui = new GUI({
  closeFolders: true,
});
gui.hide();

window.addEventListener("keydown", (e) => {
  if (e.key === "h") {
    gui.show(gui._hidden);
  }
});

const debug = {
  color: "#ff0000",
  spin: () => {
    gsap.to(mesh.rotation, { y: mesh.rotation.y + Math.PI * 2 });
  },
  subdivision: 2,
};

/**
 * Base
 */
// Canvas
const canvas = document.getElementById("webgl");
if (!canvas) throw new Error("Canvas .webgl not found");

// Scene
const scene = new THREE.Scene();

/**
 * Object
 */
const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
const material = new THREE.MeshBasicMaterial({
  color: debug.color,
  wireframe: true,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const cubeTweaks = gui.addFolder("Cube");

cubeTweaks.add(mesh.position, "y").min(-3).max(3).step(0.01).name("elevation");
cubeTweaks.add(mesh, "visible");
cubeTweaks.add(material, "wireframe");
cubeTweaks.addColor(debug, "color").onChange(() => {
  material.color.set(debug.color);
});
cubeTweaks.add(debug, "spin");

cubeTweaks
  .add(debug, "subdivision")
  .min(1)
  .max(20)
  .step(1)
  .onFinishChange(() => {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.BoxGeometry(1, 1, 1, debug.subdivision, debug.subdivision, debug.subdivision);
  });

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 2;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setClearColor(0x111111, 1);

function resize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener("resize", resize);
resize();

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const _elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
