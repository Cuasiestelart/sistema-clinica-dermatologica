import React, { useState } from 'react';
import VistaDoctor from './pages/VistaDoctor';
import VistaFarmacia from './pages/VistaFarmacia';
import { Pill, Stethoscope, ShoppingBag } from 'lucide-react';

export default function App() {
  const [vistaActual, setVistaActual] = useState('doctor'); // 'doctor' | 'farmacia'

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans">
      {/* Header General */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-none">Clínica Dermatológica</h1>
              <p className="text-[11px] text-slate-400 mt-1">Sistema Clínico & Punto de Venta</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setVistaActual('doctor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                vistaActual === 'doctor'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" /> Consultorio (Doctor)
            </button>
            <button
              onClick={() => setVistaActual('farmacia')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                vistaActual === 'farmacia'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Mostrador (Farmacia)
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {vistaActual === 'doctor' ? <VistaDoctor /> : <VistaFarmacia />}
      </main>
    </div>
  );
}