const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'rmc-eventos-preview-v3.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Replace base64 data URIs with placeholder image paths to make HTML easy to inspect
let imgIndex = 0;
const cleanedHtml = html.replace(/data:image\/[^;]+;base64,[^"'\)]+/g, (match) => {
  imgIndex++;
  return `/images/extracted/img_${imgIndex}`;
});

// Write cleaned HTML to scratch file for inspection
fs.writeFileSync(path.join(__dirname, 'preview-cleaned.html'), cleanedHtml);

console.log(`Cleaned HTML saved. Length reduced from ${html.length} to ${cleanedHtml.length}`);

// Print header/nav section code
const headerMatch = cleanedHtml.match(/<header[\s\S]*?<\/header>/i) || cleanedHtml.match(/<nav[\s\S]*?<\/nav>/i);
if (headerMatch) {
  console.log('\n=== HEADER / NAV CODE ===\n', headerMatch[0].substring(0, 1500));
}

// Print styles/CSS in head
const styleMatches = cleanedHtml.match(/<style[\s\S]*?<\/style>/gi);
if (styleMatches) {
  console.log(`\n=== STYLES FOUND: ${styleMatches.length} style blocks ===`);
  styleMatches.forEach((s, idx) => {
    console.log(`--- Style Block ${idx+1} (first 500 chars) ---`);
    console.log(s.substring(0, 500));
  });
}
