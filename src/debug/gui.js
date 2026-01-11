import { ambientLight, directionalLight } from "../core/lights.js";
import {
  bevelSettings,
  cabinet,
  coneMaterial,
  debugTube,
  decorativeCircle,
  decorativeCircleMaterial,
  decorativeCircleSettings,
  grille,
  grilleMaterial,
  materials,
  rebuildGrille,
  speaker,
  surroundMaterial,
  wooferCone,
  wooferSettings,
  wooferSurround,
} from "../objects/speaker.js";

import GUI from "lil-gui";

export const gui = new GUI({ closeFolders: false });

window.addEventListener("keydown", (e) => {
  if (e.key === "h") gui.show(gui._hidden);
});

// Light tweaks
const lightTweaks = gui.addFolder("Light");
lightTweaks.add(ambientLight, "intensity").min(0).max(10).step(0.01).name("Ambient");
lightTweaks.add(directionalLight, "intensity").min(0).max(10).step(0.01).name("Directional");
lightTweaks.add(directionalLight.position, "x").min(-20).max(20).step(0.01).name("posX");
lightTweaks.add(directionalLight.position, "y").min(-20).max(20).step(0.01).name("posY");
lightTweaks.add(directionalLight.position, "z").min(-20).max(20).step(0.01).name("posZ");

// Speaker group tweaks
const speakerTweaks = gui.addFolder("Speaker");
speakerTweaks.add(speaker.position, "y").min(-5).max(5).step(0.01).name("elevation");
speakerTweaks.add(speaker.rotation, "y").min(-Math.PI).max(Math.PI).step(0.01).name("rotation");
speakerTweaks.add(speaker, "visible").name("visible");
speakerTweaks.add(cabinet, "visible").name("cabinet visible");
speakerTweaks.add(grille, "visible").name("grille visible");
speakerTweaks.add(debugTube, "visible").name("debug tube");

const debug = { wireframe: false };
speakerTweaks.add(debug, "wireframe").onChange((value) => {
  materials.forEach((mat) => (mat.wireframe = value));
  grilleMaterial.wireframe = value;
  surroundMaterial.wireframe = value;
  coneMaterial.wireframe = value;
});

// Grille tweaks
const grilleTweaks = gui.addFolder("Grille");
grilleTweaks.addColor(grilleMaterial, "color");
grilleTweaks.add(grilleMaterial, "roughness").min(0).max(1).step(0.01);
grilleTweaks.add(grilleMaterial, "metalness").min(0).max(1).step(0.01);
grilleTweaks.add(bevelSettings, "depth").min(0).max(0.5).step(0.01).onChange(rebuildGrille);
grilleTweaks.add(bevelSettings, "bevelThickness").min(0).max(0.3).step(0.01).onChange(rebuildGrille);
grilleTweaks.add(bevelSettings, "bevelSize").min(0).max(0.3).step(0.01).onChange(rebuildGrille);
grilleTweaks.add(bevelSettings, "bevelSegments").min(1).max(10).step(1).onChange(rebuildGrille);

// Woofer tweaks
const wooferTweaks = gui.addFolder("Woofer");
wooferTweaks.add(wooferSettings, "radius").min(0.1).max(1.5).step(0.01).name("radius").onChange(rebuildGrille);
wooferTweaks.add(wooferSettings, "yFromBottom").min(0.5).max(8).step(0.1).name("Y from bottom").onChange(rebuildGrille);
wooferTweaks.add(wooferSettings, "protrusion").min(0).max(1).step(0.01).name("protrusion").onChange(rebuildGrille);
wooferTweaks.add(wooferSettings, "sphereSegments").min(16).max(128).step(8).name("segments").onChange(rebuildGrille);
wooferTweaks
  .add(wooferSettings, "surroundRadius")
  .min(0.1)
  .max(1)
  .step(0.01)
  .name("surround radius")
  .onChange(rebuildGrille);
wooferTweaks
  .add(wooferSettings, "surroundTube")
  .min(0.02)
  .max(0.3)
  .step(0.01)
  .name("surround tube")
  .onChange(rebuildGrille);
wooferTweaks.add(wooferSurround.rotation, "x").min(-Math.PI).max(Math.PI).step(0.01).name("surround rot X");
wooferTweaks.add(wooferSurround.rotation, "y").min(-Math.PI).max(Math.PI).step(0.01).name("surround rot Y");
wooferTweaks.add(wooferSurround.rotation, "z").min(-Math.PI).max(Math.PI).step(0.01).name("surround rot Z");
// Note: cone radius is derived from surroundRadius - surroundTube (inner hole of surround)
wooferTweaks
  .add(wooferSettings, "coneProtrusion")
  .min(0)
  .max(1)
  .step(0.01)
  .name("cone protrusion")
  .onChange(rebuildGrille);
wooferTweaks.add(wooferCone.position, "x").min(-1).max(1).step(0.01).name("cone pos X");
wooferTweaks.add(wooferCone.position, "y").min(-5).max(5).step(0.01).name("cone pos Y");
wooferTweaks.add(wooferCone.position, "z").min(0).max(5).step(0.01).name("cone pos Z");

// Decorative circle tweaks
const decorativeTweaks = gui.addFolder("Decorative Circle");
decorativeTweaks.add(decorativeCircle, "visible").name("visible");
decorativeTweaks
  .add(decorativeCircleSettings, "radius")
  .min(0.1)
  .max(1.5)
  .step(0.01)
  .name("radius")
  .onChange(rebuildGrille);
decorativeTweaks
  .add(decorativeCircleSettings, "tube")
  .min(0.001)
  .max(0.1)
  .step(0.001)
  .name("tube")
  .onChange(rebuildGrille);
decorativeTweaks.addColor(decorativeCircleMaterial, "color");
decorativeTweaks.add(decorativeCircleMaterial, "roughness").min(0).max(1).step(0.01);
decorativeTweaks.add(decorativeCircleMaterial, "metalness").min(0).max(1).step(0.01);
// Texture repeat controls (U = tube cross-section, V = ring circumference)
decorativeTweaks.add(decorativeCircleMaterial.map.repeat, "x").min(0.1).max(10).step(0.1).name("tex repeat U");
decorativeTweaks.add(decorativeCircleMaterial.map.repeat, "y").min(1).max(32).step(1).name("tex repeat V");

// Surround material tweaks
const surroundTweaks = gui.addFolder("Surround Material");
surroundTweaks.addColor(surroundMaterial, "color");
surroundTweaks.add(surroundMaterial, "roughness").min(0).max(1).step(0.01);
surroundTweaks.add(surroundMaterial, "metalness").min(0).max(1).step(0.01);

// Cone material tweaks
const coneTweaks = gui.addFolder("Cone Material");
coneTweaks.addColor(coneMaterial, "color");
coneTweaks.add(coneMaterial, "roughness").min(0).max(1).step(0.01);
coneTweaks.add(coneMaterial, "metalness").min(0).max(1).step(0.01);
coneTweaks.add(coneMaterial, "clearcoat").min(0).max(1).step(0.01);
coneTweaks.add(coneMaterial, "clearcoatRoughness").min(0).max(1).step(0.01);
coneTweaks.add(coneMaterial, "anisotropy").min(0).max(1).step(0.01);
coneTweaks.add(coneMaterial, "anisotropyRotation").min(-Math.PI).max(Math.PI).step(0.01);
