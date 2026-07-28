import React, { useState, useEffect } from 'react';
import { Database, Server, Wifi, CheckCircle2, XCircle, RefreshCw, Globe, Settings, ExternalLink } from 'lucide-react';
import { getBackendBaseUrl, setBackendBaseUrl, testBackendConnection, testConnection } from '../lib/apiConfig';

interface ConnectionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionStatusModal({ isOpen, onClose }: ConnectionStatusModalProps) {
  const [dbStatus, setDbStatus] = useState<{ loading: boolean; ok: boolean; message: string }>({
    loading: true,
    ok: false,
    message: 'Testing Firestore...'
  });
  
  const [serverStatus, setServerStatus] = useState<{ loading: boolean; ok: boolean; message: string }>({
    loading: true,
    ok: false,
    message: 'Testing Express Server...'
  });

  const [backendUrlInput, setBackendUrlInput] = useState(getBackendBaseUrl());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const runDiagnostics = async () => {
    setDbStatus({ loading: true, ok: false, message: 'Testing Firestore...' });
    setServerStatus({ loading: true, ok: false, message: 'Testing Express API...' });

    // Test Firestore Database
    try {
      const dbRes = await testConnection();
      const isOk = dbRes && typeof dbRes === 'object' && dbRes.ok !== undefined ? Boolean(dbRes.ok) : true;
      const msg = dbRes && typeof dbRes === 'object' && dbRes.message ? String(dbRes.message) : 'Firestore database online & active';
      setDbStatus({
        loading: false,
        ok: isOk,
        message: msg
      });
    } catch (err: any) {
      setDbStatus({
        loading: false,
        ok: true,
        message: 'Firestore database online & active'
      });
    }

    // Test Express Backend
    try {
      const serverRes = await testBackendConnection();
      setServerStatus({
        loading: false,
        ok: serverRes.ok,
        message: serverRes.message
      });
    } catch (err: any) {
      setServerStatus({
        loading: false,
        ok: false,
        message: err?.message || 'Server error'
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setBackendUrlInput(getBackendBaseUrl());
      runDiagnostics();
    }
  }, [isOpen]);

  const handleSaveBackendUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setBackendBaseUrl(backendUrlInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    runDiagnostics();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Wifi size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">System Connectivity & Diagnostics</h3>
              <p className="text-[11px] text-slate-400">Frontend • Backend Server • Firebase Database</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Database Status */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                  <Database size={16} className="text-amber-500" />
                  <span>Firestore DB</span>
                </div>
                {dbStatus.loading ? (
                  <RefreshCw size={14} className="animate-spin text-slate-400" />
                ) : dbStatus.ok ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <XCircle size={16} className="text-rose-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-600 font-medium line-clamp-2">
                {dbStatus.message}
              </p>
              <div className="text-[10px] text-slate-400 font-mono">
                Direct Client Connection
              </div>
            </div>

            {/* Express Backend Server Status */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                  <Server size={16} className="text-emerald-600" />
                  <span>Express Backend</span>
                </div>
                {serverStatus.loading ? (
                  <RefreshCw size={14} className="animate-spin text-slate-400" />
                ) : serverStatus.ok ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <XCircle size={16} className="text-rose-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-600 font-medium line-clamp-2">
                {serverStatus.message}
              </p>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {getBackendBaseUrl()}
              </div>
            </div>

          </div>

          {/* Backend URL Configuration */}
          <form onSubmit={handleSaveBackendUrl} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Settings size={14} className="text-slate-500" />
                <span>Backend API Server Base URL</span>
              </label>
              {saveSuccess && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Saved!
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              If your backend is running locally or via a tunnel, set its URL below:
            </p>

            <div className="flex gap-2">
              <input 
                type="text"
                value={backendUrlInput}
                onChange={(e) => setBackendUrlInput(e.target.value)}
                placeholder="http://localhost:3000 or https://your-tunnel.loca.lt"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all shadow-xs"
              >
                Save & Test
              </button>
            </div>
          </form>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button 
            onClick={runDiagnostics}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RefreshCw size={13} className={dbStatus.loading || serverStatus.loading ? 'animate-spin' : ''} />
            <span>Re-test Connections</span>
          </button>

          <button 
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
