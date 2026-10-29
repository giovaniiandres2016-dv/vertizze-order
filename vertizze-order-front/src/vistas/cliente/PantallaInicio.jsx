// ============================================================================
// ARCHIVO: src/vistas/cliente/PantallaInicio.jsx
// DESCRIPCIÓN: Pantalla principal responsiva con iconografía profesional.
// ============================================================================

import React from 'react';
import { UtensilsCrossed, ShoppingBag, Bike, Zap } from 'lucide-react';

export default function PantallaInicio({ alSeleccionarModo }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none">
      
      <header className="text-center py-4">
        <h2 className="text-amber-500 font-bold tracking-widest text-xs sm:text-sm uppercase">
          Vértizze Presents
        </h2>
        <h1 className="text-2xl sm:text-3xl font-black tracking-wider mt-1 text-white">
          VERTIZZE<span className="text-amber-500">ORDER</span>
        </h1>
      </header>

      <main className="flex flex-col items-center justify-center my-auto text-center space-y-6 sm:space-y-8 w-full max-w-4xl mx-auto">
        
        <div className="space-y-3 max-w-md px-2">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-amber-500/25">
            <Zap className="w-3.5 h-3.5" /> Autogestión Rápida
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">¿Con hambre?</h2>
          <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
            Sáltate la fila, arma tu pedido a tu gusto y disfrútalo al instante.
          </p>
        </div>

        {/* 3 Opciones de Servicio con Iconografía Profesional */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 w-full max-w-3xl px-2">
          
          {/* Para Servir */}
          <button 
            onClick={() => alSeleccionarModo('para_servir')}
            className="group relative flex flex-col items-center justify-center p-6 bg-neutral-900 border-2 border-neutral-800 rounded-3xl hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all duration-300 shadow-xl active:scale-95 cursor-pointer"
          >
            <div className="p-4 bg-neutral-950 rounded-2xl mb-3 group-hover:bg-amber-500/10 text-amber-500 transition-all duration-300 shadow-md">
              <UtensilsCrossed className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm sm:text-base text-white tracking-tight">PARA SERVIR</span>
            <span className="text-[11px] sm:text-xs text-neutral-400 mt-1">Disfruta en el local</span>
          </button>

          {/* Para Llevar */}
          <button 
            onClick={() => alSeleccionarModo('para_recoger')}
            className="group relative flex flex-col items-center justify-center p-6 bg-neutral-900 border-2 border-neutral-800 rounded-3xl hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all duration-300 shadow-xl active:scale-95 cursor-pointer"
          >
            <div className="p-4 bg-neutral-950 rounded-2xl mb-3 group-hover:bg-amber-500/10 text-amber-500 transition-all duration-300 shadow-md">
              <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm sm:text-base text-white tracking-tight">PARA LLEVAR</span>
            <span className="text-[11px] sm:text-xs text-neutral-400 mt-1">Pide y retira en caja</span>
          </button>

          {/* Domicilio (Icono de Mensajero / Moto / Bici) */}
          <button 
            onClick={() => alSeleccionarModo('domicilio')}
            className="group relative flex flex-col items-center justify-center p-6 bg-neutral-900 border-2 border-neutral-800 rounded-3xl hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all duration-300 shadow-xl active:scale-95 cursor-pointer"
          >
            <div className="p-4 bg-neutral-950 rounded-2xl mb-3 group-hover:bg-amber-500/10 text-amber-500 transition-all duration-300 shadow-md">
              <Bike className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm sm:text-base text-white tracking-tight">DOMICILIO</span>
            <span className="text-[11px] sm:text-xs text-neutral-400 mt-1">Llega directo a tu puerta</span>
          </button>

        </div>

      </main>

      <footer className="text-center text-[10px] sm:text-xs text-neutral-600 py-2">
        Sistema Operado por Vertizze © 2026
      </footer>

    </div>
  );
}