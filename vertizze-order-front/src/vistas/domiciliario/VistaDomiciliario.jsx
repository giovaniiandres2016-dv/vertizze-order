// ============================================================================
// ARCHIVO: src/vistas/domiciliario/VistaDomiciliario.jsx
// DESCRIPCIÓN: Panel KDS Domiciliarios con mapa usando `ubicacion_detalle`, 
//              audio/vibración desbloqueado y sincronización en tiempo real sin recarga.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, Key, LogOut, CheckCircle, Clock, MapPin, 
  Phone, AlertCircle, RefreshCw, Navigation, History, Bell
} from 'lucide-react';
import { supabase } from '../../sdk/vertizzeApi';

export default function VistaDomiciliario() {
  // Estados de Autenticación
  const [pinIngresado, setPinIngresado] = useState('');
  const [domiciliario, setDomiciliario] = useState(null);
  const [errorLogin, setErrorLogin] = useState('');
  const [cargandoLogin, setCargandoLogin] = useState(false);

  // Estados de Pedidos y Pestañas
  const [ordenesAsignadas, setOrdenesAsignadas] = useState([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [pestaña, setPestaña] = useState('activos');
  const [sonidoHabilitado, setSonidoHabilitado] = useState(false);

  // Ref para contar las órdenes anteriores y detectar las entrantes
  const conteoOrdenesPrevio = useRef(0);

  // Alerta sonora y vibración
  const alertarNuevoDomicilio = () => {
    // 1. Vibración en dispositivos móviles (200ms, 100ms pausa, 400ms)
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch (e) {
        console.log("Vibración bloqueada:", e);
      }
    }

    // 2. Tono de Audio Sintético
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio bloqueado o no soportado:', e);
    }
  };

  // Función para desbloquear el audio con interacción del usuario
  const habilitarSonidoInicial = () => {
    alertarNuevoDomicilio();
    setSonidoHabilitado(true);
  };

  const capitalizarTexto = (texto) => {
    if (!texto) return '';
    const str = String(texto).trim();
    if (str === '') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const limpiarTelefono = (tel) => {
    if (!tel) return '';
    let limpio = String(tel).trim().replace(/\D/g, '');
    if (limpio.startsWith('57') && limpio.length > 10) {
      limpio = limpio.substring(2);
    }
    return limpio;
  };

  const formatearItems = (itemsRaw) => {
    if (!itemsRaw) return 'Sin detalle';
    let items = itemsRaw;
    if (typeof itemsRaw === 'string') {
      try { items = JSON.parse(itemsRaw); } catch (e) { return itemsRaw; }
    }
    if (Array.isArray(items)) {
      return items.map(item => {
        const cant = item.cantidad || item.stock || 1;
        const nombre = capitalizarTexto(item.nombre || item.producto || item.descripcion || 'Artículo');
        const obs = item.observacion ? ` (${item.observacion})` : '';
        return `${cant}x ${nombre}${obs}`;
      }).join(', ');
    }
    return String(itemsRaw);
  };

  // Sesión persistente
  useEffect(() => {
    const domiGuardado = localStorage.getItem('vertizze_domi_sesion');
    if (domiGuardado) {
      try {
        const datos = JSON.parse(domiGuardado);
        setDomiciliario(datos);
        sincronizarEstadoDomi(datos.id, 'disponible');
      } catch (e) {
        localStorage.removeItem('vertizze_domi_sesion');
      }
    }
  }, []);

  // Suscripción Realtime en tiempo real
  useEffect(() => {
    if (!domiciliario) return;

    cargarOrdenesDomiciliario();

    const canalRealtime = supabase
      .channel(`kds-domi-realtime-${domiciliario.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordenes' },
        (payload) => {
          cargarOrdenesDomiciliario();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, [domiciliario]);

  const sincronizarEstadoDomi = async (domiId, nuevoEstado) => {
    try {
      await supabase
        .from('domiciliarios')
        .update({ estado: nuevoEstado })
        .eq('id', domiId);
    } catch (err) {
      console.error("Error al actualizar estado:", err.message);
    }
  };

  const manejarLogin = async (e) => {
    e.preventDefault();
    setErrorLogin('');

    if (!pinIngresado || pinIngresado.trim().length < 4) {
      setErrorLogin('Ingresa un PIN válido de al menos 4 dígitos.');
      return;
    }

    setCargandoLogin(true);
    try {
      const { data, error } = await supabase
        .from('domiciliarios')
        .select('*')
        .eq('pin_acceso', pinIngresado.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setErrorLogin('PIN incorrecto.');
        setCargandoLogin(false);
        return;
      }

      localStorage.setItem('vertizze_domi_sesion', JSON.stringify(data));
      setDomiciliario(data);
      await sincronizarEstadoDomi(data.id, 'disponible');

    } catch (err) {
      console.error("Error login:", err.message);
      setErrorLogin('Error de conexión.');
    } finally {
      setCargandoLogin(false);
    }
  };

  const cerrarSesion = async () => {
    if (window.confirm('¿Deseas salir de turno y cerrar sesión?')) {
      if (domiciliario) {
        await sincronizarEstadoDomi(domiciliario.id, 'fuera de turno');
      }
      localStorage.removeItem('vertizze_domi_sesion');
      setDomiciliario(null);
      setOrdenesAsignadas([]);
      setPinIngresado('');
    }
  };

  const cargarOrdenesDomiciliario = async () => {
    if (!domiciliario) return;
    setCargandoOrdenes(true);
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .eq('domiciliario_id', domiciliario.id)
        .order('id', { ascending: false });

      if (error) throw error;
      const ordenesNuevas = data || [];

      // Detectar asignación nueva para sonar/vibrar
      const activasNuevas = ordenesNuevas.filter(o => o.estado_domicilio !== 'entregado');
      if (activasNuevas.length > conteoOrdenesPrevio.current && conteoOrdenesPrevio.current !== 0) {
        alertarNuevoDomicilio();
      }
      conteoOrdenesPrevio.current = activasNuevas.length;

      setOrdenesAsignadas(ordenesNuevas);
    } catch (err) {
      console.error("Error al cargar órdenes:", err.message);
    } finally {
      setCargandoOrdenes(false);
    }
  };

  const actualizarEstadoPedido = async (ordenId, nuevoEstadoDomicilio) => {
    try {
      const updateData = { estado_domicilio: nuevoEstadoDomicilio };
      if (nuevoEstadoDomicilio === 'entregado') {
        updateData.estado = 'Entregado';
      }

      const { error } = await supabase
        .from('ordenes')
        .update(updateData)
        .eq('id', ordenId);

      if (error) throw error;

      const pendientesRestantes = ordenesAsignadas.filter(
        o => o.id !== ordenId && o.estado_domicilio !== 'entregado'
      ).length;

      const nuevoEstadoDomi = pendientesRestantes > 0 ? 'en ruta' : 'disponible';
      await sincronizarEstadoDomi(domiciliario.id, nuevoEstadoDomi);

      cargarOrdenesDomiciliario();
    } catch (err) {
      console.error("Error al actualizar pedido:", err.message);
      alert("No se pudo actualizar el pedido: " + err.message);
    }
  };

  const pedidosActivos = ordenesAsignadas.filter(o => o.estado_domicilio !== 'entregado');
  const historialEntregados = ordenesAsignadas.filter(o => o.estado_domicilio === 'entregado');
  const tarifaTotalAcumulada = historialEntregados.length * 6000;

  // Formulario Login
  if (!domiciliario) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans select-none">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600"></div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center mx-auto text-neutral-950 shadow-lg shadow-amber-500/20">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="text-lg font-black tracking-wider text-white">VÉRTIZZE DOMICILIOS</h1>
            <p className="text-xs text-neutral-400">Ingreso exclusivo para repartidores</p>
          </div>

          <form onSubmit={manejarLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5 text-center">
                Ingresa tu PIN Secreto
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="8"
                  placeholder="••••"
                  value={pinIngresado}
                  onChange={(e) => setPinIngresado(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-center text-lg font-mono font-black text-amber-400 tracking-widest focus:outline-none focus:border-amber-500 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {errorLogin && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorLogin}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={cargandoLogin}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 cursor-pointer flex items-center justify-center gap-2"
            >
              {cargandoLogin ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Entrar a Turno'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans select-none">
      <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-white">
              {capitalizarTexto(domiciliario.nombre)}
            </h1>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              En Turno • Disponible
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!sonidoHabilitado && (
            <button 
              onClick={habilitarSonidoInicial}
              className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
              title="Activar Sonido y Vibración"
            >
              <Bell className="w-4 h-4 animate-bounce" /> Activar Alerta
            </button>
          )}

          <button 
            onClick={cerrarSesion}
            className="p-2 bg-neutral-950 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 text-neutral-400 hover:text-red-400 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Métricas */}
      <div className="p-3 bg-neutral-900/60 border-b border-neutral-800/80 grid grid-cols-3 gap-2 text-center">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-2.5">
          <span className="text-[9px] text-neutral-400 font-bold uppercase block">Por Entregar</span>
          <p className="text-sm font-black text-amber-400 mt-0.5">{pedidosActivos.length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-2.5">
          <span className="text-[9px] text-neutral-400 font-bold uppercase block">Entregados</span>
          <p className="text-sm font-black text-emerald-400 mt-0.5">{historialEntregados.length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-2.5">
          <span className="text-[9px] text-neutral-400 font-bold uppercase block">Ganancia ($6k)</span>
          <p className="text-sm font-black text-white mt-0.5">$ {tarifaTotalAcumulada.toLocaleString()}</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="px-3 pt-3 flex gap-2">
        <button
          onClick={() => setPestaña('activos')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            pestaña === 'activos' ? 'bg-amber-500 text-neutral-950 shadow-md' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Servicios Activos ({pedidosActivos.length})</span>
        </button>

        <button
          onClick={() => setPestaña('historial')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            pestaña === 'historial' ? 'bg-amber-500 text-neutral-950 shadow-md' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial ({historialEntregados.length})</span>
        </button>
      </div>

      {/* Lista de Servicios */}
      <main className="flex-1 p-3 space-y-3 overflow-y-auto">
        {cargandoOrdenes ? (
          <div className="py-20 text-center text-neutral-500 text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
            <p>Sincronizando entregas...</p>
          </div>
        ) : pestaña === 'activos' ? (
          pedidosActivos.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-3 shadow-lg my-auto">
              <div className="w-12 h-12 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-center mx-auto text-amber-500">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-white">Sin domicilios pendientes</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Mantén la aplicación abierta. Apenas el restaurante te asigne un pedido, aparecerá en esta pantalla en tiempo real.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidosActivos.map(orden => {
                const telClienteLimpio = limpiarTelefono(orden.cliente_telefono || orden.telefono);
                // LECTURA CORREGIDA: evalúa ubicacion_detalle o direccion
                const direccionStr = orden.ubicacion_detalle || orden.direccion || orden.cliente_direccion || 'Dirección no especificada';
                const estadoDomi = (orden.estado_domicilio || 'asignado').toLowerCase();

                return (
                  <div key={orden.id} className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-4 space-y-3 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600"></div>

                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          Orden #{orden.numero_orden || orden.id}
                        </span>
                        <h3 className="text-sm font-black text-white mt-1.5">
                          {capitalizarTexto(orden.cliente_nombre) || 'Cliente General'}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 font-bold block">Cobro en Entrega</span>
                        <p className="text-base font-black text-emerald-400">
                          $ {Number(orden.subtotal || orden.total || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase block">Dirección de Entrega:</span>
                          <p className="text-xs font-bold text-white leading-relaxed">{capitalizarTexto(direccionStr)}</p>
                        </div>
                      </div>

                      {direccionStr && direccionStr !== 'Dirección no especificada' && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionStr)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Abriendo Mapa / GPS
                        </a>
                      )}
                    </div>

                    {telClienteLimpio && (
                      <div className="flex gap-2">
                        <a
                          href={`tel:${telClienteLimpio}`}
                          className="flex-1 py-2 bg-neutral-950 border border-neutral-800 text-emerald-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" /> Llamar Cliente
                        </a>
                        <a
                          href={`https://wa.me/57${telClienteLimpio}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 bg-neutral-950 border border-neutral-800 text-emerald-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    )}

                    <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-2.5 space-y-1">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase block">Contenido del Pedido:</span>
                      <p className="text-xs text-neutral-300">{formatearItems(orden.items)}</p>
                    </div>

                    <div className="pt-1 flex gap-2">
                      {estadoDomi !== 'en_ruta' && estadoDomi !== 'en ruta' ? (
                        <button
                          onClick={() => actualizarEstadoPedido(orden.id, 'en_ruta')}
                          className="w-full py-3 bg-amber-500 text-neutral-950 font-black rounded-2xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Truck className="w-4 h-4" /> Iniciar Recorrido (En Ruta)
                        </button>
                      ) : (
                        <button
                          onClick={() => actualizarEstadoPedido(orden.id, 'entregado')}
                          className="w-full py-3 bg-emerald-500 text-neutral-950 font-black rounded-2xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Confirmar Entrega Realizada
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-2">
            {historialEntregados.map(ord => (
              <div key={ord.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex justify-between items-center gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-400">Orden #{ord.numero_orden || ord.id}</span>
                  <p className="text-xs text-white font-semibold">{capitalizarTexto(ord.cliente_nombre) || 'Cliente'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 font-bold block">+$ 6.000</span>
                  <p className="text-xs font-black text-white">$ {Number(ord.subtotal || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}