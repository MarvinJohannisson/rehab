import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function getBuildMeta() {
  let shortSha = 'dev';
  try {
    shortSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    // Fallback if git is unavailable
  }
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 12); // YYYYMMDDHHMM
  const label = now.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return {
    version: `${shortSha}-${stamp}`,
    label: `${label} (${shortSha})`,
  };
}

const buildMeta = getBuildMeta();

function stampServiceWorkerPlugin(version: string): Plugin {
  return {
    name: 'stamp-service-worker',
    closeBundle() {
      const swPath = path.resolve(process.cwd(), 'dist/sw.js');
      if (fs.existsSync(swPath)) {
        const raw = fs.readFileSync(swPath, 'utf8');
        fs.writeFileSync(swPath, raw.replaceAll('__BUILD_ID__', version), 'utf8');
      }
    },
  };
}

// Use relative base path so the app deploys cleanly to GitHub Pages (/rehab/) or root domains
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(buildMeta.version),
    __APP_BUILD_LABEL__: JSON.stringify(buildMeta.label),
  },
  plugins: [react(), stampServiceWorkerPlugin(buildMeta.version)],
});
