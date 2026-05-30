# 🎮 Spatial Recon Game

[![Deploy Web Capture](https://github.com/DigiArch424/spatial-recon-game/actions/workflows/deploy-l01.yml/badge.svg)](https://github.com/DigiArch424/spatial-recon-game/actions/workflows/deploy-l01.yml)
[![Live Demo](https://img.shields.io/badge/Live-GitHub%20Pages-blue)](https://digiarch424.github.io/spatial-recon-game/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A web-based, open-source distributed 3D reconstruction engine, gamified across 20 levels.
Each level is a real subsystem. Each subsystem maps to a real deployment environment.

**End goal:** Reconstructed real-world spaces with spatial coordinates, AR anchoring, and 3D model placement.

**Live:** https://digiarch424.github.io/spatial-recon-game/

---

## Architecture Overview

| Layer | Levels | Target | Stack |
|---|---|---|---|
| 🌐 Browser | 1–3 | GitHub Pages / Vercel | WebRTC, Three.js, Vite, IndexedDB |
| ⚙️ Edge / WASM | 4–6 | Cloudflare Workers | OpenCV.js, COLMAP, FastAPI |
| ☁️ GPU Cloud | 7–14 | RunPod / K8s | OpenMVS, Nerfstudio, WebGPU |
| 🧠 AI / Spatial OS | 15–20 | AI microservices | SAM, CLIP, Neo4j, WebXR |

---

## Level Checklist

### 🟢 Browser Layer — `apps/web-capture`

| Level | Name | Status | Key Capability |
|---|---|---|---|
| L01 | Camera Spawn | ✅ Complete | WebRTC single-frame capture, DigiArch424 HUD |
| L02 | Frame Collector | ✅ Complete | Multi-frame session, IndexedDB, blur detection, duplicate suppression, ZIP export |
| L03 | Scene Sampling Mode | ✅ Complete | Phase-guided capture, gyroscope tracking, Three.js coverage map, scan quality score |

### 🟡 Edge / WASM Layer

| Level | Name | Status | Key Capability |
|---|---|---|---|
| L04 | Feature Vision | ⏳ Pending | OpenCV.js per-frame feature detection |
| L05 | Structure-from-Motion Core | ⏳ Pending | COLMAP / FastAPI microservice, camera pose estimation |
| L06 | Pose Graph Engine | ⏳ Pending | Camera trajectory reconstruction, Ceres Solver |

### ☁️ GPU Cloud Layer

| Level | Name | Status | Key Capability |
|---|---|---|---|
| L07 | Sparse Reconstruction | ⏳ Pending | COLMAP sparse point cloud |
| L08 | Dense Reconstruction | ⏳ Pending | OpenMVS depth fusion, CUDA |
| L09 | Mesh Forging | ⏳ Pending | Open3D surface reconstruction |
| L10 | Texture Binding | ⏳ Pending | Blender CLI UV bake |
| L11 | Pipeline Orchestrator | ⏳ Pending | Temporal.io / Dagster job graph |
| L12 | Gaussian Splat World | ⏳ Pending | Nerfstudio training |
| L13 | Real-Time Splat Renderer | ⏳ Pending | WebGPU viewer |
| L14 | Streaming Reconstruction Loop | ⏳ Pending | Live incremental pipeline |

### 🧠 AI + Spatial OS Layer

| Level | Name | Status | Key Capability |
|---|---|---|---|
| L15 | Semantic Scene Layer | ⏳ Pending | SAM + CLIP + vector DB |
| L16 | Parametric Engine | ⏳ Pending | Neural implicit → CAD primitives |
| L17 | Scene Graph Intelligence | ⏳ Pending | Neo4j knowledge graph |
| L18 | WebXR Spatial Mode | ⏳ Pending | AR anchoring + overlay |
| L19 | Shared Spatial Worlds | ⏳ Pending | Multi-user CRDT sync |
| L20 | Production Spatial OS | ⏳ Pending | Full distributed spatial platform |

---

## Project Structure

```
spatial-recon-game/
├── .github/workflows/
│   └── deploy-l01.yml          # Auto-deploy web-capture to GitHub Pages
└── apps/
    └── web-capture/            # Browser layer — Levels 01–03
        ├── public/
        │   ├── favicon.svg
        │   └── .nojekyll
        ├── src/
        │   ├── App.jsx
        │   ├── db/
        │   │   └── frameDB.js
        │   ├── hooks/
        │   │   ├── useCamera.js
        │   │   ├── useDeviceOrientation.js
        │   │   ├── useFrameStore.js
        │   │   ├── useScanGuidance.js
        │   │   ├── useTick.js
        │   │   └── useWindowSize.js
        │   ├── components/
        │   │   ├── CoverageMap.jsx
        │   │   ├── FrameStrip.jsx
        │   │   ├── HudOverlays.jsx
        │   │   ├── MobilePanel.jsx
        │   │   └── Primitives.jsx
        │   └── utils/
        │       └── imageAnalysis.js
        ├── index.html
        ├── package.json
        └── vite.config.js
```

---

## Quick Start

```bash
git clone https://github.com/DigiArch424/spatial-recon-game.git
cd spatial-recon-game/apps/web-capture
npm install
npm run dev
# → http://localhost:5173/spatial-recon-game/
```

## Deployment

Web capture app auto-deploys to GitHub Pages on every push to `main` that touches `apps/web-capture/`.

```
Settings → Pages → Source → GitHub Actions
```

---

## Principles
- 100% online-first — no local installs required to view or run
- Open source libraries only throughout
- Each level deploys independently
- AR anchoring with real-world coordinates is the end goal
- Progressive complexity: Browser → Edge → GPU → AI

## Repo
https://github.com/DigiArch424/spatial-recon-game
