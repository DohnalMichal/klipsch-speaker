# Klipsch RP-5000F II Ebony

A Three.js visualization of the **Klipsch RP-5000F II Ebony** floor-standing speaker I have at home.

![Three.js](https://img.shields.io/badge/Three.js-0.182-black?logo=threedotjs)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- 🔊 Speaker cabinet with ebony wood texture
- 🖼️ Beveled rubber grille frame
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
├── main.js           # Entry point, render loop
├── core/
│   ├── scene.js      # Scene, camera, renderer, controls
│   └── lights.js     # Lighting setup
├── objects/
│   ├── speaker.js    # Speaker cabinet & grille meshes
│   └── floor.js      # Floor plane
└── debug/
    └── gui.js        # lil-gui debug panel
```

## License

MIT © Michal Dohnal
