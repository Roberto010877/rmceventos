const fs = require('fs');
const path = require('path');

const extractedDir = path.join(__dirname, 'landing', 'public', 'images', 'extracted');
const adminPublicDir = path.join(__dirname, 'admin', 'public');

if (!fs.existsSync(adminPublicDir)) {
  fs.mkdirSync(adminPublicDir, { recursive: true });
}

if (fs.existsSync(path.join(extractedDir, 'img_1.png'))) {
  fs.copyFileSync(path.join(extractedDir, 'img_1.png'), path.join(adminPublicDir, 'favicon-16x16.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_2.png'), path.join(adminPublicDir, 'favicon-32x32.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_3.png'), path.join(adminPublicDir, 'favicon-192x192.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_4.png'), path.join(adminPublicDir, 'favicon-512x512.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_5.png'), path.join(adminPublicDir, 'apple-touch-icon.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_2.png'), path.join(adminPublicDir, 'favicon.png'));
  console.log('Favicon files copied to admin/public/');
}
