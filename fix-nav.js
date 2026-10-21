// Corrige los enlaces del menú lateral en todos los .html de la carpeta.
// Uso (desde la carpeta del proyecto):  node fix-nav.js
const fs = require('fs');
const path = require('path');

const LINKS = {
  'Dashboard': 'dashboard.html',
  'Reportes': 'reportes.html',
  'Citas': 'citas.html',
  'Clientes': 'clientes.html',
  'Servicios': 'servicios.html',
  'Inventario': 'inventario.html',
  'Pagos y caja': 'pagosycaja.html',
  'Comisiones': 'comisiones.html',
  'Roles': 'roles.html',
  'Usuarios': 'usuarios.html',
  'Categorías': 'categorias.html',
};

const labels = Object.keys(LINKS).join('|');
const re = new RegExp(
  '(<a\\s+class="nv[^"]*"[^>]*?)href="[^"]*"([^>]*>\\s*<i class="bi [^"]*"></i>\\s*)(' + labels + ')(\\s*</a>)',
  'g'
);

const dir = process.argv[2] || '.';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));

for (const file of files) {
  const full = path.join(dir, file);
  const original = fs.readFileSync(full, 'utf8');
  let changed = 0;
  const updated = original.replace(re, (m, a, b, label, end) => {
    changed++;
    return `${a}href="${LINKS[label]}"${b}${label}${end}`;
  });
  if (updated !== original) {
    fs.writeFileSync(full, updated, 'utf8');
    console.log(`✔ ${file}: ${changed} enlaces del menú`);
  } else {
    console.log(`- ${file}: sin cambios`);
  }
}

