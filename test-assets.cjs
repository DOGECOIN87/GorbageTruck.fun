// Test script to verify all asset paths exist
const fs = require('fs');
const path = require('path');

const assetPaths = [
  './public/game-assets/gorbage-truck-2.png',
  './public/assets/trashbag.jpg',
  './public/assets/binlogo.png',
  './public/assets/intro_bg_new.png',
  './public/assets/ufo.png',
  './public/game-assets/gorbhouse-cry.png',
  './public/game-assets/Logo-gor-incinerator.jpg',
  './public/game-assets/Gorboyconsole.png',
  './public/assets/gorbillions.png',
  './public/game-assets/4.webp',
  './public/game-assets/stickerpill.webp',
  './public/game-assets/sticker3.webp',
  './public/assets/trashbag.png',
  './public/game-assets/trashcoinlogo.png',
  './public/assets/trashcoin.png',
  './public/assets/gorbagana.jpg',
  './public/game-assets/gorbagwallet-removebg-preview.png',
  './public/assets/wallet.png',
  './public/assets/incinerator.jpg',
  './public/assets/gorboyconsole.png'
];

console.log('=== ASSET PATH VERIFICATION ===\n');

let missingCount = 0;
let foundCount = 0;

assetPaths.forEach(assetPath => {
  const fullPath = path.join(__dirname, assetPath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    console.log(`✅ ${assetPath} (${(stats.size / 1024).toFixed(2)} KB)`);
    foundCount++;
  } else {
    console.log(`❌ MISSING: ${assetPath}`);
    missingCount++;
  }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Found: ${foundCount}`);
console.log(`Missing: ${missingCount}`);
console.log(`Total: ${assetPaths.length}`);
