const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'landing', 'public', 'images', 'extracted', 'img_6.jpeg');
const destDir = path.join(__dirname, 'admin', 'public', 'images', 'extracted');
const destPath = path.join(destDir, 'img_6.jpeg');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(srcPath)) {
  fs.copyFileSync(srcPath, destPath);
  console.log('Hero fallback image copied to admin/public/images/extracted/img_6.jpeg');
}
