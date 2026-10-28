/**
 * VIVI SPA & ESTUDIO - COMMISSION & LIQUIDATION MODAL CONTROLLER
 * Controlador para Liquidación de Honorarios, Vouchers de Pago y Reglas de Comisión.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./spa-store', './spa-ui'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./spa-store'), require('./spa-ui'));
  } else {
    root.CommissionModal = factory(root.SpaStore, root.SpaUI);
  }
})(typeof self !== 'undefined' ? self : this, function (SpaStore, SpaUI) {
  'use strict';

  let onCommissionChangedCallback = null;

  function ensureModalMarkup() {
    if (document.getElementById('modalLiquidarBackdrop')) return;

    const modalHTML = `
      <!-- 1. MODAL LIQUIDAR COMISIONES -->
      <div class="spa-modal-backdrop" id="modalLiquidarBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-lg" style="max-width: 800px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="modalLiquidarTitle">Liquidar Comisiones a Especialista</h2>
              <p>Selecciona los servicios completados para emitir la liquidación formal y comprobante de pago.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalLiquidarCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formLiquidar" novalidate>
            <div class="spa-modal-body">
              <!-- Selector de Especialista -->
              <div class="row g-3 mb-3">
                <div class="col-12 col-md-6">
                  <label for="liquidarEspecialistaSelect" class="form-label">Especialista a Liquidar <span class="text-danger">*</span></label>
                  <select class="form-select" id="liquidarEspecialistaSelect" required>
                    <option value="">-- Seleccionar Especialista --</option>
                  </select>
                </div>
                <div class="col-12 col-md-6">
                  <label for="liquidarMetodoPago" class="form-label">Método de Pago <span class="text-danger">*</span></label>
                  <select class="form-select" id="liquidarMetodoPago" required>
                    <option value="transferencia">Transferencia Bancaria (BCP/BBVA/Interbank)</option>
                    <option value="efectivo">Efectivo de Caja</option>
                  </select>
                </div>
              </div>

              <!-- Tabla de Servicios Pendientes de Liquidar -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-semibold small text-uppercase" style="letter-spacing:0.04em; color:var(--spa-espresso);">
                    Comisiones Disponibles para Pago
                  </span>
                  <div class="form-check form-check-inline m-0">
                    <input class="form-check-input" type="checkbox" id="checkSelectAllComisiones">
                    <label class="form-check-label small fw-semibold" for="checkSelectAllComisiones">Seleccionar todas</label>
                  </div>
                </div>

                <div class="table-responsive border rounded" style="max-height: 240px; overflow-y: auto;">
                  <table class="table table-sm table-hover align-middle mb-0" style="font-size:0.85rem;">
                    <thead style="background:var(--spa-crema-subtle); position:sticky; top:0; z-index:1;">
                      <tr>
                        <th style="width: 40px;" class="text-center">#</th>
                        <th>Fecha</th>
                        <th>Clienta y Cita</th>
                        <th>Servicio</th>
                        <th class="text-end">Tarifa</th>
                        <th class="text-center">%</th>
                        <th class="text-end">Comisión</th>
                      </tr>
                    </thead>
                    <tbody id="liquidarComisionesTbody">
                      <tr>
                        <td colspan="7" class="text-center py-4 text-muted">Seleccione una especialista para cargar sus servicios pendientes.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Banner Resumen de Liquidación -->
              <div class="p-3 mb-3 rounded" style="background:#FAF8F5; border:1px solid #E6E0D8;">
                <div class="row align-items-center text-center text-sm-start">
                  <div class="col-12 col-sm-4 mb-2 mb-sm-0">
                    <small class="text-muted d-block">Servicios Seleccionados:</small>
                    <b id="liquidarCantServicios" class="fs-6">0 servicios</b>
                  </div>
                  <div class="col-12 col-sm-4 mb-2 mb-sm-0">
                    <small class="text-muted d-block">Total Facturado:</small>
                    <b id="liquidarTotalFacturado" class="fs-6 text-dark">S/ 0.00</b>
                  </div>
                  <div class="col-12 col-sm-4 text-sm-end">
                    <small class="text-muted d-block">TOTAL A LIQUIDAR:</small>
                    <b id="liquidarMontoTotal" class="fs-4 fw-bold" style="color:var(--spa-dorado-oscuro, #8a7042);">S/ 0.00</b>
                  </div>
                </div>
              </div>

              <!-- Campos de Referencia y Opciones -->
              <div class="row g-3 mb-3">
                <div class="col-12 col-md-6">
                  <label for="liquidarNumOperacion" class="form-label">N° Operación / Referencia Bancaria</label>
                  <input type="text" class="form-control" id="liquidarNumOperacion" placeholder="Ej. TRF-994120">
                </div>
                <div class="col-12 col-md-6 d-flex align-items-end">
                  <div class="form-check pb-2">
                    <input class="form-check-input" type="checkbox" id="liquidarRegistrarEgreso" checked>
                    <label class="form-check-label small" for="liquidarRegistrarEgreso">
                      <b>Registrar egreso contable en Caja</b> (categoría: Comisiones)
                    </label>
                  </div>
                </div>
              </div>

              <div class="mb-2">
                <label for="liquidarNotas" class="form-label">Notas / Observaciones del Pago</label>
                <input type="text" class="form-control" id="liquidarNotas" placeholder="Ej. Liquidación semanal conforme">
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-secondary" id="modalLiquidarCancelBtn">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btnConfirmarLiquidacion" disabled>
                <i class="bi bi-cash-stack me-1"></i>Emitir Liquidación
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 2. MODAL VOUCHER DE LIQUIDACIÓN (IMPRIMIBLE) -->
      <div class="spa-modal-backdrop" id="modalVoucherBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-md" style="max-width: 640px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2>Comprobante de Liquidación</h2>
              <p>Constancia oficial de honorarios y servicios liquidados.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalVoucherCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="spa-modal-body">
            <div class="voucher-card p-4 rounded" id="voucherPrintArea" style="background:#fff; border:1px solid #dcd7ce; font-family:'Montserrat', sans-serif;">
              <!-- Header Voucher -->
              <div class="text-center pb-3 border-bottom mb-3">
                <h3 style="font-family:'Cormorant Garamond', serif; font-size:1.9rem; margin-bottom:2px; color:var(--spa-espresso);">VIVI SPA & ESTUDIO</h3>
                <small class="text-muted d-block text-uppercase" style="letter-spacing:0.06em;">Liquidación Oficial de Comisiones Profesionales</small>
                <div class="badge mt-2" id="voucherCodigo" style="background:var(--spa-dorado); color:#120d0a; font-weight:700; font-size:0.85rem; padding:4px 12px;">
                  LIQ-2026-001
                </div>
              </div>

              <!-- Metadatos de la Liquidación -->
              <div class="row g-2 mb-3 small">
                <div class="col-6">
                  <span class="text-muted">Especialista:</span>
                  <div class="fw-bold text-dark fs-6" id="voucherEspecialista">-</div>
                </div>
                <div class="col-6 text-end">
                  <span class="text-muted">Fecha de Emisión:</span>
                  <div class="fw-semibold text-dark" id="voucherFechaHora">-</div>
                </div>
                <div class="col-6 mt-1">
                  <span class="text-muted">Período / Referencia:</span>
                  <div class="fw-semibold text-dark" id="voucherPeriodo">-</div>
                </div>
                <div class="col-6 mt-1 text-end">
                  <span class="text-muted">Forma de Pago:</span>
                  <div class="fw-semibold text-dark text-uppercase" id="voucherMetodo">-</div>
                </div>
              </div>

              <!-- Detalle de Servicios Liquidados -->
              <table class="table table-sm border-top border-bottom small mb-3">
                <thead>
                  <tr class="text-muted">
                    <th>SERVICIO / CITA</th>
                    <th class="text-center">%</th>
                    <th class="text-end">TARIFA</th>
                    <th class="text-end">COMISIÓN</th>
                  </tr>
                </thead>
                <tbody id="voucherItemsTable">
                  <!-- Se puebla dinámicamente -->
                </tbody>
              </table>

              <!-- Totales -->
              <div class="small">
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Total Servicios Realizados:</span>
                  <span class="fw-semibold" id="voucherTotalServicios">0</span>
                </div>
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Monto Total Facturado:</span>
                  <span class="fw-semibold" id="voucherTotalFacturado">S/ 0.00</span>
                </div>
                <div class="d-flex justify-content-between fs-5 fw-bold border-top pt-2 mt-2" style="color:var(--spa-espresso);">
                  <span>TOTAL NETO LIQUIDADO:</span>
                  <span id="voucherTotalLiquidado" style="color:var(--spa-dorado-oscuro, #8a7042);">S/ 0.00</span>
                </div>
              </div>

              <!-- Firmas de Conformidad -->
              <div class="row mt-5 pt-3 text-center small text-muted" style="border-top:1px dashed #dcd7ce;">
                <div class="col-6">
                  <div style="border-bottom:1px solid #6c757d; width:80%; margin:0 auto 6px auto;"></div>
                  <span>Administración VIVI Spa</span>
                </div>
                <div class="col-6">
                  <div style="border-bottom:1px solid #6c757d; width:80%; margin:0 auto 6px auto;"></div>
                  <span id="voucherFirmaEspecialista">Firma Especialista</span>
                </div>
              </div>
            </div>
          </div>

          <div class="spa-modal-footer">
            <button type="button" class="btn btn-outline-secondary" id="modalVoucherCloseBtn2">Cerrar</button>
            <button type="button" class="btn btn-primary" id="btnImprimirVoucher">
              <i class="bi bi-printer me-1"></i>Imprimir Voucher
            </button>
          </div>
        </div>
      </div>

      <!-- 3. MODAL REGLAS DE COMISIÓN -->
      <div class="spa-modal-backdrop" id="modalReglasBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-md" style="max-width: 620px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2>Configuración de Reglas de Comisión</h2>
              <p>Establece los porcentajes acordados por especialista y especialidad del spa.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalReglasCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formReglas" novalidate>
            <div class="spa-modal-body">
              <div class="alert alert-info py-2 px-3 small mb-3" style="background:#eef6fc; border-color:#d0e6f7; color:#18538a; border-radius:6px;">
                <i class="bi bi-info-circle-fill me-1"></i>
                Las comisiones se calculan automáticamente sobre la tarifa del servicio cuando la cita se marca como completada.
              </div>

              <div id="reglasListContainer">
                <!-- Se puebla dinámicamente con las 4 especialistas -->
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-secondary" id="modalReglasCancelBtn">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btnGuardarReglas">
                <i class="bi bi-check2 me-1"></i>Guardar Reglas
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    bindModalEvents();
  }

  function bindModalEvents() {
    const modalPairs = [
      { bd: 'modalLiquidarBackdrop', close: ['modalLiquidarCloseBtn', 'modalLiquidarCancelBtn'] },
      { bd: 'modalVoucherBackdrop', close: ['modalVoucherCloseBtn', 'modalVoucherCloseBtn2'] },
      { bd: 'modalReglasBackdrop', close: ['modalReglasCloseBtn', 'modalReglasCancelBtn'] }
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

    // Select Especialista en Liquidación
    const espSelect = document.getElementById('liquidarEspecialistaSelect');
    if (espSelect) {
      espSelect.addEventListener('change', () => {
        cargarComisionesDeEspecialista(espSelect.value);
      });
    }

    // Checkbox seleccionar todas
    const checkAll = document.getElementById('checkSelectAllComisiones');
    if (checkAll) {
      checkAll.addEventListener('change', () => {
        const checks = document.querySelectorAll('.check-item-comision');
        checks.forEach(c => { c.checked = checkAll.checked; });
        recalcularTotalesLiquidacion();
      });
    }

    // Submit Liquidación
    const formLiquidar = document.getElementById('formLiquidar');
    if (formLiquidar) {
      formLiquidar.addEventListener('submit', (e) => {
        e.preventDefault();
        submitLiquidacion();
      });
    }

    // Submit Reglas
    const formReglas = document.getElementById('formReglas');
    if (formReglas) {
      formReglas.addEventListener('submit', (e) => {
        e.preventDefault();
        submitReglas();
      });
    }

    // Imprimir Voucher
    const btnPrintVoucher = document.getElementById('btnImprimirVoucher');
    if (btnPrintVoucher) {
      btnPrintVoucher.addEventListener('click', () => {
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

  function poblarEspecialistasEnSelect(preselectedId = null) {
    const sel = document.getElementById('liquidarEspecialistaSelect');
    if (!sel) return;

    const especialistas = SpaStore.getEspecialistas();
    let options = '<option value="">-- Seleccionar Especialista --</option>';
    especialistas.forEach(esp => {
      const selected = (preselectedId && esp.id === preselectedId) ? 'selected' : '';
      options += `<option value="${esp.id}" ${selected}>${esp.nombre} (${esp.especialidad} - ${esp.comisionPct || 25}%)</option>`;
    });
    sel.innerHTML = options;

    if (preselectedId) {
      cargarComisionesDeEspecialista(preselectedId);
    }
  }

  function cargarComisionesDeEspecialista(espId) {
    const tbody = document.getElementById('liquidarComisionesTbody');
    const checkAll = document.getElementById('checkSelectAllComisiones');
    const btnSubmit = document.getElementById('btnConfirmarLiquidacion');

    if (!tbody) return;

    if (!espId) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Seleccione una especialista para cargar sus servicios pendientes.</td></tr>';
      recalcularTotalesLiquidacion();
      if (btnSubmit) btnSubmit.disabled = true;
      return;
    }

    const comisiones = SpaStore.getComisiones({ especialistaId: espId });
    const liquidables = comisiones.filter(c => c.estado === 'pendiente' || c.estado === 'aprobada');

    if (!liquidables.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted"><i class="bi bi-check2-circle text-success fs-5 d-block mb-1"></i>Esta especialista no tiene comisiones pendientes ni aprobadas por liquidar.</td></tr>';
      if (checkAll) checkAll.checked = false;
      recalcularTotalesLiquidacion();
      if (btnSubmit) btnSubmit.disabled = true;
      return;
    }

    let rowsHTML = '';
    liquidables.forEach((c, idx) => {
      const badgeEstado = c.estado === 'aprobada'
        ? '<span class="badge" style="background:#eef6fc; color:#18538a; font-weight:600;">Aprobada</span>'
        : '<span class="badge" style="background:#fff8e6; color:#856404; font-weight:600;">Pendiente</span>';

      rowsHTML += `
        <tr>
          <td class="text-center">
            <input class="form-check-input check-item-comision" type="checkbox" value="${c.id}" data-precio="${c.precioServicio}" data-monto="${c.montoComision}" checked>
          </td>
          <td><b>${c.fecha}</b><br><small class="text-muted">${c.hora || ''}</small></td>
          <td><b>${c.clienteNombre}</b><br><small class="text-muted">${c.citaCodigo || ''}</small></td>
          <td>${c.servicioNombre}</td>
          <td class="text-end">${SpaStore.formatMoney(c.precioServicio)}</td>
          <td class="text-center"><span class="badge bg-light text-dark border">${c.porcentajeComision}%</span></td>
          <td class="text-end fw-bold text-success">${SpaStore.formatMoney(c.montoComision)}</td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHTML;
    if (checkAll) checkAll.checked = true;

    // Vincular listeners a cada checkbox
    document.querySelectorAll('.check-item-comision').forEach(cb => {
      cb.addEventListener('change', recalcularTotalesLiquidacion);
    });

    recalcularTotalesLiquidacion();
    if (btnSubmit) btnSubmit.disabled = false;
  }

  function recalcularTotalesLiquidacion() {
    const checks = document.querySelectorAll('.check-item-comision:checked');
    let totalFact = 0;
    let totalCom = 0;

    checks.forEach(cb => {
      totalFact += parseFloat(cb.getAttribute('data-precio')) || 0;
      totalCom += parseFloat(cb.getAttribute('data-monto')) || 0;
    });

    document.getElementById('liquidarCantServicios').textContent = `${checks.length} servicio(s)`;
    document.getElementById('liquidarTotalFacturado').textContent = SpaStore.formatMoney(totalFact);
    document.getElementById('liquidarMontoTotal').textContent = SpaStore.formatMoney(totalCom);

    const btnSubmit = document.getElementById('btnConfirmarLiquidacion');
    if (btnSubmit) {
      btnSubmit.disabled = checks.length === 0;
    }
  }

  function submitLiquidacion() {
    const espId = document.getElementById('liquidarEspecialistaSelect').value;
    const checks = document.querySelectorAll('.check-item-comision:checked');
    const comisionesIds = Array.from(checks).map(cb => cb.value);

    if (!espId || !comisionesIds.length) {
      SpaUI.showToast('Selección Incompleta', 'Debe seleccionar al menos una comisión para emitir la liquidación.', 'warning');
      return;
    }

    const metodoPago = document.getElementById('liquidarMetodoPago').value;
    const numOp = document.getElementById('liquidarNumOperacion').value.trim();
    const registrarEgreso = document.getElementById('liquidarRegistrarEgreso').checked;
    const notas = document.getElementById('liquidarNotas').value.trim();

    const res = SpaStore.liquidarComisiones({
      especialistaId: espId,
      comisionesIds: comisionesIds,
      metodoPago: metodoPago,
      numeroOperacion: numOp,
      notas: notas,
      registrarEgresoCaja: registrarEgreso
    });

    if (!res.success) {
      SpaUI.showToast('Error al liquidar', res.message, 'error');
      return;
    }

    SpaUI.showToast('Liquidación Exitosa', res.message, 'success');
    hideModal('modalLiquidarBackdrop');

    if (typeof onCommissionChangedCallback === 'function') {
      onCommissionChangedCallback(res.data);
    }
    window.dispatchEvent(new CustomEvent('spa:comisiones-changed', { detail: res.data }));

    // Mostrar voucher inmediatamente
    openVoucherModal(res.data.id);
  }

  function openVoucherModal(liquidacionId) {
    ensureModalMarkup();
    const liq = SpaStore.getLiquidacionById(liquidacionId);
    if (!liq) {
      SpaUI.showToast('Voucher no encontrado', 'No se localizó la liquidación solicitada.', 'warning');
      return;
    }

    document.getElementById('voucherCodigo').textContent = liq.codigo;
    document.getElementById('voucherEspecialista').textContent = liq.especialistaNombre;
    document.getElementById('voucherFechaHora').textContent = `${liq.fechaLiquidacion} ${liq.hora}`;
    document.getElementById('voucherPeriodo').textContent = liq.periodo || 'Liquidación de Servicios';
    document.getElementById('voucherMetodo').textContent = `${liq.metodoPago} ${liq.numeroOperacion ? '(' + liq.numeroOperacion + ')' : ''}`;
    document.getElementById('voucherTotalServicios').textContent = liq.totalServicios;
    document.getElementById('voucherTotalFacturado').textContent = SpaStore.formatMoney(liq.totalFacturado);
    document.getElementById('voucherTotalLiquidado').textContent = SpaStore.formatMoney(liq.montoTotal);
    document.getElementById('voucherFirmaEspecialista').textContent = liq.especialistaNombre;

    // Poblar ítems liquidados
    const allComs = SpaStore.getComisiones();
    const items = allComs.filter(c => liq.comisionesIds && liq.comisionesIds.includes(c.id));

    const tbody = document.getElementById('voucherItemsTable');
    if (tbody) {
      let rowsHTML = '';
      items.forEach(item => {
        rowsHTML += `
          <tr>
            <td><b>${item.servicioNombre}</b><br><small class="text-muted">${item.fecha} • ${item.clienteNombre}</small></td>
            <td class="text-center">${item.porcentajeComision}%</td>
            <td class="text-end">${SpaStore.formatMoney(item.precioServicio)}</td>
            <td class="text-end fw-bold">${SpaStore.formatMoney(item.montoComision)}</td>
          </tr>
        `;
      });
      tbody.innerHTML = rowsHTML || '<tr><td colspan="4" class="text-center text-muted">Servicios liquidados</td></tr>';
    }

    showModal('modalVoucherBackdrop');
  }

  function openReglasModal() {
    ensureModalMarkup();
    const container = document.getElementById('reglasListContainer');
    if (!container) return;

    const especialistas = SpaStore.getEspecialistas();
    const reglas = SpaStore.getReglasComision();

    let formHTML = '';
    especialistas.forEach(esp => {
      const regla = reglas.find(r => r.especialistaId === esp.id);
      const pct = regla ? regla.porcentaje : (esp.comisionPct || 25);

      formHTML += `
        <div class="p-3 mb-3 rounded" style="background:var(--spa-crema-subtle); border:1px solid var(--spa-crema-borde);">
          <div class="row g-2 align-items-center">
            <div class="col-12 col-md-6">
              <b>${esp.nombre}</b>
              <small class="text-muted d-block">${esp.especialidad} • Cat: ${esp.categoria.toUpperCase()}</small>
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label small text-muted mb-1">Porcentaje de Comisión (%)</label>
              <div class="input-group">
                <input type="number" step="1" min="0" max="100" class="form-control fw-bold regla-input" data-espid="${esp.id}" value="${pct}" required>
                <span class="input-group-text">%</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = formHTML;
    showModal('modalReglasBackdrop');
  }

  function submitReglas() {
    const inputs = document.querySelectorAll('.regla-input');
    let error = false;

    inputs.forEach(input => {
      const espId = input.getAttribute('data-espid');
      const pct = parseFloat(input.value);

      if (isNaN(pct) || pct < 0 || pct > 100) {
        error = true;
        input.classList.add('is-invalid');
      } else {
        input.classList.remove('is-invalid');
        SpaStore.guardarReglaComision({
          especialistaId: espId,
          porcentaje: pct
        });
      }
    });

    if (error) {
      SpaUI.showToast('Porcentajes Inválidos', 'Los porcentajes deben encontrarse entre 0% y 100%.', 'warning');
      return;
    }

    SpaUI.showToast('Reglas Actualizadas', 'Se han actualizado correctamente los porcentajes de comisiones.', 'success');
    hideModal('modalReglasBackdrop');

    if (typeof onCommissionChangedCallback === 'function') {
      onCommissionChangedCallback();
    }
    window.dispatchEvent(new CustomEvent('spa:comisiones-changed'));
  }

  function openLiquidarModal(options = {}) {
    ensureModalMarkup();
    poblarEspecialistasEnSelect(options.especialistaId || null);
    if (options.onSaved) {
      onCommissionChangedCallback = options.onSaved;
    }
    showModal('modalLiquidarBackdrop');
  }

  return {
    openLiquidarModal,
    openVoucherModal,
    openReglasModal
  };
});
