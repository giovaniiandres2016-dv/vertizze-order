// ============================================================================
// ARCHIVO: src/sdk/vertizzeApi.js (Actualizado con Realtime)
// ============================================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uxcxwcjbpkpiafsrvdhu.supabase.co' 
const SUPABASE_ANON_KEY = 'sb_publishable_qBVV54zzm1fX2wMg2kAYvA_e2iJrzog'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function obtenerMenu() {
  const { data: productos, error: errorProd } = await supabase
    .from('productos')
    .select('*')
    .eq('disponible', true);
    
  if (errorProd) {
    console.error("Error al obtener productos:", errorProd.message);
    throw errorProd;
  }

  const { data: categorias, error: errorCat } = await supabase
    .from('categorias')
    .select('*');

  if (errorCat) {
    console.error("Error al obtener categorías:", errorCat.message);
  }

  return (productos || []).map(item => {
    let nombreCategoria = 'otros';
    
    if (categorias && categorias.length > 0) {
      const catEncontrada = categorias.find(c => c.id === item.categoria_id);
      if (catEncontrada && catEncontrada.nombre) {
        nombreCategoria = catEncontrada.nombre.toLowerCase().trim();
        if (nombreCategoria.includes('hamburguesa')) nombreCategoria = 'hamburguesas';
        else if (nombreCategoria.includes('perro')) nombreCategoria = 'perros';
        else if (nombreCategoria.includes('adición') || nombreCategoria.includes('adicion')) nombreCategoria = 'adiciones';
        else if (nombreCategoria.includes('bebida')) nombreCategoria = 'bebidas';
      }
    } else {
      if (item.categoria_id === 1) nombreCategoria = 'hamburguesas';
      else if (item.categoria_id === 2) nombreCategoria = 'bebidas';
      else if (item.categoria_id === 3) nombreCategoria = 'adiciones';
    }

    return {
      ...item,
      categoria: nombreCategoria,
      popular: item.popular || false
    };
  });
}

export async function crearOrden(orden) {
  const { data, error } = await supabase
    .from('ordenes')
    .insert([orden])
    .select();

  if (error) {
    console.error("Error al crear la orden en Supabase:", error.message);
    throw error;
  }
  return data;
}

// NUEVA FUNCIÓN: Escuchar nuevas órdenes en tiempo real
export function suscribirseAOrdenes(onNuevaOrden) {
  return supabase
    .channel('cambios-ordenes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ordenes',
      },
      (payload) => {
        console.log('¡Nueva orden recibida en tiempo real!', payload.new);
        onNuevaOrden(payload.new);
      }
    )
    .subscribe();
}