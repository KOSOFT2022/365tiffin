/**
 * Connectivity Manager for Frontend, Backend, and Database
 * Handles backend API endpoint resolution, Socket.io server connection,
 * and Firebase Database connection verification.
 */

import { db, auth, hasFirebaseConfig, testConnection } from './firebase';

// Helper to get or set backend API base URL
const STORAGE_KEY = 'tiffin_backend_api_url';

export function getBackendBaseUrl(): string {
  // 1. Check if user configured a custom backend URL in localStorage
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(STORAGE_KEY);
    if (customUrl && customUrl.trim().length > 0) {
      return customUrl.trim().replace(/\/+$/, '');
    }
  }

  // 2. Check environment variable VITE_API_URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }

  // 3. Fallback depending on environment
  if (typeof window !== 'undefined') {
    // If running on local dev machine
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    // Default to current window origin (if backend and frontend are hosted together)
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

export function setBackendBaseUrl(url: string) {
  if (typeof window !== 'undefined') {
    if (!url || url.trim() === '') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''));
    }
  }
}

// Get full API endpoint URL
export function getApiUrl(endpoint: string): string {
  const baseUrl = getBackendBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

// Get Socket.io connection URL
export function getSocketUrl(): string {
  return getBackendBaseUrl();
}

// Health check to test backend API connection
export async function testBackendConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const healthUrl = getApiUrl('/api/health');
    const res = await fetch(healthUrl, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, message: data.service || 'Connected to backend server' };
    }
    return { ok: false, message: `Backend responded with status ${res.status}` };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Failed to connect to backend' };
  }
}

export { db, auth, hasFirebaseConfig, testConnection };
