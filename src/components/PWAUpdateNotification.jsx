// src/components/PWAUpdateNotification.jsx
import React, { useEffect, useState } from 'react';
import { Snackbar, Button, Alert } from '@mui/material';

export default function PWAUpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Solo ejecutar si el service worker está disponible
    if ('serviceWorker' in navigator) {
      // Escuchar eventos del service worker
      window.addEventListener('pwa-update-available', (event) => {
        setUpdateAvailable(true);
        setRegistration(event.detail);
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Enviar un mensaje al service worker para que se actualice
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return (
    <Snackbar 
      open={updateAvailable} 
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        severity="info"
        action={
          <Button color="inherit" size="small" onClick={handleUpdate}>
            Actualizar
          </Button>
        }
      >
        Hay una nueva versión disponible
      </Alert>
    </Snackbar>
  );
}