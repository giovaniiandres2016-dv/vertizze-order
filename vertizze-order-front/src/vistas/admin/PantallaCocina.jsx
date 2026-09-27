// ============================================================================
// ARCHIVO: src/vistas/PantallaCocina.jsx
// DESCRIPCIÓN: KDS optimizado con control de estados y cronómetro interactivo.
// ============================================================================

import React, { useEffect, useState, useRef } from 'react';
import { Clock, CheckCircle2, Flame, ChefHat, Bell, UtensilsCrossed, Bike, Store } from 'lucide-react';
import { supabase } from '../../sdk/supabaseClient';

export default function PantallaCocina() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [, setForzarRender] = useState(0);
  const totalOrdenesAnterior = useRef(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setForzarRender((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const reproducirAlertaSonora = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio no soportado o bloqueado:', e);
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
      if (nuevasOrdenes.length > totalOrdenesAnterior.current && totalOrdenesAnterior.current !== 0) {
        reproducirAlertaSonora();
      }
      totalOrdenesAnterior.current = nuevasOrdenes.length;

      setOrdenes(nuevasOrdenes);
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
    } finally {
      setCargando(false);
    }
  };

  const manejarAccionTarjeta = async (orden) => {
    const estadoActual = (orden.estado || 'Pendiente').toLowerCase().trim();
    let nuevoEstado = '';
    let datosActualizacion = {};

    const ahora = new Date().toISOString();

    // Normalizamos las comparaciones de estados para evitar desajustes
    if (estadoActual === 'pendiente' || estadoActual === 'Pendiente') {
      nuevoEstado = 'en_proceso';
      datosActualizacion = {
        estado: nuevoEstado,
        tiempo_inicio: ahora
      };
    } else if (estadoActual === 'en_proceso') {
      nuevoEstado = 'listo';
      
      let duracionTexto = "0 min";
      if (orden.tiempo_inicio) {
        const inicio = new Date(orden.tiempo_inicio).getTime();
        const fin = new Date(ahora).getTime();
        const diffSegundos = Math.floor((fin - inicio) / 1000);
        
        const mins = Math.floor(diffSegundos / 60);
        const segs = diffSegundos % 60;

        if (mins > 0) {
          duracionTexto = `${mins} min ${segs} seg`;
        } else {
          duracionTexto = `${segs} seg`;
        }
      }

      datosActualizacion = {
        estado: nuevoEstado,
        tiempo_fin: ahora,
        duracion_preparacion: duracionTexto
      };
    } else if (estadoActual === 'listo') {
      nuevoEstado = 'entregado';
      datosActualizacion = {
        estado: nuevoEstado
      };
    }

    if (nuevoEstado) {
      try {
        const { error } = await supabase
          .from('ordenes')
          .update(datosActualizacion)
          .eq('id', orden.id);

        if (error) throw error;
        await obtenerOrdenes();
      } catch (error) {
        console.error('Error al actualizar estado:', error);
      }
    }
  };

  const CronometroActivo = ({ tiempoInicio }) => {
    const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);

    useEffect(() => {
      if (!tiempoInicio) return;
      const calcularTiempo = () => {
        const inicio = new Date(tiempoInicio).getTime();
        const ahora = new Date().getTime();
        const diff = Math.floor((ahora - inicio) / 1000);
        setSegundosTranscurridos(diff > 0 ? diff : 0);
      };

      calcularTiempo();
      const timer = setInterval(calcularTiempo, 1000);
      return () => clearInterval(timer);
    }, [tiempoInicio]);

    const minutos = Math.floor(segundosTranscurridos / 60);
    const segundos = segundosTranscurridos % 60;
    const formatoTiempo = minutos > 0 ? `${minutos} min ${segundos} seg` : `${segundos} seg`;

    return (
      <div className="flex items-center gap-1.5 bg-black/60 border border-amber-500/40 px-2.5 py-1 rounded-lg text-amber-300 font-mono text-xs font-bold">
        <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
        <span>⏱️ {formatoTiempo}</span>
      </div>
    );
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
            <p className="text-xs text-neutral-400">Toca cualquier tarjeta para avanzar su estado</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            const estadoActual = (orden.estado || 'pendiente').toLowerCase().trim();
            const numeroMesa = orden.mesa || orden.numero_mesa || orden.mesa_id;
            const tipoServicioRaw = (orden.tipo_servicio || '').toLowerCase();
            const esDomicilio = tipoServicioRaw.includes('domicilio') || tipoServicioRaw.includes('delivery');

            let estilosTarjeta = "border-neutral-800 bg-neutral-900 text-neutral-100 hover:border-neutral-600";
            let franjaColor = "bg-neutral-700";
            let textoBotonAccion = "Iniciar Preparación";
            let estiloBotonAccion = "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/20";

            if (estadoActual === 'en_proceso') {
              estilosTarjeta = "border-amber-500 bg-amber-950/95 text-amber-50 shadow-xl shadow-amber-950/40 hover:border-amber-400";
              franjaColor = "bg-amber-400";
              textoBotonAccion = "Marcar como Listo";
              estiloBotonAccion = "bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black shadow-lg";
            } else if (estadoActual === 'listo') {
              estilosTarjeta = "border-emerald-500 bg-emerald-950/95 text-emerald-50 shadow-xl shadow-emerald-950/40 hover:border-emerald-400";
              franjaColor = "bg-emerald-400";
              textoBotonAccion = "Entregar";
              estiloBotonAccion = "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black shadow-lg";
            }

            return (
              <div 
                key={orden.id} 
                onClick={() => manejarAccionTarjeta(orden)}
                className={`border-2 rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer active:scale-[0.98] ${estilosTarjeta}`}
              >
                <div className={`absolute top-0 inset-x-0 h-1.5 ${franjaColor}`}></div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black bg-black/50 px-2.5 py-1 rounded-lg border border-white/10 text-amber-300">
                      #{orden.numero_orden || orden.id}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {estadoActual === 'en_proceso' && orden.tiempo_inicio && (
                        <CronometroActivo tiempoInicio={orden.tiempo_inicio} />
                      )}

                      {numeroMesa && (
                        <span className="text-[11px] font-black bg-amber-500 text-neutral-950 px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                          <UtensilsCrossed className="w-3 h-3" />
                          Mesa {numeroMesa}
                        </span>
                      )}

                      {esDomicilio ? (
                        <span className="text-[11px] font-black bg-purple-600 text-white px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 uppercase tracking-wider">
                          <Bike className="w-3.5 h-3.5" />
                          Domicilio
                        </span>
                      ) : (
                        <span className="text-[11px] font-black bg-cyan-600 text-white px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 uppercase tracking-wider">
                          <Store className="w-3.5 h-3.5" />
                          Consumir en Local
                        </span>
                      )}
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

                {/* Botón de acción grande y limpio */}
                <div className="mt-4 pt-3 border-t border-white/15">
                  <div className={`w-full py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${estiloBotonAccion}`}>
                    <span>{textoBotonAccion}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}