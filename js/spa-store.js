/**
 * VIVI SPA & ESTUDIO - CENTRAL DATA STORE & BUSINESS ENGINE
 * Manejo centralizado de Clientes, Citas, Especialistas, Servicios y Cabinas.
 * Persistencia en localStorage con sembrado inteligente (Seed Data).
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpaStore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY_CITAS = 'vivi_spa_citas_v1';
  const STORAGE_KEY_CLIENTES = 'vivi_spa_clientes_v1';
  const STORAGE_KEY_ESPECIALISTAS = 'vivi_spa_especialistas_v1';
  const STORAGE_KEY_CABINAS = 'vivi_spa_cabinas_v1';
  const STORAGE_KEY_SERVICIOS = 'vivi_spa_servicios_v1';
  const STORAGE_KEY_PRODUCTOS = 'vivi_spa_productos_v1';
  const STORAGE_KEY_MOVIMIENTOS = 'vivi_spa_movimientos_v1';

  // Formato YYYY-MM-DD para hoy
  function getTodayDateString(offsetDays = 0) {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Horas del Spa: 09:00 a 20:00
  const SPA_HORA_APERTURA = '09:00';
  const SPA_HORA_CIERRE = '20:00';

  // Seed Data: Cabinas
  const SEED_CABINAS = [
    { id: 'cab-1', nombre: 'Cabina 1', tipo: 'Facial & Skin Care', especialidad: 'facial', estado: 'activa' },
    { id: 'cab-2', nombre: 'Cabina 2', tipo: 'Masajes & Bienestar', especialidad: 'masajes', estado: 'activa' },
    { id: 'cab-3', nombre: 'Cabina 3', tipo: 'Láser & Aparatología', especialidad: 'laser', estado: 'activa' },
    { id: 'cab-4', nombre: 'Estudio Glow', tipo: 'Nail Studio & Manicure', especialidad: 'estudio', estado: 'activa' }
  ];

  // Seed Data: Especialistas
  const SEED_ESPECIALISTAS = [
    {
      id: 'esp-1',
      nombre: 'Camila Ríos',
      especialidad: 'Facial & Skin Care',
      categoria: 'facial',
      telefono: '987 654 321',
      email: 'camila.rios@vivispa.com',
      estado: 'activa',
      comisionPct: 25,
      iniciales: 'CR'
    },
    {
      id: 'esp-2',
      nombre: 'Daniela Soto',
      especialidad: 'Masajes & Bienestar',
      categoria: 'masajes',
      telefono: '981 234 567',
      email: 'daniela.soto@vivispa.com',
      estado: 'activa',
      comisionPct: 25,
      iniciales: 'DS'
    },
    {
      id: 'esp-3',
      nombre: 'Valeria Núñez',
      especialidad: 'Láser & Aparatología',
      categoria: 'laser',
      telefono: '992 345 678',
      email: 'valeria.nunez@vivispa.com',
      estado: 'activa',
      comisionPct: 25,
      iniciales: 'VN'
    },
    {
      id: 'esp-4',
      nombre: 'Paola Vega',
      especialidad: 'Nail Studio & Manicure',
      categoria: 'estudio',
      telefono: '973 456 789',
      email: 'paola.vega@vivispa.com',
      estado: 'activa',
      comisionPct: 30,
      iniciales: 'PV'
    }
  ];

  // Seed Data: Servicios
  const SEED_SERVICIOS = [
    { id: 'srv-1', nombre: 'Facial Hidratante Profundo', categoria: 'facial', duracionMin: 120, precio: 140, cabinaRecomendada: 'cab-1', especialistaDefecto: 'esp-1', estado: 'activo', descripcion: 'Tratamiento intensivo con ácido hialurónico y velo de colágeno.' },
    { id: 'srv-2', nombre: 'Limpieza Facial & Peeling', categoria: 'facial', duracionMin: 120, precio: 150, cabinaRecomendada: 'cab-1', especialistaDefecto: 'esp-1', estado: 'activo', descripcion: 'Extracción de impurezas, microdermoabrasión y renovación celular.' },
    { id: 'srv-3', nombre: 'Tratamiento Antiedad Oro', categoria: 'facial', duracionMin: 90, precio: 180, cabinaRecomendada: 'cab-1', especialistaDefecto: 'esp-1', estado: 'activo', descripcion: 'Lifting biológico tensor con oro coloidal e iluminación facial.' },
    { id: 'srv-4', nombre: 'Masaje Relajante Aromaterapia', categoria: 'masajes', duracionMin: 120, precio: 130, cabinaRecomendada: 'cab-2', especialistaDefecto: 'esp-2', estado: 'activo', descripcion: 'Sesión integral antiestrés con aceites esenciales botánicos franceses.' },
    { id: 'srv-5', nombre: 'Masaje Piedras Volcánicas', categoria: 'masajes', duracionMin: 90, precio: 160, cabinaRecomendada: 'cab-2', especialistaDefecto: 'esp-2', estado: 'activo', descripcion: 'Termoterapia con piedras basálticas calientes para relajar contracturas.' },
    { id: 'srv-6', nombre: 'Depilación Láser Diodo', categoria: 'laser', duracionMin: 90, precio: 150, cabinaRecomendada: 'cab-3', especialistaDefecto: 'esp-3', estado: 'activo', descripcion: 'Eliminación progresiva y definitiva del vello con sistema de enfriamiento.' },
    { id: 'srv-7', nombre: 'Rejuvenecimiento Facial Láser', categoria: 'laser', duracionMin: 60, precio: 200, cabinaRecomendada: 'cab-3', especialistaDefecto: 'esp-3', estado: 'activo', descripcion: 'Estimulación térmica de colágeno para atenuar líneas de expresión.' },
    { id: 'srv-8', nombre: 'Spa Pedicure Deluxe', categoria: 'estudio', duracionMin: 90, precio: 85, cabinaRecomendada: 'cab-4', especialistaDefecto: 'esp-4', estado: 'activo', descripcion: 'Cuidado completo con exfoliación marina, baño hidratante y esmaltado.' },
    { id: 'srv-9', nombre: 'Manicure Ruso con Gel', categoria: 'estudio', duracionMin: 90, precio: 75, cabinaRecomendada: 'cab-4', especialistaDefecto: 'esp-4', estado: 'activo', descripcion: 'Técnica en seco con torno de alta precisión y nivelación en gel.' },
    { id: 'srv-10', nombre: 'Esmaltado Semipermanente', categoria: 'estudio', duracionMin: 90, precio: 60, cabinaRecomendada: 'cab-4', especialistaDefecto: 'esp-4', estado: 'activo', descripcion: 'Color de alto brillo con secado UV/LED de 3 semanas de duración.' }
  ];

  // Seed Data: Productos de Inventario
  const SEED_PRODUCTOS = [
    {
      id: 'prd-1',
      sku: 'SKU-ACE-001',
      nombre: 'Aceite de masaje argán y almendras 500ml',
      categoria: 'insumos_masajes',
      stockActual: 2,
      stockMinimo: 5,
      unidad: 'Frasco 500ml',
      precioCompra: 38.00,
      precioVenta: 0,
      ubicacion: 'Cabina 2',
      estado: 'activo',
      descripcion: 'Mezcla emoliente con aceites prensados en frío para masajes relajantes.'
    },
    {
      id: 'prd-2',
      sku: 'SKU-SER-002',
      nombre: 'Serum concentrado ácido hialurónico 100ml',
      categoria: 'facial',
      stockActual: 15,
      stockMinimo: 4,
      unidad: 'Frasco 100ml',
      precioCompra: 65.00,
      precioVenta: 110.00,
      ubicacion: 'Cabina 1',
      estado: 'activo',
      descripcion: 'Alta concentración de ácido hialurónico para hidratación profunda.'
    },
    {
      id: 'prd-3',
      sku: 'SKU-GEL-003',
      nombre: 'Gel conductor hipoalergénico aparatología 1L',
      categoria: 'laser',
      stockActual: 8,
      stockMinimo: 3,
      unidad: 'Botella 1L',
      precioCompra: 24.00,
      precioVenta: 0,
      ubicacion: 'Cabina 3',
      estado: 'activo',
      descripcion: 'Gel conductor neutro para sesiones de depilación láser diodo.'
    },
    {
      id: 'prd-4',
      sku: 'SKU-MAS-004',
      nombre: 'Mascarilla hidroplástica oro coloidal 500g',
      categoria: 'facial',
      stockActual: 6,
      stockMinimo: 3,
      unidad: 'Tarro 500g',
      precioCompra: 52.00,
      precioVenta: 95.00,
      ubicacion: 'Cabina 1',
      estado: 'activo',
      descripcion: 'Mascarilla peel-off con partículas de oro que aporta firmeza inmediata.'
    },
    {
      id: 'prd-5',
      sku: 'SKU-EXF-005',
      nombre: 'Exfoliante sales marinas y karité 1kg',
      categoria: 'insumos_masajes',
      stockActual: 7,
      stockMinimo: 3,
      unidad: 'Tarro 1kg',
      precioCompra: 42.00,
      precioVenta: 75.00,
      ubicacion: 'Cabina 2',
      estado: 'activo',
      descripcion: 'Sales del mar muerto enriquecidas con manteca de karité.'
    },
    {
      id: 'prd-6',
      sku: 'SKU-ESM-006',
      nombre: 'Set esmaltes semipermanentes gama nude (x6)',
      categoria: 'estudio',
      stockActual: 12,
      stockMinimo: 4,
      unidad: 'Caja x6',
      precioCompra: 78.00,
      precioVenta: 135.00,
      ubicacion: 'Estudio Glow',
      estado: 'activo',
      descripcion: 'Gama de esmaltes libres de químicos agresivos de larga duración.'
    },
    {
      id: 'prd-7',
      sku: 'SKU-ACE-007',
      nombre: 'Aceite esencial lavanda francesa 30ml',
      categoria: 'insumos_masajes',
      stockActual: 10,
      stockMinimo: 3,
      unidad: 'Frasco 30ml',
      precioCompra: 29.00,
      precioVenta: 48.00,
      ubicacion: 'Almacén Central',
      estado: 'activo',
      descripcion: 'Aceite 100% puro para difusores de aromaterapia e inhalaciones.'
    },
    {
      id: 'prd-8',
      sku: 'SKU-TOA-008',
      nombre: 'Toallas microfibra ultra-suave blancas (x10)',
      categoria: 'blanqueria',
      stockActual: 30,
      stockMinimo: 10,
      unidad: 'Pack x10',
      precioCompra: 45.00,
      precioVenta: 0,
      ubicacion: 'Almacén Central',
      estado: 'activo',
      descripcion: 'Toallas de alta absorción resistentes a lavados continuos.'
    },
    {
      id: 'prd-9',
      sku: 'SKU-CRE-009',
      nombre: 'Crema regeneradora post-láser aloe vera 250ml',
      categoria: 'laser',
      stockActual: 0,
      stockMinimo: 4,
      unidad: 'Tubo 250ml',
      precioCompra: 32.00,
      precioVenta: 55.00,
      ubicacion: 'Cabina 3',
      estado: 'activo',
      descripcion: 'Fórmula descongestiva y calmante post-tratamientos de calor.'
    },
    {
      id: 'prd-10',
      sku: 'SKU-LIP-010',
      nombre: 'Bálsamo regenerador labial colágeno 15ml',
      categoria: 'facial',
      stockActual: 18,
      stockMinimo: 5,
      unidad: 'Unidad 15ml',
      precioCompra: 18.00,
      precioVenta: 35.00,
      ubicacion: 'Vitrina Recepción',
      estado: 'activo',
      descripcion: 'Bálsamo para venta en recepción con colágeno y filtro solar.'
    }
  ];

  // Seed Data: Historial de Movimientos de Inventario
  const SEED_MOVIMIENTOS = [
    {
      id: 'mov-1',
      productoId: 'prd-1',
      productoSku: 'SKU-ACE-001',
      productoNombre: 'Aceite de masaje argán y almendras 500ml',
      tipo: 'salida',
      cantidad: 3,
      stockAnterior: 5,
      stockNuevo: 2,
      motivo: 'Consumo operativo en Cabina 2 para sesiones del día',
      usuario: 'Camila Ríos',
      fechaHora: `${getTodayDateString()} 09:15`
    },
    {
      id: 'mov-2',
      productoId: 'prd-2',
      productoSku: 'SKU-SER-002',
      productoNombre: 'Serum concentrado ácido hialurónico 100ml',
      tipo: 'entrada',
      cantidad: 10,
      stockAnterior: 5,
      stockNuevo: 15,
      motivo: 'Recepción de pedido proveedor Laboratorios DermaCare',
      usuario: 'Administradora',
      fechaHora: `${getTodayDateString(-1)} 16:30`
    },
    {
      id: 'mov-3',
      productoId: 'prd-9',
      productoSku: 'SKU-CRE-009',
      productoNombre: 'Crema regeneradora post-láser aloe vera 250ml',
      tipo: 'salida',
      cantidad: 4,
      stockAnterior: 4,
      stockNuevo: 0,
      motivo: 'Consumo intensivo en jornada de depilación láser',
      usuario: 'Valeria Núñez',
      fechaHora: `${getTodayDateString(-2)} 18:00`
    }
  ];

  // Seed Data: Clientes
  const SEED_CLIENTES = [
    {
      id: 'cli-1',
      codigo: 'CLI-001',
      nombres: 'Lucía',
      apellidos: 'Requena Flores',
      nombreCompleto: 'Lucía Requena Flores',
      tipoDocumento: 'DNI',
      numeroDocumento: '72345678',
      telefono: '994 512 876',
      email: 'lucia.requena@gmail.com',
      fechaNacimiento: '1992-05-14',
      alergias: 'Sensible al retinol y alcohol puro',
      preferencias: 'Aromas florales suaves, música instrumental suave',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-60),
      ultimaVisita: getTodayDateString()
    },
    {
      id: 'cli-2',
      codigo: 'CLI-002',
      nombres: 'Sofía',
      apellidos: 'Mendoza Paz',
      nombreCompleto: 'Sofía Mendoza Paz',
      tipoDocumento: 'DNI',
      numeroDocumento: '71234567',
      telefono: '981 745 231',
      email: 'sofia.mendoza@hotmail.com',
      fechaNacimiento: '1988-11-20',
      alergias: 'Ninguna conocida',
      preferencias: 'Prefiere sesiones los fines de semana',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-120),
      ultimaVisita: getTodayDateString()
    },
    {
      id: 'cli-3',
      codigo: 'CLI-003',
      nombres: 'Mariana',
      apellidos: 'Paz Calderón',
      nombreCompleto: 'Mariana Paz Calderón',
      tipoDocumento: 'DNI',
      numeroDocumento: '74567890',
      telefono: '972 389 412',
      email: 'mariana.paz@outlook.com',
      fechaNacimiento: '1995-02-18',
      alergias: 'Sensible a esencias cítricas',
      preferencias: 'Atención exclusiva de Camila Ríos',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-30),
      ultimaVisita: getTodayDateString()
    },
    {
      id: 'cli-4',
      codigo: 'CLI-004',
      nombres: 'Marta',
      apellidos: 'Gómez Rivera',
      nombreCompleto: 'Marta Gómez Rivera',
      tipoDocumento: 'DNI',
      numeroDocumento: '70123456',
      telefono: '965 214 789',
      email: 'marta.gomez@gmail.com',
      fechaNacimiento: '1984-08-30',
      alergias: 'Ninguna',
      preferencias: 'Presión moderada en masajes corporales',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-90),
      ultimaVisita: getTodayDateString()
    },
    {
      id: 'cli-5',
      codigo: 'CLI-005',
      nombres: 'Elena',
      apellidos: 'Castro Miranda',
      nombreCompleto: 'Elena Castro Miranda',
      tipoDocumento: 'DNI',
      numeroDocumento: '73456789',
      telefono: '998 123 456',
      email: 'elena.castro@yahoo.com',
      fechaNacimiento: '1990-09-12',
      alergias: 'Ninguna',
      preferencias: 'Piedras volcánicas a temperatura media',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-45),
      ultimaVisita: getTodayDateString()
    },
    {
      id: 'cli-6',
      codigo: 'CLI-006',
      nombres: 'Carmen',
      apellidos: 'Morales Silva',
      nombreCompleto: 'Carmen Morales Silva',
      tipoDocumento: 'DNI',
      numeroDocumento: '75678901',
      telefono: '983 456 712',
      email: 'carmen.morales@gmail.com',
      fechaNacimiento: '1989-04-05',
      alergias: 'Ninguna',
      preferencias: 'Gel conductor hipoalergénico',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-75),
      ultimaVisita: getTodayDateString()
    },
    {
      id: 'cli-7',
      codigo: 'CLI-007',
      nombres: 'Rosa',
      apellidos: 'Torres Vidal',
      nombreCompleto: 'Rosa Torres Vidal',
      tipoDocumento: 'DNI',
      numeroDocumento: '76789012',
      telefono: '971 654 987',
      email: 'rosa.torres@gmail.com',
      fechaNacimiento: '1993-07-22',
      alergias: 'Fototipo cutáneo III, ligera sensibilidad',
      preferencias: 'Protector solar toque seco al finalizar',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-15),
      ultimaVisita: getTodayDateString()
    },
    {
      id: 'cli-8',
      codigo: 'CLI-008',
      nombres: 'Jimena',
      apellidos: 'Solís Valdivia',
      nombreCompleto: 'Jimena Solís Valdivia',
      tipoDocumento: 'DNI',
      numeroDocumento: '77890123',
      telefono: '963 852 741',
      email: 'jimena.solis@gmail.com',
      fechaNacimiento: '1996-03-10',
      alergias: 'Ninguna',
      preferencias: 'Exfoliación suave de sales marinas',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-180),
      ultimaVisita: getTodayDateString()
    },
    {
      id: 'cli-9',
      codigo: 'CLI-009',
      nombres: 'Andrea',
      apellidos: 'Prado Salazar',
      nombreCompleto: 'Andrea Prado Salazar',
      tipoDocumento: 'DNI',
      numeroDocumento: '78901234',
      telefono: '952 741 852',
      email: 'andrea.prado@gmail.com',
      fechaNacimiento: '1991-12-04',
      alergias: 'Sensibilidad a acetona pura',
      preferencias: 'Tonos nude y esmaltes libres de formaldehído',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-35),
      ultimaVisita: getTodayDateString()
    },
    {
      id: 'cli-10',
      codigo: 'CLI-010',
      nombres: 'Karla',
      apellidos: 'Ruiz Montes',
      nombreCompleto: 'Karla Ruiz Montes',
      tipoDocumento: 'DNI',
      numeroDocumento: '79012345',
      telefono: '941 963 258',
      email: 'karla.ruiz@gmail.com',
      fechaNacimiento: '1994-06-25',
      alergias: 'Ninguna',
      preferencias: 'Diseños minimalistas en uñas',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-10),
      ultimaVisita: getTodayDateString()
    },
    {
      id: 'cli-11',
      codigo: 'CLI-011',
      nombres: 'Valentina',
      apellidos: 'Ramos Luján',
      nombreCompleto: 'Valentina Ramos Luján',
      tipoDocumento: 'DNI',
      numeroDocumento: '70987654',
      telefono: '987 123 654',
      email: 'valentina.ramos@gmail.com',
      fechaNacimiento: '1997-01-15',
      alergias: 'Ninguna',
      preferencias: 'Citas por la tarde',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-5),
      ultimaVisita: getTodayDateString(-1)
    },
    {
      id: 'cli-12',
      codigo: 'CLI-012',
      nombres: 'Claudia',
      apellidos: 'Benítez Herrera',
      nombreCompleto: 'Claudia Benítez Herrera',
      tipoDocumento: 'CE',
      numeroDocumento: '001293847',
      telefono: '991 827 364',
      email: 'claudia.benitez@gmail.com',
      fechaNacimiento: '1986-10-08',
      alergias: 'Ninguna',
      preferencias: 'Masaje descontracturante',
      estado: 'activo',
      fechaRegistro: getTodayDateString(-1),
      ultimaVisita: null
    }
  ];

  // Seed Data: Citas correspondientes a la agenda del Dashboard y días cercanos
  function generateSeedCitas() {
    const today = getTodayDateString();
    const yesterday = getTodayDateString(-1);
    const tomorrow = getTodayDateString(1);

    return [
      {
        id: 'cit-101',
        codigo: 'CIT-2026-001',
        clienteId: 'cli-1',
        clienteNombre: 'Lucía Requena Flores',
        clienteTelefono: '994 512 876',
        servicioId: 'srv-1',
        servicioNombre: 'Facial Hidratante Profundo',
        servicioCategoria: 'facial',
        especialistaId: 'esp-1',
        especialistaNombre: 'Camila Ríos',
        cabinaId: 'cab-1',
        cabinaNombre: 'Cabina 1',
        fecha: today,
        horaInicio: '10:00',
        horaFin: '12:00',
        duracionMin: 120,
        precio: 140,
        descuento: 0,
        total: 140,
        metodoPago: 'tarjeta',
        estado: 'en_curso',
        notas: 'Primera sesión del paquete de hidratación.',
        motivoCancelacion: null,
        creadoEl: `${today}T08:30:00`
      },
      {
        id: 'cit-102',
        codigo: 'CIT-2026-002',
        clienteId: 'cli-2',
        clienteNombre: 'Sofía Mendoza Paz',
        clienteTelefono: '981 745 231',
        servicioId: 'srv-2',
        servicioNombre: 'Limpieza Facial & Peeling',
        servicioCategoria: 'facial',
        especialistaId: 'esp-1',
        especialistaNombre: 'Camila Ríos',
        cabinaId: 'cab-1',
        cabinaNombre: 'Cabina 1',
        fecha: today,
        horaInicio: '14:00',
        horaFin: '16:00',
        duracionMin: 120,
        precio: 150,
        descuento: 0,
        total: 150,
        metodoPago: 'efectivo',
        estado: 'confirmada',
        notas: 'Cliente puntual. Confirmó por WhatsApp.',
        motivoCancelacion: null,
        creadoEl: `${today}T09:00:00`
      },
      {
        id: 'cit-103',
        codigo: 'CIT-2026-003',
        clienteId: 'cli-3',
        clienteNombre: 'Mariana Paz Calderón',
        clienteTelefono: '972 389 412',
        servicioId: 'srv-3',
        servicioNombre: 'Tratamiento Antiedad Oro',
        servicioCategoria: 'facial',
        especialistaId: 'esp-1',
        especialistaNombre: 'Camila Ríos',
        cabinaId: 'cab-1',
        cabinaNombre: 'Cabina 1',
        fecha: today,
        horaInicio: '16:30',
        horaFin: '18:00',
        duracionMin: 90,
        precio: 180,
        descuento: 0,
        total: 180,
        metodoPago: 'transferencia',
        estado: 'confirmada',
        notas: 'Cita VIP. Preparar toallas calientes.',
        motivoCancelacion: null,
        creadoEl: `${today}T09:15:00`
      },
      {
        id: 'cit-104',
        codigo: 'CIT-2026-004',
        clienteId: 'cli-4',
        clienteNombre: 'Marta Gómez Rivera',
        clienteTelefono: '965 214 789',
        servicioId: 'srv-4',
        servicioNombre: 'Masaje Relajante Aromaterapia',
        servicioCategoria: 'masajes',
        especialistaId: 'esp-2',
        especialistaNombre: 'Daniela Soto',
        cabinaId: 'cab-2',
        cabinaNombre: 'Cabina 2',
        fecha: today,
        horaInicio: '11:30',
        horaFin: '13:30',
        duracionMin: 120,
        precio: 130,
        descuento: 0,
        total: 130,
        metodoPago: 'tarjeta',
        estado: 'confirmada',
        notas: 'Aroma lavanda y manzanilla solicitado.',
        motivoCancelacion: null,
        creadoEl: `${today}T08:45:00`
      },
      {
        id: 'cit-105',
        codigo: 'CIT-2026-005',
        clienteId: 'cli-5',
        clienteNombre: 'Elena Castro Miranda',
        clienteTelefono: '998 123 456',
        servicioId: 'srv-5',
        servicioNombre: 'Masaje Piedras Volcánicas',
        servicioCategoria: 'masajes',
        especialistaId: 'esp-2',
        especialistaNombre: 'Daniela Soto',
        cabinaId: 'cab-2',
        cabinaNombre: 'Cabina 2',
        fecha: today,
        horaInicio: '15:00',
        horaFin: '16:30',
        duracionMin: 90,
        precio: 160,
        descuento: 0,
        total: 160,
        metodoPago: 'yape',
        estado: 'confirmada',
        notas: 'Cliente solicita cabina a temperatura cálida.',
        motivoCancelacion: null,
        creadoEl: `${today}T09:20:00`
      },
      {
        id: 'cit-106',
        codigo: 'CIT-2026-006',
        clienteId: 'cli-6',
        clienteNombre: 'Carmen Morales Silva',
        clienteTelefono: '983 456 712',
        servicioId: 'srv-6',
        servicioNombre: 'Depilación Láser Diodo',
        servicioCategoria: 'laser',
        especialistaId: 'esp-3',
        especialistaNombre: 'Valeria Núñez',
        cabinaId: 'cab-3',
        cabinaNombre: 'Cabina 3',
        fecha: today,
        horaInicio: '09:30',
        horaFin: '11:00',
        duracionMin: 90,
        precio: 150,
        descuento: 0,
        total: 150,
        metodoPago: 'tarjeta',
        estado: 'completada',
        notas: 'Sesión 3 de 6 completada con éxito.',
        motivoCancelacion: null,
        creadoEl: `${today}T08:00:00`
      },
      {
        id: 'cit-107',
        codigo: 'CIT-2026-007',
        clienteId: 'cli-7',
        clienteNombre: 'Rosa Torres Vidal',
        clienteTelefono: '971 654 987',
        servicioId: 'srv-7',
        servicioNombre: 'Rejuvenecimiento Facial Láser',
        servicioCategoria: 'laser',
        especialistaId: 'esp-3',
        especialistaNombre: 'Valeria Núñez',
        cabinaId: 'cab-3',
        cabinaNombre: 'Cabina 3',
        fecha: today,
        horaInicio: '16:30',
        horaFin: '17:30',
        duracionMin: 60,
        precio: 200,
        descuento: 0,
        total: 200,
        metodoPago: 'pendiente',
        estado: 'pendiente',
        notas: 'Por confirmar asistencia 2 horas antes.',
        motivoCancelacion: null,
        creadoEl: `${today}T10:00:00`
      },
      {
        id: 'cit-108',
        codigo: 'CIT-2026-008',
        clienteId: 'cli-8',
        clienteNombre: 'Jimena Solís Valdivia',
        clienteTelefono: '963 852 741',
        servicioId: 'srv-8',
        servicioNombre: 'Spa Pedicure Deluxe',
        servicioCategoria: 'estudio',
        especialistaId: 'esp-4',
        especialistaNombre: 'Paola Vega',
        cabinaId: 'cab-4',
        cabinaNombre: 'Estudio Glow',
        fecha: today,
        horaInicio: '12:00',
        horaFin: '13:30',
        duracionMin: 90,
        precio: 85,
        descuento: 0,
        total: 85,
        metodoPago: 'tarjeta',
        estado: 'confirmada',
        notas: 'Pedicure spa con parafina.',
        motivoCancelacion: null,
        creadoEl: `${today}T09:30:00`
      },
      {
        id: 'cit-109',
        codigo: 'CIT-2026-009',
        clienteId: 'cli-9',
        clienteNombre: 'Andrea Prado Salazar',
        clienteTelefono: '952 741 852',
        servicioId: 'srv-9',
        servicioNombre: 'Manicure Ruso con Gel',
        servicioCategoria: 'estudio',
        especialistaId: 'esp-4',
        especialistaNombre: 'Paola Vega',
        cabinaId: 'cab-4',
        cabinaNombre: 'Estudio Glow',
        fecha: today,
        horaInicio: '14:00',
        horaFin: '15:30',
        duracionMin: 90,
        precio: 75,
        descuento: 0,
        total: 75,
        metodoPago: 'pendiente',
        estado: 'pendiente',
        notas: 'Pendiente de llamada de confirmación.',
        motivoCancelacion: null,
        creadoEl: `${today}T10:15:00`
      },
      {
        id: 'cit-110',
        codigo: 'CIT-2026-010',
        clienteId: 'cli-10',
        clienteNombre: 'Karla Ruiz Montes',
        clienteTelefono: '941 963 258',
        servicioId: 'srv-10',
        servicioNombre: 'Esmaltado Semipermanente',
        servicioCategoria: 'estudio',
        especialistaId: 'esp-4',
        especialistaNombre: 'Paola Vega',
        cabinaId: 'cab-4',
        cabinaNombre: 'Estudio Glow',
        fecha: today,
        horaInicio: '16:00',
        horaFin: '17:30',
        duracionMin: 90,
        precio: 60,
        descuento: 0,
        total: 60,
        metodoPago: 'yape',
        estado: 'confirmada',
        notas: 'Retiro de esmalte anterior incluido.',
        motivoCancelacion: null,
        creadoEl: `${today}T09:50:00`
      },
      // Citas adicionales de contexto (Ayer completada, Mañana programada, Cancelada)
      {
        id: 'cit-111',
        codigo: 'CIT-2026-011',
        clienteId: 'cli-11',
        clienteNombre: 'Valentina Ramos Luján',
        clienteTelefono: '987 123 654',
        servicioId: 'srv-3',
        servicioNombre: 'Tratamiento Antiedad Oro',
        servicioCategoria: 'facial',
        especialistaId: 'esp-1',
        especialistaNombre: 'Camila Ríos',
        cabinaId: 'cab-1',
        cabinaNombre: 'Cabina 1',
        fecha: yesterday,
        horaInicio: '16:30',
        horaFin: '18:00',
        duracionMin: 90,
        precio: 180,
        descuento: 0,
        total: 180,
        metodoPago: 'tarjeta',
        estado: 'completada',
        notas: 'Atención impecable. Clienta muy satisfecha.',
        motivoCancelacion: null,
        creadoEl: `${yesterday}T10:00:00`
      },
      {
        id: 'cit-112',
        codigo: 'CIT-2026-012',
        clienteId: 'cli-12',
        clienteNombre: 'Claudia Benítez Herrera',
        clienteTelefono: '991 827 364',
        servicioId: 'srv-4',
        servicioNombre: 'Masaje Relajante Aromaterapia',
        servicioCategoria: 'masajes',
        especialistaId: 'esp-2',
        especialistaNombre: 'Daniela Soto',
        cabinaId: 'cab-2',
        cabinaNombre: 'Cabina 2',
        fecha: today,
        horaInicio: '09:00',
        horaFin: '11:00',
        duracionMin: 120,
        precio: 130,
        descuento: 0,
        total: 130,
        metodoPago: 'tarjeta',
        estado: 'cancelada',
        notas: 'Cancelación solicitada por motivos laborales.',
        motivoCancelacion: 'Imprevisto laboral de la clienta.',
        creadoEl: `${yesterday}T14:00:00`
      },
      {
        id: 'cit-113',
        codigo: 'CIT-2026-013',
        clienteId: 'cli-1',
        clienteNombre: 'Lucía Requena Flores',
        clienteTelefono: '994 512 876',
        servicioId: 'srv-8',
        servicioNombre: 'Spa Pedicure Deluxe',
        servicioCategoria: 'estudio',
        especialistaId: 'esp-4',
        especialistaNombre: 'Paola Vega',
        cabinaId: 'cab-4',
        cabinaNombre: 'Estudio Glow',
        fecha: tomorrow,
        horaInicio: '11:00',
        horaFin: '12:30',
        duracionMin: 90,
        precio: 85,
        descuento: 0,
        total: 85,
        metodoPago: 'pendiente',
        estado: 'confirmada',
        notas: 'Reserva para día siguiente.',
        motivoCancelacion: null,
        creadoEl: `${today}T11:00:00`
      }
    ];
  }

  // Helper para leer/escribir en storage de forma segura con fallback en memoria
  const memoryStorage = {};

  function loadFromStorage(key, fallbackData) {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(key);
        if (data) return JSON.parse(data);
      } else if (memoryStorage[key]) {
        return JSON.parse(memoryStorage[key]);
      }
    } catch (e) {
      // Ignorar fallo de parseo
    }
    saveToStorage(key, fallbackData);
    return fallbackData;
  }

  function saveToStorage(key, data) {
    try {
      const json = JSON.stringify(data);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, json);
      } else {
        memoryStorage[key] = json;
      }
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('spastore:change', { detail: { key } }));
      }
    } catch (e) {
      // Error de cuota o escritura
    }
  }

  // Convertir hora "HH:MM" a minutos desde medianoche
  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return parts[0] * 60 + (parts[1] || 0);
  }

  // Convertir minutos desde medianoche a hora "HH:MM"
  function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Formato de moneda peruana (S/ 0.00 o S/ 140)
  function formatMoney(amount) {
    const val = Number(amount) || 0;
    return `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  // Formato amigable de fecha en español
  function formatDateFriendly(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    return `${parts[2]} ${months[d.getMonth()]} ${parts[0]}`;
  }

  // OBJETO PRINCIPAL DEL STORE
  const SpaStore = {
    SPA_HORA_APERTURA,
    SPA_HORA_CIERRE,

    // Inicializar datos
    init() {
      this.getCabinas();
      this.getEspecialistas();
      this.getServicios();
      this.getClientes();
      this.getCitas();
    },

    // -------------------------------------------------------------
    // CATÁLOGOS BASE
    // -------------------------------------------------------------
    getCabinas() {
      return loadFromStorage(STORAGE_KEY_CABINAS, SEED_CABINAS);
    },

    getCabinaById(id) {
      return this.getCabinas().find(c => c.id === id) || null;
    },

    getEspecialistas() {
      return loadFromStorage(STORAGE_KEY_ESPECIALISTAS, SEED_ESPECIALISTAS);
    },

    getEspecialistaById(id) {
      return this.getEspecialistas().find(e => e.id === id) || null;
    },

    getServicios(filtros = null) {
      let list = loadFromStorage(STORAGE_KEY_SERVICIOS, SEED_SERVICIOS);
      if (!filtros) return list;

      if (filtros.texto) {
        const q = String(filtros.texto).toLowerCase().trim();
        list = list.filter(s => 
          s.nombre.toLowerCase().includes(q) ||
          (s.descripcion && s.descripcion.toLowerCase().includes(q)) ||
          s.categoria.toLowerCase().includes(q)
        );
      }

      if (filtros.categoria) {
        list = list.filter(s => s.categoria === filtros.categoria);
      }

      if (filtros.estado) {
        list = list.filter(s => s.estado === filtros.estado);
      }

      return list;
    },

    getServicioById(id) {
      return this.getServicios().find(s => s.id === id) || null;
    },

    validarServicio(data) {
      const errors = {};
      const nombre = String(data.nombre || '').trim();
      const duracion = Number(data.duracionMin) || 0;
      const precio = Number(data.precio);

      if (!nombre) {
        errors.nombre = 'El nombre del servicio es obligatorio.';
      } else if (nombre.length < 3) {
        errors.nombre = 'El nombre debe tener al menos 3 caracteres.';
      } else {
        const existente = this.getServicios().find(s => 
          s.nombre.toLowerCase() === nombre.toLowerCase() && (!data.id || s.id !== data.id)
        );
        if (existente) {
          errors.nombre = 'Ya existe un servicio registrado con este nombre.';
        }
      }

      if (!data.categoria) {
        errors.categoria = 'Debe seleccionar una categoría.';
      }

      if (isNaN(duracion) || duracion <= 0) {
        errors.duracionMin = 'La duración debe ser un número mayor a 0 minutos.';
      } else if (duracion > 360) {
        errors.duracionMin = 'La duración máxima permitida es de 360 minutos (6 horas).';
      }

      if (isNaN(precio) || precio < 0) {
        errors.precio = 'El precio debe ser un número mayor o igual a 0.';
      }

      return errors;
    },

    guardarServicio(servicioData) {
      const errors = this.validarServicio(servicioData);
      if (Object.keys(errors).length > 0) {
        return { success: false, errors };
      }

      const servicios = this.getServicios();
      const isEdit = Boolean(servicioData.id);

      if (isEdit) {
        const index = servicios.findIndex(s => s.id === servicioData.id);
        if (index === -1) {
          return { success: false, errors: { general: 'Servicio no encontrado.' } };
        }

        const actualizado = {
          ...servicios[index],
          nombre: servicioData.nombre.trim(),
          categoria: servicioData.categoria,
          duracionMin: Number(servicioData.duracionMin),
          precio: Number(servicioData.precio),
          cabinaRecomendada: servicioData.cabinaRecomendada || servicios[index].cabinaRecomendada || 'cab-1',
          especialistaDefecto: servicioData.especialistaDefecto || servicios[index].especialistaDefecto || 'esp-1',
          estado: servicioData.estado || servicios[index].estado || 'activo',
          descripcion: (servicioData.descripcion || '').trim()
        };

        servicios[index] = actualizado;
        saveToStorage(STORAGE_KEY_SERVICIOS, servicios);

        return { success: true, data: actualizado, message: 'Servicio actualizado correctamente.' };
      } else {
        const nextId = 'srv-' + Date.now();
        const nuevo = {
          id: nextId,
          nombre: servicioData.nombre.trim(),
          categoria: servicioData.categoria,
          duracionMin: Number(servicioData.duracionMin),
          precio: Number(servicioData.precio),
          cabinaRecomendada: servicioData.cabinaRecomendada || 'cab-1',
          especialistaDefecto: servicioData.especialistaDefecto || 'esp-1',
          estado: servicioData.estado || 'activo',
          descripcion: (servicioData.descripcion || '').trim()
        };

        servicios.push(nuevo);
        saveToStorage(STORAGE_KEY_SERVICIOS, servicios);

        return { success: true, data: nuevo, message: 'Servicio registrado exitosamente.' };
      }
    },

    toggleEstadoServicio(servicioId) {
      const servicios = this.getServicios();
      const s = servicios.find(item => item.id === servicioId);
      if (!s) return { success: false, message: 'Servicio no encontrado.' };

      s.estado = s.estado === 'activo' ? 'inactivo' : 'activo';
      saveToStorage(STORAGE_KEY_SERVICIOS, servicios);
      return { success: true, data: s, message: `Servicio marcado como ${s.estado}.` };
    },

    // -------------------------------------------------------------
    // GESTIÓN DE CLIENTES
    // -------------------------------------------------------------
    getClientes(filtros = null) {
      let list = loadFromStorage(STORAGE_KEY_CLIENTES, SEED_CLIENTES);
      if (!filtros) return list;

      if (filtros.texto) {
        const q = String(filtros.texto).toLowerCase().trim();
        list = list.filter(c => 
          (c.nombreCompleto && c.nombreCompleto.toLowerCase().includes(q)) ||
          (c.numeroDocumento && c.numeroDocumento.toLowerCase().includes(q)) ||
          (c.telefono && c.telefono.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.codigo && c.codigo.toLowerCase().includes(q))
        );
      }

      if (filtros.estado) {
        list = list.filter(c => c.estado === filtros.estado);
      }

      if (filtros.soloAlergias) {
        list = list.filter(c => c.alergias && c.alergias.toLowerCase() !== 'ninguna');
      }

      return list;
    },

    getClienteById(id) {
      return this.getClientes().find(c => c.id === id) || null;
    },

    toggleEstadoCliente(clienteId) {
      const clientes = this.getClientes();
      const cli = clientes.find(c => c.id === clienteId);
      if (!cli) return { success: false, message: 'Clienta no encontrada.' };
      cli.estado = cli.estado === 'activo' ? 'inactivo' : 'activo';
      saveToStorage(STORAGE_KEY_CLIENTES, clientes);
      return { success: true, data: cli, message: `Clienta marcada como ${cli.estado}.` };
    },

    getClienteByDoc(tipoDoc, numDoc) {
      const cleanDoc = String(numDoc || '').trim();
      return this.getClientes().find(c => c.tipoDocumento === tipoDoc && c.numeroDocumento.trim() === cleanDoc) || null;
    },

    buscarClientes(query) {
      const q = String(query || '').toLowerCase().trim();
      if (!q) return this.getClientes();
      return this.getClientes().filter(c => 
        c.nombreCompleto.toLowerCase().includes(q) ||
        c.numeroDocumento.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.codigo.toLowerCase().includes(q)
      );
    },

    guardarCliente(clienteData) {
      const errores = this.validarCliente(clienteData);
      if (Object.keys(errores).length > 0) {
        return { success: false, errors: errores };
      }

      const clientes = this.getClientes();
      const isEdit = Boolean(clienteData.id);

      if (isEdit) {
        const index = clientes.findIndex(c => c.id === clienteData.id);
        if (index === -1) {
          return { success: false, errors: { general: 'Cliente no encontrado.' } };
        }

        const actualizado = {
          ...clientes[index],
          ...clienteData,
          nombreCompleto: `${clienteData.nombres.trim()} ${clienteData.apellidos.trim()}`
        };
        clientes[index] = actualizado;
        saveToStorage(STORAGE_KEY_CLIENTES, clientes);

        // Actualizar citas asociadas con el nuevo nombre/teléfono
        this.actualizarDatosClienteEnCitas(actualizado.id, actualizado.nombreCompleto, actualizado.telefono);

        return { success: true, data: actualizado, message: 'Cliente actualizado correctamente.' };
      } else {
        const nextNum = clientes.length + 1;
        const nuevoId = 'cli-' + Date.now();
        const nuevoCodigo = 'CLI-' + String(nextNum).padStart(3, '0');

        const nuevoCliente = {
          id: nuevoId,
          codigo: nuevoCodigo,
          nombres: clienteData.nombres.trim(),
          apellidos: clienteData.apellidos.trim(),
          nombreCompleto: `${clienteData.nombres.trim()} ${clienteData.apellidos.trim()}`,
          tipoDocumento: clienteData.tipoDocumento || 'DNI',
          numeroDocumento: String(clienteData.numeroDocumento || '').trim(),
          telefono: String(clienteData.telefono || '').trim(),
          email: String(clienteData.email || '').trim().toLowerCase(),
          fechaNacimiento: clienteData.fechaNacimiento || null,
          alergias: clienteData.alergias ? clienteData.alergias.trim() : 'Ninguna',
          preferencias: clienteData.preferencias ? clienteData.preferencias.trim() : '',
          estado: clienteData.estado || 'activo',
          fechaRegistro: getTodayDateString(),
          ultimaVisita: null
        };

        clientes.unshift(nuevoCliente);
        saveToStorage(STORAGE_KEY_CLIENTES, clientes);
        return { success: true, data: nuevoCliente, message: 'Cliente registrado exitosamente.' };
      }
    },

    validarCliente(data) {
      const errors = {};
      const nombres = String(data.nombres || '').trim();
      const apellidos = String(data.apellidos || '').trim();
      const tipoDoc = data.tipoDocumento || 'DNI';
      const numDoc = String(data.numeroDocumento || '').trim();
      const telefono = String(data.telefono || '').trim();
      const email = String(data.email || '').trim();
      const fechaNac = data.fechaNacimiento;

      if (!nombres) {
        errors.nombres = 'El nombre es obligatorio.';
      } else if (nombres.length < 2) {
        errors.nombres = 'El nombre debe tener al menos 2 caracteres.';
      } else if (/^\d+$/.test(nombres)) {
        errors.nombres = 'El nombre no puede ser solo números.';
      }

      if (!apellidos) {
        errors.apellidos = 'Los apellidos son obligatorios.';
      } else if (apellidos.length < 2) {
        errors.apellidos = 'Los apellidos deben tener al menos 2 caracteres.';
      }

      if (!numDoc) {
        errors.numeroDocumento = 'El número de documento es obligatorio.';
      } else {
        if (tipoDoc === 'DNI') {
          if (!/^\d{8}$/.test(numDoc)) {
            errors.numeroDocumento = 'El DNI debe tener exactamente 8 dígitos numéricos.';
          }
        } else if (numDoc.length < 5 || numDoc.length > 15) {
          errors.numeroDocumento = 'El documento debe tener entre 5 y 15 caracteres.';
        }

        // Unicidad de documento
        const existente = this.getClienteByDoc(tipoDoc, numDoc);
        if (existente && (!data.id || existente.id !== data.id)) {
          errors.numeroDocumento = `Ya existe un cliente con ${tipoDoc} ${numDoc} (${existente.nombreCompleto}).`;
        }
      }

      if (!telefono) {
        errors.telefono = 'El teléfono es obligatorio.';
      } else if (!/^[0-9+ -]{7,15}$/.test(telefono)) {
        errors.telefono = 'Formato de teléfono inválido (mínimo 7 dígitos).';
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Formato de correo electrónico inválido.';
      }

      if (fechaNac) {
        const todayStr = getTodayDateString();
        if (fechaNac > todayStr) {
          errors.fechaNacimiento = 'La fecha de nacimiento no puede ser futura.';
        }
      }

      return errors;
    },

    actualizarDatosClienteEnCitas(clienteId, nuevoNombre, nuevoTelefono) {
      const citas = this.getCitas();
      let huboCambios = false;
      citas.forEach(cita => {
        if (cita.clienteId === clienteId) {
          cita.clienteNombre = nuevoNombre;
          cita.clienteTelefono = nuevoTelefono;
          huboCambios = true;
        }
      });
      if (huboCambios) {
        saveToStorage(STORAGE_KEY_CITAS, citas);
      }
    },

    // -------------------------------------------------------------
    // GESTIÓN DE CITAS
    // -------------------------------------------------------------
    getCitas(filtros = null) {
      let list = loadFromStorage(STORAGE_KEY_CITAS, generateSeedCitas());
      if (!filtros) return list;

      if (filtros.texto) {
        const q = String(filtros.texto).toLowerCase().trim();
        list = list.filter(c => 
          (c.codigo && c.codigo.toLowerCase().includes(q)) ||
          (c.clienteNombre && c.clienteNombre.toLowerCase().includes(q)) ||
          (c.clienteTelefono && c.clienteTelefono.toLowerCase().includes(q)) ||
          (c.servicioNombre && c.servicioNombre.toLowerCase().includes(q)) ||
          (c.especialistaNombre && c.especialistaNombre.toLowerCase().includes(q)) ||
          (c.cabinaNombre && c.cabinaNombre.toLowerCase().includes(q))
        );
      }

      if (filtros.fecha) {
        list = list.filter(c => c.fecha === filtros.fecha);
      }

      if (filtros.estado) {
        list = list.filter(c => c.estado === filtros.estado);
      }

      if (filtros.clienteId) {
        list = list.filter(c => c.clienteId === filtros.clienteId);
      }

      if (filtros.especialistaId) {
        list = list.filter(c => c.especialistaId === filtros.especialistaId);
      }

      if (filtros.cabinaId) {
        list = list.filter(c => c.cabinaId === filtros.cabinaId);
      }

      if (filtros.servicioId) {
        list = list.filter(c => c.servicioId === filtros.servicioId);
      }

      return list;
    },

    getCitaById(id) {
      return this.getCitas().find(c => c.id === id) || null;
    },

    // Comprobación de disponibilidad horaria y cruces
    verificarDisponibilidad(fecha, horaInicio, horaFin, especialistaId, cabinaId, excludeCitaId = null) {
      const startMin = timeToMinutes(horaInicio);
      const endMin = timeToMinutes(horaFin);

      const aperturaMin = timeToMinutes(SPA_HORA_APERTURA);
      const cierreMin = timeToMinutes(SPA_HORA_CIERRE);

      if (startMin < aperturaMin) {
        return {
          disponible: false,
          tipo: 'horario_spa',
          mensaje: `La hora de inicio (${horaInicio}) es previa a la apertura del Spa (${SPA_HORA_APERTURA}).`
        };
      }

      if (endMin > cierreMin) {
        return {
          disponible: false,
          tipo: 'horario_spa',
          mensaje: `La hora de finalización (${horaFin}) excede el cierre del Spa (${SPA_HORA_CIERRE}).`
        };
      }

      if (startMin >= endMin) {
        return {
          disponible: false,
          tipo: 'invalido',
          mensaje: 'La hora de inicio debe ser anterior a la hora de fin.'
        };
      }

      const citas = this.getCitas().filter(c => 
        c.fecha === fecha &&
        c.estado !== 'cancelada' &&
        (!excludeCitaId || c.id !== excludeCitaId)
      );

      // 1. Validar solapamiento en especialista
      for (const c of citas) {
        if (c.especialistaId === especialistaId) {
          const cStart = timeToMinutes(c.horaInicio);
          const cEnd = timeToMinutes(c.horaFin);
          // Cruce de intervalos: (A_start < B_end) && (A_end > B_start)
          if (startMin < cEnd && endMin > cStart) {
            return {
              disponible: false,
              tipo: 'especialista',
              mensaje: `La especialista ${c.especialistaNombre} ya tiene asignada la cita ${c.codigo} de ${c.horaInicio} a ${c.horaFin}.`
            };
          }
        }
      }

      // 2. Validar solapamiento en cabina
      for (const c of citas) {
        if (c.cabinaId === cabinaId) {
          const cStart = timeToMinutes(c.horaInicio);
          const cEnd = timeToMinutes(c.horaFin);
          if (startMin < cEnd && endMin > cStart) {
            return {
              disponible: false,
              tipo: 'cabina',
              mensaje: `La ${c.cabinaNombre} ya está ocupada de ${c.horaInicio} a ${c.horaFin} por la cita ${c.codigo}.`
            };
          }
        }
      }

      return { disponible: true, mensaje: 'Horario y recursos disponibles.' };
    },

    validarCita(citaData) {
      const errors = {};
      const clienteId = citaData.clienteId;
      const servicioId = citaData.servicioId;
      const especialistaId = citaData.especialistaId;
      const cabinaId = citaData.cabinaId;
      const fecha = citaData.fecha;
      const horaInicio = citaData.horaInicio;
      const duracionMin = Number(citaData.duracionMin) || 0;

      if (!clienteId) errors.clienteId = 'Debe seleccionar o registrar una clienta.';
      if (!servicioId) errors.servicioId = 'Debe seleccionar un servicio.';
      if (!especialistaId) errors.especialistaId = 'Debe asignar una especialista.';
      if (!cabinaId) errors.cabinaId = 'Debe asignar una cabina o espacio.';

      if (!fecha) {
        errors.fecha = 'La fecha es obligatoria.';
      } else {
        const todayStr = getTodayDateString();
        // Para nuevas citas no permitir fechas pasadas
        if (!citaData.id && fecha < todayStr) {
          errors.fecha = 'No se permiten nuevas citas en fechas pasadas.';
        }
      }

      if (!horaInicio) {
        errors.horaInicio = 'La hora de inicio es obligatoria.';
      }

      if (duracionMin <= 0) {
        errors.duracionMin = 'La duración debe ser un valor positivo en minutos.';
      }

      // Si horaInicio y duracionMin son válidos, calcular horaFin y verificar cruce
      if (fecha && horaInicio && duracionMin > 0 && especialistaId && cabinaId) {
        const startMin = timeToMinutes(horaInicio);
        const endMin = startMin + duracionMin;
        const horaFin = minutesToTime(endMin);

        const check = this.verificarDisponibilidad(
          fecha,
          horaInicio,
          horaFin,
          especialistaId,
          cabinaId,
          citaData.id || null
        );

        if (!check.disponible) {
          if (check.tipo === 'especialista') errors.especialistaId = check.mensaje;
          else if (check.tipo === 'cabina') errors.cabinaId = check.mensaje;
          else if (check.tipo === 'horario_spa') errors.horaInicio = check.mensaje;
          else errors.general = check.mensaje;
        }
      }

      return errors;
    },

    guardarCita(citaData) {
      const errores = this.validarCita(citaData);
      if (Object.keys(errores).length > 0) {
        return { success: false, errors: errores };
      }

      const citas = this.getCitas();
      const isEdit = Boolean(citaData.id);

      const cliente = this.getClienteById(citaData.clienteId);
      const servicio = this.getServicioById(citaData.servicioId);
      const especialista = this.getEspecialistaById(citaData.especialistaId);
      const cabina = this.getCabinaById(citaData.cabinaId);

      const duracionMin = Number(citaData.duracionMin) || servicio.duracionMin;
      const startMin = timeToMinutes(citaData.horaInicio);
      const horaFin = minutesToTime(startMin + duracionMin);

      const precio = Number(citaData.precio) || servicio.precio;
      const descuento = Number(citaData.descuento) || 0;
      const total = Math.max(0, precio - descuento);

      if (isEdit) {
        const index = citas.findIndex(c => c.id === citaData.id);
        if (index === -1) {
          return { success: false, errors: { general: 'Cita no encontrada.' } };
        }

        const actualizada = {
          ...citas[index],
          clienteId: cliente.id,
          clienteNombre: cliente.nombreCompleto,
          clienteTelefono: cliente.telefono,
          servicioId: servicio.id,
          servicioNombre: servicio.nombre,
          servicioCategoria: servicio.categoria,
          especialistaId: especialista.id,
          especialistaNombre: especialista.nombre,
          cabinaId: cabina.id,
          cabinaNombre: cabina.nombre,
          fecha: citaData.fecha,
          horaInicio: citaData.horaInicio,
          horaFin: horaFin,
          duracionMin: duracionMin,
          precio: precio,
          descuento: descuento,
          total: total,
          metodoPago: citaData.metodoPago || citas[index].metodoPago || 'pendiente',
          estado: citaData.estado || citas[index].estado,
          notas: citaData.notas ? citaData.notas.trim() : '',
          motivoCancelacion: citaData.estado === 'cancelada' ? (citaData.motivoCancelacion || 'Cancelada por usuario') : null
        };

        citas[index] = actualizada;
        saveToStorage(STORAGE_KEY_CITAS, citas);

        // Actualizar última visita del cliente si se completó hoy
        if (actualizada.estado === 'completada' || actualizada.estado === 'en_curso') {
          this.actualizarUltimaVisitaCliente(cliente.id, actualizada.fecha);
        }

        return { success: true, data: actualizada, message: 'Cita actualizada con éxito.' };
      } else {
        const count = citas.length + 1;
        const nuevoId = 'cit-' + Date.now();
        const nuevoCodigo = 'CIT-2026-' + String(count).padStart(3, '0');

        const nuevaCita = {
          id: nuevoId,
          codigo: nuevoCodigo,
          clienteId: cliente.id,
          clienteNombre: cliente.nombreCompleto,
          clienteTelefono: cliente.telefono,
          servicioId: servicio.id,
          servicioNombre: servicio.nombre,
          servicioCategoria: servicio.categoria,
          especialistaId: especialista.id,
          especialistaNombre: especialista.nombre,
          cabinaId: cabina.id,
          cabinaNombre: cabina.nombre,
          fecha: citaData.fecha,
          horaInicio: citaData.horaInicio,
          horaFin: horaFin,
          duracionMin: duracionMin,
          precio: precio,
          descuento: descuento,
          total: total,
          metodoPago: citaData.metodoPago || 'pendiente',
          estado: citaData.estado || 'confirmada',
          notas: citaData.notas ? citaData.notas.trim() : '',
          motivoCancelacion: null,
          creadoEl: new Date().toISOString()
        };

        citas.unshift(nuevaCita);
        saveToStorage(STORAGE_KEY_CITAS, citas);

        // Actualizar última visita si corresponde
        this.actualizarUltimaVisitaCliente(cliente.id, nuevaCita.fecha);

        return { success: true, data: nuevaCita, message: 'Cita programada con éxito.' };
      }
    },

    actualizarUltimaVisitaCliente(clienteId, fechaVisita) {
      const clientes = this.getClientes();
      const cli = clientes.find(c => c.id === clienteId);
      if (cli) {
        if (!cli.ultimaVisita || fechaVisita > cli.ultimaVisita) {
          cli.ultimaVisita = fechaVisita;
          saveToStorage(STORAGE_KEY_CLIENTES, clientes);
        }
      }
    },

    cambiarEstadoCita(citaId, nuevoEstado, motivo = null) {
      const citas = this.getCitas();
      const cita = citas.find(c => c.id === citaId);
      if (!cita) return { success: false, message: 'Cita no encontrada.' };

      cita.estado = nuevoEstado;
      if (nuevoEstado === 'cancelada') {
        cita.motivoCancelacion = motivo || 'Cancelada por la administración';
      } else {
        cita.motivoCancelacion = null;
      }

      saveToStorage(STORAGE_KEY_CITAS, citas);
      return { success: true, data: cita, message: `Estado cambiado a ${nuevoEstado}.` };
    },

    cancelarCita(citaId, motivo) {
      return this.cambiarEstadoCita(citaId, 'cancelada', motivo);
    },

    confirmarCita(citaId) {
      return this.cambiarEstadoCita(citaId, 'confirmada');
    },

    completarCita(citaId) {
      return this.cambiarEstadoCita(citaId, 'completada');
    },

    // -------------------------------------------------------------

    // -------------------------------------------------------------
    // GESTIÓN DE INVENTARIO Y MOVIMIENTOS
    // -------------------------------------------------------------
    getProductos(filtros = null) {
      let list = loadFromStorage(STORAGE_KEY_PRODUCTOS, SEED_PRODUCTOS);
      if (!filtros) return list;

      if (filtros.texto) {
        const q = String(filtros.texto).toLowerCase().trim();
        list = list.filter(p => 
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.ubicacion && p.ubicacion.toLowerCase().includes(q))
        );
      }

      if (filtros.categoria) {
        list = list.filter(p => p.categoria === filtros.categoria);
      }

      if (filtros.estado) {
        if (filtros.estado === 'normal') {
          list = list.filter(p => p.stockActual > p.stockMinimo);
        } else if (filtros.estado === 'bajo') {
          list = list.filter(p => p.stockActual <= p.stockMinimo && p.stockActual > 0);
        } else if (filtros.estado === 'agotado') {
          list = list.filter(p => p.stockActual <= 0);
        }
      }

      return list;
    },

    getProductoById(id) {
      return this.getProductos().find(p => p.id === id) || null;
    },

    getProductoBySku(sku) {
      const s = String(sku || '').trim().toLowerCase();
      return this.getProductos().find(p => p.sku.toLowerCase() === s) || null;
    },

    validarProducto(data) {
      const errors = {};
      const nombre = String(data.nombre || '').trim();
      const sku = String(data.sku || '').trim();
      const stockMin = Number(data.stockMinimo);
      const stockAct = Number(data.stockActual);
      const pCompra = Number(data.precioCompra);
      const pVenta = Number(data.precioVenta);

      if (!nombre) {
        errors.nombre = 'El nombre del producto es obligatorio.';
      } else if (nombre.length < 2) {
        errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
      }

      if (!sku) {
        errors.sku = 'El código SKU es obligatorio.';
      } else {
        const existente = this.getProductoBySku(sku);
        if (existente && (!data.id || existente.id !== data.id)) {
          errors.sku = `Ya existe un producto con el SKU "${sku}".`;
        }
      }

      if (!data.categoria) {
        errors.categoria = 'Debe seleccionar una categoría para el producto.';
      }

      if (isNaN(stockMin) || stockMin < 0) {
        errors.stockMinimo = 'El stock mínimo no puede ser negativo.';
      }

      if (isNaN(stockAct) || stockAct < 0) {
        errors.stockActual = 'El stock inicial no puede ser negativo.';
      }

      if (isNaN(pCompra) || pCompra < 0) {
        errors.precioCompra = 'El precio de compra no puede ser negativo.';
      }

      if (isNaN(pVenta) || pVenta < 0) {
        errors.precioVenta = 'El precio de venta no puede ser negativo.';
      }

      return errors;
    },

    guardarProducto(productoData) {
      const errors = this.validarProducto(productoData);
      if (Object.keys(errors).length > 0) {
        return { success: false, errors };
      }

      const productos = this.getProductos();
      const isEdit = Boolean(productoData.id);

      if (isEdit) {
        const index = productos.findIndex(p => p.id === productoData.id);
        if (index === -1) {
          return { success: false, errors: { general: 'Producto no encontrado.' } };
        }

        const actualizado = {
          ...productos[index],
          nombre: productoData.nombre.trim(),
          sku: productoData.sku.trim().toUpperCase(),
          categoria: productoData.categoria,
          stockMinimo: Number(productoData.stockMinimo),
          stockActual: Number(productoData.stockActual),
          unidad: productoData.unidad ? productoData.unidad.trim() : productos[index].unidad,
          precioCompra: Number(productoData.precioCompra),
          precioVenta: Number(productoData.precioVenta),
          ubicacion: productoData.ubicacion ? productoData.ubicacion.trim() : productos[index].ubicacion,
          estado: productoData.estado || productos[index].estado || 'activo',
          descripcion: (productoData.descripcion || '').trim()
        };

        productos[index] = actualizado;
        saveToStorage(STORAGE_KEY_PRODUCTOS, productos);
        return { success: true, data: actualizado, message: 'Producto actualizado con éxito.' };
      } else {
        const nuevoId = 'prd-' + Date.now();
        const nuevo = {
          id: nuevoId,
          nombre: productoData.nombre.trim(),
          sku: productoData.sku.trim().toUpperCase(),
          categoria: productoData.categoria,
          stockMinimo: Number(productoData.stockMinimo),
          stockActual: Number(productoData.stockActual),
          unidad: productoData.unidad ? productoData.unidad.trim() : 'Unidad',
          precioCompra: Number(productoData.precioCompra),
          precioVenta: Number(productoData.precioVenta),
          ubicacion: productoData.ubicacion ? productoData.ubicacion.trim() : 'Almacén Central',
          estado: 'activo',
          descripcion: (productoData.descripcion || '').trim()
        };

        productos.unshift(nuevo);
        saveToStorage(STORAGE_KEY_PRODUCTOS, productos);

        // Si inició con stock > 0, registrar movimiento inicial
        if (nuevo.stockActual > 0) {
          this.registrarMovimiento({
            productoId: nuevo.id,
            tipo: 'entrada',
            cantidad: nuevo.stockActual,
            motivo: 'Inventario inicial de registro',
            usuario: 'Administradora'
          });
        }

        return { success: true, data: nuevo, message: 'Producto creado exitosamente.' };
      }
    },

    registrarMovimiento(movData) {
      const productoId = movData.productoId;
      const tipo = movData.tipo; // 'entrada' | 'salida'
      const cantidad = Number(movData.cantidad);
      const motivo = String(movData.motivo || '').trim();
      const usuario = movData.usuario || 'Administradora';

      if (!productoId) return { success: false, message: 'Debe seleccionar un producto.' };
      if (isNaN(cantidad) || cantidad <= 0) return { success: false, message: 'La cantidad debe ser mayor a 0.' };
      if (!motivo) return { success: false, message: 'Debe ingresar un motivo para registrar el movimiento.' };

      const productos = this.getProductos();
      const producto = productos.find(p => p.id === productoId);
      if (!producto) return { success: false, message: 'Producto no encontrado.' };

      const stockAnterior = Number(producto.stockActual) || 0;
      let stockNuevo = stockAnterior;

      if (tipo === 'entrada') {
        stockNuevo = stockAnterior + cantidad;
      } else if (tipo === 'salida') {
        if (cantidad > stockAnterior) {
          return {
            success: false,
            message: `No hay suficiente stock disponible. Stock actual: ${stockAnterior} ${producto.unidad}.`
          };
        }
        stockNuevo = stockAnterior - cantidad;
      } else {
        return { success: false, message: 'Tipo de movimiento inválido.' };
      }

      // Actualizar stock de producto
      producto.stockActual = stockNuevo;
      saveToStorage(STORAGE_KEY_PRODUCTOS, productos);

      // Registrar movimiento
      const movimientos = this.getMovimientos();
      const nuevoMov = {
        id: 'mov-' + Date.now(),
        productoId: producto.id,
        productoSku: producto.sku,
        productoNombre: producto.nombre,
        tipo: tipo,
        cantidad: cantidad,
        stockAnterior: stockAnterior,
        stockNuevo: stockNuevo,
        motivo: motivo,
        usuario: usuario,
        fechaHora: `${getTodayDateString()} ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
      };

      movimientos.unshift(nuevoMov);
      saveToStorage(STORAGE_KEY_MOVIMIENTOS, movimientos);

      return {
        success: true,
        data: nuevoMov,
        producto: producto,
        message: `Movimiento de ${tipo.toUpperCase()} registrado con éxito. Stock actual: ${stockNuevo} ${producto.unidad}.`
      };
    },

    getMovimientos(productoId = null) {
      let list = loadFromStorage(STORAGE_KEY_MOVIMIENTOS, SEED_MOVIMIENTOS);
      if (productoId) {
        list = list.filter(m => m.productoId === productoId);
      }
      return list;
    },

    getResumenInventario() {
      const productos = this.getProductos();
      const total = productos.length;
      const valorCostoTotal = productos.reduce((sum, p) => sum + ((p.stockActual || 0) * (p.precioCompra || 0)), 0);
      const stockBajo = productos.filter(p => p.stockActual <= p.stockMinimo && p.stockActual > 0).length;
      const agotados = productos.filter(p => p.stockActual <= 0).length;

      return {
        total,
        valorCostoTotal,
        stockBajo,
        agotados
      };
    },

    // CONSULTAS PARA DASHBOARD & REPORTES
    // -------------------------------------------------------------
    getResumenCitas(fechaFiltro = null) {
      const citas = this.getCitas();
      const targetFecha = fechaFiltro || getTodayDateString();

      const citasFecha = citas.filter(c => c.fecha === targetFecha);
      const total = citasFecha.length;
      const confirmadas = citasFecha.filter(c => c.estado === 'confirmada' || c.estado === 'en_curso').length;
      const pendientes = citasFecha.filter(c => c.estado === 'pendiente').length;
      const completadas = citasFecha.filter(c => c.estado === 'completada').length;
      const canceladas = citasFecha.filter(c => c.estado === 'cancelada').length;

      const ingresosDia = citasFecha
        .filter(c => c.estado !== 'cancelada')
        .reduce((sum, c) => sum + (c.total || c.precio || 0), 0);

      const clientasAtendidas = new Set(
        citasFecha.filter(c => c.estado !== 'cancelada').map(c => c.clienteId)
      ).size;

      // Ocupación de cabinas (porcentaje sobre slots de 10 horas disponibles)
      // 4 cabinas x 10 horas = 40 horas = 2400 minutos
      const minutosOcupados = citasFecha
        .filter(c => c.estado !== 'cancelada')
        .reduce((sum, c) => sum + (c.duracionMin || 60), 0);
      const ocupacionPct = Math.min(100, Math.round((minutosOcupados / 2400) * 100));

      return {
        targetFecha,
        total,
        confirmadas,
        pendientes,
        completadas,
        canceladas,
        ingresosDia,
        clientasAtendidas,
        ocupacionPct,
        citasDelDia: citasFecha
      };
    },

    getHistorialCliente(clienteId) {
      const citas = this.getCitas().filter(c => c.clienteId === clienteId);
      // Ordenar por fecha descendente
      return citas.sort((a, b) => (b.fecha + b.horaInicio).localeCompare(a.fecha + a.horaInicio));
    },

    // Formateadores expuestos
    formatMoney,
    formatDateFriendly,
    timeToMinutes,
    minutesToTime,
    getTodayDateString
  };

  // Inicializar al cargar
  SpaStore.init();

  return SpaStore;
});
