// src/components/PWAInstallPrompt.jsx
import { useState, useEffect } from 'react';
import { 
  Button, 
  Snackbar, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Box
} from '@mui/material';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir que Chrome muestre el prompt automáticamente
      e.preventDefault();
      // Guardar el evento para usar después
      setDeferredPrompt(e);
      // Mostrar nuestro propio prompt después de 3 segundos
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Escuchar si hay actualizaciones del Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      }).catch(err => {
        console.error('Error al verificar actualizaciones del SW:', err);
      });
    }

    // Verificar si la app ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      console.log('La aplicación ya está instalada');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    setShowInstallPrompt(false);
    setShowInstallDialog(true);
  };

  const handleInstallConfirm = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Mostrar el prompt nativo de instalación
    deferredPrompt.prompt();
    
    // Esperar a la elección del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Elección de instalación: ${outcome}`);
    
    // Ya no podemos usar el prompt de nuevo, limpiamos
    setDeferredPrompt(null);
    setShowInstallDialog(false);
  };

  const handleCloseDialog = () => {
    setShowInstallDialog(false);
  };

  const handleCloseSnackbar = () => {
    setShowInstallPrompt(false);
  };

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }).catch(err => {
        console.error('Error al actualizar el SW:', err);
      });
      window.location.reload();
    }
    setUpdateAvailable(false);
  };

  return (
    <>
      {/* Notificación de instalación */}
      <Snackbar
        open={showInstallPrompt}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={15000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          severity="info"
          sx={{ width: '100%' }}
          action={
            <Button color="primary" size="small" onClick={handleInstallClick}>
              Instalar
            </Button>
          }
        >
          Instala esta aplicación en tu dispositivo
        </Alert>
      </Snackbar>

      {/* Diálogo de confirmación de instalación */}
      <Dialog
        open={showInstallDialog}
        onClose={handleCloseDialog}
        aria-labelledby="install-dialog-title"
      >
        <DialogTitle id="install-dialog-title">
          Instalar Conciliación Bancaria
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              Instala esta aplicación para:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1 }}>
              <li>Usar la aplicación sin conexión</li>
              <li>Acceder rápidamente desde tu escritorio</li>
              <li>Mejorar tu experiencia de usuario</li>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleInstallConfirm} variant="contained" color="primary">
            Instalar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificación de actualización */}
      <Snackbar
        open={updateAvailable}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          sx={{ width: '100%' }}
          action={
            <Button color="primary" size="small" onClick={handleUpdate}>
              Actualizar
            </Button>
          }
        >
          Hay una nueva versión disponible
        </Alert>
      </Snackbar>
    </>
  );
}