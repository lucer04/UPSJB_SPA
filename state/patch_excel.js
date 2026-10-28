const fs = require('fs');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'js', 'spa-excel.js');
let content = fs.readFileSync(excelPath, 'utf8');

const newExcelMethods = `
    // -------------------------------------------------------------------------
    // 5. EXPORTACIÓN DE PAGOS Y MOVIMIENTOS DE CAJA
    // -------------------------------------------------------------------------
    exportPagos(pagos = null, egresos = null, customFilename = null) {
      const filename = customFilename || \`Reporte_Pagos_Caja_\${getTodayIso()}.xlsx\`;
      const timestamp = getTimestampString();
      const listPagos = pagos || SpaStore.getPagos();
      const listEgresos = egresos || SpaStore.getEgresos();
      const caja = SpaStore.getCajaActual();

      // HOJA 1: PAGOS (INGRESOS)
      const pagosSheetData = [
        ['VIVI SPA & ESTUDIO - REPORTE DETALLADO DE PAGOS E INGRESOS'],
        [\`Generado el: \${timestamp} | Turno de Caja: \${caja.id} (\${caja.estado.toUpperCase()})\`],
        [\`Total Registros: \${listPagos.length} transacciones\`],
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
        [\`Generado el: \${timestamp} | Turno de Caja: \${caja.id}\`],
        [\`Total Registros: \${listEgresos.length} egresos\`],
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
        [\`Fecha: \${caja.fecha} | Turno: \${caja.id} | Estado: \${caja.estado.toUpperCase()}\`],
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
        SpaUI.showToast('Exportación Exitosa', \`El reporte "\${filename}" se ha descargado correctamente.\`, 'success');
      }
    },

    // -------------------------------------------------------------------------
    // 6. EXPORTACIÓN DE COMISIONES Y LIQUIDACIONES
    // -------------------------------------------------------------------------
    exportComisiones(comisiones = null, liquidaciones = null, customFilename = null) {
      const filename = customFilename || \`Reporte_Comisiones_\${getTodayIso()}.xlsx\`;
      const timestamp = getTimestampString();
      const listComs = comisiones || SpaStore.getComisiones();
      const listLiqs = liquidaciones || SpaStore.getLiquidaciones();
      const resumen = SpaStore.getResumenComisiones();

      // HOJA 1: DETALLE DE COMISIONES POR SERVICIO
      const comSheetData = [
        ['VIVI SPA & ESTUDIO - REPORTE DETALLADO DE COMISIONES'],
        [\`Generado el: \${timestamp} | Total Comisiones: \${listComs.length}\`],
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
          \`\${c.porcentajeComision || 0}%\`,
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
        [\`Generado el: \${timestamp}\`],
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
          \`\${esp.comisionPct}%\`,
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
        [\`Generado el: \${timestamp} | Total Liquidaciones: \${listLiqs.length}\`],
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
        SpaUI.showToast('Exportación Exitosa', \`El reporte "\${filename}" se ha descargado correctamente.\`, 'success');
      }
    }
`;

const insertTarget = '    exportInventario(';
const endOfInventarioTarget = content.lastIndexOf('    }');
if (endOfInventarioTarget !== -1 && !content.includes('exportPagos(')) {
  content = content.slice(0, endOfInventarioTarget) + '    },\n' + newExcelMethods + '\n  };\n\n  return SpaExcel;\n});\n';
}

fs.writeFileSync(excelPath, content, 'utf8');
console.log('Successfully updated spa-excel.js with exportPagos and exportComisiones!');
