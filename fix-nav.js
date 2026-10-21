// Corrige los enlaces del menú lateral en todos los .html de la carpeta.
// Uso (desde la carpeta del proyecto):  node fix-nav.js
const fs = require('fs');
const path = require('path');

const LINKS = {
  'Dashboard': 'dashboard.html',
  'Reportes': 'reportes.html',
  'Citas': 'citas.html',
  'Clientes': 'clientes.html',
  'Servicios': 'servicios.html',
  'Inventario': 'inventario.html',
  'Pagos y caja': 'pagosycaja.html',
  'Comisiones': 'comisiones.html',
  'Roles': 'roles.html',
  'Usuarios': 'usuarios.html',
  'Categorías': 'categorias.html',
};

const labels = Object.keys(LINKS).join('|');
const re = new RegExp(
  '(<a\\s+class="nv[^"]*"[^>]*?)href="[^"]*"([^>]*>\\s*<i class="bi [^"]*"></i>\\s*)(' + labels + ')(\\s*</a>)',
  'g'
);

const dir = process.argv[2] || '.';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));

for (const file of files) {
  const full = path.join(dir, file);
  const original = fs.readFileSync(full, 'utf8');
  let changed = 0;
  const updated = original.replace(re, (m, a, b, label, end) => {
    changed++;
    return `${a}href="${LINKS[label]}"${b}${label}${end}`;
  });
  if (updated !== original) {
    fs.writeFileSync(full, updated, 'utf8');
    console.log(`✔ ${file}: ${changed} enlaces del menú`);
  } else {
    console.log(`- ${file}: sin cambios`);
  }
}