// ============================================================================
// ARCHIVO: src/vistas/PantallaExito.jsx
<<<<<<< HEAD
// DESCRIPCIÓN: Pantalla de éxito con productos detallados, número de orden real y temporizador.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Hash, Package, ArrowRight, Store } from 'lucide-react';

export default function PantallaExito({ datosOrden, alVolverInicio }) {
  // Tomamos el número de orden real que viene de Supabase / App.jsx, o un respaldo por seguridad
  const numeroOrden = datosOrden?.numero_orden || datosOrden?.numeroOrden || '101';
=======
// DESCRIPCIÓN: Pantalla de éxito con productos detallados, número secuencial y temporizador.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Hash, UtensilsCrossed, ShoppingBag, ArrowRight, Package } from 'lucide-react';

// Variable global simple para simular el incremento del número de orden en la sesión
let contadorGlobalOrden = 101;

export default function PantallaExito({ datosOrden, alVolverInicio }) {
  // Asignamos el número de orden secuencial y lo guardamos para que no cambie al re-renderizar
  const [numeroOrden] = useState(() => contadorGlobalOrden++);
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
  
  // Estado para la cuenta regresiva de 15 segundos
  const [segundosRestantes, setSegundosRestantes] = useState(15);

  useEffect(() => {
    // Temporizador de cuenta regresiva cada segundo
    const intervalo = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          alVolverInicio(); // Volver al inicio automáticamente al llegar a 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Limpiamos el intervalo si el usuario desmonta o hace clic manual
    return () => clearInterval(intervalo);
  }, [alVolverInicio]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 select-none">
      
      <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl relative overflow-hidden my-auto">
        
        {/* Detalle visual superior de acento */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500"></div>

        {/* Header con icono y cuenta regresiva */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
            <CheckCircle2 className="w-4 h-4" />
<<<<<<< HEAD
            <span>PEDIDO REGISTRADO</span>
=======
            <span>PEDIDO RECIBIDO CON ÉXITO</span>
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
          </div>

          <div className="flex items-center gap-1.5 text-neutral-400 text-xs bg-neutral-950 px-3 py-1.5 rounded-full border border-neutral-800">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Reinicia en {segundosRestantes}s</span>
          </div>
        </div>

        {/* Saludo y mensaje motivacional */}
        <div className="space-y-1 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white">
<<<<<<< HEAD
            ¡Gracias, {datosOrden?.cliente || datosOrden?.cliente_nombre || 'Cliente'}!
          </h2>
          <p className="text-neutral-400 text-xs leading-relaxed px-2">
            Tu orden ha sido guardada con éxito en el sistema.
=======
            ¡Gracias, {datosOrden?.cliente || 'Cliente'}!
          </h2>
          <p className="text-neutral-400 text-xs leading-relaxed px-2">
            Tu orden ya está en nuestra cola de preparación. 
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
            <span className="text-amber-400 font-semibold block mt-1">
              "Lo bueno se hace esperar, y trataremos de hacerlo lo más rápido posible." 🍔🔥
            </span>
          </p>
        </div>

<<<<<<< HEAD
        {/* Instrucción obligatoria hacia caja (RF-07) */}
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

        {/* Tarjeta con el Número de Orden Real */}
=======
        {/* Tarjeta con el Número de Orden Secuencial */}
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-amber-400 border border-neutral-800">
              <Hash className="w-5 h-5" />
            </div>
            <div className="text-left">
<<<<<<< HEAD
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">Número de Orden</span>
=======
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">Turno en Cola</span>
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
              <span className="text-xl font-black text-white">#{numeroOrden}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">Tiempo Estimado</span>
            <span className="text-sm font-bold text-amber-400">~15 min</span>
          </div>
        </div>

        {/* Resumen detallado de lo que pidió */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 border-b border-neutral-800 pb-2">
            <Package className="w-4 h-4 text-amber-500" />
<<<<<<< HEAD
            <span>Resumen del Ticket</span>
=======
            <span>Resumen de tu Pedido</span>
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
          </div>

          {/* Listado de productos */}
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
<<<<<<< HEAD
            {(datosOrden?.productos || datosOrden?.items)?.map((item, index) => (
              <div key={index} className="flex justify-between text-xs text-neutral-300 border-b border-neutral-900 pb-1">
                <span className="truncate max-w-[220px]">
                  <strong className="text-amber-400">{item.cantidad}x</strong> {item.nombre}
                  {item.observacion && (
                    <span className="block text-[10px] text-neutral-400 italic">Nota: {item.observacion}</span>
                  )}
=======
            {datosOrden?.productos?.map((item, index) => (
              <div key={index} className="flex justify-between text-xs text-neutral-300">
                <span className="truncate max-w-[220px]">
                  <strong className="text-amber-400">{item.cantidad}x</strong> {item.nombre}
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
                </span>
                <span className="font-medium text-white">
                  $ {(item.precio * item.cantidad).toLocaleString('es-CO')}
                </span>
              </div>
            ))}
          </div>

          {/* Datos generales de entrega */}
          <div className="border-t border-neutral-800 pt-2 space-y-1 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Tipo de servicio:</span>
<<<<<<< HEAD
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
=======
              <span className="text-white font-semibold">
                {datosOrden?.modo === 'para_servir' ? 'Para Servir (En Local)' : 'Para Llevar / Domicilio'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ubicación / Detalles:</span>
              <span className="text-white font-semibold truncate max-w-[180px]">
                {datosOrden?.ubicacionDetalle || 'No especificada'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-800/60 text-sm font-black">
              <span className="text-white">Total Pagado:</span>
              <span className="text-amber-400">$ {datosOrden?.total?.toLocaleString('es-CO')}</span>
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
            </div>
          </div>
        </div>

        {/* Botón manual para volver al inicio antes de que pasen los 15s */}
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