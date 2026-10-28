/**
 * VIVI SPA & ESTUDIO - CENTRAL EXCEL EXPORT ENGINE
 * Generación profesional de reportes XLSX limpios, estructurados y con metadatos.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./spa-store'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./spa-store'));
  } else {
    root.SpaExcel = factory(root.SpaStore);
  }
})(typeof self !== 'undefined' ? self : this, function (SpaStore) {
  'use strict';

  function getTimestampString() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const d = pad(now.getDate());
    const m = pad(now.getMonth() + 1);
    const y = now.getFullYear();
    const h = pad(now.getHours());
    const min = pad(now.getMinutes());
    return `${d}/${m}/${y} ${h}:${min}`;
  }

  function getTodayIso() {
    return SpaStore.getTodayDateString();
  }

  // Descargar archivo binario o Blob
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Generador nativo XLSX si SheetJS está disponible
  function generateXlsx(workbook, filename) {
    if (typeof XLSX !== 'undefined') {
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx', type: 'binary' });
      return true;
    }
    return false;
  }

  // Fallback CSV ultra-compatible con Excel (BOM UTF-8 y delimitador punto y coma)
  function fallbackCsv(sheetData, filename) {
    const rows = sheetData.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) return '""';
        const str = String(cell).replace(/"/g, '""');
        return `"${str}"`;
      }).join(';')
    );
    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename.replace('.xlsx', '.csv'));
  }

  const SpaExcel = {
    // -------------------------------------------------------------------------
    // 1. EXPORTACIÓN DE CITAS
    // -------------------------------------------------------------------------
    exportCitas(citas, customFilename = null) {
      const filename = customFilename || `Reporte_Citas_${getTodayIso()}.xlsx`;
      const timestamp = getTimestampString();

      const totalMonto = citas.filter(c => c.estado !== 'cancelada').reduce((sum, c) => sum + (c.total || c.precio || 0), 0);
      const totalMinutos = citas.reduce((sum, c) => sum + (c.duracionMin || 0), 0);

      // Estructura de filas
      const data = [
        ['VIVI SPA & ESTUDIO — REPORTE GENERAL DE CITAS'],
        [`Generado el: ${timestamp}`, '', '', `Total Citas: ${citas.length}`, '', '', `Facturación Proyectada: S/ ${totalMonto.toFixed(2)}`],
        [] // Separador
      ];

      // Encabezados en el orden exacto solicitado
      const headers = [
        'ID Cita',
        'Fecha',
        'Hora Inicio',
        'Hora Fin',
        'Clienta',
        'Teléfono',
        'Servicio',
        'Especialista',
        'Cabina',
        'Duración (min)',
        'Precio / Total (S/)',
        'Estado de Cita',
        'Observaciones'
      ];
      data.push(headers);

      // Datos limpios
      citas.forEach(c => {
        const estadoLabel = (c.estado || 'CONFIRMADA').toUpperCase().replace('_', ' ');
        const obs = c.motivoCancelacion ? `Cancelada: ${c.motivoCancelacion}` : (c.notas || 'Sin observaciones');

        data.push([
          c.codigo || c.id || '-',
          c.fecha || '-',
          c.horaInicio || '-',
          c.horaFin || '-',
          c.clienteNombre || 'Clienta no asignada',
          c.clienteTelefono || '-',
          c.servicioNombre || 'Servicio no especificado',
          c.especialistaNombre || 'Especialista',
          c.cabinaNombre || 'Cabina',
          Number(c.duracionMin) || 0,
          Number(c.total || c.precio || 0),
          estadoLabel,
          obs
        ]);
      });

      // Fila de Totales / Resumen
      data.push([]);
      data.push([
        'TOTALES',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        `Registros: ${citas.length}`,
        totalMinutos,
        totalMonto,
        '',
        ''
      ]);

      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Anchos de columna óptimos
        ws['!cols'] = [
          { wch: 14 }, // ID Cita
          { wch: 12 }, // Fecha
          { wch: 12 }, // Hora Inicio
          { wch: 12 }, // Hora Fin
          { wch: 26 }, // Clienta
          { wch: 15 }, // Teléfono
          { wch: 28 }, // Servicio
          { wch: 20 }, // Especialista
          { wch: 18 }, // Cabina
          { wch: 15 }, // Duración
          { wch: 18 }, // Total S/
          { wch: 16 }, // Estado
          { wch: 35 }  // Observaciones
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Citas');
        generateXlsx(wb, filename);
      } else {
        fallbackCsv(data, filename);
      }

      if (typeof SpaUI !== 'undefined') {
        SpaUI.showToast('Exportación Exitosa', `El reporte "${filename}" se ha descargado correctamente.`, 'success');
      }
    },

    // -------------------------------------------------------------------------
    // 2. EXPORTACIÓN DE CLIENTES
    // -------------------------------------------------------------------------
    exportClientes(clientes, customFilename = null) {
      const filename = customFilename || `Reporte_Clientes_${getTodayIso()}.xlsx`;
      const timestamp = getTimestampString();

      const data = [
        ['VIVI SPA & ESTUDIO — DIRECTORIO DE CLIENTAS'],
        [`Generado el: ${timestamp}`, '', `Total Clientas: ${clientes.length}`, '', `Activas: ${clientes.filter(c => c.estado === 'activo').length}`],
        []
      ];

      // Encabezados en el orden exacto solicitado
      const headers = [
        'ID Clienta',
        'Nombre Completo',
        'Documento',
        'Teléfono',
        'Correo Electrónico',
        'Fecha Registro',
        'Última Visita',
        'N° Citas Históricas',
        'Estado',
        'Alergias / Contraindicaciones',
        'Preferencias de Atención'
      ];
      data.push(headers);

      clientes.forEach(c => {
        const doc = `${c.tipoDocumento || 'DNI'}: ${c.numeroDocumento || '-'}`;
        const totalCitas = SpaStore.getHistorialCliente ? SpaStore.getHistorialCliente(c.id).length : 0;
        const estadoLabel = (c.estado || 'activo').toUpperCase();

        data.push([
          c.codigo || c.id || '-',
          c.nombreCompleto || `${c.nombres || ''} ${c.apellidos || ''}`.trim(),
          doc,
          c.telefono || '-',
          c.email || 'No registrado',
          c.fechaRegistro || '-',
          c.ultimaVisita || 'Sin visitas registradas',
          totalCitas,
          estadoLabel,
          c.alergias || 'Ninguna',
          c.preferencias || 'Sin preferencias especiales'
        ]);
      });

      // Fila de resumen al pie
      data.push([]);
      data.push([
        'TOTAL REGISTROS',
        clientes.length,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);

      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        ws['!cols'] = [
          { wch: 14 }, // ID
          { wch: 28 }, // Nombre
          { wch: 18 }, // Documento
          { wch: 15 }, // Teléfono
          { wch: 26 }, // Email
          { wch: 14 }, // Fecha Registro
          { wch: 16 }, // Última Visita
          { wch: 18 }, // N° Citas
          { wch: 12 }, // Estado
          { wch: 32 }, // Alergias
          { wch: 35 }  // Preferencias
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
        generateXlsx(wb, filename);
      } else {
        fallbackCsv(data, filename);
      }

      if (typeof SpaUI !== 'undefined') {
        SpaUI.showToast('Exportación Exitosa', `El reporte "${filename}" se ha descargado correctamente.`, 'success');
      }
    },

    // -------------------------------------------------------------------------
    // 3. EXPORTACIÓN DE SERVICIOS
    // -------------------------------------------------------------------------
    exportServicios(servicios, customFilename = null) {
      const filename = customFilename || `Reporte_Servicios_${getTodayIso()}.xlsx`;
      const timestamp = getTimestampString();

      const data = [
        ['VIVI SPA & ESTUDIO — CATÁLOGO DE SERVICIOS'],
        [`Generado el: ${timestamp}`, '', `Total Servicios: ${servicios.length}`, '', `Activos: ${servicios.filter(s => s.estado !== 'inactivo').length}`],
        []
      ];

      const headers = [
        'ID Servicio',
        'Nombre del Servicio',
        'Categoría',
        'Duración (min)',
        'Precio Regular (S/)',
        'Cabina Predeterminada',
        'Especialista Asignada',
        'Estado',
        'Citas Realizadas'
      ];
      data.push(headers);

      const todasCitas = SpaStore.getCitas ? SpaStore.getCitas() : [];

      servicios.forEach(s => {
        const cabina = SpaStore.getCabinaById ? SpaStore.getCabinaById(s.cabinaRecomendada) : null;
        const especialista = SpaStore.getEspecialistaById ? SpaStore.getEspecialistaById(s.especialistaDefecto) : null;
        const citasCount = todasCitas.filter(c => c.servicioId === s.id && c.estado !== 'cancelada').length;

        data.push([
          s.id,
          s.nombre,
          (s.categoria || '').toUpperCase(),
          Number(s.duracionMin) || 0,
          Number(s.precio) || 0,
          cabina ? cabina.nombre : (s.cabinaRecomendada || '-'),
          especialista ? especialista.nombre : (s.especialistaDefecto || '-'),
          (s.estado || 'activo').toUpperCase(),
          citasCount
        ]);
      });

      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        ws['!cols'] = [
          { wch: 14 }, // ID
          { wch: 30 }, // Nombre
          { wch: 16 }, // Categoría
          { wch: 15 }, // Duración
          { wch: 18 }, // Precio S/
          { wch: 22 }, // Cabina
          { wch: 22 }, // Especialista
          { wch: 12 }, // Estado
          { wch: 16 }  // Citas
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Servicios');
        generateXlsx(wb, filename);
      } else {
        fallbackCsv(data, filename);
      }

      if (typeof SpaUI !== 'undefined') {
        SpaUI.showToast('Exportación Exitosa', `El reporte "${filename}" se ha descargado correctamente.`, 'success');
      }
    },

    // -------------------------------------------------------------------------
    // 4. EXPORTACIÓN DE INVENTARIO Y MOVIMIENTOS (2 HOJAS)
    // -------------------------------------------------------------------------
    exportInventario(productos, movimientos = [], customFilename = null) {
      const filename = customFilename || `Reporte_Inventario_${getTodayIso()}.xlsx`;
      const timestamp = getTimestampString();

      // HOJA 1: PRODUCTOS
      const valorTotalStock = productos.reduce((sum, p) => sum + ((p.stockActual || 0) * (p.precioCompra || 0)), 0);
      const stockBajoCount = productos.filter(p => p.stockActual <= p.stockMinimo && p.stockActual > 0).length;
      const agotadosCount = productos.filter(p => p.stockActual <= 0).length;

      const dataProd = [
        ['VIVI SPA & ESTUDIO — REPORTE DE INVENTARIO E INSUMOS'],
        [`Generado el: ${timestamp}`, '', `Valorización (Costo): S/ ${valorTotalStock.toFixed(2)}`, '', `Stock Bajo: ${stockBajoCount}`, '', `Agotados: ${agotadosCount}`],
        []
      ];

      const headersProd = [
        'Código / SKU',
        'Nombre del Producto',
        'Categoría',
        'Stock Actual',
        'Stock Mínimo',
        'Unidad',
        'Precio Compra (S/)',
        'Precio Venta (S/)',
        'Valor en Stock (S/)',
        'Estado del Stock'
      ];
      dataProd.push(headersProd);

      productos.forEach(p => {
        let estadoLabel = 'NORMAL';
        if (p.stockActual <= 0) estadoLabel = 'AGOTADO';
        else if (p.stockActual <= p.stockMinimo) estadoLabel = 'STOCK BAJO';

        const valorItem = (Number(p.stockActual) || 0) * (Number(p.precioCompra) || 0);

        dataProd.push([
          p.sku || p.id || '-',
          p.nombre || '-',
          (p.categoria || '').toUpperCase(),
          Number(p.stockActual) || 0,
          Number(p.stockMinimo) || 0,
          p.unidad || 'ud',
          Number(p.precioCompra) || 0,
          Number(p.precioVenta) || 0,
          Number(valorItem.toFixed(2)),
          estadoLabel
        ]);
      });

      // HOJA 2: MOVIMIENTOS
      const dataMov = [
        ['VIVI SPA & ESTUDIO — HISTORIAL DE MOVIMIENTOS DE INVENTARIO'],
        [`Generado el: ${timestamp}`, '', `Total Movimientos: ${movimientos.length}`],
        []
      ];

      const headersMov = [
        'ID Movimiento',
        'Fecha & Hora',
        'SKU Producto',
        'Nombre Producto',
        'Tipo Movimiento',
        'Cantidad',
        'Stock Anterior',
        'Stock Resultante',
        'Motivo / Justificación',
        'Responsable'
      ];
      dataMov.push(headersMov);

      movimientos.forEach(m => {
        dataMov.push([
          m.id || '-',
          m.fechaHora || m.fecha || '-',
          m.productoSku || '-',
          m.productoNombre || '-',
          (m.tipo || '').toUpperCase(),
          Number(m.cantidad) || 0,
          Number(m.stockAnterior) || 0,
          Number(m.stockNuevo) || 0,
          m.motivo || '-',
          m.usuario || 'Administradora'
        ]);
      });

      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();

        // Hoja 1
        const wsProd = XLSX.utils.aoa_to_sheet(dataProd);
        wsProd['!cols'] = [
          { wch: 14 }, // SKU
          { wch: 32 }, // Nombre
          { wch: 18 }, // Categoría
          { wch: 14 }, // Stock Actual
          { wch: 14 }, // Stock Mínimo
          { wch: 10 }, // Unidad
          { wch: 18 }, // P. Compra
          { wch: 18 }, // P. Venta
          { wch: 18 }, // Valor
          { wch: 16 }  // Estado
        ];
        XLSX.utils.book_append_sheet(wb, wsProd, 'Inventario');

        // Hoja 2
        const wsMov = XLSX.utils.aoa_to_sheet(dataMov);
        wsMov['!cols'] = [
          { wch: 14 }, // ID
          { wch: 18 }, // Fecha
          { wch: 14 }, // SKU
          { wch: 30 }, // Producto
          { wch: 16 }, // Tipo
          { wch: 12 }, // Cantidad
          { wch: 14 }, // Stock Ant.
          { wch: 14 }, // Stock Nuevo
          { wch: 35 }, // Motivo
          { wch: 18 }  // Responsable
        ];
        XLSX.utils.book_append_sheet(wb, wsMov, 'Movimientos');

        generateXlsx(wb, filename);
      } else {
        fallbackCsv(dataProd, filename);
      }

      if (typeof SpaUI !== 'undefined') {
        SpaUI.showToast('Exportación Exitosa', `El reporte "${filename}" se ha descargado correctamente.`, 'success');
      }
    },

    // -------------------------------------------------------------------------
    // 5. EXPORTACIÓN DE PAGOS Y MOVIMIENTOS DE CAJA
    // -------------------------------------------------------------------------
    exportPagos(pagos = null, egresos = null, customFilename = null) {
      const filename = customFilename || `Reporte_Pagos_Caja_${getTodayIso()}.xlsx`;
      const timestamp = getTimestampString();
      const listPagos = pagos || SpaStore.getPagos();
      const listEgresos = egresos || SpaStore.getEgresos();
      const caja = SpaStore.getCajaActual();

      // HOJA 1: PAGOS (INGRESOS)
      const pagosSheetData = [
        ['VIVI SPA & ESTUDIO - REPORTE DETALLADO DE PAGOS E INGRESOS'],
        [`Generado el: ${timestamp} | Turno de Caja: ${caja.id} (${caja.estado.toUpperCase()})`],
        [`Total Registros: ${listPagos.length} transacciones`],
        [],
        [
          'Código',
          'Fecha',
          'Hora',
          'Clienta',
          'Servicio / Concepto',
          'Especialista',
          'Método de Pago',
          'Tipo Comp.',
          'N° Comprobante',
          'N° Operación',
          'Monto (S/)',
          'Propina (S/)',
          'Estado',
          'Usuario',
          'Notas'
        ]
      ];

      let totalIngresos = 0;
      let totalPropinas = 0;

      listPagos.forEach(p => {
        if (p.estado === 'completado') {
          totalIngresos += (p.monto || 0);
          totalPropinas += (p.propina || 0);
        }
        pagosSheetData.push([
          p.codigo || '-',
          p.fecha || '-',
          p.hora || '-',
          p.clienteNombre || 'Cliente mostrador',
          p.servicioNombre || '-',
          p.especialistaNombre || 'Recepción',
          (p.metodoPago || '-').toUpperCase(),
          (p.tipoComprobante || 'boleta').toUpperCase(),
          p.numeroComprobante || '-',
          p.numeroOperacion || '-',
          Number(p.monto || 0).toFixed(2),
          Number(p.propina || 0).toFixed(2),
          (p.estado || '-').toUpperCase(),
          p.usuario || '-',
          p.notas || ''
        ]);
      });

      pagosSheetData.push([]);
      pagosSheetData.push([
        'TOTAL COBRADO',
        '', '', '', '', '', '', '', '', '',
        totalIngresos.toFixed(2),
        totalPropinas.toFixed(2),
        '', '', ''
      ]);

      // HOJA 2: EGRESOS (GASTOS OPERATIVOS)
      const egresosSheetData = [
        ['VIVI SPA & ESTUDIO - REPORTE DE EGRESOS Y GASTOS OPERATIVOS'],
        [`Generado el: ${timestamp} | Turno de Caja: ${caja.id}`],
        [`Total Registros: ${listEgresos.length} egresos`],
        [],
        [
          'Código',
          'Fecha',
          'Hora',
          'Categoría',
          'Concepto',
          'Beneficiario',
          'Método de Pago',
          'Tipo Comp.',
          'N° Ref.',
          'Monto (S/)',
          'Estado',
          'Usuario',
          'Justificación'
        ]
      ];

      let totalEgresos = 0;
      listEgresos.forEach(e => {
        if (e.estado === 'completado') {
          totalEgresos += (e.monto || 0);
        }
        egresosSheetData.push([
          e.codigo || '-',
          e.fecha || '-',
          e.hora || '-',
          (e.categoria || '-').toUpperCase(),
          e.concepto || '-',
          e.beneficiario || 'Proveedor general',
          (e.metodoPago || '-').toUpperCase(),
          (e.tipoComprobante || 'boleta').toUpperCase(),
          e.comprobanteRef || '-',
          Number(e.monto || 0).toFixed(2),
          (e.estado || '-').toUpperCase(),
          e.usuario || '-',
          e.justificacion || ''
        ]);
      });

      egresosSheetData.push([]);
      egresosSheetData.push([
        'TOTAL EGRESOS',
        '', '', '', '', '', '', '', '',
        totalEgresos.toFixed(2),
        '', '', ''
      ]);

      // HOJA 3: RESUMEN DE ARQUEO DE CAJA
      const arqueoSheetData = [
        ['VIVI SPA & ESTUDIO - RESUMEN DE ARQUEO Y BALANCE DE CAJA'],
        [`Fecha: ${caja.fecha} | Turno: ${caja.id} | Estado: ${caja.estado.toUpperCase()}`],
        [],
        ['CONCEPTO', 'MONTO (S/)'],
        ['Fondo Inicial de Apertura', Number(caja.montoApertura || 0).toFixed(2)],
        ['(+) Ingresos en Efectivo', Number(caja.ingresosEfectivo || 0).toFixed(2)],
        ['(-) Egresos en Efectivo', Number(caja.egresosEfectivo || 0).toFixed(2)],
        ['(=) SALDO ESPERADO EN EFECTIVO', Number(caja.saldoEsperadoEfectivo || 0).toFixed(2)],
        ['Conteo Real en Caja (Efectivo)', caja.montoCierreReal !== null ? Number(caja.montoCierreReal).toFixed(2) : 'Caja aún abierta'],
        ['Diferencia / Descuadre', caja.diferencia !== null ? Number(caja.diferencia).toFixed(2) : '-'],
        [],
        ['(+) Ingresos Digitales (Tarjetas, Transferencias, Yape)', Number(caja.ingresosDigitales || 0).toFixed(2)],
        ['(-) Egresos Digitales', Number(caja.egresosDigitales || 0).toFixed(2)],
        ['(=) TOTAL FACTURACIÓN NETA DEL TURNO', Number((caja.totalIngresos || 0) - (caja.totalEgresos || 0)).toFixed(2)],
        [],
        ['Observaciones Apertura:', caja.observacionesApertura || 'Sin observaciones'],
        ['Observaciones Cierre:', caja.observacionesCierre || 'Sin observaciones']
      ];

      // Exportación SheetJS
      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();

        const wsPagos = XLSX.utils.aoa_to_sheet(pagosSheetData);
        wsPagos['!cols'] = [
          { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 30 },
          { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 16 }, { wch: 15 },
          { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, wsPagos, 'Pagos e Ingresos');

        const wsEgresos = XLSX.utils.aoa_to_sheet(egresosSheetData);
        wsEgresos['!cols'] = [
          { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 16 }, { wch: 32 },
          { wch: 26 }, { wch: 15 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
          { wch: 14 }, { wch: 18 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, wsEgresos, 'Egresos y Gastos');

        const wsArqueo = XLSX.utils.aoa_to_sheet(arqueoSheetData);
        wsArqueo['!cols'] = [{ wch: 45 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsArqueo, 'Balance y Arqueo');

        XLSX.writeFile(wb, filename);
      } else {
        fallbackCsv(pagosSheetData, filename);
      }

      if (typeof SpaUI !== 'undefined') {
        SpaUI.showToast('Exportación Exitosa', `El reporte "${filename}" se ha descargado correctamente.`, 'success');
      }
    },

    // -------------------------------------------------------------------------
    // 6. EXPORTACIÓN DE COMISIONES Y LIQUIDACIONES
    // -------------------------------------------------------------------------
    exportComisiones(comisiones = null, liquidaciones = null, customFilename = null) {
      const filename = customFilename || `Reporte_Comisiones_${getTodayIso()}.xlsx`;
      const timestamp = getTimestampString();
      const listComs = comisiones || SpaStore.getComisiones();
      const listLiqs = liquidaciones || SpaStore.getLiquidaciones();
      const resumen = SpaStore.getResumenComisiones();

      // HOJA 1: DETALLE DE COMISIONES POR SERVICIO
      const comSheetData = [
        ['VIVI SPA & ESTUDIO - REPORTE DETALLADO DE COMISIONES'],
        [`Generado el: ${timestamp} | Total Comisiones: ${listComs.length}`],
        [],
        [
          'Código',
          'Fecha',
          'Hora',
          'Especialista',
          'Clienta',
          'Servicio',
          'Cita N°',
          'Precio Servicio (S/)',
          '% Comisión',
          'Monto Comisión (S/)',
          'Estado',
          'N° Liquidación',
          'Aprobado El',
          'Aprobado Por'
        ]
      ];

      let totalPrecio = 0;
      let totalComision = 0;

      listComs.forEach(c => {
        if (c.estado !== 'anulada') {
          totalPrecio += (c.precioServicio || 0);
          totalComision += (c.montoComision || 0);
        }
        comSheetData.push([
          c.codigo || '-',
          c.fecha || '-',
          c.hora || '-',
          c.especialistaNombre || '-',
          c.clienteNombre || '-',
          c.servicioNombre || '-',
          c.citaCodigo || '-',
          Number(c.precioServicio || 0).toFixed(2),
          `${c.porcentajeComision || 0}%`,
          Number(c.montoComision || 0).toFixed(2),
          (c.estado || '-').toUpperCase(),
          c.liquidacionId ? (c.liquidacionId.toUpperCase()) : '-',
          c.aprobadoEl || '-',
          c.aprobadoPor || '-'
        ]);
      });

      comSheetData.push([]);
      comSheetData.push([
        'TOTALES',
        '', '', '', '', '', '',
        totalPrecio.toFixed(2),
        '',
        totalComision.toFixed(2),
        '', '', '', ''
      ]);

      // HOJA 2: RESUMEN POR ESPECIALISTA
      const espSheetData = [
        ['VIVI SPA & ESTUDIO - RESUMEN DE COMISIONES POR ESPECIALISTA'],
        [`Generado el: ${timestamp}`],
        [],
        [
          'Especialista',
          'Especialidad',
          '% Base',
          'Servicios Realizados',
          'Total Facturado (S/)',
          'Comisión Acumulada (S/)',
          'Pendiente (S/)',
          'Aprobada (S/)',
          'Pagada / Liquidada (S/)',
          'Disponible para Liquidar (S/)'
        ]
      ];

      resumen.especialistasResumen.forEach(esp => {
        espSheetData.push([
          esp.nombre,
          esp.especialidad,
          `${esp.comisionPct}%`,
          esp.serviciosRealizados,
          Number(esp.totalFacturado).toFixed(2),
          Number(esp.comisionAcumulada).toFixed(2),
          Number(esp.comisionPendiente).toFixed(2),
          Number(esp.comisionAprobada).toFixed(2),
          Number(esp.comisionPagada).toFixed(2),
          Number(esp.disponibleParaLiquidar).toFixed(2)
        ]);
      });

      // HOJA 3: HISTORIAL DE LIQUIDACIONES EMITIDAS
      const liqSheetData = [
        ['VIVI SPA & ESTUDIO - HISTORIAL DE LIQUIDACIONES EMITIDAS'],
        [`Generado el: ${timestamp} | Total Liquidaciones: ${listLiqs.length}`],
        [],
        [
          'Código',
          'Fecha',
          'Hora',
          'Especialista',
          'Período',
          'Servicios Liquidados',
          'Total Facturado (S/)',
          'Total Liquidado (S/)',
          'Método Pago',
          'N° Operación',
          'Usuario',
          'Estado',
          'Notas'
        ]
      ];

      listLiqs.forEach(l => {
        liqSheetData.push([
          l.codigo || '-',
          l.fechaLiquidacion || '-',
          l.hora || '-',
          l.especialistaNombre || '-',
          l.periodo || '-',
          l.totalServicios || (l.comisionesIds ? l.comisionesIds.length : 0),
          Number(l.totalFacturado || 0).toFixed(2),
          Number(l.montoTotal || 0).toFixed(2),
          (l.metodoPago || '-').toUpperCase(),
          l.numeroOperacion || '-',
          l.usuario || '-',
          (l.estado || '-').toUpperCase(),
          l.notas || ''
        ]);
      });

      // Exportación SheetJS
      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();

        const wsCom = XLSX.utils.aoa_to_sheet(comSheetData);
        wsCom['!cols'] = [
          { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 24 },
          { wch: 30 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 18 },
          { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(wb, wsCom, 'Detalle Comisiones');

        const wsEsp = XLSX.utils.aoa_to_sheet(espSheetData);
        wsEsp['!cols'] = [
          { wch: 22 }, { wch: 24 }, { wch: 10 }, { wch: 18 }, { wch: 20 },
          { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 24 }
        ];
        XLSX.utils.book_append_sheet(wb, wsEsp, 'Resumen por Especialista');

        const wsLiq = XLSX.utils.aoa_to_sheet(liqSheetData);
        wsLiq['!cols'] = [
          { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 25 },
          { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 16 },
          { wch: 18 }, { wch: 14 }, { wch: 28 }
        ];
        XLSX.utils.book_append_sheet(wb, wsLiq, 'Historial Liquidaciones');

        XLSX.writeFile(wb, filename);
      } else {
        fallbackCsv(comSheetData, filename);
      }

      if (typeof SpaUI !== 'undefined') {
        SpaUI.showToast('Exportación Exitosa', `El reporte "${filename}" se ha descargado correctamente.`, 'success');
      }
    }

  };

  return SpaExcel;
});
