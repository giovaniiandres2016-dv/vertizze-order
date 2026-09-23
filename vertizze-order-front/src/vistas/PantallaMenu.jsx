// ============================================================================
// ARCHIVO: src/vistas/PantallaMenu.jsx (Conectado directamente a Supabase)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { obtenerMenu } from '../sdk/vertizzeApi';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  ArrowLeft, 
  Search, 
  Plus, 
  ShoppingCart,
  Flame,
  Coffee,
  Sparkles,
  PlusCircle,
  Image as ImageIcon
} from 'lucide-react';

const CATEGORIAS = [
  { id: 'todos', nombre: 'Todo el Menú', icono: Sparkles },
  { id: 'hamburguesas', nombre: 'Hamburguesas', icono: Flame },
  { id: 'perros', nombre: 'Perros Calientes', icono: UtensilsCrossed },
  { id: 'adiciones', nombre: 'Adiciones', icono: PlusCircle },
  { id: 'bebidas', nombre: 'Bebidas', icono: Coffee },
];

function TarjetaImagen({ src, alt }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-600 gap-2">
        <ImageIcon className="w-8 h-8 text-neutral-700" />
        <span className="text-[10px] text-neutral-500 font-medium">Sin imagen</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      onError={() => setError(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}

export default function PantallaMenu({ modoPedido, alVolverInicio, alIrAlCarrito, carrito, alAgregarAlCarrito }) {
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [productosMenu, setProductosMenu] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarMenuDesdeBD() {
      try {
        setCargando(true);
        const datos = await obtenerMenu();
        setProductosMenu(Array.isArray(datos) ? datos : []);
      } catch (error) {
        console.error("Error al cargar el menú desde la base de datos:", error);
        setProductosMenu([]);
      } finally {
        setCargando(false);
      }
    }
    cargarMenuDesdeBD();
  }, []);

  const productosFiltrados = productosMenu.filter(producto => {
    const catProducto = producto.categoria ? producto.categoria.toLowerCase() : '';
    const coincideCategoria = categoriaActiva === 'todos' || catProducto === categoriaActiva;
    const nombreProd = producto.nombre || '';
    const descProd = producto.descripcion || '';
    
    const coincideBusqueda = nombreProd.toLowerCase().includes(busqueda.toLowerCase()) ||
                             descProd.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  const cantidadTotalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const precioTotalAcumulado = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  const formatearPrecio = (valor) => {
    return `$ ${(valor || 0).toLocaleString('es-CO')}`;
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-400 text-sm font-medium">Cargando menú...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between select-none pb-28">
      
      {/* HEADER FIJO */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={alVolverInicio}
            className="flex items-center gap-2 text-neutral-400 hover:text-amber-400 bg-neutral-900 hover:bg-neutral-800 px-4 py-2 rounded-xl border border-neutral-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Volver</span>
          </button>

          <div className="text-center">
            <h1 className="text-xl font-black tracking-wider text-white">
              VERTIZZE<span className="text-amber-500">ORDER</span>
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
                <span>Para Llevar</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="max-w-6xl w-full mx-auto px-6 py-6 flex-1 space-y-6">
        
        {/* Cabecera de sección y buscador */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Nuestro Menú</h2>
            <p className="text-neutral-400 text-sm">
              Mostrando {productosFiltrados.length} productos disponibles
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-500">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              placeholder="Buscar producto o adición..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Categorías con scroll horizontal */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIAS.map((cat) => {
            const IconoCat = cat.icono;
            const estaActiva = categoriaActiva === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  estaActiva 
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-lg shadow-amber-500/20' 
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <IconoCat className={`w-4 h-4 ${estaActiva ? 'text-neutral-950' : 'text-amber-500'}`} />
                <span>{cat.nombre}</span>
              </button>
            );
          })}
        </div>

        {/* Cuadrícula de Productos */}
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/40 rounded-3xl border border-neutral-900">
            <p className="text-neutral-400 text-base">No hay productos registrados en la base de datos o que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productosFiltrados.map((producto) => (
              <div 
                key={producto.id}
                className="group relative bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between hover:border-amber-500/50 transition-all duration-300 shadow-xl overflow-hidden"
              >
                {producto.popular && (
                  <span className="absolute top-4 right-4 z-10 bg-neutral-950/80 backdrop-blur-md border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow-lg">
                    Popular 🔥
                  </span>
                )}

                <div>
                  <div className="w-full h-44 bg-neutral-950 rounded-2xl mb-4 overflow-hidden relative border border-neutral-800">
                    <TarjetaImagen src={producto.imagen} alt={producto.nombre} />
                  </div>

                  <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
                    {producto.nombre}
                  </h3>
                  <p className="text-neutral-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {producto.descripcion}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-800/80">
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Precio</span>
                    <span className="text-lg font-black text-white">{formatearPrecio(producto.precio)}</span>
                  </div>

                  <button
                    onClick={() => alAgregarAlCarrito(producto)}
                    className="flex items-center gap-1.5 bg-neutral-950 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-amber-500/30 hover:border-amber-500 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 cursor-pointer active:scale-95 shadow-md shadow-amber-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* FOOTER FLOTANTE */}
      {cantidadTotalItems > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800 shadow-2xl animate-fade-in">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 text-neutral-950 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/20">
                {cantidadTotalItems}
              </div>
              <div>
                <span className="text-xs text-neutral-400 block font-medium">Total del pedido</span>
                <span className="text-lg font-black text-white">{formatearPrecio(precioTotalAcumulado)}</span>
              </div>
            </div>

            <button
              onClick={alIrAlCarrito}
              className="flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 px-6 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 cursor-pointer active:scale-95 shadow-xl shadow-amber-500/25"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Ver Carrito / Pagar</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}