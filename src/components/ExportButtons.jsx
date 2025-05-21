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
      
      // Función para convertir array a hoja de Excel
      const crearHoja = (arr, nombre) => {
        if (arr && arr.length > 0) {
          // Normalizar datos para el reporte
          let datos = [];
          
          if (nombre === 'Exactas') {
            // Las coincidencias exactas tienen una estructura anidada
            datos = arr.map(item => ({
              sistema: item.sistema.referencia || 'N/A',
              banco: item.banco.referencia || 'N/A',
              diferencia: 0,
              // Incluir todos los campos detallados
              sistema_fecha: item.sistema.fecha || 'N/A',
              sistema_referencia: item.sistema.referencia || 'N/A',
              sistema_debito: item.sistema.debito || '0',
              sistema_credito: item.sistema.credito || '0',
              sistema_descripcion: item.sistema.descripcion || 'N/A',
              banco_fecha: item.banco.fecha || 'N/A',
              banco_referencia: item.banco.referencia || 'N/A',
              banco_debito: item.banco.debito || '0',
              banco_credito: item.banco.credito || '0',
              banco_descripcion: item.banco.descripcion || 'N/A'
            }));
          } else if (nombre === 'Aproximadas') {
            // Las coincidencias aproximadas tienen una estructura similar con diferencia
            datos = arr.map(item => ({
              sistema: item.sistema.referencia || 'N/A',
              banco: item.banco.referencia || 'N/A',
              diferencia: item.diferencia || 0,
              // Incluir todos los campos detallados
              sistema_fecha: item.sistema.fecha || 'N/A',
              sistema_referencia: item.sistema.referencia || 'N/A',
              sistema_debito: item.sistema.debito || '0',
              sistema_credito: item.sistema.credito || '0',
              sistema_descripcion: item.sistema.descripcion || 'N/A',
              banco_fecha: item.banco.fecha || 'N/A',
              banco_referencia: item.banco.referencia || 'N/A',
              banco_debito: item.banco.debito || '0',
              banco_credito: item.banco.credito || '0',
              banco_descripcion: item.banco.descripcion || 'N/A'
            }));
          } else if (nombre === 'SinCoincidencia') {
            // Registros sin coincidencia solo tienen datos del sistema
            datos = arr.map(item => ({
              sistema: item.referencia || 'N/A',
              banco: 'N/A',
              diferencia: 'N/A',
              sistema_fecha: item.fecha || 'N/A',
              sistema_referencia: item.referencia || 'N/A',
              sistema_debito: item.debito || '0',
              sistema_credito: item.credito || '0',
              sistema_descripcion: item.descripcion || 'N/A'
            }));
          } else if (nombre === 'BancoNoUsados') {
            // Registros de banco no utilizados
            datos = arr.map(item => ({
              sistema: 'N/A',
              banco: item.referencia || 'N/A',
              diferencia: 'N/A',
              banco_fecha: item.fecha || 'N/A',
              banco_referencia: item.referencia || 'N/A',
              banco_debito: item.debito || '0',
              banco_credito: item.credito || '0',
              banco_descripcion: item.descripcion || 'N/A'
            }));
          }
          
          // Crear hoja
          const ws = XLSX.utils.json_to_sheet(datos);
          
          // Agregar estilos y formato
          const colWidths = [
            { wch: 15 }, // sistema
            { wch: 15 }, // banco
            { wch: 10 }, // diferencia
            { wch: 12 }, // fecha sistema
            { wch: 15 }, // referencia sistema
            { wch: 12 }, // débito sistema
            { wch: 12 }, // crédito sistema
            { wch: 30 }, // descripción sistema
            { wch: 12 }, // fecha banco
            { wch: 15 }, // referencia banco
            { wch: 12 }, // débito banco
            { wch: 12 }, // crédito banco
            { wch: 30 }, // descripción banco
          ];
          
          ws['!cols'] = colWidths;
          
          // Añadir la hoja al libro
          XLSX.utils.book_append_sheet(wb, ws, nombre);
        }
      };
      
      // Crear hojas para cada tipo de resultado
      crearHoja(resultado.coincidenciasExactas, 'Exactas');
      crearHoja(resultado.coincidenciasAproximadas, 'Aproximadas');
      crearHoja(resultado.sinCoincidencia, 'SinCoincidencia');
      
      if (resultado.registrosBancoNoUtilizados) {
        crearHoja(resultado.registrosBancoNoUtilizados, 'BancoNoUsados');
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
        head: [['Ref. Sistema', 'Ref. Banco', 'Diferencia', 'Descripción']],
        body: resultado.coincidenciasExactas.map(r => [
          r.sistema.referencia || '', 
          r.banco.referencia || '', 
          '0.00',
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
          head: [['Ref. Sistema', 'Ref. Banco', 'Diferencia', 'Descripción']],
          body: resultado.coincidenciasAproximadas.map(r => [
            r.sistema.referencia || '', 
            r.banco.referencia || '', 
            r.diferencia.toFixed(2), 
            r.sistema.descripcion || ''
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