/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { TiffinOwnerDashboard } from './components/TiffinOwnerDashboard';
import { KitchenCookDashboard } from './components/KitchenCookDashboard';
import { DeliveryTeamDashboard } from './components/DeliveryTeamDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { LoadingScreen } from './components/LoadingScreen';
import { Shield, Sparkles, LogOut, CheckCircle, Wifi } from 'lucide-react';
import { ConnectionStatusModal } from './components/ConnectionStatusModal';

function AppContent() {
  const { currentRole, isLoggedIn, currentUser, logout } = useApp();
  const [currentView, setCurrentView] = useState<'landing' | 'login'>('landing');
  const [preferredRole, setPreferredRole] = useState<string | undefined>(undefined);
  const [appLoading, setAppLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  if (appLoading) {
    return <LoadingScreen duration={1800} onComplete={() => setAppLoading(false)} />;
  }

  const handleLoginClick = (role?: string) => {
    setPreferredRole(role);
    setCurrentView('login');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const renderDashboard = () => {
    switch (currentRole) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'tiffin_owner':
        return <TiffinOwnerDashboard />;
      case 'kitchen_cook':
        return <KitchenCookDashboard />;
      case 'delivery_boy':
        return <DeliveryTeamDashboard />;
      case 'customer':
      default:
        return <CustomerDashboard />;
    }
  };

  // 1. Unauthenticated views
  if (!isLoggedIn) {
    return (
      <>
        {currentView === 'login' ? (
          <LoginPage 
            initialRole={preferredRole} 
            onBackToLanding={handleBackToLanding} 
          />
        ) : (
          <LandingPage onLoginClick={handleLoginClick} />
        )}

        {/* Floating Connection Status Button */}
        <button
          onClick={() => setIsStatusModalOpen(true)}
          className="fixed bottom-4 right-4 z-40 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-full shadow-xl border border-slate-700 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold"
          title="Server & Database Status"
        >
          <Wifi size={16} className="text-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">System Status</span>
        </button>

        <ConnectionStatusModal 
          isOpen={isStatusModalOpen} 
          onClose={() => setIsStatusModalOpen(false)} 
        />
      </>
    );
  }

  // 2. Authenticated views with sleek logout bar
  return (
    <div id="authenticated_root" className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Sleek Session Navigation Header */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-bold border-b border-emerald-500/25 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-slate-300">
            Diner Session: <strong className="text-white font-black">{currentUser?.name || 'Authorized Diner'}</strong> 
            <span className="mx-2 text-slate-600">|</span> 
            Access Portal: <span className="bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-400 font-mono text-[10px] uppercase font-bold">{currentUser?.role.replace('_', ' ')}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="text-slate-300 hover:text-white flex items-center gap-1 font-mono text-[11px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
          >
            <Wifi size={12} className="text-emerald-400" />
            <span>Connection</span>
          </button>
          <button 
            onClick={logout}
            className="bg-red-500/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-[11px] shadow-sm active:scale-95"
          >
            <LogOut size={12} /> Log Out
          </button>
        </div>
      </div>

      {/* Primary Dashboard Panel */}
      <div className="flex-1">
        {renderDashboard()}
      </div>

      {/* Global Authenticated Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-[10px] text-slate-400 font-semibold shrink-0">
        © 2026 TiffinGo Pro • Trusted Home Cooked Meal Subscription Network| Powered By Saara Softtech
      </footer>

      <ConnectionStatusModal 
        isOpen={isStatusModalOpen} 
        onClose={() => setIsStatusModalOpen(false)} 
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
