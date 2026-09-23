// ============================================================================
// ARCHIVO: src/vistas/PantallaInicio.jsx
// DESCRIPCIÓN: Pantalla principal de bienvenida (Kiosco). Diseñada con estilo 
//              Dark Mode profesional y uso de iconos vectoriales ámbar de Lucide React.
// ============================================================================

import React from 'react';
// Importamos iconos profesionales desde la librería lucide-react
import { UtensilsCrossed, ShoppingBag, Zap } from 'lucide-react';

export default function PantallaInicio({ alSeleccionarModo }) {
  return (
    // Contenedor principal: Fondo negro oscuro (neutral-950), ocupa toda la pantalla
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-6 select-none">
      
      {/* 1. SECCIÓN DE ENCABEZADO: Marca y subtítulo */}
      <header className="text-center py-4">
        <h2 className="text-amber-500 font-bold tracking-widest text-sm uppercase">
          VertizzeTech Presents
        </h2>
        <h1 className="text-3xl font-black tracking-wider mt-1 text-white">
          VERTIZZE<span className="text-amber-500">ORDER</span>
        </h1>
      </header>

      {/* 2. SECCIÓN CENTRAL: Invitación a elegir la modalidad */}
      <main className="flex flex-col items-center justify-center my-auto text-center space-y-8">
        
        <div className="space-y-3 max-w-md">
          {/* Etiqueta decorativa con icono de rayo */}
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-amber-500/25">
            <Zap className="w-3.5 h-3.5" /> Autogestión Rápida
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight">¿Con hambre?</h2>
          <p className="text-neutral-400 text-sm">
            Sáltate la fila, arma tu pedido a tu gusto y disfrútalo al instante.
          </p>
        </div>

        {/* Botones de Selección: Para Servir / Para Llevar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
          
          {/* Botón 1: Modo Para Servir */}
          <button 
            onClick={() => alSeleccionarModo('para_servir')}
            className="group relative flex flex-col items-center justify-center p-8 bg-neutral-900 border-2 border-neutral-800 rounded-3xl hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
          >
            <div className="p-5 bg-neutral-950 rounded-2xl mb-5 group-hover:bg-amber-500/10 text-amber-600 group-hover:text-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/10">
              <UtensilsCrossed className="w-10 h-10" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">PARA SERVIR</span>
            <span className="text-sm text-neutral-400 mt-1.5">Disfruta en el local</span>
          </button>

          {/* Botón 2: Modo Para Llevar */}
          <button 
            onClick={() => alSeleccionarModo('para_llevar')}
            className="group relative flex flex-col items-center justify-center p-8 bg-neutral-900 border-2 border-neutral-800 rounded-3xl hover:border-amber-500/50 hover:bg-neutral-800/80 transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
          >
            <div className="p-5 bg-neutral-950 rounded-2xl mb-5 group-hover:bg-amber-500/10 text-amber-600 group-hover:text-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/10">
              <ShoppingBag className="w-10 h-10" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">PARA LLEVAR</span>
            <span className="text-sm text-neutral-400 mt-1.5">Llévalo donde quieras</span>
          </button>

        </div>

      </main>

      {/* 3. SECCIÓN PIE DE PÁGINA */}
      <footer className="text-center text-xs text-neutral-600 py-2">
        Sistema Operado por Vertizze Tech © 2026
      </footer>

    </div>
  );
}