// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Container, Snackbar, Alert } from '@mui/material';
import Dashboard from './components/Dashboard';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { setupOfflineDetection, precacheImportantRoutes } from './utils/offlineTest';

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineSnackbarOpen, setOfflineSnackbarOpen] = useState(false);

  useEffect(() => {
    // Configurar detección de modo offline
    setupOfflineDetection();

    // Precachear rutas importantes para el funcionamiento offline
    precacheImportantRoutes();

    // Manejar eventos de conexión
    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOfflineSnackbarOpen(true);
    };

    // Verificar el estado de conexión inicial
    if (!navigator.onLine) {
      setOfflineSnackbarOpen(true);
    }

    // Registrar escuchadores de eventos
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Limpieza
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCloseOfflineSnackbar = () => {
    setOfflineSnackbarOpen(false);
  };

  return (
    <Container>
      <Dashboard />
      <PWAInstallPrompt />

      {/* Notificación de modo offline */}
      <Snackbar
        open={offlineSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseOfflineSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          onClose={handleCloseOfflineSnackbar}
          variant="filled"
        >
          {isOffline
            ? "Estás trabajando en modo offline. Algunas funciones pueden no estar disponibles."
            : "Conexión restablecida. Todos los servicios están disponibles."}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;