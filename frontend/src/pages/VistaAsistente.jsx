import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Phone, CheckCircle, 
  AlertCircle, MessageCircle, Plus, Search, Filter, RefreshCw 
} from 'lucide-react';
import { 
  getCitas, crearCita, actualizarEstadoCita, 
  getPacientes, crearPaciente 
} from '../api/client';

const HORARIOS_DISPONIBLES = [
  { valor: '09:00', etiqueta: '09:00 AM' },
  { valor: '09:30', etiqueta: '09:30 AM' },
  { valor: '10:00', etiqueta: '10:00 AM' },
  { valor: '10:30', etiqueta: '10:30 AM' },
  { valor: '11:00', etiqueta: '11:00 AM' },
  { valor: '11:30', etiqueta: '11:30 AM' },
  { valor: '12:00', etiqueta: '12:00 PM' },
  { valor: '12:30', etiqueta: '12:30 PM' },
  { valor: '13:00', etiqueta: '01:00 PM' },
  { valor: '13:30', etiqueta: '01:30 PM' },
  { valor: '14:00', etiqueta: '02:00 PM' },
  { valor: '16:00', etiqueta: '04:00 PM' },
  { valor: '16:30', etiqueta: '04:30 PM' },
  { valor: '17:00', etiqueta: '05:00 PM' },
  { valor: '17:30', etiqueta: '05:30 PM' },
  { valor: '18:00', etiqueta: '06:00 PM' },
  { valor: '18:30', etiqueta: '06:30 PM' },
  { valor: '19:00', etiqueta: '07:00 PM' },
  { valor: '19:30', etiqueta: '07:30 PM' },
  { valor: '20:00', etiqueta: '08:00 PM' },
];

