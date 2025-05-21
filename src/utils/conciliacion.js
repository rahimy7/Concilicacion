// Función para analizar y determinar patrones en nombres de columnas
export const analizarFormatosColumnas = (columnNames) => {
  console.log("Analizando nombres de columnas:", columnNames);
  
  // Convertir a minúsculas para comparación
  const columnasMinus = columnNames.map(c => c.toLowerCase().trim());
  
  // Patrones para diferentes tipos de columnas
  const patronesFecha = ['fecha', 'date', 'posting date', 'posting'];
  const patronesDebito = ['déb', 'deb', 'cargo', 'debe', 'debit'];
  const patronesCredito = ['créd', 'cred', 'abono', 'haber', 'credit'];
  const patronesReferencia = ['ref', 'no.', 'num', 'document', 'ncf'];
  const patronesDescripcion = ['desc', 'concept', 'detalle', 'mov'];
  
  // Buscar coincidencias
  const columnasFecha = columnasMinus.filter(col => 
    patronesFecha.some(patron => col.includes(patron))
  );
  
  const columnasDebito = columnasMinus.filter(col => 
    patronesDebito.some(patron => col.includes(patron))
  );
  
  const columnasCredito = columnasMinus.filter(col => 
    patronesCredito.some(patron => col.includes(patron))
  );
  
  const columnasReferencia = columnasMinus.filter(col => 
    patronesReferencia.some(patron => col.includes(patron))
  );
  
  const columnasDescripcion = columnasMinus.filter(col => 
    patronesDescripcion.some(patron => col.includes(patron))
  );
  
  return {
    fechas: columnasFecha,
    debitos: columnasDebito,
    creditos: columnasCredito,
    referencias: columnasReferencia,
    descripciones: columnasDescripcion,
    todasIdentificadas: columnasFecha.length > 0 && 
                      (columnasDebito.length > 0 || columnasCredito.length > 0)
  };
};

// Función para generar un mapeador de columnas basado en el análisis
export const generarMapeadorColumnas = (columnasOriginales, analisis) => {
  const mapeador = {};
  
  // Función para encontrar la columna original que corresponde a un patrón
  const encontrarColumnaOriginal = (patrones) => {
    if (!patrones || patrones.length === 0) return null;
    
    // Buscar la columna original que corresponde al primer patrón identificado
    const patron = patrones[0];
    return columnasOriginales.find(col => 
      col.toLowerCase().trim().includes(patron)
    );
  };
  
  // Mapear columnas según los patrones identificados
  mapeador.fecha = encontrarColumnaOriginal(analisis.fechas);
  mapeador.debito = encontrarColumnaOriginal(analisis.debitos);
  mapeador.credito = encontrarColumnaOriginal(analisis.creditos);
  mapeador.referencia = encontrarColumnaOriginal(analisis.referencias);
  mapeador.descripcion = encontrarColumnaOriginal(analisis.descripciones);
  
  return mapeador;
};

// Función específica para mapeo directo de Navision/Dynamics
export const mapearNavision = (data) => {
  if (!data || data.length === 0) return [];

  console.log("Aplicando mapeo directo para Navision (hardcoded)");
  
  // Mapeo directo sin detección - para solucionar problemas de incompatibilidad
  return data.map((row, index) => {
    // CORRECCIÓN: Extraer valores numéricos correctamente
    const limpiarNumero = (valor) => {
      if (valor === undefined || valor === null || valor === '') return '0';
      
      // Si ya es un número, convertirlo a string
      if (typeof valor === 'number') return String(valor);
      
      // Si es string, conservar el valor original
      return String(valor);
    };

    // Obtener valores de débito y crédito
    const debitoStr = limpiarNumero(row['Debit']);
    const creditoStr = limpiarNumero(row['Credit']);
    
    // Crear objeto normalizado con mapeo exacto
    const normalizado = {
      // Mapeo específico para las columnas de Libro2.xlsx
      fecha: row['Posting Date'] || 'N/A',
      referencia: row['Document No.'] || 'N/A',
      descripcion: row['Description'] || 'N/A',
      debito: debitoStr,
      credito: creditoStr
    };
    
    // Depuración para los primeros registros
    if (index < 2) {
      console.log(`Registro NAV #${index + 1} - Original:`, {
        postingDate: row['Posting Date'],
        documentNo: row['Document No.'],
        description: row['Description'],
        debit: row['Debit'],
        credit: row['Credit']
      });
      console.log(`Registro NAV #${index + 1} - Normalizado:`, normalizado);
    }
    
    return normalizado;
  });
};

