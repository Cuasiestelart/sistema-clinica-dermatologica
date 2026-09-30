import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Endpoints de Productos
export const getProductos = (query = '') => 
  api.get(`/productos/${query ? `?q=${encodeURIComponent(query)}` : ''}`);

export const getSustitutos = (productoId) => 
  api.get(`/productos/${productoId}/sustitutos`);

// Endpoints de Pacientes
export const getPacientes = (query = '') => 
  api.get(`/pacientes/${query ? `?q=${encodeURIComponent(query)}` : ''}`);

export const crearPaciente = (datosPaciente) => 
  api.post('/pacientes/', datosPaciente);

// Endpoints de Recetas
export const crearReceta = (datosReceta) => 
  api.post('/recetas/', datosReceta);

export const getRecetaPorId = (id) => 
  api.get(`/recetas/${id}`);

export const getRecetasPorPaciente = (pacienteId) => 
  api.get(`/recetas/paciente/${pacienteId}`);

export const crearProducto = (data) =>
   api.post('/productos/', data);

export const actualizarProducto = (id, data) =>
   api.put(`/productos/${id}`, data);

export const actualizarNotaPaciente = (id, nota_fija) =>
  api.patch(`/pacientes/${id}/nota`, { nota_fija });

export const getHistorialPaciente = (pacienteId) =>
  api.get(`/recetas/paciente/${pacienteId}`);

export const getResumenMensual = (anio, mes) =>
  api.get('/reportes/resumen-mensual', { params: { anio, mes } });

export const descargarReporteMensual = async (anio, mes) => {
  const response = await api.get('/reportes/exportar-mensual', {
    params: { anio, mes },
    responseType: 'blob'
  });
  
  // Disparar descarga en el navegador
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Reporte_Honorarios_${anio}_${String(mes).padStart(2, '0')}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;