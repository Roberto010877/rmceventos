const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const landingImagesDir = path.join(__dirname, 'landing', 'public', 'images');
const adminImagesDir = path.join(__dirname, 'admin', 'public', 'images');

copyDirRecursive(landingImagesDir, adminImagesDir);
console.log('Successfully synced all public images from landing to admin!');
