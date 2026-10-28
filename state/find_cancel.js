const fs = require('fs');
const s = fs.readFileSync('citas.html', 'utf8');

const targetIdx = s.indexOf('title="Cancelar cita"');
console.log(s.slice(targetIdx - 100, targetIdx + 200));
