import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['favicon.svg', 'icons/*.svg'],
          manifest: false,
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg}'],
            runtimeCaching: [
              {
                urlPattern: /\/functions\/v1\//,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                  networkTimeoutSeconds: 5,
                },
              },
              {
                urlPattern: /\/rest\/v1\//,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-cache',
                  expiration: { maxEntries: 30, maxAgeSeconds: 300 },
                },
              },
              {
                urlPattern: /^https:\/\/cdn\./,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'cdn-cache',
                  expiration: { maxEntries: 30, maxAgeSeconds: 86400 * 7 },
                },
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'image-cache',
                  expiration: { maxEntries: 50, maxAgeSeconds: 86400 * 30 },
                },
              },
            ],
          },
        }),
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            filesToDeleteAfterUpload: ['./dist/**/*.map'],
          },
          disable: !process.env.SENTRY_AUTH_TOKEN,
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        sourcemap: 'hidden',
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
