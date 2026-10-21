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
    }
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => SpaUI.initNavLinks());
    } else {
      SpaUI.initNavLinks();
    }
  }

  return SpaUI;
});
