// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { 
  Box, Typography, Button, Stack, Divider, Paper, 
  Alert, Snackbar, CircularProgress, Chip, Grid
} from '@mui/material';
import FileUploader from './FileUploader';
import DataTable from './DataTable';
import ExportButtons from './ExportButtons';
import ConfiguracionMargen from './ConfiguracionMargen';
import { conciliarRegistros } from '../utils/conciliacion';

export default function Dashboard() {
  const [sistemaData, setSistemaData] = useState([]);
  const [bancoData, setBancoData] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tolerancia, setTolerancia] = useState(0.01); // Valor por defecto: 0.01 (1 centavo)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  const ejecutarConciliacion = (margenPersonalizado = null) => {
    if (!sistemaData.length || !bancoData.length) {
      setSnackbar({
        open: true,
        message: 'Debe cargar ambos archivos para realizar la conciliación',
        severity: 'warning'
      });
      return;
    }

    // Usar el margen personalizado si se proporciona, de lo contrario usar el estado
    const margenTolerancia = margenPersonalizado !== null ? margenPersonalizado : tolerancia;
    
    setLoading(true);
    setError(null);
    
    try {
      // Usar setTimeout para no bloquear la UI
      setTimeout(() => {
        try {
          // Imprimir datos de muestra para verificación
          console.log("Datos del sistema para conciliar (muestra):", 
            sistemaData.slice(0, 2).map(d => JSON.stringify(d)));
          console.log("Datos del banco para conciliar (muestra):", 
            bancoData.slice(0, 2).map(d => JSON.stringify(d)));
          console.log("Usando margen de tolerancia:", margenTolerancia);
          
          // Verificar que los datos tengan el formato correcto
          const verifyFields = (data, source) => {
            const issues = [];
            data.forEach((item, index) => {
              if (item.debito === undefined && item.credito === undefined) {
                issues.push(`Registro ${index + 1} de ${source} no tiene débito ni crédito`);
              }
              if (item.fecha === undefined) {
                issues.push(`Registro ${index + 1} de ${source} no tiene fecha`);
              }
            });
            return issues;
          };
          
          const sistemaIssues = verifyFields(sistemaData, 'sistema');
          const bancoIssues = verifyFields(bancoData, 'banco');
          
          if (sistemaIssues.length > 0 || bancoIssues.length > 0) {
            const issues = [...sistemaIssues, ...bancoIssues];
            console.error("Problemas con los datos:", issues);
            setError(`Problemas con los datos: ${issues.slice(0, 3).join(", ")}${issues.length > 3 ? ` y ${issues.length - 3} más...` : ""}`);
            setLoading(false);
            return;
          }
          
          // Pasar el margen de tolerancia como parámetro a la función de conciliación
          const conciliacion = conciliarRegistros(sistemaData, bancoData, margenTolerancia);
          setResultado(conciliacion);
          
          // Mostrar estadísticas
          const totalSistema = sistemaData.length;
          const totalExactas = conciliacion.coincidenciasExactas.length;
          const totalAproximadas = conciliacion.coincidenciasAproximadas.length;
          const porcentajeExito = Math.round(((totalExactas + totalAproximadas) / totalSistema) * 100);
          
          setSnackbar({
            open: true,
            message: `Conciliación completada con margen de ${margenTolerancia.toFixed(2)}. ` +
                     `Coincidencias: ${totalExactas + totalAproximadas}/${totalSistema} (${porcentajeExito}%)`,
            severity: 'success'
          });
          
          setLoading(false);
        } catch (err) {
          console.error('Error durante la conciliación:', err);
          setError(`Error durante la conciliación: ${err.message}`);
          setLoading(false);
        }
      }, 100);
    } catch (err) {
      console.error('Error durante la conciliación:', err);
      setError(`Error durante la conciliación: ${err.message}`);
      setLoading(false);
    }
  };

  // Función para reejecutar la conciliación con un nuevo margen
  const reejecutarConMargen = () => {
    ejecutarConciliacion(tolerancia);
  };

  // Función mejorada para preservar los datos exactamente como vienen
  const handleSistemaDataLoaded = (data) => {
    console.log("Datos de sistema (originales):", data.slice(0, 2));
    
    // NO hacer ninguna modificación a los datos, simplemente agregar id y origen
    const datosFinales = data.map((item, index) => {
      return {
        ...item,  // Mantener todos los datos exactamente como vienen
        id: `sistema-${index}`,
        origen: 'Sistema'
      };
    });
    
    console.log("Datos del sistema (finales):", datosFinales.slice(0, 2));
    setSistemaData(datosFinales);
    
    setSnackbar({
      open: true,
      message: `Archivo del sistema cargado: ${datosFinales.length} registros`,
      severity: 'info'
    });
  };

  // Función mejorada para preservar los datos exactamente como vienen
  const handleBancoDataLoaded = (data) => {
    console.log("Datos de banco (originales):", data.slice(0, 2));
    
    // NO hacer ninguna modificación a los datos, simplemente agregar id y origen
    const datosFinales = data.map((item, index) => {
      return {
        ...item,  // Mantener todos los datos exactamente como vienen
        id: `banco-${index}`,
        origen: 'Banco'
      };
    });
    
    console.log("Datos del banco (finales):", datosFinales.slice(0, 2));
    setBancoData(datosFinales);
    
    setSnackbar({
      open: true,
      message: `Archivo del banco cargado: ${datosFinales.length} registros`,
      severity: 'info'
    });
  };

  // Columnas con ancho fijo y sin compresión para mostrar contenido completo
  const columnasSistema = [
    { field: 'referencia', headerName: 'Referencia', width: 150, flex: 0 },
    { field: 'fecha', headerName: 'Fecha', width: 100, flex: 0 },
    { field: 'debito', headerName: 'Débito', width: 130, flex: 0 },
    { field: 'credito', headerName: 'Crédito', width: 130, flex: 0 },
    { field: 'descripcion', headerName: 'Descripción', width: 350, flex: 0 },
    { 
      field: 'origen', 
      headerName: 'Origen', 
      width: 120, 
      flex: 0,
      renderCell: (params) => {
        if (!params) return null;
        return <Chip label="Sistema" color="secondary" size="small" />;
      }
    }
  ];

  const columnasBanco = [
    { field: 'referencia', headerName: 'Referencia', width: 150, flex: 0 },
    { field: 'fecha', headerName: 'Fecha', width: 100, flex: 0 },
    { field: 'debito', headerName: 'Débito', width: 130, flex: 0 },
    { field: 'credito', headerName: 'Crédito', width: 130, flex: 0 },
    { field: 'descripcion', headerName: 'Descripción', width: 350, flex: 0 },
    { 
      field: 'origen', 
      headerName: 'Origen', 
      width: 120, 
      flex: 0,
      renderCell: (params) => {
        if (!params) return null;
        return <Chip label="Banco" color="primary" size="small" />;
      }
    }
  ];

  // Columnas para los resultados
  const columnasResultados = [
    { field: 'referencia', headerName: 'Referencia', width: 150, flex: 0 },
    { field: 'fecha', headerName: 'Fecha', width: 100, flex: 0 },
    { field: 'debito', headerName: 'Débito', width: 130, flex: 0 },
    { field: 'credito', headerName: 'Crédito', width: 130, flex: 0 },
    { field: 'descripcion', headerName: 'Descripción', width: 350, flex: 0 },
  ];

  // Columnas para coincidencias exactas
  const columnasExactas = [
    ...columnasResultados,
    { 
      field: 'origen', 
      headerName: 'Origen', 
      width: 170, 
      flex: 0,
      renderCell: (params) => {
        if (!params) return null;
        return <Chip label="Coincidencia Exacta" color="success" size="small" />;
      }
    }
  ];

  // Columnas para coincidencias aproximadas
  const columnasAproximadas = [
    ...columnasResultados,
    { 
      field: 'diferencia', 
      headerName: 'Diferencia', 
      width: 120, 
      flex: 0,
      valueFormatter: (params) => {
        if (params?.value === undefined) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'origen', 
      headerName: 'Origen', 
      width: 170, 
      flex: 0,
      renderCell: (params) => {
        if (!params) return null;
        return <Chip label="Coincidencia Aproximada" color="warning" size="small" />;
      }
    }
  ];

  return (
    <Box sx={{ pb: 6 }}>
      {/* Sección principal - cabecera */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>Conciliación Bancaria</Typography>
        <Typography variant="body1" paragraph>
          Cargue los archivos de transacciones del sistema y del banco para realizar la conciliación.
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Datos del Sistema</Typography>
              <FileUploader 
                onDataLoaded={handleSistemaDataLoaded} 
                title="Cargar Archivo del Sistema"
              />
              {sistemaData.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {sistemaData.length} registros cargados
                </Typography>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Datos del Banco</Typography>
              <FileUploader 
                onDataLoaded={handleBancoDataLoaded} 
                title="Cargar Archivo del Banco"
              />
              {bancoData.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {bancoData.length} registros cargados
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Configuración de margen de tolerancia */}
        {sistemaData.length > 0 && bancoData.length > 0 && (
          <ConfiguracionMargen
            tolerancia={tolerancia}
            setTolerancia={setTolerancia}
            onRecalcular={reejecutarConMargen}
            disabled={loading || !sistemaData.length || !bancoData.length}
          />
        )}

        {sistemaData.length > 0 && bancoData.length > 0 && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => ejecutarConciliacion()}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            size="large"
            fullWidth
          >
            {loading ? 'Procesando...' : 'Ejecutar Conciliación'}
          </Button>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Vista previa de datos cargados */}
      {sistemaData.length > 0 || bancoData.length > 0 ? (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Vista Previa de Datos</Typography>
          
          <Grid container spacing={3}>
            {/* Datos del Sistema - Arriba */}
            <Grid item xs={12}>
              {sistemaData.length > 0 ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Datos del Sistema ({sistemaData.length} registros)
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Primeros registros cargados del sistema
                    </Alert>
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label={`Fecha: ${sistemaData[0]?.fecha || 'N/A'}`} />
                      <Chip label={`Referencia: ${sistemaData[0]?.referencia || 'N/A'}`} />
                      <Chip 
                        label={`Débito: ${sistemaData[0]?.debito || '0'}`}
                        color="error"
                      />
                      <Chip
                        label={`Crédito: ${sistemaData[0]?.credito || '0'}`}
                        color="success"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ height: 400, width: '100%', overflowX: 'auto' }}>
                    <DataTable
                      rows={sistemaData}
                      columns={columnasSistema}
                      height={370}
                      disableColumnResize={true}
                    />
                  </Box>
                </>
              ) : (
                <Alert severity="info">No hay datos del sistema cargados</Alert>
              )}
            </Grid>
            
            {/* Datos del Banco - Abajo */}
            <Grid item xs={12}>
              {bancoData.length > 0 ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Datos del Banco ({bancoData.length} registros)
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Primeros registros cargados del banco
                    </Alert>
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label={`Fecha: ${bancoData[0]?.fecha || 'N/A'}`} />
                      <Chip label={`Referencia: ${bancoData[0]?.referencia || 'N/A'}`} />
                      <Chip 
                        label={`Débito: ${bancoData[0]?.debito || '0'}`}
                        color="error"
                      />
                      <Chip
                        label={`Crédito: ${bancoData[0]?.credito || '0'}`}
                        color="success"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ height: 400, width: '100%', overflowX: 'auto' }}>
                    <DataTable
                      rows={bancoData}
                      columns={columnasBanco}
                      height={370}
                      disableColumnResize={true}
                    />
                  </Box>
                </>
              ) : (
                <Alert severity="info">No hay datos del banco cargados</Alert>
              )}
            </Grid>
          </Grid>
        </Paper>
      ) : null}

      {/* Resultados de la conciliación - Debajo de todo */}
      {resultado && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Resultados de la Conciliación</Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Conciliación realizada con un margen de tolerancia de <strong>RD$ {tolerancia.toFixed(2)}</strong>. 
            Puedes ajustar este valor en la sección de configuración y recalcular para encontrar más o menos coincidencias.
          </Alert>
          
          {/* Añadir componente de configuración de margen para recalcular */}
          <ConfiguracionMargen
            tolerancia={tolerancia}
            setTolerancia={setTolerancia}
            onRecalcular={reejecutarConMargen}
            disabled={loading}
          />
          
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={1} 
                  sx={{ p: 2, bgcolor: 'success.light', color: 'white', textAlign: 'center' }}
                >
                  <Typography variant="h4">
                    {resultado.coincidenciasExactas.length}
                  </Typography>
                  <Typography>Coincidencias Exactas</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={1} 
                  sx={{ p: 2, bgcolor: 'warning.light', textAlign: 'center' }}
                >
                  <Typography variant="h4">
                    {resultado.coincidenciasAproximadas.length}
                  </Typography>
                  <Typography>Coincidencias Aproximadas</Typography>
                  <Typography variant="caption">
                    (Diferencia ≤ {tolerancia.toFixed(2)})
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={1} 
                  sx={{ p: 2, bgcolor: 'error.light', color: 'white', textAlign: 'center' }}
                >
                  <Typography variant="h4">
                    {resultado.sinCoincidencia.length}
                  </Typography>
                  <Typography>Sin Coincidencia</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Coincidencias Exactas ({resultado.coincidenciasExactas.length})
          </Typography>
          <Box sx={{ height: 400, width: '100%', overflowX: 'auto' }}>
            <DataTable
              rows={resultado.coincidenciasExactas.map((r, i) => ({ 
                id: `exactas-${i}`, 
                ...r.sistema
              }))}
              columns={columnasExactas}
              height={370}
              disableColumnResize={true}
            />
          </Box>

          <Typography variant="h6" gutterBottom mt={4}>
            Coincidencias Aproximadas ({resultado.coincidenciasAproximadas.length})
          </Typography>
          <Box sx={{ height: 400, width: '100%', overflowX: 'auto' }}>
            <DataTable
              rows={resultado.coincidenciasAproximadas.map((r, i) => ({ 
                id: `aprox-${i}`, 
                ...r.sistema,
                diferencia: r.diferencia
              }))}
              columns={columnasAproximadas}
              height={370}
              disableColumnResize={true}
            />
          </Box>

          <Typography variant="h6" gutterBottom mt={4}>
            Registros sin Coincidencia ({resultado.sinCoincidencia.length})
          </Typography>
          <Box sx={{ height: 400, width: '100%', overflowX: 'auto' }}>
            <DataTable
              rows={resultado.sinCoincidencia.map((r, i) => ({ id: `nocoincide-${i}`, ...r }))}
              columns={columnasResultados}
              height={370}
              disableColumnResize={true}
            />
          </Box>

          {resultado.registrosBancoNoUtilizados && (
            <>
              <Typography variant="h6" gutterBottom mt={4}>
                Registros del Banco No Utilizados ({resultado.registrosBancoNoUtilizados.length})
              </Typography>
              <Box sx={{ height: 400, width: '100%', overflowX: 'auto' }}>
                <DataTable
                  rows={resultado.registrosBancoNoUtilizados.map((r, i) => ({ 
                    id: `banconouso-${i}`, 
                    ...r 
                  }))}
                  columns={columnasBanco}
                  height={370}
                  disableColumnResize={true}
                />
              </Box>
            </>
          )}

          <Box sx={{ mt: 4 }}>
            <ExportButtons resultado={resultado} />
          </Box>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}