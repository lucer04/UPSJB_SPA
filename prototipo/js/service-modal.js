/**
 * VIVI SPA & ESTUDIO - SERVICE MODAL CONTROLLER
 * Controlador para Nuevo Servicio, Edición y Consulta de Tratamientos.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./spa-store', './spa-ui'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./spa-store'), require('./spa-ui'));
  } else {
    root.ServiceModal = factory(root.SpaStore, root.SpaUI);
  }
})(typeof self !== 'undefined' ? self : this, function (SpaStore, SpaUI) {
  'use strict';

  let initialized = false;
  let onSavedCallback = null;
  let currentEditingServiceId = null;

  function ensureModalMarkup() {
    if (document.getElementById('modalServicioBackdrop')) return;

    const modalHTML = `
      <!-- MODAL DE SERVICIO (CREAR / EDITAR) -->
      <div class="spa-modal-backdrop" id="modalServicioBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-md" style="max-width: 620px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="modalServicioTitle">Nuevo Servicio</h2>
              <p id="modalServicioSubtitle">Define el tratamiento, duración estándar, tarifa y recursos recomendados.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalServicioCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formServicio" novalidate>
            <input type="hidden" id="srvId" name="id">

            <div class="spa-modal-body">
              <div class="form-alert-box d-none"></div>

              <!-- DATOS BÁSICOS -->
              <div class="form-section-title">
                <i class="bi bi-stars"></i> 1. Información del Tratamiento
              </div>
              <div class="row g-3">
                <div class="col-12">
                  <label for="srvNombre" class="form-label">Nombre del Servicio <span class="req">*</span></label>
                  <input type="text" class="form-control" id="srvNombre" name="nombre" placeholder="Ej. Drenaje Linfático Facial" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="srvCategoria" class="form-label">Categoría <span class="req">*</span></label>
                  <select class="form-select" id="srvCategoria" name="categoria" required>
                    <option value="">Seleccione categoría...</option>
                    <option value="facial">Facial & Skin Care</option>
                    <option value="masajes">Masajes & Bienestar</option>
                    <option value="laser">Láser & Aparatología</option>
                    <option value="estudio">Nail Studio & Manicure</option>
                  </select>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-6 col-md-3">
                  <label for="srvDuracion" class="form-label">Duración <span class="req">*</span></label>
                  <div class="input-group">
                    <input type="number" class="form-control" id="srvDuracion" name="duracionMin" min="15" max="360" step="15" value="60" required>
                    <span class="input-group-text bg-light text-muted small">min</span>
                  </div>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-6 col-md-3">
                  <label for="srvPrecio" class="form-label">Precio Regular <span class="req">*</span></label>
                  <div class="input-group">
                    <span class="input-group-text bg-light text-muted small">S/</span>
                    <input type="number" class="form-control" id="srvPrecio" name="precio" min="0" step="5" value="120" required>
                  </div>
                  <div class="invalid-feedback"></div>
                </div>
              </div>

              <!-- RECURSOS PREDETERMINADOS -->
              <div class="form-section-title mt-4">
                <i class="bi bi-door-open"></i> 2. Asignación Predeterminada
              </div>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label for="srvCabina" class="form-label">Cabina Recomendada</label>
                  <select class="form-select" id="srvCabina" name="cabinaRecomendada">
                    <!-- Dinámico -->
                  </select>
                </div>

                <div class="col-12 col-md-6">
                  <label for="srvEspecialista" class="form-label">Especialista Principal</label>
                  <select class="form-select" id="srvEspecialista" name="especialistaDefecto">
                    <!-- Dinámico -->
                  </select>
                </div>

                <div class="col-12 col-md-6">
                  <label for="srvEstado" class="form-label">Estado del Servicio</label>
                  <select class="form-select" id="srvEstado" name="estado">
                    <option value="activo">Activo (Disponible para reservas)</option>
                    <option value="inactivo">Inactivo (Archivado temporalmente)</option>
                  </select>
                </div>

                <div class="col-12">
                  <label for="srvDescripcion" class="form-label">Descripción y Protocolo del Servicio</label>
                  <textarea class="form-control" id="srvDescripcion" name="descripcion" rows="2" placeholder="Pasos del protocolo, indicaciones de aparatología o productos aplicados."></textarea>
                </div>
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-spa" id="btnCancelServicioForm">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitServicio">
                <i class="bi bi-check2-circle me-1"></i>Guardar Servicio
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL DETALLE DE SERVICIO -->
      <div class="spa-modal-backdrop" id="modalServicioDetailBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-md" style="max-width: 580px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="detailSrvNombre">Detalle del Tratamiento</h2>
              <p id="detailSrvCategoria" class="text-muted"></p>
            </div>
            <button type="button" class="spa-modal-close" id="modalSrvDetailCloseBtn" aria-label="Cerrar">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="spa-modal-body" id="detailSrvBody">
            <!-- Dinámico -->
          </div>
          <div class="spa-modal-footer">
            <button type="button" class="btn btn-outline-spa btn-sm" id="btnDetailSrvCerrar">Cerrar</button>
            <button type="button" class="btn btn-primary btn-sm" id="btnDetailSrvEditar">
              <i class="bi bi-pencil me-1"></i>Editar Servicio
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function populateSelects(selectedCabinaId = null, selectedEspId = null) {
    const cabSel = document.getElementById('srvCabina');
    const espSel = document.getElementById('srvEspecialista');

    const cabinas = SpaStore.getCabinas();
    cabSel.innerHTML = cabinas.map(c => 
      `<option value="${c.id}" ${c.id === selectedCabinaId ? 'selected' : ''}>${c.nombre} (${c.tipo})</option>`
    ).join('');

    const especialistas = SpaStore.getEspecialistas();
    espSel.innerHTML = especialistas.map(e => 
      `<option value="${e.id}" ${e.id === selectedEspId ? 'selected' : ''}>${e.nombre} · ${e.especialidad}</option>`
    ).join('');
  }

  function setupEvents() {
    if (initialized) return;
    initialized = true;

    document.getElementById('modalServicioCloseBtn').onclick = () => SpaUI.closeModal('modalServicioBackdrop');
    document.getElementById('btnCancelServicioForm').onclick = () => SpaUI.closeModal('modalServicioBackdrop');

    document.getElementById('modalSrvDetailCloseBtn').onclick = () => SpaUI.closeModal('modalServicioDetailBackdrop');
    document.getElementById('btnDetailSrvCerrar').onclick = () => SpaUI.closeModal('modalServicioDetailBackdrop');

    document.getElementById('btnDetailSrvEditar').onclick = () => {
      const srvId = document.getElementById('modalServicioDetailBackdrop').getAttribute('data-srv-id');
      SpaUI.closeModal('modalServicioDetailBackdrop');
      if (srvId) {
        ServiceModal.openEdit(srvId);
      }
    };

    document.getElementById('formServicio').onsubmit = function (e) {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitServicio');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';

      const formData = {
        id: currentEditingServiceId || null,
        nombre: document.getElementById('srvNombre').value,
        categoria: document.getElementById('srvCategoria').value,
        duracionMin: document.getElementById('srvDuracion').value,
        precio: document.getElementById('srvPrecio').value,
        cabinaRecomendada: document.getElementById('srvCabina').value,
        especialistaDefecto: document.getElementById('srvEspecialista').value,
        estado: document.getElementById('srvEstado').value,
        descripcion: document.getElementById('srvDescripcion').value
      };

      const result = SpaStore.guardarServicio(formData);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Guardar Servicio';

      if (!result.success) {
        SpaUI.applyFormErrors(this, result.errors);
        return;
      }

      SpaUI.closeModal('modalServicioBackdrop');
      SpaUI.showToast(
        currentEditingServiceId ? 'Servicio Actualizado' : 'Servicio Creado',
        result.message,
        'success'
      );

      if (onSavedCallback) onSavedCallback(result.data);
      window.dispatchEvent(new CustomEvent('spastore:change', { detail: { type: 'servicio', data: result.data } }));
    };
  }

  const ServiceModal = {
    init(options = {}) {
      options = options || {};
      ensureModalMarkup();
      setupEvents();
      if (options.onSaved) onSavedCallback = options.onSaved;
    },

    openNew(triggerElement = null, onSaved = null) {
      this.init();
      if (onSaved) onSavedCallback = onSaved;
      currentEditingServiceId = null;

      const form = document.getElementById('formServicio');
      form.reset();
      SpaUI.clearFormErrors(form);

      document.getElementById('modalServicioTitle').textContent = 'Nuevo Servicio';
      document.getElementById('modalServicioSubtitle').textContent = 'Define el tratamiento, duración estándar, tarifa y recursos.';
      document.getElementById('srvId').value = '';
      document.getElementById('srvDuracion').value = 60;
      document.getElementById('srvPrecio').value = 120;
      document.getElementById('srvEstado').value = 'activo';

      populateSelects('cab-1', 'esp-1');
      SpaUI.openModal('modalServicioBackdrop', triggerElement);
    },

    openEdit(servicioId, triggerElement = null, onSaved = null) {
      this.init();
      if (onSaved) onSavedCallback = onSaved;
      const srv = SpaStore.getServicioById(servicioId);
      if (!srv) {
        SpaUI.showToast('Error', 'Servicio no encontrado.', 'error');
        return;
      }

      currentEditingServiceId = servicioId;

      const form = document.getElementById('formServicio');
      form.reset();
      SpaUI.clearFormErrors(form);

      document.getElementById('modalServicioTitle').textContent = `Editar Servicio: ${srv.nombre}`;
      document.getElementById('modalServicioSubtitle').textContent = 'Modifica los parámetros operativos o tarifarios del tratamiento.';
      document.getElementById('srvId').value = srv.id;

      document.getElementById('srvNombre').value = srv.nombre || '';
      document.getElementById('srvCategoria').value = srv.categoria || '';
      document.getElementById('srvDuracion').value = srv.duracionMin || 60;
      document.getElementById('srvPrecio').value = srv.precio || 0;
      document.getElementById('srvEstado').value = srv.estado || 'activo';
      document.getElementById('srvDescripcion').value = srv.descripcion || '';

      populateSelects(srv.cabinaRecomendada, srv.especialistaDefecto);
      SpaUI.openModal('modalServicioBackdrop', triggerElement);
    },

    openDetail(servicioId, triggerElement = null) {
      this.init();
      const srv = SpaStore.getServicioById(servicioId);
      if (!srv) {
        SpaUI.showToast('Error', 'Servicio no encontrado.', 'error');
        return;
      }

      const modalBackdrop = document.getElementById('modalServicioDetailBackdrop');
      modalBackdrop.setAttribute('data-srv-id', srv.id);

      document.getElementById('detailSrvNombre').textContent = srv.nombre;
      document.getElementById('detailSrvCategoria').textContent = `Categoría: ${(srv.categoria || '').toUpperCase()} · ID: ${srv.id}`;

      const cabina = SpaStore.getCabinaById(srv.cabinaRecomendada);
      const esp = SpaStore.getEspecialistaById(srv.especialistaDefecto);
      const citasTotal = SpaStore.getCitas ? SpaStore.getCitas().filter(c => c.servicioId === srv.id).length : 0;

      document.getElementById('detailSrvBody').innerHTML = `
        <div class="row g-2 mb-3">
          <div class="col-4">
            <div class="p-2 border rounded bg-light text-center">
              <small class="text-muted d-block" style="font-size:10px;">DURACIÓN</small>
              <b class="fs-6 text-dark">${srv.duracionMin} min</b>
            </div>
          </div>
          <div class="col-4">
            <div class="p-2 border rounded bg-light text-center">
              <small class="text-muted d-block" style="font-size:10px;">TARIFA REGULAR</small>
              <b class="fs-6 text-primary">${SpaStore.formatMoney(srv.precio)}</b>
            </div>
          </div>
          <div class="col-4">
            <div class="p-2 border rounded bg-light text-center">
              <small class="text-muted d-block" style="font-size:10px;">ESTADO</small>
              <span class="pl ${srv.estado === 'activo' ? 'ok' : 'inactivo'} mt-1">
                ${(srv.estado || 'activo').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-grid mb-3">
          <div class="detail-item">
            <span>Cabina Asignada</span>
            <b>${cabina ? cabina.nombre : (srv.cabinaRecomendada || '-')}</b>
            <small class="text-muted d-block">${cabina ? cabina.tipo : ''}</small>
          </div>
          <div class="detail-item">
            <span>Especialista Defecto</span>
            <b>${esp ? esp.nombre : (srv.especialistaDefecto || '-')}</b>
            <small class="text-muted d-block">${esp ? esp.especialidad : ''}</small>
          </div>
          <div class="detail-item">
            <span>Citas Registradas</span>
            <b>${citasTotal} reservas históricas</b>
          </div>
          <div class="detail-item">
            <span>Disponibilidad Online</span>
            <b class="text-success"><i class="bi bi-check2-circle me-1"></i>Habilitado en agenda</b>
          </div>
          <div class="detail-item" style="grid-column: 1 / -1;">
            <span>Protocolo y Descripción</span>
            <b class="fw-normal" style="font-size: 11.5px;">${srv.descripcion || 'Sin protocolo específico detallado.'}</b>
          </div>
        </div>
      `;

      SpaUI.openModal('modalServicioDetailBackdrop', triggerElement);
    }
  };

  return ServiceModal;
});
