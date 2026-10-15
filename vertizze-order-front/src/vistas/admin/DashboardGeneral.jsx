// ============================================================================
// ARCHIVO: src/vistas/DashboardGeneral.jsx
// DESCRIPCIÓN: Panel con Resumen 100% Real y Filtrado por Fechas, Egresos, Clientes, Domiciliarios, Pagos, Órdenes, Contabilidad y Menú.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Menu, X, LayoutDashboard, FileSpreadsheet, 
  ClipboardList, Utensils, LogOut, Store, ExternalLink,
  Plus, Calendar, Download, Edit3, Trash2, Image as ImageIcon, CheckCircle, Clock, Printer, CreditCard, AlertCircle, ArrowUpRight, Search, Filter, ChevronLeft, ChevronRight, Users, Phone, MapPin, Receipt, FileText, Truck
} from 'lucide-react';
import { obtenerMenu, supabase } from '../../sdk/vertizzeApi';

export default function DashboardGeneral() {
  const [menuColapsado, setMenuColapsado] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [vistaActual, setVistaActual] = useState('resumen'); 

  // Fecha actual por defecto en formato YYYY-MM-DD
  const fechaHoyStr = new Date().toISOString().split('T')[0];

  // Estado general de carga inicial para evitar pantalla en negro al actualizar
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // Estados específicos para el Rango de Fechas del Resumen y Contabilidad
  const [fechaInicio, setFechaInicio] = useState(fechaHoyStr);
  const [fechaFin, setFechaFin] = useState(fechaHoyStr);
  const [estadoCajaCerrada, setEstadoCajaCerrada] = useState(false);

  // Estado de Órdenes conectado a la base de datos
  const [ordenes, setOrdenes] = useState([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(true);

  // Estados para el Módulo de Egresos / Facturas (CRUD Completo y Paginación)
  const [egresos, setEgresos] = useState([]);
  const [cargandoEgresos, setCargandoEgresos] = useState(true);
  const [busquedaEgreso, setBusquedaEgreso] = useState('');
  const [paginaActualEgresos, setPaginaActualEgresos] = useState(1);
  const [registrosPorPaginaEgresos, setRegistrosPorPaginaEgresos] = useState(10);
  
  // Estados para Modal de Edición de Egresos
  const [modalEgresoAbierto, setModalEgresoAbierto] = useState(false);
  const [egresoSeleccionado, setEgresoSeleccionado] = useState(null);
  const [formProveedorEgreso, setFormProveedorEgreso] = useState('');
  const [formArticuloEgreso, setFormArticuloEgreso] = useState('');
  const [formCantidadEgreso, setFormCantidadEgreso] = useState(1);
  const [formPrecioUnitarioEgreso, setFormPrecioUnitarioEgreso] = useState('');

  // Estados para el Módulo de Clientes (con Paginación e Historial)
  const [clientes, setClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [modoEdicionCliente, setModoEdicionCliente] = useState(false);
  const [paginaActualClientes, setPaginaActualClientes] = useState(1);
  const [registrosPorPaginaClientes, setRegistrosPorPaginaClientes] = useState(10);
  
  // Estados para el Modal de Historial y Comportamiento de Cliente
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [clienteSeleccionadoHistorial, setClienteSeleccionadoHistorial] = useState(null);

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

  // Función auxiliar para formatear a mayúscula inicial (Capitalize)
  const capitalizarTexto = (texto) => {
    if (!texto) return '';
    const str = String(texto).trim();
    if (str === '') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Función auxiliar para limpiar y formatear el teléfono
  const limpiarTelefono = (tel) => {
    if (!tel) return 'N/A';
    let limpio = String(tel).trim();
    if (limpio.startsWith('+57')) {
      limpio = limpio.replace('+57', '');
    } else if (limpio.startsWith('57') && limpio.length > 10) {
      limpio = limpio.replace('57', '');
    }
    limpio = limpio.replace(/\D/g, ''); 
    return limpio.trim() !== '' ? limpio : 'N/A';
  };

  // Función auxiliar para formatear la dirección
  const formatearDireccion = (dir) => {
    if (dir === null || dir === undefined) return 'N/A';
    const dStr = String(dir).trim();
    const dLower = dStr.toLowerCase();
    
    if (dLower === '' || dLower === 'no especificada' || dLower.includes('mesa') || /^\d+$/.test(dStr)) {
      return 'N/A';
    }
    return capitalizarTexto(dStr);
  };

  // Función para parsear JSON crudo de ítems o arrays de detalle
  const formatearItems = (itemsRaw) => {
    if (!itemsRaw) return 'Sin detalle';
    let items = itemsRaw;
    if (typeof itemsRaw === 'string') {
      try {
        items = JSON.parse(itemsRaw);
      } catch (e) {
        return capitalizarTexto(itemsRaw);
      }
    }
    if (Array.isArray(items)) {
      return items.map(item => {
        const cantidad = item.cantidad || item.stock || 1;
        const nombre = item.nombre || item.producto || item.descripcion || '';
        const nombreCapitalizado = capitalizarTexto(nombre) || 'Artículo';
        const precioItem = item.precio ? ` ($ ${Number(item.precio).toLocaleString()})` : '';
        let texto = `${cantidad}x ${nombreCapitalizado}${precioItem}`;
        if (item.observacion) {
          texto += ` (Nota: ${item.observacion})`;
        }
        return texto;
      }).join(', ');
    }
    return String(itemsRaw);
  };

  // Sincronizar automáticamente o insertar cliente basado en las órdenes
  const sincronizarClientesDesdeOrdenes = async (listaOrdenes) => {
    try {
      for (const ord of listaOrdenes) {
        const telOrd = limpiarTelefono(ord.cliente_telefono || ord.telefono);
        const nomOrd = ord.cliente_nombre || ord.nombre_cliente;

        if (telOrd && telOrd !== 'N/A' && nomOrd && nomOrd.toLowerCase() !== 'cliente general') {
          const { data: existeCli } = await supabase
            .from('clientes')
            .select('telefono')
            .eq('telefono', telOrd)
            .maybeSingle();

          const dirFormateada = formatearDireccion(ord.direccion || ord.cliente_direccion);

          if (!existeCli) {
            await supabase.from('clientes').insert([{
              telefono: telOrd,
              nombre: capitalizarTexto(nomOrd),
              direccion: dirFormateada,
              observaciones: ord.observaciones || 'Registrado automáticamente desde Órdenes'
            }]);
          }
        }
      }
    } catch (err) {
      console.error("Error sincronizando clientes:", err.message);
    }
  };

  // Cargar datos iniciales y configurar canales en Tiempo Real
  useEffect(() => {
    cargarDatosBD();

    const timerSeguridad = setTimeout(() => {
      setCargandoInicial(false);
      setCargandoOrdenes(false);
      setCargandoClientes(false);
      setCargandoMenu(false);
      setCargandoEgresos(false);
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'facturas' },
        (payload) => { cargarDatosBD(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'detalle_facturas' },
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
      const [resProductos, resCategorias, resOrdenes, resClientes, resFacturas] = await Promise.all([
        supabase.from('productos').select('*').order('id', { ascending: true }),
        supabase.from('categorias').select('*').order('id', { ascending: true }),
        supabase.from('ordenes').select('*').order('id', { ascending: false }),
        supabase.from('clientes').select('*').order('creado_en', { ascending: false }),
        supabase.from('facturas').select('*, detalle_facturas(*)').order('id', { ascending: false })
      ]);

      setProductos(resProductos.data || []);
      setCategorias(resCategorias.data || []);
      setOrdenes(resOrdenes.data || []);
      setClientes(resClientes.data || []);

      const listaEgresosAplanada = [];
      if (resFacturas.data) {
        resFacturas.data.forEach(f => {
          if (f.detalle_facturas && Array.isArray(f.detalle_facturas) && f.detalle_facturas.length > 0) {
            f.detalle_facturas.forEach(df => {
              listaEgresosAplanada.push({
                id_detalle: df.id,
                factura_id: f.id,
                proveedor: f.proveedor || 'N/A',
                articulo: df.articulo || df.nombre || 'Sin artículo',
                cantidad: df.cantidad || 1,
                precio_unitario: df.costo_unitario || df.precio || 0,
                precio_total: Number(df.cantidad || 1) * Number(df.costo_unitario || df.precio || 0),
                fecha_compra: f.fecha || f.creado_en || 'N/A',
                fecha_registro: df.created_at || 'N/A'
              });
            });
          } else {
            listaEgresosAplanada.push({
              id_detalle: null,
              factura_id: f.id,
              proveedor: f.proveedor || 'N/A',
              articulo: f.descripcion || 'Factura general',
              cantidad: 1,
              precio_unitario: f.total || f.subtotal || 0,
              precio_total: f.total || f.subtotal || 0,
              fecha_compra: f.fecha || f.creado_en || 'N/A',
              fecha_registro: f.creado_en || 'N/A'
            });
          }
        });
      }
      setEgresos(listaEgresosAplanada);

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
      setCargandoEgresos(false);
      setCargandoInicial(false);
    }
  };

  const abrirModalEditarEgreso = (item) => {
    setEgresoSeleccionado(item);
    setFormProveedorEgreso(item.proveedor || '');
    setFormArticuloEgreso(item.articulo || '');
    setFormCantidadEgreso(item.cantidad || 1);
    setFormPrecioUnitarioEgreso(item.precio_unitario || '');
    setModalEgresoAbierto(true);
  };

  const guardarEgresoEditado = async (e) => {
    e.preventDefault();
    if (!egresoSeleccionado) return;

    try {
      const { error: errFactura } = await supabase
        .from('facturas')
        .update({ proveedor: formProveedorEgreso })
        .eq('id', egresoSeleccionado.factura_id);

      if (errFactura) throw errFactura;

      if (egresoSeleccionado.id_detalle) {
        const { error: errDetalle } = await supabase
          .from('detalle_facturas')
          .update({
            articulo: formArticuloEgreso,
            cantidad: Number(formCantidadEgreso),
            costo_unitario: Number(formPrecioUnitarioEgreso)
          })
          .eq('id', egresoSeleccionado.id_detalle);

        if (errDetalle) throw errDetalle;
      }

      alert('¡Egreso/Factura actualizado con éxito!');
      setModalEgresoAbierto(false);
      cargarDatosBD();
    } catch (error) {
      console.error("Error al actualizar egreso:", error.message);
      alert("Hubo un error al guardar los cambios del egreso: " + error.message);
    }
  };

  const eliminarEgreso = async (item) => {
    if (window.confirm(`¿Estás seguro de eliminar el registro de la factura #${item.factura_id}? Esta acción eliminará el detalle asociado.`)) {
      try {
        if (item.id_detalle) {
          const { error: errDet } = await supabase.from('detalle_facturas').delete().eq('id', item.id_detalle);
          if (errDet) throw errDet;
        }

        const { error: errFac } = await supabase.from('facturas').delete().eq('id', item.factura_id);
        if (errFac) throw errFac;

        cargarDatosBD();
      } catch (error) {
        console.error("Error al eliminar egreso:", error.message);
        alert("No se pudo eliminar el registro de egreso.");
      }
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

  const abrirModalHistorialCliente = (cli) => {
    setClienteSeleccionadoHistorial(cli);
    setModalHistorialAbierto(true);
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    const telLimpio = limpiarTelefono(formTelefonoCliente);
    if (!telLimpio || telLimpio === 'N/A' || !formNombreCliente) {
      alert('El teléfono válido y el nombre son obligatorios.');
      return;
    }

    const nombreCap = capitalizarTexto(formNombreCliente);
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
        // Filtrar órdenes por el rango de fechas seleccionado (fechaInicio a fechaFin) en tiempo real
        const ordenesFiltradas = ordenes.filter(o => {
          if (!fechaInicio || !fechaFin) return true;
          const fechaCreacion = o.creado_en ? o.creado_en.split('T')[0] : '';
          return fechaCreacion >= fechaInicio && fechaCreacion <= fechaFin;
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

        // Cálculo del producto estrella en tiempo real basado en el rango de fechas filtrado
        const conteoProductos = {};
        ordenesFiltradas.forEach(o => {
          let items = o.items;
          if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { items = []; }
          }
          if (Array.isArray(items)) {
            items.forEach(i => {
              const nombreProd = capitalizarTexto(i.nombre || i.producto || i.descripcion || 'General');
              const cantidadProd = Number(i.cantidad || i.stock || 1);
              conteoProductos[nombreProd] = (conteoProductos[nombreProd] || 0) + cantidadProd;
            });
          }
        });

        let platoEstrella = 'Sin datos';
        let maxCantidad = 0;
        Object.entries(conteoProductos).forEach(([prod, cant]) => {
          if (cant > maxCantidad) {
            maxCantidad = cant;
            platoEstrella = `${prod} (${cant} un.)`;
          }
        });

        const ordenesPendientesCocina = ordenes.filter(o => {
          const est = o.estado ? o.estado.toLowerCase().trim() : '';
          return est === 'pendiente' || est === 'en proceso';
        });

        const ordenesPendientesCobro = ordenes.filter(o => {
          const estPag = o.estado_pago ? o.estado_pago.toLowerCase().trim() : '';
          return estPag !== 'pagado';
        });

        const filtrarHoyResumen = () => {
          const hoyStr = new Date().toISOString().split('T')[0];
          setFechaInicio(hoyStr);
          setFechaFin(hoyStr);
        };

        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl shadow-lg">
              <div>
                <h2 className="text-base md:text-lg font-black text-white">Resumen General y Analíticas en Tiempo Real</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Métricas gerenciales y toma de decisiones basadas en el rango de fechas seleccionado.</p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button 
                  onClick={filtrarHoyResumen}
                  className="px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-neutral-950 border border-neutral-800 text-amber-400 hover:text-white"
                >
                  Hoy
                </button>
                <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <div className="flex items-center gap-1 text-xs">
                    <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="bg-transparent text-white font-bold focus:outline-none cursor-pointer" />
                    <span className="text-neutral-500">-</span>
                    <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="bg-transparent text-white font-bold focus:outline-none cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Ventas Confirmadas</span>
                <p className="text-base font-black text-white mt-1">$ {ventasTotales.toLocaleString()}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">Periodo actual filtrado</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total Órdenes</span>
                <p className="text-base font-black text-amber-400 mt-1">{totalOrdenes}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">Pedidos en el periodo</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Ticket Promedio</span>
                <p className="text-base font-black text-white mt-1">$ {ticketPromedio.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">Valor medio por pedido</span>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Plato Estrella (Top)</span>
                <p className="text-sm font-black text-emerald-400 mt-1 truncate" title={platoEstrella}>{platoEstrella}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">Más solicitado</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Pagos en Efectivo</span>
                  <p className="text-sm font-black text-white mt-0.5">$ {totalEfectivo.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">💵</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Pagos en Transferencias</span>
                  <p className="text-sm font-black text-white mt-0.5">$ {totalDigital.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">📱</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Clientes Atendidos</span>
                  <p className="text-sm font-black text-amber-400 mt-0.5">{totalClientesUnicos} Clientes</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">👥</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {/* Sección con scroll interno */}
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
                          <span className="text-[10px] font-bold text-amber-400">#{o.numero_orden} - {capitalizarTexto(o.cliente_nombre) || 'Cliente'}</span>
                          <p className="text-[11px] text-neutral-300 truncate max-w-xs">{formatearItems(o.items)}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-bold shrink-0">{capitalizarTexto(o.estado) || 'Pendiente'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sección con scroll interno */}
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
                          <span className="text-[10px] font-bold text-emerald-400">#{o.numero_orden} - {capitalizarTexto(o.cliente_nombre) || 'Cliente'}</span>
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

      case 'egresos': {
        const egresosFiltrados = egresos.filter(e => {
          const busq = busquedaEgreso.toLowerCase();
          return (
            (e.factura_id && String(e.factura_id).toLowerCase().includes(busq)) ||
            (e.proveedor && String(e.proveedor).toLowerCase().includes(busq)) ||
            (e.articulo && String(e.articulo).toLowerCase().includes(busq))
          );
        });

        const totalRegistrosEgresos = egresosFiltrados.length;
        const totalPaginasEgresos = Math.ceil(totalRegistrosEgresos / registrosPorPaginaEgresos) || 1;
        const indiceUltimoEgreso = paginaActualEgresos * registrosPorPaginaEgresos;
        const indicePrimerEgreso = indiceUltimoEgreso - registrosPorPaginaEgresos;
        const egresosPaginados = egresosFiltrados.slice(indicePrimerEgreso, indiceUltimoEgreso);

        const cambiarPaginaEgresos = (nuevaPag) => {
          if (nuevaPag >= 1 && nuevaPag <= totalPaginasEgresos) {
            setPaginaActualEgresos(nuevaPag);
          }
        };

        const totalEgresosSuma = egresosFiltrados.reduce((acc, curr) => acc + Number(curr.precio_total || 0), 0);

        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
              <div>
                <h2 className="text-base md:text-lg font-black text-white">Módulo de Egresos y Facturación (CRUD)</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Control completo de facturas, paginación, edición y eliminación de registros.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Buscar por factura, proveedor o artículo..."
                    value={busquedaEgreso}
                    onChange={(e) => { setBusquedaEgreso(e.target.value); setPaginaActualEgresos(1); }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Costo Total (Precio Total)</span>
                <p className="text-base font-black text-white mt-1">$ {totalEgresosSuma.toLocaleString()}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Registros Detallados</span>
                <p className="text-base font-black text-emerald-400 mt-1">{egresosFiltrados.length} líneas</p>
              </div>
            </div>

            {cargandoEgresos ? (
              <div className="py-20 text-center text-neutral-500 text-xs">Cargando facturas y detalles...</div>
            ) : egresosFiltrados.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-2 shadow-lg">
                <div className="w-9 h-9 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <Receipt className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-xs font-bold text-white">No hay registros de facturas / egresos</h3>
                <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">Verifica que existan datos en las tablas `facturas` y `detalle_facturas`.</p>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-3 shadow-lg">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs min-w-[900px]">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                        <th className="pb-2.5">Factura ID</th>
                        <th className="pb-2.5">Proveedor</th>
                        <th className="pb-2.5">Artículo</th>
                        <th className="pb-2.5 text-center">Cantidad</th>
                        <th className="pb-2.5">Precio Unitario</th>
                        <th className="pb-2.5">Precio Total</th>
                        <th className="pb-2.5">Fecha Compra</th>
                        <th className="pb-2.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {egresosPaginados.map((item, index) => (
                        <tr key={index} className="hover:bg-neutral-800/40">
                          <td className="py-2.5 font-bold text-amber-400">#{item.factura_id}</td>
                          <td className="py-2.5 text-white font-semibold">{capitalizarTexto(item.proveedor)}</td>
                          <td className="py-2.5 text-neutral-200">{capitalizarTexto(item.articulo)}</td>
                          <td className="py-2.5 text-center font-bold text-amber-400">{item.cantidad}</td>
                          <td className="py-2.5 text-neutral-300">$ {Number(item.precio_unitario || 0).toLocaleString()}</td>
                          <td className="py-2.5 text-white font-black">$ {Number(item.precio_total || 0).toLocaleString()}</td>
                          <td className="py-2.5 text-neutral-400">{String(item.fecha_compra).split('T')[0]}</td>
                          <td className="py-2.5 text-right space-x-1">
                            <button onClick={() => abrirModalEditarEgreso(item)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-all cursor-pointer inline-block" title="Editar Egreso">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => eliminarEgreso(item)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer inline-block" title="Eliminar Egreso">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center pt-2 border-t border-neutral-800 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <span>Mostrando del <strong>{totalRegistrosEgresos > 0 ? indicePrimerEgreso + 1 : 0}</strong> al <strong>{Math.min(indiceUltimoEgreso, totalRegistrosEgresos)}</strong> de <strong>{totalRegistrosEgresos}</strong> egresos</span>
                    <select 
                      value={registrosPorPaginaEgresos}
                      onChange={(e) => { setRegistrosPorPaginaEgresos(Number(e.target.value)); setPaginaActualEgresos(1); }}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-0.5 text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer ml-1 text-[11px]"
                    >
                      <option value="5">5 por pág</option>
                      <option value="10">10 por pág</option>
                      <option value="20">20 por pág</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => cambiarPaginaEgresos(paginaActualEgresos - 1)}
                      disabled={paginaActualEgresos === 1}
                      className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2.5 py-0.5 bg-neutral-950 border border-neutral-800 rounded-lg font-bold text-amber-400 text-[11px]">
                      {paginaActualEgresos} / {totalPaginasEgresos}
                    </span>
                    <button 
                      onClick={() => cambiarPaginaEgresos(paginaActualEgresos + 1)}
                      disabled={paginaActualEgresos === totalPaginasEgresos}
                      className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modalEgresoAbierto && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl relative">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <h3 className="text-xs font-black text-white">Editar Factura / Egreso #{egresoSeleccionado?.factura_id}</h3>
                    <button onClick={() => setModalEgresoAbierto(false)} className="p-1 bg-neutral-950 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={guardarEgresoEditado} className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Proveedor *</label>
                      <input 
                        type="text" required 
                        value={formProveedorEgreso} 
                        onChange={(e) => setFormProveedorEgreso(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Artículo *</label>
                      <input 
                        type="text" required 
                        value={formArticuloEgreso} 
                        onChange={(e) => setFormArticuloEgreso(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Cantidad *</label>
                        <input 
                          type="number" min="1" required 
                          value={formCantidadEgreso} 
                          onChange={(e) => setFormCantidadEgreso(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Precio Unitario *</label>
                        <input 
                          type="number" step="0.01" required 
                          value={formPrecioUnitarioEgreso} 
                          onChange={(e) => setFormPrecioUnitarioEgreso(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2.5">
                      <button type="button" onClick={() => setModalEgresoAbierto(false)} className="w-1/2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">
                        Cancelar
                      </button>
                      <button type="submit" className="w-1/2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer">
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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

        const ordenesClienteHistorial = clienteSeleccionadoHistorial ? ordenes.filter(o => {
          const telOrd = limpiarTelefono(o.cliente_telefono || o.telefono);
          const telCli = limpiarTelefono(clienteSeleccionadoHistorial.telefono);
          const nomOrd = (o.cliente_nombre || '').toLowerCase();
          const nomCli = (clienteSeleccionadoHistorial.nombre || '').toLowerCase();
          return telOrd === telCli || (nomOrd && nomOrd === nomCli);
        }) : [];

        const totalGastadoHistorial = ordenesClienteHistorial.reduce((acc, curr) => acc + Number(curr.subtotal || curr.total || 0), 0);
        const metodosPagoUsados = [...new Set(ordenesClienteHistorial.map(o => capitalizarTexto(o.metodo_pago) || 'Efectivo'))];
        const direccionesUsadas = [...new Set(ordenesClienteHistorial.map(o => formatearDireccion(o.direccion || o.cliente_direccion)).filter(d => d !== 'N/A'))];

        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
              <div>
                <h2 className="text-base md:text-lg font-black text-white">Módulo de Clientes</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Sincronización en tiempo real con datos de órdenes, identificación por número y registro de primer nombre.</p>
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
                        <th className="pb-2.5">Teléfono (Número Único)</th>
                        <th className="pb-2.5">Primer Nombre / Registrado</th>
                        <th className="pb-2.5">Dirección / Ubicación</th>
                        <th className="pb-2.5">Observaciones</th>
                        <th className="pb-2.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {clientesPaginados.map(c => {
                        const telFormateado = limpiarTelefono(c.telefono);
                        const direccionFormateada = formatearDireccion(c.direccion);
                        const nombreFormateado = capitalizarTexto(c.nombre) || 'Sin nombre';
                        
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
                            <td className="py-2.5 text-neutral-400 truncate max-w-xs">{capitalizarTexto(c.observaciones) || 'Ninguna'}</td>
                            <td className="py-2.5 text-right space-x-1">
                              <button onClick={() => abrirModalHistorialCliente(c)} className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all cursor-pointer inline-block" title="Ver Historial, Comportamiento y Direcciones">
                                <ClipboardList className="w-3.5 h-3.5" />
                              </button>
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
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Teléfono / WhatsApp (Número Único) *</label>
                      <input 
                        type="text" required placeholder="3001234567" 
                        value={formTelefonoCliente} 
                        onChange={(e) => setFormTelefonoCliente(e.target.value)}
                        disabled={modoEdicionCliente}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Primer Nombre *</label>
                      <input 
                        type="text" required placeholder="Ej. Carlos" 
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

            {/* Modal de Historial y Comportamiento del Cliente con scroll interno */}
            {modalHistorialAbierto && clienteSeleccionadoHistorial && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full p-4 space-y-3 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <div>
                      <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Historial y Comportamiento:</span> 
                        <span className="text-amber-400">{capitalizarTexto(clienteSeleccionadoHistorial.nombre) || 'Cliente'}</span>
                      </h3>
                      <p className="text-[10px] text-neutral-400">Teléfono (Número Único): {limpiarTelefono(clienteSeleccionadoHistorial.telefono)}</p>
                    </div>
                    <button onClick={() => setModalHistorialAbierto(false)} className="p-1 bg-neutral-950 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase">Total Órdenes</span>
                      <p className="text-base font-black text-amber-400 mt-1">{ordenesClienteHistorial.length} pedidos</p>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase">Inversión Acumulada</span>
                      <p className="text-base font-black text-white mt-1">$ {totalGastadoHistorial.toLocaleString()}</p>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase">Formas de Pago Usadas</span>
                      <p className="text-xs font-bold text-emerald-400 mt-1 truncate">{metodosPagoUsados.join(', ') || 'Efectivo'}</p>
                    </div>
                  </div>

                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-1.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Direcciones Guardadas / Registradas</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {direccionesUsadas.length === 0 ? (
                        <span className="text-xs text-neutral-500 italic">No hay direcciones registradas en órdenes (o usa N/A).</span>
                      ) : (
                        direccionesUsadas.map((dir, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500" /> {dir}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Historial Detallado de Órdenes</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-neutral-800/60 rounded-xl p-2 bg-neutral-950/50">
                      {ordenesClienteHistorial.length === 0 ? (
                        <p className="text-xs text-neutral-500 text-center py-6">Este cliente aún no registra órdenes asociadas en el sistema.</p>
                      ) : (
                        ordenesClienteHistorial.map(ord => {
                          const estadoPagoCap = capitalizarTexto(ord.estado_pago || 'Por pagar');
                          const metodoPagoCap = capitalizarTexto(ord.metodo_pago || 'Efectivo');
                          const tipoServicioCap = capitalizarTexto(ord.tipo_servicio || 'Local');

                          return (
                            <div key={ord.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-amber-400">Orden #{ord.numero_orden} (ID: {ord.id})</span>
                                  <span className="px-2 py-0.5 bg-neutral-900 text-neutral-300 rounded text-[10px] font-semibold">{tipoServicioCap}</span>
                                </div>
                                <p className="text-xs text-neutral-300 mt-1"><strong>Ítems:</strong> {formatearItems(ord.items)}</p>
                                <span className="text-[10px] text-neutral-500 block mt-0.5">Fecha: {ord.creado_en ? ord.creado_en.replace('T', ' ').substring(0, 16) : 'N/A'}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-black text-white">$ {Number(ord.subtotal || ord.total || 0).toLocaleString()}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-1 ${ord.estado_pago?.toLowerCase() === 'pagado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                  {estadoPagoCap} ({metodoPagoCap})
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-800 flex justify-end">
                    <button type="button" onClick={() => setModalHistorialAbierto(false)} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-4 py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-amber-500/20">
                      Cerrar Historial
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'domiciliarios': {
        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
              <div>
                <h2 className="text-base md:text-lg font-black text-white">Módulo de Domiciliarios</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Gestión y control de entregas, repartidores y asignación de despachos.</p>
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center space-y-3 shadow-lg">
              <div className="w-12 h-12 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-center mx-auto text-amber-500">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Módulo preparado y disponible</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">Este espacio se encuentra vacío temporalmente a la espera de configurar las funciones de despacho y domiciliarios.</p>
            </div>
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
                          <h3 className="text-xs font-bold text-white mt-1">{capitalizarTexto(o.cliente_nombre) || 'Cliente General'}</h3>
                          <span className="text-[10px] text-neutral-400 block">{capitalizarTexto(o.tipo_servicio) || 'Local'} • Pedido: <strong className="text-amber-400">{capitalizarTexto(o.estado) || 'Pendiente'}</strong></span>
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
                            <td className="py-2.5"><span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-md text-[10px] font-bold uppercase">{capitalizarTexto(o.tipo_servicio) || 'Local'}</span></td>
                            <td className="py-2.5 text-white font-semibold">{capitalizarTexto(o.cliente_nombre) || 'Cliente General'}</td>
                            <td className="py-2.5 text-neutral-300 max-w-xs truncate">{formatearItems(o.items)}</td>
                            <td className="py-2.5 text-white font-bold">$ {Number(o.subtotal || 0).toLocaleString()}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${esPagado ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                                {esPagado ? 'Pagado' : 'Por Pagar'} ({capitalizarTexto(o.metodo_pago) || 'Efectivo'})
                              </span>
                            </td>
                            <td className="py-2.5">
                              {estaBloqueado ? (
                                <span className={`px-2 py-1 rounded-lg text-[11px] font-bold inline-block uppercase ${estadoPedidoRaw === 'listo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                  {capitalizarTexto(o.estado)} (Bloqueado)
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
                      <p className="text-[10px] text-neutral-400">Cliente: {capitalizarTexto(ordenSeleccionada.cliente_nombre) || 'Cliente General'}</p>
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
                                <span className="font-bold text-white truncate max-w-[140px]">{capitalizarTexto(item.nombre)}</span>
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
                                <p className="text-xs font-bold text-white truncate max-w-[150px]">{capitalizarTexto(p.nombre)}</p>
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
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total Pedidos Periodo</span>
                <p className="text-base font-black text-amber-400 mt-1">{totalOrdenesPeriodo}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Estado de Caja Hoy</span>
                <p className={`text-base font-black mt-1 ${estadoCajaCerrada ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {estadoCajaCerrada ? 'Cerrada' : 'Abierta'}
                </p>
                <button 
                  onClick={cerrarCajaHoy}
                  disabled={estadoCajaCerrada}
                  className="mt-2 w-full py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg text-[10px] transition-all cursor-pointer disabled:opacity-50"
                >
                  {estadoCajaCerrada ? 'Caja Cerrada Hoy' : 'Cerrar Caja de Hoy'}
                </button>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-3 shadow-lg">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Resumen Diario de Ventas</h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                      <th className="pb-2.5">Fecha</th>
                      <th className="pb-2.5 text-center">Pedidos</th>
                      <th className="pb-2.5">Efectivo</th>
                      <th className="pb-2.5">Transferencia / Digital</th>
                      <th className="pb-2.5 text-right">Total Ventas Día</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {listaDiasAgrupados.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-neutral-500 text-xs">No hay datos en el rango seleccionado.</td>
                      </tr>
                    ) : (
                      listaDiasAgrupados.map((d, i) => (
                        <tr key={i} className="hover:bg-neutral-800/40">
                          <td className="py-2.5 font-bold text-amber-400">{d.fecha}</td>
                          <td className="py-2.5 text-center font-bold text-white">{d.cantidadPedidos}</td>
                          <td className="py-2.5 text-neutral-300">$ {d.efectivo.toLocaleString()}</td>
                          <td className="py-2.5 text-neutral-300">$ {d.digital.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-black text-white">$ {d.totalVentas.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      case 'menu': {
        const productosFiltrados = productos.filter(p => {
          const busq = busquedaOrden.toLowerCase();
          return p.nombre.toLowerCase().includes(busq) || (p.descripcion && p.descripcion.toLowerCase().includes(busq));
        });

        return (
          <div className="space-y-3 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
              <div>
                <h2 className="text-base md:text-lg font-black text-white">Módulo de Menú y Productos</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Gestión completa del catálogo, precios, categorías y disponibilidad.</p>
              </div>
              <button onClick={abrirModalCrear} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Nuevo Producto
              </button>
            </div>

            {cargandoMenu ? (
              <div className="py-20 text-center text-neutral-500 text-xs">Cargando menú...</div>
            ) : productos.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-2 shadow-lg">
                <div className="w-9 h-9 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <Utensils className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-xs font-bold text-white">No hay productos en el menú</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {productos.map(p => (
                  <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between gap-2.5 relative overflow-hidden shadow-lg">
                    <div className="flex gap-2.5">
                      <div className="w-14 h-14 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.imagen ? (
                          <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">{obtenerNombreCategoria(p.categoria_id)}</span>
                        <h3 className="text-xs font-bold text-white truncate mt-0.5">{capitalizarTexto(p.nombre)}</h3>
                        <p className="text-sm font-black text-white mt-1">$ {Number(p.precio).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">{capitalizarTexto(p.descripcion) || 'Sin descripción'}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                      <button onClick={() => cambiarDisponibilidad(p.id, p.disponible)} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${p.disponible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                        {p.disponible ? 'Disponible' : 'Agotado'}
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirModalEditar(p)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg cursor-pointer" title="Editar">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => eliminarProducto(p.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg cursor-pointer" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {modalMenuAbierto && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl relative">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <h3 className="text-xs font-black text-white">{modoEdicion ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
                    <button onClick={() => setModalMenuAbierto(false)} className="p-1 bg-neutral-950 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={guardarProducto} className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Nombre *</label>
                      <input type="text" required value={formNombre} onChange={(e) => setFormNombre(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Categoría *</label>
                        <select value={formCategoriaId} onChange={(e) => setFormCategoriaId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer">
                          {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Precio *</label>
                        <input type="number" required value={formPrecio} onChange={(e) => setFormPrecio(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Descripción</label>
                      <textarea rows="2" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">URL de Imagen</label>
                      <input type="text" value={formImagen} onChange={(e) => setFormImagen(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="pt-2 flex gap-2.5">
                      <button type="button" onClick={() => setModalMenuAbierto(false)} className="w-1/2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">Cancelar</button>
                      <button type="submit" className="w-1/2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer">Guardar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      }

      default:
        return <div className="text-white text-xs">Selecciona un módulo válido.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans select-none">
      {cargandoInicial && (
        <div className="fixed inset-0 bg-neutral-950 z-50 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-neutral-300">Cargando Vértizze Dashboard...</p>
        </div>
      )}

      {ordenImprimiendo && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-4 z-50 font-mono text-xs">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-black">
            <h2 className="text-sm font-black">VÉRTIZZE RESTAURANTE</h2>
            <p className="text-[10px]">NIT: 900.000.000-1</p>
            <p className="text-[10px]">TICKET DE VENTA / PEDIDO</p>
          </div>
          <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-black">
            <p><strong>Nro Orden:</strong> #{ordenImprimiendo.numero_orden} (ID: {ordenImprimiendo.id})</p>
            <p><strong>Fecha:</strong> {ordenImprimiendo.creado_en ? ordenImprimiendo.creado_en.replace('T', ' ').substring(0, 19) : 'N/A'}</p>
            <p><strong>Cliente:</strong> {capitalizarTexto(ordenImprimiendo.cliente_nombre) || 'Cliente General'}</p>
            <p><strong>Servicio:</strong> {capitalizarTexto(ordenImprimiendo.tipo_servicio) || 'Local'}</p>
            <p><strong>Método Pago:</strong> {capitalizarTexto(ordenImprimiendo.metodo_pago) || 'Efectivo'} ({capitalizarTexto(ordenImprimiendo.estado_pago) || 'Por Pagar'})</p>
          </div>
          <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-black">
            <p className="font-bold">DETALLE:</p>
            <p>{formatearItems(ordenImprimiendo.items)}</p>
          </div>
          <div className="py-2 text-right space-y-1 text-xs font-black">
            <p>TOTAL: $ {Number(ordenImprimiendo.subtotal || 0).toLocaleString()}</p>
          </div>
          <div className="text-center pt-4 text-[10px] space-y-1">
            <p>¡Gracias por su compra!</p>
            <p>Desarrollado por Vértizze System</p>
          </div>
        </div>
      )}

      <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuMovilAbierto(!menuMovilAbierto)} className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white md:hidden cursor-pointer">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20">
              V
            </div>
            <div>
              <h1 className="text-xs font-black tracking-wider text-white">VÉRTIZZE ADMIN</h1>
              <p className="text-[10px] text-neutral-400">Sistema Operativo & ERP</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs text-neutral-300">
            <Store className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold">Sucursal Principal</span>
          </div>
          <button onClick={() => window.location.reload()} className="p-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer" title="Actualizar Datos">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`hidden md:flex flex-col bg-neutral-900 border-r border-neutral-800 transition-all duration-300 ${menuColapsado ? 'w-16' : 'w-56'} p-3 space-y-4`}>
          <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
            {!menuColapsado && <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Navegación</span>}
            <button onClick={() => setMenuColapsado(!menuColapsado)} className="p-1 bg-neutral-950 rounded-lg text-neutral-400 hover:text-white cursor-pointer mx-auto">
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1 flex-1">
            {[
              { id: 'resumen', label: 'Resumen & Analytics', icon: LayoutDashboard },
              { id: 'egresos', label: 'Egresos y Facturas', icon: Receipt },
              { id: 'clientes', label: 'Módulo de Clientes', icon: Users },
              { id: 'domiciliarios', label: 'Módulo Domiciliarios', icon: Truck },
              { id: 'pagos', label: 'Control de Pagos', icon: CreditCard },
              { id: 'ordenes', label: 'Gestión de Órdenes', icon: ClipboardList },
              { id: 'contabilidad', label: 'Contabilidad', icon: FileSpreadsheet },
              { id: 'menu', label: 'Menú y Productos', icon: Utensils }
            ].map(item => {
              const Icono = item.icon;
              const activo = vistaActual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setVistaActual(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activo ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
                  title={item.label}
                >
                  <Icono className="w-4 h-4 shrink-0" />
                  {!menuColapsado && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-neutral-800">
            <button onClick={() => alert('Sesión de administrador activa')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
              <LogOut className="w-4 h-4 shrink-0" />
              {!menuColapsado && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </aside>

        {menuMovilAbierto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden flex">
            <div className="w-64 bg-neutral-900 border-r border-neutral-800 p-4 flex flex-col space-y-4 shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                <span className="text-xs font-black uppercase text-white">Menú Principal</span>
                <button onClick={() => setMenuMovilAbierto(false)} className="p-1 bg-neutral-950 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="space-y-1.5 flex-1">
                {[
                  { id: 'resumen', label: 'Resumen & Analytics', icon: LayoutDashboard },
                  { id: 'egresos', label: 'Egresos y Facturas', icon: Receipt },
                  { id: 'clientes', label: 'Módulo de Clientes', icon: Users },
                  { id: 'domiciliarios', label: 'Módulo Domiciliarios', icon: Truck },
                  { id: 'pagos', label: 'Control de Pagos', icon: CreditCard },
                  { id: 'ordenes', label: 'Gestión de Órdenes', icon: ClipboardList },
                  { id: 'contabilidad', label: 'Contabilidad', icon: FileSpreadsheet },
                  { id: 'menu', label: 'Menú y Productos', icon: Utensils }
                ].map(item => {
                  const Icono = item.icon;
                  const activo = vistaActual === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setVistaActual(item.id); setMenuMovilAbierto(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activo ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
                    >
                      <Icono className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex-1" onClick={() => setMenuMovilAbierto(false)}></div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-neutral-950">
          {renderizarModulo()}
        </main>
      </div>
    </div>
  );
}