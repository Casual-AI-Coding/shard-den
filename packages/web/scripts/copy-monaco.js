const path = require('path');
const fs = require('fs');

/**
 * Copy Monaco Editor files to public directory
 * Run this script after npm install
 */

const sourceDir = path.join(__dirname, '..', 'node_modules', 'monaco-editor', 'min');
const targetDir = path.join(__dirname, '..', 'public', 'monaco-editor');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory does not exist: ${src}`);
    console.log('Make sure to run: npm install monaco-editor');
    process.exit(1);
  }

  // Create target directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
    console.log(`Created directory: ${dest}`);
  }

  // Copy files
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  console.log(`Copied: ${src} -> ${dest}`);
}

console.log('Copying Monaco Editor files to public directory...');
copyRecursive(sourceDir, targetDir);
console.log('Done!');
