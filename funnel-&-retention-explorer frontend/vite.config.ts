import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
                  return 'vendor-react';
                }
                if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
                  return 'vendor-charts';
                }
                if (id.includes('@supabase')) {
                  return 'vendor-supabase';
                }
                if (id.includes('papaparse')) {
                  return 'vendor-data';
                }
                if (id.includes('@sentry') || id.includes('@vercel')) {
                  return 'vendor-monitoring';
                }
              }
            }
          }
        }
      }
    };
});