// Función para validar el formato de los datos cargados
export const validarFormatoArchivo = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { valido: false, mensaje: "El archivo no contiene datos válidos." };
  }

  // Verificar presencia de columnas necesarias usando el nuevo método de análisis
  const primeraFila = data[0];
  const columnasOriginales = Object.keys(primeraFila);
  
  // Analizar formatos de columnas
  const analisis = analizarFormatosColumnas(columnasOriginales);
  
  // Si se identificaron las columnas clave necesarias, el archivo es válido
  if (analisis.todasIdentificadas) {
    return { 
      valido: true, 
      mapeador: generarMapeadorColumnas(columnasOriginales, analisis)
    };
  }
  
  // Detectar formato específico - Sistema (NAV)
  const esNavision = columnasOriginales.includes('Posting Date') && 
                  columnasOriginales.includes('Document No.') &&
                  columnasOriginales.includes('Debit');
                  
  // Detectar formato específico - Banco BHD
  const esBHD = columnasOriginales.includes('Fecha') && 
              (columnasOriginales.includes(' Débito ') || columnasOriginales.includes('Débito'));
              
  if (esNavision || esBHD) {
    return { valido: true };
  }
  
  // Si no se identificaron todas las columnas necesarias
  return { 
    valido: false, 
    mensaje: "No se pudieron identificar las columnas necesarias para la conciliación. Se requieren columnas para fecha y débito/crédito."
  };
};

// Función para normalizar los datos de diferentes formatos
export const normalizarDatos = (data) => {
  // Si no hay datos, devolver un array vacío
  if (!data || data.length === 0) return [];
  
  // Mostrar datos originales para depuración
  console.log("Datos originales para normalizar:", data.slice(0, 2));
  
  // Obtener los nombres de columnas exactos
  const primeraFila = data[0];
  const columnasOriginales = Object.keys(primeraFila);
  console.log("Columnas originales:", columnasOriginales);
  
  // Detectar tipos de archivo específicos
  const esLibro2 = columnasOriginales.includes('Posting Date') && 
                columnasOriginales.includes('Document No.') && 
                columnasOriginales.includes('Debit');
                
  const esBHD = columnasOriginales.includes('Fecha') && 
              (columnasOriginales.includes('Débito') || columnasOriginales.includes(' Débito '));
  
  console.log("Tipo de archivo detectado:", {
    esLibro2,
    esBHD
  });
  
  // Aplicar mapeo específico según el tipo de archivo
  if (esLibro2) {
    console.log("Aplicando mapeo directo para Libro2 (NAV)");
    return mapearNavision(data);
  } else if (esBHD) {
    console.log("Aplicando mapeo específico para BHD");
    
     // Buscar los nombres exactos de las columnas
    const colFecha = columnasOriginales.find(col => col === 'Fecha');
    const colReferencia = columnasOriginales.find(col => col === 'Referencia' || col === 'NCF');
    const colDescripcion = columnasOriginales.find(col => 
      col.includes('Desc') || col.includes('Movimiento'));
    const colDebito = columnasOriginales.find(col => 
      col.includes('Débito') || col.includes('Debito'));
    const colCredito = columnasOriginales.find(col => 
      col.includes('Crédito') || col.includes('Credito'));
    
    console.log("Columnas BHD identificadas:", { 
      colFecha, 
      colReferencia, 
      colDescripcion, 
      colDebito, 
      colCredito 
    });
    
    // También buscar código de movimiento para usar como descripción si es necesario
    const colCodigoMovimiento = columnasOriginales.find(col => 
      col.includes('Cód') || col.includes('Cod') || col.includes('Código'));
    
    // Mapeo específico para BHD
    return data.map((row, index) => {
      // Determinar la mejor descripción disponible
      let descripcion = '';
      if (colDescripcion && row[colDescripcion]) {
        descripcion = row[colDescripcion];
      } else if (colCodigoMovimiento && row[colCodigoMovimiento]) {
        descripcion = row[colCodigoMovimiento];
      }
      
      // Si hay código de movimiento pero también hay descripción, combinarlos
      if (colCodigoMovimiento && row[colCodigoMovimiento] && 
          colDescripcion && row[colDescripcion] &&
          !descripcion.includes(row[colCodigoMovimiento])) {
        descripcion = row[colCodigoMovimiento] + ' - ' + row[colDescripcion];
      }
      
      // CORRECCIÓN: Preservar los valores originales
      const debitoVal = colDebito && row[colDebito] !== undefined && row[colDebito] !== null ? 
                     String(row[colDebito]) : '0';
      const creditoVal = colCredito && row[colCredito] !== undefined && row[colCredito] !== null ? 
                      String(row[colCredito]) : '0';
      
      // Crear objeto normalizado
      const normalizado = {
        fecha: colFecha && row[colFecha] ? row[colFecha] : 'N/A',
        referencia: colReferencia && row[colReferencia] ? row[colReferencia] : 
                   (row['NCF'] || row['Referencia'] || '0'),
        descripcion: descripcion || 'N/A',
        debito: debitoVal,
        credito: creditoVal
      };
      
      // Depuración para los primeros registros
      if (index < 2) {
        console.log(`Registro BHD #${index + 1} - Original:`, row);
        console.log(`Registro BHD #${index + 1} - Normalizado:`, normalizado);
      }
      
      return normalizado;
    });
  }
  
  // Si no se detecta un tipo específico, aplicar mapeo genérico
  console.log("Aplicando mapeo genérico basado en análisis de columnas");
  
  // Analizar las columnas para detectar patrones
  const analisis = analizarFormatosColumnas(columnasOriginales);
  const mapeador = generarMapeadorColumnas(columnasOriginales, analisis);
  
  console.log("Mapeador generado:", mapeador);
  
  // Aplicar el mapeo genérico
  return data.map((row, index) => {
    // CORRECCIÓN: Preservar los valores originales como strings
    const debitoVal = mapeador.debito && row[mapeador.debito] !== undefined && row[mapeador.debito] !== null ? 
                   String(row[mapeador.debito]) : '0';
    const creditoVal = mapeador.credito && row[mapeador.credito] !== undefined && row[mapeador.credito] !== null ? 
                    String(row[mapeador.credito]) : '0';
                    
    const normalizado = {
      fecha: mapeador.fecha ? row[mapeador.fecha] : 'N/A',
      referencia: mapeador.referencia ? row[mapeador.referencia] : 'N/A',
      descripcion: mapeador.descripcion ? row[mapeador.descripcion] : 'N/A',
      debito: debitoVal,
      credito: creditoVal
    };
    
    // Depuración para los primeros registros
    if (index < 2) {
      console.log(`Registro Genérico #${index + 1} - Original:`, row);
      console.log(`Registro Genérico #${index + 1} - Normalizado:`, normalizado);
    }
    
    return normalizado;
  });
};

