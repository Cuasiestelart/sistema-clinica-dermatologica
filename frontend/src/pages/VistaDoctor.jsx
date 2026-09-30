import React, { useState, useEffect } from 'react';
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
  Tag
} from 'lucide-react';
import { 
  getProductos, 
  getPacientes, 
  crearPaciente, 
  crearReceta, 
  getSustitutos, 
  actualizarNotaPaciente,
  getHistorialPaciente,
  getResumenMensual,
  descargarReporteMensual
} from '../api/client';

export default function VistaDoctor() {
  const [productos, setProductos] = useState([]);
  const [filtroProd, setFiltroProd] = useState('');
  const [cargandoProd, setCargandoProd] = useState(false);

  const [modalSustitutos, setModalSustitutos] = useState(false);
  const [productoAgotado, setProductoAgotado] = useState(null);
  const [sustitutos, setSustitutos] = useState([]);
  const [cargandoSustitutos, setCargandoSustitutos] = useState(false);

  const [busquedaPac, setBusquedaPac] = useState('');
  const [pacientesSugeridos, setPacientesSugeridos] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [modalNuevoPac, setModalNuevoPac] = useState(false);
  const [nuevoPac, setNuevoPac] = useState({ nombre_completo: '', telefono: '', email: '', nota_fija: '' });

  const [notaPaciente, setNotaPaciente] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);

  const [modalHistorial, setModalHistorial] = useState(false);
  const [historialRecetas, setHistorialRecetas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Estados de prescripción clínica
  const [itemsReceta, setItemsReceta] = useState([]);
  const [diagnostico, setDiagnostico] = useState('');
  const [proxCita, setProxCita] = useState('');

  // Estados de honorarios y cobro
  const [costoBase, setCostoBase] = useState(800);
  const [tipoDescuento, setTipoDescuento] = useState('NORMAL');
  const [totalConsulta, setTotalConsulta] = useState(800);
  const [motivoManual, setMotivoManual] = useState('');

  // Estados para Modal de Reportes / Contador
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

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async (termino = '') => {
    try {
      setCargandoProd(true);
      const res = await getProductos(termino);
      setProductos(res.data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setCargandoProd(false);
    }
  };

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

  const aplicarPreset = (tipo) => {
    setTipoDescuento(tipo);
    if (tipo === 'NORMAL') {
      setTotalConsulta(costoBase);
    } else if (tipo === 'INAPAM') {
      setTotalConsulta(Math.round(costoBase * 0.9));
    } else if (tipo === 'CONVENIO') {
      setTotalConsulta(Math.round(costoBase * 0.8));
    } else if (tipo === 'CORTESIA') {
      setTotalConsulta(0);
    }
  };

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

  const handleAbrirSustitutos = async (prod) => {
    setProductoAgotado(prod);
    setModalSustitutos(true);
    setCargandoSustitutos(true);
    try {
      const res = await getSustitutos(prod.id);
      setSustitutos(res.data);
    } catch (err) {
      console.error('Error al cargar sustitutos:', err);
      setSustitutos([]);
    } finally {
      setCargandoSustitutos(false);
    }
  };

  const handleGuardarPaciente = async (e) => {
    e.preventDefault();
    try {
      const res = await crearPaciente(nuevoPac);
      setPacienteSeleccionado(res.data);
      setModalNuevoPac(false);
      setNuevoPac({ nombre_completo: '', telefono: '', email: '', nota_fija: '' });
      setBusquedaPac('');
    } catch (err) {
      alert('Error al registrar paciente: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEmitirReceta = async () => {
    if (!pacienteSeleccionado) {
      setErrorEnvio('Selecciona o registra un paciente antes de emitir la receta.');
      return;
    }
    if (itemsReceta.length === 0) {
      setErrorEnvio('Agrega al menos un producto a la receta.');
      return;
    }

    setErrorEnvio(null);

    const descPct = costoBase > 0 ? ((costoBase - totalConsulta) / costoBase) * 100 : 0;
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
      }))
    };

    try {
      const res = await crearReceta(payload);
      setMensajeExito(`¡Receta emitida con éxito! Folio registrado: #${res.data.id}`);
      setItemsReceta([]);
      setDiagnostico('');
      setProxCita('');
      setTipoDescuento('NORMAL');
      setTotalConsulta(costoBase);
      setMotivoManual('');
      cargarHistorial(pacienteSeleccionado.id);
      setTimeout(() => setMensajeExito(null), 6000);
    } catch (err) {
      const detalle = err.response?.data?.detail;
      const textoError = Array.isArray(detalle) 
        ? detalle.map(d => `${d.loc.slice(-1)}: ${d.msg}`).join(' | ') 
        : (detalle || err.message);
      setErrorEnvio('Error al guardar receta: ' + textoError);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Barra superior con acceso a Reportes Contables */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Consulta Dermatológica</h1>
          <p className="text-xs text-slate-400">Expedición clínica y registro de honorarios</p>
        </div>
        <button
          type="button"
          onClick={() => setModalReportes(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-800 text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Reportes / Contador
        </button>
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
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="font-medium">{errorEnvio}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Paciente + Catálogo + Libreta de Notas */}
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
                  className="text-xs text-rose-600 hover:underline font-medium"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-100 transition-colors"
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
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        >
                          <div className="font-medium text-sm text-slate-800 capitalize">{p.nombre_completo}</div>
                          <div className="text-xs text-slate-400">{p.telefono || 'Sin teléfono'}</div>
                          {p.nota_fija && (
                            <div className="text-xs text-amber-700 truncate mt-0.5">📌 {p.nota_fija}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setModalNuevoPac(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Nuevo
                </button>
              </div>
            )}
          </div>

          {/* Catálogo de Fórmulas */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Catálogo de Fórmulas y Medicamentos
              </h2>
              <span className="text-xs text-slate-400">
                {productos.length} opciones disponibles
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por activo, nombre o indicación..."
                value={filtroProd}
                onChange={(e) => {
                  setFiltroProd(e.target.value);
                  cargarProductos(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {cargandoProd ? (
              <div className="py-12 text-center text-sm text-slate-400">Actualizando catálogo...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {productos.map(prod => {
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
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                              title="Buscar alternativas con stock"
                            >
                              <RefreshCw className="w-3 h-3" /> Sustitutos
                            </button>
                          ) : (
                            <button
                              onClick={() => agregarAReceta(prod)}
                              disabled={yaRecetado}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
                })}
              </div>
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
                    className="text-xs font-bold px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors shadow-sm"
                  >
                    Guardar Nota
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
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

        {/* Columna Derecha: Canasta de Receta y Cobro */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-800">Receta Médica Digital</h2>
              <p className="text-xs text-slate-400">Folio y prescripción en tiempo real</p>
            </div>
            <span className="w-7 h-7 flex items-center justify-center bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
              {itemsReceta.length}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Diagnóstico / Motivo de consulta
            </label>
            <input
              type="text"
              placeholder="Ej. Acné comedónico moderado en mejillas"
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Lista de productos recetados */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {itemsReceta.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-xs">No has añadido productos a la receta.<br />Selecciona del catálogo a la izquierda.</p>
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
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

{/* Bloque de Honorarios de Consulta Pro */}
          <div className="p-4 bg-slate-100/90 border border-slate-200/90 rounded-2xl space-y-3">
            {/* Cabecera simétrica con Base formateada */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Honorarios Consulta
              </span>
              <div className="flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-400 font-medium">Base: $</span>
                <input
                  type="text"
                  value={costoBase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/[^0-9.]/g, '');
                    const val = Number(soloNumeros) || 0;
                    setCostoBase(val);
                    if (tipoDescuento === 'NORMAL') setTotalConsulta(val);
                    else if (tipoDescuento === 'INAPAM') setTotalConsulta(Math.round(val * 0.9));
                    else if (tipoDescuento === 'CONVENIO') setTotalConsulta(Math.round(val * 0.8));
                    else if (tipoDescuento === 'CORTESIA') setTotalConsulta(0);
                  }}
                  className="w-16 text-right font-bold text-slate-800 text-xs focus:outline-none"
                />
                <span className="text-slate-400 font-mono text-[10px]">MXN</span>
              </div>
            </div>

            {/* Pill Switcher tipo Segmented Control (Píldora real) */}
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
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                    tipoDescuento === preset.id
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Fila Inferior: Ajuste libre opcional + Total a Liquidar */}
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
                      className="text-xs text-slate-400 hover:text-rose-600 font-bold px-1"
                      title="Volver a tarifa normal"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTipoDescuento('MANUAL')}
                    className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium flex items-center gap-1 hover:underline transition-colors"
                  >
                    ✏️ Ajuste manual
                  </button>
                )}
              </div>

              {/* Importe final */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Total a liquidar:
                </span>
                {tipoDescuento === 'MANUAL' ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={totalConsulta}
                      onChange={(e) => setTotalConsulta(Number(e.target.value))}
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
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-[0.99]"
          >
            <Send className="w-4 h-4" />
            Emitir Receta y Registrar Cobro
          </button>
        </div>
      </div>

      {/* Modal / Reportes Contables y Cierres Mensuales */}
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
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtros de Mes y Año */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Mes
                </label>
                <select
                  value={mesReporte}
                  onChange={(e) => setMesReporte(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {meses.map((m) => (
                    <option key={m.num} value={m.num}>
                      {m.nombre}
                    </option>
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
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Métricas del Mes */}
            {cargandoReporte ? (
              <div className="py-8 text-center text-xs text-slate-400">Calculando métricas del mes...</div>
            ) : resumenReporte ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Consultas
                    </span>
                    <span className="text-lg font-bold text-slate-800 mt-1 block">
                      {resumenReporte.total_consultas}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Descuentos
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

            {/* Botones de acción */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setModalReportes(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleDescargarReporte}
                disabled={descargandoReporte || (resumenReporte && resumenReporte.total_consultas === 0)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {descargandoReporte ? 'Generando...' : 'Descargar Excel / CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Historial Clínico */}
      {modalHistorial && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
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
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {cargandoHistorial ? (
                <div className="py-12 text-center text-xs text-slate-400">Cargando expediente...</div>
              ) : historialRecetas.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs">No hay consultas previas registradas para este paciente.<br />Esta será su primera receta médica.</p>
                </div>
              ) : (
                historialRecetas.map((rec) => (
                  <div key={rec.id} className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                          Folio #{rec.id}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">
                          {rec.fecha ? new Date(rec.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha no registrada'}
                        </span>
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

                    {rec.detalles && rec.detalles.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Tratamiento prescrito:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {rec.detalles.map((det, idx) => (
                            <div key={idx} className="p-2 bg-white border border-slate-200/80 rounded-lg text-xs space-y-0.5">
                              <div className="flex items-center gap-1 font-semibold text-slate-800">
                                <Pill className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">{det.producto?.nombre || `Producto #${det.producto_id}`}</span>
                              </div>
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cerrar Historial
              </button>
            </div>
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
                className="text-slate-400 hover:text-slate-600 p-1"
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
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
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

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="Ej. 3121234567"
                  value={nuevoPac.telefono}
                  onChange={(e) => setNuevoPac({ ...nuevoPac, telefono: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

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
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}