export default function VistaAsistente() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [filtroProfesional, setFiltroProfesional] = useState('');
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const [modoNuevoPaciente, setModoNuevoPaciente] = useState(false);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacientesEncontrados, setPacientesEncontrados] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');

  const [fechaCita, setFechaCita] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [horaCita, setHoraCita] = useState('10:00');
  const [profesional, setProfesional] = useState('Dermatología');
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarCitas();
  }, [fechaSeleccionada, filtroProfesional]);

  const cargarCitas = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await getCitas(fechaSeleccionada, filtroProfesional);
      setCitas(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la agenda de citas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (busquedaPaciente.trim().length >= 2) {
      const delay = setTimeout(async () => {
        try {
          const res = await getPacientes(busquedaPaciente);
          setPacientesEncontrados(res.data);
        } catch (err) {
          console.error(err);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setPacientesEncontrados([]);
    }
  }, [busquedaPaciente]);

  const handleCambiarEstado = async (citaId, nuevoEstado) => {
    try {
      await actualizarEstadoCita(citaId, nuevoEstado);
      cargarCitas();
    } catch (err) {
      alert('Error al actualizar el estado de la cita');
    }
  };

  const handleSubmitCita = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      let pId = pacienteSeleccionado ? pacienteSeleccionado.id : null;

      if (modoNuevoPaciente) {
        if (!nuevoNombre.trim()) {
          alert('Ingresa el nombre del paciente');
          setGuardando(false);
          return;
        }
        const resP = await crearPaciente({
          nombre_completo: nuevoNombre,
          telefono: nuevoTelefono || null,
          email: nuevoEmail || null,
        });
        pId = resP.data.id;
      }

      if (!pId) {
        alert('Debes seleccionar o crear un paciente');
        setGuardando(false);
        return;
      }

      const fechaHoraISO = `${fechaCita}T${horaCita}:00`;

      await crearCita({
        paciente_id: pId,
        profesional,
        fecha_hora: fechaHoraISO,
        motivo: motivo || null,
        notas: notas || null,
      });

      if (fechaCita !== fechaSeleccionada) {
        setFechaSeleccionada(fechaCita);
      } else {
        cargarCitas();
      }

      setPacienteSeleccionado(null);
      setBusquedaPaciente('');
      setNuevoNombre('');
      setNuevoTelefono('');
      setNuevoEmail('');
      setMotivo('');
      setNotas('');
      setModoNuevoPaciente(false);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al agendar la cita');
    } finally {
      setGuardando(false);
    }
  };

  const handleWhatsApp = (cita) => {
    const nombrePaciente = cita.paciente?.nombre_completo || cita.paciente?.nombre || 'Paciente';
    const tel = cita.paciente?.telefono?.replace(/\D/g, '');
    if (!tel) {
      alert('Este paciente no tiene número de teléfono registrado');
      return;
    }
    const fechaObj = new Date(cita.fecha_hora);
    const fechaTexto = fechaObj.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaTexto = fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const mensaje = encodeURIComponent(
      `Hola ${nombrePaciente}, te recordamos tu cita para ${cita.profesional} el día ${fechaTexto} a las ${horaTexto}. ¿Nos confirmas tu asistencia?`
    );
    window.open(`https://wa.me/52${tel}?text=${mensaje}`, '_blank');
  };

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'en_espera': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'confirmada': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completada': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'cancelada': return 'bg-gray-100 text-gray-600 border-gray-300';
      case 'no_asistio': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Filtro Principal de Vista */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recepción y Agenda</h1>
          <p className="text-sm text-slate-500">Control de citas, sala de espera y registro de pacientes</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ver Agenda:</span>
            <input 
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
            />
          </div>
          <button 
            onClick={cargarCitas} 
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Actualizar agenda"
          >
            <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Formulario para Agendar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus size={20} className="text-emerald-600" />
              Agendar Nueva Cita
            </h2>
            <button 
              type="button"
              onClick={() => {
                setModoNuevoPaciente(!modoNuevoPaciente);
                setPacienteSeleccionado(null);
              }}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              {modoNuevoPaciente ? 'Buscar existente' : '+ Paciente Nuevo'}
            </button>
          </div>

          <form onSubmit={handleSubmitCita} className="space-y-4">
            {/* Selección de Paciente */}
            {!modoNuevoPaciente ? (
              <div className="relative">
                <label className="block text-xs font-medium text-slate-700 mb-1">Buscar Paciente</label>
                <div className="relative">
                  <input
                    type="text"
                    value={pacienteSeleccionado ? (pacienteSeleccionado.nombre_completo || pacienteSeleccionado.nombre) : busquedaPaciente}
                    onChange={(e) => {
                      setBusquedaPaciente(e.target.value);
                      if (pacienteSeleccionado) setPacienteSeleccionado(null);
                    }}
                    placeholder="Escribe nombre o teléfono..."
                    className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>

                {pacientesEncontrados.length > 0 && !pacienteSeleccionado && (
                  <div className="absolute left-0 right-0 mt-1 border border-slate-200 rounded-xl shadow-xl bg-white max-h-48 overflow-y-auto z-30 divide-y divide-slate-100">
                    {pacientesEncontrados.map((p) => {
                      const nombreMostrar = p.nombre_completo || p.nombre || 'Paciente sin nombre';
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPacienteSeleccionado(p);
                            setBusquedaPaciente(nombreMostrar);
                            setPacientesEncontrados([]);
                          }}
                          className="p-3 text-sm hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <span className="font-semibold text-slate-900">{nombreMostrar}</span>
                          <span className="text-xs text-slate-500 font-mono">{p.telefono || 'Sin tel'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase">Datos del Nuevo Paciente</p>
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Teléfono móvil"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Fecha y Hora de la Cita */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha de Cita</label>
                <input
                  type="date"
                  value={fechaCita}
                  onChange={(e) => setFechaCita(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hora de Cita</label>
                <select
                  value={horaCita}
                  onChange={(e) => setHoraCita(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  required
                >
                  {HORARIOS_DISPONIBLES.map((h) => (
                    <option key={h.valor} value={h.valor}>
                      {h.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Especialidad */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Especialidad</label>
              <select
                value={profesional}
                onChange={(e) => setProfesional(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-slate-800"
              >
                <option value="Dermatología">Dermatología</option>
                <option value="Cosmetología">Cosmetología</option>
              </select>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Motivo / Tratamiento</label>
              <input
                type="text"
                placeholder="Ej. Revisión acné, Limpieza facial..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            {/* Notas internas */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notas para recepción</label>
              <textarea
                rows="2"
                placeholder="Ej. Viene con acompañante..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {guardando ? 'Guardando cita...' : 'Confirmar y Agendar'}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Agenda del Día */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            {[
              { id: '', label: 'Todas las Citas' },
              { id: 'Dermatología', label: 'Dermatología' },
              { id: 'Cosmetología', label: 'Cosmetología' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFiltroProfesional(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  filtroProfesional === tab.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {citas.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
              <Calendar size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium">No hay citas agendadas para esta fecha</p>
              <p className="text-xs text-slate-400 mt-1">Usa el formulario para registrar la primera</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citas.map((cita) => {
                const nombrePaciente = cita.paciente?.nombre_completo || cita.paciente?.nombre || 'Paciente';
                const hora = new Date(cita.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={cita.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center min-w-[75px]">
                        <Clock size={16} className="mx-auto text-slate-500 mb-1" />
                        <span className="font-bold text-sm text-slate-900">{hora}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{nombrePaciente}</h3>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getBadgeColor(cita.estado)}`}>
                            {cita.estado.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                          {cita.profesional} {cita.motivo ? `• ${cita.motivo}` : ''}
                        </p>

                        {cita.notas && (
                          <p className="text-xs text-slate-500 mt-1 italic">"{cita.notas}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        onClick={() => handleWhatsApp(cita)}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Enviar recordatorio WhatsApp"
                      >
                        <MessageCircle size={17} />
                      </button>

                      {cita.estado !== 'en_espera' && cita.estado !== 'completada' && (
                        <button
                          onClick={() => handleCambiarEstado(cita.id, 'en_espera')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                        >
                          En Sala (Check-in)
                        </button>
                      )}

                      {cita.estado === 'agendada' && (
                        <button
                          onClick={() => handleCambiarEstado(cita.id, 'confirmada')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          Confirmar
                        </button>
                      )}

                      {cita.estado === 'en_espera' && (
                        <button
                          onClick={() => handleCambiarEstado(cita.id, 'completada')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          Completar
                        </button>
                      )}

                      {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) handleCambiarEstado(cita.id, e.target.value);
                          }}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white"
                        >
                          <option value="">Más...</option>
                          <option value="cancelada">Cancelar Cita</option>
                          <option value="no_asistio">No Asistió (Falta)</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}