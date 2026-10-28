const fs = require('fs');
const path = require('path');

const citasPath = path.join(__dirname, '..', 'citas.html');
let content = fs.readFileSync(citasPath, 'utf8');

// 1. Ensure payment-modal.js is included in scripts
if (!content.includes('payment-modal.js')) {
  content = content.replace(
    '<script src="./js/appointment-modal.js"></script>',
    '<script src="./js/appointment-modal.js"></script>\r\n    <script src="./js/payment-modal.js"></script>'
  );
}

// 2. Add payment buttons in botonesAccion
const cancelNeedle = 'title="Cancelar cita">\r\n                                <i class="bi bi-x-lg"></i>\r\n                            </button>\r\n                        `;\r\n                    }';
const altCancelNeedle = 'title="Cancelar cita">\n                                <i class="bi bi-x-lg"></i>\n                            </button>\n                        `;\n                    }';

const paymentButtonsCode = `

                    if (cita.estado !== 'cancelada') {
                        const saldoPend = typeof cita.saldoPendiente === 'number'
                            ? cita.saldoPendiente
                            : Math.max(0, cita.total - (cita.montoPagado || 0));

                        if (saldoPend > 0.05) {
                            botonesAccion += \`
                                <button type="button" class="btn-action-icon" style="color:var(--spa-dorado-oscuro, #8a7042);" data-action="pay" data-id="\${cita.id}" title="Cobrar Cita (Saldo pendiente: \${SpaStore.formatMoney(saldoPend)})">
                                    <i class="bi bi-cash-stack"></i>
                                </button>
                            \`;
                        } else {
                            botonesAccion += \`
                                <button type="button" class="btn-action-icon text-success" data-action="receipt" data-id="\${cita.id}" title="Ver Comprobante de Pago">
                                    <i class="bi bi-receipt"></i>
                                </button>
                            \`;
                        }
                    }`;

if (content.includes(cancelNeedle)) {
  content = content.replace(cancelNeedle, cancelNeedle + paymentButtonsCode);
} else if (content.includes(altCancelNeedle)) {
  content = content.replace(altCancelNeedle, altCancelNeedle + paymentButtonsCode);
} else {
  console.log('Cancel needle not found directly, using indexOf');
  const idx = content.indexOf('title="Cancelar cita"');
  if (idx !== -1) {
    const closeBraceIdx = content.indexOf('}', idx);
    content = content.slice(0, closeBraceIdx + 1) + paymentButtonsCode + content.slice(closeBraceIdx + 1);
  }
}

// 3. Add payment badge in total column
const totalColNeedle = '<small class="text-muted d-block" style="font-size:10px;">${(cita.metodoPago || \'Pendiente\').toUpperCase()}</small>';
const paymentBadgeCode = `
                                <div class="mt-1">
                                    \${(() => {
                                        const saldoPend = typeof cita.saldoPendiente === 'number'
                                            ? cita.saldoPendiente
                                            : Math.max(0, cita.total - (cita.montoPagado || 0));
                                        if (saldoPend <= 0.05) {
                                            return '<span class="badge" style="background:#eef8ef; color:#2e7d32; font-size:10px; padding:2px 6px;"><i class="bi bi-check-circle me-1"></i>Pagado</span>';
                                        } else if (cita.montoPagado && cita.montoPagado > 0) {
                                            return '<span class="badge" style="background:#fff8e6; color:#856404; font-size:10px; padding:2px 6px;"><i class="bi bi-clock-history me-1"></i>Abono ' + SpaStore.formatMoney(cita.montoPagado) + '</span>';
                                        } else {
                                            return '<span class="badge" style="background:#fef2f2; color:#c62828; font-size:10px; padding:2px 6px;"><i class="bi bi-exclamation-circle me-1"></i>Por cobrar</span>';
                                        }
                                    })()}
                                </div>`;

if (content.includes(totalColNeedle)) {
  content = content.replace(totalColNeedle, totalColNeedle + paymentBadgeCode);
}

// 4. Handle click delegation
const cancelActionNeedle = "AppointmentModal.openCancel(citaId, btn);";
const paymentActionsDelegation = `
                    } else if (action === 'pay') {
                        PaymentModal.openNuevoPagoModal({ citaId: citaId, onSaved: renderView });
                    } else if (action === 'receipt') {
                        const pagos = SpaStore.getPagos({ busqueda: citaId });
                        if (pagos.length) {
                            PaymentModal.openComprobanteModal(pagos[0].id);
                        } else {
                            PaymentModal.openNuevoPagoModal({ citaId: citaId, onSaved: renderView });
                        }`;

if (content.includes(cancelActionNeedle) && !content.includes("action === 'pay'")) {
  content = content.replace(cancelActionNeedle, cancelActionNeedle + paymentActionsDelegation);
}

fs.writeFileSync(citasPath, content, 'utf8');
console.log('Successfully applied payment integration to citas.html!');
