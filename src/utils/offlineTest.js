// src/utils/offlineTest.js
/**
 * Función para probar el soporte offline de la PWA
 * Este archivo debe importarse en algún componente principal (como App.jsx)
 */

// Comprueba si la aplicación está en modo offline y muestra un indicador
export function setupOfflineDetection() {
  // Variable para almacenar el estado de conexión
  let isOnline = navigator.onLine;
  
  // Elemento para mostrar el estado (puede ser null hasta que se cree)
  let statusElement = null;
  
  // Función para actualizar la interfaz según el estado de conexión
  function updateOnlineStatus() {
    isOnline = navigator.onLine;
    
    console.log(`Estado de conexión: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Si ya existe el elemento de estado, actualizar su contenido
    if (statusElement) {
      statusElement.textContent = isOnline ? 'Online' : 'Offline';
      statusElement.style.backgroundColor = isOnline ? '#4caf50' : '#f44336';
    } else {
      // Crear el elemento de estado si no existe
      statusElement = document.createElement('div');
      statusElement.style.position = 'fixed';
      statusElement.style.bottom = '10px';
      statusElement.style.right = '10px';
      statusElement.style.padding = '8px 12px';
      statusElement.style.borderRadius = '4px';
      statusElement.style.color = 'white';
      statusElement.style.fontWeight = 'bold';
      statusElement.style.zIndex = '9999';
      statusElement.textContent = isOnline ? 'Online' : 'Offline';
      statusElement.style.backgroundColor = isOnline ? '#4caf50' : '#f44336';
      
      document.body.appendChild(statusElement);
    }
  }
  
  // Actualizar el estado cuando la página se carga
  window.addEventListener('load', updateOnlineStatus);
  
  // Actualizar cuando el estado de conexión cambia
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Comprueba si hay Service Worker registrado
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      console.log('Service Worker listo:', reg);
    }).catch(err => {
      console.error('Error con el Service Worker:', err);
    });
  } else {
    console.warn('Service Worker no soportado en este navegador');
  }
  
  // Reportar el estado actual de la aplicación para debugging
  console.log({
    pwaInstalled: window.matchMedia('(display-mode: standalone)').matches,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    caches: 'caches' in window,
    online: navigator.onLine
  });
}

// Función para verificar si una ruta específica está en caché
export async function checkIfPathIsCached(path) {
  if (!('caches' in window)) {
    console.warn('API de Caché no disponible en este navegador');
    return false;
  }
  
  try {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(path);
      
      if (cachedResponse) {
        console.log(`La ruta ${path} está en caché (${cacheName})`);
        return true;
      }
    }
    
    console.warn(`La ruta ${path} NO está en caché`);
    return false;
  } catch (err) {
    console.error('Error al verificar caché:', err);
    return false;
  }
}

// Esta función se puede llamar para forzar el cacheo de rutas críticas
export async function precacheImportantRoutes() {
  const routes = [
    '/',
    '/index.html',
    '/manifest.json'
  ];
  
  // Solo ejecutar si el service worker está activo
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    await navigator.serviceWorker.ready;
    console.log('Precacheando rutas importantes...');
    
    // Solicitar cada ruta para que el service worker la intercepte
    for (const route of routes) {
      try {
        const response = await fetch(route);
        console.log(`Ruta ${route} cacheada: ${response.ok}`);
      } catch (err) {
        console.error(`Error al cachear ${route}:`, err);
      }
    }
    
    return true;
  } catch (err) {
    console.error('Error al precachear rutas:', err);
    return false;
  }
}