// Función para conciliar registros entre sistema y banco
export const conciliarRegistros = (sistema, banco, margenTolerancia = 0.01) => {
  const exactas = [];
  const aproximadas = [];
  const sinCoincidencia = [];

  // Validar que ambos arrays tengan datos
  if (!sistema?.length || !banco?.length) {
    return { 
      coincidenciasExactas: [], 
      coincidenciasAproximadas: [], 
      sinCoincidencia: sistema || [],
      registrosBancoNoUtilizados: banco || []
    };
  }
  
  console.log(`Ejecutando conciliación con margen de tolerancia: ${margenTolerancia}`);
  
  // CORRECCIÓN: Mejorado para manejar diferentes formatos de números
  const limpiarYConvertir = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0;
    
    // Si ya es un número, devolverlo
    if (typeof valor === 'number') return valor;
    
    // Si es string, limpiar y convertir
    let limpio = String(valor)
      .replace(/[^\d.-]/g, '') // Eliminar todo excepto números, puntos y guiones
      .replace(/,/g, '');      // Eliminar comas
    
    return limpio === '' ? 0 : parseFloat(limpio);
  };
  
  // Procesar sistema para tener valores numéricos limpios
  const sistemaProcesado = sistema.map(reg => ({
    ...reg,
    debitoNum: limpiarYConvertir(reg.debito),
    creditoNum: limpiarYConvertir(reg.credito)
  }));
  
  // Procesar banco para tener valores numéricos limpios
  const bancoProcesado = banco.map((reg, index) => ({
    ...reg,
    _id: `banco-${index}`, // Añadir un ID único a cada registro del banco
    debitoNum: limpiarYConvertir(reg.debito),
    creditoNum: limpiarYConvertir(reg.credito)
  }));
  
  // Set para registros del banco ya utilizados
  const registrosUsados = new Set();
  
  // PASO 1: BUSCAR COINCIDENCIAS EXACTAS
  // Recorrer todos los registros del sistema
  for (const regSistema of sistemaProcesado) {
    let coincidenciaEncontrada = false;
    
    // Determinar el valor a buscar (débito o crédito)
    const valorBuscar = regSistema.debitoNum > 0 ? regSistema.debitoNum : regSistema.creditoNum;
    const esBuscarDebito = regSistema.debitoNum > 0;
    
    // Buscar una coincidencia exacta entre los registros del banco no utilizados
    for (const regBanco of bancoProcesado) {
      // Omitir registros ya utilizados
      if (registrosUsados.has(regBanco._id)) continue;
      
      const valorBanco = esBuscarDebito ? regBanco.creditoNum : regBanco.debitoNum;
      
      // Verificar coincidencia exacta
      if (Math.abs(valorBanco - valorBuscar) < 0.001) { // Usar una tolerancia muy pequeña para coincidencias "exactas"
        exactas.push({ sistema: regSistema, banco: regBanco });
        registrosUsados.add(regBanco._id);
        coincidenciaEncontrada = true;
        break; // Salir del bucle al encontrar una coincidencia
      }
    }
    
    // Si no se encontró coincidencia exacta, el registro queda pendiente para la búsqueda aproximada
    if (!coincidenciaEncontrada) {
      // Marcar para evaluación de coincidencia aproximada
      regSistema._pendienteAprox = true;
    }
  }
  
  // PASO 2: BUSCAR COINCIDENCIAS APROXIMADAS ENTRE LOS REGISTROS RESTANTES
  for (const regSistema of sistemaProcesado) {
    // Omitir registros que ya tienen coincidencia exacta
    if (!regSistema._pendienteAprox) continue;
    
    let mejorCoincidencia = null;
    let menorDiferencia = Infinity;
    let idMejorCoincidencia = null;
    
    // Determinar el valor a buscar (débito o crédito)
    const valorBuscar = regSistema.debitoNum > 0 ? regSistema.debitoNum : regSistema.creditoNum;
    const esBuscarDebito = regSistema.debitoNum > 0;
    
    // Buscar la mejor coincidencia aproximada
    for (const regBanco of bancoProcesado) {
      // Omitir registros ya utilizados
      if (registrosUsados.has(regBanco._id)) continue;
      
      const valorBanco = esBuscarDebito ? regBanco.creditoNum : regBanco.debitoNum;
      const diferencia = Math.abs(valorBanco - valorBuscar);
      
      // Si la diferencia está dentro del margen y es mejor que la anterior
      if (diferencia <= margenTolerancia && diferencia < menorDiferencia) {
        mejorCoincidencia = regBanco;
        menorDiferencia = diferencia;
        idMejorCoincidencia = regBanco._id;
      }
    }
    
    // Si se encontró una coincidencia aproximada
    if (mejorCoincidencia) {
      aproximadas.push({ 
        sistema: regSistema, 
        banco: mejorCoincidencia,
        diferencia: menorDiferencia
      });
      registrosUsados.add(idMejorCoincidencia);
    } else {
      // Si no hay coincidencia, va a la lista de sin coincidencia
      sinCoincidencia.push(regSistema);
    }
  }
  
  // PASO 3: IDENTIFICAR REGISTROS DEL BANCO NO UTILIZADOS
  const registrosBancoNoUtilizados = bancoProcesado.filter(reg => !registrosUsados.has(reg._id));
  
  // Mostrar estadísticas
  console.log(`Resultados de conciliación - Margen: ${margenTolerancia}`, {
    coincidenciasExactas: exactas.length,
    coincidenciasAproximadas: aproximadas.length,
    sinCoincidencia: sinCoincidencia.length,
    registrosBancoNoUtilizados: registrosBancoNoUtilizados.length,
    totalRegistrosSistema: sistema.length,
    totalRegistrosBanco: banco.length,
    totalCoincidencias: exactas.length + aproximadas.length
  });
  
  return { 
    coincidenciasExactas: exactas, 
    coincidenciasAproximadas: aproximadas,
    sinCoincidencia,
    registrosBancoNoUtilizados,
    margenTolerancia // Incluir el margen usado para referencia
  };
};