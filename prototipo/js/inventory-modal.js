/**
 * VIVI SPA & ESTUDIO - INVENTORY MODAL CONTROLLER
 * Controlador para Productos, Entradas, Salidas e Historial de Movimientos.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./spa-store', './spa-ui'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./spa-store'), require('./spa-ui'));
  } else {
    root.InventoryModal = factory(root.SpaStore, root.SpaUI);
  }
})(typeof self !== 'undefined' ? self : this, function (SpaStore, SpaUI) {
  'use strict';

  let initialized = false;
  let onSavedCallback = null;
  let currentEditingProductId = null;

  function ensureModalMarkup() {
    if (document.getElementById('modalProductoBackdrop')) return;

    const modalHTML = `
      <!-- MODAL DE PRODUCTO (CREAR / EDITAR) -->
      <div class="spa-modal-backdrop" id="modalProductoBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-md" style="max-width: 650px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="modalProductoTitle">Nuevo Producto o Insumo</h2>
              <p id="modalProductoSubtitle">Registra las existencias, umbral mínimo de alerta y costos de almacén.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalProductoCloseBtn" aria-label="Cerrar modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formProducto" novalidate>
            <input type="hidden" id="prodId" name="id">

            <div class="spa-modal-body">
              <div class="form-alert-box d-none"></div>

              <div class="form-section-title">
                <i class="bi bi-box-seam"></i> 1. Identificación del Producto
              </div>
              <div class="row g-2">
                <div class="col-12 col-md-8">
                  <label for="prodNombre" class="form-label">Nombre del Producto o Insumo <span class="req">*</span></label>
                  <input type="text" class="form-control" id="prodNombre" name="nombre" placeholder="Ej. Aceite corporal almendras 500ml" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-4">
                  <label for="prodSku" class="form-label">Código / SKU <span class="req">*</span></label>
                  <input type="text" class="form-control" id="prodSku" name="sku" placeholder="Ej. SKU-ACE-001" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="prodCategoria" class="form-label">Categoría <span class="req">*</span></label>
                  <select class="form-select" id="prodCategoria" name="categoria" required>
                    <option value="">Seleccione categoría...</option>
                    <option value="facial">Facial & Cosmecéutica</option>
                    <option value="insumos_masajes">Insumos de Masajes y Aromaterapia</option>
                    <option value="laser">Láser & Aparatología</option>
                    <option value="estudio">Nail Studio & Esmaltes</option>
                    <option value="blanqueria">Blanquería & Desechables</option>
                    <option value="reventa">Productos para Reventa</option>
                  </select>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="prodUnidad" class="form-label">Unidad de Medida <span class="req">*</span></label>
                  <input type="text" class="form-control" id="prodUnidad" name="unidad" placeholder="Frasco 500ml, Tarro 1kg, etc." required>
                  <div class="invalid-feedback"></div>
                </div>
              </div>

              <div class="form-section-title mt-4">
                <i class="bi bi-bar-chart-steps"></i> 2. Stock y Costos
              </div>
              <div class="row g-2">
                <div class="col-6 col-md-3">
                  <label for="prodStockActual" class="form-label">Stock Actual <span class="req">*</span></label>
                  <input type="number" class="form-control" id="prodStockActual" name="stockActual" min="0" value="0" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-6 col-md-3">
                  <label for="prodStockMinimo" class="form-label">Stock Mínimo <span class="req">*</span></label>
                  <input type="number" class="form-control" id="prodStockMinimo" name="stockMinimo" min="0" value="3" required>
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-6 col-md-3">
                  <label for="prodPrecioCompra" class="form-label">Precio Compra (S/)</label>
                  <input type="number" class="form-control" id="prodPrecioCompra" name="precioCompra" min="0" step="0.5" value="0">
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-6 col-md-3">
                  <label for="prodPrecioVenta" class="form-label">Precio Venta (S/)</label>
                  <input type="number" class="form-control" id="prodPrecioVenta" name="precioVenta" min="0" step="0.5" value="0">
                  <div class="invalid-feedback"></div>
                </div>

                <div class="col-12 col-md-6">
                  <label for="prodUbicacion" class="form-label">Ubicación Física</label>
                  <input type="text" class="form-control" id="prodUbicacion" name="ubicacion" placeholder="Ej. Cabina 1, Almacén Central">
                </div>

                <div class="col-12 col-md-6">
                  <label for="prodEstado" class="form-label">Estado</label>
                  <select class="form-select" id="prodEstado" name="estado">
                    <option value="activo">Activo en catálogo</option>
                    <option value="inactivo">Descontinuado</option>
                  </select>
                </div>

                <div class="col-12">
                  <label for="prodDescripcion" class="form-label">Notas o Especificaciones</label>
                  <textarea class="form-control" id="prodDescripcion" name="descripcion" rows="2" placeholder="Proveedor, componentes principales, fecha estimada de vencimiento, etc."></textarea>
                </div>
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-spa" id="btnCancelProductoForm">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitProducto">
                <i class="bi bi-check2-circle me-1"></i>Guardar Producto
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL DE MOVIMIENTO DE INVENTARIO (ENTRADA / SALIDA) -->
      <div class="spa-modal-backdrop" id="modalMovimientoBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-sm" style="max-width: 500px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="modalMovTitle">Registrar Movimiento</h2>
              <p id="modalMovSubtitle">Actualiza las existencias de insumos por consumo o reposición.</p>
            </div>
            <button type="button" class="spa-modal-close" id="modalMovCloseBtn" aria-label="Cerrar">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form id="formMovimiento" novalidate>
            <div class="spa-modal-body">
              <div class="form-alert-box d-none"></div>

              <div class="mb-3">
                <label for="movProductoId" class="form-label">Producto / Insumo <span class="req">*</span></label>
                <select class="form-select" id="movProductoId" name="productoId" required>
                  <!-- Dinámico -->
                </select>
                <div class="invalid-feedback"></div>
                <div id="movStockActualBadge" class="mt-1 small text-muted"></div>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label for="movTipo" class="form-label">Tipo de Movimiento <span class="req">*</span></label>
                  <select class="form-select" id="movTipo" name="tipo" required>
                    <option value="salida">Salida (Consumo / Merma)</option>
                    <option value="entrada">Entrada (Compra / Reposición)</option>
                  </select>
                </div>

                <div class="col-6">
                  <label for="movCantidad" class="form-label">Cantidad <span class="req">*</span></label>
                  <input type="number" class="form-control" id="movCantidad" name="cantidad" min="1" step="1" value="1" required>
                  <div class="invalid-feedback"></div>
                </div>
              </div>

              <div class="mb-3">
                <label for="movMotivo" class="form-label">Motivo o Justificación <span class="req">*</span></label>
                <textarea class="form-control" id="movMotivo" name="motivo" rows="2" placeholder="Ej. Consumo en Cabina 1 para 3 tratamientos faciales" required></textarea>
                <div class="invalid-feedback"></div>
              </div>

              <div class="mb-2">
                <label for="movUsuario" class="form-label">Responsable</label>
                <input type="text" class="form-control" id="movUsuario" name="usuario" value="Administradora">
              </div>
            </div>

            <div class="spa-modal-footer">
              <button type="button" class="btn btn-outline-spa btn-sm" id="btnCancelMovForm">Cancelar</button>
              <button type="submit" class="btn btn-primary btn-sm" id="btnSubmitMov">
                <i class="bi bi-arrow-down-up me-1"></i>Aplicar Movimiento
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL DE CONSULTA DE HISTORIAL DE MOVIMIENTOS -->
      <div class="spa-modal-backdrop" id="modalHistorialMovBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="spa-modal-dialog modal-lg" style="max-width: 800px;">
          <div class="spa-modal-header">
            <div class="modal-title-group">
              <h2 id="historialMovTitle">Historial de Movimientos de Almacén</h2>
              <p id="historialMovSubtitle" class="text-muted"></p>
            </div>
            <button type="button" class="spa-modal-close" id="modalHistorialMovCloseBtn" aria-label="Cerrar">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="spa-modal-body">
            <div class="table-responsive border rounded" style="max-height: 360px; overflow-y: auto;">
              <table class="tb mb-0" id="tablaHistorialMov">
                <thead>
                  <tr>
                    <th>Fecha & Hora</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock Ant.</th>
                    <th>Stock Nuevo</th>
                    <th>Motivo</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody id="historialMovBody">
                  <!-- Dinámico -->
                </tbody>
              </table>
            </div>
          </div>
          <div class="spa-modal-footer">
            <button type="button" class="btn btn-outline-spa btn-sm" id="btnHistorialMovCerrar">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function setupEvents() {
    if (initialized) return;
    initialized = true;

    // Cierre de modales
    document.getElementById('modalProductoCloseBtn').onclick = () => SpaUI.closeModal('modalProductoBackdrop');
    document.getElementById('btnCancelProductoForm').onclick = () => SpaUI.closeModal('modalProductoBackdrop');

    document.getElementById('modalMovCloseBtn').onclick = () => SpaUI.closeModal('modalMovimientoBackdrop');
    document.getElementById('btnCancelMovForm').onclick = () => SpaUI.closeModal('modalMovimientoBackdrop');

    document.getElementById('modalHistorialMovCloseBtn').onclick = () => SpaUI.closeModal('modalHistorialMovBackdrop');
    document.getElementById('btnHistorialMovCerrar').onclick = () => SpaUI.closeModal('modalHistorialMovBackdrop');

    // Al cambiar producto en movimiento, actualizar badge de stock
    document.getElementById('movProductoId').onchange = function () {
      const p = SpaStore.getProductoById(this.value);
      const badge = document.getElementById('movStockActualBadge');
      if (p) {
        badge.innerHTML = `<i class="bi bi-info-circle me-1"></i>Stock actual disponible: <b>${p.stockActual} ${p.unidad}</b> (Mínimo: ${p.stockMinimo})`;
      } else {
        badge.innerHTML = '';
      }
    };

    // Envío de Formulario Producto
    document.getElementById('formProducto').onsubmit = function (e) {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitProducto');
      submitBtn.disabled = true;

      const formData = {
        id: currentEditingProductId || null,
        nombre: document.getElementById('prodNombre').value,
        sku: document.getElementById('prodSku').value,
        categoria: document.getElementById('prodCategoria').value,
        unidad: document.getElementById('prodUnidad').value,
        stockActual: document.getElementById('prodStockActual').value,
        stockMinimo: document.getElementById('prodStockMinimo').value,
        precioCompra: document.getElementById('prodPrecioCompra').value,
        precioVenta: document.getElementById('prodPrecioVenta').value,
        ubicacion: document.getElementById('prodUbicacion').value,
        estado: document.getElementById('prodEstado').value,
        descripcion: document.getElementById('prodDescripcion').value
      };

      const result = SpaStore.guardarProducto(formData);
      submitBtn.disabled = false;

      if (!result.success) {
        SpaUI.applyFormErrors(this, result.errors);
        return;
      }

      SpaUI.closeModal('modalProductoBackdrop');
      SpaUI.showToast(
        currentEditingProductId ? 'Producto Actualizado' : 'Producto Registrado',
        result.message,
        'success'
      );

      if (onSavedCallback) onSavedCallback(result.data);
      window.dispatchEvent(new CustomEvent('spastore:change', { detail: { type: 'producto', data: result.data } }));
    };

    // Envío de Formulario Movimiento
    document.getElementById('formMovimiento').onsubmit = function (e) {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitMov');
      submitBtn.disabled = true;

      const movData = {
        productoId: document.getElementById('movProductoId').value,
        tipo: document.getElementById('movTipo').value,
        cantidad: Number(document.getElementById('movCantidad').value),
        motivo: document.getElementById('movMotivo').value,
        usuario: document.getElementById('movUsuario').value
      };

      const result = SpaStore.registrarMovimiento(movData);
      submitBtn.disabled = false;

      if (!result.success) {
        SpaUI.showToast('Operación no permitida', result.message, 'error');
        return;
      }

      SpaUI.closeModal('modalMovimientoBackdrop');
      SpaUI.showToast('Inventario Actualizado', result.message, 'success');

      if (onSavedCallback) onSavedCallback(result.data);
      window.dispatchEvent(new CustomEvent('spastore:change', { detail: { type: 'movimiento', data: result.data } }));
    };
  }

  const InventoryModal = {
    init(options = {}) {
      options = options || {};
      ensureModalMarkup();
      setupEvents();
      if (options.onSaved) onSavedCallback = options.onSaved;
    },

    openNewProduct(triggerElement = null, onSaved = null) {
      this.init();
      if (onSaved) onSavedCallback = onSaved;
      currentEditingProductId = null;

      const form = document.getElementById('formProducto');
      form.reset();
      SpaUI.clearFormErrors(form);

      document.getElementById('modalProductoTitle').textContent = 'Nuevo Producto o Insumo';
      document.getElementById('modalProductoSubtitle').textContent = 'Registra las existencias, umbral mínimo de alerta y costos.';
      document.getElementById('prodId').value = '';
      document.getElementById('prodStockActual').value = 10;
      document.getElementById('prodStockMinimo').value = 3;
      document.getElementById('prodPrecioCompra').value = 0;
      document.getElementById('prodPrecioVenta').value = 0;
      document.getElementById('prodEstado').value = 'activo';

      SpaUI.openModal('modalProductoBackdrop', triggerElement);
    },

    openEditProduct(productoId, triggerElement = null, onSaved = null) {
      this.init();
      if (onSaved) onSavedCallback = onSaved;
      const prod = SpaStore.getProductoById(productoId);
      if (!prod) {
        SpaUI.showToast('Error', 'Producto no encontrado.', 'error');
        return;
      }

      currentEditingProductId = productoId;

      const form = document.getElementById('formProducto');
      form.reset();
      SpaUI.clearFormErrors(form);

      document.getElementById('modalProductoTitle').textContent = `Editar: ${prod.nombre}`;
      document.getElementById('modalProductoSubtitle').textContent = `Actualiza datos de catálogo, precios o umbrales mínimos.`;
      document.getElementById('prodId').value = prod.id;

      document.getElementById('prodNombre').value = prod.nombre || '';
      document.getElementById('prodSku').value = prod.sku || '';
      document.getElementById('prodCategoria').value = prod.categoria || '';
      document.getElementById('prodUnidad').value = prod.unidad || '';
      document.getElementById('prodStockActual').value = prod.stockActual || 0;
      document.getElementById('prodStockMinimo').value = prod.stockMinimo || 0;
      document.getElementById('prodPrecioCompra').value = prod.precioCompra || 0;
      document.getElementById('prodPrecioVenta').value = prod.precioVenta || 0;
      document.getElementById('prodUbicacion').value = prod.ubicacion || '';
      document.getElementById('prodEstado').value = prod.estado || 'activo';
      document.getElementById('prodDescripcion').value = prod.descripcion || '';

      SpaUI.openModal('modalProductoBackdrop', triggerElement);
    },

    openMovement(defaultProductoId = null, tipoDefault = 'salida', triggerElement = null, onSaved = null) {
      this.init();
      if (onSaved) onSavedCallback = onSaved;

      const form = document.getElementById('formMovimiento');
      form.reset();
      SpaUI.clearFormErrors(form);

      const prodSelect = document.getElementById('movProductoId');
      const productos = SpaStore.getProductos().filter(p => p.estado !== 'inactivo');

      prodSelect.innerHTML = '<option value="">Seleccione un producto...</option>' + 
        productos.map(p => 
          `<option value="${p.id}" ${p.id === defaultProductoId ? 'selected' : ''}>${p.nombre} (${p.sku}) - Stock: ${p.stockActual} ${p.unidad}</option>`
        ).join('');

      document.getElementById('movTipo').value = tipoDefault;
      document.getElementById('movCantidad').value = 1;
      document.getElementById('movUsuario').value = 'Administradora';

      // Disparar evento para actualizar el badge de stock
      prodSelect.dispatchEvent(new Event('change'));

      SpaUI.openModal('modalMovimientoBackdrop', triggerElement);
    },

    openMovementHistory(productoId = null, triggerElement = null) {
      this.init();
      const movimientos = SpaStore.getMovimientos(productoId);
      const prod = productoId ? SpaStore.getProductoById(productoId) : null;

      document.getElementById('historialMovTitle').textContent = prod 
        ? `Movimientos: ${prod.nombre} (${prod.sku})`
        : 'Historial General de Movimientos de Inventario';
      document.getElementById('historialMovSubtitle').textContent = `${movimientos.length} movimientos registrados en el sistema.`;

      const tbody = document.getElementById('historialMovBody');
      if (movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No se registran movimientos para este producto.</td></tr>';
      } else {
        tbody.innerHTML = movimientos.map(m => {
          const isEntrada = m.tipo === 'entrada';
          return `
            <tr>
              <td><small>${m.fechaHora}</small></td>
              <td><b>${m.productoNombre}</b><br><small class="text-muted">${m.productoSku}</small></td>
              <td>
                <span class="pl ${isEntrada ? 'ok' : 'rd'}">
                  <i class="bi ${isEntrada ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}"></i> 
                  ${m.tipo.toUpperCase()}
                </span>
              </td>
              <td><b class="${isEntrada ? 'text-success' : 'text-danger'}">${isEntrada ? '+' : '-'}${m.cantidad}</b></td>
              <td>${m.stockAnterior}</td>
              <td><b>${m.stockNuevo}</b></td>
              <td><small>${m.motivo}</small></td>
              <td><small>${m.usuario || '-'}</small></td>
            </tr>
          `;
        }).join('');
      }

      SpaUI.openModal('modalHistorialMovBackdrop', triggerElement);
    }
  };

  return InventoryModal;
});
