import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  CheckCircle, 
  AlertTriangle, 
  Printer, 
  User, 
  Trash2, 
  Plus, 
  Minus, 
  FileText, 
  Layers, 
  Phone, 
  ArrowRight, 
  MapPin, 
  Edit3, 
  X 
} from 'lucide-react';
import { 
  getProductos, 
  getPacientes, 
  getRecetaPorId, 
  getRecetasPorPaciente,
  crearProducto,
  actualizarProducto
} from '../api/client';

export default function VistaFarmacia() {
  const [modoBusqueda, setModoBusqueda] = useState('productos');

  // Catálogo de productos
  const [productos, setProductos] = useState([]);
  const [queryProducto, setQueryProducto] = useState('');
  const [cargandoProd, setCargandoProd] = useState(false);

  // Modal Crear / Editar Producto
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [formProducto, setFormProducto] = useState({
    nombre: '',
    sku: '',
    activo_dermatologico: '',
    precio_base: '',
    stock_actual: '',
    stock_minimo: 2,
    ubicacion: ''
  });
  const [guardandoProd, setGuardandoProd] = useState(false);

  // Búsqueda de pacientes y recetas
  const [queryPaciente, setQueryPaciente] = useState('');
  const [pacientesSugeridos, setPacientesSugeridos] = useState([]);
  const [pacienteActivo, setPacienteActivo] = useState(null);
  const [recetasHistorial, setRecetasHistorial] = useState([]);
  const [folioDirecto, setFolioDirecto] = useState('');
  const [recetaCargada, setRecetaCargada] = useState(null);
  const [cargandoReceta, setCargandoReceta] = useState(false);
  const [errorReceta, setErrorReceta] = useState(null);

  // Carrito de ventas
  const [carrito, setCarrito] = useState([]);
  const [ventaCompletada, setVentaCompletada] = useState(false);

  const obtenerPrecio = (p) => Number(p?.precio_base ?? p?.precio_venta ?? p?.precio ?? 0);

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const cargarCatalogo = async (termino = '') => {
    try {
      setCargandoProd(true);
      const res = await getProductos(termino);
      setProductos(res.data);
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setCargandoProd(false);
    }
  };

  const abrirModalCrear = () => {
    setProductoSeleccionado(null);
    setFormProducto({
      nombre: '',
      sku: '',
      activo_dermatologico: '',
      precio_base: '',
      stock_actual: '',
      stock_minimo: 2,
      ubicacion: ''
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (prod) => {
    setProductoSeleccionado(prod);
    setFormProducto({
      nombre: prod.nombre,
      sku: prod.sku || '',
      activo_dermatologico: prod.activo_dermatologico || '',
      precio_base: prod.precio_base,
      stock_actual: prod.stock_actual,
      stock_minimo: prod.stock_minimo || 2,
      ubicacion: prod.ubicacion || ''
    });
    setModalAbierto(true);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setGuardandoProd(true);
    try {
      const payload = {
        ...formProducto,
        precio_base: parseFloat(formProducto.precio_base) || 0,
        stock_actual: parseInt(formProducto.stock_actual, 10) || 0,
        stock_minimo: parseInt(formProducto.stock_minimo, 10) || 2
      };

      if (productoSeleccionado) {
        await actualizarProducto(productoSeleccionado.id, payload);
      } else {
        await crearProducto(payload);
      }
      setModalAbierto(false);
      await cargarCatalogo(queryProducto);
    } catch (err) {
      console.error('Error guardando producto:', err);
      alert('Error al guardar el producto');
    } finally {
      setGuardandoProd(false);
    }
  };

  // Buscar paciente por teléfono o nombre en tiempo real
  useEffect(() => {
    const timer = setTimeout(async () => {
      const termino = queryPaciente.trim();
      if (termino.length >= 2) {
        try {
          const res = await getPacientes(termino);
          setPacientesSugeridos(res.data);
        } catch (err) {
          console.error('Error buscando pacientes:', err);
        }
      } else {
        setPacientesSugeridos([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [queryPaciente]);

  // Selección de paciente: carga historial de recetas
  const seleccionarPaciente = async (p) => {
    setPacienteActivo(p);
    setPacientesSugeridos([]);
    setQueryPaciente('');
    setErrorReceta(null);
    setCargandoReceta(true);

    try {
      const res = await getRecetasPorPaciente(p.id);
      setRecetasHistorial(res.data);
      if (res.data && res.data.length > 0) {
        setRecetaCargada(res.data[0]);
      } else {
        setRecetaCargada(null);
        setErrorReceta('Este paciente no cuenta con recetas registradas.');
      }
    } catch (err) {
      console.error(err);
      setErrorReceta('Error al consultar recetas del paciente.');
    } finally {
      setCargandoReceta(false);
    }
  };

  // Cargar por folio directo
  const cargarRecetaPorFolio = async (idFolio) => {
    if (!idFolio) return;
    setCargandoReceta(true);
    setErrorReceta(null);
    try {
      const res = await getRecetaPorId(idFolio);
      setRecetaCargada(res.data);
      if (res.data.paciente) {
        setPacienteActivo(res.data.paciente);
      }
    } catch (err) {
      setRecetaCargada(null);
      setErrorReceta(err.response?.status === 404 
        ? 'No se encontró ninguna receta con ese folio.' 
        : 'Error al consultar folio: ' + (err.response?.data?.detail || err.message)
      );
    } finally {
      setCargandoReceta(false);
    }
  };

  // Transferir items de la receta al carrito
  const transferirRecetaAlCarrito = (recetaATransferir = recetaCargada) => {
    if (!recetaATransferir || !recetaATransferir.detalles) return;

    setCarrito((prevCarrito) => {
      const nuevo = [...prevCarrito];
      recetaATransferir.detalles.forEach((det) => {
        const index = nuevo.findIndex((item) => item.id === det.producto_id);
        const precio = obtenerPrecio(det.producto);

        if (index > -1) {
          nuevo[index].cantidad += det.cantidad;
        } else {
          nuevo.push({
            id: det.producto_id,
            nombre: det.producto?.nombre || 'Producto',
            marca: det.producto?.marca?.nombre || '',
            precio: precio,
            stock_actual: det.producto?.stock_actual ?? 0,
            ubicacion: det.producto?.ubicacion || '',
            cantidad: det.cantidad,
            indicaciones: det.indicaciones || ''
          });
        }
      });
      return nuevo;
    });
  };

  // Venta libre: agregar directo
  const agregarProductoDirecto = (prod) => {
    setCarrito((prev) => {
      const index = prev.findIndex((item) => item.id === prod.id);
      const precio = obtenerPrecio(prod);

      if (index > -1) {
        return prev.map((item, i) => 
          i === index ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: prod.id,
          nombre: prod.nombre,
          marca: prod.marca?.nombre || '',
          precio: precio,
          stock_actual: prod.stock_actual,
          ubicacion: prod.ubicacion || '',
          cantidad: 1,
          indicaciones: ''
        }
      ];
    });
  };

  const actualizarCantidad = (id, delta) => {
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nuevaCant = item.cantidad + delta;
            return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const eliminarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    <div className="space-y-6">
      {/* Selector de modo */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 max-w-5xl mx-auto shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setModoBusqueda('productos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              modoBusqueda === 'productos'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" /> Venta Libre / Catálogo
          </button>
          <button
            onClick={() => setModoBusqueda('receta_paciente')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              modoBusqueda === 'receta_paciente'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" /> Buscar por Paciente / Folio
          </button>
        </div>

        {pacienteActivo && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <User className="w-3.5 h-3.5 text-emerald-700" />
            <span className="capitalize">{pacienteActivo.nombre_completo}</span>
            <button 
              onClick={() => { 
                setPacienteActivo(null); 
                setRecetaCargada(null);
                setRecetasHistorial([]);
              }}
              className="ml-2 text-[11px] text-rose-600 hover:underline"
            >
              Quitar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto">
        {/* Columna Izquierda: Catálogo o Búsqueda de Receta */}
        <div className="lg:col-span-7 space-y-4">
          {modoBusqueda === 'productos' ? (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Buscar medicamento por nombre, activo o marca..."
                    value={queryProducto}
                    onChange={(e) => {
                      setQueryProducto(e.target.value);
                      cargarCatalogo(e.target.value);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={abrirModalCrear}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex-shrink-0"
                >
                  <Plus className="w-4 h-4" /> Nuevo Producto
                </button>
              </div>

              {cargandoProd ? (
                <div className="py-12 text-center text-xs text-slate-400">Consultando catálogo...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
                  {productos.map((prod) => {
                    const precio = obtenerPrecio(prod);
                    const sinStock = prod.stock_actual <= 0;

                    return (
                      <div
                        key={prod.id}
                        className="p-3.5 border border-slate-100 bg-slate-50/50 rounded-xl flex flex-col justify-between hover:border-emerald-200 transition-colors group relative"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                              {prod.marca?.nombre || 'Genérico'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {/* Botón para editar producto o ubicación */}
                              <button
                                type="button"
                                onClick={() => abrirModalEditar(prod)}
                                title="Editar producto o cambiar ubicación"
                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                sinStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                Stock: {prod.stock_actual}
                              </span>
                            </div>
                          </div>
                          <h4 className="font-semibold text-sm text-slate-800 leading-tight">{prod.nombre}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {prod.activo_dermatologico || 'Fórmula / Comercial'}
                          </p>

                          {/* Etiqueta de Ubicación en Anaquel */}
                          {prod.ubicacion && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                              <MapPin className="w-3 h-3 text-amber-600" />
                              <span>{prod.ubicacion}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-200/60">
                          <span className="font-bold text-slate-900 text-sm">
                            ${precio.toFixed(2)} MXN
                          </span>
                          <button
                            onClick={() => agregarProductoDirecto(prod)}
                            disabled={sinStock}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              sinStock 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" /> Agregar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-5">
              {/* Folio directo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Búsqueda directa por Folio
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. 3"
                    value={folioDirecto}
                    onChange={(e) => setFolioDirecto(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => cargarRecetaPorFolio(folioDirecto.replace('#', '').trim())}
                    disabled={cargandoReceta || !folioDirecto.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {cargandoReceta ? 'Buscando...' : 'Cargar Folio'}
                  </button>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-100 w-full"></div>
                <span className="bg-white px-3 text-xs text-slate-300 uppercase font-semibold">o buscar por paciente</span>
              </div>

              {/* Paciente por nombre o WhatsApp */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Buscar por Nombre o Teléfono (WhatsApp)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Escribe el nombre o teléfono (ej. 312 o Sofia)..."
                    value={queryPaciente}
                    onChange={(e) => setQueryPaciente(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {pacientesSugeridos.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {pacientesSugeridos.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => seleccionarPaciente(p)}
                          className="w-full text-left px-4 py-3 hover:bg-emerald-50/50 border-b border-slate-100 last:border-0 flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-sm text-slate-800 capitalize">{p.nombre_completo}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {p.telefono || 'Sin teléfono'}
                            </div>
                          </div>
                          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                            Ver recetas &rarr;
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {errorReceta && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {errorReceta}
                </div>
              )}

              {/* Selector de Historial de Recetas */}
              {recetasHistorial.length > 1 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Historial de Recetas ({recetasHistorial.length})
                    </label>
                    <span className="text-[11px] text-slate-400">Selecciona para cargar</span>
                  </div>
                  <select
                    value={recetaCargada?.id || ''}
                    onChange={(e) => {
                      const seleccionada = recetasHistorial.find(r => r.id === Number(e.target.value));
                      if (seleccionada) setRecetaCargada(seleccionada);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {recetasHistorial.map((r, idx) => (
                      <option key={r.id} value={r.id}>
                        Folio #{r.id} — {new Date(r.fecha).toLocaleDateString()} {idx === 0 ? '(Última emitida)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Vista previa de receta activa */}
              {recetaCargada && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Receta #{recetaCargada.id} seleccionada
                      </span>
                      <p className="text-xs text-slate-600">
                        Paciente: <b className="capitalize">{recetaCargada.paciente?.nombre_completo}</b>
                      </p>
                    </div>
                    <button
                      onClick={() => transferirRecetaAlCarrito(recetaCargada)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      Cargar al Carrito <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-emerald-100 text-xs text-slate-700">
                    {recetaCargada.detalles?.map((d) => (
                      <div key={d.id} className="py-1.5 flex justify-between items-center">
                        <div>
                          <span>{d.producto?.nombre} (Cant: {d.cantidad})</span>
                          {d.producto?.ubicacion && (
                            <span className="ml-2 text-[10px] text-amber-800 bg-amber-100/70 border border-amber-200 px-1.5 py-0.5 rounded">
                              📍 {d.producto.ubicacion}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-500">${(obtenerPrecio(d.producto) * d.cantidad).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Carrito Interactivo */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-700" /> Carrito de Venta
              </h3>
              <p className="text-xs text-slate-400">
                {pacienteActivo ? `Paciente: ${pacienteActivo.nombre_completo}` : 'Público General / Venta Mostrador'}
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">
              {carrito.length} ítems
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {carrito.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-xs">El carrito está vacío.<br />Agrega medicamentos o busca al paciente.</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800 leading-tight">{item.nombre}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{item.marca}</span>
                        {item.ubicacion && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-amber-100/70 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                            <MapPin className="w-2.5 h-2.5 text-amber-700" />
                            {item.ubicacion}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarDelCarrito(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.indicaciones && (
                    <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Indicación: {item.indicaciones}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                      <button
                        onClick={() => actualizarCantidad(item.id, -1)}
                        className="text-slate-500 hover:text-slate-900 p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs text-slate-800 w-4 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => actualizarCantidad(item.id, 1)}
                        className="text-slate-500 hover:text-slate-900 p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">${item.precio.toFixed(2)} c/u</span>
                      <span className="text-xs font-bold text-slate-900">
                        ${(item.precio * item.cantidad).toFixed(2)} MXN
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)} MXN</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
              <span>Total a Cobrar</span>
              <span className="text-emerald-700 font-bold">${subtotal.toFixed(2)} MXN</span>
            </div>
          </div>

          {ventaCompletada ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Venta registrada con éxito
            </div>
          ) : (
            <button
              onClick={() => setVentaCompletada(true)}
              disabled={carrito.length === 0}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              Cobrar y Finalizar Venta
            </button>
          )}

          <button
            onClick={() => window.print()}
            disabled={carrito.length === 0}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir Ticket
          </button>
        </div>
      </div>

      {/* Modal para Crear / Editar Producto */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {productoSeleccionado ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarProducto} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. PBT PureSkin Tónico"
                  value={formProducto.nombre}
                  onChange={(e) => setFormProducto({ ...formProducto, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">SKU / Código</label>
                  <input
                    type="text"
                    placeholder="Ej. PBT-001"
                    value={formProducto.sku}
                    onChange={(e) => setFormProducto({ ...formProducto, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ubicación / Anaquel</label>
                  <input
                    type="text"
                    placeholder="Ej. Anaquel C - Nivel 1"
                    value={formProducto.ubicacion}
                    onChange={(e) => setFormProducto({ ...formProducto, ubicacion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Activo Dermatológico / Fórmula</label>
                <input
                  type="text"
                  placeholder="Ej. Ácido Salicílico / Glicólico"
                  value={formProducto.activo_dermatologico}
                  onChange={(e) => setFormProducto({ ...formProducto, activo_dermatologico: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Precio Venta ($ MXN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formProducto.precio_base}
                    onChange={(e) => setFormProducto({ ...formProducto, precio_base: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Actual *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formProducto.stock_actual}
                    onChange={(e) => setFormProducto({ ...formProducto, stock_actual: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProd}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {guardandoProd ? 'Guardando...' : (productoSeleccionado ? 'Guardar Cambios' : 'Crear Producto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}