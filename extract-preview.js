const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'rmc-eventos-preview-v3.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Create output directory for images
const imgDir = path.join(__dirname, 'landing', 'public', 'images', 'extracted');
fs.mkdirSync(imgDir, { recursive: true });

// Extract all base64 images
const base64Regex = /(?:src|href|url\()?["']?data:image\/(png|jpeg|jpg|webp|svg\+xml|gif);base64,([^"'\)]+)["']?\)?/gi;
let match;
let imgCount = 0;
const images = [];

while ((match = base64Regex.exec(html)) !== null) {
  imgCount++;
  const ext = match[1].replace('+xml', '');
  const data = match[2];
  const filename = `img_${imgCount}.${ext}`;
  const filepath = path.join(imgDir, filename);
  
  // Save the image
  fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
  const stats = fs.statSync(filepath);
  images.push({ index: imgCount, filename, ext, sizeKB: Math.round(stats.size / 1024) });
}

console.log(`\n=== EXTRACTED ${imgCount} IMAGES ===`);
images.forEach(img => {
  console.log(`  ${img.filename} (${img.sizeKB} KB)`);
});

// Extract text structure / headings
console.log('\n=== HEADINGS FOUND IN HTML ===');
const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
while ((match = headingRegex.exec(html)) !== null) {
  const text = match[2].replace(/<[^>]+>/g, '').trim();
  if (text && text.length < 200) {
    console.log(`h${match[1]}: ${text}`);
  }
}

// Find IDs / Section names
console.log('\n=== SECTIONS & IDS ===');
const idRegex = /id=["']([^"']+)["']/gi;
const ids = new Set();
while ((match = idRegex.exec(html)) !== null) {
  ids.add(match[1]);
}
console.log('IDs:', Array.from(ids).join(', '));
