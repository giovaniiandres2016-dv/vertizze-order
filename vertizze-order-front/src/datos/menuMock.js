// ==========================================
// ARCHIVO: menuMock.js
// DESCRIPCIÓN: Datos simulados de categorías y productos 
// para maquetar el frontend de VertizzeOrder.
// ==========================================

export const categoriasMenu = [
  { id: 1, nombre: "🔥 Combos", icono: "🍔" },
  { id: 2, nombre: "🍟 Hamburguesas", icono: "🥩" },
  { id: 3, nombre: "🥤 Bebidas", icono: "🥤" },
  { id: 4, nombre: "🍦 Postres", icono: "🍨" },
];

export const productosMenu = [
  {
    id: 1,
    categoriaId: 1,
    nombre: "Combo Mega Pollo Crispy",
    descripcion: "Hamburguesa doble de pollo crujiente, papas medianas y bebida de 400ml.",
    precio: 24900,
    imagen: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: 2,
    categoriaId: 2,
    nombre: "Hamburguesa Doble Extreme",
    descripcion: "Dos carnes a la parrilla, queso cheddar fundido, tocino crujiente y salsa de la casa.",
    precio: 21500,
    imagen: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: 3,
    categoriaId: 3,
    nombre: "Gaseosa Helada 400ml",
    descripcion: "Elige entre Coca-Cola, Sprite o Manzana.",
    precio: 5000,
    imagen: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60",
  },
];