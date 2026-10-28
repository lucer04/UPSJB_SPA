/**
 * VIVI SPA & ESTUDIO - UI HELPERS, MODALS & ACCESSIBILITY
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpaUI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Contenedor de Toasts (creado una vez)
  function getOrCreateToastContainer() {
    let container = document.getElementById('spaToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'spaToastContainer';
      container.className = 'spa-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  const SpaUI = {
    // -------------------------------------------------------------
    // SISTEMA DE TOASTS
    // -------------------------------------------------------------
    showToast(title, message, type = 'success', durationMs = 4000) {
      const container = getOrCreateToastContainer();

      const toast = document.createElement('div');
      toast.className = `spa-toast toast-${type}`;
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');

      let iconClass = 'bi-check-circle-fill';
      if (type === 'error') iconClass = 'bi-exclamation-octagon-fill';
      else if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill';
      else if (type === 'info') iconClass = 'bi-info-circle-fill';

      toast.innerHTML = `
        <i class="bi ${iconClass} toast-icon"></i>
        <div class="toast-body">
          <b>${title}</b>
          <p>${message}</p>
        </div>
        <button class="toast-close" aria-label="Cerrar notificación">
          <i class="bi bi-x-lg"></i>
        </button>
      `;

      const closeBtn = toast.querySelector('.toast-close');
      const dismiss = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 250);
      };

      closeBtn.onclick = dismiss;
      container.appendChild(toast);

      if (durationMs > 0) {
        setTimeout(dismiss, durationMs);
      }
    },

    // -------------------------------------------------------------
    // GESTIÓN DE MODALES ACCESIBLES
    // -------------------------------------------------------------
    openModal(modalId, triggerElement = null) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Guardar elemento que abrió el modal para devolver el foco
      if (triggerElement) {
        modal._triggerElement = triggerElement;
      } else if (document.activeElement) {
        modal._triggerElement = document.activeElement;
      }

      // Enfocar el primer input o botón
      const focusable = modal.querySelectorAll('input:not([type="hidden"]), select, textarea, button:not(.spa-modal-close)');
      if (focusable.length > 0) {
        setTimeout(() => focusable[0].focus(), 100);
      }

      // Evento de tecla Escape
      modal._escHandler = (e) => {
        if (e.key === 'Escape') {
          SpaUI.closeModal(modalId);
        }
      };
      document.addEventListener('keydown', modal._escHandler);
    },

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      if (modal._escHandler) {
        document.removeEventListener('keydown', modal._escHandler);
        modal._escHandler = null;
      }

      if (modal._triggerElement && typeof modal._triggerElement.focus === 'function') {
        modal._triggerElement.focus();
        modal._triggerElement = null;
      }
    },

    // -------------------------------------------------------------
    // HELPERS DE FORMULARIOS Y ERRORES
    // -------------------------------------------------------------
    clearFormErrors(form) {
      if (!form) return;
      form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
      form.querySelectorAll('.invalid-feedback').forEach(el => {
        el.textContent = '';
        el.classList.remove('d-block');
      });
      const alertBox = form.querySelector('.form-alert-box');
      if (alertBox) {
        alertBox.innerHTML = '';
        alertBox.classList.add('d-none');
      }
    },

    applyFormErrors(form, errors) {
      if (!form || !errors) return;
      this.clearFormErrors(form);

      let firstInvalid = null;

      Object.keys(errors).forEach(fieldName => {
        if (fieldName === 'general') {
          const alertBox = form.querySelector('.form-alert-box');
          if (alertBox) {
            alertBox.innerHTML = `
              <div class="spa-alert alert-danger mb-0">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <div>${errors[fieldName]}</div>
              </div>
            `;
            alertBox.classList.remove('d-none');
          }
          return;
        }

        const input = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (input) {
          input.classList.add('is-invalid');
          if (!firstInvalid) firstInvalid = input;

          let feedback = input.parentElement.querySelector('.invalid-feedback');
          if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            input.parentElement.appendChild(feedback);
          }
          feedback.textContent = errors[fieldName];
          feedback.classList.add('d-block');
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
      }
    },

    // -------------------------------------------------------------
    // ENLACES EN DESARROLLO (PREVENIR SALTO # Y NOTIFICAR CON TOAST)
    // -------------------------------------------------------------
    initNavLinks() {
      document.querySelectorAll('a.nv[href^="#"], aside.side a[href^="#"]').forEach(link => {
        if (link._hasDevToast) return;
        link._hasDevToast = true;
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const name = link.textContent.trim().replace(/^\s*[\r\n]+|\s*[\r\n]+$/g, '');
          SpaUI.showToast(
            'Módulo en Desarrollo',
            `El módulo de "${name}" se encuentra planificado para la siguiente versión.`,
            'info'
          );
        });
      });

    },

    // -------------------------------------------------------------
    // MENÚ DE USUARIO (PERFIL, CONTRASEÑA, CERRAR SESIÓN)
    // -------------------------------------------------------------
    initUserMenu() {
      // Toggle del dropdown de usuario
      const ubBtn = document.getElementById('ub');
      if (ubBtn && !ubBtn._menuInit) {
        ubBtn._menuInit = true;
        ubBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const expanded = ubBtn.getAttribute('aria-expanded') === 'true';
          ubBtn.setAttribute('aria-expanded', String(!expanded));
        });
        document.addEventListener('click', () => {
          ubBtn.setAttribute('aria-expanded', 'false');
        });
      }

      // Asignar acciones a los botones .mi del menú de usuario
      document.querySelectorAll('.mi').forEach(btn => {
        if (btn._hasMenuAction) return;
        btn._hasMenuAction = true;
        const texto = btn.textContent.trim();

        if (texto.includes('Mi perfil') || texto.includes('perfil')) {
          btn.addEventListener('click', () => SpaUI.openProfileModal());
        } else if (texto.toLowerCase().includes('contrase')) {
          btn.addEventListener('click', () => SpaUI.openChangePasswordModal());
        } else if (texto.toLowerCase().includes('sesi')) {
          btn.addEventListener('click', () => SpaUI.handleLogout());
        } else if (texto.includes('Preferencias')) {
          btn.addEventListener('click', () => {
            SpaUI.showToast('Preferencias del Spa', 'La configuración de preferencias estará disponible en la sección Configuraciones.', 'info');
          });
        }
      });
    },

    openProfileModal() {
      if (!document.getElementById('modalPerfilBackdrop')) {
        document.body.insertAdjacentHTML('beforeend', `
          <div class="spa-modal-backdrop" id="modalPerfilBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
            <div class="spa-modal-dialog modal-sm" style="max-width:520px;">
              <div class="spa-modal-header">
                <div class="modal-title-group">
                  <h2>Mi Perfil</h2>
                  <p>Datos del usuario activo en esta sesión.</p>
                </div>
                <button type="button" class="spa-modal-close" id="modalPerfilCloseBtn" aria-label="Cerrar">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
              <div class="spa-modal-body">
                <div class="spa-alert alert-info mb-3" style="font-size:11.5px;display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-radius:8px;background:#fdf8ec;border-left:4px solid #C5A059;">
                  <i class="bi bi-info-circle-fill" style="font-size:16px;color:#9E7D36;flex-shrink:0;margin-top:1px;"></i>
                  <div><b>Sistema frontend</b> — Este sistema no cuenta con autenticación real. Los datos de perfil son de demostración y no están vinculados a una cuenta de servidor.</div>
                </div>
                <div class="row g-3">
                  <div class="col-12 text-center mb-1">
                    <div style="width:64px;height:64px;border-radius:50%;background:#C5A059;display:inline-flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;font-family:'Cormorant Garamond',serif;margin:0 auto;">AD</div>
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="form-label">Nombre</label>
                    <input type="text" class="form-control" value="Administradora" readonly>
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="form-label">Rol</label>
                    <input type="text" class="form-control" value="Administrador" readonly>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Correo electrónico</label>
                    <input type="email" class="form-control" value="admin@vivispa.pe" readonly>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Estado de sesión</label>
                    <input type="text" class="form-control" value="Activo (demo)" readonly>
                  </div>
                </div>
              </div>
              <div class="spa-modal-footer">
                <button type="button" class="btn btn-outline-spa" id="modalPerfilCerrarBtn">Cerrar</button>
              </div>
            </div>
          </div>
        `);
        document.getElementById('modalPerfilCloseBtn').onclick = () => SpaUI.closeModal('modalPerfilBackdrop');
        document.getElementById('modalPerfilCerrarBtn').onclick = () => SpaUI.closeModal('modalPerfilBackdrop');
      }
      SpaUI.openModal('modalPerfilBackdrop');
    },

    openChangePasswordModal() {
      if (!document.getElementById('modalPassBackdrop')) {
        document.body.insertAdjacentHTML('beforeend', `
          <div class="spa-modal-backdrop" id="modalPassBackdrop" aria-hidden="true" role="dialog" aria-modal="true">
            <div class="spa-modal-dialog modal-sm" style="max-width:480px;">
              <div class="spa-modal-header">
                <div class="modal-title-group">
                  <h2>Cambiar Contraseña</h2>
                  <p>Actualiza la contraseña de acceso.</p>
                </div>
                <button type="button" class="spa-modal-close" id="modalPassCloseBtn" aria-label="Cerrar">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
              <form id="formCambioPass" novalidate>
                <div class="spa-modal-body">
                  <div class="spa-alert alert-info mb-3" style="font-size:11.5px;display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-radius:8px;background:#fdf8ec;border-left:4px solid #C5A059;">
                    <i class="bi bi-shield-exclamation" style="font-size:16px;color:#9E7D36;flex-shrink:0;margin-top:1px;"></i>
                    <div><b>Importante:</b> Este sistema no tiene autenticación real. El cambio de contraseña aquí <b>no protege el acceso</b> sin un backend. Este formulario es de demostración.</div>
                  </div>
                  <div class="row g-3">
                    <div class="col-12">
                      <label for="passActual" class="form-label">Contraseña actual <span class="req">*</span></label>
                      <input type="password" class="form-control" id="passActual" placeholder="••••••••" required>
                      <div class="invalid-feedback"></div>
                    </div>
                    <div class="col-12">
                      <label for="passNueva" class="form-label">Nueva contraseña <span class="req">*</span></label>
                      <input type="password" class="form-control" id="passNueva" placeholder="Mínimo 8 caracteres" required>
                      <div class="invalid-feedback"></div>
                    </div>
                    <div class="col-12">
                      <label for="passConfirm" class="form-label">Confirmar nueva contraseña <span class="req">*</span></label>
                      <input type="password" class="form-control" id="passConfirm" placeholder="Repite la nueva contraseña" required>
                      <div class="invalid-feedback"></div>
                    </div>
                  </div>
                </div>
                <div class="spa-modal-footer">
                  <button type="button" class="btn btn-outline-spa" id="modalPassCerrarBtn">Cancelar</button>
                  <button type="submit" class="btn btn-primary" id="btnGuardarPass">
                    <i class="bi bi-shield-check me-1"></i>Actualizar Contraseña
                  </button>
                </div>
              </form>
            </div>
          </div>
        `);
        document.getElementById('modalPassCloseBtn').onclick = () => SpaUI.closeModal('modalPassBackdrop');
        document.getElementById('modalPassCerrarBtn').onclick = () => SpaUI.closeModal('modalPassBackdrop');
        document.getElementById('formCambioPass').onsubmit = function(e) {
          e.preventDefault();
          const elActual = document.getElementById('passActual');
          const elNueva = document.getElementById('passNueva');
          const elConfirm = document.getElementById('passConfirm');
          [elActual, elNueva, elConfirm].forEach(el => {
            el.classList.remove('is-invalid');
            if (el.nextElementSibling) el.nextElementSibling.textContent = '';
          });
          let hasError = false;
          if (!elActual.value) {
            elActual.classList.add('is-invalid');
            if (elActual.nextElementSibling) elActual.nextElementSibling.textContent = 'Ingresa la contraseña actual.';
            hasError = true;
          }
          if (!elNueva.value || elNueva.value.length < 8) {
            elNueva.classList.add('is-invalid');
            if (elNueva.nextElementSibling) elNueva.nextElementSibling.textContent = 'La nueva contraseña debe tener al menos 8 caracteres.';
            hasError = true;
          }
          if (elNueva.value !== elConfirm.value) {
            elConfirm.classList.add('is-invalid');
            if (elConfirm.nextElementSibling) elConfirm.nextElementSibling.textContent = 'Las contraseñas no coinciden.';
            hasError = true;
          }
          if (hasError) return;
          SpaUI.closeModal('modalPassBackdrop');
          SpaUI.showToast('Contraseña actualizada (demo)', 'Recuerda que este cambio no tiene efecto real ya que el sistema no cuenta con autenticación backend.', 'info', 6000);
        };
      }
      SpaUI.openModal('modalPassBackdrop');
    },

    handleLogout() {
      if (confirm('¿Deseas cerrar sesión?\n\nEste sistema no cuenta con autenticación real — al recargar la página podrás acceder nuevamente.')) {
        SpaUI.showToast('Sesión cerrada', 'Como este es un sistema frontend sin autenticación real, recarga la página para continuar.', 'info', 5000);
      }
    }

  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        SpaUI.initNavLinks();
        SpaUI.initUserMenu();
      });
    } else {
      SpaUI.initNavLinks();
      SpaUI.initUserMenu();
    }
  }

  return SpaUI;
});