import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'CBT Software',
        short_name: 'CBT',
        description: 'Computer Based Test Software',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiPgogICAgPHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMTIgM0wxIDlsMTEgNiAxMS02LTExLTZ6bTAgMTAuOTNMNC45MyA5IDEyIDUuMDcgMTkuMDcgOSAxMiAxMy45M3pNNCAxNS4yNVYxOGgxNnYtMi43NWwtOC00LjUtOC00LjV6Ii8+Cjwvc3ZnPg==',
            sizes: '24x24',
            type: 'image/svg+xml'
          }
        ]
      }
    }),
    visualizer({
      open: false,
      filename: 'bundle-report.html',
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
