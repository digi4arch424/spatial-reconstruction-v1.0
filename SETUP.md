# Initial Commit — Setup Guide
# DigiArch424/spatial-recon-game

## Step 1 — Create the repo on GitHub
Go to: https://github.com/new
  Name:        spatial-recon-game
  Visibility:  Public
  README:      NO (we have our own)
  .gitignore:  NO (we have our own)
  License:     NO (we have our own)
Click: Create repository

## Step 2 — Enable GitHub Pages (do this before first push)
  Settings → Pages → Source → GitHub Actions

## Step 3 — Clone and place all files

git clone https://github.com/DigiArch424/spatial-recon-game.git
cd spatial-recon-game

Place the 10 files into the structure below:

  spatial-recon-game/
  ├── .gitignore
  ├── LICENSE
  ├── README.md
  ├── SETUP.md
  ├── .github/
  │   └── workflows/
  │       └── deploy-l01.yml
  └── apps/
      └── web-capture/
          ├── package.json
          ├── vite.config.js
          ├── index.html
          └── src/
              ├── main.jsx
              ├── index.css
              └── App.jsx

## Step 4 — Initial commit

git add .

git commit -m "feat(l01): Level 01 Camera Spawn — WebRTC single-frame capture

SYSTEM
- Static Vite + React 18 app under apps/web-capture
- WebRTC getUserMedia with environment camera preference
- Single-frame JPEG capture via canvas, inline download

UI / DESIGN
- DigiArch424 brand palette: electric green #39e83e + blue #00aaff
- Deep navy base #040d1a — Design — Build — Iterate
- Dual-tone circuit grid: green left / blue right
- Tactical HUD: corner brackets, crosshair, scan-line animation
- Status machine: IDLE → ACQUIRING → LOCKED → CAPTURED → ERROR
- Right panel: live status dots, stat badges, level progress bar (1/20)
- UTC clock, bottom tagline bar

DEPLOY
- GitHub Actions: auto-deploy to GitHub Pages on push to main
- Vite base path: /spatial-recon-game/
- Live: https://digiarch424.github.io/spatial-recon-game/

FILES
  .gitignore
  LICENSE (MIT)
  README.md
  SETUP.md
  .github/workflows/deploy-l01.yml
  apps/web-capture/package.json
  apps/web-capture/vite.config.js
  apps/web-capture/index.html
  apps/web-capture/src/main.jsx
  apps/web-capture/src/index.css
  apps/web-capture/src/App.jsx"

git push origin main

## Step 5 — Verify
GitHub Actions tab → Deploy Level 01 → green in ~60s
Live: https://digiarch424.github.io/spatial-recon-game/
