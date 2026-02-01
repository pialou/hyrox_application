import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  }
  params: {
    maxParamLength: 100
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].${Date.now()}.js`,
        chunkFileNames: `assets/[name].[hash].${Date.now()}.js`,
        assetFileNames: `assets/[name].[hash].${Date.now()}.[ext]`
      }
    }
  }
})
