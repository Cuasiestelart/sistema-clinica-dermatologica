import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Plus, 
  Trash2, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  FileEdit,
  History,
  Clock,
  Pill,
  DollarSign,
  FileSpreadsheet,
  Download,
  Users,
  Tag,
  CalendarDays,
  Phone,
  UserCheck,
  Stethoscope,
  Scissors,
  Printer
} from 'lucide-react';
import { 
  getProductos, 
  getPacientes, 
  getPaciente,
  crearPaciente, 
  crearReceta, 
  getSustitutos, 
  actualizarNotaPaciente,
  getHistorialPaciente,
  getResumenMensual,
  descargarReporteMensual,
  getCitas,
  actualizarEstadoCita,
  getProcedimientos,
  crearProcedimiento,
  actualizarProcedimiento,
  eliminarProcedimiento
} from '../api/client';
import ModalImpresionReceta from '../components/ModalImpresionReceta';

export default function VistaDoctor() {
  // Pestaña activa en catálogo: 'PRODUCTOS' o 'PROCEDIMIENTOS'
  const [tabCatalogo, setTabCatalogo] = useState('PRODUCTOS');

  // Catálogos
  const [productos, setProductos] = useState([]);
  const [procedimientos, setProcedimientos] = useState([]);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);

  // Procedimientos Clínicos (Alta y Edición)
  const [modalNuevoProc, setModalNuevoProc] = useState(false);
  const [nuevoProc, setNuevoProc] = useState({ nombre: '', precio_base: '', descripcion: '' });
  const [errorModalProc, setErrorModalProc] = useState(null);

  const [modalEditarProc, setModalEditarProc] = useState(false);
  const [procAEditar, setProcAEditar] = useState(null);
  const [guardandoEdicionProc, setGuardandoEdicionProc] = useState(false);
  const [errorModalEditarProc, setErrorModalEditarProc] = useState(null);

  // Sustitutos
  const [modalSustitutos, setModalSustitutos] = useState(false);
  const [productoAgotado, setProductoAgotado] = useState(null);
  const [sustitutos, setSustitutos] = useState([]);
  const [cargandoSustitutos, setCargandoSustitutos] = useState(false);

  // Pacientes
  const [busquedaPac, setBusquedaPac] = useState('');
  const [pacientesSugeridos, setPacientesSugeridos] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [modalNuevoPac, setModalNuevoPac] = useState(false);
  const [nuevoPac, setNuevoPac] = useState({ nombre_completo: '', telefono: '', email: '', nota_fija: '' });
  const [ladaPac, setLadaPac] = useState('+52');
  const [sinTelefonoPac, setSinTelefonoPac] = useState(false);
  const [errorModalPaciente, setErrorModalPaciente] = useState(null);

  const [notaPaciente, setNotaPaciente] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);

  // Historial Clínico y Filtros
  const [modalHistorial, setModalHistorial] = useState(false);
  const [historialRecetas, setHistorialRecetas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [mesFiltroHistorial, setMesFiltroHistorial] = useState('TODOS');
  const [anioFiltroHistorial, setAnioFiltroHistorial] = useState('TODOS');

  // Modal Impresión de Receta
  const [recetaAImprimir, setRecetaAImprimir] = useState(null);

  // Agenda Médica
  const hoyStr = new Date().toISOString().split('T')[0];
  const [modalAgenda, setModalAgenda] = useState(false);
  const [fechaAgenda, setFechaAgenda] = useState(hoyStr);
  const [filtroEspecialidadAgenda, setFiltroEspecialidadAgenda] = useState('Dermatología');
  const [citasAgenda, setCitasAgenda] = useState([]);
  const [cargandoAgenda, setCargandoAgenda] = useState(false);

  // Prescripción y Procedimientos en Consulta
  const [itemsReceta, setItemsReceta] = useState([]);
  const [procedimientosReceta, setProcedimientosReceta] = useState([]);
  const [diagnostico, setDiagnostico] = useState('');
  const [proxCita, setProxCita] = useState('');

  // Honorarios y Cobro
  const [costoBase, setCostoBase] = useState(800);
  const [tipoDescuento, setTipoDescuento] = useState('NORMAL');
  const [totalConsulta, setTotalConsulta] = useState(800);
  const [motivoManual, setMotivoManual] = useState('');

  // Reportes Contables
  const ahora = new Date();
  const [modalReportes, setModalReportes] = useState(false);
  const [anioReporte, setAnioReporte] = useState(ahora.getFullYear());
  const [mesReporte, setMesReporte] = useState(ahora.getMonth() + 1);
  const [resumenReporte, setResumenReporte] = useState(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [descargandoReporte, setDescargandoReporte] = useState(false);

  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState(null);

  const meses = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' },
  ];

  const aniosReporte = [];
  for (let y = 2024; y <= ahora.getFullYear() + 5; y++) {
    aniosReporte.push(y);
  }

  const obtenerPrecio = (prod) => {
    if (!prod) return 0;
    return Number(prod.precio_base ?? prod.precio_venta ?? prod.precio ?? 0);
  };

  // Búsqueda en catálogo con Debounce (200 ms) y llamadas paralelas
  useEffect(() => {
    setCargandoCatalogo(true);
    const timer = setTimeout(async () => {
      try {
        const [resProd, resProc] = await Promise.all([
          getProductos(busquedaCatalogo),
          getProcedimientos(busquedaCatalogo)
        ]);
        setProductos(resProd.data || []);
        setProcedimientos(resProc.data || []);
      } catch (err) {
        console.error('Error al consultar catálogos:', err);
      } finally {
        setCargandoCatalogo(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [busquedaCatalogo]);

  useEffect(() => {
    if (pacienteSeleccionado) {
      setNotaPaciente(pacienteSeleccionado.nota_fija || '');
      cargarHistorial(pacienteSeleccionado.id);
    } else {
      setNotaPaciente('');
      setHistorialRecetas([]);
    }
  }, [pacienteSeleccionado]);

  const cargarHistorial = async (pacienteId) => {
    try {
      setCargandoHistorial(true);
      const res = await getHistorialPaciente(pacienteId);
      setHistorialRecetas(res.data);
    } catch (err) {
      console.error('Error al cargar historial clínico:', err);
      setHistorialRecetas([]);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Cálculos de honorarios
  const sumaProcedimientos = useMemo(() => {
    return procedimientosReceta.reduce((acc, p) => acc + Number(p.precio_cobrado || 0), 0);
  }, [procedimientosReceta]);

  const subtotalBruto = useMemo(() => {
    return Number(costoBase || 0) + sumaProcedimientos;
  }, [costoBase, sumaProcedimientos]);

  const recalcularCobro = (preset, baseBruto = subtotalBruto) => {
    if (preset === 'NORMAL') {
      setTotalConsulta(baseBruto);
    } else if (preset === 'INAPAM') {
      setTotalConsulta(Math.round(baseBruto * 0.9));
    } else if (preset === 'CONVENIO') {
      setTotalConsulta(Math.round(baseBruto * 0.8));
    } else if (preset === 'CORTESIA') {
      setTotalConsulta(0);
    }
  };

  useEffect(() => {
    if (tipoDescuento !== 'MANUAL') {
      recalcularCobro(tipoDescuento, subtotalBruto);
    }
  }, [subtotalBruto, tipoDescuento]);

  const aplicarPreset = (tipo) => {
    setTipoDescuento(tipo);
    recalcularCobro(tipo, subtotalBruto);
  };

  // Agenda
  const cargarCitasAgenda = async (fecha = fechaAgenda, esp = filtroEspecialidadAgenda) => {
    try {
      setCargandoAgenda(true);
      const res = await getCitas(fecha, esp === 'TODAS' ? '' : esp);
      let datos = res.data || [];
      if (esp !== 'TODAS') {
        datos = datos.filter(c => (c.profesional || c.especialidad) === esp);
      }
      setCitasAgenda(datos);
    } catch (err) {
      console.error('Error al cargar agenda médica:', err);
      setCitasAgenda([]);
    } finally {
      setCargandoAgenda(false);
    }
  };

  useEffect(() => {
    if (modalAgenda) {
      cargarCitasAgenda(fechaAgenda, filtroEspecialidadAgenda);
    }
  }, [modalAgenda, fechaAgenda, filtroEspecialidadAgenda]);

  const atenderDesdeAgenda = async (cita) => {
    const pId = cita.paciente_id || cita.paciente?.id;
    if (!pId) return;

    try {
      const resPaciente = await getPaciente(pId);
      setPacienteSeleccionado(resPaciente.data);
    } catch (err) {
      if (cita.paciente) setPacienteSeleccionado(cita.paciente);
    }

    setModalAgenda(false);

    try {
      if (cita.estado !== 'completada' && cita.estado !== 'cancelada') {
        await actualizarEstadoCita(cita.id, 'en_atencion');
      }
    } catch (err) {
      console.warn('No se pudo actualizar estado de cita:', err);
    }
  };

  // Reportes
  useEffect(() => {
    if (modalReportes) {
      cargarResumenReporte();
    }
  }, [modalReportes, anioReporte, mesReporte]);

  const cargarResumenReporte = async () => {
    try {
      setCargandoReporte(true);
      const res = await getResumenMensual(anioReporte, mesReporte);
      setResumenReporte(res.data);
    } catch (err) {
      console.error('Error al cargar resumen del reporte:', err);
    } finally {
      setCargandoReporte(false);
    }
  };

  const handleDescargarReporte = async () => {
    try {
      setDescargandoReporte(true);
      await descargarReporteMensual(anioReporte, mesReporte);
    } catch (err) {
      alert('Error al descargar el archivo CSV');
    } finally {
      setDescargandoReporte(false);
    }
  };

  const handleGuardarNota = async () => {
    if (!pacienteSeleccionado) return;
    if (notaPaciente === (pacienteSeleccionado.nota_fija || '')) return;

    try {
      setGuardandoNota(true);
      await actualizarNotaPaciente(pacienteSeleccionado.id, notaPaciente);
      setPacienteSeleccionado(prev => ({ ...prev, nota_fija: notaPaciente }));
    } catch (err) {
      console.error('Error al guardar nota:', err);
    } finally {
      setGuardandoNota(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const query = busquedaPac.trim();
      if (query.length >= 2 && !pacienteSeleccionado) {
        try {
          const res = await getPacientes(query);
          setPacientesSugeridos(res.data);
        } catch (err) {
          console.error('Error buscando pacientes:', err);
        }
      } else {
        setPacientesSugeridos([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [busquedaPac, pacienteSeleccionado]);

  // Manejo de medicamentos en receta
  const agregarAReceta = (prod) => {
    if (itemsReceta.some(i => i.producto_id === prod.id)) return;
    setItemsReceta([
      ...itemsReceta,
      {
        producto_id: prod.id,
        nombre: prod.nombre,
        marca: prod.marca?.nombre || '',
        precio: obtenerPrecio(prod),
        cantidad_recetada: 1,
        indicaciones_posologia: ''
      }
    ]);
  };

  const actualizarItem = (producto_id, campo, valor) => {
    setItemsReceta(itemsReceta.map(item => 
      item.producto_id === producto_id ? { ...item, [campo]: valor } : item
    ));
  };

  const eliminarItem = (producto_id) => {
    setItemsReceta(itemsReceta.filter(item => item.producto_id !== producto_id));
  };

  // Manejo de procedimientos en consulta
  const agregarProcedimientoAReceta = (proc) => {
    if (procedimientosReceta.some(p => p.procedimiento_id === proc.id)) return;
    setProcedimientosReceta([
      ...procedimientosReceta,
      {
        procedimiento_id: proc.id,
        nombre: proc.nombre,
        precio_cobrado: Number(proc.precio_base || 0),
        notas: ''
      }
    ]);
  };

  const actualizarProcedimientoItem = (procedimiento_id, campo, valor) => {
    setProcedimientosReceta(procedimientosReceta.map(p => 
      p.procedimiento_id === procedimiento_id ? { ...p, [campo]: valor } : p
    ));
  };

  const eliminarProcedimientoItem = (procedimiento_id) => {
    setProcedimientosReceta(procedimientosReceta.filter(p => p.procedimiento_id !== procedimiento_id));
  };

  // Crear procedimiento
  const handleCrearNuevoProcedimiento = async (e) => {
    e.preventDefault();
    setErrorModalProc(null);
    try {
      const res = await crearProcedimiento({
        nombre: nuevoProc.nombre.trim(),
        precio_base: parseFloat(nuevoProc.precio_base) || 0,
        descripcion: nuevoProc.descripcion.trim() || null
      });
      setProcedimientos(prev => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      agregarProcedimientoAReceta(res.data);
      setModalNuevoProc(false);
      setNuevoProc({ nombre: '', precio_base: '', descripcion: '' });
    } catch (err) {
      setErrorModalProc(err.response?.data?.detail || 'Error al guardar procedimiento.');
    }
  };

  // Editar procedimiento
  const abrirEdicionProcedimiento = (proc) => {
    setProcAEditar({ ...proc });
    setErrorModalEditarProc(null);
    setModalEditarProc(true);
  };

  const handleGuardarEdicionProcedimiento = async (e) => {
    e.preventDefault();
    if (!procAEditar) return;
    setErrorModalEditarProc(null);
    setGuardandoEdicionProc(true);
    try {
      const res = await actualizarProcedimiento(procAEditar.id, {
        nombre: procAEditar.nombre.trim(),
        precio_base: parseFloat(procAEditar.precio_base) || 0,
        descripcion: procAEditar.descripcion?.trim() || null
      });
      setProcedimientos(prev => 
        prev.map(p => p.id === res.data.id ? res.data : p)
      );
      setProcedimientosReceta(prev => 
        prev.map(p => p.procedimiento_id === res.data.id ? { ...p, nombre: res.data.nombre } : p)
      );
      setModalEditarProc(false);
    } catch (err) {
      setErrorModalEditarProc(err.response?.data?.detail || 'Error al actualizar procedimiento.');
    } finally {
      setGuardandoEdicionProc(false);
    }
  };

  // Eliminar procedimiento
  const handleEliminarProcedimiento = async (proc) => {
    const confirmacion = window.confirm(`¿Estás seguro de eliminar el procedimiento "${proc.nombre}"?`);
    if (!confirmacion) return;

    try {
      await eliminarProcedimiento(proc.id);
      setProcedimientos(prev => prev.filter(p => p.id !== proc.id));
      setProcedimientosReceta(prev => prev.filter(p => p.procedimiento_id !== proc.id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar el procedimiento.');
    }
  };

  // Modal sustitutos
  const handleAbrirSustitutos = async (prod) => {
    setProductoAgotado(prod);
    setModalSustitutos(true);
    setCargandoSustitutos(true);
    try {
      const res = await getSustitutos(prod.id);
      setSustitutos(res.data);
    } catch (err) {
      setSustitutos([]);
    } finally {
      setCargandoSustitutos(false);
    }
  };

  // Guardar nuevo paciente
  const handleGuardarPaciente = async (e) => {
    e.preventDefault();
    setErrorModalPaciente(null);

    let telefonoPayload = null;
    if (!sinTelefonoPac) {
      const soloDigitos = nuevoPac.telefono.replace(/\D/g, '');
      if (soloDigitos.length !== 10) {
        setErrorModalPaciente('El número de celular debe contener exactamente 10 dígitos.');
        return;
      }
      telefonoPayload = `${ladaPac}${soloDigitos}`;
    }

    try {
      const res = await crearPaciente({
        nombre_completo: nuevoPac.nombre_completo.trim(),
        telefono: telefonoPayload,
        email: nuevoPac.email.trim() || null,
        nota_fija: nuevoPac.nota_fija.trim() || null
      });
      setPacienteSeleccionado(res.data);
      setModalNuevoPac(false);
      setNuevoPac({ nombre_completo: '', telefono: '', email: '', nota_fija: '' });
      setSinTelefonoPac(false);
      setLadaPac('+52');
      setBusquedaPac('');
    } catch (err) {
      const detalle = err.response?.data?.detail;
      const textoError = Array.isArray(detalle)
        ? detalle.map(d => `${d.loc ? d.loc.slice(-1) : 'Campo'}: ${d.msg}`).join(' | ')
        : (detalle || err.message);
      setErrorModalPaciente('Error al registrar paciente: ' + textoError);
    }
  };

  // Emitir Receta y abrir inmediatamente el formato de impresión
  const handleEmitirReceta = async () => {
    if (!pacienteSeleccionado) {
      setErrorEnvio('Selecciona o registra un paciente antes de emitir la receta.');
      return;
    }

    setErrorEnvio(null);

    const descPct = subtotalBruto > 0 ? ((subtotalBruto - totalConsulta) / subtotalBruto) * 100 : 0;
    const motivoFinal = tipoDescuento === 'MANUAL' 
      ? (motivoManual.trim() || 'Ajuste libre') 
      : (tipoDescuento === 'NORMAL' ? 'Tarifa estándar' : tipoDescuento);

    const payload = {
      paciente_id: pacienteSeleccionado.id,
      diagnostico: diagnostico || null,
      proxima_cita: proxCita || null,
      costo_consulta: Number(costoBase),
      descuento_porcentaje: Math.max(0, Number(descPct)),
      descuento_motivo: motivoFinal,
      total_consulta: Number(totalConsulta),
      detalles: itemsReceta.map(i => ({
        producto_id: i.producto_id,
        cantidad: parseInt(i.cantidad_recetada, 10) || 1,
        indicaciones: i.indicaciones_posologia || 'Aplicar según indicación médica'
      })),
      procedimientos: procedimientosReceta.map(p => ({
        procedimiento_id: p.procedimiento_id,
        precio_cobrado: Number(p.precio_cobrado || 0),
        notas: p.notas || null
      }))
    };

    try {
      const res = await crearReceta(payload);
      setMensajeExito(`¡Consulta guardada con éxito! Folio registrado: #${res.data.id}`);
      
      // Abrir vista previa de impresión de la receta emitida
      setRecetaAImprimir(res.data);

      setItemsReceta([]);
      setProcedimientosReceta([]);
      setDiagnostico('');
      setProxCita('');
      setTipoDescuento('NORMAL');
      setMotivoManual('');
      cargarHistorial(pacienteSeleccionado.id);
      setTimeout(() => setMensajeExito(null), 6000);
    } catch (err) {
      const detalle = err.response?.data?.detail;
      const textoError = Array.isArray(detalle) 
        ? detalle.map(d => `${d.loc.slice(-1)}: ${d.msg}`).join(' | ') 
        : (detalle || err.message);
      setErrorEnvio('Error al guardar consulta: ' + textoError);
    }
  };

  // Función auxiliar para normalizar texto en búsquedas
  const normalizarTexto = (txt) => {
    return (txt || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  // Historial con filtros integrales
  const historialFiltrado = useMemo(() => {
    return historialRecetas.filter(rec => {
      const q = normalizarTexto(busquedaHistorial);
      let coincideTexto = true;
      if (q) {
        const enDiag = normalizarTexto(rec.diagnostico).includes(q);
        const enFolio = String(rec.id).includes(q);
        const enProds = (rec.detalles || []).some(d => 
          normalizarTexto(d.producto?.nombre).includes(q) ||
          normalizarTexto(d.producto?.activo_dermatologico).includes(q) ||
          normalizarTexto(d.indicaciones).includes(q)
        );
        const enProcs = (rec.procedimientos || []).some(p => 
          normalizarTexto(p.procedimiento?.nombre).includes(q) ||
          normalizarTexto(p.procedimiento?.descripcion).includes(q) ||
          normalizarTexto(p.notas).includes(q)
        );
        coincideTexto = enDiag || enFolio || enProds || enProcs;
      }

      let coincideFecha = true;
      if (rec.fecha) {
        const fechaObj = new Date(rec.fecha);
        if (anioFiltroHistorial !== 'TODOS' && fechaObj.getFullYear() !== Number(anioFiltroHistorial)) {
          coincideFecha = false;
        }
        if (mesFiltroHistorial !== 'TODOS' && (fechaObj.getMonth() + 1) !== Number(mesFiltroHistorial)) {
          coincideFecha = false;
        }
      }

      return coincideTexto && coincideFecha;
    });
  }, [historialRecetas, busquedaHistorial, mesFiltroHistorial, anioFiltroHistorial]);

  const calcularTiempoPasado = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const difMeses = (ahora.getFullYear() - fecha.getFullYear()) * 12 + (ahora.getMonth() - fecha.getMonth());
    const difDias = Math.floor((ahora - fecha) / (1000 * 60 * 60 * 24));

    if (difDias < 1) return 'Hoy';
    if (difDias === 1) return 'Ayer';
    if (difDias < 30) return `Hace ${difDias} días`;
    if (difMeses === 1) return 'Hace 1 mes';
    if (difMeses < 12) return `Hace ${difMeses} meses`;
    const difAnios = Math.floor(difMeses / 12);
    return `Hace ${difAnios} ${difAnios === 1 ? 'año' : 'años'}`;
  };

  const formatearHoraCita = (cita) => {
    if (cita.hora) return cita.hora;
    if (cita.fecha_hora) {
      const d = new Date(cita.fecha_hora);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return '--:--';
  };

  return (
    <div className="space-y-6">
      {/* Barra superior con acceso a Agenda y Reportes Contables */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Consulta Dermatológica</h1>
          <p className="text-xs text-slate-400">Expedición clínica, procedimientos y honorarios</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalAgenda(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <CalendarDays className="w-4 h-4 text-emerald-700" />
            Agenda del Día
          </button>

          <button
            type="button"
            onClick={() => setModalReportes(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-800 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Reportes / Contador
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{mensajeExito}</span>
        </div>
      )}

      {errorEnvio && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{errorEnvio}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Paciente + Catálogo + Notas */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Tarjeta de Paciente */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Paciente en Consulta
              </h2>
              {pacienteSeleccionado && (
                <button 
                  onClick={() => setPacienteSeleccionado(null)}
                  className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                >
                  Cambiar Paciente
                </button>
              )}
            </div>

            {pacienteSeleccionado ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                <div>
                  <h3 className="font-semibold text-emerald-950 capitalize text-base">
                    {pacienteSeleccionado.nombre_completo}
                  </h3>
                  <p className="text-xs text-emerald-700 font-mono mt-0.5">
                    {pacienteSeleccionado.telefono || 'Sin teléfono'} • {pacienteSeleccionado.email || 'Sin correo'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalHistorial(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-emerald-700" />
                    Historial ({historialRecetas.length})
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Buscar paciente por nombre o teléfono..."
                    value={busquedaPac}
                    onChange={(e) => setBusquedaPac(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {pacientesSugeridos.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                      {pacientesSugeridos.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setPacienteSeleccionado(p);
                            setPacientesSugeridos([]);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer"
                        >
                          <div className="font-medium text-sm text-slate-800 capitalize">{p.nombre_completo}</div>
                          <div className="text-xs text-slate-400 font-mono">{p.telefono || 'Sin teléfono'}</div>
                          {p.nota_fija && (
                            <div className="text-xs text-amber-700 truncate mt-0.5">📌 {p.nota_fija}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setErrorModalPaciente(null);
                    setModalNuevoPac(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  + Nuevo
                </button>
              </div>
            )}
          </div>

          {/* Catálogo Unificado */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            {/* Barra de Búsqueda Única para Medicamentos y Tratamientos con Debounce */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Buscar medicamento, activo o procedimiento (ej. acido, crioterapia)..."
                value={busquedaCatalogo}
                onChange={(e) => setBusquedaCatalogo(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {busquedaCatalogo && (
                <button
                  type="button"
                  onClick={() => setBusquedaCatalogo('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Pestañas de Selección */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTabCatalogo('PRODUCTOS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tabCatalogo === 'PRODUCTOS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Pill className="w-3.5 h-3.5" />
                  Medicamentos ({productos.length})
                </button>

                <button
                  type="button"
                  onClick={() => setTabCatalogo('PROCEDIMIENTOS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tabCatalogo === 'PROCEDIMIENTOS'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  Tratamientos Clínicos ({procedimientos.length})
                </button>
              </div>

              {tabCatalogo === 'PROCEDIMIENTOS' && (
                <button
                  type="button"
                  onClick={() => setModalNuevoProc(true)}
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo Tratamiento
                </button>
              )}
            </div>

            {cargandoCatalogo ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                Buscando en catálogo...
              </div>
            ) : (
              <>
                {/* TAB PRODUCTOS */}
                {tabCatalogo === 'PRODUCTOS' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                    {productos.length === 0 ? (
                      <div className="col-span-2 py-10 text-center text-xs text-slate-400">
                        No se encontraron medicamentos para esta búsqueda.
                      </div>
                    ) : (
                      productos.map(prod => {
                        const yaRecetado = itemsReceta.some(i => i.producto_id === prod.id);
                        const precio = obtenerPrecio(prod);
                        const sinStock = (prod.stock_actual ?? 0) <= 0;

                        return (
                          <div 
                            key={prod.id}
                            className={`p-3.5 border rounded-xl flex flex-col justify-between transition-colors ${
                              sinStock 
                                ? 'border-rose-100 bg-rose-50/20' 
                                : 'border-slate-100 bg-slate-50/50 hover:border-emerald-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                  {prod.marca?.nombre || 'Genérico'}
                                </span>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  sinStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {sinStock ? 'Agotado (0)' : `Stock: ${prod.stock_actual}`}
                                </span>
                              </div>
                              <h4 className="font-semibold text-sm text-slate-800 leading-tight">{prod.nombre}</h4>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                {prod.activo_dermatologico || 'Fórmula magistral / comercial'}
                              </p>
                            </div>

                            <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-200/60">
                              <span className="font-bold text-slate-900 text-sm">
                                ${precio.toFixed(2)} MXN
                              </span>

                              <div className="flex items-center gap-1.5">
                                {sinStock ? (
                                  <button
                                    onClick={() => handleAbrirSustitutos(prod)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                                  >
                                    <RefreshCw className="w-3 h-3" /> Sustitutos
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => agregarAReceta(prod)}
                                    disabled={yaRecetado}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                      yaRecetado 
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                    }`}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    {yaRecetado ? 'Agregado' : 'Recetar'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* TAB PROCEDIMIENTOS */}
                {tabCatalogo === 'PROCEDIMIENTOS' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                    {procedimientos.length === 0 ? (
                      <div className="col-span-2 py-10 text-center text-xs text-slate-400">
                        No se encontraron tratamientos para esta búsqueda.
                      </div>
                    ) : (
                      procedimientos.map(proc => {
                        const yaAgregado = procedimientosReceta.some(p => p.procedimiento_id === proc.id);
                        return (
                          <div 
                            key={proc.id}
                            className="p-3.5 border border-slate-200/90 bg-white rounded-xl flex flex-col justify-between hover:border-emerald-300 transition-colors shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                  Procedimiento Clínico
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => abrirEdicionProcedimiento(proc)}
                                    className="text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Editar tratamiento"
                                  >
                                    <FileEdit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarProcedimiento(proc)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Eliminar tratamiento"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <h4 className="font-semibold text-sm text-slate-800 leading-tight">{proc.nombre}</h4>
                              {proc.descripcion && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {proc.descripcion}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                              <span className="font-bold text-emerald-950 text-sm">
                                ${Number(proc.precio_base || 0).toFixed(2)} MXN
                              </span>

                              <button
                                type="button"
                                onClick={() => agregarProcedimientoAReceta(proc)}
                                disabled={yaAgregado}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  yaAgregado 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                    : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {yaAgregado ? 'Cargado' : '+ Agregar a cobro'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Libreta de Notas Permanentes */}
          {pacienteSeleccionado && (
            <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-amber-950 flex items-center gap-1.5">
                  <FileEdit className="w-4 h-4 text-amber-700" />
                  Notas Permanentes (Antecedentes, Trato Preferencial, Alergias)
                </label>
                <div className="flex items-center gap-2">
                  {guardandoNota && (
                    <span className="text-xs text-amber-700 animate-pulse font-semibold">Guardando...</span>
                  )}
                  <button 
                    type="button" 
                    onClick={handleGuardarNota} 
                    className="text-xs font-bold px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    Guardar Nota
                  </button>
                </div>
              </div>

              <textarea
                rows={5}
                value={notaPaciente}
                onChange={(e) => setNotaPaciente(e.target.value)}
                onBlur={handleGuardarNota}
                placeholder="Escribe antecedentes clínicos, preferencias de trato, ocupación, alergias o condiciones relevantes..."
                className="w-full p-3.5 text-sm leading-relaxed bg-white border border-amber-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-800/40 resize-y shadow-inner"
              />

              <div className="flex justify-between items-center text-xs text-amber-800/80 pt-1">
                <span>Tip: Se guarda automáticamente al salir del campo.</span>
                <span className="text-[11px] text-amber-700/70 font-mono">
                  {notaPaciente.length} caracteres
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Columna Derecha: Canasta de Receta, Procedimientos y Honorarios */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-800">Receta Médica Digital</h2>
              <p className="text-xs text-slate-400">Prescripción y tratamientos realizados</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs" title="Fórmulas recetadas">
                {itemsReceta.length} meds
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-full font-bold text-xs" title="Procedimientos clínicos">
                {procedimientosReceta.length} proc
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Diagnóstico / Motivo de consulta
            </label>
            <input
              type="text"
              placeholder="Ej. Acné comedónico severo, Verruga vulgar"
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Bloque: Procedimientos Realizados en el Consultorio */}
          {procedimientosReceta.length > 0 && (
            <div className="space-y-2 p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-950 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-blue-700" /> Tratamientos Realizados (Se cobran)
                </span>
                <span className="text-xs font-bold text-blue-900">
                  +${sumaProcedimientos.toFixed(2)} MXN
                </span>
              </div>

              <div className="space-y-2">
                {procedimientosReceta.map(procItem => (
                  <div key={procItem.procedimiento_id} className="p-2.5 bg-white border border-blue-200 rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{procItem.nombre}</span>
                      <button 
                        type="button" 
                        onClick={() => eliminarProcedimientoItem(procItem.procedimiento_id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <label className="text-[10px] text-slate-400 font-semibold block">Costo Cobrado ($):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={procItem.precio_cobrado}
                          onChange={(e) => actualizarProcedimientoItem(procItem.procedimiento_id, 'precio_cobrado', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-bold text-emerald-950"
                        />
                      </div>
                      <div className="col-span-7">
                        <label className="text-[10px] text-slate-400 font-semibold block">Notas / Detalles clínicos:</label>
                        <input
                          type="text"
                          placeholder="Ej. 3 lesiones en cuello"
                          value={procItem.notas}
                          onChange={(e) => actualizarProcedimientoItem(procItem.procedimiento_id, 'notas', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de medicamentos recetados */}
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Prescripción Farmacológica
            </label>
            {itemsReceta.length === 0 ? (
              <div className="py-6 text-center text-slate-400 space-y-1 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-6 h-6 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-xs">No has añadido medicamentos a la receta.</p>
              </div>
            ) : (
              itemsReceta.map(item => (
                <div key={item.producto_id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800">{item.nombre}</h4>
                      <span className="text-[10px] text-slate-400">{item.marca}</span>
                    </div>
                    <button 
                      onClick={() => eliminarItem(item.producto_id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2 pt-1">
                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Cant.</label>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad_recetada}
                        onChange={(e) => actualizarItem(item.producto_id, 'cantidad_recetada', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold"
                      />
                    </div>
                    <div className="col-span-9">
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Indicaciones / Posología</label>
                      <input
                        type="text"
                        placeholder="Ej. Aplicar cada 12 horas..."
                        value={item.indicaciones_posologia}
                        onChange={(e) => actualizarItem(item.producto_id, 'indicaciones_posologia', e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Próxima Cita de Revisión
            </label>
            <input
              type="date"
              value={proxCita}
              onChange={(e) => setProxCita(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Bloque de Honorarios y Liquidación de Consulta */}
          <div className="p-4 bg-slate-100/90 border border-slate-200/90 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Honorarios y Procedimientos
              </span>
              <div className="flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-400 font-medium">Consulta: $</span>
                <input
                  type="text"
                  value={costoBase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/[^0-9.]/g, '');
                    const val = Number(soloNumeros) || 0;
                    setCostoBase(val);
                  }}
                  className="w-16 text-right font-bold text-slate-800 text-xs focus:outline-none"
                />
                <span className="text-slate-400 font-mono text-[10px]">MXN</span>
              </div>
            </div>

            {sumaProcedimientos > 0 && (
              <div className="flex justify-between text-xs text-slate-600 font-medium px-1">
                <span>Subtotal (Consulta + Tratamientos):</span>
                <span className="font-bold text-slate-800">${subtotalBruto.toFixed(2)} MXN</span>
              </div>
            )}

            <div className="flex p-1 bg-slate-200/80 rounded-xl gap-1">
              {[
                { id: 'NORMAL', label: 'Normal' },
                { id: 'INAPAM', label: 'INAPAM (-10%)' },
                { id: 'CONVENIO', label: 'Convenio (-20%)' },
                { id: 'CORTESIA', label: 'Cortesía ($0)' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => aplicarPreset(preset.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                    tipoDescuento === preset.id
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                {tipoDescuento === 'MANUAL' ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Motivo (ej. pactado)"
                      value={motivoManual}
                      onChange={(e) => setMotivoManual(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs w-32 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => aplicarPreset('NORMAL')}
                      className="text-xs text-slate-400 hover:text-rose-600 font-bold px-1 cursor-pointer"
                      title="Volver a tarifa estándar"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTipoDescuento('MANUAL')}
                    className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium flex items-center gap-1 hover:underline transition-colors cursor-pointer"
                  >
                    ✏️ Ajuste manual
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Total a liquidar:
                </span>
                {tipoDescuento === 'MANUAL' ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={totalConsulta}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTotalConsulta(isNaN(val) ? 0 : Math.max(0, val));
                      }}
                      className="w-20 px-2 py-0.5 bg-white border-2 border-emerald-500 rounded-lg text-right font-bold text-emerald-950 text-sm focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className={`text-base font-black ${totalConsulta === 0 ? 'text-amber-700' : 'text-emerald-950'}`}>
                    ${Number(totalConsulta).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleEmitirReceta}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Emitir Receta y Registrar Cobro
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL / HISTORIAL CLÍNICO                                */}
      {/* ======================================================== */}
      {modalHistorial && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  Historial de Consultas Médicas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paciente: <b className="capitalize text-slate-800">{pacienteSeleccionado?.nombre_completo}</b>
                </p>
              </div>
              <button
                onClick={() => setModalHistorial(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BARRA DE FILTROS Y BÚSQUEDA DEL HISTORIAL */}
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por tratamiento, producto, activo (ej. niaci), diagnóstico o folio..."
                  value={busquedaHistorial}
                  onChange={(e) => setBusquedaHistorial(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={mesFiltroHistorial}
                  onChange={(e) => setMesFiltroHistorial(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
                >
                  <option value="TODOS">Todos los meses</option>
                  {meses.map(m => (
                    <option key={m.num} value={m.num}>{m.nombre}</option>
                  ))}
                </select>

                <select
                  value={anioFiltroHistorial}
                  onChange={(e) => setAnioFiltroHistorial(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
                >
                  <option value="TODOS">Todos los años</option>
                  {aniosReporte.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {cargandoHistorial ? (
                <div className="py-12 text-center text-xs text-slate-400">Cargando expediente...</div>
              ) : historialFiltrado.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs">No se encontraron folios que coincidan con los filtros aplicados.</p>
                </div>
              ) : (
                historialFiltrado.map((rec) => (
                  <div key={rec.id} className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                          Folio #{rec.id}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">
                          {rec.fecha ? new Date(rec.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha no registrada'}
                        </span>
                        {/* Botón para reimprimir cualquier receta desde el historial */}
                        <button
                          type="button"
                          onClick={() => setRecetaAImprimir(rec)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ml-1"
                          title="Imprimir esta receta"
                        >
                          <Printer className="w-3.5 h-3.5" /> Imprimir
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {rec.total_consulta !== undefined && rec.total_consulta !== null && (
                          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            Cobro: ${Number(rec.total_consulta).toFixed(2)} MXN {rec.descuento_motivo && `(${rec.descuento_motivo})`}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {calcularTiempoPasado(rec.fecha)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Diagnóstico:</span>
                      <p className="text-xs text-slate-800 font-medium mt-0.5">
                        {rec.diagnostico || 'Sin diagnóstico registrado'}
                      </p>
                    </div>

                    {/* Procedimientos realizados en la cita */}
                    {rec.procedimientos && rec.procedimientos.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block">Tratamientos Clínicos Realizados:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {rec.procedimientos.map((p, idx) => (
                            <div key={idx} className="p-2 bg-blue-50/70 border border-blue-200/70 rounded-lg text-xs space-y-0.5">
                              <div className="flex items-center justify-between font-bold text-blue-950">
                                <span>{p.procedimiento?.nombre || `Tratamiento #${p.procedimiento_id}`}</span>
                                <span>${Number(p.precio_cobrado || 0).toFixed(2)}</span>
                              </div>
                              {p.notas && <p className="text-[11px] text-blue-800 italic">{p.notas}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medicamentos prescritos con visualización de activo */}
                    {rec.detalles && rec.detalles.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Medicamentos prescritos:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {rec.detalles.map((det, idx) => (
                            <div key={idx} className="p-2 bg-white border border-slate-200/80 rounded-lg text-xs space-y-0.5">
                              <div className="flex items-center gap-1 font-semibold text-slate-800">
                                <Pill className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">{det.producto?.nombre || `Producto #${det.producto_id}`}</span>
                              </div>
                              {det.producto?.activo_dermatologico && (
                                <div className="text-[10px] text-emerald-700 font-medium pl-4">
                                  {det.producto.activo_dermatologico}
                                </div>
                              )}
                              <div className="text-[11px] text-slate-500 pl-4">
                                Cantidad: <b>{det.cantidad}</b> • {det.indicaciones || 'Indicación estándar'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rec.proxima_cita && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        Cita de revisión prevista: <b className="text-slate-700">{rec.proxima_cita}</b>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalHistorial(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Crear Nuevo Tratamiento Clínico */}
      {modalNuevoProc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-emerald-700" />
                  Alta de Tratamiento Clínico
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Agrega un procedimiento para cobrarlo en la consulta
                </p>
              </div>
              <button
                onClick={() => setModalNuevoProc(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorModalProc && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorModalProc}</span>
              </div>
            )}

            <form onSubmit={handleCrearNuevoProcedimiento} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nombre del Tratamiento *</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Cauterización de verruga, Biopsia por punch"
                  value={nuevoProc.nombre}
                  onChange={(e) => setNuevoProc({ ...nuevoProc, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Precio Sugerido / Base ($ MXN) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 650.00"
                  value={nuevoProc.precio_base}
                  onChange={(e) => setNuevoProc({ ...nuevoProc, precio_base: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Descripción o especificación (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Incluye aplicación de anestesia local y material de curación"
                  value={nuevoProc.descripcion}
                  onChange={(e) => setNuevoProc({ ...nuevoProc, descripcion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoProc(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-medium cursor-pointer"
                >
                  Guardar Tratamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Tratamiento Clínico */}
      {modalEditarProc && procAEditar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-emerald-700" />
                  Editar Tratamiento Clínico
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Modifica el nombre o precio sugerido del procedimiento
                </p>
              </div>
              <button
                onClick={() => setModalEditarProc(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorModalEditarProc && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorModalEditarProc}</span>
              </div>
            )}

            <form onSubmit={handleGuardarEdicionProcedimiento} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nombre *</label>
                <input
                  required
                  type="text"
                  value={procAEditar.nombre}
                  onChange={(e) => setProcAEditar({ ...procAEditar, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Precio Base ($ MXN) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={procAEditar.precio_base}
                  onChange={(e) => setProcAEditar({ ...procAEditar, precio_base: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  value={procAEditar.descripcion || ''}
                  onChange={(e) => setProcAEditar({ ...procAEditar, descripcion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEditarProc(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicionProc}
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {guardandoEdicionProc ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sustitutos */}
      {modalSustitutos && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Sustitutos Terapéuticos
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  El producto <b className="text-slate-800">{productoAgotado?.nombre}</b> está agotado. Alternativas disponibles con stock:
                </p>
              </div>
              <button
                onClick={() => setModalSustitutos(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cargandoSustitutos ? (
              <div className="py-8 text-center text-xs text-slate-400">Buscando alternativas equivalentes...</div>
            ) : sustitutos.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No se encontraron productos alternativos con stock que compartan las mismas etiquetas terapéuticas.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sustitutos.map((sust) => {
                  const yaRecetado = itemsReceta.some(i => i.producto_id === sust.id);
                  return (
                    <div
                      key={sust.id}
                      className="p-3 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-50"
                    >
                      <div>
                        <h4 className="font-semibold text-xs text-slate-800">{sust.nombre}</h4>
                        <p className="text-[11px] text-slate-500">{sust.activo_dermatologico || sust.marca?.nombre}</p>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          Stock: {sust.stock_actual}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          agregarAReceta(sust);
                          setModalSustitutos(false);
                        }}
                        disabled={yaRecetado}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        {yaRecetado ? 'Agregado' : 'Recetar este'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setModalSustitutos(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Paciente */}
      {modalNuevoPac && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Registrar Nuevo Paciente</h3>
              <p className="text-xs text-slate-400">Alta rápida durante la consulta médica.</p>
            </div>

            {errorModalPaciente && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorModalPaciente}</span>
              </div>
            )}

            <form onSubmit={handleGuardarPaciente} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nombre Completo *</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Mariana López"
                  value={nuevoPac.nombre_completo}
                  onChange={(e) => setNuevoPac({ ...nuevoPac, nombre_completo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {!sinTelefonoPac && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Teléfono (WhatsApp)</label>
                  <div className="flex gap-2">
                    <select
                      value={ladaPac}
                      onChange={(e) => setLadaPac(e.target.value)}
                      className="w-24 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+57">🇨🇴 +57</option>
                    </select>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Ej. 3121234567"
                      value={nuevoPac.telefono}
                      onChange={(e) => setNuevoPac({ ...nuevoPac, telefono: e.target.value.replace(/\D/g, '') })}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={sinTelefonoPac}
                  onChange={(e) => {
                    setSinTelefonoPac(e.target.checked);
                    if (e.target.checked) setNuevoPac({ ...nuevoPac, telefono: '' });
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium select-none">
                  El paciente no tiene número de teléfono
                </span>
              </label>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="paciente@correo.com"
                  value={nuevoPac.email}
                  onChange={(e) => setNuevoPac({ ...nuevoPac, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Notas / Trato Personal (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Ej: Ocupación, trato preferencial, antecedentes..."
                  value={nuevoPac.nota_fija}
                  onChange={(e) => setNuevoPac({ ...nuevoPac, nota_fija: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoPac(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agenda */}
      {modalAgenda && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-600" />
                  Agenda del Día
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pacientes citados para consulta médica dermatológica
                </p>
              </div>
              <button
                onClick={() => setModalAgenda(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-600">Fecha:</span>
                <input
                  type="date"
                  value={fechaAgenda}
                  onChange={(e) => setFechaAgenda(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setFiltroEspecialidadAgenda('Dermatología')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    filtroEspecialidadAgenda === 'Dermatología'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Dermatología
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEspecialidadAgenda('TODAS')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    filtroEspecialidadAgenda === 'TODAS'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {cargandoAgenda ? (
                <div className="py-12 text-center text-xs text-slate-400">Cargando agenda médica...</div>
              ) : citasAgenda.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-medium">No hay consultas médicas programadas para esta fecha.</p>
                </div>
              ) : (
                citasAgenda.map((cita) => {
                  let badge = 'bg-slate-100 text-slate-600 border-slate-200';
                  if (cita.estado === 'en_espera') badge = 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse font-bold';
                  if (cita.estado === 'en_atencion') badge = 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
                  if (cita.estado === 'completada') badge = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                  if (cita.estado === 'cancelada') badge = 'bg-rose-100 text-rose-700 border-rose-200 line-through';

                  return (
                    <div 
                      key={cita.id}
                      className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                            {formatearHoraCita(cita)}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800">
                            {cita.paciente?.nombre_completo || `Paciente #${cita.paciente_id}`}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${badge}`}>
                            {(cita.estado || '').replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Stethoscope className="w-3 h-3 text-blue-500" />
                            {cita.profesional || cita.especialidad || 'Dermatología'}
                          </span>
                          {cita.motivo && <span>• {cita.motivo}</span>}
                          {cita.paciente?.telefono && (
                            <span className="font-mono text-[11px] text-slate-400 flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {cita.paciente.telefono}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => atenderDesdeAgenda(cita)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Cargar en Consulta
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalAgenda(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar Agenda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reportes */}
      {modalReportes && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Cierres y Reporte Contable
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exportación mensual de honorarios para el contador (CSV / Excel)
                </p>
              </div>
              <button
                onClick={() => setModalReportes(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Mes
                </label>
                <select
                  value={mesReporte}
                  onChange={(e) => setMesReporte(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {meses.map((m) => (
                    <option key={m.num} value={m.num}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Año
                </label>
                <select
                  value={anioReporte}
                  onChange={(e) => setAnioReporte(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {aniosReporte.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {cargandoReporte ? (
              <div className="py-8 text-center text-xs text-slate-400">Calculando métricas del mes...</div>
            ) : resumenReporte ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Consultas
                    </span>
                    <span className="text-lg font-bold text-slate-800 mt-1 block">
                      {resumenReporte.total_consultas}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Descuentos
                    </span>
                    <span className="text-lg font-bold text-rose-600 mt-1 block">
                      -${resumenReporte.total_descuentos.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                      Total Neto Cobrado
                    </span>
                    <span className="text-[11px] text-emerald-700">Honorarios ingresados en caja</span>
                  </div>
                  <span className="text-xl font-black text-emerald-950">
                    ${resumenReporte.total_cobrado.toFixed(2)} MXN
                  </span>
                </div>
              </div>
            ) : null}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setModalReportes(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleDescargarReporte}
                disabled={descargandoReporte || (resumenReporte && resumenReporte.total_consultas === 0)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {descargandoReporte ? 'Generando...' : 'Descargar Excel / CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {recetaAImprimir && (
        <ModalImpresionReceta
          receta={recetaAImprimir}
          paciente={pacienteSeleccionado || recetaAImprimir.paciente}
          onClose={() => setRecetaAImprimir(null)}
        />
      )}
    </div>
  );
}