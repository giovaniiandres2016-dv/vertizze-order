// ============================================================================
// ARCHIVO: src/vistas/DashboardGeneral.jsx
// DESCRIPCIÓN: Panel con Resumen filtrable por fecha exacta/hoy, Módulo de Clientes (Sincronizado desde Órdenes en Tiempo Real), Paginación y Pagos.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Menu, X, LayoutDashboard, FileSpreadsheet, 
  ClipboardList, Utensils, LogOut, Store, ExternalLink,
  Plus, Calendar, Download, Edit3, Trash2, Image as ImageIcon, CheckCircle, Clock, Printer, CreditCard, AlertCircle, ArrowUpRight, Search, Filter, ChevronLeft, ChevronRight, Users, Phone, MapPin
} from 'lucide-react';
import { obtenerMenu, supabase } from '../../sdk/vertizzeApi';

export default function DashboardGeneral() {
  const [menuColapsado, setMenuColapsado] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [vistaActual, setVistaActual] = useState('resumen'); 

  // Fecha actual por defecto en formato YYYY-MM-DD
  const fechaHoyStr = new Date().toISOString().split('T')[0];
  const [filtroFechaDashboard, setFiltroFechaDashboard] = useState(fechaHoyStr);

  // Estado general de carga inicial para evitar pantalla en negro al actualizar
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // Estados específicos para el Módulo de Contabilidad y Reportes
  const [fechaInicio, setFechaInicio] = useState(fechaHoyStr);
  const [fechaFin, setFechaFin] = useState(fechaHoyStr);
  const [estadoCajaCerrada, setEstadoCajaCerrada] = useState(false);

  // Estado de Órdenes conectado a la base de datos
  const [ordenes, setOrdenes] = useState([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(true);

  // Estados para el Módulo de Clientes (con Paginación)
  const [clientes, setClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [modoEdicionCliente, setModoEdicionCliente] = useState(false);
  const [paginaActualClientes, setPaginaActualClientes] = useState(1);
  const [registrosPorPaginaClientes, setRegistrosPorPaginaClientes] = useState(10);
  
  // Campos del formulario de Clientes
  const [formTelefonoCliente, setFormTelefonoCliente] = useState('');
  const [formNombreCliente, setFormNombreCliente] = useState('');
  const [formDireccionCliente, setFormDireccionCliente] = useState('');
  const [formObsCliente, setFormObsCliente] = useState('');

  // Estados para el Módulo de Gestión de Órdenes (Buscador, Filtros, Rango de Fechas y Paginación)
  const [busquedaOrden, setBusquedaOrden] = useState('');
  const [filtroEstadoOrden, setFiltroEstadoOrden] = useState('todos');
  const [filtroFechaInicioOrden, setFiltroFechaInicioOrden] = useState('');
  const [filtroFechaFinOrden, setFiltroFechaFinOrden] = useState('');
  const [paginaActualOrdenes, setPaginaActualOrdenes] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  // Estados para el Modal de Edición de Órdenes Bloqueadas/Detalle
  const [modalOrdenAbierto, setModalOrdenAbierto] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  // Estados internos para la edición avanzada de la orden (nuevos artículos, buscador y observaciones)
  const [itemsEditables, setItemsEditables] = useState([]);
  const [busquedaProductoModal, setBusquedaProductoModal] = useState('');
  const [observacionesEditables, setObservacionesEditables] = useState('');

  // Estado del Menú y Categorías conectados a la base de datos
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargandoMenu, setCargandoMenu] = useState(true);

  // Estados para Modales de Menú (Crear / Editar)
  const [modalMenuAbierto, setModalMenuAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoActualId, setProductoActualId] = useState(null);
  
  // Campos del formulario vinculados a la BD
  const [formNombre, setFormNombre] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState('1');
  const [formPrecio, setFormPrecio] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formImagen, setFormImagen] = useState('');

  // Estado para ticket de impresión
  const [ordenImprimiendo, setOrdenImprimiendo] = useState(null);

  // Función auxiliar para limpiar y formatear el teléfono (Estandarizado a 10 dígitos limpios)
  const limpiarTelefono = (tel) => {
    if (!tel) return 'N/A';
    let limpio = String(tel).trim();
    if (limpio.startsWith('+57')) {
      limpio = limpio.replace('+57', '');
    } else if (limpio.startsWith('57') && limpio.length > 10) {
      limpio = limpio.replace('57', '');
    }
    limpio = limpio.replace(/\D/g, ''); // Solo números
    return limpio.trim() !== '' ? limpio : 'N/A';
  };

  // Función auxiliar para formatear la dirección con orden visual estricto
  const formatearDireccion = (dir) => {
    if (dir === null || dir === undefined) return 'N/A';
    const dStr = String(dir).trim();
    const dLower = dStr.toLowerCase();
    
    if (dLower === '' || dLower === 'no especificada' || dLower.includes('mesa') || /^\d+$/.test(dStr)) {
      return 'N/A';
    }
    // Capitalizar la primera letra de la dirección
    return dStr.charAt(0).toUpperCase() + dStr.slice(1);
  };

  // Función para parsear JSON crudo de ítems y asegurar capitalización inicial
  const formatearItems = (itemsRaw) => {
    if (!itemsRaw) return 'Sin detalle';
    let items = itemsRaw;
    if (typeof itemsRaw === 'string') {
      try {
        items = JSON.parse(itemsRaw);
      } catch (e) {
        return itemsRaw.charAt(0).toUpperCase() + itemsRaw.slice(1);
      }
    }
    if (Array.isArray(items)) {
      return items.map(item => {
        const cantidad = item.cantidad || 1;
        const nombre = item.nombre || '';
        const nombreCapitalizado = nombre.charAt(0).toUpperCase() + nombre.slice(1);
        let texto = `${cantidad}x ${nombreCapitalizado}`;
        if (item.observacion) {
          texto += ` (Nota: ${item.observacion})`;
        }
        return texto;
      }).join(', ');
    }
    return String(itemsRaw);
  };

  // Sincronizar automáticamente o insertar cliente basado en los datos de las órdenes entrantes
  const sincronizarClientesDesdeOrdenes = async (listaOrdenes) => {
    try {
      for (const ord of listaOrdenes) {
        const telOrd = limpiarTelefono(ord.cliente_telefono || ord.telefono);
        const nomOrd = ord.cliente_nombre || ord.nombre_cliente;

        if (telOrd && telOrd !== 'N/A' && nomOrd && nomOrd.toLowerCase() !== 'cliente general') {
          // Verificar si ya existe en la tabla clientes
          const { data: existeCli } = await supabase
            .from('clientes')
            .select('telefono')
            .eq('telefono', telOrd)
            .maybeSingle();

          const dirFormateada = formatearDireccion(ord.direccion || ord.cliente_direccion);

          if (!existeCli) {
            // Insertar automáticamente si viene de órdenes y no existe
            await supabase.from('clientes').insert([{
              telefono: telOrd,
              nombre: nomOrd.charAt(0).toUpperCase() + nomOrd.slice(1),
              direccion: dirFormateada,
              observaciones: ord.observaciones || 'Registrado automáticamente desde Órdenes'
            }]);
          }
        }
      }
    } catch (err) {
      console.error("Error sincronizando clientes en tiempo real:", err.message);
    }
  };

  // Cargar datos iniciales y configurar canales en Tiempo Real (Realtime) optimizados
  useEffect(() => {
    cargarDatosBD();

    const timerSeguridad = setTimeout(() => {
      setCargandoInicial(false);
      setCargandoOrdenes(false);
      setCargandoClientes(false);
      setCargandoMenu(false);
    }, 5000);

    const canalRealtime = supabase
      .channel('cambios-vertizze-db')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordenes' },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            setOrdenes(prevOrdenes => 
              prevOrdenes.map(ord => ord.id === payload.new.id ? { ...ord, ...payload.new } : ord)
            );
          } else if (payload.eventType === 'INSERT') {
            setOrdenes(prevOrdenes => [payload.new, ...prevOrdenes]);
            await sincronizarClientesDesdeOrdenes([payload.new]);
            cargarDatosBD();
          } else if (payload.eventType === 'DELETE') {
            setOrdenes(prevOrdenes => prevOrdenes.filter(ord => ord.id !== payload.old.id));
          } else {
            cargarDatosBD();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productos' },
        (payload) => { cargarDatosBD(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clientes' },
        (payload) => { cargarDatosBD(); }
      )
      .subscribe();

    return () => {
      clearTimeout(timerSeguridad);
      supabase.removeChannel(canalRealtime);
    };
  }, []);

  const cargarDatosBD = async () => {
    try {
      const [resProductos, resCategorias, resOrdenes, resClientes] = await Promise.all([
        supabase.from('productos').select('*').order('id', { ascending: true }),
        supabase.from('categorias').select('*').order('id', { ascending: true }),
        supabase.from('ordenes').select('*').order('id', { ascending: false }),
        supabase.from('clientes').select('*').order('creado_en', { ascending: false })
      ]);

      setProductos(resProductos.data || []);
      setCategorias(resCategorias.data || []);
      setOrdenes(resOrdenes.data || []);
      setClientes(resClientes.data || []);

      // Sincronizar preventivamente los clientes existentes en órdenes
      if (resOrdenes.data && resOrdenes.data.length > 0) {
        await sincronizarClientesDesdeOrdenes(resOrdenes.data);
      }

      if (resCategorias.data && resCategorias.data.length > 0) {
        setFormCategoriaId(String(resCategorias.data[0].id));
      }

    } catch (error) {
      console.error("Error general al cargar datos de la BD:", error.message);
    } finally {
      setCargandoMenu(false);
      setCargandoOrdenes(false);
      setCargandoClientes(false);
      setCargandoInicial(false);
    }
  };

  const abrirModalCrearCliente = () => {
    setModoEdicionCliente(false);
    setFormTelefonoCliente('');
    setFormNombreCliente('');
    setFormDireccionCliente('');
    setFormObsCliente('');
    setModalClienteAbierto(true);
  };

  const abrirModalEditarCliente = (cli) => {
    setModoEdicionCliente(true);
    setFormTelefonoCliente(limpiarTelefono(cli.telefono));
    setFormNombreCliente(cli.nombre || '');
    setFormDireccionCliente(cli.direccion || '');
    setFormObsCliente(cli.observaciones || '');
    setModalClienteAbierto(true);
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    const telLimpio = limpiarTelefono(formTelefonoCliente);
    if (!telLimpio || telLimpio === 'N/A' || !formNombreCliente) {
      alert('El teléfono válido y el nombre son obligatorios.');
      return;
    }

    const nombreCap = formNombreCliente.charAt(0).toUpperCase() + formNombreCliente.slice(1);
    const dirFormateada = formatearDireccion(formDireccionCliente);

    try {
      if (modoEdicionCliente) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nombre: nombreCap,
            direccion: dirFormateada,
            observaciones: formObsCliente
          })
          .eq('telefono', telLimpio);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([{
            telefono: telLimpio,
            nombre: nombreCap,
            direccion: dirFormateada,
            observaciones: formObsCliente
          }]);

        if (error) throw error;
      }

      setModalClienteAbierto(false);
      cargarDatosBD();
    } catch (error) {
      console.error("Error al guardar cliente:", error.message);
      alert("Hubo un error al guardar el cliente.");
    }
  };

  const eliminarCliente = async (telefono) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        const { error } = await supabase.from('clientes').delete().eq('telefono', telefono);
        if (error) throw error;
        cargarDatosBD();
      } catch (error) {
        console.error("Error al eliminar cliente:", error.message);
        alert("No se pudo eliminar el registro.");
      }
    }
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setProductoActualId(null);
    setFormNombre('');
    if (categorias.length > 0) {
      setFormCategoriaId(String(categorias[0].id));
    }
    setFormPrecio('');
    setFormDescripcion('');
    setFormImagen('');
    setModalMenuAbierto(true);
  };

  const abrirModalEditar = (prod) => {
    setModoEdicion(true);
    setProductoActualId(prod.id);
    setFormNombre(prod.nombre);
    setFormCategoriaId(String(prod.categoria_id || (categorias[0] ? categorias[0].id : 1)));
    setFormPrecio(prod.precio);
    setFormDescripcion(prod.descripcion || '');
    setFormImagen(prod.imagen || '');
    setModalMenuAbierto(true);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!formNombre || !formPrecio) {
      alert('Por favor completa al menos el nombre y el precio.');
      return;
    }

    const catIdNum = Number(formCategoriaId);
    const imgUrl = formImagen.trim() !== '' ? formImagen : null;

    try {
      if (modoEdicion) {
        const { error } = await supabase
          .from('productos')
          .update({
            nombre: formNombre,
            categoria_id: catIdNum,
            precio: Number(formPrecio),
            descripcion: formDescripcion,
            imagen: imgUrl
          })
          .eq('id', productoActualId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('productos')
          .insert([{
            nombre: formNombre,
            categoria_id: catIdNum,
            precio: Number(formPrecio),
            descripcion: formDescripcion,
            imagen: imgUrl,
            disponible: true
          }]);

        if (error) throw error;
      }

      setModalMenuAbierto(false);
      cargarDatosBD();
    } catch (error) {
      console.error("Error al guardar el producto:", error.message);
      alert("Hubo un error al guardar el producto.");
    }
  };

  const cambiarDisponibilidad = async (id, estadoActual) => {
    try {
      const { error } = await supabase.from('productos').update({ disponible: !estadoActual }).eq('id', id);
      if (error) throw error;
      cargarDatosBD();
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  const eliminarProducto = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (error) throw error;
        cargarDatosBD();
      } catch (error) {
        console.error("Error:", error.message);
      }
    }
  };

  const cambiarEstadoOrden = async (id, nuevoEstado) => {
    const ordenActual = ordenes.find(o => o.id === id);
    if (ordenActual) {
      const estadoDb = (ordenActual.estado || '').toLowerCase().trim();
      if (estadoDb === 'listo' || estadoDb === 'entregado') {
        alert('Esta orden ya se encuentra en estado Listo/Entregado y está bloqueada contra modificaciones.');
        return;
      }
    }

    setOrdenes(prevOrdenes => 
      prevOrdenes.map(ord => ord.id === id ? { ...ord, estado: nuevoEstado } : ord)
    );

    try {
      const { error } = await supabase.from('ordenes').update({ estado: nuevoEstado }).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Error al actualizar estado en BD:", error.message);
      cargarDatosBD();
    }
  };

  const registrarPagoOrden = async (id, nuevoEstadoPago, nuevoMetodoPago) => {
    setOrdenes(prevOrdenes => 
      prevOrdenes.map(ord => ord.id === id ? { ...ord, estado_pago: nuevoEstadoPago, metodo_pago: nuevoMetodoPago } : ord)
    );

    try {
      const { error } = await supabase.from('ordenes').update({ estado_pago: nuevoEstadoPago, metodo_pago: nuevoMetodoPago }).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Error al registrar pago:", error.message);
      cargarDatosBD();
    }
  };

  const abrirDetalleOrden = (o) => {
    setOrdenSeleccionada(o);
    setObservacionesEditables(o.observaciones || o.nota || '');
    setBusquedaProductoModal('');
    
    let itemsParsed = [];
    if (o.items) {
      if (typeof o.items === 'string') {
        try {
          itemsParsed = JSON.parse(o.items);
        } catch (e) {
          itemsParsed = [{ nombre: o.items, cantidad: 1, precio: o.subtotal || 0 }];
        }
      } else if (Array.isArray(o.items)) {
        itemsParsed = [...o.items];
      }
    }
    setItemsEditables(itemsParsed);
    setModalOrdenAbierto(true);
  };

  const agregarItemAOrdenModal = (producto) => {
    setItemsEditables(prev => {
      const existe = prev.find(i => i.id === producto.id || i.nombre === producto.nombre);
      if (existe) {
        return prev.map(i => (i.id === producto.id || i.nombre === producto.nombre) ? { ...i, cantidad: (i.cantidad || 1) + 1 } : i);
      } else {
        return [...prev, { id: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1, observacion: '' }];
      }
    });
  };

  const actualizarCantidadItemModal = (index, delta) => {
    setItemsEditables(prev => {
      const nuevo = [...prev];
      const nuevaCant = (nuevo[index].cantidad || 1) + delta;
      if (nuevaCant <= 0) {
        nuevo.splice(index, 1);
      } else {
        nuevo[index].cantidad = nuevaCant;
      }
      return nuevo;
    });
  };

  const actualizarNotaItemModal = (index, nota) => {
    setItemsEditables(prev => {
      const nuevo = [...prev];
      nuevo[index].observacion = nota;
      return nuevo;
    });
  };

  const guardarCambiosOrdenModal = async () => {
    if (!ordenSeleccionada) return;

    const nuevoSubtotal = itemsEditables.reduce((acc, curr) => acc + (Number(curr.precio || 0) * Number(curr.cantidad || 1)), 0);

    const datosActualizacion = {
      items: itemsEditables,
      subtotal: nuevoSubtotal,
      total: nuevoSubtotal,
      observaciones: observacionesEditables
    };

    try {
      const { error } = await supabase
        .from('ordenes')
        .update(datosActualizacion)
        .eq('id', ordenSeleccionada.id);

      if (error) throw error;

      alert('¡Orden modificada con éxito!');
      setModalOrdenAbierto(false);
      cargarDatosBD();
    } catch (error) {
      console.error("Error al actualizar la orden:", error.message);
      alert("Hubo un error al guardar los cambios: " + error.message);
    }
  };

  const exportarACSV = () => {
    const ordenesFiltradas = ordenes.filter(o => {
      if (!fechaInicio || !fechaFin) return true;
      const fechaCreacion = o.creado_en ? o.creado_en.split('T')[0] : '';
      return fechaCreacion >= fechaInicio && fechaCreacion <= fechaFin;
    });

    if (ordenesFiltradas.length === 0) {
      alert("No hay registros en el rango seleccionado.");
      return;
    }

    const cabeceras = ["ID", "Nro Orden", "Tipo Servicio", "Cliente", "Items", "Subtotal", "Estado Pago", "Metodo Pago", "Estado Pedido", "Fecha"];
    const filas = ordenesFiltradas.map(o => [
      o.id,
      o.numero_orden,
      o.tipo_servicio,
      `"${o.cliente_nombre || 'Cliente'}"`,
      `"${formatearItems(o.items).replace(/"/g, '""')}"`,
      o.subtotal,
      o.estado_pago,
      o.metodo_pago,
      o.estado,
      o.creado_en ? o.creado_en.split('T')[0] : ''
    ]);

    const contenidoCSV = [cabeceras.join(","), ...filas.map(f => f.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_contable_${fechaInicio}_al_${fechaFin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarOrdenesFiltradasACSV = (ordenesFiltradas) => {
    if (ordenesFiltradas.length === 0) {
      alert("No hay órdenes en el filtro actual para exportar.");
      return;
    }

    const cabeceras = ["ID", "Nro Orden", "Tipo Servicio", "Cliente", "Items", "Subtotal", "Estado Pago", "Metodo Pago", "Estado Pedido", "Fecha"];
    const filas = ordenesFiltradas.map(o => [
      o.id,
      o.numero_orden,
      o.tipo_servicio,
      `"${o.cliente_nombre || 'Cliente'}"`,
      `"${formatearItems(o.items).replace(/"/g, '""')}"`,
      o.subtotal,
      o.estado_pago,
      o.metodo_pago,
      o.estado,
      o.creado_en ? o.creado_en.split('T')[0] : ''
    ]);

    const contenidoCSV = [cabeceras.join(","), ...filas.map(f => f.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_ordenes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const obtenerNombreCategoria = (catId) => {
    const encontrada = categorias.find(c => c.id === catId);
    return encontrada ? encontrada.nombre : 'General';
  };

  const imprimirTicket = (orden) => {
    setOrdenImprimiendo(orden);
    setTimeout(() => { window.print(); }, 200);
  };

  const renderizarModulo = () => {
    switch (vistaActual) {
      case 'resumen': {
        const ordenesFiltradas = ordenes.filter(o => {
          const fechaCreacion = o.creado_en ? o.creado_en.split('T')[0] : '';
          return fechaCreacion === filtroFechaDashboard;
        });

        const ventasTotales = ordenesFiltradas
          .filter(o => {
            const esPagado = o.estado_pago && o.estado_pago.toLowerCase() === 'pagado';
            const estadoOp = o.estado ? o.estado.toLowerCase() : '';
            return esPagado && (estadoOp === 'listo' || estadoOp === 'entregado');
          })
          .reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0);

        const totalOrdenes = ordenesFiltradas.length;
        const ticketPromedio = totalOrdenes > 0 ? ventasTotales / totalOrdenes : 0;

        const totalEfectivo = ordenesFiltradas
          .filter(o => o.estado_pago?.toLowerCase() === 'pagado' && o.metodo_pago?.toLowerCase().includes('efectivo'))
          .reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0);

        const totalDigital = ordenesFiltradas
          .filter(o => o.estado_pago?.toLowerCase() === 'pagado' && (!o.metodo_pago || !o.metodo_pago.toLowerCase().includes('efectivo')))
          .reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0);

        const totalClientesUnicos = new Set(ordenesFiltradas.map(o => o.cliente_nombre)).size;

        const ordenesPendientesCocina = ordenes.filter(o => {
          const est = o.estado ? o.estado.toLowerCase().trim() : '';
          return est === 'pendiente' || est === 'en proceso';
        });

        const ordenesPendientesCobro = ordenes.filter(o => {
          const estPag = o.estado_pago ? o.estado_pago.toLowerCase().trim() : '';
          return estPag !== 'pagado';
        });

        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl shadow-lg">
              <div>
                <h2 className="text-base md:text-lg font-black text-white">Resumen General y Analíticas</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Control de métricas clave, estado de cocina y cobros pendientes en tiempo real.</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFiltroFechaDashboard(new Date().toISOString().split('T')[0])}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${filtroFechaDashboard === new Date().toISOString().split('T')[0] ? 'bg-amber-500 text-neutral-950 shadow-md' : 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white'}`}
                >
                  Hoy
                </button>
                <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-xl">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <input 
                    type="date" 
                    value={filtroFechaDashboard} 
                    onChange={(e) => setFiltroFechaDashboard(e.target.value)} 
                    className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Ventas Confirmadas</span>
                <p className="text-base font-black text-white mt-1">$ {ventasTotales.toLocaleString()}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">Fecha: {filtroFechaDashboard}</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total Órdenes</span>
                <p className="text-base font-black text-amber-400 mt-1">{totalOrdenes}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">Pedidos registrados hoy</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Ticket Promedio</span>
                <p className="text-base font-black text-white mt-1">$ {ticketPromedio.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">Valor medio por pedido</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Plato Estrella</span>
                <p className="text-base font-black text-emerald-400 mt-1 truncate">Burger Especial</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">Más solicitado</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Ingreso en Efectivo</span>
                  <p className="text-sm font-black text-white mt-0.5">$ {totalEfectivo.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">💵</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Ingresos Digitales/Transfer</span>
                  <p className="text-sm font-black text-white mt-0.5">$ {totalDigital.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">📱</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Clientes Atendidos</span>
                  <p className="text-sm font-black text-amber-400 mt-0.5">{totalClientesUnicos} clientes</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">👥</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2 shadow-lg">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Órdenes Pendientes (Cocina)</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-[10px] font-bold">{ordenesPendientesCocina.length} activas</span>
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {ordenesPendientesCocina.length === 0 ? (
                    <p className="text-xs text-neutral-500 text-center py-4">No hay órdenes pendientes en cocina.</p>
                  ) : (
                    ordenesPendientesCocina.map(o => (
                      <div key={o.id} className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-2.5 flex justify-between items-center gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-amber-400">#{o.numero_orden} - {o.cliente_nombre || 'Cliente'}</span>
                          <p className="text-[11px] text-neutral-300 truncate max-w-xs">{formatearItems(o.items)}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-bold shrink-0">{o.estado || 'Pendiente'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2 shadow-lg">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Pendientes de Cobro (Caja)</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-bold">{ordenesPendientesCobro.length} por cobrar</span>
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {ordenesPendientesCobro.length === 0 ? (
                    <p className="text-xs text-neutral-500 text-center py-4">No hay órdenes pendientes de pago.</p>
                  ) : (
                    ordenesPendientesCobro.map(o => (
                      <div key={o.id} className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-2.5 flex justify-between items-center gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-400">#{o.numero_orden} - {o.cliente_nombre || 'Cliente'}</span>
                          <p className="text-xs font-bold text-white mt-0.5">$ {Number(o.subtotal || 0).toLocaleString()}</p>
                        </div>
                        <button onClick={() => setVistaActual('pagos')} className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0">
                          <span>Cobrar</span> <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'clientes': {
        const clientesFiltrados = clientes.filter(c => {
          const busq = busquedaCliente.toLowerCase();
          const telLimpio = limpiarTelefono(c.telefono).toLowerCase();
          return (
            (c.nombre && c.nombre.toLowerCase().includes(busq)) ||
            telLimpio.includes(busq) ||
            (c.direccion && c.direccion.toLowerCase().includes(busq))
          );
        });

        const totalRegistrosCli = clientesFiltrados.length;
        const totalPaginasCli = Math.ceil(totalRegistrosCli / registrosPorPaginaClientes) || 1;
        const indiceUltimoCli = paginaActualClientes * registrosPorPaginaClientes;
        const indicePrimerCli = indiceUltimoCli - registrosPorPaginaClientes;
        const clientesPaginados = clientesFiltrados.slice(indicePrimerCli, indiceUltimoCli);

        const cambiarPaginaCli = (nuevaPag) => {
          if (nuevaPag >= 1 && nuevaPag <= totalPaginasCli) {
            setPaginaActualClientes(nuevaPag);
          }
        };

        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
              <div>
                <h2 className="text-base md:text-lg font-black text-white">Módulo de Clientes</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Sincronización en tiempo real con datos de órdenes, identificación única y formato limpio.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o teléfono..."
                    value={busquedaCliente}
                    onChange={(e) => { setBusquedaCliente(e.target.value); setPaginaActualClientes(1); }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button onClick={abrirModalCrearCliente} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Nuevo Cliente
                </button>
              </div>
            </div>

            {cargandoClientes ? (
              <div className="py-20 text-center text-neutral-500 text-xs">Cargando clientes en tiempo real...</div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-2 shadow-lg">
                <div className="w-9 h-9 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <Users className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-xs font-bold text-white">No se encontraron clientes</h3>
                <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">Los clientes se insertan automáticamente a medida que ingresan nuevas órdenes.</p>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-3 shadow-lg">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                        <th className="pb-2.5">Teléfono (ID Único)</th>
                        <th className="pb-2.5">Nombre Completo / Ordenado</th>
                        <th className="pb-2.5">Dirección / Ubicación</th>
                        <th className="pb-2.5">Observaciones</th>
                        <th className="pb-2.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {clientesPaginados.map(c => {
                        const telFormateado = limpiarTelefono(c.telefono);
                        const direccionFormateada = formatearDireccion(c.direccion);
                        const nombreFormateado = c.nombre ? (c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1)) : 'Sin nombre';
                        
                        return (
                          <tr key={c.telefono} className="hover:bg-neutral-800/40">
                            <td className="py-2.5 font-bold text-amber-400 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-neutral-400" />
                              {telFormateado}
                            </td>
                            <td className="py-2.5 text-white font-semibold">{nombreFormateado}</td>
                            <td className="py-2.5 text-neutral-300">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                <span className={`truncate max-w-xs ${direccionFormateada === 'N/A' ? 'text-neutral-500 italic' : ''}`}>
                                  {direccionFormateada}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 text-neutral-400 truncate max-w-xs">{c.observaciones || 'Ninguna'}</td>
                            <td className="py-2.5 text-right space-x-1">
                              <button onClick={() => abrirModalEditarCliente(c)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-all cursor-pointer inline-block" title="Editar">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => eliminarCliente(c.telefono)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer inline-block" title="Eliminar">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center pt-2 border-t border-neutral-800 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <span>Mostrando del <strong>{totalRegistrosCli > 0 ? indicePrimerCli + 1 : 0}</strong> al <strong>{Math.min(indiceUltimoCli, totalRegistrosCli)}</strong> de <strong>{totalRegistrosCli}</strong> clientes</span>
                    <select 
                      value={registrosPorPaginaClientes}
                      onChange={(e) => { setRegistrosPorPaginaClientes(Number(e.target.value)); setPaginaActualClientes(1); }}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-0.5 text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer ml-1 text-[11px]"
                    >
                      <option value="5">5 por pág</option>
                      <option value="10">10 por pág</option>
                      <option value="20">20 por pág</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => cambiarPaginaCli(paginaActualClientes - 1)}
                      disabled={paginaActualClientes === 1}
                      className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2.5 py-0.5 bg-neutral-950 border border-neutral-800 rounded-lg font-bold text-amber-400 text-[11px]">
                      {paginaActualClientes} / {totalPaginasCli}
                    </span>
                    <button 
                      onClick={() => cambiarPaginaCli(paginaActualClientes + 1)}
                      disabled={paginaActualClientes === totalPaginasCli}
                      className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {modalClienteAbierto && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl relative">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <h3 className="text-xs font-black text-white">
                      {modoEdicionCliente ? 'Modificar Información de Cliente' : 'Crear Nuevo Cliente'}
                    </h3>
                    <button onClick={() => setModalClienteAbierto(false)} className="p-1 bg-neutral-950 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={guardarCliente} className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Teléfono / WhatsApp (Ej. 3001234567) *</label>
                      <input 
                        type="text" required placeholder="3001234567" 
                        value={formTelefonoCliente} 
                        onChange={(e) => setFormTelefonoCliente(e.target.value)}
                        disabled={modoEdicionCliente}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Nombre Completo *</label>
                      <input 
                        type="text" required placeholder="Ej. Carlos Andres" 
                        value={formNombreCliente} 
                        onChange={(e) => setFormNombreCliente(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Dirección (Dejar en blanco o N/A si es mesa)</label>
                      <input 
                        type="text" placeholder="Ej. Calle 50 # 45-20 o N/A" 
                        value={formDireccionCliente} 
                        onChange={(e) => setFormDireccionCliente(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Observaciones / Notas</label>
                      <textarea 
                        rows="2" placeholder="Preferencias..." 
                        value={formObsCliente} 
                        onChange={(e) => setFormObsCliente(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    <div className="pt-2 flex gap-2.5">
                      <button type="button" onClick={() => setModalClienteAbierto(false)} className="w-1/2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">
                        Cancelar
                      </button>
                      <button type="submit" className="w-1/2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer">
                        {modoEdicionCliente ? 'Guardar Cambios' : 'Crear Cliente'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'pagos': {
        const ordenesPendientesPago = ordenes.filter(o => {
          const estadoPago = o.estado_pago ? o.estado_pago.toLowerCase().trim() : '';
          return estadoPago !== 'pagado';
        });

        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div>
              <h2 className="text-base md:text-lg font-black text-white">Módulo de Control de Pagos y Caja</h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">Pedidos pendientes o sin pago confirmado para auditoría y cobro del administrador.</p>
            </div>
            {cargandoOrdenes ? (
              <div className="py-20 text-center text-neutral-500 text-xs">Cargando órdenes pendientes de pago...</div>
            ) : ordenesPendientesPago.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-2 shadow-lg">
                <div className="w-9 h-9 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xs font-bold text-white">¡Excelente! No hay pedidos pendientes de pago</h3>
                <p className="text-[11px] text-neutral-400">Todas las órdenes registradas cuentan con su pago confirmado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {ordenesPendientesPago.map(o => {
                  return (
                    <div key={o.id} className="bg-neutral-900 border border-amber-500/40 rounded-xl p-3 flex flex-col justify-between gap-2.5 relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold uppercase">Orden #{o.numero_orden}</span>
                          <h3 className="text-xs font-bold text-white mt-1">{o.cliente_nombre || 'Cliente General'}</h3>
                          <span className="text-[10px] text-neutral-400 block">{o.tipo_servicio || 'Local'} • Pedido: <strong className="text-amber-400">{o.estado || 'Pendiente'}</strong></span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 font-semibold block">Total a Pagar</span>
                          <p className="text-sm font-black text-white">$ {Number(o.subtotal || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2 space-y-0.5">
                        <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">Ítems:</span>
                        <p className="text-[11px] text-neutral-300">{formatearItems(o.items)}</p>
                      </div>
                      <div className="space-y-2 pt-1 border-t border-neutral-800">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">Método de Pago:</label>
                            <select 
                              value={o.metodo_pago || 'Efectivo'}
                              onChange={(e) => registrarPagoOrden(o.id, o.estado_pago || 'Por Pagar', e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1 text-[11px] text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="Efectivo">Efectivo</option>
                              <option value="Nequi">Nequi</option>
                              <option value="Daviplata">Daviplata</option>
                              <option value="Tarjeta">Tarjeta</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">Confirmar Pago:</label>
                            <button
                              onClick={() => registrarPagoOrden(o.id, 'Pagado', o.metodo_pago || 'Efectivo')}
                              className="w-full py-1 px-2 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Confirmar</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-0.5 text-[10px]">
                          <span className="text-neutral-500">ID BD: #{o.id}</span>
                          <button onClick={() => imprimirTicket(o)} className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer">
                            <Printer className="w-3 h-3" /> Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      case 'ordenes': {
        const ordenesFiltradas = ordenes.filter(o => {
          const matchBusqueda = busquedaOrden === '' || 
            (o.cliente_nombre && o.cliente_nombre.toLowerCase().includes(busquedaOrden.toLowerCase())) ||
            String(o.numero_orden).toLowerCase().includes(busquedaOrden.toLowerCase()) ||
            String(o.id).includes(busquedaOrden);

          const estadoActual = o.estado ? o.estado.toLowerCase().trim() : 'pendiente';
          const matchEstado = filtroEstadoOrden === 'todos' || estadoActual === filtroEstadoOrden.toLowerCase();

          const fechaCreacion = o.creado_en ? o.creado_en.split('T')[0] : '';
          const matchFechaInicio = !filtroFechaInicioOrden || fechaCreacion >= filtroFechaInicioOrden;
          const matchFechaFin = !filtroFechaFinOrden || fechaCreacion <= filtroFechaFinOrden;

          return matchBusqueda && matchEstado && matchFechaInicio && matchFechaFin;
        });

        const totalRegistros = ordenesFiltradas.length;
        const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina) || 1;
        const indiceUltimoRegistro = paginaActualOrdenes * registrosPorPagina;
        const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
        const ordenesPaginadas = ordenesFiltradas.slice(indicePrimerRegistro, indiceUltimoRegistro);

        const cambiarPagina = (nuevaPagina) => {
          if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) setPaginaActualOrdenes(nuevaPagina);
        };

        const productosFiltradosModal = productos.filter(p => 
          p.nombre.toLowerCase().includes(busquedaProductoModal.toLowerCase()) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(busquedaProductoModal.toLowerCase()))
        );

        const filtrarHoy = () => {
          const hoyStr = new Date().toISOString().split('T')[0];
          setFiltroFechaInicioOrden(hoyStr);
          setFiltroFechaFinOrden(hoyStr);
          setPaginaActualOrdenes(1);
        };

        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5">
              <div>
                <h2 className="text-base md:text-lg font-black text-white">Gestión general de Órdenes</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Supervisión en tiempo real, buscador, rango de fechas y paginación.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Buscar cliente o N°..."
                    value={busquedaOrden}
                    onChange={(e) => { setBusquedaOrden(e.target.value); setPaginaActualOrdenes(1); }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1">
                  <button 
                    onClick={filtrarHoy}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-black rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    Hoy
                  </button>
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
                  <div className="flex items-center gap-1">
                    <input type="date" value={filtroFechaInicioOrden} onChange={(e) => { setFiltroFechaInicioOrden(e.target.value); setPaginaActualOrdenes(1); }} className="bg-transparent text-[11px] text-white font-bold focus:outline-none cursor-pointer" />
                    <span className="text-neutral-500 text-[10px]">-</span>
                    <input type="date" value={filtroFechaFinOrden} onChange={(e) => { setFiltroFechaFinOrden(e.target.value); setPaginaActualOrdenes(1); }} className="bg-transparent text-[11px] text-white font-bold focus:outline-none cursor-pointer" />
                  </div>
                </div>

                <button 
                  onClick={() => exportarOrdenesFiltradasACSV(ordenesFiltradas)}
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar Excel
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'todos', label: 'Todas' },
                { id: 'pendiente', label: 'Pendiente' },
                { id: 'en proceso', label: 'En Proceso' },
                { id: 'listo', label: 'Listo' },
                { id: 'entregado', label: 'Entregado' },
                { id: 'cancelado', label: 'Cancelado' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => { setFiltroEstadoOrden(f.id); setPaginaActualOrdenes(1); }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${filtroEstadoOrden === f.id ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {cargandoOrdenes ? (
              <div className="py-20 text-center text-neutral-500 text-xs">Cargando órdenes...</div>
            ) : ordenesFiltradas.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-2 shadow-lg">
                <div className="w-9 h-9 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <ClipboardList className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-xs font-bold text-white">No se encontraron órdenes</h3>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2.5 shadow-lg">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs min-w-[750px]">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                        <th className="pb-2.5">ID / N° Orden</th>
                        <th className="pb-2.5">Tipo Servicio</th>
                        <th className="pb-2.5">Cliente</th>
                        <th className="pb-2.5">Ítems / Detalle</th>
                        <th className="pb-2.5">Subtotal</th>
                        <th className="pb-2.5">Estado Pago</th>
                        <th className="pb-2.5">Estado Pedido</th>
                        <th className="pb-2.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {ordenesPaginadas.map(o => {
                        const estadoPagoRaw = (o.estado_pago || 'Por Pagar').toLowerCase();
                        const esPagado = estadoPagoRaw.includes('pagado');
                        const estadoPedidoRaw = (o.estado || 'Pendiente').toLowerCase().trim();
                        const estaBloqueado = estadoPedidoRaw === 'listo' || estadoPedidoRaw === 'entregado';

                        return (
                          <tr key={o.id} className="hover:bg-neutral-800/40">
                            <td className="py-2.5 font-bold text-white">#{o.id} <span className="text-amber-400 font-normal">({o.numero_orden})</span></td>
                            <td className="py-2.5"><span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-md text-[10px] font-bold uppercase">{o.tipo_servicio || 'Local'}</span></td>
                            <td className="py-2.5 text-white font-semibold">{o.cliente_nombre || 'Cliente General'}</td>
                            <td className="py-2.5 text-neutral-300 max-w-xs truncate">{formatearItems(o.items)}</td>
                            <td className="py-2.5 text-white font-bold">$ {Number(o.subtotal || 0).toLocaleString()}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${esPagado ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                                {esPagado ? 'Pagado' : 'Por Pagar'} ({o.metodo_pago || 'Efectivo'})
                              </span>
                            </td>
                            <td className="py-2.5">
                              {estaBloqueado ? (
                                <span className={`px-2 py-1 rounded-lg text-[11px] font-bold inline-block uppercase ${estadoPedidoRaw === 'listo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                  {o.estado} (Bloqueado)
                                </span>
                              ) : (
                                <select 
                                  value={o.estado || 'Pendiente'}
                                  onChange={(e) => cambiarEstadoOrden(o.id, e.target.value)}
                                  className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-amber-400 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                                >
                                  <option value="Pendiente">⏳ Pendiente</option>
                                  <option value="En Proceso">🔄 En Proceso</option>
                                  <option value="Listo">✅ Listo</option>
                                  <option value="Entregado">🚀 Entregado</option>
                                  <option value="Cancelado">❌ Cancelado</option>
                                </select>
                              )}
                            </td>
                            <td className="py-2.5 text-right space-x-1">
                              <button onClick={() => abrirDetalleOrden(o)} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1 text-[11px]">
                                <Edit3 className="w-3 h-3 text-amber-400" /> Ver/Editar
                              </button>
                              <button onClick={() => imprimirTicket(o)} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1 text-[11px]">
                                <Printer className="w-3 h-3 text-amber-400" /> Ticket
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center pt-2 border-t border-neutral-800 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <span>Mostrando del <strong>{totalRegistros > 0 ? indicePrimerRegistro + 1 : 0}</strong> al <strong>{Math.min(indiceUltimoRegistro, totalRegistros)}</strong> de <strong>{totalRegistros}</strong> órdenes</span>
                    <select value={registrosPorPagina} onChange={(e) => { setRegistrosPorPagina(Number(e.target.value)); setPaginaActualOrdenes(1); }} className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-0.5 text-white font-bold focus:outline-none text-[11px]">
                      <option value="5">5 por pág</option>
                      <option value="10">10 por pág</option>
                      <option value="20">20 por pág</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => cambiarPagina(paginaActualOrdenes - 1)} disabled={paginaActualOrdenes === 1} className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 disabled:opacity-40 cursor-pointer">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2.5 py-0.5 bg-neutral-950 border border-neutral-800 rounded-lg font-bold text-amber-400 text-[11px]">{paginaActualOrdenes} / {totalPaginas}</span>
                    <button onClick={() => cambiarPagina(paginaActualOrdenes + 1)} disabled={paginaActualOrdenes === totalPaginas} className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 disabled:opacity-40 cursor-pointer">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modalOrdenAbierto && ordenSeleccionada && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
                        Editar Orden #{ordenSeleccionada.numero_orden} (ID: {ordenSeleccionada.id})
                      </h3>
                      <p className="text-[10px] text-neutral-400">Cliente: {ordenSeleccionada.cliente_nombre || 'Cliente General'}</p>
                    </div>
                    <button onClick={() => setModalOrdenAbierto(false)} className="p-1 bg-neutral-950 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Artículos en el Pedido</h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {itemsEditables.length === 0 ? (
                          <p className="text-xs text-neutral-500 italic py-2">No hay artículos en la orden.</p>
                        ) : (
                          itemsEditables.map((item, idx) => (
                            <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-white truncate max-w-[140px]">{item.nombre}</span>
                                <span className="text-amber-400 font-bold">$ {Number((item.precio || 0) * (item.cantidad || 1)).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                                  <button onClick={() => actualizarCantidadItemModal(idx, -1)} className="text-neutral-400 hover:text-white font-black px-1 cursor-pointer">-</button>
                                  <span className="text-xs font-bold text-white">{item.cantidad || 1}</span>
                                  <button onClick={() => actualizarCantidadItemModal(idx, 1)} className="text-neutral-400 hover:text-white font-black px-1 cursor-pointer">+</button>
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Nota/Observación ítem..." 
                                  value={item.observacion || ''}
                                  onChange={(e) => actualizarNotaItemModal(idx, e.target.value)}
                                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="pt-2 border-t border-neutral-800 flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-400">Total Calculado:</span>
                        <span className="font-black text-white">$ {itemsEditables.reduce((acc, curr) => acc + (Number(curr.precio || 0) * Number(curr.cantidad || 1)), 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Añadir más artículos</h4>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            placeholder="Buscador sencillo de menú..." 
                            value={busquedaProductoModal}
                            onChange={(e) => setBusquedaProductoModal(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                          />
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {productosFiltradosModal.map(p => (
                            <div key={p.id} className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-2 flex justify-between items-center hover:border-amber-500/50 transition-all">
                              <div>
                                <p className="text-xs font-bold text-white truncate max-w-[150px]">{p.nombre}</p>
                                <span className="text-[10px] text-amber-400 font-semibold">$ {Number(p.precio).toLocaleString()}</span>
                              </div>
                              <button onClick={() => agregarItemAOrdenModal(p)} className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg text-[10px] cursor-pointer shadow">
                                + Añadir
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-neutral-300 block">Modificar Observaciones Generales</label>
                        <textarea 
                          rows="2" 
                          value={observacionesEditables}
                          onChange={(e) => setObservacionesEditables(e.target.value)}
                          placeholder="Notas generales de la orden..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-800 flex justify-end gap-2">
                    <button type="button" onClick={() => setModalOrdenAbierto(false)} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer">
                      Cancelar
                    </button>
                    <button type="button" onClick={guardarCambiosOrdenModal} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-4 py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-amber-500/25">
                      Guardar y Notificar a Cocina
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'contabilidad': {
        const ordenesFiltradas = ordenes.filter(o => {
          if (!fechaInicio || !fechaFin) return true;
          const fechaCreacion = o.creado_en ? o.creado_en.split('T')[0] : '';
          return fechaCreacion >= fechaInicio && fechaCreacion <= fechaFin;
        });

        const totalVentasPeriodo = ordenesFiltradas
          .filter(o => o.estado_pago === 'Pagado')
          .reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0);
        
        const totalOrdenesPeriodo = ordenesFiltradas.length;

        const agrupadoPorDia = ordenesFiltradas.reduce((acc, curr) => {
          const fecha = curr.creado_en ? curr.creado_en.split('T')[0] : 'Sin fecha';
          if (!acc[fecha]) {
            acc[fecha] = { fecha, totalVentas: 0, cantidadPedidos: 0, efectivo: 0, digital: 0 };
          }
          acc[fecha].cantidadPedidos += 1;
          if (curr.estado_pago === 'Pagado') {
            acc[fecha].totalVentas += Number(curr.subtotal || 0);
            if (curr.metodo_pago && curr.metodo_pago.toLowerCase().includes('efectivo')) {
              acc[fecha].efectivo += Number(curr.subtotal || 0);
            } else {
              acc[fecha].digital += Number(curr.subtotal || 0);
            }
          }
          return acc;
        }, {});

        const listaDiasAgrupados = Object.values(agrupadoPorDia).sort((a, b) => b.fecha.localeCompare(a.fecha));

        const filtrarHoyContabilidad = () => {
          const hoyStr = new Date().toISOString().split('T')[0];
          setFechaInicio(hoyStr);
          setFechaFin(hoyStr);
        };

        const cerrarCajaHoy = () => {
          const hoyStr = new Date().toISOString().split('T')[0];
          const ventasHoy = ordenes.filter(o => {
            const fCreacion = o.creado_en ? o.creado_en.split('T')[0] : '';
            return fCreacion === hoyStr && o.estado_pago === 'Pagado';
          }).reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0);

          setEstadoCajaCerrada(true);
          alert(`¡Caja de hoy (${hoyStr}) cerrada con éxito!\nTotal recaudado: $ ${ventasHoy.toLocaleString()}`);
        };

        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5">
              <div>
                <h2 className="text-base md:text-lg font-black text-white">Contabilidad y Reportes Financieros</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Cierre de caja, auditoría por fechas y exportación a CSV.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={filtrarHoyContabilidad} className="bg-neutral-900 border border-neutral-800 hover:border-amber-500 text-amber-400 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-md">
                  Filtrar Hoy
                </button>
                <button onClick={exportarACSV} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer shrink-0">
                  <Download className="w-3.5 h-3.5" /> Exportar Reporte CSV / Excel
                </button>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Filtrar por Rango de Fechas</h4>
                  <p className="text-[10px] text-neutral-400">Selecciona el periodo de consulta</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <div className="flex flex-col">
                  <label className="text-[10px] text-neutral-400 mb-0.5 font-semibold">Desde:</label>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none cursor-pointer" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-neutral-400 mb-0.5 font-semibold">Hasta:</label>
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Ingresos del Periodo</span>
                <p className="text-base font-black text-white mt-1">$ {totalVentasPeriodo.toLocaleString()}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total Pedidos</span>
                <p className="text-base font-black text-amber-400 mt-1">{totalOrdenesPeriodo}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg flex flex-col justify-between">
                <div>
                  <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Estado de Caja</span>
                  <p className="text-base font-black text-emerald-400 mt-1">{estadoCajaCerrada ? 'Caja Cerrada' : 'Cuadre OK'}</p>
                </div>
                <button 
                  onClick={cerrarCajaHoy}
                  className="mt-2 w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-black transition-all cursor-pointer shadow"
                >
                  Cerrar caja de hoy
                </button>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2.5 shadow-lg">
              <h3 className="text-xs font-bold text-white">Desglose de Ingresos Agrupados por Día</h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs min-w-[550px]">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                      <th className="pb-2.5">Fecha</th>
                      <th className="pb-2.5 text-center">N° Pedidos</th>
                      <th className="pb-2.5">Efectivo</th>
                      <th className="pb-2.5">Digital</th>
                      <th className="pb-2.5 text-right">Total Ingresos Día</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {listaDiasAgrupados.length > 0 ? (
                      listaDiasAgrupados.map(dia => (
                        <tr key={dia.fecha} className="hover:bg-neutral-800/40">
                          <td className="py-2.5 font-bold text-white">{dia.fecha}</td>
                          <td className="py-2.5 text-center font-bold text-amber-400">{dia.cantidadPedidos}</td>
                          <td className="py-2.5 text-neutral-300">$ {dia.efectivo.toLocaleString()}</td>
                          <td className="py-2.5 text-neutral-300">$ {dia.digital.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-black text-white">$ {dia.totalVentas.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="py-6 text-center text-neutral-500">No hay registros en el rango.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      case 'menu':
        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base md:text-lg font-black text-white">Gestión del Menú</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Administra platos, precios y disponibilidad.</p>
              </div>
              <button onClick={abrirModalCrear} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg">
                <Plus className="w-3.5 h-3.5" /> Crear Producto
              </button>
            </div>

            {cargandoMenu ? (
              <div className="py-20 text-center text-neutral-500 text-xs">Cargando menú...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {productos.map(p => (
                  <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between gap-2.5 shadow-lg">
                    <div className="flex gap-2.5 items-start">
                      {p.imagen ? (
                        <img src={p.imagen} alt={p.nombre} className="w-12 h-12 rounded-xl object-cover border border-neutral-800 shrink-0 bg-neutral-950" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-600 shrink-0"><ImageIcon className="w-4 h-4" /></div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="px-2 py-0.5 bg-neutral-800 text-amber-400 rounded-md text-[9px] font-bold uppercase mb-1 inline-block">{obtenerNombreCategoria(p.categoria_id)}</span>
                        <h3 className="text-xs font-bold text-white truncate">{p.nombre}</h3>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">{p.descripcion || 'Sin descripción.'}</p>
                        <p className="text-xs font-black text-white mt-1">$ {Number(p.precio).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => cambiarDisponibilidad(p.id, p.disponible)} className={`w-9 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${p.disponible ? 'bg-emerald-500' : 'bg-neutral-800'}`}>
                          <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${p.disponible ? 'translate-x-4.5' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-[10px] font-bold ${p.disponible ? 'text-emerald-400' : 'text-neutral-500'}`}>{p.disponible ? 'Disponible' : 'Agotado'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirModalEditar(p)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => eliminarProducto(p.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {modalMenuAbierto && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <h3 className="text-xs font-black text-white">{modoEdicion ? 'Modificar Producto' : 'Crear Artículo'}</h3>
                    <button onClick={() => setModalMenuAbierto(false)} className="p-1 bg-neutral-950 rounded-lg text-neutral-400 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <form onSubmit={guardarProducto} className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Nombre *</label>
                      <input type="text" required value={formNombre} onChange={(e) => setFormNombre(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Categoría</label>
                        <select value={formCategoriaId} onChange={(e) => setFormCategoriaId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none cursor-pointer">
                          {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Precio *</label>
                        <input type="number" step="0.01" required value={formPrecio} onChange={(e) => setFormPrecio(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Descripción</label>
                      <textarea rows="2" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none resize-none" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">URL Imagen</label>
                      <input type="url" value={formImagen} onChange={(e) => setFormImagen(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" />
                    </div>
                    <div className="pt-2 flex gap-2.5">
                      <button type="button" onClick={() => setModalMenuAbierto(false)} className="w-1/2 bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">Cancelar</button>
                      <button type="submit" className="w-1/2 bg-amber-500 text-neutral-950 font-black py-2 rounded-xl text-xs cursor-pointer">Guardar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (cargandoInicial) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 bg-amber-500 text-neutral-950 rounded-xl flex items-center justify-center font-black mx-auto animate-pulse">
            <Store className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-neutral-400 tracking-wider">Cargando VertizzeOrder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-white overflow-hidden select-none">
      
      {ordenImprimiendo && (
        <div id="print-area" className="hidden print:block print:absolute print:inset-0 print:bg-white print:text-black print:p-6 print:z-50">
          <div className="text-center space-y-1 mb-4">
            <h2 className="text-lg font-black">VERTIZZE ORDER</h2>
            <p className="text-xs">Comprobante de Venta</p>
            <p className="text-xs font-bold">Orden N°: {ordenImprimiendo.numero_orden}</p>
          </div>
          <div className="text-xs space-y-1 border-t border-b border-black py-2 my-2">
            <p><strong>Cliente:</strong> {ordenImprimiendo.cliente_nombre || 'General'}</p>
            <p><strong>Tipo Servicio:</strong> {ordenImprimiendo.tipo_servicio || 'Local'}</p>
          </div>
          <div className="text-xs space-y-1 my-2">
            <p className="font-bold">Ítems:</p>
            <p className="whitespace-pre-wrap">{formatearItems(ordenImprimiendo.items)}</p>
          </div>
          <div className="text-xs border-t border-black pt-2 mt-4 space-y-1 font-bold">
            <p className="flex justify-between"><span>Subtotal:</span> <span>$ {Number(ordenImprimiendo.subtotal || 0).toLocaleString()}</span></p>
          </div>
        </div>
      )}

      {menuMovilAbierto && <div onClick={() => setMenuMovilAbierto(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 h-full ${menuColapsado ? 'lg:w-20' : 'w-64'} bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 transition-all duration-300 transform ${menuMovilAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0">
          {!menuColapsado ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 bg-amber-500 text-neutral-950 rounded-xl flex items-center justify-center font-black shrink-0"><Store className="w-4 h-4" /></div>
              <div className="overflow-hidden">
                <h3 className="text-xs font-black text-white uppercase truncate">VertizzeOrder</h3>
                <span className="text-[9px] text-amber-500 font-semibold block">ADMIN DB</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto hidden lg:flex"><div className="w-9 h-9 bg-amber-500 text-neutral-950 rounded-xl flex items-center justify-center font-black"><Store className="w-4 h-4" /></div></div>
          )}
          {!menuColapsado && <button onClick={() => setMenuColapsado(true)} className="hidden lg:flex p-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 cursor-pointer"><X className="w-4 h-4" /></button>}
          <button onClick={() => setMenuMovilAbierto(false)} className="lg:hidden p-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {[
            { id: 'resumen', label: 'Resumen General', icon: LayoutDashboard },
            { id: 'clientes', label: 'Módulo Clientes', icon: Users },
            { id: 'pagos', label: 'Control de Pagos', icon: CreditCard },
            { id: 'ordenes', label: 'Gestión de Órdenes', icon: ClipboardList },
            { id: 'contabilidad', label: 'Contabilidad', icon: FileSpreadsheet },
            { id: 'menu', label: 'Gestión de Menú', icon: Utensils },
          ].map((item) => {
            const Icon = item.icon;
            const activo = vistaActual === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setVistaActual(item.id); setMenuMovilAbierto(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activo ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20' : 'text-neutral-400 hover:bg-neutral-950 hover:text-white'} ${menuColapsado ? 'lg:justify-center' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={`${menuColapsado ? 'lg:hidden' : 'inline'} truncate`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-neutral-800 shrink-0">
          <button onClick={() => alert('Cerrando sesión...')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 cursor-pointer ${menuColapsado ? 'lg:justify-center' : ''}`}>
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={`${menuColapsado ? 'lg:hidden' : 'inline'}`}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-neutral-950">
        <header className="h-16 bg-neutral-900 border-b border-neutral-800 px-5 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuMovilAbierto(true)} className="lg:hidden p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400"><Menu className="w-5 h-5" /></button>
            <h1 className="text-xs md:text-sm font-black text-white tracking-tight uppercase">Panel Administrativo</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-5 bg-neutral-950">
          <div className="max-w-7xl mx-auto w-full">{renderizarModulo()}</div>
        </main>
      </div>

    </div>
  );
}