/**
 * Main application entry point
 * 
 * This file imports and initializes:
 * - React DOM for rendering
 * - Error boundary for error handling
 * - CSS styles (main.css, theme.css, index.css)
 * 
 * All imports use relative paths (./filename) or npm package names.
 * During build, Vite processes these imports and bundles them into dist/assets/
 * with cache-busting hashes. No /src/ paths exist in the production build.
 */

import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
