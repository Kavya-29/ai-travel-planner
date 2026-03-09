const fs = require('fs');

// A very rough data representation of continents in a grid (y, x_start, x_end)
// 0-50 for x, 0-25 for y (scaled to 2000x1000)
const worldData = [
    [2, 5, 12], [3, 4, 15], [4, 3, 16], [5, 3, 16], [6, 4, 15], [7, 6, 14], // N America
    [10, 8, 13], [11, 9, 14], [12, 10, 15], [13, 11, 16], [14, 12, 15], [15, 12, 14], [16, 12, 13], // S America
    [3, 22, 28], [4, 21, 29], [5, 20, 30], [6, 21, 29], // Europe
    [7, 21, 32], [8, 22, 33], [9, 23, 34], [10, 24, 35], // Africa
    [3, 30, 45], [4, 29, 46], [5, 29, 47], [6, 30, 48], [7, 31, 48], [8, 32, 47], [9, 33, 45], // Asia
    [12, 40, 46], [13, 41, 47], [14, 42, 46] // Australia
];

let dots = '';
const dotGap = 35;
const dotSize = 6;

for (let y = 0; y < 1000; y += dotGap) {
    for (let x = 0; x < 2000; x += dotGap) {
        // Simple hit test against our rough "continents"
        const gridX = x / dotGap;
        const gridY = y / dotGap;

        let isLand = false;
        // North America
        if (gridY >= 2 && gridY <= 6 && gridX >= 5 && gridX <= 15) isLand = true;
        // South America
        if (gridY >= 9 && gridY <= 16 && gridX >= 10 && gridX <= 14 + (gridY - 12)) isLand = true;
        // Europe/Asia
        if (gridY >= 2 && gridY <= 8 && gridX >= 22 && gridX <= 48) isLand = true;
        // Africa
        if (gridY >= 9 && gridY <= 16 && gridX >= 22 && gridX <= 30 - (gridY - 12)) isLand = true;
        // Australia
        if (gridY >= 14 && gridY <= 18 && gridX >= 40 && gridX <= 46) isLand = true;

        if (isLand) {
            dots += `<circle cx="${x}" cy="${y}" r="${dotSize}" />\n`;
        }
    }
}

const svg = `
<svg width="2000" height="1000" viewBox="0 0 2000 1000" xmlns="http://www.w3.org/2000/svg">
  <rect width="2000" height="1000" fill="transparent"/>
  <g fill="#3b82f6" opacity="0.6">
    ${dots}
  </g>
  <g stroke="#ffffff" stroke-width="1" opacity="0.05">
    <line x1="0" y1="250" x2="2000" y2="250" />
    <line x1="0" y1="500" x2="2000" y2="500" />
    <line x1="0" y1="750" x2="2000" y2="750" />
  </g>
</svg>
`;

fs.writeFileSync('c:/Users/VICTUS/Desktop/FINAL YR PROJECT[1]/client/public/world-map.svg', svg);
console.log('Premium Dotted Map Generated!');
