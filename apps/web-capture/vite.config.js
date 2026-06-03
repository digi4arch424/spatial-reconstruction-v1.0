import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/spatial-recon-game/',
  server: {
    port: 5173,
    https: false
  },
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/loaders/OBJLoader.js',
      'three/examples/jsm/controls/OrbitControls.js'
    ]
  }
})
