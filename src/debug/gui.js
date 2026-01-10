import { ambientLight, directionalLight } from "../core/lights.js";
import {
  bevelSettings,
  cabinet,
  grille,
  materials,
  rebuildGrille,
  rubberMaterial,
  speaker,
  wooferSettings,
} from "../objects/speaker.js";

import GUI from "lil-gui";

export const gui = new GUI({ closeFolders: true });

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

const debug = { wireframe: false };
speakerTweaks.add(debug, "wireframe").onChange((value) => {
  materials.forEach((mat) => (mat.wireframe = value));
  rubberMaterial.wireframe = value;
});

// Grille tweaks
const grilleTweaks = gui.addFolder("Grille");
grilleTweaks
  .addColor({ color: "#1a1a1a" }, "color")
  .name("color")
  .onChange((value) => {
    rubberMaterial.color.set(value);
  });
grilleTweaks.add(rubberMaterial, "roughness").min(0).max(1).step(0.01);
grilleTweaks.add(rubberMaterial, "metalness").min(0).max(1).step(0.01);
grilleTweaks.add(bevelSettings, "depth").min(0).max(0.5).step(0.01).onChange(rebuildGrille);
grilleTweaks.add(bevelSettings, "bevelThickness").min(0).max(0.3).step(0.01).onChange(rebuildGrille);
grilleTweaks.add(bevelSettings, "bevelSize").min(0).max(0.3).step(0.01).onChange(rebuildGrille);
grilleTweaks.add(bevelSettings, "bevelSegments").min(1).max(10).step(1).onChange(rebuildGrille);

// Woofer tweaks
const wooferTweaks = gui.addFolder("Woofer");
wooferTweaks.add(wooferSettings, "radius").min(0.1).max(1.5).step(0.01).name("radius").onChange(rebuildGrille);
wooferTweaks.add(wooferSettings, "yFromBottom").min(0.5).max(8).step(0.1).name("Y from bottom").onChange(rebuildGrille);
wooferTweaks.add(wooferSettings, "protrusion").min(0).max(1).step(0.01).name("protrusion").onChange(rebuildGrille);
