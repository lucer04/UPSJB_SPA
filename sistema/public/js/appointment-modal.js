/**
 * VIVI SPA & ESTUDIO - APPOINTMENT MODAL CONTROLLER
 * Controlador reutilizable para Nueva Cita / Edición de Cita.
 * Compatible con Citas y Dashboard.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./spa-store', './spa-ui'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./spa-store'), require('./spa-ui'));
  } else {
    root.AppointmentModal = factory(root.SpaStore, root.SpaUI);
  }
})(typeof self !== 'undefined' ? self : this, function (SpaStore, SpaUI) {
  'use strict';

  let initialized = false;
  let onSavedCallback = null;
  let currentEditingCitaId = null;

  // Inyectar HTML del Modal en el DOM si no existe
  function ensureModalMarkup() {
    if (document.getElementById('modalCitaBackdrop')) return;

    const modalHTML = `
      <!-- MODAL PRINCIPAL DE CITAS -->
      <div class="spa-modal-backdrop" id="modalCitaBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-lg">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="modalCitaTitle">Nueva Cita</h2>
              <p id="modalCitaSubtitle">Programa un servicio asignando clienta, especialista, cabina y horario.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalCitaCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formCita" novalidate>
            <input type="hidden" id="citaId" name="id">

            <div class="spa-modal-body">
              <div class="form-alert-box d-none"></div>

              <!-- SECCIÓN 1: DATOS DE LA CLIENTA -->
              <div class="form-section-title">
                <i class="bi bi-person-heart"></i> 1. Clienta
              </div>
              <div class="row g-3">
                <div class="col-12 col-md-8">
                  <label for="citaClienteId" class="form-label">Clienta <span class="req">*</span></label>
                  <div class="input-group">
                    <select class="form-select" id="citaClienteId" name="clienteId" required>
                      <option value="">Seleccione una clienta...</option>
                    </select>
                    <button type="button" class="btn btn-outline-spa" id="btnOpenQuickClient" title="Registrar clienta nueva sin salir">
                      <i class="bi bi-person-plus-fill me-1"></i>+ Nueva
                    </button>
                  </div>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-4">
                  <label for="citaEstado" class="form-label">Estado Inicial</label>
                  <select class="form-select" id="citaEstado" name="estado">
                    <option value="confirmada">Confirmada</option>
                    <option value="pendiente">Pendiente por confirmar</option>
                    <option value="en_curso">En curso</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <!-- Preview informativo de la clienta seleccionada -->
                <div class="col-12">
                  <div id="clientPreviewCard" class="p-2 border rounded bg-light d-none" style="font-size: 11.5px;">
                    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div>
                        <b id="previewCliNombre" class="text-dark"></b> · 
                        <span id="previewCliDoc" class="text-muted"></span> · 
                        <span id="previewCliTel" class="text-muted"></span>
                      </div>
                      <span id="previewCliAlergiasBadge" class="badge bg-warning text-dark"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SECCIÓN 2: SERVICIO -->
              <div class="form-section-title mt-4">
                <i class="bi bi-stars"></i> 2. Servicio
              </div>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label for="citaServicioId" class="form-label">Servicio <span class="req">*</span></label>
                  <select class="form-select" id="citaServicioId" name="servicioId" required>
                    <option value="">Seleccione un servicio...</option>
                  </select>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-6 col-md-3">
                  <label for="citaDuracionMin" class="form-label">Duración (min) <span class="req">*</span></label>
                  <div class="input-group">
                    <input type="number" class="form-control" id="citaDuracionMin" name="duracionMin" min="15" max="360" step="15" required>
                    <span class="input-group-text bg-light text-muted small">min</span>
                  </div>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-6 col-md-3">
                  <label for="citaPrecio" class="form-label">Precio Regular <span class="req">*</span></label>
                  <div class="input-group">
                    <span class="input-group-text bg-light text-muted small">S/</span>
                    <input type="number" class="form-control" id="citaPrecio" name="precio" min="0" step="5" required>
                  </div>
                  <div class="invalid-feedback"></div>
                </div>
              </div>

              <!-- SECCIÓN 3: ESPECIALISTA, CABINA Y HORARIO -->
              <div class="form-section-title mt-4">
                <i class="bi bi-clock-history"></i> 3. Especialista, Cabina y Horario
              </div>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label for="citaEspecialistaId" class="form-label">Especialista <span class="req">*</span></label>
                  <select class="form-select" id="citaEspecialistaId" name="especialistaId" required>
                    <option value="">Seleccione especialista...</option>
                  </select>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="citaCabinaId" class="form-label">Cabina / Espacio <span class="req">*</span></label>
                  <select class="form-select" id="citaCabinaId" name="cabinaId" required>
                    <option value="">Seleccione cabina...</option>
                  </select>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-4">
                  <label for="citaFecha" class="form-label">Fecha de Cita <span class="req">*</span></label>
                  <input type="date" class="form-control" id="citaFecha" name="fecha" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-6 col-md-4">
                  <label for="citaHoraInicio" class="form-label">Hora Inicio <span class="req">*</span></label>
                  <input type="time" class="form-control" id="citaHoraInicio" name="horaInicio" min="09:00" max="19:30" step="900" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-6 col-md-4">
                  <label for="citaHoraFin" class="form-label">Hora Fin (calculada)</label>
                  <input type="time" class="form-control bg-light" id="citaHoraFin" readonly title="Calculada automáticamente a partir de la hora de inicio y la duración">
                </div>

                <!-- Feedback en vivo de disponibilidad -->
                <div class="col-12">
                  <div id="availabilityFeedback" class="d-none"></div>
                </div>
              </div>

              <!-- SECCIÓN 4: LIQUIDACIÓN Y OBSERVACIONES -->
              <div class="form-section-title mt-4">
                <i class="bi bi-cash-coin"></i> 4. Observaciones y Pago
              </div>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label for="citaNotas" class="form-label">Observaciones de la Cita</label>
                  <textarea class="form-control" id="citaNotas" name="notas" rows="2" placeholder="Indicaciones especiales, preferencias de temperatura, etc."></textarea>
                </div>

                <div class="col-12 col-md-6">
                  <div class="row g-2">
                    <div class="col-6">
                      <label for="citaDescuento" class="form-label">Descuento (S/)</label>
                      <input type="number" class="form-control" id="citaDescuento" name="descuento" min="0" value="0" step="5">
                    </div>
                    <div class="col-6">
                      <label for="citaTotal" class="form-label">Total a Cobrar</label>
                      <input type="text" class="form-control bg-light fw-bold text-dark" id="citaTotal" readonly value="S/ 0">
                    </div>
                    <div class="col-12 mt-2">
                      <label for="citaMetodoPago" class="form-label">Método de Pago</label>
                      <select class="form-select" id="citaMetodoPago" name="metodoPago">
                        <option value="pendiente">Por cobrar (Pendiente)</option>
                        <option value="tarjeta">Tarjeta Débito/Crédito</option>
                        <option value="efectivo">Efectivo en caja</option>
                        <option value="yape">Yape / Plin</option>
                        <option value="transferencia">Transferencia bancaria</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-spa" id="btnCancelCitaForm">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitCita">
                <i class="bi bi-check2-circle me-1"></i>Registrar Cita
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- SUB-MODAL RÁPIDO: REGISTRAR CLIENTA SIN SALIR DEL FORMULARIO DE CITA -->
      <div class="spa-modal-backdrop" id="modalQuickClientBackdrop" style="z-index: 1060;" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-sm" style="max-width: 520px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2>Registrar Clienta Rápida</h2>
              <p>Agrega los datos esenciales para continuar con la reserva de la cita.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalQuickClientCloseBtn" aria-label="Cerrar modal de clienta">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formQuickClient" novalidate>
            <div class="spa-modal-body">
              <div class="form-alert-box d-none"></div>

              <div class="row g-2">
                <div class="col-6">
                  <label for="qcNombres" class="form-label">Nombres <span class="req">*</span></label>
                  <input type="text" class="form-control" id="qcNombres" name="nombres" placeholder="Ej. Camila" required>
                  <div class="invalid-feedback"></div>
                </div>
                <div class="col-6">
                  <label for="qcApellidos" class="form-label">Apellidos <span class="req">*</span></label>
                  <input type="text" class="form-control" id="qcApellidos" name="apellidos" placeholder="Ej. Vargas L." required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-5">
                  <label for="qcTipoDoc" class="form-label">Tipo Doc <span class="req">*</span></label>
                  <select class="form-select" id="qcTipoDoc" name="tipoDocumento">
                    <option value="DNI">DNI</option>
                    <option value="CE">C. Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div class="col-7">
                  <label for="qcNumDoc" class="form-label">N° Documento <span class="req">*</span></label>
                  <input type="text" class="form-control" id="qcNumDoc" name="numeroDocumento" placeholder="8 dígitos DNI" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-6">
                  <label for="qcTelefono" class="form-label">Teléfono <span class="req">*</span></label>
                  <input type="tel" class="form-control" id="qcTelefono" name="telefono" placeholder="9XX XXX XXX" required>
                  <div class="invalid-feedback"></div>
                </div>
                <div class="col-6">
                  <label for="qcEmail" class="form-label">Correo Electrónico</label>
                  <input type="email" class="form-control" id="qcEmail" name="email" placeholder="cliente@correo.com">
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12">
                  <label for="qcAlergias" class="form-label">Alergias o Contraindicaciones</label>
                  <input type="text" class="form-control" id="qcAlergias" name="alergias" placeholder="Sensibilidad a retinol, alcohol, ninguna, etc.">
                </div>
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-spa btn-sm" id="btnCancelQuickClient">Volver a la Cita</button>
              <button type="submit" class="btn btn-primary btn-sm" id="btnSubmitQuickClient">
                <i class="bi bi-person-check me-1"></i>Guardar y Seleccionar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL DE DETALLE DE CITA -->
      <div class="spa-modal-backdrop" id="modalCitaDetailBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-sm" style="max-width: 540px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="detailCitaCodigo">Detalle de la Cita</h2>
              <p id="detailCitaFechaHora" class="text-muted"></p>
            </div>
            <button type="button" class="spa-modal-close" id="modalCitaDetailCloseBtn" aria-label="Cerrar detalle">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="spa-modal-body" id="detailCitaBody">
            <!-- Renderizado dinámico -->
          </div>
          <div class="spa-modal-footer">
            <button type="button" class="btn btn-outline-spa btn-sm" id="btnDetailCerrar">Cerrar</button>
            <button type="button" class="btn btn-primary btn-sm" id="btnDetailEditar"><i class="bi bi-pencil me-1"></i>Editar Cita</button>
          </div>
        </div>
      </div>

      <!-- MODAL DE CONFIRMACIÓN DE CANCELACIÓN -->
      <div class="spa-modal-backdrop" id="modalCitaCancelBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-sm" style="max-width: 480px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 class="text-danger">Cancelar Cita</h2>
              <p id="cancelCitaSub">¿Estás seguro de cancelar esta reserva?</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalCitaCancelCloseBtn" aria-label="Cerrar">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="spa-modal-body">
            <input type="hidden" id="cancelCitaId">
            <p class="small text-muted mb-3">Al cancelar la cita, el horario y la cabina quedarán liberados inmediatamente para otras clientas.</p>
            <label for="cancelMotivo" class="form-label">Motivo de la Cancelación <span class="req">*</span></label>
            <textarea class="form-control" id="cancelMotivo" rows="2" placeholder="Ej. Solicitud de la clienta por viaje, imprevisto de salud, etc."></textarea>
            <div class="invalid-feedback" id="cancelMotivoFeedback"></div>
          </div>
          <div class="spa-modal-footer">
            <button type="button" class="btn btn-outline-spa btn-sm" id="btnCancelDismiss">Mantener Cita</button>
            <button type="button" class="btn btn-danger btn-sm" id="btnConfirmCancelCita">
              <i class="bi bi-x-circle me-1"></i>Confirmar Cancelación
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // Poblar Selectores de Clientes, Servicios, Especialistas y Cabinas
  function populateSelects(selectedClienteId = null, selectedServicioId = null, selectedEspId = null, selectedCabId = null) {
    const cliSel = document.getElementById('citaClienteId');
    const srvSel = document.getElementById('citaServicioId');
    const espSel = document.getElementById('citaEspecialistaId');
    const cabSel = document.getElementById('citaCabinaId');

    // Clientes
    const clientes = SpaStore.getClientes().filter(c => c.estado !== 'inactivo');
    cliSel.innerHTML = '<option value="">Seleccione una clienta...</option>' + 
      clientes.map(c => `<option value="${c.id}" ${c.id === selectedClienteId ? 'selected' : ''}>${c.nombreCompleto} (${c.tipoDocumento}: ${c.numeroDocumento})</option>`).join('');

    // Servicios
    const servicios = SpaStore.getServicios();
    srvSel.innerHTML = '<option value="">Seleccione un servicio...</option>' +
      servicios.map(s => `<option value="${s.id}" data-precio="${s.precio}" data-duracion="${s.duracionMin}" data-cabina="${s.cabinaRecomendada}" data-esp="${s.especialistaDefecto}" ${s.id === selectedServicioId ? 'selected' : ''}>${s.nombre} (${s.duracionMin} min - ${SpaStore.formatMoney(s.precio)})</option>`).join('');

    // Especialistas
    const especialistas = SpaStore.getEspecialistas().filter(e => e.estado === 'activa');
    espSel.innerHTML = '<option value="">Seleccione especialista...</option>' +
      especialistas.map(e => `<option value="${e.id}" data-cat="${e.categoria}" ${e.id === selectedEspId ? 'selected' : ''}>${e.nombre} · ${e.especialidad}</option>`).join('');

    // Cabinas
    const cabinas = SpaStore.getCabinas().filter(c => c.estado === 'activa');
    cabSel.innerHTML = '<option value="">Seleccione cabina...</option>' +
      cabinas.map(c => `<option value="${c.id}" data-esp="${c.especialidad}" ${c.id === selectedCabId ? 'selected' : ''}>${c.nombre} · ${c.tipo}</option>`).join('');
  }

  // Recalcular hora fin y total
  function recalculateFinAndTotal() {
    const horaInicio = document.getElementById('citaHoraInicio').value;
    const duracionMin = Number(document.getElementById('citaDuracionMin').value) || 0;
    const horaFinEl = document.getElementById('citaHoraFin');

    if (horaInicio && duracionMin > 0) {
      const startMin = SpaStore.timeToMinutes(horaInicio);
      const endMin = startMin + duracionMin;
      horaFinEl.value = SpaStore.minutesToTime(endMin);
    } else {
      horaFinEl.value = '';
    }

    const precio = Number(document.getElementById('citaPrecio').value) || 0;
    const descuento = Number(document.getElementById('citaDescuento').value) || 0;
    const total = Math.max(0, precio - descuento);
    document.getElementById('citaTotal').value = SpaStore.formatMoney(total);

    checkLiveAvailability();
  }

  // Verificación en vivo de disponibilidad sin bloquear
  function checkLiveAvailability() {
    const fecha = document.getElementById('citaFecha').value;
    const horaInicio = document.getElementById('citaHoraInicio').value;
    const horaFin = document.getElementById('citaHoraFin').value;
    const espId = document.getElementById('citaEspecialistaId').value;
    const cabId = document.getElementById('citaCabinaId').value;
    const feedbackEl = document.getElementById('availabilityFeedback');

    if (!feedbackEl) return;

    if (!fecha || !horaInicio || !horaFin || !espId || !cabId) {
      feedbackEl.className = 'd-none';
      feedbackEl.innerHTML = '';
      return;
    }

    const check = SpaStore.verificarDisponibilidad(
      fecha,
      horaInicio,
      horaFin,
      espId,
      cabId,
      currentEditingCitaId
    );

    feedbackEl.classList.remove('d-none');
    if (check.disponible) {
      feedbackEl.className = 'alert alert-success py-1 px-2 small d-flex align-items-center gap-2 mb-0';
      feedbackEl.innerHTML = '<i class="bi bi-check-circle-fill"></i> Horario, especialista y cabina disponibles.';
    } else {
      feedbackEl.className = 'alert alert-danger py-1 px-2 small d-flex align-items-center gap-2 mb-0';
      feedbackEl.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> ${check.mensaje}`;
    }
  }

  // Actualizar tarjeta preview de clienta
  function updateClientPreview() {
    const clienteId = document.getElementById('citaClienteId').value;
    const card = document.getElementById('clientPreviewCard');
    if (!clienteId) {
      card.classList.add('d-none');
      return;
    }
    const cli = SpaStore.getClienteById(clienteId);
    if (!cli) {
      card.classList.add('d-none');
      return;
    }

    card.classList.remove('d-none');
    document.getElementById('previewCliNombre').textContent = cli.nombreCompleto;
    document.getElementById('previewCliDoc').textContent = `${cli.tipoDocumento}: ${cli.numeroDocumento}`;
    document.getElementById('previewCliTel').textContent = `Tel: ${cli.telefono}`;

    const alergiasBadge = document.getElementById('previewCliAlergiasBadge');
    if (cli.alergias && cli.alergias.toLowerCase() !== 'ninguna') {
      alergiasBadge.textContent = `Alergias: ${cli.alergias}`;
      alergiasBadge.className = 'badge bg-warning text-dark';
      alergiasBadge.classList.remove('d-none');
    } else {
      alergiasBadge.classList.add('d-none');
    }
  }

  // Configurar listeners de interacción
  function setupEvents() {
    if (initialized) return;
    initialized = true;

    // Cerrar modal de citas
    document.getElementById('modalCitaCloseBtn').onclick = () => SpaUI.closeModal('modalCitaBackdrop');
    document.getElementById('btnCancelCitaForm').onclick = () => SpaUI.closeModal('modalCitaBackdrop');

    // Cerrar modal de detalle
    document.getElementById('modalCitaDetailCloseBtn').onclick = () => SpaUI.closeModal('modalCitaDetailBackdrop');
    document.getElementById('btnDetailCerrar').onclick = () => SpaUI.closeModal('modalCitaDetailBackdrop');

    // Cerrar modal de cancelación
    document.getElementById('modalCitaCancelCloseBtn').onclick = () => SpaUI.closeModal('modalCitaCancelBackdrop');
    document.getElementById('btnCancelDismiss').onclick = () => SpaUI.closeModal('modalCitaCancelBackdrop');

    // Botón para editar desde el detalle
    document.getElementById('btnDetailEditar').onclick = () => {
      const citaId = document.getElementById('detailCitaCodigo').getAttribute('data-cita-id');
      SpaUI.closeModal('modalCitaDetailBackdrop');
      if (citaId) {
        AppointmentModal.openEdit(citaId);
      }
    };

    // Client select change
    document.getElementById('citaClienteId').onchange = updateClientPreview;

    // Service select change: auto-cargar duración, precio, especialista y cabina recomendadas
    document.getElementById('citaServicioId').onchange = function () {
      const opt = this.options[this.selectedIndex];
      if (opt && opt.value) {
        const precio = opt.getAttribute('data-precio');
        const duracion = opt.getAttribute('data-duracion');
        const cabina = opt.getAttribute('data-cabina');
        const esp = opt.getAttribute('data-esp');

        if (precio) document.getElementById('citaPrecio').value = precio;
        if (duracion) document.getElementById('citaDuracionMin').value = duracion;
        if (cabina && !document.getElementById('citaCabinaId').value) {
          document.getElementById('citaCabinaId').value = cabina;
        }
        if (esp && !document.getElementById('citaEspecialistaId').value) {
          document.getElementById('citaEspecialistaId').value = esp;
        }
      }
      recalculateFinAndTotal();
    };

    // Inputs que recalculan
    ['citaHoraInicio', 'citaDuracionMin', 'citaPrecio', 'citaDescuento', 'citaFecha', 'citaEspecialistaId', 'citaCabinaId'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', recalculateFinAndTotal);
        el.addEventListener('change', recalculateFinAndTotal);
      }
    });

    // Envío del Formulario de Cita
    document.getElementById('formCita').onsubmit = function (e) {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitCita');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';

      const formData = {
        id: currentEditingCitaId || null,
        clienteId: document.getElementById('citaClienteId').value,
        servicioId: document.getElementById('citaServicioId').value,
        especialistaId: document.getElementById('citaEspecialistaId').value,
        cabinaId: document.getElementById('citaCabinaId').value,
        fecha: document.getElementById('citaFecha').value,
        horaInicio: document.getElementById('citaHoraInicio').value,
        duracionMin: document.getElementById('citaDuracionMin').value,
        precio: document.getElementById('citaPrecio').value,
        descuento: document.getElementById('citaDescuento').value,
        estado: document.getElementById('citaEstado').value,
        notas: document.getElementById('citaNotas').value,
        metodoPago: document.getElementById('citaMetodoPago').value
      };

      const result = SpaStore.guardarCita(formData);

      if (!result.success) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = currentEditingCitaId ? '<i class="bi bi-check2-circle me-1"></i>Actualizar Cita' : '<i class="bi bi-check2-circle me-1"></i>Registrar Cita';
        SpaUI.applyFormErrors(this, result.errors);
        SpaUI.showToast('Error al guardar', 'Revisa los campos señalados en el formulario.', 'error');
        return;
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Guardar Cita';

      SpaUI.closeModal('modalCitaBackdrop');
      SpaUI.showToast('¡Cita Guardada!', result.message, 'success');

      if (typeof onSavedCallback === 'function') {
        onSavedCallback(result.data);
      }
    };

    // SUB-MODAL CLIENTA RÁPIDA
    document.getElementById('btnOpenQuickClient').onclick = function () {
      document.getElementById('formQuickClient').reset();
      SpaUI.clearFormErrors(document.getElementById('formQuickClient'));
      SpaUI.openModal('modalQuickClientBackdrop', this);
    };

    document.getElementById('modalQuickClientCloseBtn').onclick = () => SpaUI.closeModal('modalQuickClientBackdrop');
    document.getElementById('btnCancelQuickClient').onclick = () => SpaUI.closeModal('modalQuickClientBackdrop');

    document.getElementById('formQuickClient').onsubmit = function (e) {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitQuickClient');
      submitBtn.disabled = true;

      const clientData = {
        nombres: document.getElementById('qcNombres').value,
        apellidos: document.getElementById('qcApellidos').value,
        tipoDocumento: document.getElementById('qcTipoDoc').value,
        numeroDocumento: document.getElementById('qcNumDoc').value,
        telefono: document.getElementById('qcTelefono').value,
        email: document.getElementById('qcEmail').value,
        alergias: document.getElementById('qcAlergias').value,
        estado: 'activo'
      };

      const res = SpaStore.guardarCliente(clientData);
      submitBtn.disabled = false;

      if (!res.success) {
        SpaUI.applyFormErrors(this, res.errors);
        return;
      }

      // Cerrar submodal
      SpaUI.closeModal('modalQuickClientBackdrop');
      SpaUI.showToast('Clienta Registrada', `${res.data.nombreCompleto} ha sido seleccionada para esta cita.`, 'success');

      // Actualizar select de clientas y seleccionar automáticamente a la nueva
      populateSelects(
        res.data.id,
        document.getElementById('citaServicioId').value,
        document.getElementById('citaEspecialistaId').value,
        document.getElementById('citaCabinaId').value
      );
      updateClientPreview();
    };

    // CONFIRMACIÓN DE CANCELACIÓN
    document.getElementById('btnConfirmCancelCita').onclick = function () {
      const citaId = document.getElementById('cancelCitaId').value;
      const motivo = document.getElementById('cancelMotivo').value.trim();
      const feedback = document.getElementById('cancelMotivoFeedback');

      if (!motivo) {
        document.getElementById('cancelMotivo').classList.add('is-invalid');
        feedback.textContent = 'Debes ingresar un motivo para registrar la cancelación.';
        feedback.classList.add('d-block');
        return;
      }

      const res = SpaStore.cancelarCita(citaId, motivo);
      SpaUI.closeModal('modalCitaCancelBackdrop');

      if (res.success) {
        SpaUI.showToast('Cita Cancelada', 'El horario y cabina han sido liberados.', 'info');
        if (typeof onSavedCallback === 'function') {
          onSavedCallback(res.data);
        }
      } else {
        SpaUI.showToast('Error', res.message, 'error');
      }
    };
  }

  // OBJETO PÚBLICO
  const AppointmentModal = {
    init(options = {}) {
      options = options || {};
      ensureModalMarkup();
      setupEvents();
      if (options.onSaved) {
        onSavedCallback = options.onSaved;
      }
    },

    openNew(defaults = {}, triggerElement = null) {
      this.init();
      defaults = defaults || {};
      currentEditingCitaId = null;

      const form = document.getElementById('formCita');
      form.reset();
      SpaUI.clearFormErrors(form);

      document.getElementById('modalCitaTitle').textContent = 'Nueva Cita';
      document.getElementById('modalCitaSubtitle').textContent = 'Programa un servicio asignando clienta, especialista, cabina y horario.';
      document.getElementById('citaId').value = '';
      const submitBtn = document.getElementById('btnSubmitCita');
      if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Registrar Cita';

      const fecha = defaults.fecha || SpaStore.getTodayDateString();
      const horaInicio = defaults.horaInicio || '10:00';

      document.getElementById('citaFecha').value = fecha;
      document.getElementById('citaHoraInicio').value = horaInicio;
      document.getElementById('citaEstado').value = defaults.estado || 'confirmada';

      populateSelects(
        defaults.clienteId || null,
        defaults.servicioId || null,
        defaults.especialistaId || null,
        defaults.cabinaId || null
      );

      // Si venía un servicio preseleccionado, cargar sus valores
      if (defaults.servicioId) {
        const srv = SpaStore.getServicioById(defaults.servicioId);
        if (srv) {
          document.getElementById('citaPrecio').value = srv.precio;
          document.getElementById('citaDuracionMin').value = srv.duracionMin;
        }
      } else {
        document.getElementById('citaDuracionMin').value = 90;
        document.getElementById('citaPrecio').value = 120;
      }

      updateClientPreview();
      recalculateFinAndTotal();

      SpaUI.openModal('modalCitaBackdrop', triggerElement);
    },

    openEdit(citaId, triggerElement = null) {
      this.init();
      const cita = SpaStore.getCitaById(citaId);
      if (!cita) {
        SpaUI.showToast('Error', 'La cita solicitada no existe.', 'error');
        return;
      }

      currentEditingCitaId = citaId;

      const form = document.getElementById('formCita');
      form.reset();
      SpaUI.clearFormErrors(form);

      document.getElementById('modalCitaTitle').textContent = `Editar Cita ${cita.codigo}`;
      document.getElementById('modalCitaSubtitle').textContent = `Modifica los horarios, servicios o recursos de la cita.`;
      document.getElementById('citaId').value = cita.id;

      populateSelects(cita.clienteId, cita.servicioId, cita.especialistaId, cita.cabinaId);

      document.getElementById('citaFecha').value = cita.fecha;
      document.getElementById('citaHoraInicio').value = cita.horaInicio;
      document.getElementById('citaDuracionMin').value = cita.duracionMin;
      document.getElementById('citaPrecio').value = cita.precio;
      document.getElementById('citaDescuento').value = cita.descuento || 0;
      document.getElementById('citaEstado').value = cita.estado;
      document.getElementById('citaNotas').value = cita.notas || '';
      document.getElementById('citaMetodoPago').value = cita.metodoPago || 'pendiente';

      updateClientPreview();
      recalculateFinAndTotal();

      SpaUI.openModal('modalCitaBackdrop', triggerElement);
    },

    openDetail(citaId, triggerElement = null) {
      this.init();
      const cita = SpaStore.getCitaById(citaId);
      if (!cita) {
        SpaUI.showToast('Error', 'La cita no existe.', 'error');
        return;
      }

      const client = SpaStore.getClienteById(cita.clienteId);

      document.getElementById('detailCitaCodigo').textContent = `${cita.codigo} · ${cita.servicioNombre}`;
      document.getElementById('detailCitaCodigo').setAttribute('data-cita-id', cita.id);
      document.getElementById('detailCitaFechaHora').textContent = `${SpaStore.formatDateFriendly(cita.fecha)} de ${cita.horaInicio} a ${cita.horaFin}`;

      let estadoBadge = `<span class="pl ${cita.estado}">${cita.estado.toUpperCase().replace('_', ' ')}</span>`;

      document.getElementById('detailCitaBody').innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-3">
          <span class="text-secondary small fw-semibold">Estado actual:</span>
          ${estadoBadge}
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span>Clienta</span>
            <b>${cita.clienteNombre}</b>
            <small class="text-muted d-block mt-1"><i class="bi bi-telephone me-1"></i>${cita.clienteTelefono || '-'}</small>
          </div>
          <div class="detail-item">
            <span>Especialista</span>
            <b>${cita.especialistaNombre}</b>
            <small class="text-muted d-block mt-1">${cita.servicioCategoria.toUpperCase()}</small>
          </div>
          <div class="detail-item">
            <span>Cabina / Espacio</span>
            <b>${cita.cabinaNombre}</b>
          </div>
          <div class="detail-item">
            <span>Duración</span>
            <b>${cita.duracionMin} minutos</b>
          </div>
          <div class="detail-item">
            <span>Importe Total</span>
            <b class="text-primary">${SpaStore.formatMoney(cita.total || cita.precio)}</b>
            <small class="text-muted d-block mt-1">Pago: ${(cita.metodoPago || 'Pendiente').toUpperCase()}</small>
          </div>
          <div class="detail-item">
            <span>Observaciones</span>
            <b class="fw-normal" style="font-size: 11.5px;">${cita.notas || 'Sin observaciones registradas.'}</b>
          </div>
        </div>

        ${cita.motivoCancelacion ? `
          <div class="spa-alert alert-danger mt-3 mb-0">
            <i class="bi bi-x-octagon-fill"></i>
            <div>
              <b>Motivo de Cancelación:</b>
              <div>${cita.motivoCancelacion}</div>
            </div>
          </div>
        ` : ''}

        ${client && client.alergias && client.alergias.toLowerCase() !== 'ninguna' ? `
          <div class="spa-alert alert-info mt-3 mb-0">
            <i class="bi bi-info-circle-fill"></i>
            <div>
              <b>Alergias registradas de la clienta:</b>
              <div>${client.alergias}</div>
            </div>
          </div>
        ` : ''}
      `;

      SpaUI.openModal('modalCitaDetailBackdrop', triggerElement);
    },

    openCancel(citaId, triggerElement = null) {
      this.init();
      const cita = SpaStore.getCitaById(citaId);
      if (!cita) return;

      document.getElementById('cancelCitaId').value = cita.id;
      document.getElementById('cancelCitaSub').textContent = `¿Confirmas la cancelación de la cita ${cita.codigo} de ${cita.clienteNombre}?`;
      document.getElementById('cancelMotivo').value = '';
      document.getElementById('cancelMotivo').classList.remove('is-invalid');
      document.getElementById('cancelMotivoFeedback').classList.remove('d-block');

      SpaUI.openModal('modalCitaCancelBackdrop', triggerElement);
    }
  };

  return AppointmentModal;
});
