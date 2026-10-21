const fs = require('fs');
const path = require('path');

const citasPath = path.join(__dirname, '..', 'citas.html');
let content = fs.readFileSync(citasPath, 'utf8');

// 1. Ensure payment-modal.js is included in scripts
if (!content.includes('payment-modal.js')) {
  content = content.replace(
    '<script src="./js/appointment-modal.js"></script>',
    '<script src="./js/appointment-modal.js"></script>\n    <script src="./js/payment-modal.js"></script>'
  );
}

// 2. Add payment buttons in botonesAccion
const searchAcciones = `                    if (cita.estado !== 'cancelada' && cita.estado !== 'completada') {
                        botonesAccion += \`
                            <button type="button" class="btn-action-icon btn-act-danger" data-action="cancel" data-id="\${cita.id}" title="Cancelar cita">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        \`;
                    }`;

const replaceAcciones = `                    if (cita.estado !== 'cancelada' && cita.estado !== 'completada') {
                        botonesAccion += \`
                            <button type="button" class="btn-action-icon btn-act-danger" data-action="cancel" data-id="\${cita.id}" title="Cancelar cita">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        \`;
                    }

                    if (cita.estado !== 'cancelada') {
                        const saldoPend = typeof cita.saldoPendiente === 'number'
                            ? cita.saldoPendiente
                            : Math.max(0, cita.total - (cita.montoPagado || 0));

                        if (saldoPend > 0.05) {
                            botonesAccion += \`
                                <button type="button" class="btn-action-icon" style="color:var(--spa-dorado-oscuro, #8a7042);" data-action="pay" data-id="\${cita.id}" title="Cobrar Cita (Saldo: \${SpaStore.formatMoney(saldoPend)})">
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

content = content.replace(searchAcciones, replaceAcciones);

// 3. Add payment badge in total column
const searchTotalCol = `                            <td>
                                <b class="text-dark">\${SpaStore.formatMoney(cita.total || cita.precio)}</b>
                                <small class="text-muted d-block" style="font-size:10px;">\${(cita.metodoPago || 'Pendiente').toUpperCase()}</small>
                            </td>`;

const replaceTotalCol = `                            <td>
                                <b class="text-dark">\${SpaStore.formatMoney(cita.total || cita.precio)}</b>
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
                                </div>
                            </td>`;

content = content.replace(searchTotalCol, replaceTotalCol);

// 4. Handle 'pay' and 'receipt' in citasTableBody click delegation
const searchClickDelegation = `                    } else if (action === 'cancel') {
                        AppointmentModal.openCancel(citaId, btn);
                    }`;

const replaceClickDelegation = `                    } else if (action === 'cancel') {
                        AppointmentModal.openCancel(citaId, btn);
                    } else if (action === 'pay') {
                        PaymentModal.openNuevoPagoModal({ citaId: citaId, onSaved: renderView });
                    } else if (action === 'receipt') {
                        const pagos = SpaStore.getPagos({ busqueda: citaId });
                        if (pagos.length) {
                            PaymentModal.openComprobanteModal(pagos[0].id);
                        } else {
                            PaymentModal.openNuevoPagoModal({ citaId: citaId, onSaved: renderView });
                        }
                    }`;

content = content.replace(searchClickDelegation, replaceClickDelegation);

fs.writeFileSync(citasPath, content, 'utf8');
console.log('Successfully patched citas.html with direct payments!');
