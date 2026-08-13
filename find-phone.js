const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html') || file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.env') || file.includes('.env')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/\+?591\s*[\d\s-]{7,12}/g);
      if (matches) {
        console.log(`File: ${fullPath}`);
        matches.forEach(m => console.log(`  Match: ${m}`));
      }
    }
  }
}

console.log('Searching for +591 phone numbers in workspace...');
searchFiles('d:\\Documentos\\ProjectDJango\\rmc-eventos');
