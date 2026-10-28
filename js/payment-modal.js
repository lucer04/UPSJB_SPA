/**
 * VIVI SPA & ESTUDIO - PAYMENT & CASH MODAL CONTROLLER
 * Controlador unificado para Pagos, Egresos, Apertura/Cierre de Caja y Recibos.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./spa-store', './spa-ui'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./spa-store'), require('./spa-ui'));
  } else {
    root.PaymentModal = factory(root.SpaStore, root.SpaUI);
  }
})(typeof self !== 'undefined' ? self : this, function (SpaStore, SpaUI) {
  'use strict';

  let initialized = false;
  let onPaymentSavedCallback = null;
  let onExpenseSavedCallback = null;
  let onCashStateChangedCallback = null;

  function ensureModalMarkup() {
    if (document.getElementById('modalPagoBackdrop')) return;

    const modalHTML = `
      <!-- 1. MODAL NUEVO PAGO / COBRO -->
      <div class="spa-modal-backdrop" id="modalPagoBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-md" style="max-width: 660px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="modalPagoTitle">Registrar Pago</h2>
              <p id="modalPagoSubtitle">Ingreso de caja vinculado a cita agendada o venta directa en counter.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalPagoCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formPago" novalidate>
            <input type="hidden" id="pagoCitaId" name="citaId">

            <div class="spa-modal-body">
              <!-- Alerta de Caja Cerrada si aplica -->
              <div id="cajaCerradaAlert" class="alert alert-warning d-none mb-3" style="background:#FFF3CD; border-color:#FFEEBA; color:#856404; border-radius:8px; padding:12px 16px; font-size:0.875rem;">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <b>Atención:</b> La caja actual se encuentra cerrada. Debe abrir la caja para poder registrar pagos.
              </div>

              <!-- Selector de Origen de Pago: Cita existente vs Venta Directa -->
              <div class="row g-3 mb-3">
                <div class="col-12 col-md-6">
                  <label for="pagoTipoOrigen" class="form-label">Tipo de Ingreso <span class="text-danger">*</span></label>
                  <select class="form-select" id="pagoTipoOrigen">
                    <option value="cita">Pago vinculado a Cita</option>
                    <option value="directo">Venta directa / Mostrador</option>
                  </select>
                </div>
                <div class="col-12 col-md-6" id="pagoCitaSelectGroup">
                  <label for="pagoCitaSelect" class="form-label">Seleccionar Cita <span class="text-danger">*</span></label>
                  <select class="form-select" id="pagoCitaSelect">
                    <option value="">-- Seleccionar Cita Pendiente --</option>
                  </select>
                </div>
              </div>

              <!-- Datos de la Cita / Venta -->
              <div class="p-3 mb-3 rounded" id="pagoInfoBox" style="background: var(--spa-crema-card, #f8f7f5); border: 1px solid var(--spa-crema-borde, #e8e4df);">
                <div class="row g-2">
                  <div class="col-6 col-md-4">
                    <small class="text-muted d-block">Clienta:</small>
                    <b id="pagoInfoClienta">-</b>
                  </div>
                  <div class="col-6 col-md-4">
                    <small class="text-muted d-block">Servicio / Concepto:</small>
                    <b id="pagoInfoServicio">-</b>
                  </div>
                  <div class="col-6 col-md-4">
                    <small class="text-muted d-block">Especialista:</small>
                    <b id="pagoInfoEspecialista">-</b>
                  </div>
                  <div class="col-6 col-md-4 mt-2">
                    <small class="text-muted d-block">Total Cita:</small>
                    <b id="pagoInfoTotal" class="text-dark">S/ 0.00</b>
                  </div>
                  <div class="col-6 col-md-4 mt-2">
                    <small class="text-muted d-block">Monto Pagado Previo:</small>
                    <b id="pagoInfoPagado" class="text-muted">S/ 0.00</b>
                  </div>
                  <div class="col-12 col-md-4 mt-2">
                    <small class="text-muted d-block">Saldo Pendiente a Cobrar:</small>
                    <b id="pagoInfoSaldo" class="text-danger fs-6">S/ 0.00</b>
                  </div>
                </div>
              </div>

              <!-- Campos editables directos si no es cita -->
              <div id="pagoCamposDirectos" class="d-none">
                <div class="row g-3 mb-3">
                  <div class="col-12 col-md-6">
                    <label for="pagoClienteNombre" class="form-label">Nombre de Clienta</label>
                    <input type="text" class="form-control" id="pagoClienteNombre" placeholder="Cliente en mostrador">
                  </div>
                  <div class="col-12 col-md-6">
                    <label for="pagoServicioNombre" class="form-label">Concepto / Producto <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="pagoServicioNombre" placeholder="Ej. Crema Hidratante Gold">
                  </div>
                </div>
              </div>

              <!-- Monto y Método de Pago -->
              <div class="row g-3 mb-3">
                <div class="col-12 col-md-6">
                  <label for="pagoMonto" class="form-label">Monto a Cobrar (S/) <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <span class="input-group-text" style="background:var(--spa-crema-subtle); font-weight:600;">S/</span>
                    <input type="number" step="0.50" min="0.01" class="form-control fw-bold fs-5" id="pagoMonto" placeholder="0.00" required>
                  </div>
                  <div class="invalid-feedback" id="pagoMontoFeedback">Ingrese un monto válido mayor a 0.</div>
                </div>
                <div class="col-12 col-md-6">
                  <label for="pagoMetodo" class="form-label">Método de Pago <span class="text-danger">*</span></label>
                  <select class="form-select" id="pagoMetodo" required>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta Débito / Crédito (POS)</option>
                    <option value="transferencia">Transferencia Bancaria (BCP/BBVA/Interbank)</option>
                    <option value="yape">Yape / Plin</option>
                  </select>
                </div>
              </div>

              <!-- Calculadora de vuelto si es Efectivo -->
              <div class="p-3 mb-3 rounded" id="pagoCalculoEfectivoBox" style="background:#f4f8f4; border:1px solid #d2e4d2;">
                <div class="row g-2 align-items-center">
                  <div class="col-12 col-sm-6">
                    <label for="pagoEfectivoRecibido" class="form-label small text-muted mb-1">Efectivo Recibido:</label>
                    <div class="input-group input-group-sm">
                      <span class="input-group-text">S/</span>
                      <input type="number" step="1" min="0" class="form-control" id="pagoEfectivoRecibido" placeholder="0.00">
                    </div>
                  </div>
                  <div class="col-12 col-sm-6 text-sm-end">
                    <small class="text-muted d-block">Vuelto a Entregar:</small>
                    <b id="pagoVueltoCalculado" class="fs-5 text-success">S/ 0.00</b>
                  </div>
                </div>
              </div>

              <!-- Comprobante y Referencia -->
              <div class="row g-3 mb-3">
                <div class="col-12 col-md-4">
                  <label for="pagoTipoComprobante" class="form-label">Comprobante</label>
                  <select class="form-select" id="pagoTipoComprobante">
                    <option value="boleta">Boleta de Venta</option>
                    <option value="factura">Factura Electrónica</option>
                    <option value="ticket">Ticket de Control</option>
                  </select>
                </div>
                <div class="col-12 col-md-4">
                  <label for="pagoNumeroOperacion" class="form-label" id="pagoNumOpLabel">N° Operación / Ref.</label>
                  <input type="text" class="form-control" id="pagoNumeroOperacion" placeholder="Opcional en efectivo">
                </div>
                <div class="col-12 col-md-4">
                  <label for="pagoPropina" class="form-label">Propina Especialista (S/)</label>
                  <div class="input-group">
                    <span class="input-group-text">S/</span>
                    <input type="number" step="1" min="0" class="form-control" id="pagoPropina" placeholder="0.00">
                  </div>
                </div>
              </div>

              <!-- Notas adicionales -->
              <div class="mb-2">
                <label for="pagoNotas" class="form-label">Observaciones / Notas de Pago</label>
                <textarea class="form-control" id="pagoNotas" rows="2" placeholder="Detalles adicionales del cobro..."></textarea>
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-secondary" id="modalPagoCancelBtn">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btnGuardarPago">
                <i class="bi bi-check2-circle me-1"></i>Confirmar Cobro
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 2. MODAL REGISTRAR EGRESO / GASTO -->
      <div class="spa-modal-backdrop" id="modalEgresoBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-md" style="max-width: 620px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="modalEgresoTitle">Registrar Egreso de Caja</h2>
              <p id="modalEgresoSubtitle">Gastos operativos, compra de insumos, mantenimiento o adelantos.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalEgresoCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formEgreso" novalidate>
            <div class="spa-modal-body">
              <!-- Banner Saldo Disponible en Efectivo -->
              <div class="p-3 mb-3 rounded d-flex justify-content-between align-items-center" style="background:var(--spa-crema-subtle); border:1px solid var(--spa-crema-borde);">
                <div>
                  <small class="text-muted d-block text-uppercase" style="letter-spacing:0.04em; font-size:0.75rem;">Saldo Disponible en Efectivo:</small>
                  <span class="fw-bold fs-5 text-dark" id="egresoSaldoEfectivoDisponible">S/ 0.00</span>
                </div>
                <span class="badge" id="egresoEstadoCajaBadge" style="background:var(--spa-verde-salvia); color:#fff; font-weight:600; padding:6px 12px;">Caja Abierta</span>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-12 col-md-6">
                  <label for="egresoCategoria" class="form-label">Categoría del Egreso <span class="text-danger">*</span></label>
                  <select class="form-select" id="egresoCategoria" required>
                    <option value="insumos">Insumos y Productos</option>
                    <option value="servicios_basicos">Servicios Básicos (Luz, Agua, Net)</option>
                    <option value="mantenimiento">Mantenimiento de Equipos/Cabinas</option>
                    <option value="refrigerio">Refrigerios & Bienvenida Clientas</option>
                    <option value="comisiones">Comisiones / Honorarios</option>
                    <option value="otro">Otros Gastos Menores</option>
                  </select>
                </div>
                <div class="col-12 col-md-6">
                  <label for="egresoMetodoPago" class="form-label">Forma de Desembolso <span class="text-danger">*</span></label>
                  <select class="form-select" id="egresoMetodoPago" required>
                    <option value="efectivo">Efectivo (Gaveta de caja)</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="tarjeta">Tarjeta Corporativa / Débito</option>
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label for="egresoConcepto" class="form-label">Concepto / Descripción del Gasto <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="egresoConcepto" placeholder="Ej. Toallas descartables y apósitos para cabina facial" required>
                <div class="invalid-feedback">Ingrese la descripción o motivo del desembolso.</div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-12 col-md-6">
                  <label for="egresoBeneficiario" class="form-label">Beneficiario / Proveedor</label>
                  <input type="text" class="form-control" id="egresoBeneficiario" placeholder="Ej. Distribuidora Lima SAC">
                </div>
                <div class="col-12 col-md-6">
                  <label for="egresoMonto" class="form-label">Monto (S/) <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <span class="input-group-text" style="background:var(--spa-crema-subtle); font-weight:600;">S/</span>
                    <input type="number" step="0.50" min="0.01" class="form-control fw-bold fs-5 text-danger" id="egresoMonto" placeholder="0.00" required>
                  </div>
                  <div class="invalid-feedback" id="egresoMontoFeedback">Ingrese un monto válido.</div>
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-12 col-md-6">
                  <label for="egresoTipoComprobante" class="form-label">Tipo Comprobante Ref.</label>
                  <select class="form-select" id="egresoTipoComprobante">
                    <option value="factura">Factura de Compra</option>
                    <option value="boleta">Boleta de Venta</option>
                    <option value="ticket">Ticket de Compra</option>
                    <option value="recibo">Recibo Simple / Vale</option>
                  </select>
                </div>
                <div class="col-12 col-md-6">
                  <label for="egresoComprobanteRef" class="form-label">N° Serie / Folio Ref.</label>
                  <input type="text" class="form-control" id="egresoComprobanteRef" placeholder="Ej. F001-2910">
                </div>
              </div>

              <div class="mb-2">
                <label for="egresoJustificacion" class="form-label">Justificación o Notas</label>
                <textarea class="form-control" id="egresoJustificacion" rows="2" placeholder="Motivo de urgencia o autorización..."></textarea>
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-secondary" id="modalEgresoCancelBtn">Cancelar</button>
              <button type="submit" class="btn btn-danger" id="btnGuardarEgreso" style="background:#C94A4A; border-color:#C94A4A;">
                <i class="bi bi-box-arrow-up-right me-1"></i>Registrar Egreso
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 3. MODAL APERTURA DE CAJA -->
      <div class="spa-modal-backdrop" id="modalAperturaBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-sm" style="max-width: 500px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2>Apertura de Turno de Caja</h2>
              <p>Habilita la caja para iniciar la recepción de cobros y transacciones del día.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalAperturaCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formApertura" novalidate>
            <div class="spa-modal-body">
              <div class="mb-3">
                <label for="aperturaMonto" class="form-label">Fondo Inicial de Sencillo (S/) <span class="text-danger">*</span></label>
                <div class="input-group">
                  <span class="input-group-text" style="font-weight:600;">S/</span>
                  <input type="number" step="10" min="0" class="form-control fs-4 fw-bold text-success" id="aperturaMonto" value="250.00" required>
                </div>
                <small class="text-muted">Monto en efectivo dejado en gaveta para vueltos y operaciones matutinas.</small>
              </div>

              <div class="mb-3">
                <label for="aperturaUsuario" class="form-label">Responsable de Caja</label>
                <input type="text" class="form-control" id="aperturaUsuario" value="Lucero Administradora" readonly style="background:#f4f4f4;">
              </div>

              <div class="mb-2">
                <label for="aperturaObservaciones" class="form-label">Observaciones de Apertura</label>
                <textarea class="form-control" id="aperturaObservaciones" rows="2" placeholder="Fondo inicial verificado conforme..."></textarea>
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-secondary" id="modalAperturaCancelBtn">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btnConfirmarApertura">
                <i class="bi bi-unlock-fill me-1"></i>Abrir Caja
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 4. MODAL CIERRE DE CAJA (ARQUEO) -->
      <div class="spa-modal-backdrop" id="modalCierreBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-md" style="max-width: 620px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2>Cierre de Caja y Arqueo Diario</h2>
              <p>Cuadre de caja física vs registros contables del sistema.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalCierreCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formCierre" novalidate>
            <div class="spa-modal-body">
              <!-- Resumen Contable Calculado -->
              <div class="p-3 mb-3 rounded" style="background:var(--spa-crema-subtle); border:1px solid var(--spa-crema-borde);">
                <div class="row g-2">
                  <div class="col-6">
                    <small class="text-muted d-block">Monto de Apertura:</small>
                    <b id="cierreFondoInicial">S/ 0.00</b>
                  </div>
                  <div class="col-6">
                    <small class="text-muted d-block">(+) Cobros en Efectivo:</small>
                    <b id="cierreIngresosEfectivo" class="text-success">+ S/ 0.00</b>
                  </div>
                  <div class="col-6 mt-2">
                    <small class="text-muted d-block">(-) Egresos en Efectivo:</small>
                    <b id="cierreEgresosEfectivo" class="text-danger">- S/ 0.00</b>
                  </div>
                  <div class="col-6 mt-2">
                    <small class="text-muted d-block">Cobros Digitales (POS/Yape):</small>
                    <b id="cierreIngresosDigitales" class="text-primary">S/ 0.00</b>
                  </div>
                </div>

                <hr style="margin: 10px 0; border-color: var(--spa-crema-borde);">

                <div class="d-flex justify-content-between align-items-center">
                  <span class="fw-semibold" style="letter-spacing:0.02em;">SALDO ESPERADO EN EFECTIVO:</span>
                  <span class="fs-5 fw-bold text-dark" id="cierreSaldoEsperado">S/ 0.00</span>
                </div>
              </div>

              <!-- Input Conteo Físico -->
              <div class="mb-3">
                <label for="cierreMontoReal" class="form-label fw-bold">Conteo Real en Efectivo en Gaveta (S/) <span class="text-danger">*</span></label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text" style="font-weight:700;">S/</span>
                  <input type="number" step="0.50" min="0" class="form-control fs-3 fw-bold" id="cierreMontoReal" placeholder="0.00" required>
                </div>
                <small class="text-muted">Total de billetes y monedas contados físicamente en la gaveta.</small>
              </div>

              <!-- Indicador de Descuadre en Vivo -->
              <div class="p-3 mb-3 rounded text-center" id="cierreDescuadreBox" style="background:#F8F9FA; border:1px solid #DEE2E6;">
                <small class="text-muted d-block text-uppercase" style="font-size:0.75rem; letter-spacing:0.06em;">Resultado del Arqueo</small>
                <div class="fs-4 fw-bold mt-1" id="cierreDiferenciaDisplay">Ingrese el conteo real</div>
                <small id="cierreDiferenciaTexto" class="text-muted">El sistema calculará automáticamente si existe sobrante o faltante.</small>
              </div>

              <!-- Justificación obligatoria si hay descuadre -->
              <div class="mb-2">
                <label for="cierreObservaciones" class="form-label" id="cierreObsLabel">Observaciones del Cierre</label>
                <textarea class="form-control" id="cierreObservaciones" rows="2" placeholder="Observaciones generales o justificación obligatoria en caso de descuadre..."></textarea>
                <div class="invalid-feedback" id="cierreObsFeedback">Es obligatorio justificar la diferencia detectada (mínimo 5 caracteres).</div>
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-secondary" id="modalCierreCancelBtn">Cancelar</button>
              <button type="submit" class="btn btn-dark" id="btnConfirmarCierre" style="background:var(--spa-espresso); border-color:var(--spa-espresso);">
                <i class="bi bi-lock-fill me-1"></i>Finalizar y Cerrar Turno
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 5. MODAL COMPROBANTE DE PAGO (RECIBO IMPRIMIBLE) -->
      <div class="spa-modal-backdrop" id="modalComprobanteBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-md" style="max-width: 580px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2>Comprobante de Pago</h2>
              <p>Recibo digital oficial para la clienta y constancia de caja.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalComprobanteCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="spa-modal-body" id="reciboPrintArea">
            <div class="receipt-card p-4 rounded" style="background:#fff; border:1px dashed #d1c7bc; font-family:'Montserrat', sans-serif;">
              <!-- Header Recibo -->
              <div class="text-center pb-3 border-bottom mb-3">
                <h3 style="font-family:'Cormorant Garamond', serif; font-size:1.8rem; margin-bottom:2px; color:var(--spa-espresso);">VIVI SPA & ESTUDIO</h3>
                <small class="text-muted d-block">R.U.C. 20608912341 | Lima, Perú</small>
                <small class="text-muted d-block">Av. El Polo 670, Santiago de Surco</small>
                <div class="badge mt-2" id="reciboTipoComprobanteBadge" style="background:var(--spa-dorado); color:#120d0a; font-weight:600; font-size:0.8rem; padding:4px 10px;">
                  BOLETA DE VENTA ELECTRÓNICA
                </div>
                <div class="fw-bold mt-1 text-dark" id="reciboCodigo">PAG-2026-001</div>
              </div>

              <!-- Metadatos de la Transacción -->
              <div class="row g-2 mb-3 small">
                <div class="col-6">
                  <span class="text-muted">Fecha y Hora:</span>
                  <div class="fw-semibold text-dark" id="reciboFechaHora">-</div>
                </div>
                <div class="col-6 text-end">
                  <span class="text-muted">Método de Pago:</span>
                  <div class="fw-semibold text-dark text-uppercase" id="reciboMetodoPago">-</div>
                </div>
                <div class="col-12 mt-2">
                  <span class="text-muted">Clienta:</span>
                  <div class="fw-bold text-dark fs-6" id="reciboClienta">-</div>
                </div>
                <div class="col-6 mt-1">
                  <span class="text-muted">Especialista:</span>
                  <div class="fw-semibold text-dark" id="reciboEspecialista">-</div>
                </div>
                <div class="col-6 mt-1 text-end">
                  <span class="text-muted">Cita Relacionada:</span>
                  <div class="fw-semibold text-dark" id="reciboCitaCodigo">-</div>
                </div>
              </div>

              <!-- Detalle de Ítems Cobrados -->
              <table class="table table-sm border-top border-bottom small mb-3">
                <thead>
                  <tr class="text-muted">
                    <th>DESCRIPCIÓN</th>
                    <th class="text-end">IMPORTE</th>
                  </tr>
                </thead>
                <tbody id="reciboItemsTable">
                  <tr>
                    <td id="reciboItemNombre">-</td>
                    <td class="text-end fw-semibold" id="reciboItemPrecio">S/ 0.00</td>
                  </tr>
                </tbody>
              </table>

              <!-- Totales -->
              <div class="small">
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Subtotal:</span>
                  <span class="fw-semibold" id="reciboSubtotal">S/ 0.00</span>
                </div>
                <div class="d-flex justify-content-between mb-1" id="reciboPropinaRow">
                  <span class="text-muted">Propina para Especialista:</span>
                  <span class="fw-semibold text-success" id="reciboPropina">S/ 0.00</span>
                </div>
                <div class="d-flex justify-content-between fs-5 fw-bold border-top pt-2 mt-2" style="color:var(--spa-espresso);">
                  <span>TOTAL COBRADO:</span>
                  <span id="reciboTotal" style="color:var(--spa-dorado-oscuro, #8a7042);">S/ 0.00</span>
                </div>
              </div>

              <!-- N° de Operación y Notas -->
              <div class="mt-3 pt-2 border-top small text-muted text-center" id="reciboFooterRef">
                <span id="reciboNumOpText">N° Operación: -</span>
              </div>
              <div class="text-center mt-3">
                <small class="text-muted fst-italic">¡Gracias por preferir la experiencia VIVI Spa & Estudio!</small>
              </div>
            </div>
          </div>

          <div class="spa-modal-footer">
            <button type="button" class="btn btn-outline-secondary" id="modalComprobanteCloseBtn2">Cerrar</button>
            <button type="button" class="btn btn-primary" id="btnImprimirComprobante">
              <i class="bi bi-printer me-1"></i>Imprimir Recibo
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    bindModalEvents();
  }

  function bindModalEvents() {
    // 1. Cerrar modales con botones de cierre o backdrop
    const modalPairs = [
      { bd: 'modalPagoBackdrop', close: ['modalPagoCloseBtn', 'modalPagoCancelBtn'] },
      { bd: 'modalEgresoBackdrop', close: ['modalEgresoCloseBtn', 'modalEgresoCancelBtn'] },
      { bd: 'modalAperturaBackdrop', close: ['modalAperturaCloseBtn', 'modalAperturaCancelBtn'] },
      { bd: 'modalCierreBackdrop', close: ['modalCierreCloseBtn', 'modalCierreCancelBtn'] },
      { bd: 'modalComprobanteBackdrop', close: ['modalComprobanteCloseBtn', 'modalComprobanteCloseBtn2'] }
    ];

    modalPairs.forEach(pair => {
      const bd = document.getElementById(pair.bd);
      if (!bd) return;
      pair.close.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.addEventListener('click', () => hideModal(pair.bd));
        }
      });
      bd.addEventListener('click', (e) => {
        if (e.target === bd) hideModal(pair.bd);
      });
    });

    // 2. Eventos interactivos en Modal Pago
    const tipoOrigen = document.getElementById('pagoTipoOrigen');
    const citaSelectGroup = document.getElementById('pagoCitaSelectGroup');
    const camposDirectos = document.getElementById('pagoCamposDirectos');
    const citaSelect = document.getElementById('pagoCitaSelect');
    const pagoMonto = document.getElementById('pagoMonto');
    const pagoMetodo = document.getElementById('pagoMetodo');
    const calculoEfectivoBox = document.getElementById('pagoCalculoEfectivoBox');
    const efectivoRecibido = document.getElementById('pagoEfectivoRecibido');
    const vueltoCalculado = document.getElementById('pagoVueltoCalculado');

    if (tipoOrigen) {
      tipoOrigen.addEventListener('change', () => {
        if (tipoOrigen.value === 'directo') {
          citaSelectGroup.classList.add('d-none');
          camposDirectos.classList.remove('d-none');
          document.getElementById('pagoInfoBox').classList.add('d-none');
          document.getElementById('pagoCitaId').value = '';
          pagoMonto.value = '';
        } else {
          citaSelectGroup.classList.remove('d-none');
          camposDirectos.classList.add('d-none');
          document.getElementById('pagoInfoBox').classList.remove('d-none');
          actualizarInfoCitaSeleccionada();
        }
      });
    }

    if (citaSelect) {
      citaSelect.addEventListener('change', actualizarInfoCitaSeleccionada);
    }

    if (pagoMetodo) {
      pagoMetodo.addEventListener('change', () => {
        if (pagoMetodo.value === 'efectivo') {
          calculoEfectivoBox.classList.remove('d-none');
          document.getElementById('pagoNumOpLabel').textContent = 'N° Operación / Ref. (Opcional)';
        } else {
          calculoEfectivoBox.classList.add('d-none');
          document.getElementById('pagoNumOpLabel').textContent = 'N° Operación / Ref. *';
        }
      });
    }

    function recalcularVuelto() {
      const monto = parseFloat(pagoMonto.value) || 0;
      const recibido = parseFloat(efectivoRecibido.value) || 0;
      const vuelto = Math.max(0, recibido - monto);
      vueltoCalculado.textContent = SpaStore.formatMoney(vuelto);
      if (recibido > 0 && recibido < monto) {
        vueltoCalculado.className = 'fs-5 text-danger';
        vueltoCalculado.textContent = 'Monto incompleto';
      } else {
        vueltoCalculado.className = 'fs-5 text-success';
      }
    }

    if (efectivoRecibido) efectivoRecibido.addEventListener('input', recalcularVuelto);
    if (pagoMonto) pagoMonto.addEventListener('input', recalcularVuelto);

    // Enviar Pago
    const formPago = document.getElementById('formPago');
    if (formPago) {
      formPago.addEventListener('submit', (e) => {
        e.preventDefault();
        submitPago();
      });
    }

    // Enviar Egreso
    const formEgreso = document.getElementById('formEgreso');
    if (formEgreso) {
      formEgreso.addEventListener('submit', (e) => {
        e.preventDefault();
        submitEgreso();
      });
    }

    // Enviar Apertura
    const formApertura = document.getElementById('formApertura');
    if (formApertura) {
      formApertura.addEventListener('submit', (e) => {
        e.preventDefault();
        submitApertura();
      });
    }

    // Eventos Arqueo Cierre
    const cierreMontoReal = document.getElementById('cierreMontoReal');
    if (cierreMontoReal) {
      cierreMontoReal.addEventListener('input', actualizarCalculoDescuadre);
    }

    const formCierre = document.getElementById('formCierre');
    if (formCierre) {
      formCierre.addEventListener('submit', (e) => {
        e.preventDefault();
        submitCierre();
      });
    }

    // Imprimir Comprobante
    const btnImprimir = document.getElementById('btnImprimirComprobante');
    if (btnImprimir) {
      btnImprimir.addEventListener('click', () => {
        window.print();
      });
    }
  }

  function showModal(id) {
    ensureModalMarkup();
    const bd = document.getElementById(id);
    if (bd) {
      bd.classList.add('show');
      bd.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function hideModal(id) {
    const bd = document.getElementById(id);
    if (bd) {
      bd.classList.remove('show');
      bd.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  function poblarCitasPendientes(citaIdPreseleccionada = null) {
    const citaSelect = document.getElementById('pagoCitaSelect');
    if (!citaSelect) return;

    const citas = SpaStore.getCitas();
    // Filtrar citas que tengan saldo pendiente > 0 y no estén canceladas
    const citasCobro = citas.filter(c => c.estado !== 'cancelada');

    let optionsHTML = '<option value="">-- Seleccionar Cita --</option>';
    citasCobro.forEach(c => {
      const saldoPend = typeof c.saldoPendiente === 'number'
        ? c.saldoPendiente
        : Math.max(0, c.total - (c.montoPagado || 0));
      const badgeText = saldoPend > 0 ? `(Saldo pendiente: ${SpaStore.formatMoney(saldoPend)})` : `(Pagada total)`;
      const selected = (citaIdPreseleccionada && (c.id === citaIdPreseleccionada || c.codigo === citaIdPreseleccionada)) ? 'selected' : '';
      optionsHTML += `<option value="${c.id}" ${selected}>${c.codigo} - ${c.clienteNombre} - ${c.servicioNombre} ${badgeText}</option>`;
    });

    citaSelect.innerHTML = optionsHTML;
    actualizarInfoCitaSeleccionada();
  }

  function actualizarInfoCitaSeleccionada() {
    const citaSelect = document.getElementById('pagoCitaSelect');
    const infoBox = document.getElementById('pagoInfoBox');
    const pagoMonto = document.getElementById('pagoMonto');
    const pagoCitaId = document.getElementById('pagoCitaId');

    if (!citaSelect || !infoBox) return;

    const citaId = citaSelect.value;
    if (!citaId) {
      document.getElementById('pagoInfoClienta').textContent = '-';
      document.getElementById('pagoInfoServicio').textContent = '-';
      document.getElementById('pagoInfoEspecialista').textContent = '-';
      document.getElementById('pagoInfoTotal').textContent = 'S/ 0.00';
      document.getElementById('pagoInfoPagado').textContent = 'S/ 0.00';
      document.getElementById('pagoInfoSaldo').textContent = 'S/ 0.00';
      pagoCitaId.value = '';
      return;
    }

    const cita = SpaStore.getCitaById(citaId);
    if (cita) {
      pagoCitaId.value = cita.id;
      const saldoPend = typeof cita.saldoPendiente === 'number'
        ? cita.saldoPendiente
        : Math.max(0, cita.total - (cita.montoPagado || 0));

      document.getElementById('pagoInfoClienta').textContent = cita.clienteNombre;
      document.getElementById('pagoInfoServicio').textContent = cita.servicioNombre;
      document.getElementById('pagoInfoEspecialista').textContent = cita.especialistaNombre;
      document.getElementById('pagoInfoTotal').textContent = SpaStore.formatMoney(cita.total);
      document.getElementById('pagoInfoPagado').textContent = SpaStore.formatMoney(cita.montoPagado || 0);
      document.getElementById('pagoInfoSaldo').textContent = SpaStore.formatMoney(saldoPend);

      if (saldoPend > 0) {
        pagoMonto.value = saldoPend.toFixed(2);
      } else {
        pagoMonto.value = '';
      }

      if (cita.metodoPago) {
        const selMetodo = document.getElementById('pagoMetodo');
        if (selMetodo) selMetodo.value = cita.metodoPago;
      }
    }
  }

  function submitPago() {
    const caja = SpaStore.getCajaActual();
    if (caja.estado !== 'abierta') {
      SpaUI.showToast('Caja Cerrada', 'No es posible registrar cobros con la caja cerrada. Debe abrir la caja primero.', 'warning');
      return;
    }

    const tipoOrigen = document.getElementById('pagoTipoOrigen').value;
    const monto = parseFloat(document.getElementById('pagoMonto').value);

    if (isNaN(monto) || monto <= 0) {
      document.getElementById('pagoMontoFeedback').textContent = 'El monto debe ser un valor numérico mayor a 0.';
      document.getElementById('pagoMonto').classList.add('is-invalid');
      return;
    }
    document.getElementById('pagoMonto').classList.remove('is-invalid');

    const metodoPago = document.getElementById('pagoMetodo').value;
    const numOp = document.getElementById('pagoNumeroOperacion').value.trim();
    if (metodoPago !== 'efectivo' && !numOp) {
      SpaUI.showToast('Referencia Requerida', 'Para pagos con tarjeta, transferencia o Yape, ingrese el número de operación o referencia.', 'warning');
      document.getElementById('pagoNumeroOperacion').focus();
      return;
    }

    const payload = {
      monto,
      metodoPago,
      tipoComprobante: document.getElementById('pagoTipoComprobante').value,
      numeroOperacion: numOp || null,
      propina: parseFloat(document.getElementById('pagoPropina').value) || 0,
      notas: document.getElementById('pagoNotas').value.trim(),
      usuario: 'Recepción'
    };

    if (tipoOrigen === 'cita') {
      const citaId = document.getElementById('pagoCitaId').value;
      if (!citaId) {
        SpaUI.showToast('Cita no seleccionada', 'Por favor seleccione una cita válida para asociar el pago.', 'warning');
        return;
      }
      payload.citaId = citaId;
    } else {
      payload.clienteNombre = document.getElementById('pagoClienteNombre').value.trim() || 'Cliente mostrador';
      payload.servicioNombre = document.getElementById('pagoServicioNombre').value.trim();
      if (!payload.servicioNombre) {
        SpaUI.showToast('Campo obligatorio', 'Ingrese el concepto o producto de la venta.', 'warning');
        document.getElementById('pagoServicioNombre').focus();
        return;
      }
    }

    const res = SpaStore.registrarPago(payload);
    if (!res.success) {
      SpaUI.showToast('Error al registrar cobro', res.message, 'error');
      return;
    }

    SpaUI.showToast('Cobro Registrado', res.message, 'success');
    hideModal('modalPagoBackdrop');

    if (typeof onPaymentSavedCallback === 'function') {
      onPaymentSavedCallback(res.data);
    }
    window.dispatchEvent(new CustomEvent('spa:pagos-changed', { detail: res.data }));

    // Ofrecer visualización de recibo
    openComprobanteModal(res.data.id);
  }

  function submitEgreso() {
    const caja = SpaStore.getCajaActual();
    if (caja.estado !== 'abierta') {
      SpaUI.showToast('Caja Cerrada', 'No es posible registrar egresos con la caja cerrada.', 'warning');
      return;
    }

    const monto = parseFloat(document.getElementById('egresoMonto').value);
    const concepto = document.getElementById('egresoConcepto').value.trim();
    const metodoPago = document.getElementById('egresoMetodoPago').value;

    if (isNaN(monto) || monto <= 0) {
      document.getElementById('egresoMontoFeedback').textContent = 'Ingrese un monto mayor a 0.';
      document.getElementById('egresoMonto').classList.add('is-invalid');
      return;
    }
    document.getElementById('egresoMonto').classList.remove('is-invalid');

    if (!concepto || concepto.length < 3) {
      document.getElementById('egresoConcepto').classList.add('is-invalid');
      return;
    }
    document.getElementById('egresoConcepto').classList.remove('is-invalid');

    const payload = {
      categoria: document.getElementById('egresoCategoria').value,
      metodoPago: metodoPago,
      concepto: concepto,
      beneficiario: document.getElementById('egresoBeneficiario').value.trim(),
      monto: monto,
      tipoComprobante: document.getElementById('egresoTipoComprobante').value,
      comprobanteRef: document.getElementById('egresoComprobanteRef').value.trim(),
      justificacion: document.getElementById('egresoJustificacion').value.trim(),
      usuario: 'Lucero Administradora'
    };

    const res = SpaStore.registrarEgreso(payload);
    if (!res.success) {
      SpaUI.showToast('Egreso Rechazado', res.message, 'error');
      return;
    }

    SpaUI.showToast('Egreso Registrado', res.message, 'success');
    hideModal('modalEgresoBackdrop');

    if (typeof onExpenseSavedCallback === 'function') {
      onExpenseSavedCallback(res.data);
    }
    window.dispatchEvent(new CustomEvent('spa:caja-changed', { detail: res.data }));
  }

  function submitApertura() {
    const monto = parseFloat(document.getElementById('aperturaMonto').value);
    if (isNaN(monto) || monto < 0) {
      SpaUI.showToast('Monto Inválido', 'El fondo inicial de caja no puede ser negativo.', 'warning');
      return;
    }

    const res = SpaStore.abrirCaja({
      montoApertura: monto,
      usuario: document.getElementById('aperturaUsuario').value,
      observaciones: document.getElementById('aperturaObservaciones').value.trim()
    });

    if (!res.success) {
      SpaUI.showToast('Error en Apertura', res.message, 'error');
      return;
    }

    SpaUI.showToast('Caja Abierta', res.message, 'success');
    hideModal('modalAperturaBackdrop');

    if (typeof onCashStateChangedCallback === 'function') {
      onCashStateChangedCallback(res.data);
    }
    window.dispatchEvent(new CustomEvent('spa:caja-changed', { detail: res.data }));
  }

  function actualizarCalculoDescuadre() {
    const caja = SpaStore.getCajaActual();
    const saldoEsperado = caja.saldoEsperadoEfectivo;
    const inputVal = document.getElementById('cierreMontoReal').value;
    const display = document.getElementById('cierreDiferenciaDisplay');
    const texto = document.getElementById('cierreDiferenciaTexto');
    const box = document.getElementById('cierreDescuadreBox');
    const obsLabel = document.getElementById('cierreObsLabel');

    if (inputVal === '' || isNaN(parseFloat(inputVal))) {
      display.textContent = 'Ingrese el conteo real';
      display.style.color = '#6c757d';
      texto.textContent = 'El sistema calculará automáticamente si existe sobrante o faltante.';
      box.style.background = '#F8F9FA';
      box.style.borderColor = '#DEE2E6';
      obsLabel.innerHTML = 'Observaciones del Cierre';
      return;
    }

    const conteoReal = parseFloat(inputVal);
    const diferencia = Math.round((conteoReal - saldoEsperado) * 100) / 100;

    if (Math.abs(diferencia) <= 0.01) {
      display.textContent = 'Cuadre Exacto (S/ 0.00)';
      display.style.color = '#28a745';
      texto.textContent = 'El conteo coincide exactamente con el saldo esperado en efectivo.';
      box.style.background = '#eef8ef';
      box.style.borderColor = '#c3e6cb';
      obsLabel.innerHTML = 'Observaciones del Cierre <span class="text-muted">(Opcional)</span>';
    } else if (diferencia > 0) {
      display.textContent = `Sobrante de +${SpaStore.formatMoney(diferencia)}`;
      display.style.color = '#856404';
      texto.textContent = 'Existe dinero excedente en la gaveta. Justificación requerida.';
      box.style.background = '#fff8e6';
      box.style.borderColor = '#ffeeba';
      obsLabel.innerHTML = 'Observaciones del Cierre <span class="text-danger fw-bold">* Justificación obligatoria</span>';
    } else {
      display.textContent = `Faltante de -${SpaStore.formatMoney(Math.abs(diferencia))}`;
      display.style.color = '#dc3545';
      texto.textContent = 'Existe dinero faltante en la gaveta respecto al sistema. Justificación requerida.';
      box.style.background = '#fdf2f2';
      box.style.borderColor = '#f5c6cb';
      obsLabel.innerHTML = 'Observaciones del Cierre <span class="text-danger fw-bold">* Justificación obligatoria</span>';
    }
  }

  function submitCierre() {
    const inputVal = document.getElementById('cierreMontoReal').value;
    const conteoReal = parseFloat(inputVal);

    if (inputVal === '' || isNaN(conteoReal) || conteoReal < 0) {
      SpaUI.showToast('Conteo Inválido', 'Ingrese un monto de efectivo válido (mayor o igual a cero).', 'warning');
      document.getElementById('cierreMontoReal').focus();
      return;
    }

    const obs = document.getElementById('cierreObservaciones').value.trim();

    const res = SpaStore.cerrarCaja({
      montoCierreReal: conteoReal,
      usuario: 'Lucero Administradora',
      observaciones: obs
    });

    if (!res.success) {
      SpaUI.showToast('Arqueo Observado', res.message, 'warning');
      document.getElementById('cierreObservaciones').classList.add('is-invalid');
      document.getElementById('cierreObsFeedback').textContent = res.message;
      return;
    }

    document.getElementById('cierreObservaciones').classList.remove('is-invalid');
    SpaUI.showToast('Caja Cerrada', res.message, 'success');
    hideModal('modalCierreBackdrop');

    if (typeof onCashStateChangedCallback === 'function') {
      onCashStateChangedCallback(res.data);
    }
    window.dispatchEvent(new CustomEvent('spa:caja-changed', { detail: res.data }));
  }

  // API PÚBLICA DEL CONTROLADOR
  function openNuevoPagoModal(options = {}) {
    ensureModalMarkup();
    const caja = SpaStore.getCajaActual();
    const cajaAlert = document.getElementById('cajaCerradaAlert');
    const btnSubmit = document.getElementById('btnGuardarPago');

    if (caja.estado !== 'abierta') {
      if (cajaAlert) cajaAlert.classList.remove('d-none');
      if (btnSubmit) btnSubmit.disabled = true;
    } else {
      if (cajaAlert) cajaAlert.classList.add('d-none');
      if (btnSubmit) btnSubmit.disabled = false;
    }

    poblarCitasPendientes(options.citaId || null);

    if (options.citaId) {
      document.getElementById('pagoTipoOrigen').value = 'cita';
      document.getElementById('pagoTipoOrigen').dispatchEvent(new Event('change'));
    }

    if (options.monto) {
      document.getElementById('pagoMonto').value = Number(options.monto).toFixed(2);
    }

    if (options.onSaved) {
      onPaymentSavedCallback = options.onSaved;
    }

    showModal('modalPagoBackdrop');
  }

  function openRegistrarEgresoModal(options = {}) {
    ensureModalMarkup();
    const caja = SpaStore.getCajaActual();
    const saldoDisp = document.getElementById('egresoSaldoEfectivoDisponible');
    const badge = document.getElementById('egresoEstadoCajaBadge');
    const btnSubmit = document.getElementById('btnGuardarEgreso');

    if (saldoDisp) saldoDisp.textContent = SpaStore.formatMoney(caja.saldoEsperadoEfectivo);

    if (caja.estado !== 'abierta') {
      if (badge) {
        badge.textContent = 'Caja Cerrada';
        badge.style.background = '#dc3545';
      }
      if (btnSubmit) btnSubmit.disabled = true;
    } else {
      if (badge) {
        badge.textContent = 'Caja Abierta';
        badge.style.background = 'var(--spa-verde-salvia)';
      }
      if (btnSubmit) btnSubmit.disabled = false;
    }

    document.getElementById('formEgreso').reset();

    if (options.categoria) document.getElementById('egresoCategoria').value = options.categoria;
    if (options.monto) document.getElementById('egresoMonto').value = options.monto;
    if (options.concepto) document.getElementById('egresoConcepto').value = options.concepto;

    if (options.onSaved) {
      onExpenseSavedCallback = options.onSaved;
    }

    showModal('modalEgresoBackdrop');
  }

  function openAperturaCajaModal(options = {}) {
    ensureModalMarkup();
    const caja = SpaStore.getCajaActual();
    if (caja.estado === 'abierta') {
      SpaUI.showToast('Caja ya abierta', 'La caja ya se encuentra activa con turno abierto.', 'info');
      return;
    }

    document.getElementById('aperturaMonto').value = '250.00';
    document.getElementById('aperturaObservaciones').value = '';

    if (options.onSaved) {
      onCashStateChangedCallback = options.onSaved;
    }

    showModal('modalAperturaBackdrop');
  }

  function openCierreCajaModal(options = {}) {
    ensureModalMarkup();
    const caja = SpaStore.getCajaActual();
    if (caja.estado !== 'abierta') {
      SpaUI.showToast('Caja ya cerrada', 'No hay una caja abierta actualmente para cerrar.', 'info');
      return;
    }

    document.getElementById('cierreFondoInicial').textContent = SpaStore.formatMoney(caja.montoApertura || 0);
    document.getElementById('cierreIngresosEfectivo').textContent = `+ ${SpaStore.formatMoney(caja.ingresosEfectivo || 0)}`;
    document.getElementById('cierreEgresosEfectivo').textContent = `- ${SpaStore.formatMoney(caja.egresosEfectivo || 0)}`;
    document.getElementById('cierreIngresosDigitales').textContent = SpaStore.formatMoney(caja.ingresosDigitales || 0);
    document.getElementById('cierreSaldoEsperado').textContent = SpaStore.formatMoney(caja.saldoEsperadoEfectivo);

    document.getElementById('cierreMontoReal').value = '';
    document.getElementById('cierreObservaciones').value = '';
    actualizarCalculoDescuadre();

    if (options.onSaved) {
      onCashStateChangedCallback = options.onSaved;
    }

    showModal('modalCierreBackdrop');
  }

  function openComprobanteModal(pagoId) {
    ensureModalMarkup();
    const pago = SpaStore.getPagoById(pagoId);
    if (!pago) {
      SpaUI.showToast('Comprobante no encontrado', 'No se localizó el registro del pago.', 'warning');
      return;
    }

    document.getElementById('reciboCodigo').textContent = `${pago.codigo} • ${pago.numeroComprobante || 'REC-001'}`;
    document.getElementById('reciboFechaHora').textContent = `${pago.fecha} ${pago.hora}`;
    document.getElementById('reciboMetodoPago').textContent = pago.metodoPago;
    document.getElementById('reciboClienta').textContent = pago.clienteNombre;
    document.getElementById('reciboEspecialista').textContent = pago.especialistaNombre || 'Recepción VIVI';
    document.getElementById('reciboCitaCodigo').textContent = pago.citaCodigo || 'Venta directa en mostrador';

    document.getElementById('reciboItemNombre').textContent = pago.servicioNombre;
    document.getElementById('reciboItemPrecio').textContent = SpaStore.formatMoney(pago.monto);

    document.getElementById('reciboSubtotal').textContent = SpaStore.formatMoney(pago.monto);
    if (pago.propina && pago.propina > 0) {
      document.getElementById('reciboPropinaRow').classList.remove('d-none');
      document.getElementById('reciboPropina').textContent = SpaStore.formatMoney(pago.propina);
    } else {
      document.getElementById('reciboPropinaRow').classList.add('d-none');
    }
    const totalCobrado = (pago.monto || 0) + (pago.propina || 0);
    document.getElementById('reciboTotal').textContent = SpaStore.formatMoney(totalCobrado);

    if (pago.numeroOperacion) {
      document.getElementById('reciboNumOpText').textContent = `N° Operación: ${pago.numeroOperacion} | Usuario: ${pago.usuario}`;
    } else {
      document.getElementById('reciboNumOpText').textContent = `Transacción en Efectivo | Usuario: ${pago.usuario}`;
    }

    showModal('modalComprobanteBackdrop');
  }

  function anularPagoConConfirmacion(pagoId, callback = null) {
    const pago = SpaStore.getPagoById(pagoId);
    if (!pago) return;

    SpaUI.showConfirm(
      'Anular Pago de Caja',
      `¿Está segura de que desea anular el pago ${pago.codigo} por ${SpaStore.formatMoney(pago.monto)}? Esta acción revertirá el saldo de caja y el estado de la cita.`,
      () => {
        const motivo = prompt('Por favor ingrese el motivo obligatorio de anulación:', 'Error de digitación / Reembolso clienta');
        if (!motivo || motivo.trim().length < 5) {
          SpaUI.showToast('Anulación Cancelada', 'Debe especificar un motivo válido de al menos 5 caracteres.', 'warning');
          return;
        }

        const res = SpaStore.anularPago(pago.id, motivo);
        if (res.success) {
          SpaUI.showToast('Pago Anulado', res.message, 'success');
          if (typeof callback === 'function') callback(res.data);
          window.dispatchEvent(new CustomEvent('spa:pagos-changed', { detail: res.data }));
        } else {
          SpaUI.showToast('Error', res.message, 'error');
        }
      }
    );
  }

  function anularEgresoConConfirmacion(egresoId, callback = null) {
    const egreso = SpaStore.getEgresoById(egresoId);
    if (!egreso) return;

    SpaUI.showConfirm(
      'Anular Egreso de Caja',
      `¿Está segura de que desea anular el egreso ${egreso.codigo} por ${SpaStore.formatMoney(egreso.monto)}? El dinero será reintegrado a la caja.`,
      () => {
        const motivo = prompt('Por favor ingrese el motivo obligatorio de anulación:', 'Comprobante duplicado / Cancelación de servicio');
        if (!motivo || motivo.trim().length < 5) {
          SpaUI.showToast('Anulación Cancelada', 'Debe especificar un motivo válido de al menos 5 caracteres.', 'warning');
          return;
        }

        const res = SpaStore.anularEgreso(egreso.id, motivo);
        if (res.success) {
          SpaUI.showToast('Egreso Anulado', res.message, 'success');
          if (typeof callback === 'function') callback(res.data);
          window.dispatchEvent(new CustomEvent('spa:caja-changed', { detail: res.data }));
        } else {
          SpaUI.showToast('Error', res.message, 'error');
        }
      }
    );
  }

  return {
    openNuevoPagoModal,
    openRegistrarEgresoModal,
    openAperturaCajaModal,
    openCierreCajaModal,
    openComprobanteModal,
    anularPagoConConfirmacion,
    anularEgresoConConfirmacion
  };
});
