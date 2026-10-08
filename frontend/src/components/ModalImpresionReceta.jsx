import React, { useState } from 'react';
import { Printer, X, FileText } from 'lucide-react';

export default function ModalImpresionReceta({ receta, paciente, onClose }) {
  // true = estampa únicamente los textos sobre la hoja de imprenta pre-impresa
  // false = réplica digital fiel y completa para PDF o WhatsApp
  const [usarPapelMembretado, setUsarPapelMembretado] = useState(true);

  if (!receta) return null;

  // Formato: "Martes 15/Sep/2026"
  const formatearFechaConDia = (f) => {
    if (!f) return '';
    const d = new Date(f);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const diaSemana = dias[d.getDay()];
    const diaNum = String(d.getDate()).padStart(2, '0');
    const mes = meses[d.getMonth()];
    const anio = d.getFullYear();
    return `${diaSemana} ${diaNum}/${mes}/${anio}`;
  };

  const formatearFechaCorta = (f) => {
    if (!f) return '';
    const d = new Date(f);
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const diaNum = String(d.getDate()).padStart(2, '0');
    const mes = meses[d.getMonth()];
    const anio = d.getFullYear();
    return `${diaNum}/${mes}/${anio}`;
  };

  // Reordena "Roberto Tapia Torres" -> "TAPIA TORRES ROBERTO"
  const formatearApellidosPrimero = (nombreCompleto) => {
    if (!nombreCompleto) return '';
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length >= 3) {
      const apellidos = partes.slice(-2).join(' ');
      const nombres = partes.slice(0, -2).join(' ');
      return `${apellidos} ${nombres}`.toUpperCase();
    } else if (partes.length === 2) {
      return `${partes[1]} ${partes[0]}`.toUpperCase();
    }
    return nombreCompleto.toUpperCase();
  };

  const handleImprimir = () => {
    window.print();
  };

  const rawNombre = paciente?.nombre_completo || receta.paciente?.nombre_completo || '';
  const nombrePaciente = formatearApellidosPrimero(rawNombre);
  const fechaTexto = formatearFechaConDia(receta.fecha || new Date());
  const proxCitaTexto = receta.proxima_cita ? formatearFechaCorta(receta.proxima_cita) : '';

  const totalElementos = (receta.detalles?.length || 0) + (receta.procedimientos?.length || 0);
  const esRecetaLarga = totalElementos >= 3;

  // Paleta de colores ajustada
  const COLOR_GUINDA = '#8B1D2C'; // Título del doctor y líneas divisorias
  const COLOR_VERDE_TEXTO = '#224D36'; // Verde formal uniforme en todo el membrete
  const COLOR_FRANJA_VERDE = '#D6E5DD'; // Franja lateral derecha

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      {/* Estilos para impresión @media print e importación de fuente cursiva */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playball&family=Alex+Brush&display=swap');

        @media print {
          body * {
            visibility: hidden;
          }
          #area-receta-impresion, #area-receta-impresion * {
            visibility: visible;
          }
          #area-receta-impresion {
            position: fixed;
            left: 0;
            top: 0;
            width: 216mm;
            height: 140mm;
            margin: 0;
            padding: ${usarPapelMembretado ? '35mm 65mm 12mm 22mm' : '0mm'};
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            page-break-after: avoid;
          }
          @page {
            size: landscape;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Barra superior de controles (no se imprime) */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-sm">Vista Previa de Receta Médica</h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Folio #{receta.id}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs select-none">
              <input
                type="checkbox"
                checked={usarPapelMembretado}
                onChange={(e) => setUsarPapelMembretado(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Imprimir sobre hoja membretada física</span>
            </label>

            <button
              onClick={handleImprimir}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hoja de Receta */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200/50 flex justify-center items-center">
          <div 
            id="area-receta-impresion"
            className="w-[780px] h-[495px] bg-white text-slate-900 shadow-lg relative flex flex-col justify-between border border-slate-300 font-sans overflow-hidden"
            style={{
              padding: usarPapelMembretado ? '118px 210px 28px 55px' : '0px'
            }}
          >
            {/* ======================================================== */}
            {/* MODO DIGITAL: REPRODUCCIÓN IDÉNTICA DEL MEMBRETADO        */}
            {/* ======================================================== */}
            {!usarPapelMembretado ? (
              <div className="w-full h-full flex flex-row relative">
                
                {/* Contenido Central y Encabezados */}
                <div className="flex-1 px-8 py-4 flex flex-col justify-between relative z-10">
                  
                  {/* Encabezado */}
                  <div className="text-center pt-1 pb-1">
                    <span 
                      className="text-2xl block tracking-wide font-normal"
                      style={{ 
                        fontFamily: "'Anglia Script Olde Concise', 'Anglia Script', 'Playball', 'Alex Brush', cursive", 
                        color: COLOR_VERDE_TEXTO,
                        lineHeight: '1.1'
                      }}
                    >
                      Clínica de la Piel
                    </span>
                    <h2 
                      className="text-xl font-bold tracking-tight mt-0.5"
                      style={{ color: COLOR_GUINDA, fontFamily: 'serif' }}
                    >
                      Dr. Rubén Sahagún Ontiveros
                    </h2>
                    <p 
                      className="text-[9.5px] uppercase font-bold tracking-widest mt-0.5"
                      style={{ color: COLOR_VERDE_TEXTO }}
                    >
                      DERMATOLOGÍA • COSMETOLOGÍA
                    </p>
                  </div>

                  {/* Renglón: Nombre y Fecha con Línea Guinda Gruesa */}
                  <div 
                    className="flex justify-between items-end pb-1 text-xs"
                    style={{ borderBottom: `2px solid ${COLOR_GUINDA}` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="italic" style={{ color: COLOR_VERDE_TEXTO, fontFamily: 'serif' }}>
                        Nombre:
                      </span>
                      <span className="font-bold tracking-wider font-mono text-slate-900 text-xs">
                        {nombrePaciente}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pr-2">
                      <span className="italic" style={{ color: COLOR_VERDE_TEXTO, fontFamily: 'serif' }}>
                        Fecha:
                      </span>
                      <span className="font-semibold font-mono text-slate-900 text-[11px]">
                        {fechaTexto}
                      </span>
                    </div>
                  </div>

                  {/* Prescripción Médica */}
                  <div 
                    className={`flex-1 font-mono py-2 overflow-hidden ${esRecetaLarga ? 'space-y-2 text-[11px]' : 'space-y-3.5 text-xs'}`}
                    style={{ paddingLeft: '18mm' }}
                  >
                    {receta.detalles && receta.detalles.length > 0 ? (
                      receta.detalles.map((det, idx) => (
                        <div key={idx} className="leading-snug">
                          <p className="font-bold text-slate-900 uppercase">
                            {det.cantidad} {det.producto?.nombre || `PRODUCTO #${det.producto_id}`}
                          </p>
                          <p className={`text-slate-700 uppercase pl-3 font-sans ${esRecetaLarga ? 'text-[10px]' : 'text-[11px]'}`}>
                            . {det.indicaciones || 'APLICAR SEGÚN INDICACIÓN MÉDICA'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-center py-6 font-sans text-xs">
                        Sin prescripción farmacológica registrada.
                      </p>
                    )}

                    {receta.procedimientos && receta.procedimientos.length > 0 && (
                      <div className="pt-1.5 border-t border-dashed border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          Tratamientos Clínicos Realizados:
                        </p>
                        {receta.procedimientos.map((p, idx) => (
                          <p key={idx} className="font-semibold text-slate-800 pl-2">
                            - {p.procedimiento?.nombre || `Tratamiento #${p.procedimiento_id}`} {p.notas && `(${p.notas})`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Espacio previo a la línea inferior */}
                  <div className="flex flex-col justify-end">
                    
                    {/* Próxima Cita inmediatamente ARRIBA de la línea guinda */}
                    <div className="flex items-center text-xs mb-1">
                      <span className="italic mr-2" style={{ color: COLOR_VERDE_TEXTO, fontFamily: 'serif' }}>
                        Próxima cita:
                      </span>
                      <span className="font-bold font-mono text-slate-900 text-xs">
                        {proxCitaTexto}
                      </span>
                    </div>

                    {/* Línea inferior Guinda Gruesa justo arriba de la dirección y teléfonos */}
                    <div style={{ borderTop: `2px solid ${COLOR_GUINDA}` }} className="pt-1.5">
                      <div className="flex justify-between items-start text-[8.5px] leading-tight" style={{ color: COLOR_VERDE_TEXTO }}>
                        <div className="font-sans">
                          <p className="font-bold">SEGUNDA DE PALAPAS No. 99 ESQ. AV. VENUSTIANO CARRANZA</p>
                          <p>COL. LAS PALMAS • C.P. 28017 • COLIMA, COL.</p>
                        </div>

                        <div className="text-right font-sans font-bold pr-3">
                          <p>Tel. 312 314 60 10</p>
                          <p>Cel. 312 303 34 38</p>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Franja Lateral Derecha Completa de Arriba a Abajo (CERO líneas divisorias) */}
                <div 
                  className="w-36 h-full p-3 flex flex-col justify-start text-center shrink-0 border-l border-emerald-300"
                  style={{ backgroundColor: COLOR_FRANJA_VERDE }}
                >
                  {/* Imagotipo / Logo */}
                  <div className="w-16 h-20 mx-auto mt-4 mb-4 rounded-t-full border border-emerald-800/40 bg-white/60 flex items-center justify-center p-1 shadow-2xs">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-amber-400 mx-auto mb-1"></div>
                      <span className="text-[8px] font-bold text-emerald-950 block">CLÍNICA</span>
                    </div>
                  </div>

                  {/* Bloque Institucional: Misma fuente, mismo color y peso font-black idéntico en todos */}
                  <div 
                    className="uppercase text-center w-full space-y-1.5 px-0.5"
                    style={{ 
                      color: COLOR_VERDE_TEXTO, 
                      fontSize: '7.5pt', 
                      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      lineHeight: '1.25' 
                    }}
                  >
                    <p className="font-black">
                      UNIVERSIDAD DE GUADALAJARA
                    </p>

                    <p className="font-black pt-1">
                      INSTITUTO DERMATOLÓGICO DE GUADALAJARA
                    </p>

                    <p className="font-black pt-2">
                      REG. CÉD. PROF. 861111
                    </p>

                    <p className="font-black">
                      REG. S.S.A. 110764
                    </p>

                    <p className="font-black">
                      CÉD. DE ESP. 3507145
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              /* ======================================================== */
              /* MODO HOJA FÍSICA MEMBRETADA (COORDENADAS MILIMÉTRICAS)   */
              /* ======================================================== */
              <>
                {/* Renglón: Nombre del Paciente y Fecha */}
                <div className="flex justify-between items-end mb-1">
                  {/* Nombre: Subido 8mm, movido a la derecha 1.7cm */}
                  <div 
                    className="flex items-center gap-2 flex-1 relative"
                    style={{ top: '-8mm', left: '1.7cm' }}
                  >
                    <span 
                      className="font-bold tracking-wider text-slate-900 font-mono"
                      style={{ fontSize: '10pt' }}
                    >
                      {nombrePaciente}
                    </span>
                  </div>
                  
                  {/* Fecha del día con día de la semana */}
                  <div 
                    className="flex items-center gap-2 pl-4 relative"
                    style={{ top: '-6mm', left: '12mm' }}
                  >
                    <span className="font-semibold text-slate-900 font-mono text-[11px]">
                      {fechaTexto}
                    </span>
                  </div>
                </div>

                {/* Prescripción: Movido 18mm a la derecha y bajado 7mm */}
                <div 
                  className={`flex-1 font-mono overflow-hidden ${esRecetaLarga ? 'space-y-2 text-[11px]' : 'space-y-4 text-xs'}`}
                  style={{ paddingLeft: '18mm', marginTop: '7mm' }}
                >
                  {receta.detalles && receta.detalles.length > 0 ? (
                    receta.detalles.map((det, idx) => (
                      <div key={idx} className="leading-snug">
                        <p className="font-bold text-slate-900 uppercase">
                          {det.cantidad} {det.producto?.nombre || `PRODUCTO #${det.producto_id}`}
                        </p>
                        <p className={`text-slate-700 uppercase pl-3 font-sans ${esRecetaLarga ? 'text-[10px]' : 'text-[11px]'}`}>
                          . {det.indicaciones || 'APLICAR SEGÚN INDICACIÓN MÉDICA'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic text-center py-4">Sin medicamentos prescritos.</p>
                  )}

                  {receta.procedimientos && receta.procedimientos.length > 0 && (
                    <div className="pt-1.5 border-t border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        Tratamientos Clínicos Realizados:
                      </p>
                      {receta.procedimientos.map((p, idx) => (
                        <p key={idx} className="font-semibold text-slate-800 pl-2">
                          - {p.procedimiento?.nombre || `Tratamiento #${p.procedimiento_id}`} {p.notas && `(${p.notas})`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Próxima Cita: Subida 5mm y con sangría de 74px */}
                <div 
                  className="pt-1 flex justify-between items-end text-xs relative"
                  style={{ top: '-5mm' }}
                >
                  <div 
                    className="flex items-center"
                    style={{ paddingLeft: '74px' }}
                  >
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {proxCitaTexto}
                    </span>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}