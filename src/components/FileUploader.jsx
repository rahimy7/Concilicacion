// src/components/FileUploader.jsx
import React, { useState } from 'react';
import { 
  Button, Typography, Box, Alert, Dialog, DialogTitle, 
  DialogContent, DialogActions, CircularProgress, 
  Paper, Divider 
} from '@mui/material';
import * as XLSX from 'xlsx';
import { validarFormatoArchivo, normalizarDatos } from '../utils/conciliacion';

// Componente para renderizar la vista previa de una tabla
const PreviewTable = ({ data }) => {
  if (!data || !data.muestra || data.muestra.length === 0) return null;
  
  return (
    <Box sx={{ overflowX: 'auto', mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Muestra de datos originales ({data.muestra.length} filas):
      </Typography>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
        <thead>
          <tr>
            {data.columnas.map((col, idx) => (
              <th key={idx} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.muestra.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {data.columnas.map((col, colIdx) => (
                <td key={colIdx} style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {row[col] !== undefined ? String(row[col]) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tabla para datos normalizados */}
      {data.muestra_normalizada && (
        <>
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
            Datos normalizados (como serán usados):
          </Typography>
          <table style={{ borderCollapse: 'collapse', width: '100%', border: '2px solid #4caf50' }}>
            <thead>
              <tr>
                {data.columnas_normalizadas.map((col, idx) => (
                  <th key={idx} style={{ 
                    border: '1px solid #4caf50', 
                    padding: '8px', 
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32'
                  }}>
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.muestra_normalizada.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {data.columnas_normalizadas.map((col, colIdx) => (
                    <td key={colIdx} style={{ border: '1px solid #4caf50', padding: '8px' }}>
                      {row[col] !== undefined ? String(row[col]) : 'N/A'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Box>
  );
};

const FileUploader = ({ onDataLoaded, title = "Cargar Archivo Excel" }) => {
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const closePreview = () => {
    setPreviewData(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExt)) {
      setError("Formato de archivo no soportado. Por favor, use archivos Excel (.xlsx, .xls) o CSV.");
      return;
    }
    
    setFileName(file.name);
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        // Proteger contra errores en la lectura del archivo
        if (!evt.target || !evt.target.result) {
          throw new Error("Error al leer el contenido del archivo.");
        }
        
        const data = new Uint8Array(evt.target.result);
        
        // CORRECCIÓN: Opciones mejoradas para manejar diferentes formatos de Excel
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd',
          raw: false,       // Importante: NO convertir a valores raw
          cellText: false,
          WTF: true,        // Mostrar advertencias para formato incorrecto
          cellNF: true,     // Mantener información de formato de número
          cellStyles: true  // Preservar estilos de celda
        });
        
        // Verificar que el workbook tenga hojas
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("El archivo Excel no contiene hojas de cálculo.");
        }
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Comprobar si la hoja tiene datos
        if (!firstSheet || !firstSheet['!ref']) {
          throw new Error("La hoja de cálculo está vacía o no tiene un formato válido.");
        }
        
        // Información de debug
        console.log(`Procesando archivo ${file.name}, tamaño: ${file.size} bytes`);
        console.log("Rango de la hoja:", firstSheet['!ref']);
        
        // CORRECCIÓN: Convertir a JSON usando opciones que preserven valores originales
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          raw: false,      // Mantener formato original (NO convertir a tipos nativos)
          defval: '',      // Valor por defecto para celdas vacías
          blankrows: false // Omitir filas vacías
        });
        
        // Log de los primeros datos para depuración
        console.log("Datos originales (primeras 2 filas):", 
          jsonData.slice(0, 2).map(row => JSON.stringify(row)));
        
        if (!jsonData || jsonData.length === 0) {
          throw new Error("No se encontraron datos en el archivo o el formato no es reconocible.");
        }
        
        console.log(`Datos cargados: ${jsonData.length} filas`);
        console.log("Columnas detectadas:", Object.keys(jsonData[0]));
        
        // Guardar una muestra para vista previa
        setPreviewData({
          columnas: Object.keys(jsonData[0]),
          muestra: jsonData.slice(0, 3),
        });
        
        const validacion = validarFormatoArchivo(jsonData);
        
        if (!validacion.valido) {
          throw new Error(validacion.mensaje || "Formato de archivo inválido");
        }
        
        // Normalizar datos para manejar diferentes formatos de columnas
        const datosNormalizados = normalizarDatos(jsonData);
        
        if (!datosNormalizados || datosNormalizados.length === 0) {
          throw new Error("Error al normalizar los datos del archivo.");
        }
        
        // Log de los datos normalizados para depuración
        console.log("Datos normalizados (primeras 2 filas):", 
          datosNormalizados.slice(0, 2).map(row => JSON.stringify(row)));
        
        // Guardar también una muestra de los datos normalizados para comparación
        setPreviewData({
          columnas: Object.keys(jsonData[0]),
          muestra: jsonData.slice(0, 3),
          columnas_normalizadas: ['fecha', 'referencia', 'debito', 'credito', 'descripcion'],
          muestra_normalizada: datosNormalizados.slice(0, 3)
        });
        
        // Verificar que los datos normalizados tengan la estructura esperada
        const primerDato = datosNormalizados[0];
        if (!primerDato.fecha || (primerDato.debito === undefined && primerDato.credito === undefined)) {
          console.warn("Datos normalizados con estructura incompleta:", primerDato);
          // Pero continuamos para intentar procesar de todos modos
        }
        
        // IMPORTANTE: Imprimir tipos de datos para verificar
        console.log("Tipos de datos en primer registro normalizado:", {
          fecha: typeof primerDato.fecha,
          referencia: typeof primerDato.referencia,
          debito: typeof primerDato.debito + " - valor: " + primerDato.debito,
          credito: typeof primerDato.credito + " - valor: " + primerDato.credito,
          descripcion: typeof primerDato.descripcion
        });
        
        // Cargar datos
        onDataLoaded(datosNormalizados);
        setLoading(false);
        
        // Mostrar vista previa
        setOpen(true);
      } catch (error) {
        console.error("Error al procesar archivo:", error);
        setError(`Error al procesar el archivo: ${error.message}`);
        setLoading(false);
        setFileName('');
      }
    };
    
    reader.onerror = () => {
      setError("Error al leer el archivo. Por favor, inténtelo de nuevo.");
      setLoading(false);
      setFileName('');
    };
    
    // Capturar otros errores posibles
    try {
      reader.readAsArrayBuffer(file);
    } catch (e) {
      console.error("Error al leer el archivo como ArrayBuffer:", e);
      setError(`Error al leer el archivo: ${e.message}`);
      setLoading(false);
      setFileName('');
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box>
      <Button 
        variant="contained" 
        component="label" 
        disabled={loading}
        color={fileName ? "success" : "primary"}
        fullWidth
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          title
        )}
        <input 
          type="file" 
          hidden 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileUpload} 
        />
      </Button>
      
      {fileName && (
        <Paper elevation={0} variant="outlined" sx={{ mt: 1, p: 1 }}>
          <Typography variant="body2">
            <strong>Archivo:</strong> {fileName}
          </Typography>
        </Paper>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 1 }}
          onClose={() => setError(null)}
          variant="filled"
        >
          {error}
        </Alert>
      )}
      
      {/* Vista previa de datos */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Vista previa de datos</DialogTitle>
        <DialogContent>
          {previewData && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Archivo: {fileName}
              </Typography>
              <Typography variant="body2" paragraph>
                Columnas detectadas: {previewData.columnas.join(", ")}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <PreviewTable data={previewData} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Vista previa de datos en línea (alternativa) */}
      {previewData && (
        <Paper 
          elevation={0} 
          variant="outlined" 
          sx={{ mt: 2, p: 1, display: 'none' }} // Oculto por defecto
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2">
              Vista previa de datos
            </Typography>
            <Button size="small" onClick={closePreview}>Cerrar</Button>
          </Box>
          <PreviewTable data={previewData} />
        </Paper>
      )}
    </Box>
  );
};

// Exportar el componente principal
export default FileUploader;