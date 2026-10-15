// ============================================================================
// ARCHIVO: src/vistas/cliente/PantallaInicio.jsx
// DESCRIPCIÓN: Pantalla principal de bienvenida con 3 opciones de servicio.
// ============================================================================

import React from 'react';
import { UtensilsCrossed, ShoppingBag, Truck, Zap } from 'lucide-react';

export default function PantallaInicio({ alSeleccionarModo }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-6 select-none">
      
      <header className="text-center py-4">
        <h2 className="text-amber-500 font-bold tracking-widest text-sm uppercase">
          VertizzeTech Presents
        </h2>
        <h1 className="text-3xl font-black tracking-wider mt-1 text-white">
          VERTIZZE<span className="text-amber-500">ORDER</span>
        </h1>
      </header>

      <main className="flex flex-col items-center justify-center my-auto text-center space-y-8">
        
        <div className="space-y-3 max-w-md">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-amber-500/25">
            <Zap className="w-3.5 h-3.5" /> Autogestión Rápida
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight">¿Con hambre?</h2>
          <p className="text-neutral-400 text-sm">
            Sáltate la fila, arma tu pedido a tu gusto y disfrútalo al instante.
          </p>
        </div>

        {/* 3 Opciones de Servicio */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl">
          
          {/* Opción 1: Para Servir */}
          <button 
            onClick={() => alSeleccionarModo('para_servir')}
            className="group relative flex flex-col items-center justify-center p-6 bg-neutral-900 border-2 border-neutral-800 rounded-3xl hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
          >
            <div className="p-4 bg-neutral-950 rounded-2xl mb-4 group-hover:bg-amber-500/10 text-amber-500 transition-all duration-300 shadow-lg">
              <UtensilsCrossed className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base text-white tracking-tight">PARA SERVIR</span>
            <span className="text-xs text-neutral-400 mt-1">Disfruta en el local</span>
          </button>

          {/* Opción 2: Para Recoger */}
          <button 
            onClick={() => alSeleccionarModo('para_recoger')}
            className="group relative flex flex-col items-center justify-center p-6 bg-neutral-900 border-2 border-neutral-800 rounded-3xl hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
          >
            <div className="p-4 bg-neutral-950 rounded-2xl mb-4 group-hover:bg-amber-500/10 text-amber-500 transition-all duration-300 shadow-lg">
              <ShoppingBag className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base text-white tracking-tight">PARA RECOGER</span>
            <span className="text-xs text-neutral-400 mt-1">Pide y retira en caja</span>
          </button>

          {/* Opción 3: Domicilio */}
          <button 
            onClick={() => alSeleccionarModo('domicilio')}
            className="group relative flex flex-col items-center justify-center p-6 bg-neutral-900 border-2 border-neutral-800 rounded-3xl hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
          >
            <div className="p-4 bg-neutral-950 rounded-2xl mb-4 group-hover:bg-amber-500/10 text-amber-500 transition-all duration-300 shadow-lg">
              <Truck className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base text-white tracking-tight">DOMICILIO</span>
            <span className="text-xs text-neutral-400 mt-1">Llega directo a tu puerta</span>
          </button>

        </div>

      </main>

      <footer className="text-center text-xs text-neutral-600 py-2">
        Sistema Operado por Vertizze Tech © 2026
      </footer>

    </div>
  );
}