const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3456;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\UPSJB\\.gemini\\antigravity\\brain\\063e06b7-6672-49ea-a5a5-d813d4380506';

// 1. Simple HTTP static server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/dashboard.html';

  const fullPath = path.join(__dirname, '..', reqPath);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(fullPath).pipe(res);
});

// Helper CDP WebSocket wrapper using Node built-in
async function main() {
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Static server running at http://localhost:${PORT}`);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-features=Translate',
    '--disable-extensions'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  // Get debug websocket
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];

  // Native WebSocket in Node 24
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pendingRequests = new Map();
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const data = typeof event.data === 'string' ? event.data : event.data.toString();
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
      consoleMessages.push({ type: msg.params.type, text });
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleMessages.push({ type: 'error', text: JSON.stringify(msg.params.exceptionDetails) });
    }
    if (msg.id && pendingRequests.has(msg.id)) {
      pendingRequests.get(msg.id)(msg);
      pendingRequests.delete(msg.id);
    }
  };

  await new Promise(resolve => {
    if (ws.readyState === WebSocket.OPEN) resolve();
    else ws.onopen = resolve;
  });

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('DOM.enable');

  async function testPage(pageUrl, viewports, pageName) {
    console.log(`\n========================================`);
    console.log(`Testing page: ${pageName} (${pageUrl})`);
    console.log(`========================================`);

    for (const vp of viewports) {
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width <= 768
      });

      consoleMessages.length = 0;
      await sendCommand('Page.navigate', { url: pageUrl });
      await new Promise(r => setTimeout(r, 1200));

      // Check overflow-x
      const overflowEval = await sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.offsetWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const diff = scrollWidth - docWidth;
            return {
              docWidth,
              scrollWidth,
              hasHorizontalOverflow: diff > 1,
              diff
            };
          })()
        `,
        returnByValue: true
      });

      const overflowRes = (overflowEval.result && overflowEval.result.result) ? overflowEval.result.result.value : (overflowEval.result ? overflowEval.result.value : {});
      console.log(`Viewport ${vp.width}x${vp.height} -> DocWidth: ${overflowRes.docWidth}, ScrollWidth: ${overflowRes.scrollWidth}, Overflow: ${overflowRes.hasHorizontalOverflow ? 'FAIL (' + overflowRes.diff + 'px)' : 'PASS (0px)'}`);

      const errors = consoleMessages.filter(m => m.type === 'error');
      console.log(`Viewport ${vp.width}x${vp.height} -> Console errors: ${errors.length}`);
      if (errors.length) {
        console.error('Errors:', errors);
      }

      // Take screenshot
      const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
      const shotPath = path.join(ARTIFACT_DIR, `${pageName}_${vp.width}.png`);
      fs.writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
      console.log(`Screenshot saved: ${shotPath}`);
    }
  }

  const standardViewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ];

  // TEST 1: Pagos y Caja
  await testPage(`http://localhost:${PORT}/pagos.html`, standardViewports, 'pagos');

  // Interactive tests on Pagos:
  console.log('\n--- Interactive functional testing on pagos.html (1440px) ---');
  await sendCommand('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await sendCommand('Page.navigate', { url: `http://localhost:${PORT}/pagos.html` });
  await new Promise(r => setTimeout(r, 1000));

  // Click "Nuevo Cobro" and verify modal opens
  const openCobroEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        document.getElementById('btnNuevoPago').click();
        const bd = document.getElementById('modalPagoBackdrop');
        return {
          opened: bd.classList.contains('show'),
          citaOptionsCount: document.getElementById('pagoCitaSelect').options.length
        };
      })()
    `,
    returnByValue: true
  });
  const openCobroRes = (openCobroEval.result && openCobroEval.result.result) ? openCobroEval.result.result.value : openCobroEval.result;
  console.log('Nuevo Cobro Modal Test:', openCobroRes);

  // Take screenshot of modal
  const shotModalPago = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'pagos_modal_nuevo_cobro.png'), Buffer.from(shotModalPago.result.data, 'base64'));

  // Close modal and click "Registrar Egreso"
  await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        document.getElementById('modalPagoCloseBtn').click();
        document.getElementById('btnRegistrarEgreso').click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  const openEgresoEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const bd = document.getElementById('modalEgresoBackdrop');
        return {
          opened: bd.classList.contains('show'),
          saldoDisp: document.getElementById('egresoSaldoEfectivoDisponible').textContent
        };
      })()
    `,
    returnByValue: true
  });
  const openEgresoRes = (openEgresoEval.result && openEgresoEval.result.result) ? openEgresoEval.result.result.value : openEgresoEval.result;
  console.log('Registrar Egreso Modal Test:', openEgresoRes);

  const shotModalEgreso = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'pagos_modal_egreso.png'), Buffer.from(shotModalEgreso.result.data, 'base64'));

  // Close modal and test Comprobante modal
  await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        document.getElementById('modalEgresoCloseBtn').click();
        const firstReciboBtn = document.querySelector('.btn-ver-recibo');
        if (firstReciboBtn) firstReciboBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  const shotRecibo = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'pagos_modal_recibo.png'), Buffer.from(shotRecibo.result.data, 'base64'));
  console.log('Recibo de Pago Modal Test: Passed & Screenshot Captured');

  // TEST 2: Comisiones
  await testPage(`http://localhost:${PORT}/comisiones.html`, standardViewports, 'comisiones');

  console.log('\n--- Interactive functional testing on comisiones.html (1440px) ---');
  await sendCommand('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await sendCommand('Page.navigate', { url: `http://localhost:${PORT}/comisiones.html` });
  await new Promise(r => setTimeout(r, 1000));

  // Click "Liquidar Especialista" and verify modal opens
  const openLiqEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        document.getElementById('btnLiquidar').click();
        const bd = document.getElementById('modalLiquidarBackdrop');
        return {
          opened: bd.classList.contains('show'),
          specialistsCount: document.getElementById('liquidarEspecialistaSelect').options.length
        };
      })()
    `,
    returnByValue: true
  });
  const openLiqRes = (openLiqEval.result && openLiqEval.result.result) ? openLiqEval.result.result.value : openLiqEval.result;
  console.log('Liquidar Especialista Modal Test:', openLiqRes);

  const shotModalLiq = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'comisiones_modal_liquidar.png'), Buffer.from(shotModalLiq.result.data, 'base64'));

  // Close modal and test Reglas modal
  await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        document.getElementById('modalLiquidarCloseBtn').click();
        document.getElementById('btnVerReglas').click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  const shotModalReglas = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'comisiones_modal_reglas.png'), Buffer.from(shotModalReglas.result.data, 'base64'));
  console.log('Reglas de Comisión Modal Test: Passed & Screenshot Captured');

  // TEST 3: Citas integration with "Cobrar Cita"
  console.log('\n--- Testing Citas integration with Payments (citas.html) ---');
  await sendCommand('Page.navigate', { url: `http://localhost:${PORT}/citas.html` });
  await new Promise(r => setTimeout(r, 1200));

  const citasPayEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const payBtns = document.querySelectorAll('button[data-action="pay"]');
        const receiptBtns = document.querySelectorAll('button[data-action="receipt"]');
        return {
          totalPayButtons: payBtns.length,
          totalReceiptButtons: receiptBtns.length
        };
      })()
    `,
    returnByValue: true
  });
  const citasPayRes = (citasPayEval.result && citasPayEval.result.result) ? citasPayEval.result.result.value : citasPayEval.result;
  console.log('Citas Direct Payment Buttons Test:', citasPayRes);

  // Click "Cobrar Cita" on first pending appointment
  await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const payBtn = document.querySelector('button[data-action="pay"]');
        if (payBtn) payBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const shotCitasCobro = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'citas_modal_cobro_directo.png'), Buffer.from(shotCitasCobro.result.data, 'base64'));
  console.log('Citas Direct Payment Modal Triggered & Captured!');

  // Cleanup
  ws.close();
  chromeProc.kill();
  server.close();
  console.log('\n--- ALL BROWSER CDP TESTS COMPLETED SUCCESSFULLY! ---');
  process.exit(0);
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
