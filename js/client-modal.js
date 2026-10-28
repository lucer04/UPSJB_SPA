/**
 * VIVI SPA & ESTUDIO - CLIENT MODAL CONTROLLER
 * Controlador reutilizable para Registro, Edición y Ficha de Historial de Clientas.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./spa-store', './spa-ui'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./spa-store'), require('./spa-ui'));
  } else {
    root.ClientModal = factory(root.SpaStore, root.SpaUI);
  }
})(typeof self !== 'undefined' ? self : this, function (SpaStore, SpaUI) {
  'use strict';

  let initialized = false;
  let onSavedCallback = null;
  let currentEditingClienteId = null;

  function ensureModalMarkup() {
    if (document.getElementById('modalClienteBackdrop')) return;

    const modalHTML = `
      <!-- MODAL DE CLIENTA (CREAR / EDITAR) -->
      <div class="spa-modal-backdrop" id="modalClienteBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-md" style="max-width: 640px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="modalClienteTitle">Nueva Clienta</h2>
              <p id="modalClienteSubtitle">Registra los datos personales, de contacto y notas clínicas de la clienta.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalClienteCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formCliente" novalidate>
            <input type="hidden" id="cliId" name="id">

            <div class="spa-modal-body">
              <div class="form-alert-box d-none"></div>

              <!-- SECCIÓN 1: DATOS PERSONALES -->
              <div class="form-section-title">
                <i class="bi bi-person-badge"></i> 1. Datos Personales
              </div>
              <div class="row g-2">
                <div class="col-12 col-md-6">
                  <label for="cliNombres" class="form-label">Nombres <span class="req">*</span></label>
                  <input type="text" class="form-control" id="cliNombres" name="nombres" placeholder="Ej. Mariana" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="cliApellidos" class="form-label">Apellidos <span class="req">*</span></label>
                  <input type="text" class="form-control" id="cliApellidos" name="apellidos" placeholder="Ej. Paz Benavides" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-5 col-md-4">
                  <label for="cliTipoDoc" class="form-label">Tipo Doc <span class="req">*</span></label>
                  <select class="form-select" id="cliTipoDoc" name="tipoDocumento">
                    <option value="DNI">DNI</option>
                    <option value="CE">C. Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div class="col-7 col-md-5">
                  <label for="cliNumDoc" class="form-label">N° de Documento <span class="req">*</span></label>
                  <input type="text" class="form-control" id="cliNumDoc" name="numeroDocumento" placeholder="8 dígitos DNI" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-3">
                  <label for="cliEstado" class="form-label">Estado</label>
                  <select class="form-select" id="cliEstado" name="estado">
                    <option value="activo">Activa</option>
                    <option value="inactivo">Inactiva</option>
                  </select>
                </div>

                <div class="col-12 col-md-6">
                  <label for="cliFechaNac" class="form-label">Fecha de Nacimiento</label>
                  <input type="date" class="form-control" id="cliFechaNac" name="fechaNacimiento">
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="cliTelefono" class="form-label">Tel\u00e9fono \u003cspan class="req"\u003e*\u003c/span\u003e</label>
                  <input type="tel" class="form-control" id="cliTelefono" name="telefono" placeholder="Ej: 987654321  o  +51 987 654 321" autocomplete="tel" required>
                  <div class="invalid-feedback"></div>
                  <small class="text-muted" style="font-size:10.5px;">Peruano (9 d\u00edgitos) o internacional con c\u00f3digo de pa\u00eds (+51, +1, +34\u2026)</small>
                </div>

                <div class="col-12">
                  <label for="cliEmail" class="form-label">Correo Electrónico</label>
                  <input type="email" class="form-control" id="cliEmail" name="email" placeholder="clienta@correo.com">
                  <div class="invalid-feedback"></div>
                </div>
              </div>

              <!-- SECCIÓN 2: ALERGIAS Y PREFERENCIAS -->
              <div class="form-section-title mt-4">
                <i class="bi bi-shield-exclamation"></i> 2. Alergias y Preferencias Clínicas
              </div>
              <div class="row g-2">
                <div class="col-12">
                  <label for="cliAlergias" class="form-label">Alergias o Contraindicaciones Dérmicas</label>
                  <input type="text" class="form-control" id="cliAlergias" name="alergias" placeholder="Sensibilidad a retinol, alcohol, ácido glicólico, etc. (o 'Ninguna')">
                  <small class="text-muted" style="font-size: 11px;">Esta información aparecerá destacada con alertas preventivas al programar citas.</small>
                </div>

                <div class="col-12 mt-2">
                  <label for="cliPreferencias" class="form-label">Preferencias de Atención y Notas</label>
                  <textarea class="form-control" id="cliPreferencias" name="preferencias" rows="2" placeholder="Temperatura favorita, presión de masaje, productos predilectos, etc."></textarea>
                </div>
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-spa" id="btnCancelClienteForm">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitCliente">
                <i class="bi bi-check2-circle me-1"></i>Guardar Clienta
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL FICHA DE CLIENTA E HISTORIAL DE CITAS -->
      <div class="spa-modal-backdrop" id="modalClienteDetailBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-lg" style="max-width: 820px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="detailCliNombre">Ficha Técnica de la Clienta</h2>
              <p id="detailCliCodigo" class="text-muted"></p>
            </div>
            <button type="button" class="spa-modal-close" id="modalCliDetailCloseBtn" aria-label="Cerrar ficha">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="spa-modal-body" id="detailCliBody">
            <!-- Renderizado dinámico -->
          </div>

          <div class="spa-modal-footer">
            <button type="button" class="btn btn-outline-spa btn-sm" id="btnDetailCliCerrar">Cerrar</button>
            <button type="button" class="btn btn-outline-spa btn-sm" id="btnDetailCliEditar">
              <i class="bi bi-pencil me-1"></i>Editar Datos
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="btnDetailCliAgendar">
              <i class="bi bi-calendar-plus me-1"></i>Agendar Nueva Cita
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function setupEvents() {
    if (initialized) return;
    initialized = true;

    // Cerrar modal de cliente
    document.getElementById('modalClienteCloseBtn').onclick = () => SpaUI.closeModal('modalClienteBackdrop');
    document.getElementById('btnCancelClienteForm').onclick = () => SpaUI.closeModal('modalClienteBackdrop');

    // Cerrar ficha de cliente
    document.getElementById('modalCliDetailCloseBtn').onclick = () => SpaUI.closeModal('modalClienteDetailBackdrop');
    document.getElementById('btnDetailCliCerrar').onclick = () => SpaUI.closeModal('modalClienteDetailBackdrop');

    // Editar desde la ficha
    document.getElementById('btnDetailCliEditar').onclick = () => {
      const cliId = document.getElementById('modalClienteDetailBackdrop').getAttribute('data-cli-id');
      SpaUI.closeModal('modalClienteDetailBackdrop');
      if (cliId) {
        ClientModal.openEdit(cliId);
      }
    };

    // Agendar cita desde la ficha
    document.getElementById('btnDetailCliAgendar').onclick = () => {
      const cliId = document.getElementById('modalClienteDetailBackdrop').getAttribute('data-cli-id');
      SpaUI.closeModal('modalClienteDetailBackdrop');
      if (cliId && typeof AppointmentModal !== 'undefined') {
        AppointmentModal.openNew({ clienteId: cliId });
      }
    };

    // Envío del formulario de clienta
    document.getElementById('formCliente').onsubmit = function (e) {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitCliente');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';

      const formData = {
        id: currentEditingClienteId || null,
        nombres: document.getElementById('cliNombres').value,
        apellidos: document.getElementById('cliApellidos').value,
        tipoDocumento: document.getElementById('cliTipoDoc').value,
        numeroDocumento: document.getElementById('cliNumDoc').value,
        telefono: document.getElementById('cliTelefono').value,
        email: document.getElementById('cliEmail').value,
        fechaNacimiento: document.getElementById('cliFechaNac').value || null,
        alergias: document.getElementById('cliAlergias').value,
        preferencias: document.getElementById('cliPreferencias').value,
        estado: document.getElementById('cliEstado').value
      };

      const result = SpaStore.guardarCliente(formData);

      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Guardar Clienta';

      if (!result.success) {
        SpaUI.applyFormErrors(document.getElementById('formCliente'), result.errors);
        return;
      }

      SpaUI.closeModal('modalClienteBackdrop');
      SpaUI.showToast(
        currentEditingClienteId ? 'Clienta Actualizada' : 'Clienta Registrada',
        result.message,
        'success'
      );

      if (onSavedCallback) {
        onSavedCallback(result.data);
      }

      // Notificar cambio
      window.dispatchEvent(new CustomEvent('spastore:change', { detail: { type: 'cliente', data: result.data } }));
    };
  }

  const ClientModal = {
    init(options = {}) {
      options = options || {};
      ensureModalMarkup();
      setupEvents();
      if (options.onSaved) {
        onSavedCallback = options.onSaved;
      }
    },

    openNew(triggerElement = null, onSaved = null) {
      this.init();
      if (onSaved) onSavedCallback = onSaved;
      currentEditingClienteId = null;

      const form = document.getElementById('formCliente');
      form.reset();
      SpaUI.clearFormErrors(form);

      document.getElementById('modalClienteTitle').textContent = 'Nueva Clienta';
      document.getElementById('modalClienteSubtitle').textContent = 'Registra los datos personales, de contacto y notas clínicas.';
      document.getElementById('cliId').value = '';
      document.getElementById('cliTipoDoc').value = 'DNI';
      document.getElementById('cliEstado').value = 'activo';
      document.getElementById('cliAlergias').value = 'Ninguna';

      SpaUI.openModal('modalClienteBackdrop', triggerElement);
    },

    openEdit(clienteId, triggerElement = null, onSaved = null) {
      this.init();
      if (onSaved) onSavedCallback = onSaved;
      const cli = SpaStore.getClienteById(clienteId);
      if (!cli) {
        SpaUI.showToast('Error', 'Clienta no encontrada.', 'error');
        return;
      }

      currentEditingClienteId = clienteId;

      const form = document.getElementById('formCliente');
      form.reset();
      SpaUI.clearFormErrors(form);

      document.getElementById('modalClienteTitle').textContent = `Editar Clienta: ${cli.nombreCompleto}`;
      document.getElementById('modalClienteSubtitle').textContent = `Actualiza información de contacto, documento o notas dérmicas.`;
      document.getElementById('cliId').value = cli.id;

      document.getElementById('cliNombres').value = cli.nombres || '';
      document.getElementById('cliApellidos').value = cli.apellidos || '';
      document.getElementById('cliTipoDoc').value = cli.tipoDocumento || 'DNI';
      document.getElementById('cliNumDoc').value = cli.numeroDocumento || '';
      document.getElementById('cliTelefono').value = cli.telefono || '';
      document.getElementById('cliEmail').value = cli.email || '';
      document.getElementById('cliFechaNac').value = cli.fechaNacimiento || '';
      document.getElementById('cliAlergias').value = cli.alergias || 'Ninguna';
      document.getElementById('cliPreferencias').value = cli.preferencias || '';
      document.getElementById('cliEstado').value = cli.estado || 'activo';

      SpaUI.openModal('modalClienteBackdrop', triggerElement);
    },

    openDetail(clienteId, triggerElement = null) {
      this.init();
      const cli = SpaStore.getClienteById(clienteId);
      if (!cli) {
        SpaUI.showToast('Error', 'Clienta no encontrada.', 'error');
        return;
      }

      const modalBackdrop = document.getElementById('modalClienteDetailBackdrop');
      modalBackdrop.setAttribute('data-cli-id', cli.id);

      document.getElementById('detailCliNombre').textContent = cli.nombreCompleto;
      document.getElementById('detailCliCodigo').textContent = `${cli.codigo} · Registrada el ${SpaStore.formatDateFriendly(cli.fechaRegistro)}`;

      const tieneAlergias = cli.alergias && cli.alergias.toLowerCase() !== 'ninguna';
      const historial = SpaStore.getHistorialCliente(cli.id);
      const totalInvertido = historial.filter(c => c.estado !== 'cancelada').reduce((sum, c) => sum + (c.total || c.precio || 0), 0);
      const citasCompletadas = historial.filter(c => c.estado === 'completada').length;

      // Calcular servicio favorito
      const servicioCount = {};
      historial.forEach(c => {
        servicioCount[c.servicioNombre] = (servicioCount[c.servicioNombre] || 0) + 1;
      });
      let favServicio = 'Ninguno';
      let maxCount = 0;
      Object.keys(servicioCount).forEach(srv => {
        if (servicioCount[srv] > maxCount) {
          maxCount = servicioCount[srv];
          favServicio = srv;
        }
      });

      let alergiasAlert = tieneAlergias ? `
        <div class="spa-alert alert-danger mb-3">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div>
            <b>Alergias y Advertencias Clínicas:</b>
            <div>${cli.alergias}</div>
          </div>
        </div>
      ` : `
        <div class="spa-alert alert-info mb-3">
          <i class="bi bi-shield-check"></i>
          <div><b>Sin alergias reportadas:</b> La clienta no registra contraindicaciones dérmicas conocidas.</div>
        </div>
      `;

      let historialRows = '';
      if (historial.length === 0) {
        historialRows = `
          <tr>
            <td colspan="6" class="text-center py-4 text-muted">
              <i class="bi bi-calendar-x fs-3 d-block opacity-50 mb-1"></i>
              No tiene citas previas registradas en el sistema.
            </td>
          </tr>
        `;
      } else {
        historialRows = historial.map(c => `
          <tr>
            <td><b>${c.codigo}</b></td>
            <td>
              <div>${SpaStore.formatDateFriendly(c.fecha)}</div>
              <small class="text-muted">${c.horaInicio} - ${c.horaFin}</small>
            </td>
            <td>
              <div>${c.servicioNombre}</div>
              <small class="text-muted">${c.cabinaNombre}</small>
            </td>
            <td>${c.especialistaNombre}</td>
            <td><b>${SpaStore.formatMoney(c.total || c.precio)}</b></td>
            <td><span class="pl ${c.estado}">${c.estado.replace('_', ' ').toUpperCase()}</span></td>
          </tr>
        `).join('');
      }

      document.getElementById('detailCliBody').innerHTML = `
        ${alergiasAlert}

        <!-- TARJETAS DE RESUMEN RÁPIDO DE LA CLIENTA -->
        <div class="row g-2 mb-3">
          <div class="col-6 col-md-3">
            <div class="p-2 border rounded bg-light text-center">
              <small class="text-muted d-block" style="font-size:10.5px;">TOTAL CITAS</small>
              <b class="fs-5 text-dark">${historial.length}</b>
              <small class="text-muted d-block" style="font-size:10px;">${citasCompletadas} atendidas</small>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-2 border rounded bg-light text-center">
              <small class="text-muted d-block" style="font-size:10.5px;">TOTAL CONSUMIDO</small>
              <b class="fs-5 text-primary">${SpaStore.formatMoney(totalInvertido)}</b>
              <small class="text-muted d-block" style="font-size:10px;">Facturación acum.</small>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-2 border rounded bg-light text-center">
              <small class="text-muted d-block" style="font-size:10.5px;">ÚLTIMA VISITA</small>
              <b class="fs-6 text-dark">${cli.ultimaVisita ? SpaStore.formatDateFriendly(cli.ultimaVisita) : 'Sin visitas'}</b>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-2 border rounded bg-light text-center">
              <small class="text-muted d-block" style="font-size:10.5px;">ESTADO</small>
              <span class="pl ${cli.estado === 'activo' ? 'ok' : 'inactivo'} mt-1">
                ${cli.estado.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <!-- DETALLE DE CONTACTO Y PREFERENCIAS -->
        <div class="detail-grid mb-3">
          <div class="detail-item">
            <span>Documento</span>
            <b>${cli.tipoDocumento}: ${cli.numeroDocumento}</b>
          </div>
          <div class="detail-item">
            <span>Teléfono Móvil</span>
            <b><i class="bi bi-whatsapp me-1 text-success"></i>${cli.telefono}</b>
          </div>
          <div class="detail-item">
            <span>Correo Electrónico</span>
            <b>${cli.email || 'No registrado'}</b>
          </div>
          <div class="detail-item">
            <span>Servicio Frecuente</span>
            <b>${favServicio}</b>
          </div>
          <div class="detail-item" style="grid-column: 1 / -1;">
            <span>Preferencias de Atención y Notas</span>
            <b class="fw-normal" style="font-size: 11.5px;">${cli.preferencias || 'Sin preferencias especiales anotadas.'}</b>
          </div>
        </div>

        <!-- TABLA DE HISTORIAL DE CITAS -->
        <div class="mt-4">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h5 class="mb-0 fs-6 fw-bold text-dark"><i class="bi bi-clock-history me-1 text-primary"></i>Historial de Citas y Sesiones</h5>
            <span class="badge bg-light text-muted border">${historial.length} reservas registradas</span>
          </div>
          <div class="table-responsive border rounded" style="max-height: 240px; overflow-y: auto;">
            <table class="tb mb-0" style="font-size: 11.5px;">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha & Hora</th>
                  <th>Servicio & Cabina</th>
                  <th>Especialista</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${historialRows}
              </tbody>
            </table>
          </div>
        </div>
      `;

      SpaUI.openModal('modalClienteDetailBackdrop', triggerElement);
    }
  };

  return ClientModal;
});
