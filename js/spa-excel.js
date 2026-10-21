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
    }
  };

  return SpaExcel;
});
