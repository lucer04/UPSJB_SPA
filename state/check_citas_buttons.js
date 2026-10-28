const fs = require('fs');
const s = fs.readFileSync('citas.html', 'utf8');
console.log('Includes data-action="pay":', s.includes('data-action="pay"'));
console.log('Includes data-action="receipt":', s.includes('data-action="receipt"'));
