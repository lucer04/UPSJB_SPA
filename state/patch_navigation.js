const fs = require('fs');
const path = require('path');

const files = ['dashboard.html', 'reportes.html', 'citas.html', 'clientes.html', 'servicios.html', 'inventario.html'];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace Pagos y caja
  const regexPagos = /<a class="nv([^"]*)" href="#"([^>]*)>\s*<i class="bi bi-cash-stack"><\/i>\s*Pagos y caja\s*<\/a>/g;
  if (regexPagos.test(content)) {
    content = content.replace(regexPagos, '<a class="nv$1" href="pagos.html"$2><i class="bi bi-cash-stack"></i>Pagos y caja</a>');
    modified = true;
  }

  // Replace Comisiones
  const regexComisiones = /<a class="nv([^"]*)" href="#"([^>]*)>\s*<i class="bi bi-percent"><\/i>\s*Comisiones\s*<\/a>/g;
  if (regexComisiones.test(content)) {
    content = content.replace(regexComisiones, '<a class="nv$1" href="comisiones.html"$2><i class="bi bi-percent"></i>Comisiones</a>');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated navigation in ${file}`);
  } else {
    console.log(`No changes needed in ${file}`);
  }
});
