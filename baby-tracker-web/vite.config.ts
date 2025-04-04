import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Exclude storybook stories
      exclude: /\.stories\.(t|j)sx?$/,
      // Only .tsx files
      include: "**/*.tsx",
    }),
  ],
  server: {
    // Enable HMR
    hmr: true,
    // Watch for changes in these directories
    watch: {
      usePolling: true,
      interval: 100,
    },
    // Auto-open browser
    open: true,
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
