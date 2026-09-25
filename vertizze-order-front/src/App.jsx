// ============================================================================
// ARCHIVO: src/App.jsx (Actualizado con acceso a Pantalla de Cocina)
// ============================================================================

import React, { useState } from 'react';
import PantallaInicio from './vistas/PantallaInicio';
import PantallaMenu from './vistas/PantallaMenu';
import PantallaCarrito from './vistas/PantallaCarrito';
import PantallaCheckout from './vistas/PantallaCheckout';
import PantallaExito from './vistas/PantallaExito';
import PantallaCocina from './vistas/PantallaCocina'; // <-- Importamos la pantalla de cocina
import { crearOrden } from './sdk/vertizzeApi';

export default function App() {
  const [pantallaActual, setPantallaActual] = useState('inicio');
  const [modoPedido, setModoPedido] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [datosUltimaOrden, setDatosUltimaOrden] = useState(null);

  const manejarSeleccionModo = (modo) => {
    setModoPedido(modo);
    setPantallaActual('menu');
  };

  const manejarAgregarAlCarrito = (producto) => {
    setCarrito(carritoActual => {
      const indexExistente = carritoActual.findIndex(item => item.id === producto.id);
      if (indexExistente >= 0) {
        const nuevoCarrito = [...carritoActual];
        nuevoCarrito[indexExistente].cantidad += 1;
        return nuevoCarrito;
      } else {
        return [...carritoActual, { ...producto, cantidad: 1, observacion: '' }];
      }
    });
  };

  const manejarActualizarCantidad = (idProducto, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      manejarEliminarItem(idProducto);
      return;
    }
    setCarrito(carritoActual => 
      carritoActual.map(item => 
        item.id === idProducto ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  const manejarActualizarObservacionItem = (idProducto, nuevaObservacion) => {
    setCarrito(carritoActual => 
      carritoActual.map(item => 
        item.id === idProducto ? { ...item, observacion: nuevaObservacion } : item
      )
    );
  };

  const manejarEliminarItem = (idProducto) => {
    setCarrito(carritoActual => carritoActual.filter(item => item.id !== idProducto));
  };

  const manejarVolverInicio = () => {
    setDatosUltimaOrden(null);
    setCarrito([]);
    setModoPedido(null);
    setPantallaActual('inicio');
  };

  return (
    <div className="relative min-h-screen bg-neutral-950">
      
      {/* Botón flotante temporal para alternar entre Cliente y Cocina (KDS) */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setPantallaActual(pantallaActual === 'cocina' ? 'inicio' : 'cocina')}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 border border-amber-400"
        >
          <span>{pantallaActual === 'cocina' ? '🍔 Ir al Sistema de Clientes' : '🍳 Abrir Módulo de Cocina (KDS)'}</span>
        </button>
      </div>

      {/* Pantalla especial: Cocina / KDS */}
      {pantallaActual === 'cocina' && (
        <PantallaCocina />
      )}

      {/* Pantalla 1: Inicio */}
      {pantallaActual === 'inicio' && (
        <PantallaInicio alSeleccionarModo={manejarSeleccionModo} />
      )}

      {/* Pantalla 2: Menú */}
      {pantallaActual === 'menu' && (
        <PantallaMenu 
          modoPedido={modoPedido}
          alVolverInicio={manejarVolverInicio}
          alIrAlCarrito={() => setPantallaActual('carrito')}
          carrito={carrito}
          alAgregarAlCarrito={manejarAgregarAlCarrito}
        />
      )}

      {/* Pantalla 3: Carrito */}
      {pantallaActual === 'carrito' && (
        <PantallaCarrito 
          carrito={carrito}
          modoPedido={modoPedido}
          alVolverAlMenu={() => setPantallaActual('menu')}
          alActualizarCantidad={manejarActualizarCantidad}
          alActualizarObservacion={manejarActualizarObservacionItem}
          alEliminarItem={manejarEliminarItem}
          alIrAlCheckout={() => setPantallaActual('checkout')}  
        />
      )}

      {/* Pantalla 4: Checkout */}
      {pantallaActual === 'checkout' && (
        <PantallaCheckout 
          carrito={carrito}
          modoPedido={modoPedido}
          alVolverAlCarrito={() => setPantallaActual('carrito')}
          alConfirmarPedido={async (datosOrden) => {
            try {
              const ordenParaGuardar = {
                numero_orden: Math.floor(1000 + Math.random() * 9000),
                cliente_nombre: datosOrden.cliente,
                telefono: datosOrden.telefono,
                ubicacion_detalle: datosOrden.ubicacionDetalle,
                tipo_servicio: datosOrden.modo || modoPedido,
                metodo_pago: datosOrden.metodo_pago || datosOrden.metodopago || datosOrden.metodoPago || 'Efectivo',
                observaciones: datosOrden.observaciones,
                items: datosOrden.productos,
                subtotal: datosOrden.total,
                total: datosOrden.total,
                estado: 'pendiente',
                creado_en: new Date().toISOString()
              };

              const ordenRegistrada = await crearOrden(ordenParaGuardar);
              console.log("Orden guardada en Supabase con éxito:", ordenRegistrada);

              const ordenFinal = ordenRegistrada && ordenRegistrada[0] ? ordenRegistrada[0] : { ...ordenParaGuardar, productos: datosOrden.productos };
              setDatosUltimaOrden(ordenFinal);
              setCarrito([]);
              setPantallaActual('exito');
            } catch (error) {
              console.error("Error al guardar la orden en Supabase:", error);
              alert("Hubo un error al registrar tu pedido en la base de datos.");
            }
          }}
        />
      )}

      {/* Pantalla 5: Éxito y Cola de Espera */}
      {pantallaActual === 'exito' && (
        <PantallaExito 
          datosOrden={datosUltimaOrden}
          alVolverInicio={manejarVolverInicio}
        />
      )}
    </div>
  );
}