/* =====================================================================
   VIVI Spa y Estudio · Menú de usuario (parte inferior del sidebar)
   Archivo: js/perfil-menu.js
   Da funcionalidad a: Mi perfil · Cambiar contraseña ·
                       Preferencias del Spa · Cerrar sesión
   Uso: <script src="./js/perfil-menu.js"></script> antes de </body>
   en TODAS las páginas. No requiere cambiar el HTML del menú.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Configuración ---------- */
  var LOGIN_URL = "login.html"; // a dónde se va al cerrar sesión
  var DEFAULT_PASS = "admin123"; // contraseña inicial (solo prototipo)
  var K = {
    perfil: "vivi_perfil",
    pass: "vivi_pass",
    prefs: "vivi_prefs",
    session: "vivi_session",
  };
  var DEF_PERFIL = { nombre: "Administradora", correo: "admin@vivispa.com", telefono: "" };
  var DEF_PREFS = {
    spaNombre: "VIVI Spa y Estudio",
    telefono: "",
    direccion: "",
    apertura: "09:00",
    cierre: "19:00",
    intervalo: "30",
    moneda: "S/",
    igv: 18,
    notifStock: true,
    notifCitas: true,
  };

  /* ---------- Utilidades ---------- */
  function q(s, r) {
    return (r || document).querySelector(s);
  }
  function qa(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function initials(n) {
    return String(n || "?")
      .trim()
      .split(/\s+/)
      .map(function (w) {
        return w[0];
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  function leer(key, def) {
    var out = JSON.parse(JSON.stringify(def));
    try {
      var s = JSON.parse(localStorage.getItem(key));
      if (s) Object.keys(s).forEach(function (k) { out[k] = s[k]; });
    } catch (e) {}
    return out;
  }
  function guardar(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }
  function hash(s) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) {
        return Array.prototype.map
          .call(new Uint8Array(b), function (x) {
            return ("0" + x.toString(16)).slice(-2);
          })
          .join("");
      });
    }
    return Promise.resolve("b64:" + btoa(unescape(encodeURIComponent(s))));
  }
  function hashGuardado() {
    var h = null;
    try {
      h = localStorage.getItem(K.pass);
    } catch (e) {}
    return h ? Promise.resolve(h) : hash(DEFAULT_PASS);
  }
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "vv-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
      t.remove();
    }, 2600);
  }

  /* ---------- Estilos (autocontenidos) ---------- */
  var st = document.createElement("style");
  st.textContent =
    ".vv-dialog{border:1px solid #e8dfc9;border-radius:14px;padding:0;width:min(520px,94vw);box-shadow:0 20px 60px rgba(24,18,15,.25);font-family:'Montserrat',sans-serif;color:#18120f}" +
    ".vv-dialog::backdrop{background:rgba(24,18,15,.45)}" +
    ".vv-dialog form{padding:22px}" +
    ".vv-dialog h4{font-family:'Cormorant Garamond',serif;font-weight:700;margin:0 0 4px}" +
    ".vv-sub{font-size:12px;color:#6e6252;margin:0 0 14px}" +
    ".vv-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px}" +
    ".vv-grid .vv-wide{grid-column:1/-1}" +
    ".vv-grid label.vv-lbl{display:block;font-size:12px;color:#6e6252;margin-bottom:4px}" +
    ".vv-chk{display:flex;align-items:center;gap:8px;font-size:13px}" +
    ".vv-hint{font-size:11px;color:#6e6252;margin:0}" +
    ".vv-err{margin-top:12px;padding:9px 12px;border-radius:8px;background:#fdecea;color:#b3261e;font-size:12.5px}" +
    ".vv-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}" +
    ".vv-toast{position:fixed;right:20px;bottom:20px;background:#18120f;color:#fff;padding:12px 18px;border-radius:10px;font-size:13px;z-index:4000;box-shadow:0 8px 24px rgba(0,0,0,.25)}" +
    "@media(max-width:520px){.vv-grid{grid-template-columns:1fr}}";
  document.head.appendChild(st);

  /* ---------- Diálogo genérico ---------- */
  function campo(label, name, type, value, extra, wide) {
    return (
      '<div class="' + (wide ? "vv-wide" : "") + '"><label class="vv-lbl">' + esc(label) + "</label>" +
      '<input class="form-control form-control-sm" name="' + name + '" type="' + type + '" value="' + esc(value) + '" ' + (extra || "") + "></div>"
    );
  }
  function selectCampo(label, name, opciones, valor, wide) {
    return (
      '<div class="' + (wide ? "vv-wide" : "") + '"><label class="vv-lbl">' + esc(label) + "</label>" +
      '<select class="form-select form-select-sm" name="' + name + '">' +
      opciones
        .map(function (o) {
          return "<option" + (String(o) === String(valor) ? " selected" : "") + ">" + esc(o) + "</option>";
        })
        .join("") +
      "</select></div>"
    );
  }
  function abrir(o) {
    var d = document.createElement("dialog");
    d.className = "vv-dialog";
    d.innerHTML =
      "<form>" +
      "<h4>" + esc(o.titulo) + "</h4>" +
      (o.sub ? '<p class="vv-sub">' + esc(o.sub) + "</p>" : "") +
      '<div class="vv-grid">' + o.html + "</div>" +
      '<div class="vv-err" role="alert" hidden></div>' +
      '<div class="vv-actions">' +
      '<button type="button" class="btn btn-outline-spa btn-sm" data-x>Cancelar</button>' +
      '<button type="submit" class="btn btn-primary btn-sm">' + esc(o.ok) + "</button>" +
      "</div></form>";
    document.body.appendChild(d);
    var f = q("form", d),
      err = q(".vv-err", d);
    function fail(m) {
      err.textContent = m;
      err.hidden = false;
    }
    q("[data-x]", d).onclick = function () {
      d.close();
    };
    d.addEventListener("close", function () {
      d.remove();
    });
    f.onsubmit = function (e) {
      e.preventDefault();
      err.hidden = true;
      Promise.resolve(o.alEnviar(new FormData(f), fail)).then(function (r) {
        if (r !== false) d.close();
      });
    };
    d.showModal();
    return d;
  }

  /* ---------- Aplicar datos del perfil en pantalla ---------- */
  function aplicarPerfil() {
    var p = leer(K.perfil, DEF_PERFIL);
    qa(".usr b").forEach(function (el) { el.textContent = p.nombre; });
    qa(".usr small").forEach(function (el) { el.textContent = p.correo; });
    qa(".usr .av").forEach(function (el) { el.textContent = initials(p.nombre); });
    var saludo = q("[data-user-name]");
    if (saludo) saludo.textContent = p.nombre;
  }

  /* ---------- 1) Mi perfil ---------- */
  function miPerfil() {
    var p = leer(K.perfil, DEF_PERFIL);
    abrir({
      titulo: "Mi perfil",
      sub: "Actualiza tus datos de contacto.",
      ok: "Guardar cambios",
      html:
        campo("Nombre completo", "nombre", "text", p.nombre, "required maxlength='60'", true) +
        campo("Correo electrónico", "correo", "email", p.correo, "required", true) +
        campo("Teléfono (9 dígitos)", "telefono", "tel", p.telefono, "pattern='[0-9]{9}' maxlength='9' placeholder='987654321'") +
        campo("Rol", "rol", "text", "Administradora", "disabled"),
      alEnviar: function (fd) {
        guardar(K.perfil, {
          nombre: String(fd.get("nombre")).trim(),
          correo: String(fd.get("correo")).trim(),
          telefono: String(fd.get("telefono")).trim(),
        });
        aplicarPerfil();
        toast("Perfil actualizado");
      },
    });
  }

  /* ---------- 2) Cambiar contraseña ---------- */
  function cambiarPassword() {
    var d = abrir({
      titulo: "Cambiar contraseña",
      sub: "Mínimo 8 caracteres, con una mayúscula y un número.",
      ok: "Actualizar contraseña",
      html:
        campo("Contraseña actual", "actual", "password", "", "required autocomplete='current-password'", true) +
        campo("Nueva contraseña", "nueva", "password", "", "required minlength='8' autocomplete='new-password'", true) +
        campo("Confirmar nueva contraseña", "confirmar", "password", "", "required autocomplete='new-password'", true) +
        '<label class="vv-chk vv-wide"><input type="checkbox" data-ver> Mostrar contraseñas</label>',
      alEnviar: function (fd, fail) {
        var a = String(fd.get("actual")),
          n = String(fd.get("nueva")),
          c = String(fd.get("confirmar"));
        if (n.length < 8 || !/[A-Z]/.test(n) || !/[0-9]/.test(n)) {
          fail("La nueva contraseña debe tener 8+ caracteres, una mayúscula y un número.");
          return false;
        }
        if (n !== c) {
          fail("La confirmación no coincide con la nueva contraseña.");
          return false;
        }
        if (n === a) {
          fail("La nueva contraseña debe ser distinta de la actual.");
          return false;
        }
        return Promise.all([hash(a), hashGuardado()]).then(function (r) {
          if (r[0] !== r[1]) {
            fail("La contraseña actual no es correcta.");
            return false;
          }
          return hash(n).then(function (h) {
            try {
              localStorage.setItem(K.pass, h);
            } catch (e) {}
            toast("Contraseña actualizada");
          });
        });
      },
    });
    q("[data-ver]", d).onchange = function () {
      var t = this.checked ? "text" : "password";
      qa("input[type=password],input[data-pw]", d).forEach(function (i) {
        i.type = t;
        i.setAttribute("data-pw", "1");
      });
    };
  }

  /* ---------- 3) Preferencias del Spa ---------- */
  function preferencias() {
    var p = leer(K.prefs, DEF_PREFS);
    abrir({
      titulo: "Preferencias del Spa",
      sub: "Configuración general del negocio.",
      ok: "Guardar preferencias",
      html:
        campo("Nombre del spa", "spaNombre", "text", p.spaNombre, "required maxlength='60'", true) +
        campo("Teléfono del spa", "telefono", "tel", p.telefono, "maxlength='15'") +
        campo("Dirección", "direccion", "text", p.direccion, "maxlength='100'") +
        campo("Hora de apertura", "apertura", "time", p.apertura, "required") +
        campo("Hora de cierre", "cierre", "time", p.cierre, "required") +
        selectCampo("Intervalo de citas (min)", "intervalo", ["15", "30", "45", "60"], p.intervalo) +
        selectCampo("Moneda", "moneda", ["S/", "US$"], p.moneda) +
        campo("IGV (%)", "igv", "number", p.igv, "min='0' max='100' step='0.5' required") +
        '<div class="vv-wide"><p class="vv-hint" style="margin-bottom:6px">Notificaciones</p>' +
        '<label class="vv-chk"><input type="checkbox" name="notifStock"' + (p.notifStock ? " checked" : "") + "> Alertas de stock bajo</label>" +
        '<label class="vv-chk"><input type="checkbox" name="notifCitas"' + (p.notifCitas ? " checked" : "") + "> Nuevas citas online</label></div>",
      alEnviar: function (fd, fail) {
        if (String(fd.get("cierre")) <= String(fd.get("apertura"))) {
          fail("La hora de cierre debe ser posterior a la de apertura.");
          return false;
        }
        guardar(K.prefs, {
          spaNombre: String(fd.get("spaNombre")).trim(),
          telefono: String(fd.get("telefono")).trim(),
          direccion: String(fd.get("direccion")).trim(),
          apertura: fd.get("apertura"),
          cierre: fd.get("cierre"),
          intervalo: fd.get("intervalo"),
          moneda: fd.get("moneda"),
          igv: Number(fd.get("igv")),
          notifStock: fd.get("notifStock") === "on",
          notifCitas: fd.get("notifCitas") === "on",
        });
        toast("Preferencias guardadas");
      },
    });
  }

  /* ---------- 4) Cerrar sesión ---------- */
  function cerrarSesion() {
    abrir({
      titulo: "Cerrar sesión",
      sub: "¿Seguro que quieres salir del panel de administración?",
      ok: "Sí, cerrar sesión",
      html: "",
      alEnviar: function () {
        try {
          localStorage.removeItem(K.session);
          sessionStorage.clear();
        } catch (e) {}
        window.location.href = LOGIN_URL;
        return false; // mantiene el diálogo hasta que cargue el login
      },
    });
  }

  /* ---------- Conectar los botones existentes del menú ---------- */
  function conectar() {
    qa("#pm .mi").forEach(function (btn) {
      var t = (btn.textContent || "").toLowerCase();
      var fn = null;
      if (t.indexOf("contrase") > -1) fn = cambiarPassword;
      else if (t.indexOf("preferencias") > -1) fn = preferencias;
      else if (t.indexOf("cerrar") > -1) fn = cerrarSesion;
      else if (t.indexOf("perfil") > -1) fn = miPerfil;
      if (!fn) return;
      btn.type = "button";
      btn.addEventListener("click", fn);
    });
    aplicarPerfil();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", conectar);
  else conectar();

  /* API opcional para otros módulos */
  window.ViviApp = {
    perfil: function () { return leer(K.perfil, DEF_PERFIL); },
    prefs: function () { return leer(K.prefs, DEF_PREFS); },
  };
})();