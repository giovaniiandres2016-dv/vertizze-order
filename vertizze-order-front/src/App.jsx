// ============================================================================
// ARCHIVO: src/App.jsx (Enrutamiento por URL nativo para producción)
// ============================================================================

import React, { useState, useEffect } from 'react';

// Vistas del Administrador y Personal (Privadas)
import Login from './vistas/admin/Login';
import DashboardGeneral from './vistas/admin/DashboardGeneral';
import PantallaAdminOrdenes from './vistas/admin/PantallaAdminOrdenes';
import PantallaCocina from './vistas/admin/PantallaCocina';

// Vistas del Cliente (Públicas)
import PantallaInicio from './vistas/cliente/PantallaInicio';
import PantallaMenu from './vistas/cliente/PantallaMenu';
import PantallaCarrito from './vistas/cliente/PantallaCarrito';
import PantallaCheckout from './vistas/cliente/PantallaCheckout';
import PantallaExito from './vistas/cliente/PantallaExito';

import { crearOrden } from './sdk/vertizzeApi';

export default function App() {
  const [rutaActual, setRutaActual] = useState(window.location.pathname);
  
  // Control de vistas del flujo del cliente
  const [modoPedido, setModoPedido] = useState(null);
  const [pasoCliente, setPasoCliente] = useState('inicio'); // 'inicio', 'menu', 'carrito', 'checkout', 'exito'
  const [carrito, setCarrito] = useState([]);
  const [datosUltimaOrden, setDatosUltimaOrden] = useState(null);

  // Control de autenticación para administración
  const [rolActual, setRolActual] = useState(null); // null o 'admin'

  useEffect(() => {
    // Sintonizar cambios en la URL
    const manejarCambioRuta = () => setRutaActual(window.location.pathname);
    window.addEventListener('popstate', manejarCambioRuta);

    const sesionAdmin = localStorage.getItem('sesion_admin');
    if (sesionAdmin) {
      setRolActual('admin');
    }

    return () => window.removeEventListener('popstate', manejarCambioRuta);
  }, []);

  const cerrarSesionAdmin = () => {
    localStorage.removeItem('sesion_admin');
    setRolActual(null);
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

  const manejarVolverInicioCliente = () => {
    setDatosUltimaOrden(null);
    setCarrito([]);
    setModoPedido(null);
    setPasoCliente('inicio');
  };

  // =========================================================================
  // RUTA 1: /cocina (Pantalla exclusiva para el KDS de cocina)
  // =========================================================================
  if (rutaActual.includes('/cocina')) {
    return (
      <div className="relative min-h-screen bg-neutral-950 text-white">
        <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex justify-between items-center text-xs">
          <span className="text-emerald-400 font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Modo Cocina (KDS) Activo
          </span>
          <span className="text-neutral-400">Pantalla fija de preparación en tiempo real</span>
        </div>
        <PantallaCocina />
      </div>
    );
  }

  // =========================================================================
  // RUTA 2: /admin (Panel de administración general y caja)
  // =========================================================================
  if (rutaActual.includes('/admin')) {
    if (!rolActual) {
      return (
        <Login 
          alIniciarSesion={(rol) => {
            setRolActual('admin');
          }} 
        />
      );
    }

    return (
      <div className="relative min-h-screen bg-neutral-950 text-white">
        <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex justify-between items-center z-50 relative">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-xl">
              Panel Administrador
            </span>
            <span className="text-xs text-neutral-400 hidden md:inline">
              Control total del sistema y analíticas
            </span>
          </div>

          <button 
            onClick={cerrarSesionAdmin} 
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>

        <DashboardGeneral />
      </div>
    );
  }

  // =========================================================================
  // RUTA 3: Raíz / Cliente (Kiosco de Autoservicio Fijo)
  // =========================================================================
  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">
      {pasoCliente === 'inicio' && (
        <PantallaInicio 
          alSeleccionarModo={(modo) => {
            setModoPedido(modo);
            setPasoCliente('menu');
          }}
        />
      )}

      {pasoCliente === 'menu' && (
        <PantallaMenu 
          modoPedido={modoPedido}
          alVolverInicio={manejarVolverInicioCliente}
          alIrAlCarrito={() => setPasoCliente('carrito')}
          carrito={carrito}
          alAgregarAlCarrito={manejarAgregarAlCarrito}
        />
      )}

      {pasoCliente === 'carrito' && (
        <PantallaCarrito 
          carrito={carrito}
          modoPedido={modoPedido}
          alVolverAlMenu={() => setPasoCliente('menu')}
          alActualizarCantidad={manejarActualizarCantidad}
          alActualizarObservacion={manejarActualizarObservacionItem}
          alEliminarItem={manejarEliminarItem}
          alIrAlCheckout={() => setPasoCliente('checkout')}  
        />
      )}

      {pasoCliente === 'checkout' && (
        <PantallaCheckout 
          carrito={carrito}
          modoPedido={modoPedido}
          alVolverAlCarrito={() => setPasoCliente('carrito')}
          alConfirmarPedido={async (datosOrden) => {
            try {
              const ordenParaGuardar = {
                numero_orden: Math.floor(1000 + Math.random() * 9000),
                cliente_nombre: datosOrden.cliente_nombre,
                telefono: datosOrden.telefono,
                ubicacion_detalle: datosOrden.ubicacion_detalle,
                tipo_servicio: datosOrden.tipo_servicio,
                metodo_pago: datosOrden.metodo_pago,
                observaciones: datosOrden.observaciones,
                items: datosOrden.items,
                subtotal: datosOrden.subtotal,
                domicilio: datosOrden.domicilio,
                total: datosOrden.total,
                estado: 'Pendiente'
              };

              const ordenRegistrada = await crearOrden(ordenParaGuardar);
              const ordenFinal = ordenRegistrada && ordenRegistrada[0] ? ordenRegistrada[0] : { ...ordenParaGuardar };
              setDatosUltimaOrden(ordenFinal);
              setCarrito([]);
              setPasoCliente('exito');
            } catch (error) {
              console.error("Error al guardar la orden:", error);
              alert("Hubo un error al registrar tu pedido.");
            }
          }}
        />
      )}

      {pasoCliente === 'exito' && (
        <PantallaExito 
          datosOrden={datosUltimaOrden}
          alVolverInicio={manejarVolverInicioCliente}
        />
      )}
    </div>
  );
}