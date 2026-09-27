// ============================================================================
// ARCHIVO: src/vistas/PantallaExito.jsx
// DESCRIPCIÓN: Pantalla de éxito con parseo ultra-seguro para formato texto o JSON.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Hash, Package, ArrowRight, Store } from 'lucide-react';

export default function PantallaExito({ datosOrden, alVolverInicio }) {
  const numeroOrden = datosOrden?.numero_orden || datosOrden?.numeroOrden || '101';
  
  const [segundosRestantes, setSegundosRestantes] = useState(15);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          alVolverInicio();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [alVolverInicio]);

  // Función totalmente segura para extraer el texto de los items sin romper el render
  const obtenerTextoItems = () => {
    const rawItems = datosOrden?.productos || datosOrden?.items;

    if (!rawItems) return 'Sin productos especificados';

    // Si ya viene como texto plano (separado por comas)
    if (typeof rawItems === 'string') {
      try {
        // Intentar parsear por si es un JSON stringificado (registros antiguos de la BD)
        const parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed)) {
          return parsed.map(i => `${i.cantidad || 1}x ${i.nombre || 'Producto'}`).join(', ');
        }
      } catch (e) {
        // Si falla el parse, significa que es texto plano puro (ej: "1x Burger, 2x Papas")
        return rawItems;
      }
      return rawItems;
    }

    // Si viene como arreglo de objetos (carrito activo)
    if (Array.isArray(rawItems)) {
      return rawItems.map(i => `${i.cantidad || 1}x ${i.nombre || 'Producto'}`).join(', ');
    }

    return 'Detalles de items no disponibles';
  };

  const textoItemsFormateado = obtenerTextoItems();

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 select-none">
      
      <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl relative overflow-hidden my-auto">
        
        <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>PEDIDO REGISTRADO</span>
          </div>

          <div className="flex items-center gap-1.5 text-neutral-400 text-xs bg-neutral-950 px-3 py-1.5 rounded-full border border-neutral-800">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Reinicia en {segundosRestantes}s</span>
          </div>
        </div>

        <div className="space-y-1 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white">
            ¡Gracias, {datosOrden?.cliente || datosOrden?.cliente_nombre || 'Cliente'}!
          </h2>
          <p className="text-neutral-400 text-xs leading-relaxed px-2">
            Tu orden ha sido guardada con éxito en el sistema.
            <span className="text-amber-400 font-semibold block mt-1">
              "Lo bueno se hace esperar, y trataremos de hacerlo lo más rápido posible." 🍔🔥
            </span>
          </p>
        </div>

        <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-inner">
          <div className="w-10 h-10 bg-amber-500 text-neutral-950 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Instrucción importante</h4>
            <p className="text-xs text-neutral-200 mt-0.5 leading-snug">
              Acércate a <strong className="text-white underline">Caja</strong> dictando tu número de turno para validar y efectuar el pago.
            </p>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-amber-400 border border-neutral-800">
              <Hash className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">Número de Orden</span>
              <span className="text-xl font-black text-white">#{numeroOrden}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">Tiempo Estimado</span>
            <span className="text-sm font-bold text-amber-400">~15 min</span>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 border-b border-neutral-800 pb-2">
            <Package className="w-4 h-4 text-amber-500" />
            <span>Resumen del Ticket</span>
          </div>

          {/* Renderizado limpio del texto separado por comas */}
          <div className="py-1">
            <p className="text-xs text-amber-300 font-medium leading-relaxed">
              {textoItemsFormateado}
            </p>
          </div>

          <div className="border-t border-neutral-800 pt-2 space-y-1 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Tipo de servicio:</span>
              <span className="text-white font-semibold capitalize">
                {datosOrden?.modo || datosOrden?.tipo_servicio || 'No especificado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Método de pago:</span>
              <span className="text-white font-semibold capitalize">
                {datosOrden?.metodopago || datosOrden?.metodo_pago || 'Efectivo'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-800/60 text-sm font-black">
              <span className="text-white">Total a Pagar:</span>
              <span className="text-amber-400">$ {(datosOrden?.total || 0).toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        <button
          onClick={alVolverInicio}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl shadow-amber-500/20 cursor-pointer active:scale-95"
        >
          <span>Hacer Nuevo Pedido Ahora</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>

    </div>
  );
}