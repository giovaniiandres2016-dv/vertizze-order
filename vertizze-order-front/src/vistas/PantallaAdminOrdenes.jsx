// ============================================================================
// ARCHIVO: src/vistas/PantallaAdminOrdenes.jsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { suscribirseAOrdenes, supabase } from '../sdk/vertizzeApi';
import { Bell, Clock, ArrowLeft, ShoppingBag, UtensilsCrossed } from 'lucide-react';

export default function PantallaAdminOrdenes({ alVolverInicio }) {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // 1. Cargar las órdenes existentes al montar el componente
    async function cargarOrdenesIniciales() {
      try {
        const { data, error } = await supabase
          .from('ordenes')
          .select('*')
          .order('creado_en', { ascending: false });

        if (error) throw error;
        setOrdenes(data || []);
      } catch (error) {
        console.error("Error al cargar órdenes:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarOrdenesIniciales();

    // 2. Suscribirse a los nuevos pedidos en tiempo real
    const suscripcion = suscribirseAOrdenes((nuevaOrden) => {
      setOrdenes((ordenesActuales) => [nuevaOrden, ...ordenesActuales]);
      // Opcional: Reproducir un sonido o alerta visual aquí
    });

    // Limpiar suscripción al desmontar
    return () => {
      suscripcion.unsubscribe();
    };
  }, []);

  const formatearPrecio = (valor) => `$ ${(valor || 0).toLocaleString('es-CO')}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 flex flex-col">
      {/* Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-neutral-900">
        <button 
          onClick={alVolverInicio}
          className="flex items-center gap-2 text-neutral-400 hover:text-amber-400 bg-neutral-900 px-4 py-2 rounded-xl border border-neutral-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Volver</span>
        </button>
        <h1 className="text-xl font-black tracking-wider flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500 animate-bounce" />
          <span>PANEL DE PEDIDOS EN TIEMPO REAL</span>
        </h1>
        <div className="bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-amber-400 text-xs font-semibold">
          Activo 🟢
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-6xl w-full mx-auto flex-1 py-6">
        {cargando ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : ordenes.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/40 rounded-3xl border border-neutral-900">
            <Clock className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium">Esperando nuevos pedidos de los clientes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ordenes.map((orden) => (
              <div 
                key={orden.id} 
                className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Orden #{orden.numero_orden}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(orden.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-white mb-1">
                    {orden.cliente_nombre || 'Cliente sin nombre'}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4">
                    {orden.tipo_servicio === 'para_servir' ? (
                      <>
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                        <span>Para Servir</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                        <span>Para Llevar</span>
                      </>
                    )}
                  </div>

                  {/* Lista de items */}
                  <div className="bg-neutral-950/60 rounded-2xl p-3 mb-4 border border-neutral-800/80 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Productos solicitados:</span>
                    {Array.isArray(orden.items) && orden.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-neutral-300">
                        <span>{item.cantidad}x {item.nombre}</span>
                        <span className="font-semibold">{formatearPrecio(item.precio * item.cantidad)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-medium">Total a pagar:</span>
                  <span className="text-xl font-black text-amber-400">{formatearPrecio(orden.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}