import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

function showImagesPlugin() {
  const virtualModuleId = 'virtual:show-images';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'show-images-plugin',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const showsDir = path.resolve(__dirname, 'public/shows');
        let files: string[] = [];
        if (fs.existsSync(showsDir)) {
          files = fs.readdirSync(showsDir).filter(f => 
            /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f)
          );
        }
        return `export const SHOW_FILES = ${JSON.stringify(files)};`;
      }
    },
    configureServer(server: any) {
      const showsDir = path.resolve(__dirname, 'public/shows');
      server.watcher.add(showsDir);
      server.watcher.on('all', (_event: string, filePath: string) => {
        if (filePath.replace(/\\/g, '/').includes('public/shows')) {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
          server.ws.send({ type: 'full-reload' });
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), showImagesPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-motion': ['motion/react'],
            'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/database'],
            'vendor-icons': ['lucide-react'],
          }
        }
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
