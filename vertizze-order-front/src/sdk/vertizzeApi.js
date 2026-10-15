// ============================================================================
// ARCHIVO: src/sdk/vertizzeApi.js
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

  if (errorCat) console.error("Error al obtener categorías:", errorCat.message);

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
    }
    return { ...item, categoria: nombreCategoria, popular: item.popular || false };
  });
}

// Crear Orden: solo registra el pedido para cocina[cite: 22]
export async function crearOrden(orden) {
  const ordenFinal = {
    ...orden,
    domiciliario_id: orden.domiciliario_id || null,
    estado_domicilio: 'pendiente'
  };

  const { data, error } = await supabase
    .from('ordenes')
    .insert([ordenFinal])
    .select();

  if (error) {
    console.error("Error al crear la orden en Supabase:", error.message);
    throw error;
  }
  return data;
}

// DISPARADOR POST-COCINA: Asigna el repartidor cuando el pedido está LISTO/ENTREGADO en KDS Cocina[cite: 22]
export async function asignarDomiciliarioAlCompletarCocina(ordenId, tipoServicio) {
  // Validación estricta: solo se ejecuta si el texto contiene "domicilio"
  const esDomicilio = String(tipoServicio || '').toLowerCase().includes('domicilio');
  
  if (!esDomicilio) return null;

  try {
    // Buscar el primer domiciliario disponible[cite: 22]
    const { data: domisDisponibles } = await supabase
      .from('domiciliarios')
      .select('id')
      .eq('estado', 'disponible')
      .limit(1);

    if (domisDisponibles && domisDisponibles.length > 0) {
      const domiId = domisDisponibles[0].id;

      const { data, error } = await supabase
        .from('ordenes')
        .update({
          domiciliario_id: domiId,
          estado_domicilio: 'asignado'
        })
        .eq('id', ordenId)
        .select();

      if (error) throw error;
      return data;
    }
  } catch (err) {
    console.warn("No se pudo asignar el domiciliario al completar cocina:", err.message);
  }
  return null;
}

export function suscribirseAOrdenes(onNuevaOrden) {
  return supabase
    .channel('cambios-ordenes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'ordenes' },
      (payload) => { onNuevaOrden(payload.new); }
    )
    .subscribe();
}