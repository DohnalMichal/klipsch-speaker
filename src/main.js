import { camera, controls, renderer, scene } from "./core/scene.js";
import "./core/lights.js";
import "./objects/speaker.js";
import "./objects/floor.js";
import "./debug/gui.js";

function tick() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
