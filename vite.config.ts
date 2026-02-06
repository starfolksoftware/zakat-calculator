import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

/**
 * Vite configuration for production builds and development
 * 
 * Key configuration:
 * - base: '/zakat-calculator/' - Required for GitHub Pages deployment
 *   This ensures all asset URLs are prefixed with the repository name
 * 
 * - plugins: React, Tailwind CSS v4, Spark, and icon proxy
 * 
 * - resolve.alias: '@' maps to 'src' for cleaner imports
 * 
 * During build:
 * - Vite processes index.html and resolves /src/main.tsx
 * - All JS/TS/CSS is bundled into dist/assets/ with cache-busting hashes
 * - Asset references in HTML are rewritten with the base path
 * - Files from public/ are copied to dist/ as-is (.nojekyll, CNAME)
 * 
 * https://vite.dev/config/
 */
export default defineConfig({
  base: '/zakat-calculator/',
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
});