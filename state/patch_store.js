const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'js', 'spa-store.js');
let content = fs.readFileSync(storePath, 'utf8');

// Methods for Caja, Pagos, Egresos, Comisiones & Liquidaciones
const newMethods = `
    // =============================================================
    // MÓDULO PAGOS Y CAJA
    // =============================================================
    getCajaActual() {
      let caja = loadFromStorage(STORAGE_KEY_CAJA_ACTUAL, null);
      if (!caja) {
        caja = generateSeedCajaActual();
        saveToStorage(STORAGE_KEY_CAJA_ACTUAL, caja);
      }

      // Si la caja está abierta, calcular ingresos y egresos vivos
      const pagos = this.getPagos();
      const egresos = this.getEgresos();

      const pagosCaja = pagos.filter(p => p.cajaId === caja.id && p.estado === 'completado');
      const ingresosEfectivo = pagosCaja.filter(p => p.metodoPago === 'efectivo').reduce((sum, p) => sum + (p.monto || 0), 0);
      const ingresosDigitales = pagosCaja.filter(p => p.metodoPago !== 'efectivo').reduce((sum, p) => sum + (p.monto || 0), 0);
      const totalIngresos = ingresosEfectivo + ingresosDigitales;

      const egresosCaja = egresos.filter(e => e.cajaId === caja.id && e.estado === 'completado');
      const egresosEfectivo = egresosCaja.filter(e => e.metodoPago === 'efectivo').reduce((sum, e) => sum + (e.monto || 0), 0);
      const egresosDigitales = egresosCaja.filter(e => e.metodoPago !== 'efectivo').reduce((sum, e) => sum + (e.monto || 0), 0);
      const totalEgresos = egresosEfectivo + egresosDigitales;

      const saldoEsperadoEfectivo = (caja.montoApertura || 0) + ingresosEfectivo - egresosEfectivo;
      const saldoTotalSistema = (caja.montoApertura || 0) + totalIngresos - totalEgresos;

      return {
        ...caja,
        ingresosEfectivo,
        ingresosDigitales,
        totalIngresos,
        egresosEfectivo,
        egresosDigitales,
        totalEgresos,
        saldoEsperadoEfectivo,
        saldoTotalSistema,
        totalTransacciones: pagosCaja.length + egresosCaja.length
      };
    },

    abrirCaja({ montoApertura, usuario, observaciones }) {
      const cajaActual = this.getCajaActual();
      if (cajaActual.estado === 'abierta') {
        return {
          success: false,
          message: 'La caja ya se encuentra abierta actualmente. Debe realizar el cierre antes de abrir una nueva.'
        };
      }

      const monto = parseFloat(montoApertura);
      if (isNaN(monto) || monto < 0) {
        return {
          success: false,
          message: 'El monto inicial de apertura no puede ser negativo.'
        };
      }

      const today = getTodayDateString();
      const timeStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      const nuevaCaja = {
        id: \`caj-\${today.replace(/-/g, '')}-\${Date.now().toString().slice(-4)}\`,
        fecha: today,
        horaApertura: timeStr,
        montoApertura: monto,
        usuarioApertura: (usuario || 'Administradora').trim(),
        estado: 'abierta',
        observacionesApertura: (observaciones || 'Apertura de turno').trim(),
        horaCierre: null,
        usuarioCierre: null,
        montoCierreReal: null,
        saldoEsperado: null,
        diferencia: null,
        observacionesCierre: null
      };

      saveToStorage(STORAGE_KEY_CAJA_ACTUAL, nuevaCaja);

      return {
        success: true,
        data: nuevaCaja,
        message: \`Caja abierta exitosamente con fondo inicial de \${formatMoney(monto)}.\`
      };
    },

    cerrarCaja({ montoCierreReal, usuario, observaciones }) {
      const caja = this.getCajaActual();
      if (caja.estado !== 'abierta') {
        return {
          success: false,
          message: 'No existe una caja abierta para cerrar.'
        };
      }

      const conteoReal = parseFloat(montoCierreReal);
      if (isNaN(conteoReal) || conteoReal < 0) {
        return {
          success: false,
          message: 'Ingrese un conteo real en efectivo válido (monto mayor o igual a 0).'
        };
      }

      const saldoEsperado = caja.saldoEsperadoEfectivo;
      const diferencia = Math.round((conteoReal - saldoEsperado) * 100) / 100;

      if (Math.abs(diferencia) > 0.01 && (!observaciones || observaciones.trim().length < 5)) {
        return {
          success: false,
          message: \`Existe un descuadre de caja de \${formatMoney(Math.abs(diferencia))} (\${diferencia > 0 ? 'sobrante' : 'faltante'}). Es obligatorio registrar una justificación clara (mínimo 5 caracteres).\`
        };
      }

      const timeStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      const cajaCerrada = {
        ...caja,
        estado: 'cerrada',
        horaCierre: timeStr,
        usuarioCierre: (usuario || 'Administradora').trim(),
        montoCierreReal: conteoReal,
        saldoEsperado: saldoEsperado,
        diferencia: diferencia,
        observacionesCierre: (observaciones || (diferencia === 0 ? 'Cierre conforme sin descuadre.' : 'Cierre con arqueo verificado.')).trim()
      };

      // Guardar en el historial
      const historial = loadFromStorage(STORAGE_KEY_CAJAS_HISTORIAL, generateSeedCajasHistorial());
      historial.unshift(cajaCerrada);
      saveToStorage(STORAGE_KEY_CAJAS_HISTORIAL, historial);

      // Actualizar estado en caja_actual
      saveToStorage(STORAGE_KEY_CAJA_ACTUAL, cajaCerrada);

      let msgDescuadre = 'Cierre conforme sin descuadre.';
      if (diferencia > 0) msgDescuadre = \`Sobrante registrado: +\${formatMoney(diferencia)}.\`;
      if (diferencia < 0) msgDescuadre = \`Faltante registrado: -\${formatMoney(Math.abs(diferencia))}.\`;

      return {
        success: true,
        data: cajaCerrada,
        message: \`Caja cerrada con éxito. Saldo real: \${formatMoney(conteoReal)}. \${msgDescuadre}\`
      };
    },

    getCajasHistorial() {
      return loadFromStorage(STORAGE_KEY_CAJAS_HISTORIAL, generateSeedCajasHistorial());
    },

    getPagos(filtro = {}) {
      let list = loadFromStorage(STORAGE_KEY_PAGOS, generateSeedPagos());

      if (filtro.metodoPago && filtro.metodoPago !== 'todos') {
        list = list.filter(p => p.metodoPago === filtro.metodoPago);
      }
      if (filtro.estado && filtro.estado !== 'todos') {
        list = list.filter(p => p.estado === filtro.estado);
      }
      if (filtro.cajaId) {
        list = list.filter(p => p.cajaId === filtro.cajaId);
      }
      if (filtro.fecha) {
        list = list.filter(p => p.fecha === filtro.fecha);
      }
      if (filtro.busqueda) {
        const q = filtro.busqueda.toLowerCase();
        list = list.filter(p =>
          (p.codigo && p.codigo.toLowerCase().includes(q)) ||
          (p.clienteNombre && p.clienteNombre.toLowerCase().includes(q)) ||
          (p.servicioNombre && p.servicioNombre.toLowerCase().includes(q)) ||
          (p.numeroOperacion && p.numeroOperacion.toLowerCase().includes(q)) ||
          (p.numeroComprobante && p.numeroComprobante.toLowerCase().includes(q))
        );
      }

      return list;
    },

    getPagoById(id) {
      const pagos = this.getPagos();
      return pagos.find(p => p.id === id || p.codigo === id) || null;
    },

    registrarPago(datos) {
      const caja = this.getCajaActual();
      if (caja.estado !== 'abierta') {
        return {
          success: false,
          message: 'No es posible registrar pagos porque la caja está cerrada. Debe abrir la caja primero.'
        };
      }

      const monto = parseFloat(datos.monto);
      if (isNaN(monto) || monto <= 0) {
        return {
          success: false,
          message: 'El monto a cobrar debe ser mayor a 0.'
        };
      }

      let citaRelacionada = null;
      if (datos.citaId) {
        const citas = this.getCitas();
        citaRelacionada = citas.find(c => c.id === datos.citaId || c.codigo === datos.citaId);
        if (citaRelacionada) {
          const saldoPend = typeof citaRelacionada.saldoPendiente === 'number'
            ? citaRelacionada.saldoPendiente
            : Math.max(0, citaRelacionada.total - (citaRelacionada.montoPagado || 0));

          if (monto > saldoPend + 0.05) {
            return {
              success: false,
              message: \`El monto ingresado (\${formatMoney(monto)}) supera el saldo pendiente de la cita (\${formatMoney(saldoPend)}).\`
            };
          }

          citaRelacionada.montoPagado = Math.round(((citaRelacionada.montoPagado || 0) + monto) * 100) / 100;
          citaRelacionada.saldoPendiente = Math.max(0, Math.round((citaRelacionada.total - citaRelacionada.montoPagado) * 100) / 100);
          citaRelacionada.estadoPago = citaRelacionada.saldoPendiente <= 0.05 ? 'pagado' : 'parcial';
          if (datos.metodoPago) {
            citaRelacionada.metodoPago = datos.metodoPago;
          }
          saveToStorage(STORAGE_KEY_CITAS, citas);

          // Si la cita está completada o pasa a estar pagada, asegurar comisión
          if (citaRelacionada.estado === 'completada') {
            this.generarComisionParaCita(citaRelacionada.id);
          }
        }
      }

      const pagos = loadFromStorage(STORAGE_KEY_PAGOS, generateSeedPagos());
      const nextNum = pagos.length + 1;
      const codigo = \`PAG-2026-\${String(nextNum).padStart(3, '0')}\`;
      const id = \`pag-\${Date.now().toString().slice(-6)}\`;
      const today = getTodayDateString();
      const timeStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      const nuevoPago = {
        id,
        codigo,
        cajaId: caja.id,
        citaId: datos.citaId || null,
        citaCodigo: datos.citaCodigo || (citaRelacionada ? citaRelacionada.codigo : null),
        clienteId: datos.clienteId || (citaRelacionada ? citaRelacionada.clienteId : null),
        clienteNombre: (datos.clienteNombre || (citaRelacionada ? citaRelacionada.clienteNombre : 'Cliente mostrador')).trim(),
        servicioId: datos.servicioId || (citaRelacionada ? citaRelacionada.servicioId : null),
        servicioNombre: (datos.servicioNombre || (citaRelacionada ? citaRelacionada.servicioNombre : 'Venta directa en mostrador')).trim(),
        especialistaId: datos.especialistaId || (citaRelacionada ? citaRelacionada.especialistaId : null),
        especialistaNombre: (datos.especialistaNombre || (citaRelacionada ? citaRelacionada.especialistaNombre : 'Recepción')).trim(),
        monto: monto,
        metodoPago: datos.metodoPago || 'efectivo',
        tipoComprobante: datos.tipoComprobante || 'boleta',
        numeroComprobante: datos.numeroComprobante || \`B001-\${String(420 + nextNum).padStart(6, '0')}\`,
        numeroOperacion: datos.numeroOperacion ? datos.numeroOperacion.trim() : null,
        propina: parseFloat(datos.propina) || 0.00,
        fecha: datos.fecha || today,
        hora: datos.hora || timeStr,
        estado: 'completado',
        usuario: datos.usuario || 'Recepción',
        notas: (datos.notas || '').trim(),
        motivoAnulacion: null
      };

      pagos.unshift(nuevoPago);
      saveToStorage(STORAGE_KEY_PAGOS, pagos);

      return {
        success: true,
        data: nuevoPago,
        cita: citaRelacionada,
        message: \`Pago \${codigo} por \${formatMoney(monto)} registrado con éxito.\`
      };
    },

    anularPago(id, motivo) {
      if (!motivo || motivo.trim().length < 5) {
        return {
          success: false,
          message: 'Debe ingresar un motivo de anulación válido (mínimo 5 caracteres).'
        };
      }

      const pagos = loadFromStorage(STORAGE_KEY_PAGOS, generateSeedPagos());
      const pago = pagos.find(p => p.id === id || p.codigo === id);
      if (!pago) {
        return { success: false, message: 'Pago no encontrado.' };
      }
      if (pago.estado === 'anulado') {
        return { success: false, message: 'Este pago ya se encuentra anulado.' };
      }

      // Revertir en la cita si correspondía
      if (pago.citaId) {
        const citas = this.getCitas();
        const cita = citas.find(c => c.id === pago.citaId || c.codigo === pago.citaId);
        if (cita) {
          cita.montoPagado = Math.max(0, Math.round(((cita.montoPagado || 0) - pago.monto) * 100) / 100);
          cita.saldoPendiente = Math.max(0, Math.round((cita.total - cita.montoPagado) * 100) / 100);
          cita.estadoPago = cita.montoPagado <= 0 ? 'pendiente' : 'parcial';
          saveToStorage(STORAGE_KEY_CITAS, citas);
        }
      }

      pago.estado = 'anulado';
      pago.motivoAnulacion = motivo.trim();
      pago.anuladoEl = \`\${getTodayDateString()} \${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}\`;

      saveToStorage(STORAGE_KEY_PAGOS, pagos);

      return {
        success: true,
        data: pago,
        message: \`Pago \${pago.codigo} anulado exitosamente. Saldo revertido en caja.\`
      };
    },

    getEgresos(filtro = {}) {
      let list = loadFromStorage(STORAGE_KEY_EGRESOS, generateSeedEgresos());

      if (filtro.categoria && filtro.categoria !== 'todas') {
        list = list.filter(e => e.categoria === filtro.categoria);
      }
      if (filtro.metodoPago && filtro.metodoPago !== 'todos') {
        list = list.filter(e => e.metodoPago === filtro.metodoPago);
      }
      if (filtro.estado && filtro.estado !== 'todos') {
        list = list.filter(e => e.estado === filtro.estado);
      }
      if (filtro.cajaId) {
        list = list.filter(e => e.cajaId === filtro.cajaId);
      }
      if (filtro.fecha) {
        list = list.filter(e => e.fecha === filtro.fecha);
      }
      if (filtro.busqueda) {
        const q = filtro.busqueda.toLowerCase();
        list = list.filter(e =>
          (e.codigo && e.codigo.toLowerCase().includes(q)) ||
          (e.concepto && e.concepto.toLowerCase().includes(q)) ||
          (e.beneficiario && e.beneficiario.toLowerCase().includes(q)) ||
          (e.comprobanteRef && e.comprobanteRef.toLowerCase().includes(q))
        );
      }

      return list;
    },

    getEgresoById(id) {
      const egresos = this.getEgresos();
      return egresos.find(e => e.id === id || e.codigo === id) || null;
    },

    registrarEgreso(datos) {
      const caja = this.getCajaActual();
      if (caja.estado !== 'abierta') {
        return {
          success: false,
          message: 'No es posible registrar egresos porque la caja está cerrada. Debe abrir la caja primero.'
        };
      }

      const monto = parseFloat(datos.monto);
      if (isNaN(monto) || monto <= 0) {
        return {
          success: false,
          message: 'El monto del egreso debe ser mayor a 0.'
        };
      }

      if (!datos.concepto || datos.concepto.trim().length < 3) {
        return {
          success: false,
          message: 'Debe ingresar un concepto claro para el egreso (mínimo 3 caracteres).'
        };
      }

      const metodoPago = datos.metodoPago || 'efectivo';
      if (metodoPago === 'efectivo' && monto > (caja.saldoEsperadoEfectivo + 0.01)) {
        return {
          success: false,
          message: \`Saldo en efectivo insuficiente en caja (Disponible: \${formatMoney(caja.saldoEsperadoEfectivo)}). No puede retirar \${formatMoney(monto)}.\`
        };
      }

      const egresos = loadFromStorage(STORAGE_KEY_EGRESOS, generateSeedEgresos());
      const nextNum = egresos.length + 1;
      const codigo = \`EGR-2026-\${String(nextNum).padStart(3, '0')}\`;
      const id = \`egr-\${Date.now().toString().slice(-6)}\`;
      const today = getTodayDateString();
      const timeStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      const nuevoEgreso = {
        id,
        codigo,
        cajaId: caja.id,
        categoria: datos.categoria || 'otro',
        concepto: datos.concepto.trim(),
        beneficiario: (datos.beneficiario || 'Proveedor general').trim(),
        monto: monto,
        metodoPago: metodoPago,
        tipoComprobante: datos.tipoComprobante || 'boleta',
        comprobanteRef: (datos.comprobanteRef || '').trim(),
        fecha: datos.fecha || today,
        hora: datos.hora || timeStr,
        estado: 'completado',
        usuario: datos.usuario || 'Lucero Administradora',
        justificacion: (datos.justificacion || '').trim(),
        motivoAnulacion: null
      };

      egresos.unshift(nuevoEgreso);
      saveToStorage(STORAGE_KEY_EGRESOS, egresos);

      return {
        success: true,
        data: nuevoEgreso,
        message: \`Egreso \${codigo} por \${formatMoney(monto)} registrado correctamente.\`
      };
    },

    anularEgreso(id, motivo) {
      if (!motivo || motivo.trim().length < 5) {
        return {
          success: false,
          message: 'Debe ingresar un motivo de anulación válido (mínimo 5 caracteres).'
        };
      }

      const egresos = loadFromStorage(STORAGE_KEY_EGRESOS, generateSeedEgresos());
      const egreso = egresos.find(e => e.id === id || e.codigo === id);
      if (!egreso) {
        return { success: false, message: 'Egreso no encontrado.' };
      }
      if (egreso.estado === 'anulado') {
        return { success: false, message: 'Este egreso ya se encuentra anulado.' };
      }

      egreso.estado = 'anulado';
      egreso.motivoAnulacion = motivo.trim();
      egreso.anuladoEl = \`\${getTodayDateString()} \${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}\`;

      saveToStorage(STORAGE_KEY_EGRESOS, egresos);

      return {
        success: true,
        data: egreso,
        message: \`Egreso \${egreso.codigo} anulado exitosamente. Saldo reintegrado a caja.\`
      };
    },

    getResumenCaja() {
      const caja = this.getCajaActual();
      const pagos = this.getPagos();
      const egresos = this.getEgresos();

      const pagosHoy = pagos.filter(p => p.fecha === caja.fecha && p.estado === 'completado');
      const egresosHoy = egresos.filter(e => e.fecha === caja.fecha && e.estado === 'completado');

      const porMetodo = {
        efectivo: pagosHoy.filter(p => p.metodoPago === 'efectivo').reduce((sum, p) => sum + p.monto, 0),
        tarjeta: pagosHoy.filter(p => p.metodoPago === 'tarjeta').reduce((sum, p) => sum + p.monto, 0),
        transferencia: pagosHoy.filter(p => p.metodoPago === 'transferencia').reduce((sum, p) => sum + p.monto, 0),
        yape: pagosHoy.filter(p => p.metodoPago === 'yape').reduce((sum, p) => sum + p.monto, 0)
      };

      return {
        cajaActual: caja,
        saldoInicial: caja.montoApertura || 0,
        ingresosDia: caja.totalIngresos,
        ingresosEfectivo: caja.ingresosEfectivo,
        ingresosDigitales: caja.ingresosDigitales,
        egresosDia: caja.totalEgresos,
        egresosEfectivo: caja.egresosEfectivo,
        egresosDigitales: caja.egresosDigitales,
        saldoActual: caja.saldoTotalSistema,
        saldoEfectivo: caja.saldoEsperadoEfectivo,
        totalTransacciones: caja.totalTransacciones,
        estado: caja.estado,
        porMetodo
      };
    },

    // =============================================================
    // MÓDULO COMISIONES Y LIQUIDACIONES
    // =============================================================
    getComisiones(filtro = {}) {
      let list = loadFromStorage(STORAGE_KEY_COMISIONES, generateSeedComisiones());

      if (filtro.especialistaId && filtro.especialistaId !== 'todos') {
        list = list.filter(c => c.especialistaId === filtro.especialistaId);
      }
      if (filtro.estado && filtro.estado !== 'todos') {
        list = list.filter(c => c.estado === filtro.estado);
      }
      if (filtro.fecha) {
        list = list.filter(c => c.fecha === filtro.fecha);
      }
      if (filtro.busqueda) {
        const q = filtro.busqueda.toLowerCase();
        list = list.filter(c =>
          (c.codigo && c.codigo.toLowerCase().includes(q)) ||
          (c.especialistaNombre && c.especialistaNombre.toLowerCase().includes(q)) ||
          (c.clienteNombre && c.clienteNombre.toLowerCase().includes(q)) ||
          (c.servicioNombre && c.servicioNombre.toLowerCase().includes(q)) ||
          (c.citaCodigo && c.citaCodigo.toLowerCase().includes(q))
        );
      }

      return list;
    },

    getComisionById(id) {
      const list = this.getComisiones();
      return list.find(c => c.id === id || c.codigo === id) || null;
    },

    getReglasComision() {
      return loadFromStorage(STORAGE_KEY_REGLAS_COMISION, generateSeedReglasComision());
    },

    guardarReglaComision({ especialistaId, porcentaje, categoria, notas }) {
      const pct = parseFloat(porcentaje);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return { success: false, message: 'El porcentaje de comisión debe estar entre 0% y 100%.' };
      }

      const reglas = this.getReglasComision();
      let regla = reglas.find(r => r.especialistaId === especialistaId);

      const esp = this.getEspecialistaById(especialistaId);
      const espNombre = esp ? esp.nombre : 'Especialista';

      if (regla) {
        regla.porcentaje = pct;
        if (categoria) regla.categoria = categoria;
        if (notas) regla.notas = notas;
      } else {
        regla = {
          id: \`reg-\${Date.now().toString().slice(-4)}\`,
          especialistaId,
          especialistaNombre: espNombre,
          categoria: categoria || 'todas',
          porcentaje: pct,
          notas: notas || 'Regla personalizada'
        };
        reglas.push(regla);
      }
      saveToStorage(STORAGE_KEY_REGLAS_COMISION, reglas);

      // Sincronizar en el catálogo de especialistas
      const especialistas = this.getEspecialistas();
      const targetEsp = especialistas.find(e => e.id === especialistaId);
      if (targetEsp) {
        targetEsp.comisionPct = pct;
        saveToStorage(STORAGE_KEY_ESPECIALISTAS, especialistas);
      }

      return {
        success: true,
        data: regla,
        message: \`Regla de comisión para \${espNombre} actualizada al \${pct}%.\`
      };
    },

    generarComisionParaCita(citaId) {
      const cita = this.getCitaById(citaId);
      if (!cita) return null;

      // Verificar si ya existe una comisión registrada para esta cita
      const comisiones = loadFromStorage(STORAGE_KEY_COMISIONES, generateSeedComisiones());
      const existente = comisiones.find(c => c.citaId === cita.id);
      if (existente) return existente;

      // Obtener porcentaje de regla o default del especialista
      const reglas = this.getReglasComision();
      const regla = reglas.find(r => r.especialistaId === cita.especialistaId);
      const esp = this.getEspecialistaById(cita.especialistaId);
      const porcentaje = regla ? regla.porcentaje : (esp && esp.comisionPct ? esp.comisionPct : 25);

      const precioServicio = cita.total || cita.precio || 0;
      const montoComision = Math.round((precioServicio * (porcentaje / 100)) * 100) / 100;

      const nextNum = comisiones.length + 1;
      const codigo = \`COM-2026-\${String(nextNum).padStart(3, '0')}\`;
      const id = \`com-\${Date.now().toString().slice(-6)}\`;

      const nuevaComision = {
        id,
        codigo,
        citaId: cita.id,
        citaCodigo: cita.codigo,
        especialistaId: cita.especialistaId,
        especialistaNombre: cita.especialistaNombre,
        clienteNombre: cita.clienteNombre,
        servicioNombre: cita.servicioNombre,
        precioServicio: precioServicio,
        porcentajeComision: porcentaje,
        montoComision: montoComision,
        fecha: cita.fecha,
        hora: cita.horaInicio || '10:00',
        estado: 'pendiente',
        liquidacionId: null,
        aprobadoEl: null,
        aprobadoPor: null
      };

      comisiones.unshift(nuevaComision);
      saveToStorage(STORAGE_KEY_COMISIONES, comisiones);

      return nuevaComision;
    },

    aprobarComision(id) {
      const comisiones = loadFromStorage(STORAGE_KEY_COMISIONES, generateSeedComisiones());
      const comision = comisiones.find(c => c.id === id || c.codigo === id);
      if (!comision) {
        return { success: false, message: 'Comisión no encontrada.' };
      }
      if (comision.estado === 'pagada') {
        return { success: false, message: 'Esta comisión ya se encuentra pagada.' };
      }

      comision.estado = 'aprobada';
      comision.aprobadoEl = \`\${getTodayDateString()} \${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}\`;
      comision.aprobadoPor = 'Lucero Administradora';

      saveToStorage(STORAGE_KEY_COMISIONES, comisiones);

      return {
        success: true,
        data: comision,
        message: \`Comisión \${comision.codigo} por \${formatMoney(comision.montoComision)} aprobada correctamente.\`
      };
    },

    aprobarComisionesLote(ids) {
      if (!ids || !ids.length) {
        return { success: false, message: 'Seleccione al menos una comisión para aprobar.' };
      }

      const comisiones = loadFromStorage(STORAGE_KEY_COMISIONES, generateSeedComisiones());
      let count = 0;
      const timeStr = \`\${getTodayDateString()} \${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}\`;

      comisiones.forEach(c => {
        if (ids.includes(c.id) && c.estado === 'pendiente') {
          c.estado = 'aprobada';
          c.aprobadoEl = timeStr;
          c.aprobadoPor = 'Lucero Administradora';
          count++;
        }
      });

      saveToStorage(STORAGE_KEY_COMISIONES, comisiones);

      return {
        success: true,
        count,
        message: \`\${count} comisión(es) aprobada(s) exitosamente.\`
      };
    },

    liquidarComisiones({ especialistaId, comisionesIds, metodoPago, numeroOperacion, notas, registrarEgresoCaja = true }) {
      if (!especialistaId) {
        return { success: false, message: 'Especialista no especificada.' };
      }
      if (!comisionesIds || !comisionesIds.length) {
        return { success: false, message: 'Debe seleccionar al menos una comisión para liquidar.' };
      }

      const comisiones = loadFromStorage(STORAGE_KEY_COMISIONES, generateSeedComisiones());
      const seleccionadas = comisiones.filter(c => comisionesIds.includes(c.id) && c.especialistaId === especialistaId && c.estado !== 'pagada');

      if (!seleccionadas.length) {
        return { success: false, message: 'No se encontraron comisiones pendientes o aprobadas para liquidar en la selección.' };
      }

      const esp = this.getEspecialistaById(especialistaId);
      const espNombre = esp ? esp.nombre : (seleccionadas[0].especialistaNombre || 'Especialista');

      const totalLiquidacion = Math.round(seleccionadas.reduce((sum, c) => sum + (c.montoComision || 0), 0) * 100) / 100;
      const totalFacturado = Math.round(seleccionadas.reduce((sum, c) => sum + (c.precioServicio || 0), 0) * 100) / 100;

      const liquidaciones = loadFromStorage(STORAGE_KEY_LIQUIDACIONES, generateSeedLiquidaciones());
      const nextNum = liquidaciones.length + 1;
      const codLiq = \`LIQ-2026-\${String(nextNum).padStart(3, '0')}\`;
      const liqId = \`liq-\${Date.now().toString().slice(-6)}\`;
      const today = getTodayDateString();
      const timeStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      let egresoId = null;
      // Si se paga en efectivo o transferencia y registrarEgresoCaja está activo, registrar egreso en caja
      if (registrarEgresoCaja) {
        const egresoRes = this.registrarEgreso({
          categoria: 'comisiones',
          concepto: \`Liquidación de comisiones \${codLiq} - \${espNombre}\`,
          beneficiario: espNombre,
          monto: totalLiquidacion,
          metodoPago: metodoPago || 'transferencia',
          comprobanteRef: codLiq,
          justificacion: \`Pago de \${seleccionadas.length} comisiones correspondientes a servicios realizados\`
        });
        if (egresoRes.success) {
          egresoId = egresoRes.data.id;
        }
      }

      const nuevaLiq = {
        id: liqId,
        codigo: codLiq,
        especialistaId,
        especialistaNombre: espNombre,
        periodo: \`Liquidación al \${formatDateFriendly(today)}\`,
        comisionesIds: seleccionadas.map(c => c.id),
        totalServicios: seleccionadas.length,
        totalFacturado: totalFacturado,
        montoTotal: totalLiquidacion,
        metodoPago: metodoPago || 'transferencia',
        numeroOperacion: (numeroOperacion || '').trim(),
        fechaLiquidacion: today,
        hora: timeStr,
        usuario: 'Lucero Administradora',
        egresoId: egresoId,
        notas: (notas || '').trim(),
        estado: 'liquidada'
      };

      liquidaciones.unshift(nuevaLiq);
      saveToStorage(STORAGE_KEY_LIQUIDACIONES, liquidaciones);

      // Actualizar estado de las comisiones
      seleccionadas.forEach(c => {
        c.estado = 'pagada';
        c.liquidacionId = liqId;
      });
      saveToStorage(STORAGE_KEY_COMISIONES, comisiones);

      return {
        success: true,
        data: nuevaLiq,
        message: \`Liquidación \${codLiq} emitida por \${formatMoney(totalLiquidacion)} para \${espNombre}.\`
      };
    },

    getLiquidaciones(especialistaId = null) {
      let list = loadFromStorage(STORAGE_KEY_LIQUIDACIONES, generateSeedLiquidaciones());
      if (especialistaId && especialistaId !== 'todos') {
        list = list.filter(l => l.especialistaId === especialistaId);
      }
      return list;
    },

    getLiquidacionById(id) {
      const list = this.getLiquidaciones();
      return list.find(l => l.id === id || l.codigo === id) || null;
    },

    getResumenComisiones() {
      const comisiones = this.getComisiones();
      const especialistas = this.getEspecialistas();

      const activas = comisiones.filter(c => c.estado !== 'anulada');
      const totalGeneradas = activas.reduce((sum, c) => sum + (c.montoComision || 0), 0);
      const totalPendientes = activas.filter(c => c.estado === 'pendiente').reduce((sum, c) => sum + (c.montoComision || 0), 0);
      const totalAprobadas = activas.filter(c => c.estado === 'aprobada').reduce((sum, c) => sum + (c.montoComision || 0), 0);
      const totalPagadas = activas.filter(c => c.estado === 'pagada').reduce((sum, c) => sum + (c.montoComision || 0), 0);

      // Resumen por especialista
      const especialistasResumen = especialistas.map(esp => {
        const comsEsp = activas.filter(c => c.especialistaId === esp.id);
        const serviciosRealizados = comsEsp.length;
        const totalFacturado = comsEsp.reduce((sum, c) => sum + (c.precioServicio || 0), 0);
        const comisionAcumulada = comsEsp.reduce((sum, c) => sum + (c.montoComision || 0), 0);
        const comisionPendiente = comsEsp.filter(c => c.estado === 'pendiente').reduce((sum, c) => sum + (c.montoComision || 0), 0);
        const comisionAprobada = comsEsp.filter(c => c.estado === 'aprobada').reduce((sum, c) => sum + (c.montoComision || 0), 0);
        const comisionPagada = comsEsp.filter(c => c.estado === 'pagada').reduce((sum, c) => sum + (c.montoComision || 0), 0);

        return {
          id: esp.id,
          nombre: esp.nombre,
          especialidad: esp.especialidad,
          categoria: esp.categoria,
          comisionPct: esp.comisionPct || 25,
          serviciosRealizados,
          totalFacturado,
          comisionAcumulada,
          comisionPendiente,
          comisionAprobada,
          comisionPagada,
          disponibleParaLiquidar: comisionPendiente + comisionAprobada
        };
      });

      // Top especialista
      let topEspecialista = null;
      if (especialistasResumen.length) {
        topEspecialista = [...especialistasResumen].sort((a, b) => b.comisionAcumulada - a.comisionAcumulada)[0];
      }

      return {
        totalGeneradas,
        totalPendientes,
        totalAprobadas,
        totalPagadas,
        especialistasResumen,
        topEspecialista
      };
    },
`;

const targetIndex = content.indexOf('// CONSULTAS PARA DASHBOARD & REPORTES');
if (targetIndex !== -1) {
  content = content.slice(0, targetIndex) + newMethods + '\n    ' + content.slice(targetIndex);
}

fs.writeFileSync(storePath, content, 'utf8');
console.log('Successfully injected methods into spa-store.js!');
