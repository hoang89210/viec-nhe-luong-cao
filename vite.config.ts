import fs from 'node:fs';
import path from 'node:path';
import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The game loads images/audio at runtime via relative paths like
 * "assets/images/x.png". In dev, Vite serves them straight from the project
 * root; for production we copy the ./assets folder next to index.html in dist.
 */
function copyRuntimeAssets(): Plugin {
  let outDir = 'dist';
  let root = '.';
  return {
    name: 'copy-runtime-assets',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const src = path.resolve(root, 'assets');
      if (fs.existsSync(src)) {
        fs.cpSync(src, path.join(outDir, 'assets'), {recursive: true});
      }
      // Windows one-click launcher (starts python http.server + opens browser)
      const bat = path.resolve(root, 'CHAY_GAME.bat');
      if (fs.existsSync(bat)) fs.copyFileSync(bat, path.join(outDir, 'CHAY_GAME.bat'));
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react(), copyRuntimeAssets()],
  build: {
    outDir: 'dist',
    // keep Vite's own JS/CSS separate from the game's runtime assets folder
    assetsDir: 'bundle',
    chunkSizeWarningLimit: 2000,
  },
  server: {host: true, port: 5173},
});
