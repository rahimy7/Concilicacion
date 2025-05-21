// src/components/ConfiguracionMargen.jsx
import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Box, Grid, TextField, 
  Slider, Button, FormControl, InputLabel, 
  Select, MenuItem, InputAdornment, IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const ConfiguracionMargen = ({ 
  tolerancia, 
  setTolerancia, 
  onRecalcular, 
  disabled = false
}) => {
  // Verificar si el valor de tolerancia es válido
  const [valorManual, setValorManual] = useState(tolerancia.toString());
  const [error, setError] = useState('');
  
  // Opciones predefinidas de tolerancia
  const opcionesTolerancia = [
    { valor: 0.01, etiqueta: '0.01 (1 centavo)' },
    { valor: 0.1, etiqueta: '0.10 (10 centavos)' },
    { valor: 1, etiqueta: '1.00 (1 peso)' },
    { valor: 5, etiqueta: '5.00 (5 pesos)' },
    { valor: 10, etiqueta: '10.00 (10 pesos)' },
    { valor: 100, etiqueta: '100.00 (100 pesos)' },
    { valor: 1000, etiqueta: '1,000.00 (1,000 pesos)' },
  ];

  // Actualizar valor manual cuando cambia la tolerancia
  useEffect(() => {
    setValorManual(tolerancia.toString());
  }, [tolerancia]);

  // Función para validar y actualizar el valor
  const validarYActualizar = (valor) => {
    // Convertir a número
    const num = parseFloat(valor);
    if (isNaN(num)) {
      setError('Ingrese un número válido');
      return false;
    }
    
    if (num < 0) {
      setError('El valor debe ser positivo');
      return false;
    }
    
    setError('');
    setTolerancia(num);
    return true;
  };

  // Manejar cambio de valor manual
  const handleManualChange = (e) => {
    const valor = e.target.value;
    setValorManual(valor);
    
    // Validar después de un breve retraso para permitir la escritura
    if (valor.trim() !== '') {
      validarYActualizar(valor);
    }
  };

  // Incrementar/decrementar valor
  const incrementar = (cantidad) => {
    const nuevoValor = parseFloat((tolerancia + cantidad).toFixed(2));
    if (nuevoValor >= 0) {
      setTolerancia(nuevoValor);
      setValorManual(nuevoValor.toString());
    }
  };

  // Manejar recálculo
  const handleRecalcular = () => {
    // Validar una última vez antes de recalcular
    if (validarYActualizar(valorManual)) {
      onRecalcular();
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Configuración del Margen de Tolerancia</Typography>
        <Tooltip title="El margen de tolerancia define la diferencia máxima permitida entre montos para considerarlos como coincidentes. Un margen mayor encontrará más coincidencias pero podría incluir falsos positivos." arrow>
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Grid container spacing={2}>
        {/* Selector de valores predefinidos */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Valores Predefinidos</InputLabel>
            <Select
              value={opcionesTolerancia.some(o => o.valor === tolerancia) ? tolerancia : ''}
              onChange={(e) => {
                const valor = parseFloat(e.target.value);
                setTolerancia(valor);
                setValorManual(valor.toString());
              }}
              label="Valores Predefinidos"
              disabled={disabled}
            >
              {opcionesTolerancia.map((opcion) => (
                <MenuItem key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Entrada manual con botones de incremento/decremento */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              size="small" 
              onClick={() => incrementar(-0.01)}
              disabled={tolerancia <= 0.01 || disabled}
            >
              <RemoveIcon />
            </IconButton>
            
            <TextField
              label="Valor Personalizado"
              value={valorManual}
              onChange={handleManualChange}
              error={!!error}
              helperText={error}
              size="small"
              fullWidth
              disabled={disabled}
              InputProps={{
                endAdornment: <InputAdornment position="end">RD$</InputAdornment>,
              }}
            />
            
            <IconButton 
              size="small" 
              onClick={() => incrementar(0.01)}
              disabled={disabled}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Grid>
        
        {/* Slider para ajuste visual */}
        <Grid item xs={12}>
          <Typography variant="body2" gutterBottom>
            Ajuste del margen (0.01 - 10.00):
          </Typography>
          <Slider
            value={tolerancia > 10 ? 10 : (tolerancia < 0.01 ? 0.01 : tolerancia)}
            min={0.01}
            max={10}
            step={0.01}
            onChange={(_, value) => {
              setTolerancia(value);
              setValorManual(value.toString());
            }}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `RD$ ${value.toFixed(2)}`}
            disabled={disabled}
            marks={[
              { value: 0.01, label: '0.01' },
              { value: 1, label: '1.00' },
              { value: 5, label: '5.00' },
              { value: 10, label: '10.00' }
            ]}
          />
        </Grid>
        
        {/* Botón de recálculo */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRecalcular}
            disabled={disabled}
            fullWidth
          >
            Recalcular Conciliación con Nuevo Margen
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ConfiguracionMargen;