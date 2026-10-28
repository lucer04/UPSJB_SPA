const SpaStore = require('../js/spa-store.js');

console.log('--- Testing SpaStore Caja, Pagos, Egresos & Comisiones ---');

// 1. Caja Actual
const caja = SpaStore.getCajaActual();
console.log('1. Caja actual:', caja.id, 'Estado:', caja.estado, 'Monto apertura:', caja.montoApertura, 'Saldo esperado efectivo:', caja.saldoEsperadoEfectivo);
if (!caja || caja.estado !== 'abierta') throw new Error('Caja should be open initially');

// 2. Pagos
const pagos = SpaStore.getPagos();
console.log('2. Total pagos seed:', pagos.length);
if (pagos.length < 5) throw new Error('Expected at least 5 seed payments');

// 3. Egresos
const egresos = SpaStore.getEgresos();
console.log('3. Total egresos seed:', egresos.length);
if (egresos.length < 3) throw new Error('Expected at least 3 seed expenses');

// 4. Registrar Pago vinculando a cita
const cita = SpaStore.getCitas().find(c => c.estado === 'confirmada' && (!c.montoPagado || c.montoPagado === 0));
console.log('4. Cita a cobrar:', cita.codigo, 'Total:', cita.total);

// Test overpayment rejection:
const pagoExcesivo = SpaStore.registrarPago({
  citaId: cita.id,
  monto: cita.total + 50,
  metodoPago: 'efectivo'
});
console.log('Overpayment rejection test:', !pagoExcesivo.success, pagoExcesivo.message);
if (pagoExcesivo.success) throw new Error('Should have rejected overpayment');

// Valid payment:
const pagoValido = SpaStore.registrarPago({
  citaId: cita.id,
  monto: cita.total,
  metodoPago: 'efectivo',
  notas: 'Pago total en efectivo'
});
console.log('Valid payment test:', pagoValido.success, pagoValido.data.codigo);
if (!pagoValido.success) throw new Error('Valid payment failed');

const citaCobrada = SpaStore.getCitaById(cita.id);
console.log('Cita después de pago:', citaCobrada.codigo, 'EstadoPago:', citaCobrada.estadoPago, 'MontoPagado:', citaCobrada.montoPagado, 'SaldoPendiente:', citaCobrada.saldoPendiente);
if (citaCobrada.estadoPago !== 'pagado') throw new Error('Cita should be fully paid');

// 5. Registrar Egreso y validación de efectivo
const saldoEfectivoAntes = SpaStore.getCajaActual().saldoEsperadoEfectivo;
console.log('5. Saldo efectivo antes de egreso:', saldoEfectivoAntes);

// Egreso superior al saldo en efectivo:
const egresoExcesivo = SpaStore.registrarEgreso({
  concepto: 'Compra mayor',
  monto: saldoEfectivoAntes + 1000,
  metodoPago: 'efectivo'
});
console.log('Excessive cash withdrawal rejection test:', !egresoExcesivo.success, egresoExcesivo.message);
if (egresoExcesivo.success) throw new Error('Should have rejected cash withdrawal exceeding balance');

// Egreso válido:
const egresoValido = SpaStore.registrarEgreso({
  categoria: 'insumos',
  concepto: 'Compra de guantes y gasas',
  beneficiario: 'FarmaSalud',
  monto: 40.00,
  metodoPago: 'efectivo'
});
console.log('Valid expense test:', egresoValido.success, egresoValido.data.codigo);
if (!egresoValido.success) throw new Error('Valid expense failed');

// 6. Comisiones
const comisiones = SpaStore.getComisiones();
console.log('6. Total comisiones seed:', comisiones.length);
const resumenCom = SpaStore.getResumenComisiones();
console.log('Resumen comisiones:', 'Total generadas:', resumenCom.totalGeneradas, 'Pendientes:', resumenCom.totalPendientes, 'Aprobadas:', resumenCom.totalAprobadas, 'Top:', resumenCom.topEspecialista ? resumenCom.topEspecialista.nombre : 'N/A');

// Aprobar comisión:
const pend = comisiones.find(c => c.estado === 'pendiente');
if (pend) {
  const aprRes = SpaStore.aprobarComision(pend.id);
  console.log('Aprobación individual:', aprRes.success, aprRes.data.codigo, aprRes.data.estado);
}

// Liquidar comisiones:
const esp = SpaStore.getEspecialistas()[0];
const comsParaEsp = SpaStore.getComisiones().filter(c => c.especialistaId === esp.id && c.estado !== 'pagada');
console.log('Comisiones liquidables para', esp.nombre, ':', comsParaEsp.length);
if (comsParaEsp.length) {
  const liqRes = SpaStore.liquidarComisiones({
    especialistaId: esp.id,
    comisionesIds: comsParaEsp.map(c => c.id),
    metodoPago: 'transferencia',
    numeroOperacion: 'TRF-TEST-001',
    notas: 'Liquidación de prueba',
    registrarEgresoCaja: true
  });
  console.log('Liquidación test:', liqRes.success, liqRes.data.codigo, 'Monto:', liqRes.data.montoTotal);
}

// 7. Cierre de Caja
const cajaAntesCierre = SpaStore.getCajaActual();
const conteoRealConDescuadre = cajaAntesCierre.saldoEsperadoEfectivo + 10; // sobrante de 10

// Cierre con descuadre sin justificación debe fallar:
const cierreSinObs = SpaStore.cerrarCaja({
  montoCierreReal: conteoRealConDescuadre,
  observaciones: ''
});
console.log('Closure without explanation rejection test:', !cierreSinObs.success, cierreSinObs.message);
if (cierreSinObs.success) throw new Error('Should have rejected closure with unnoted discrepancy');

// Cierre correcto con justificación:
const cierreValido = SpaStore.cerrarCaja({
  montoCierreReal: conteoRealConDescuadre,
  observaciones: 'Sobrante de S/ 10 por propina no retirada de cliente'
});
console.log('Valid closure test:', cierreValido.success, cierreValido.data.estado, 'Diferencia:', cierreValido.data.diferencia);
if (!cierreValido.success) throw new Error('Valid closure failed');

// 8. Intentar registrar pago en caja cerrada debe fallar:
const pagoCajaCerrada = SpaStore.registrarPago({
  monto: 50,
  metodoPago: 'efectivo'
});
console.log('Payment on closed cash register rejection test:', !pagoCajaCerrada.success, pagoCajaCerrada.message);
if (pagoCajaCerrada.success) throw new Error('Should have rejected payment on closed cash register');

// 9. Reabrir caja:
const reapertura = SpaStore.abrirCaja({
  montoApertura: 300,
  observaciones: 'Apertura de nuevo turno tarde'
});
console.log('Reopening cash register test:', reapertura.success, reapertura.data.id, 'Fondo:', reapertura.data.montoApertura);
if (!reapertura.success) throw new Error('Reopening failed');

console.log('--- ALL BACKEND STORE TESTS PASSED PERFECTLY! ---');
