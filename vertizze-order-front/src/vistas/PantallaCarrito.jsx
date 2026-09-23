// ============================================================================
// ARCHIVO: src/vistas/PantallaCarrito.jsx
<<<<<<< HEAD
// DESCRIPCIÓN: Resumen del carrito con campo de observaciones opcionales por ítem.
=======
// DESCRIPCIÓN: Vista del resumen del carrito de compras. Permite gestionar
//              las cantidades de los productos, eliminar ítems y proceder al pago.
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
// ============================================================================

import React from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  UtensilsCrossed 
} from 'lucide-react';

export default function PantallaCarrito({ 
  carrito, 
  modoPedido, 
  alVolverAlMenu, 
  alActualizarCantidad, 
<<<<<<< HEAD
  alActualizarObservacion,
=======
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
  alEliminarItem, 
  alIrAlCheckout 
}) {

<<<<<<< HEAD
  const formatearPrecio = (valor) => {
    return `$ ${(valor || 0).toLocaleString('es-CO')}`;
  };

=======
  // Función auxiliar para formatear valores monetarios en pesos colombianos
  const formatearPrecio = (valor) => {
    return `$ ${valor.toLocaleString('es-CO')}`;
  };

  // Cálculo del valor acumulado de los productos en el carrito
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between select-none pb-12">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
=======
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between select-none">
      
      {/* ================================================================== */}
      {/* 1. HEADER / ENCABEZADO SUPERIOR                                    */}
      {/* ================================================================== */}
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          {/* Botón para regresar al catálogo del menú */}
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
          <button 
            onClick={alVolverAlMenu}
            className="flex items-center gap-2 text-neutral-400 hover:text-amber-400 bg-neutral-900 hover:bg-neutral-800 px-4 py-2 rounded-xl border border-neutral-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Seguir Comprando</span>
          </button>

          <div className="text-center">
            <h1 className="text-lg font-black tracking-wider text-white">
              TU <span className="text-amber-500">CARRITO</span>
            </h1>
          </div>

<<<<<<< HEAD
=======
          {/* Insignia del modo de servicio */}
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-amber-400 text-xs font-semibold">
            {modoPedido === 'para_servir' ? (
              <>
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Para Servir</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Para Llevar</span>
              </>
            )}
          </div>

        </div>
      </header>

<<<<<<< HEAD
      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-4xl w-full mx-auto px-6 py-8 flex-1">
        
        {carrito.length === 0 ? (
=======
      {/* ================================================================== */}
      {/* 2. CONTENIDO PRINCIPAL: LISTA DE PRODUCTOS O CARRITO VACÍO         */}
      {/* ================================================================== */}
      <main className="max-w-4xl w-full mx-auto px-6 py-8 flex-1">
        
        {carrito.length === 0 ? (
          // Estado Vacío: Se muestra si el usuario no tiene productos agregados
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
          <div className="text-center py-24 bg-neutral-900/30 rounded-3xl border border-neutral-900 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 text-neutral-500">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Tu carrito está vacío</h3>
<<<<<<< HEAD
              <p className="text-neutral-400 text-sm mt-1">Aún no has agregado ningún producto.</p>
=======
              <p className="text-neutral-400 text-sm mt-1">Aún no has agregado ningún producto o adición.</p>
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
            </div>
            <button
              onClick={alVolverAlMenu}
              className="mt-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 px-6 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Ver el Menú
            </button>
          </div>
        ) : (
<<<<<<< HEAD
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Listado de Ítems */}
=======
          // Estado con Productos: Listado interactivo y resumen financiero
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna Izquierda: Listado de Ítems (Ocupa 2 columnas en pantallas grandes) */}
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-extrabold tracking-tight mb-4">
                Productos seleccionados ({totalItems})
              </h2>

              {carrito.map((item) => (
                <div 
                  key={item.id}
<<<<<<< HEAD
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="w-14 h-14 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 shrink-0">
                      {item.imagen ? (
                        <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{item.nombre}</h4>
                      <span className="text-xs text-neutral-400 block mt-0.5">{formatearPrecio(item.precio)} c/u</span>
                    </div>

                    <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl p-1">
                      <button 
                        onClick={() => alActualizarCantidad(item.id, item.cantidad - 1)}
                        className="w-7 h-7 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-white">{item.cantidad}</span>
                      <button 
                        onClick={() => alActualizarCantidad(item.id, item.cantidad + 1)}
                        className="w-7 h-7 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-amber-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-white block">
                        {formatearPrecio(item.precio * item.cantidad)}
                      </span>
                      <button 
                        onClick={() => alEliminarItem(item.id)}
                        className="text-neutral-500 hover:text-red-400 transition-colors mt-1 inline-block cursor-pointer"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Input de observaciones opcionales (Ej: sin cebolla) */}
                  <div className="pt-2 border-t border-neutral-800/60">
                    <input 
                      type="text"
                      placeholder="¿Alguna observación? (Ej: sin cebolla, salsa de preferencia...)"
                      value={item.observacion || ''}
                      onChange={(e) => alActualizarObservacion(item.id, e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
=======
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md"
                >
                  {/* Foto miniatura o icono del producto */}
                  <div className="w-16 h-16 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 shrink-0">
                    {item.imagen ? (
                      <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Información principal del producto */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{item.nombre}</h4>
                    <span className="text-xs text-neutral-400 block mt-0.5">{formatearPrecio(item.precio)} c/u</span>
                  </div>

                  {/* Controles de cantidad (+ / -) */}
                  <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl p-1">
                    <button 
                      onClick={() => alActualizarCantidad(item.id, item.cantidad - 1)}
                      className="w-7 h-7 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-white">{item.cantidad}</span>
                    <button 
                      onClick={() => alActualizarCantidad(item.id, item.cantidad + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-amber-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal del ítem y botón de eliminar */}
                  <div className="text-right">
                    <span className="font-black text-sm text-white block">
                      {formatearPrecio(item.precio * item.cantidad)}
                    </span>
                    <button 
                      onClick={() => alEliminarItem(item.id)}
                      className="text-neutral-500 hover:text-red-400 transition-colors mt-1 inline-block cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
                  </div>

                </div>
              ))}
            </div>

<<<<<<< HEAD
            {/* Resumen de Totales */}
=======
            {/* Columna Derecha: Resumen de Totales y Checkout */}
>>>>>>> 3557b80e71b4bf0cdebca5e7b7ae1c41e8aa9b6d
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-fit space-y-6 shadow-xl">
              <h3 className="text-lg font-bold border-b border-neutral-800 pb-4">
                Resumen de la Orden
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">{formatearPrecio(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Servicio / Impuestos</span>
                  <span className="text-white font-medium">$ 0</span>
                </div>
                <div className="border-t border-neutral-800 pt-3 flex justify-between text-base font-black">
                  <span className="text-white">Total a Pagar</span>
                  <span className="text-amber-400 text-xl">{formatearPrecio(subtotal)}</span>
                </div>
              </div>

              <button
                onClick={alIrAlCheckout}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
              >
                <span>Proceder al Pago</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}