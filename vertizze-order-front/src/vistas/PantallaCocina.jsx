// ============================================================================
// ARCHIVO: src/vistas/PantallaCocina.jsx
// DESCRIPCIÓN: KDS con tiempo real, alerta sonora automática y número de mesa.
// ============================================================================

import React, { useEffect, useState, useRef } from 'react';
import { Clock, CheckCircle2, Flame, ChefHat, Bell, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../sdk/supabaseClient';

export default function PantallaCocina() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const totalOrdenesAnterior = useRef(0);

  // Función para reproducir un tono de alerta elegante usando Web Audio API
  const reproducirAlertaSonora = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Nota D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // Sube a A5

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio no soportado o bloqueado por el navegador:', e);
    }
  };

  useEffect(() => {
    obtenerOrdenes();

    const channelName = `ordenes-cocina-realtime-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordenes' },
        (payload) => {
          console.log('Cambio detectado en tiempo real:', payload);
          // Si entra una orden nueva, reproducimos sonido
          if (payload.eventType === 'INSERT') {
            reproducirAlertaSonora();
          }
          obtenerOrdenes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const obtenerOrdenes = async () => {
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .neq('estado', 'entregado')
        .order('id', { ascending: true });

      if (error) throw error;
      
      const nuevasOrdenes = data || [];
      
      // Si la cantidad de órdenes pendientes aumenta respecto al estado previo, suena alerta
      if (nuevasOrdenes.length > totalOrdenesAnterior.current && totalOrdenesAnterior.current !== 0) {
        reproducirAlertaSonora();
      }
      totalOrdenesAnterior.current = nuevasOrdenes.length;

      setOrdenes(nuevasOrdenes);
    } catch (error) {
      console.error('Error al obtener órdenes para cocina:', error);
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstado = async (idOrden, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: nuevoEstado })
        .eq('id', idOrden);

      if (error) throw error;
      obtenerOrdenes();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const renderizarArticulos = (itemsRaw) => {
    if (!itemsRaw) return <span className="text-white/60 text-sm">Sin descripción de productos</span>;

    let itemsParsed = itemsRaw;
    if (typeof itemsRaw === 'string') {
      try {
        itemsParsed = JSON.parse(itemsRaw);
      } catch (e) {
        return <p className="text-sm font-semibold text-amber-100">{itemsRaw}</p>;
      }
    }

    if (Array.isArray(itemsParsed)) {
      return (
        <div className="space-y-2">
          {itemsParsed.map((item, index) => {
            const cantidad = item.cantidad || 1;
            const nombre = item.nombre || item.titulo || 'Artículo';
            const observacion = item.observacion || item.nota || '';

            return (
              <div key={index} className="border-b border-white/10 pb-1.5 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start text-sm font-extrabold text-white">
                  <span>{cantidad}x {nombre}</span>
                </div>
                {observacion && (
                  <p className="text-xs text-amber-300 font-bold italic mt-0.5 bg-black/30 px-2 py-0.5 rounded-md inline-block">
                    Nota: {observacion}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return <p className="text-sm font-semibold text-amber-100">{JSON.stringify(itemsParsed)}</p>;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-3 md:p-5 select-none">
      
      {/* Cabecera del KDS */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-white">KDS - Módulo de Cocina</h1>
            <p className="text-xs text-neutral-400">Cola de preparación de pedidos en tiempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón para activar/probar el sonido manualmente si el navegador lo requiere */}
          <button 
            onClick={reproducirAlertaSonora}
            title="Probar sonido de alerta"
            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 flex items-center gap-1.5 cursor-pointer transition-all shadow-inner"
          >
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>Probar Sonido</span>
          </button>

          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sistema en Línea</span>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      {cargando && ordenes.length === 0 ? (
        <div className="text-center py-20 text-neutral-500 text-sm">Sincronizando órdenes con la base de datos...</div>
      ) : ordenes.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/40 border border-neutral-900 rounded-3xl space-y-2">
          <ChefHat className="w-12 h-12 text-neutral-700 mx-auto" />
          <p className="text-sm font-bold text-neutral-400">No hay pedidos pendientes en la cola</p>
          <p className="text-xs text-neutral-600">Los nuevos pedidos aparecerán automáticamente aquí al crearse.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordenes.map((orden) => {
            const estadoActual = orden.estado || 'pendiente';
            const numeroMesa = orden.mesa || orden.numero_mesa || orden.mesa_id;

            let estilosTarjeta = "border-neutral-800 bg-neutral-900 text-neutral-100";
            let franjaColor = "bg-neutral-700";

            if (estadoActual === 'en_proceso') {
              estilosTarjeta = "border-amber-500 bg-amber-950/95 text-amber-50 shadow-xl shadow-amber-950/40";
              franjaColor = "bg-amber-400";
            } else if (estadoActual === 'listo') {
              estilosTarjeta = "border-emerald-500 bg-emerald-950/95 text-emerald-50 shadow-xl shadow-emerald-950/40";
              franjaColor = "bg-emerald-400";
            }

            return (
              <div 
                key={orden.id} 
                className={`border-2 rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden ${estilosTarjeta}`}
              >
                <div className={`absolute top-0 inset-x-0 h-1.5 ${franjaColor}`}></div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black bg-black/50 px-2.5 py-1 rounded-lg border border-white/10 text-amber-300">
                      #{orden.numero_orden || orden.id}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {numeroMesa && (
                        <span className="text-[11px] font-black bg-amber-500 text-neutral-950 px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                          <UtensilsCrossed className="w-3 h-3" />
                          Mesa {numeroMesa}
                        </span>
                      )}
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-black/50 px-2.5 py-1 rounded-lg border border-white/10 text-white">
                        {orden.tipo_servicio || 'General'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black tracking-wide text-white">{orden.cliente_nombre || 'Cliente'}</h3>
                    <p className="text-xs text-white/80 font-medium capitalize">Pago: {orden.metodo_pago || 'Efectivo'}</p>
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider block">Artículos:</span>
                    {renderizarArticulos(orden.items)}
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-white/15 flex gap-2">
                  {estadoActual === 'pendiente' && (
                    <button
                      onClick={() => cambiarEstado(orden.id, 'en_proceso')}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Iniciar Preparación</span>
                    </button>
                  )}

                  {estadoActual === 'en_proceso' && (
                    <button
                      onClick={() => cambiarEstado(orden.id, 'listo')}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Marcar como Listo</span>
                    </button>
                  )}

                  {estadoActual === 'listo' && (
                    <button
                      onClick={() => cambiarEstado(orden.id, 'entregado')}
                      className="w-full bg-neutral-900 hover:bg-black text-white py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border border-white/20 shadow-md"
                    >
                      Archivar / Entregado
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}