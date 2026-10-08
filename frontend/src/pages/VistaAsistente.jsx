import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, UserPlus, CheckCircle2, 
  AlertCircle, Phone, MessageSquare, Plus, 
  Stethoscope, Sparkles, Edit3, X
} from 'lucide-react';
import { 
  getPacientes, 
  crearPaciente, 
  actualizarPaciente,
  getCitas, 
  crearCita, 
  actualizarEstadoCita 
} from '../api/client';

const formatearErrorFastAPI = (err, fallbackMsg = 'Ocurrió un error inesperado.') => {
  const detalle = err.response?.data?.detail;
  if (typeof detalle === 'string') return detalle;
  if (Array.isArray(detalle)) {
    return detalle.map(d => {
      const campo = Array.isArray(d.loc) ? d.loc.slice(-1)[0] : 'Campo';
      return `${campo}: ${d.msg}`;
    }).join(' | ');
  }
  if (detalle && typeof detalle === 'object') return JSON.stringify(detalle);
  return err.message || fallbackMsg;
};

export default function VistaAsistente() {
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fechaFiltro, setFechaFiltro] = useState(hoyStr);
  const [citas, setCitas] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);

  // Formulario de Paciente / Búsqueda
  const [pacienteBusqueda, setPacienteBusqueda] = useState('');
  const [pacientesEncontrados, setPacientesEncontrados] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  // Modal Crear Paciente
  const [modalNuevoPaciente, setModalNuevoPaciente] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [lada, setLada] = useState('+52');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [sinTelefono, setSinTelefono] = useState(false);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevaNota, setNuevaNota] = useState('');
  const [guardandoPaciente, setGuardandoPaciente] = useState(false);
  const [errorModalPaciente, setErrorModalPaciente] = useState('');

  // Modal Editar Paciente
  const [modalEditarPaciente, setModalEditarPaciente] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editLada, setEditLada] = useState('+52');
  const [editTelefono, setEditTelefono] = useState('');
  const [editSinTelefono, setEditSinTelefono] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState('');

  // Campos de la Cita
  const [fechaCita, setFechaCita] = useState(hoyStr);
  const [horaCita, setHoraCita] = useState('10:00');
  const [especialidad, setEspecialidad] = useState('Dermatología');
  const [motivo, setMotivo] = useState('');

  const [guardandoCita, setGuardandoCita] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  // Cargar Citas
  const cargarCitas = async () => {
    setCargandoCitas(true);
    try {
      const res = await getCitas(fechaFiltro);
      setCitas(res.data || []);
    } catch (err) {
      console.error('Error cargando citas:', err);
    } finally {
      setCargandoCitas(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, [fechaFiltro]);

  // Buscador con Debounce
  useEffect(() => {
    if (!pacienteBusqueda.trim() || pacienteSeleccionado) {
      setPacientesEncontrados([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await getPacientes(pacienteBusqueda.trim());
        setPacientesEncontrados(res.data || []);
      } catch (err) {
        console.error('Error buscando pacientes:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [pacienteBusqueda, pacienteSeleccionado]);

  // Guardar Paciente desde el Modal
  const handleGuardarNuevoPaciente = async (e) => {
    e.preventDefault();
    setErrorModalPaciente('');

    if (!nuevoNombre.trim()) {
      setErrorModalPaciente('El nombre completo es obligatorio.');
      return;
    }

    let telefonoPayload = null;
    if (!sinTelefono) {
      const digitos = nuevoTelefono.replace(/\D/g, '');
      if (digitos.length !== 10) {
        setErrorModalPaciente('El número debe contener exactamente 10 dígitos.');
        return;
      }
      telefonoPayload = `${lada}${digitos}`;
    }

    setGuardandoPaciente(true);
    try {
      const res = await crearPaciente({
        nombre_completo: nuevoNombre.trim(),
        telefono: telefonoPayload,
        email: nuevoEmail.trim() || null,
        nota_fija: nuevaNota.trim() || null
      });

      setPacienteSeleccionado(res.data);
      setModalNuevoPaciente(false);
      setNuevoNombre('');
      setNuevoTelefono('');
      setSinTelefono(false);
      setNuevoEmail('');
      setNuevaNota('');
      setExitoMsg(`¡Paciente "${res.data.nombre_completo}" registrado con éxito!`);
    } catch (err) {
      setErrorModalPaciente(formatearErrorFastAPI(err, 'Error al guardar paciente.'));
    } finally {
      setGuardandoPaciente(false);
    }
  };

  // Abrir Modal de Edición
  const abrirEdicion = () => {
    if (!pacienteSeleccionado) return;
    setErrorEdicion('');
    setEditNombre(pacienteSeleccionado.nombre_completo || '');
    setEditEmail(pacienteSeleccionado.email || '');

    const tel = pacienteSeleccionado.telefono || '';
    if (!tel) {
      setEditSinTelefono(true);
      setEditLada('+52');
      setEditTelefono('');
    } else {
      setEditSinTelefono(false);
      if (tel.startsWith('+52') && tel.length === 13) {
        setEditLada('+52');
        setEditTelefono(tel.slice(3));
      } else if (tel.startsWith('+1') && tel.length === 12) {
        setEditLada('+1');
        setEditTelefono(tel.slice(2));
      } else {
        const soloNum = tel.replace(/\D/g, '');
        if (soloNum.length > 10) {
          setEditLada('+' + soloNum.slice(0, soloNum.length - 10));
          setEditTelefono(soloNum.slice(-10));
        } else {
          setEditLada('+52');
          setEditTelefono(soloNum);
        }
      }
    }
    setModalEditarPaciente(true);
  };

  // Guardar Cambios de Edición
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setErrorEdicion('');
    setGuardandoEdicion(true);

    try {
      if (!editNombre.trim()) {
        setErrorEdicion('El nombre es obligatorio.');
        setGuardandoEdicion(false);
        return;
      }

      let telefonoPayload = null;
      if (!editSinTelefono) {
        const digitos = editTelefono.replace(/\D/g, '');
        if (digitos.length !== 10) {
          setErrorEdicion('El celular debe contener exactamente 10 dígitos.');
          setGuardandoEdicion(false);
          return;
        }
        telefonoPayload = `${editLada}${digitos}`;
      }

      const res = await actualizarPaciente(pacienteSeleccionado.id, {
        nombre_completo: editNombre.trim(),
        telefono: telefonoPayload,
        email: editEmail.trim() || null
      });

      setPacienteSeleccionado(res.data);
      setModalEditarPaciente(false);
      setExitoMsg('Datos del paciente actualizados.');
      cargarCitas();
    } catch (err) {
      setErrorEdicion(formatearErrorFastAPI(err, 'Error al actualizar paciente.'));
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Agendar Cita
  const handleSubmitCita = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setExitoMsg('');

    if (!pacienteSeleccionado) {
      setErrorMsg('Debes buscar o registrar un paciente para la cita.');
      return;
    }

    setGuardandoCita(true);
    try {
      const fechaHoraCombinada = `${fechaCita}T${horaCita}:00`;

      await crearCita({
        paciente_id: pacienteSeleccionado.id,
        fecha_hora: fechaHoraCombinada,
        profesional: especialidad,
        motivo: motivo.trim() || null
      });

      setExitoMsg('¡Cita programada exitosamente!');
      setMotivo('');

      if (fechaCita === fechaFiltro) {
        cargarCitas();
      } else {
        setFechaFiltro(fechaCita);
      }
    } catch (err) {
      setErrorMsg(formatearErrorFastAPI(err, 'Error al agendar la cita.'));
    } finally {
      setGuardandoCita(false);
    }
  };

  // Cambiar Estado Cita
  const handleCambiarEstado = async (citaId, nuevoEstado) => {
    try {
      await actualizarEstadoCita(citaId, nuevoEstado);
      cargarCitas();
    } catch (err) {
      alert('Error: ' + formatearErrorFastAPI(err));
    }
  };

  // WhatsApp
  const armarEnlaceWhatsApp = (cita) => {
    if (!cita.paciente || !cita.paciente.telefono) return null;
    const tel = cita.paciente.telefono.replace(/\D/g, '');
    const horaTexto = cita.hora || (cita.fecha_hora ? new Date(cita.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
    const texto = encodeURIComponent(
      `Hola ${cita.paciente.nombre_completo}, te escribimos de Clínica Derma para confirmar tu cita de ${cita.profesional || ''} el día ${fechaFiltro} a las ${horaTexto}. ¿Nos confirmas tu asistencia? ¡Muchas gracias!`
    );
    return `https://wa.me/${tel}?text=${texto}`;
  };

  const obtenerHoraTexto = (cita) => {
    if (cita.hora) return cita.hora;
    if (cita.fecha_hora) {
      const d = new Date(cita.fecha_hora);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return '--:--';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      {/* Encabezado */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Recepción y Agenda
          </h1>
          <p className="text-sm text-slate-500">Control de citas, sala de espera y registro de pacientes</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-500">Fecha de de agenda:</span>
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            className="text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </header>

      {/* Grid Principal con items-start para evitar que las columnas se estiren innecesariamente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: Formulario Agendar Cita */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4 self-start">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Plus className="w-5 h-5 text-emerald-600" />
            Agendar Nueva Cita
          </h2>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {exitoMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{exitoMsg}</span>
            </div>
          )}

          {/* Selección de Paciente */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              PACIENTE EN CITA
            </p>

            {!pacienteSeleccionado ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar paciente por nombre o teléfono..."
                    value={pacienteBusqueda}
                    onChange={(e) => setPacienteBusqueda(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  {pacientesEncontrados.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {pacientesEncontrados.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPacienteSeleccionado(p);
                            setPacientesEncontrados([]);
                            setPacienteBusqueda('');
                          }}
                          className="px-3.5 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                        >
                          <span className="font-medium">{p.nombre_completo}</span>
                          <span className="text-xs text-slate-400 font-mono">{p.telefono || 'Sin celular'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setErrorModalPaciente('');
                    setModalNuevoPaciente(true);
                  }}
                  className="px-4 py-2 bg-[#1b232e] hover:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  + Nuevo
                </button>
              </div>
            ) : (
              <div className="p-3 bg-white border border-emerald-200 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{pacienteSeleccionado.nombre_completo}</h4>
                  <p className="text-xs text-slate-500 font-mono">
                    {pacienteSeleccionado.telefono ? pacienteSeleccionado.telefono : 'Sin teléfono registrado'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={abrirEdicion}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPacienteSeleccionado(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                    title="Deseleccionar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmitCita} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha</label>
                <input
                  type="date"
                  value={fechaCita}
                  onChange={(e) => setFechaCita(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hora</label>
                <select
                  value={horaCita}
                  onChange={(e) => setHoraCita(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'].map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Especialidad</label>
              <select
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Dermatología">Dermatología</option>
                <option value="Cosmetología">Cosmetología</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Motivo / Tratamiento</label>
              <input
                type="text"
                placeholder="Ej. Revisión acné, Limpieza facial..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={guardandoCita}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl text-sm transition shadow-xs cursor-pointer"
            >
              {guardandoCita ? 'Agendando cita...' : 'Confirmar y Agendar'}
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: Agenda del Día */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Agenda del Día ({fechaFiltro})
              </h2>
              <p className="text-xs text-slate-500">
                {citas.length} {citas.length === 1 ? 'cita programada' : 'citas programadas'}
              </p>
            </div>
            <button
              onClick={cargarCitas}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Refrescar
            </button>
          </div>

          {cargandoCitas ? (
            <div className="flex-1 flex items-center justify-center p-8 text-sm text-slate-400">
              Cargando agenda...
            </div>
          ) : citas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <Calendar className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No hay citas para esta fecha</p>
              <p className="text-xs text-slate-400 mt-1">Usa el formulario de la izquierda para programar una.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {citas.map((cita) => {
                const urlWhatsapp = armarEnlaceWhatsApp(cita);

                let badgeClass = 'bg-slate-100 text-slate-700';
                if (cita.estado === 'en_espera') badgeClass = 'bg-amber-100 text-amber-800 font-semibold animate-pulse';
                if (cita.estado === 'en_atencion') badgeClass = 'bg-blue-100 text-blue-800 font-semibold';
                if (cita.estado === 'completada') badgeClass = 'bg-emerald-100 text-emerald-800';
                if (cita.estado === 'cancelada') badgeClass = 'bg-rose-100 text-rose-800 line-through';

                return (
                  <div
                    key={cita.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {obtenerHoraTexto(cita)}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800">
                          {cita.paciente ? cita.paciente.nombre_completo : `Paciente #${cita.paciente_id}`}
                        </h3>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${badgeClass}`}>
                          {(cita.estado || '').replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          {(cita.profesional === 'Cosmetología' || cita.especialidad === 'Cosmetología') ? (
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          ) : (
                            <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                          )}
                          {cita.profesional || cita.especialidad}
                        </span>
                        {cita.motivo && <span>• {cita.motivo}</span>}
                      </div>

                      {cita.paciente && cita.paciente.telefono && (
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1 pt-0.5">
                          <Phone className="w-3 h-3" />
                          {cita.paciente.telefono}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {urlWhatsapp && (
                        <a
                          href={urlWhatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Enviar confirmación por WhatsApp"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition border border-emerald-200"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}

                      {/* Estado: agendada o confirmada -> pasar a sala de espera */}
                      {(cita.estado === 'agendada' || cita.estado === 'confirmada' || cita.estado === 'programada') && (
                        <button
                          onClick={() => handleCambiarEstado(cita.id, 'en_espera')}
                          className="px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer"
                        >
                          En Sala (Check-in)
                        </button>
                      )}

                      {/* Estado: en_espera -> pasar a atencion */}
                      {cita.estado === 'en_espera' && (
                        <button
                          onClick={() => handleCambiarEstado(cita.id, 'en_atencion')}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                        >
                          Pasa a Consulta
                        </button>
                      )}

                      {/* Estado: en_atencion -> completar */}
                      {cita.estado === 'en_atencion' && (
                        <button
                          onClick={() => handleCambiarEstado(cita.id, 'completada')}
                          className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                        >
                          Completar
                        </button>
                      )}

                      {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                        <button
                          onClick={() => handleCambiarEstado(cita.id, 'cancelada')}
                          className="px-2 py-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Cancelar Cita"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modal: Registrar Nuevo Paciente */}
      {modalNuevoPaciente && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Registrar Nuevo Paciente
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Alta rápida durante la recepción o consulta médica.
            </p>

            {errorModalPaciente && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorModalPaciente}</span>
              </div>
            )}

            <form onSubmit={handleGuardarNuevoPaciente} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mariana López"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  required
                />
              </div>

              {!sinTelefono && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Teléfono (WhatsApp)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={lada}
                      onChange={(e) => setLada(e.target.value)}
                      className="w-24 px-2 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    >
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+57">🇨🇴 +57</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Ej. 3121234567"
                      maxLength={10}
                      value={nuevoTelefono}
                      onChange={(e) => setNuevoTelefono(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                      required
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={sinTelefono}
                  onChange={(e) => {
                    setSinTelefono(e.target.checked);
                    if (e.target.checked) setNuevoTelefono('');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium select-none">
                  El paciente no tiene número de teléfono
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="paciente@correo.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Notas / Trato Personal (Opcional)
                </label>
                <textarea
                  placeholder="Ej: Ocupación, trato preferencial, antecedentes..."
                  rows={2}
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNuevoPaciente(false)}
                  className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPaciente}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-[#19372d] hover:bg-[#132c24] disabled:bg-slate-400 rounded-2xl transition shadow-xs cursor-pointer"
                >
                  {guardandoPaciente ? 'Guardando...' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Paciente */}
      {modalEditarPaciente && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Editar Datos del Paciente
              </h3>
              <button 
                onClick={() => setModalEditarPaciente(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorEdicion && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorEdicion}</span>
              </div>
            )}

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  required
                />
              </div>

              {!editSinTelefono && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono (WhatsApp)</label>
                  <div className="flex gap-2">
                    <select
                      value={editLada}
                      onChange={(e) => setEditLada(e.target.value)}
                      className="w-24 px-2 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
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
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                      required
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={editSinTelefono}
                  onChange={(e) => {
                    setEditSinTelefono(e.target.checked);
                    if (e.target.checked) setEditTelefono('');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium select-none">
                  El paciente no tiene número de teléfono
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalEditarPaciente(false)}
                  className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-[#19372d] hover:bg-[#132c24] disabled:bg-slate-400 rounded-2xl transition shadow-xs cursor-pointer"
                >
                  {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}