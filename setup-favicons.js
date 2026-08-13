const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'landing', 'public');
const extractedDir = path.join(publicDir, 'images', 'extracted');

// Copy extracted favicon images to public/ with proper extensions
if (fs.existsSync(path.join(extractedDir, 'img_1.png'))) {
  fs.copyFileSync(path.join(extractedDir, 'img_1.png'), path.join(publicDir, 'favicon-16x16.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_2.png'), path.join(publicDir, 'favicon-32x32.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_3.png'), path.join(publicDir, 'favicon-192x192.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_4.png'), path.join(publicDir, 'favicon-512x512.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_5.png'), path.join(publicDir, 'apple-touch-icon.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_2.png'), path.join(publicDir, 'favicon.png'));
  fs.copyFileSync(path.join(extractedDir, 'img_7.png'), path.join(publicDir, 'logo-icon.png'));
  console.log('Favicon files copied successfully to landing/public/');
} else {
  console.log('Extracted dir files check failed.');
}
