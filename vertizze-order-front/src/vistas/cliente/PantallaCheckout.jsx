// ============================================================================
// ARCHIVO: src/vistas/cliente/PantallaCheckout.jsx (Wompi Sandbox con Integridad y Registro Seguro)
// ============================================================================

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Banknote, 
  Smartphone, 
  UtensilsCrossed, 
  ShoppingBag,
  Bike,
  Send,
  User
} from 'lucide-react';
import { supabase } from '../../sdk/vertizzeApi';

export default function PantallaCheckout({ 
  carrito, 
  modoPedido, 
  alVolverAlCarrito, 
  alConfirmarPedido 
}) {
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [detalleMesaObarrio, setDetalleMesaObarrio] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [procesando, setProcesando] = useState(false);

  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const totalFinal = subtotal; // Sin cobros ocultos de plataforma

  const formatearPrecio = (valor) => {
    return `$ ${(valor || 0).toLocaleString('es-CO')}`;
  };

  const generarFirmaWompi = async (referencia, montoEnCentavos, moneda, secretoIntegridad) => {
    const cadena = `${referencia}${montoEnCentavos}${moneda}${secretoIntegridad}`;
    const msgBuffer = new TextEncoder().encode(cadena);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (procesando) return;
    setProcesando(true);

    let tipoServicioTexto = 'Para Servir';
    if (modoPedido === 'para_recoger') tipoServicioTexto = 'Para Llevar';
    if (modoPedido === 'domicilio') tipoServicioTexto = 'Domicilio';

    const referenciaWompi = `VERTIZZE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const montoEnCentavos = totalFinal * 100;

    const datosBaseOrden = {
      numero_orden: Math.floor(1000 + Math.random() * 9000),
      cliente_nombre: nombreCliente,
      telefono: telefonoCliente,
      ubicacion_detalle: detalleMesaObarrio || (modoPedido === 'para_servir' ? 'Barra / Sin mesa' : 'Retira en local'),
      tipo_servicio: tipoServicioTexto,
      observaciones,
      items: JSON.stringify(carrito),
      subtotal,
      domicilio: 0,
      total: totalFinal,
      wompi_referencia: referenciaWompi
    };

    try {
      // 1. FLUJO EFECTIVO
      if (metodoPago === 'efectivo') {
        const { data, error } = await supabase
          .from('ordenes')
          .insert([{
            ...datosBaseOrden,
            metodo_pago: 'Efectivo',
            estado: 'Pendiente',
            estado_pago: 'Por Pagar'
          }])
          .select()
          .single();

        if (error) throw error;
        
        setProcesando(false);
        alConfirmarPedido(data);
        return;
      }

      // 2. FLUJO TRANSFERENCIA / WOMPI (NO SE REGISTRA NADA HASTA ESTAR APROBADO)
      const wompiPublicKey = 'pub_test_dxZQt59vcjdHHg4zxL2sOJEGkJGweWzM';
      const wompiSecretIntegridad = 'test_integrity_QlDmzHue1d6V7C91aLNroXcrf4mNXEvG';

      if (!window.WidgetCheckout) {
        alert('La pasarela de Wompi no está disponible. Revisa el script en index.html.');
        setProcesando(false);
        return;
      }

      const signatureHash = await generarFirmaWompi(
        referenciaWompi, 
        montoEnCentavos, 
        'COP', 
        wompiSecretIntegridad
      );

      const checkout = new window.WidgetCheckout({
        currency: 'COP',
        amountInCents: montoEnCentavos,
        reference: referenciaWompi,
        publicKey: wompiPublicKey,
        signature: {
          integrity: signatureHash
        }
      });

      checkout.open(async (result) => {
        const transaction = result?.transaction;
        
        if (transaction && transaction.status === 'APPROVED') {
          // SOLO AQUÍ SE REGISTRA EN SUPABASE Y VA A COCINA
          const { data, error } = await supabase
            .from('ordenes')
            .insert([{
              ...datosBaseOrden,
              metodo_pago: 'Transferencia Wompi',
              estado: 'Pendiente',
              estado_pago: 'Pagado',
              wompi_id_transaccion: String(transaction.id)
            }])
            .select()
            .single();

          if (error) throw error;

          setProcesando(false);
          alConfirmarPedido(data);
        } else {
          alert('El pago fue cancelado, cerrado o rechazado.');
          setProcesando(false);
        }
      });

    } catch (err) {
      console.error("Error al procesar la orden o pago:", err);
      alert("Hubo un error al procesar la solicitud.");
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between select-none">
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-900 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            type="button"
            onClick={alVolverAlCarrito}
            disabled={procesando}
            className="flex items-center gap-2 text-neutral-400 hover:text-amber-400 bg-neutral-900 hover:bg-neutral-800 px-3 sm:px-4 py-2 rounded-xl border border-neutral-800 transition-all cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Volver al Carrito</span>
          </button>

          <div className="text-center">
            <h1 className="text-base sm:text-lg font-black tracking-wider text-white">
              FINALIZAR <span className="text-amber-500">PEDIDO</span>
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-400 text-xs font-semibold">
            {modoPedido === 'para_servir' && <><UtensilsCrossed className="w-3.5 h-3.5" /><span>Para Servir</span></>}
            {modoPedido === 'para_recoger' && <><ShoppingBag className="w-3.5 h-3.5" /><span>Para Llevar</span></>}
            {modoPedido === 'domicilio' && <><Bike className="w-3.5 h-3.5" /><span>Domicilio</span></>}
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-md">
              <h2 className="text-base font-extrabold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <span>1. Información de Contacto</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">Tu Nombre *</label>
                  <input 
                    type="text" required placeholder="Ej. Carlos Pérez"
                    value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)}
                    disabled={procesando}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">Celular / WhatsApp *</label>
                  <input 
                    type="tel" required placeholder="Ej. 300 123 4567"
                    value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)}
                    disabled={procesando}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  {modoPedido === 'domicilio' ? 'Dirección de Entrega / Barrio *' : 'Número de Mesa o Notas'}
                </label>
                <input 
                  type="text" required={modoPedido === 'domicilio'}
                  placeholder={modoPedido === 'domicilio' ? 'Ej. Calle 50 # 45-22...' : 'Ej. Mesa 4'}
                  value={detalleMesaObarrio} onChange={(e) => setDetalleMesaObarrio(e.target.value)}
                  disabled={procesando}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">Observaciones adicionales (Opcional)</label>
                <input 
                  type="text" placeholder="Ej. Sin cebolla..."
                  value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                  disabled={procesando}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-md">
              <h2 className="text-base font-extrabold text-white border-b border-neutral-800 pb-3">
                2. Método de Pago (Wompi Integrado)
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => setMetodoPago('efectivo')}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all cursor-pointer disabled:opacity-50 ${
                    metodoPago === 'efectivo' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Banknote className="w-7 h-7" />
                  <span className="text-xs font-bold">Efectivo en Local</span>
                </button>

                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => setMetodoPago('transferencia')}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all cursor-pointer disabled:opacity-50 ${
                    metodoPago === 'transferencia' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Smartphone className="w-7 h-7" />
                  <span className="text-xs font-bold">Transferencia / QR (Wompi)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-fit space-y-6 shadow-xl">
            <h3 className="text-lg font-bold border-b border-neutral-800 pb-4">Resumen Final</h3>

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
                <span>Servicio / Entrega</span>
                <span className="text-white font-medium">A cargo del domiciliario</span>
              </div>
              <div className="border-t border-neutral-800 pt-3 flex justify-between text-base font-black">
                <span className="text-white">Total Final</span>
                <span className="text-amber-400 text-xl">{formatearPrecio(totalFinal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={procesando}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{procesando ? 'Procesando pedido...' : 'Confirmar Pedido'}</span>
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}