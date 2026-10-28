const fs = require('fs');
const s = fs.readFileSync('citas.html', 'utf8');

const targetIdx = s.indexOf('botonesAccion += `');
console.log('Index of botonesAccion:', targetIdx);
const slice = s.slice(targetIdx, targetIdx + 600);
console.log(slice);
