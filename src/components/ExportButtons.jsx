// src/components/ExportButtons.jsx
import React, { useState } from 'react';
import { 
  Button, Stack, Snackbar, Alert, Dialog, 
  DialogTitle, DialogContent, DialogActions,
  Typography, CircularProgress, Box
} from '@mui/material';
import { 
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  Description as ExcelIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportButtons({ resultado }) {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportType, setExportType] = useState(null);

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  const handleExportClick = (type) => {
    setExportType(type);
    setDialogOpen(true);
  };

  const exportarExcel = () => {
    setLoading(true);
    setDialogOpen(false);
    
    try {
      const wb = XLSX.utils.book_new();
      
      // Función para convertir array a hoja
      const hoja = (arr, nombre) => {
        if (arr && arr.length > 0) {
          // Normalizar datos para el reporte
          let datos = arr;
          
          if (nombre === 'Exactas') {
            // Las coincidencias exactas tienen una estructura anidada
            datos = arr.map(item => ({
              ...item.sistema,
              banco_referencia: item.banco.referencia,
              banco_fecha: item.banco.fecha,
              banco_debito: item.banco.debito,
              banco_credito: item.banco.credito,
              banco_descripcion: item.banco.descripcion
            }));
          }
          
          // Crear hoja
          const ws = XLSX.utils.json_to_sheet(datos);
          
          // Agregar estilos y formato
          const colWidths = [
            { wch: 15 }, // Referencia
            { wch: 12 }, // Fecha
            { wch: 12 }, // Débito
            { wch: 12 }, // Crédito
            { wch: 30 }, // Descripción
          ];
          
          ws['!cols'] = colWidths;
          
          // Añadir la hoja al libro
          XLSX.utils.book_append_sheet(wb, ws, nombre);
        }
      };
      
      // Crear hojas para cada tipo de resultado
      hoja(resultado.coincidenciasExactas, 'Exactas');
      hoja(resultado.coincidenciasAproximadas, 'Aproximadas');
      hoja(resultado.sinCoincidencia, 'SinCoincidencia');
      
      if (resultado.registrosBancoNoUtilizados) {
        hoja(resultado.registrosBancoNoUtilizados, 'BancoNoUsados');
      }
      
      // Añadir hoja de resumen
      const resumen = [
        { 
          categoria: 'Coincidencias Exactas', 
          cantidad: resultado.coincidenciasExactas.length 
        },
        { 
          categoria: 'Coincidencias Aproximadas', 
          cantidad: resultado.coincidenciasAproximadas.length 
        },
        { 
          categoria: 'Sin Coincidencia', 
          cantidad: resultado.sinCoincidencia.length 
        }
      ];
      
      if (resultado.registrosBancoNoUtilizados) {
        resumen.push({ 
          categoria: 'Registros del Banco No Utilizados', 
          cantidad: resultado.registrosBancoNoUtilizados.length 
        });
      }
      
      const ws_resumen = XLSX.utils.json_to_sheet(resumen);
      XLSX.utils.book_append_sheet(wb, ws_resumen, 'Resumen');

      // Guardar archivo
      const fechaHora = new Date().toISOString().replace(/[:.]/g, '-');
      XLSX.writeFile(wb, `reporte_conciliacion_${fechaHora}.xlsx`);
      
      setSnackbar({
        open: true,
        message: 'Archivo Excel generado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      setSnackbar({
        open: true,
        message: `Error al generar Excel: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    setLoading(true);
    setDialogOpen(false);
    
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Añadir título y fecha
      doc.setFontSize(18);
      doc.text('Reporte de Conciliación Bancaria', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 27);
      
      // Añadir resumen
      doc.setFontSize(14);
      doc.text('Resumen', 14, 35);
      
      // Tabla de resumen
      autoTable(doc, {
        startY: 40,
        head: [['Categoría', 'Cantidad']],
        body: [
          ['Coincidencias Exactas', resultado.coincidenciasExactas.length],
          ['Coincidencias Aproximadas', resultado.coincidenciasAproximadas.length],
          ['Sin Coincidencia', resultado.sinCoincidencia.length],
          resultado.registrosBancoNoUtilizados ? 
            ['Registros del Banco No Utilizados', resultado.registrosBancoNoUtilizados.length] : []
        ].filter(row => row.length > 0)
      });
      
      // Coincidencias Exactas
      const startY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Coincidencias Exactas', 14, startY);
      
      autoTable(doc, {
        startY: startY + 5,
        head: [['Referencia', 'Fecha', 'Débito', 'Crédito', 'Descripción']],
        body: resultado.coincidenciasExactas.map(r => [
          r.sistema.referencia || '', 
          r.sistema.fecha || '', 
          r.sistema.debito || '', 
          r.sistema.credito || '', 
          r.sistema.descripcion || ''
        ]),
        headStyles: { fillColor: [76, 175, 80] }
      });
      
      // Si hay demasiados datos, agregamos más páginas
      if (resultado.coincidenciasAproximadas.length > 0) {
        const startY = doc.lastAutoTable.finalY + 10;
        if (startY > 180) doc.addPage();
        
        doc.setFontSize(14);
        doc.text('Coincidencias Aproximadas', 14, startY > 180 ? 20 : startY);
        
        autoTable(doc, {
          startY: startY > 180 ? 25 : startY + 5,
          head: [['Referencia', 'Fecha', 'Débito', 'Crédito', 'Descripción']],
          body: resultado.coincidenciasAproximadas.map(r => [
            r.referencia || '', 
            r.fecha || '', 
            r.debito || '', 
            r.credito || '', 
            r.descripcion || ''
          ]),
          headStyles: { fillColor: [255, 193, 7] }
        });
      }
      
      // Registros Sin Coincidencia
      if (resultado.sinCoincidencia.length > 0) {
        const startY = doc.lastAutoTable.finalY + 10;
        if (startY > 180) doc.addPage();
        
        doc.setFontSize(14);
        doc.text('Registros Sin Coincidencia', 14, startY > 180 ? 20 : startY);
        
        autoTable(doc, {
          startY: startY > 180 ? 25 : startY + 5,
          head: [['Referencia', 'Fecha', 'Débito', 'Crédito', 'Descripción']],
          body: resultado.sinCoincidencia.map(r => [
            r.referencia || '', 
            r.fecha || '', 
            r.debito || '', 
            r.credito || '', 
            r.descripcion || ''
          ]),
          headStyles: { fillColor: [244, 67, 54] }
        });
      }
      
      // Guardar archivo
      const fechaHora = new Date().toISOString().replace(/[:.]/g, '-');
      doc.save(`reporte_conciliacion_${fechaHora}.pdf`);
      
      setSnackbar({
        open: true,
        message: 'Archivo PDF generado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      setSnackbar({
        open: true,
        message: `Error al generar PDF: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={2} mt={3}>
        <Button 
          variant="contained" 
          startIcon={<ExcelIcon />}
          onClick={() => handleExportClick('excel')}
          color="primary"
        >
          Exportar a Excel
        </Button>
        
        <Button 
          variant="outlined"
          startIcon={<PdfIcon />}
          onClick={() => handleExportClick('pdf')}
          color="secondary"
        >
          Exportar a PDF
        </Button>
      </Stack>
      
      {/* Dialog para confirmar exportación */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {exportType === 'excel' 
            ? 'Exportar a Excel' 
            : 'Exportar a PDF'}
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1">
            {exportType === 'excel'
              ? '¿Desea exportar los resultados de la conciliación a un archivo Excel? El archivo incluirá hojas separadas para cada categoría de resultados.'
              : '¿Desea exportar los resultados de la conciliación a un archivo PDF? El documento incluirá secciones para cada categoría de resultados.'}
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={exportType === 'excel' ? exportarExcel : exportarPDF}
            variant="contained" 
            disabled={loading}
            endIcon={loading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
          >
            {loading ? 'Procesando...' : 'Exportar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para mensajes */}
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
    </>
  );
}