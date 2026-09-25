// ============================================================================
// ARCHIVO: src/vistas/PantallaCheckout.jsx
// DESCRIPCIÓN: Pantalla final de pago y confirmación de la orden actualizada.
// ============================================================================

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  UtensilsCrossed, 
  ShoppingBag,
  Send,
  User
} from 'lucide-react';

export default function PantallaCheckout({ 
  carrito, 
  modoPedido, 
  alVolverAlCarrito, 
  alConfirmarPedido 
}) {
  // Estados para capturar la información del formulario
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [detalleMesaObarrio, setDetalleMesaObarrio] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');

  // Parametrización del costo de domicilio (Base: $6.000 para llevar, $0 para servir)
  const costoDomicilio = modoPedido === 'para_llevar' ? 6000 : 0;

  // Cálculos de totales
  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const totalFinal = subtotal + costoDomicilio;

  // Función para formatear los precios en pesos colombianos
  const formatearPrecio = (valor) => {
    return `$ ${valor.toLocaleString('es-CO')}`;
  };

  // Manejador al enviar el formulario final
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Empaquetamos todos los datos actualizados de la orden
    const datosOrden = {
      cliente: nombreCliente,
      telefono: telefonoCliente,
      ubicacionDetalle: detalleMesaObarrio || (modoPedido === 'para_servir' ? 'Sin mesa asignada / Barra' : 'Domicilio general'),
      metodoPago,
      observaciones,
      productos: carrito,
      subtotal,
      domicilio: costoDomicilio,
      total: totalFinal,
      modo: modoPedido,
      fecha: new Date().toISOString()
    };

    alConfirmarPedido(datosOrden);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between select-none">
      
      {/* =================================================================*
       * 1. HEADER SUPERIOR                                                *
       * ================================================================= */}
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={alVolverAlCarrito}
            className="flex items-center gap-2 text-neutral-400 hover:text-amber-400 bg-neutral-900 hover:bg-neutral-800 px-4 py-2 rounded-xl border border-neutral-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Volver al Carrito</span>
          </button>

          <div className="text-center">
            <h1 className="text-lg font-black tracking-wider text-white">
              FINALIZAR <span className="text-amber-500">PEDIDO</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-amber-400 text-xs font-semibold">
            {modoPedido === 'para_servir' ? (
              <>
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Para Servir</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Para Llevar / Domi</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =================================================================*
       * 2. FORMULARIO Y RESUMEN                                           *
       * ================================================================= */}
      <main className="max-w-4xl w-full mx-auto px-6 py-8 flex-1">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Datos del cliente y Método de Pago */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sección de Datos de Contacto y Ubicación */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-md">
              <h2 className="text-base font-extrabold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <span>1. Información de Contacto</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                    Tu Nombre *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. Carlos Pérez"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                    Número de Celular / WhatsApp *
                  </label>
                  <input 
                    type="tel" 
                    required
                    placeholder="Ej. 300 123 4567"
                    value={telefonoCliente}
                    onChange={(e) => setTelefonoCliente(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  {modoPedido === 'para_servir' ? 'Número de Mesa (Opcional)' : 'Dirección de Entrega / Barrio *'}
                </label>
                <input 
                  type="text" 
                  required={modoPedido === 'para_llevar'}
                  placeholder={modoPedido === 'para_servir' ? 'Ej. Mesa 04 (O si estás de pie, déjalo vacío)' : 'Ej. Calle 50 # 45-22, Centro'}
                  value={detalleMesaObarrio}
                  onChange={(e) => setDetalleMesaObarrio(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Observaciones adicionales (Opcional)
                </label>
                <input 
                  type="text" 
                  placeholder="Ej. Sin cebolla, salsa aparte..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Sección de Método de Pago */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-md">
              <h2 className="text-base font-extrabold text-white border-b border-neutral-800 pb-3">
                2. Método de Pago
              </h2>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMetodoPago('efectivo')}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${
                    metodoPago === 'efectivo' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-xs font-bold">Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago('transferencia')}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${
                    metodoPago === 'transferencia' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="text-xs font-bold">Nequi / Qr</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago('tarjeta')}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${
                    metodoPago === 'tarjeta' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold">Tarjeta</span>
                </button>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Resumen de Totales y Botón de Confirmación */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-fit space-y-6 shadow-xl">
            <h3 className="text-lg font-bold border-b border-neutral-800 pb-4">
              Resumen Final
            </h3>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {carrito.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-neutral-300">
                  <span className="truncate max-w-[150px]">{item.cantidad}x {item.nombre}</span>
                  <span className="font-semibold text-white">{formatearPrecio(item.precio * item.cantidad)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-800 pt-4 space-y-3 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="text-white font-medium">{formatearPrecio(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>{modoPedido === 'para_llevar' ? 'Costo Domicilio' : 'Servicio en Mesa'}</span>
                <span className="text-white font-medium">{formatearPrecio(costoDomicilio)}</span>
              </div>
              <div className="border-t border-neutral-800 pt-3 flex justify-between text-base font-black">
                <span className="text-white">Total Final</span>
                <span className="text-amber-400 text-xl">{formatearPrecio(totalFinal)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Confirmar Pedido</span>
            </button>
          </div>

        </form>
      </main>

    </div>
  );
}