# Klipsch RP-5000F II Ebony

A Three.js visualization of the **Klipsch RP-5000F II Ebony** floor-standing speaker I have at home.

![Three.js](https://img.shields.io/badge/Three.js-0.182-black?logo=threedotjs)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- 🔊 Speaker cabinet with ebony wood texture
- 🖼️ Beveled rubber grille frame with CSG cutouts
- 🥁 Dual woofers with brushed copper cones & rubber surrounds
- 💫 Decorative copper rings around woofer protrusions
- 🎮 Orbit controls for 3D exploration
- 📐 Camera position persisted in URL
- 🛠️ Debug GUI for tweaking lights, materials & geometry

## Getting Started

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```

## Project Structure

```
src/
├── main.js              # Entry point, render loop
├── core/
│   ├── scene.js         # Scene, camera, renderer, controls
│   └── lights.js        # HDRI environment & light sources
├── objects/
│   ├── speaker.js       # Speaker assembly (see below)
│   └── floor.js         # Floor plane
└── debug/
    └── gui.js           # lil-gui debug panel
```

### Speaker Module (`speaker.js`)

The speaker is organized into clear sections:

| Section | Contents |
|---------|----------|
| **Configuration** | Dimensions, bevel settings, woofer settings, positions |
| **Textures** | Ebony wood, brushed copper |
| **Materials** | Cabinet faces, grille, surround, cone, decorative ring |
| **Geometry Helpers** | UV projection, shape creation, position helpers |
| **CSG Operations** | Boolean subtractions for woofer & cone holes |
| **Mesh Assembly** | Cabinet, grille, woofer groups |
| **Public API** | `rebuildGrille()` for live geometry updates |

## License

MIT © Michal Dohnal
