#!/usr/bin/env node

/**
 * Smoke test for the dist/ folder to ensure build output is correct
 * This script verifies that:
 * 1. Required files exist in dist/
 * 2. index.html references correct asset paths (not /src/)
 * 3. CSS and JS bundles exist
 * 4. .nojekyll and CNAME are present
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

let errors = 0;

function error(message) {
  console.error('❌', message);
  errors++;
}

function success(message) {
  console.log('✅', message);
}

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
  error('dist/ folder does not exist. Run `npm run build` first.');
  process.exit(1);
}

success('dist/ folder exists');

// Check required files
const requiredFiles = ['index.html', 'package.json', '.nojekyll', 'CNAME'];
for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    success(`${file} exists`);
  } else {
    error(`${file} is missing`);
  }
}

// Check assets folder
const assetsPath = path.join(distPath, 'assets');
if (fs.existsSync(assetsPath)) {
  success('assets/ folder exists');
  
  // Check for CSS and JS files
  const assets = fs.readdirSync(assetsPath);
  const hasCSS = assets.some(f => f.endsWith('.css'));
  const hasJS = assets.some(f => f.endsWith('.js'));
  
  if (hasCSS) {
    success('CSS bundle exists');
  } else {
    error('CSS bundle is missing');
  }
  
  if (hasJS) {
    success('JS bundle exists');
  } else {
    error('JS bundle is missing');
  }
} else {
  error('assets/ folder is missing');
}

// Check index.html content
const indexPath = path.join(distPath, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Check for problematic /src/ references
  if (indexContent.includes('src="./src/') || indexContent.includes('href="./src/')) {
    error('index.html contains unprocessed ./src/ references');
  } else {
    success('index.html has no unprocessed ./src/ references');
  }
  
  if (indexContent.includes('src="/src/') || indexContent.includes('href="/src/')) {
    error('index.html contains unprocessed /src/ references');
  } else {
    success('index.html has no unprocessed /src/ references');
  }
  
  // Check for base path
  if (indexContent.includes('/zakat-calculator/assets/')) {
    success('index.html references assets with correct base path');
  } else {
    error('index.html does not reference assets with base path /zakat-calculator/');
  }
  
  // Check for script and link tags
  if (indexContent.includes('<script type="module"') && indexContent.includes('src=')) {
    success('index.html contains script tag with src');
  } else {
    error('index.html is missing module script tag');
  }
  
  if (indexContent.includes('<link rel="stylesheet"') && indexContent.includes('href=')) {
    success('index.html contains stylesheet link');
  } else {
    error('index.html is missing stylesheet link');
  }
}

console.log('\n---');
if (errors === 0) {
  console.log('✅ All checks passed!');
  process.exit(0);
} else {
  console.log(`❌ ${errors} check(s) failed!`);
  process.exit(1);
}
