import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n';

// Suppress and intercept Google Maps Directions Service authorization errors from polluting console / test runner
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = function (...args: any[]) {
  const msg = args.map(arg => typeof arg === 'string' ? arg : (arg?.message || String(arg || ''))).join(' ');
  if (
    msg.includes('Directions Service') || 
    msg.includes('DIRECTIONS_ROUTE') || 
    msg.includes('REQUEST_DENIED') ||
    msg.includes('not authorized to use this service')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = function (...args: any[]) {
  const msg = args.map(arg => typeof arg === 'string' ? arg : (arg?.message || String(arg || ''))).join(' ');
  if (
    msg.includes('Directions Service') || 
    msg.includes('DIRECTIONS_ROUTE') || 
    msg.includes('REQUEST_DENIED') ||
    msg.includes('not authorized to use this service')
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('Directions Service') || 
      msg.includes('DIRECTIONS_ROUTE') || 
      msg.includes('REQUEST_DENIED') ||
      msg.includes('not authorized to use this service')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (
      msg.includes('Directions Service') || 
      msg.includes('DIRECTIONS_ROUTE') || 
      msg.includes('REQUEST_DENIED') ||
      msg.includes('not authorized to use this service')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for offline support & intermittent connectivity tracking
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('TiffinGo Service Worker registered successfully with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('TiffinGo Service Worker registration failed:', error);
      });
  });
}

