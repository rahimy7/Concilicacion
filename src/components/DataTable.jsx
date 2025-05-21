// src/components/DataTable.jsx
import React, { useState } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const DataTable = ({ 
  rows, 
  columns, 
  height = 400, 
  pageSize = 10,
  disableColumnResize = false
}) => {
  const [pageModel, setPageModel] = useState({ page: 0, pageSize });

  // Validar los datos de entrada
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return (
      <Alert severity="info">
        No hay datos disponibles para mostrar.
      </Alert>
    );
  }

  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    return (
      <Alert severity="error">
        Error: No se han definido columnas para la tabla.
      </Alert>
    );
  }

  // Función para mostrar un valor monetario exactamente como está
  const validatedRows = rows.map((row, index) => {
    // Si no hay id, asignar uno generado
    const id = row.id !== undefined ? row.id : `row-${index}`;
    
    // Imprimir valores para verificación
    if (index < 3) {
      console.log(`Fila ${index} (${id}):`, {
        debito_original: row.debito,
        debito_tipo: typeof row.debito,
        credito_original: row.credito,
        credito_tipo: typeof row.credito
      });
    }
    
    return {
      ...row,
      id: id,
      // Para el resto de los campos, preservar el valor original sin cambios
      referencia: row.referencia || row.reference || 'N/A',
      fecha: row.fecha || row.date || 'N/A',
      descripcion: row.descripcion || row.description || 'N/A',
    };
  });

  return (
    <DataGrid
      rows={validatedRows}
      columns={columns}
      paginationModel={pageModel}
      onPaginationModelChange={setPageModel}
      pageSizeOptions={[5, 10, 25, 50, 100]}
      disableRowSelectionOnClick
      slots={{
        toolbar: GridToolbar,
      }}
      slotProps={{
        toolbar: {
          showQuickFilter: true,
          quickFilterProps: { debounceMs: 300 },
        },
      }}
      density="standard"
      columnVisibilityModel={{}}
      disableColumnMenu={false}
      getRowHeight={() => 'auto'}
      sx={{
        '& .MuiDataGrid-cell:focus': { outline: 'none' },
        '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
        '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
        '& .MuiDataGrid-cell': { 
          // Ajustar el padding de las celdas para mejorar la visualización
          py: 1,
          px: 1.5,
          whiteSpace: 'normal',
          overflow: 'visible',
          lineHeight: 1.43
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold'
        },
        minWidth: 700, // Ancho mínimo para asegurar que aparezca horizontal scrollbar
        width: '100%',
        height: height
      }}
      // Deshabilitar el cambio de tamaño de columnas si se solicita
      disableColumnResize={disableColumnResize}
    />
  );
};

export default DataTable;