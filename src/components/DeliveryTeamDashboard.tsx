/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, MapPin, Navigation, Compass, CheckSquare, ShieldAlert, CheckCircle, ChevronRight, QrCode, ChevronDown, Check, Route, Zap, RefreshCw, Play, ArrowRight, Clock, Gauge, CloudRain, Sun, Activity, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
import { getDynamicOtp, translateText, getTodayDateStr } from '../utils';
import { useTranslation } from 'react-i18next';
import { RealGoogleMap } from './RealGoogleMap';
import { GoogleMapsSetupSplash } from './GoogleMapsSetupSplash';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export const DeliveryTeamDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const tText = (text: string | null | undefined) => translateText(text, i18n.language);
  const { currentUser, orders, updateRouteStep, updateOrderStatus } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isOptimizedView, setIsOptimizedView] = useState(true);

  // Filter orders assigned to this rider for today
  const todayStr = getTodayDateStr();
  const riderOrders = orders.filter(o => o.deliveryBoyId === currentUser.id && o.date === todayStr);
  const activeOrder = orders.find(o => o.id === selectedOrderId) || riderOrders.find(o => o.status !== 'delivered') || riderOrders[0];

  // Map View States
  const [mapViewMode, setMapViewMode] = useState<'batch' | 'active'>('batch');
  const [mapEngine, setMapEngine] = useState<'real' | 'mock'>(hasValidKey ? 'real' : 'mock');
  const [hoveredStopId, setHoveredStopId] = useState<string | null>(null);
  const [isMapMaximized, setIsMapMaximized] = useState<boolean>(false);

  // Real-time status tracker & transit simulator states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(3000); // 3000ms default
  const [simSpeedLabel, setSimSpeedLabel] = useState<'1x' | '2x' | '5x'>('1x');
  const [simulatedSpeed, setSimulatedSpeed] = useState<number>(34); // fluctuating speed (km/h)
  const [roadCondition, setRoadCondition] = useState<'clear' | 'moderate' | 'heavy'>('clear');
  const [liveEtaSeconds, setLiveEtaSeconds] = useState<number>(0);

  const kitchenX = 60;
  const kitchenY = 220;

  // Map coordinates for up to 5 orders in the batch
  const stopCoords = [
    { x: 190, y: 120 },
    { x: 320, y: 180 },
    { x: 420, y: 70 },
    { x: 270, y: 50 },
    { x: 120, y: 150 }
  ];

  // Memoized optimized route based on Nearest Neighbor TSP
  const optimizedRoute = React.useMemo(() => {
    if (riderOrders.length === 0) return [];
    
    const unvisited = riderOrders.map((order, index) => {
      const coord = stopCoords[index % stopCoords.length];
      return {
        order,
        x: coord.x,
        y: coord.y,
        originalIndex: index
      };
    });

    const route = [];
    let currentX = kitchenX;
    let currentY = kitchenY;

    while (unvisited.length > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dx = unvisited[i].x - currentX;
        const dy = unvisited[i].y - currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx !== -1) {
        const next = unvisited.splice(nearestIdx, 1)[0];
        route.push({
          ...next,
          distanceFromPrev: minDistance
        });
        currentX = next.x;
        currentY = next.y;
      }
    }

    return route;
  }, [riderOrders]);

  const defaultDistance = React.useMemo(() => {
    let dist = 0;
    let currentX = kitchenX;
    let currentY = kitchenY;
    
    riderOrders.forEach((o, index) => {
      const coord = stopCoords[index % stopCoords.length];
      const dx = coord.x - currentX;
      const dy = coord.y - currentY;
      dist += Math.sqrt(dx * dx + dy * dy);
      currentX = coord.x;
      currentY = coord.y;
    });
    
    return dist;
  }, [riderOrders]);

  const optimizedDistance = React.useMemo(() => {
    return optimizedRoute.reduce((sum, item) => sum + item.distanceFromPrev, 0);
  }, [optimizedRoute]);

  const scale = 0.045; // pixel-to-km conversion factor

  // Prepare batch stops: Kitchen is stop 0, followed by all rider orders
  const batchStops = [
    { id: 'kitchen', name: 'TiffinGo Central Kitchen', address: 'Plot 42, Sector 3, Pune', x: kitchenX, y: kitchenY, type: 'kitchen', status: 'ready' },
    ...riderOrders.map((order, index) => {
      const coord = stopCoords[index % stopCoords.length];
      return {
        id: order.id,
        name: order.customerName,
        address: order.customerAddress,
        x: coord.x,
        y: coord.y,
        type: 'customer',
        status: order.status,
        order: order
      };
    })
  ];

  const getRiderPos = () => {
    if (riderOrders.length === 0) return { x: kitchenX, y: kitchenY, angle: 0 };
    
    const nextIndex = riderOrders.findIndex(o => o.status !== 'delivered');
    
    if (nextIndex === -1) {
      // All delivered
      const last = batchStops[batchStops.length - 1];
      return { x: last.x, y: last.y, angle: 0 };
    }
    
    const startStop = batchStops[nextIndex]; // Kitchen (0) or previous order (nextIndex)
    const endStop = batchStops[nextIndex + 1]; // Next order (nextIndex + 1)
    
    if (!startStop || !endStop) return { x: kitchenX, y: kitchenY, angle: 0 };
    
    // Find step progress of next non-delivered order
    const nextOrder = riderOrders[nextIndex];
    let stepPct = 0;
    if (nextOrder.geoTags) {
      const steps = nextOrder.geoTags.routeSteps;
      const completed = steps.filter(s => s.isCompleted).length;
      stepPct = steps.length > 0 ? completed / steps.length : 0;
    }
    
    const x = startStop.x + (endStop.x - startStop.x) * stepPct;
    const y = startStop.y + (endStop.y - startStop.y) * stepPct;
    
    // Calculate heading angle
    const dx = endStop.x - startStop.x;
    const dy = endStop.y - startStop.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return { x, y, angle };
  };

  const riderPos = getRiderPos();

  const [currentOtpData, setCurrentOtpData] = useState<{ otp: string; secondsLeft: number }>({ otp: '', secondsLeft: 30 });
  useEffect(() => {
    if (!activeOrder) return;
    const updateOtp = () => {
      setCurrentOtpData(getDynamicOtp(activeOrder.id));
    };
    updateOtp();
    const interval = setInterval(updateOtp, 1000);
    return () => clearInterval(interval);
  }, [activeOrder]);

  // Real-time ETA initialization and updates
  useEffect(() => {
    if (!activeOrder) return;
    
    if (activeOrder.geoTags) {
      const steps = activeOrder.geoTags.routeSteps;
      const completedCount = steps.filter(s => s.isCompleted).length;
      const totalSteps = steps.length;
      const remainingSteps = totalSteps - completedCount;
      
      const trafficMultiplier = roadCondition === 'heavy' ? 1.8 : roadCondition === 'moderate' ? 1.3 : 1.0;
      const baseSecondsPerStep = 120; // 2 minutes per step default
      const calculatedSeconds = Math.max(0, Math.round(remainingSteps * baseSecondsPerStep * trafficMultiplier));
      
      setLiveEtaSeconds(calculatedSeconds);
    } else {
      setLiveEtaSeconds(600);
    }
  }, [activeOrder, roadCondition, activeOrder?.geoTags?.routeSteps]);

  // Live ETA countdown ticker & speed fluctuations
  useEffect(() => {
    if (activeOrder?.status === 'delivered') {
      setLiveEtaSeconds(0);
      return;
    }
    
    const interval = setInterval(() => {
      setLiveEtaSeconds(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
      // Fluctuate speed slightly based on road conditions
      setSimulatedSpeed(prev => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const baseSpeed = roadCondition === 'heavy' ? 18 : roadCondition === 'moderate' ? 26 : 38;
        const newSpeed = prev + delta;
        return Math.max(baseSpeed - 8, Math.min(baseSpeed + 8, newSpeed));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOrder, roadCondition]);

  // Autopilot Step Simulation Interval
  useEffect(() => {
    if (!isSimulating || !activeOrder) return;

    if (activeOrder.status === 'delivered') {
      setIsSimulating(false);
      return;
    }

    const interval = setInterval(() => {
      if (!activeOrder.geoTags) {
        setIsSimulating(false);
        return;
      }

      const steps = activeOrder.geoTags.routeSteps;
      const nextStepIdx = steps.findIndex(s => !s.isCompleted);

      if (nextStepIdx !== -1) {
        // Mark the step completed
        updateRouteStep(activeOrder.id, nextStepIdx, true);
        
        // If this was the last step, mark order as delivered
        if (nextStepIdx === steps.length - 1) {
          updateOrderStatus(activeOrder.id, 'delivered');
          setIsSimulating(false);
        }
      } else {
        if (activeOrder.status !== 'delivered') {
          updateOrderStatus(activeOrder.id, 'delivered');
        }
        setIsSimulating(false);
      }
    }, simSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, activeOrder, updateRouteStep, updateOrderStatus]);

  const formatCountdown = (totalSeconds: number) => {
    if (totalSeconds <= 0) return 'Arrived';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleStepComplete = (orderId: string, stepIdx: number) => {
    updateRouteStep(orderId, stepIdx, true);
  };

  const handleStepIncomplete = (orderId: string, stepIdx: number) => {
    updateRouteStep(orderId, stepIdx, false);
  };

  // SVG simulated coordinate route mapping variables
  const getCoordinatesPct = (idx: number, total: number) => {
    return Math.round((idx / (total - 1)) * 100);
  };

  // Online/Offline network state tracking for offline dashboard support
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="bg-emerald-50/30 min-h-screen p-4 md:p-8 font-sans pb-32 text-slate-800" id="delivery-dashboard">
      {/* Offline Mode Banner Alert */}
      {!isOnline && (
        <div className="max-w-7xl mx-auto mb-6 bg-rose-600 text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse border border-rose-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wide">Intermittent Connection / Offline Mode Active</h4>
              <p className="text-[11px] text-rose-100 mt-0.5">
                The device is currently offline. TiffinGo Service Worker has cached your essential delivery routes, addresses, and customer profiles locally so you can continue delivering without interruption.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-slate-900/40 px-3.5 py-1.5 rounded-xl border border-rose-400 text-[10px] text-white font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            Offline Cache Active
          </div>
        </div>
      )}

      {/* Brand Nav */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 flex-wrap">
              Rider Dispatch & <span className="text-blue-500">Navigation</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ml-2 ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time turn-by-turn route walk with GPS simulated geo-tag logging.

          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/50 border border-emerald-100 rounded-xl px-3 py-1.5 text-xs text-slate-700 transition-all shadow-sm focus:outline-none font-bold text-slate-800 cursor-pointer"
            >
              <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider select-none">Lang:</span>
              <span>
                {i18n.language === 'en' && 'English (EN)'}
                {i18n.language === 'hi' && 'हिंदी (HI)'}
                {i18n.language === 'mr' && 'मराठी (MR)'}
              </span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white border border-slate-100 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      i18n.changeLanguage('en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      i18n.language === 'en' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>English (EN)</span>
                    {i18n.language === 'en' && <Check size={12} className="text-emerald-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      i18n.changeLanguage('hi');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      i18n.language === 'hi' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>हिंदी (HI)</span>
                    {i18n.language === 'hi' && <Check size={12} className="text-emerald-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      i18n.changeLanguage('mr');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      i18n.language === 'mr' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>मराठी (MR)</span>
                    {i18n.language === 'mr' && <Check size={12} className="text-emerald-500" />}
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            GPS Link: <strong className="text-blue-600 font-extrabold">ONLINE</strong>
          </div>
        </div>
      </div>

      {/* Real-time Status Tracker & Transit Autopilot Console */}
      {activeOrder && (() => {
        const completedStepsCount = activeOrder.geoTags ? activeOrder.geoTags.routeSteps.filter(s => s.isCompleted).length : 0;
        const totalStepsCount = activeOrder.geoTags ? activeOrder.geoTags.routeSteps.length : 1;
        const progressPct = totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;

        return (
          <div className="max-w-7xl mx-auto mb-8 bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden" id="realtime-status-tracker">
            {/* Ambient Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Console Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 mb-6 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">Live Telemetry Link Active</span>
                </div>
                <h2 className="text-lg font-black tracking-tight mt-1 flex flex-wrap items-center gap-2">
                  <span>Active Delivery Status:</span>
                  <span className="text-blue-400 font-mono">#{activeOrder.id}</span>
                  <span className="text-xs bg-slate-800 text-slate-300 font-normal px-2.5 py-0.5 rounded-full">
                    Customer: {activeOrder.customerName}
                  </span>
                </h2>
              </div>

              {/* Simulation controls */}
              <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 w-full md:w-auto">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1.5 hidden sm:inline-block">
                  Transit Autopilot:
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (activeOrder.status === 'delivered') {
                      alert("This delivery is already completed!");
                      return;
                    }
                    if (activeOrder.status === 'placed' || activeOrder.status === 'cooking') {
                      alert("Preparation Incomplete!\n\nThis order is still being prepared by the kitchen cook. You cannot start transit autopilot or dispatch this order until the cook marks it as 'Ready' (Pack & Ready)!");
                      return;
                    }
                    setIsSimulating(!isSimulating);
                    if (!isSimulating && activeOrder.status === 'ready_for_dispatch') {
                      updateOrderStatus(activeOrder.id, 'out_for_delivery');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isSimulating 
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/35 hover:bg-rose-700' 
                      : (activeOrder.status === 'placed' || activeOrder.status === 'cooking')
                        ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed shadow-none'
                        : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/35 hover:bg-emerald-500'
                  }`}
                  disabled={activeOrder.status === 'placed' || activeOrder.status === 'cooking'}
                >
                  {isSimulating ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      <span>Pause Autopilot</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} className="fill-white" />
                      <span>Start Autopilot</span>
                    </>
                  )}
                </button>

                {/* Speed Multiplier */}
                {isSimulating && (
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[9px] font-black">
                    <button
                      type="button"
                      onClick={() => { setSimSpeed(3000); setSimSpeedLabel('1x'); }}
                      className={`px-2 py-1 rounded cursor-pointer ${simSpeedLabel === '1x' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      1x
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSimSpeed(1500); setSimSpeedLabel('2x'); }}
                      className={`px-2 py-1 rounded cursor-pointer ${simSpeedLabel === '2x' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      2x
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSimSpeed(600); setSimSpeedLabel('5x'); }}
                      className={`px-2 py-1 rounded cursor-pointer ${simSpeedLabel === '5x' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      5x
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Warning if kitchen preparation is incomplete */}
            {(activeOrder.status === 'placed' || activeOrder.status === 'cooking') && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-300">Kitchen Preparation Incomplete (रसोई की तैयारी अधूरी है)</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      The kitchen cook has not finished preparing this tiffin yet (current status: <strong className="text-amber-400 capitalize">{activeOrder.status}</strong>).
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      You cannot start transit autopilot or dispatch this order until the cook clicks "Pack & Ready" to mark it ready.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2 bg-slate-950/50 px-3.5 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  Awaiting Cook's Action
                </div>
              </div>
            )}

            {/* Tracker Metrics Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              
              {/* Horizontal progress visualization (takes 2 columns) */}
              <div className="md:col-span-2 bg-slate-950/70 rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Route Progress Tracker</span>
                  <p className="text-xs font-semibold text-slate-300 mt-1">
                    Active Dispatch Run: <span className="text-emerald-400 font-extrabold">{progressPct}% Complete</span>
                  </p>
                </div>

                {/* Progress Slider Line */}
                <div className="my-6 relative">
                  {/* Underlay bar */}
                  <div className="w-full h-1.5 bg-slate-850 rounded-full"></div>
                  {/* Active progress color bar */}
                  <div 
                    className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  ></div>

                  {/* Left Node: Central Kitchen */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 border border-slate-800 flex items-center justify-center text-[10px] shadow-lg shadow-emerald-950/40" title="Central Kitchen">
                      🍳
                    </div>
                    <span className="text-[8px] font-extrabold text-slate-400 mt-1 uppercase">Kitchen</span>
                  </div>

                  {/* Moving Rider Marker (sliding based on completed steps) */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out flex flex-col items-center z-10"
                    style={{ left: `${Math.max(8, Math.min(92, progressPct))}%` }}
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-sm shadow-xl shadow-blue-950/80 animate-bounce">
                      🚴
                    </div>
                  </div>

                  {/* Right Node: Customer Location */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 border border-slate-800 flex items-center justify-center text-[10px] shadow-lg shadow-emerald-950/40" title="Customer Home">
                      🏡
                    </div>
                    <span className="text-[8px] font-extrabold text-slate-400 mt-1 uppercase">Home</span>
                  </div>
                </div>

                {/* Step info snippet */}
                <div className="text-[10px] text-slate-400 flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40">
                  <span className="font-semibold text-slate-300">
                    {activeOrder.status === 'delivered' ? '✓ Delivery Completed!' : `Milestone Progress: ${activeOrder.geoTags ? activeOrder.geoTags.routeSteps.filter(s => s.isCompleted).length : 0}/${activeOrder.geoTags ? activeOrder.geoTags.routeSteps.length : 1} Steps Done`}
                  </span>
                  {activeOrder.status !== 'delivered' && activeOrder.geoTags && (
                    <span className="text-blue-400 font-bold truncate max-w-[200px] text-right">
                      Next: {tText(activeOrder.geoTags.routeSteps.find(s => !s.isCompleted)?.instruction || 'Drop off')}
                    </span>
                  )}
                </div>
              </div>

              {/* Estimated Time of Arrival Widget */}
              <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-15">
                  <Clock size={40} className="text-blue-500 animate-pulse" />
                </div>
                
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estimated Arrival</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-blue-400 font-mono tracking-tight">
                      {activeOrder.status === 'delivered' ? 'Delivered' : formatCountdown(liveEtaSeconds)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {activeOrder.status === 'delivered' 
                      ? 'Tiffin safely handed over to customer.' 
                      : 'Awaiting arrival. Countdowns adapt to traffic conditions.'}
                  </p>
                </div>

                {/* Road Condition Adapters */}
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block mb-1.5">Simulate Traffic Condition</span>
                  <div className="flex bg-slate-900 p-0.5 rounded-xl items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRoadCondition('clear')}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        roadCondition === 'clear' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sun size={11} /> Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoadCondition('moderate')}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        roadCondition === 'moderate' ? 'bg-white text-yellow-600 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Activity size={11} /> Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoadCondition('heavy')}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        roadCondition === 'heavy' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CloudRain size={11} /> Rain/Heavy
                    </button>
                  </div>
                </div>
              </div>

              {/* Rider Telemetry Metrics Card */}
              <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rider Telemetry</span>
                  
                  <div className="mt-2 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Gauge size={12} className="text-blue-500" />
                        Rider Speed:
                      </span>
                      <span className="text-xs font-black font-mono text-slate-200">
                        {activeOrder.status === 'delivered' ? '0' : simulatedSpeed} km/h
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Route size={12} className="text-emerald-500" />
                        Distance Left:
                      </span>
                      <span className="text-xs font-black font-mono text-slate-200">
                        {activeOrder.status === 'delivered' ? '0.00' : ((100 - progressPct) / 100 * 3.4).toFixed(2)} km
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Zap size={12} className="text-yellow-500" />
                        Autopilot Speed:
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">
                        {isSimulating ? `${simSpeedLabel} Fast-Forward` : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Transit State</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    activeOrder.status === 'delivered' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                    isSimulating ? 'bg-blue-950 text-blue-400 border border-blue-900' :
                    'bg-emerald-950 text-emerald-400 border border-emerald-900 animate-pulse'
                  }`}>
                    {activeOrder.status === 'delivered' ? 'Delivered' : isSimulating ? '🚴 In Transit' : '🏁 Staged'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rider Shipment Logs */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-5 space-y-4 h-fit shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-emerald-100 pb-3">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
            My Scheduled Deliveries
          </h3>
          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            {riderOrders.map(o => {
              const isActive = activeOrder?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs transition-all space-y-3 block cursor-pointer ${
                    isActive 
                      ? 'bg-blue-50/60 border-blue-300 text-slate-800 shadow-sm' 
                      : 'bg-emerald-50/10 border-emerald-100 text-slate-600 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-extrabold">
                        #{o.id}
                      </span>
                      <h4 className="font-bold text-xs mt-1 text-slate-800">{tText(o.customerName)}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      o.status === 'delivered' ? 'bg-green-100 text-green-700 border border-green-200' :
                      o.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse'
                    }`}>
                      {tText(o.status)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 truncate">📍 {tText(o.customerAddress)}</p>

                  <div className="flex justify-between items-center border-t border-emerald-100/60 pt-2 text-[10px] text-slate-400">
                    <span>Kitchen: {tText(o.kitchenName)}</span>
                    <span className="font-semibold text-slate-600">{o.mealType === 'lunch' ? 'Lunch' : 'Dinner'}</span>
                  </div>
                </button>
              );
            })}

            {riderOrders.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                <ShieldAlert size={32} className="mx-auto text-slate-200 mb-2" />
                No deliveries assigned to you yet.
                <p className="text-[10px] text-slate-500 mt-1">Change view to Tiffin Owner to assign Rahul.</p>
              </div>
            )}
          </div>
        </div>

        {/* GPS Geo-Tag Interactive Simulator Map */}
        {activeOrder ? (
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
            
            {/* Visual Vector Route Map */}
            <div className="space-y-4 flex flex-col justify-between">
              <style>{`
                @keyframes map-dash {
                  to {
                    stroke-dashoffset: -20;
                  }
                }
                .animate-map-dash {
                  stroke-dasharray: 8 6;
                  animation: map-dash 1s linear infinite;
                }
                @keyframes map-pulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.3); opacity: 0.4; }
                }
                .animate-map-pulse {
                  animation: map-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
              `}</style>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 pb-1">
                    <Compass className="text-blue-500 animate-spin" size={16} /> GPS Batch Route Walkthrough
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Interactive real-time map tracking active dispatch batch.</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Map Engine Toggles */}
                  <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-0.5 text-[9px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMapEngine('mock')}
                      className={`px-2 py-1 rounded transition-all cursor-pointer ${
                        mapEngine === 'mock' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Mock Map
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapEngine('real')}
                      className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                        mapEngine === 'real' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${hasValidKey ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`}></span>
                      Google Map {hasValidKey ? '(Live)' : '(Setup)'}
                    </button>
                  </div>

                  {/* View Mode Toggles */}
                  <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-0.5 text-[9px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMapViewMode('batch')}
                      className={`px-2 py-1 rounded transition-all cursor-pointer ${
                        mapViewMode === 'batch' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All Stops ({riderOrders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapViewMode('active')}
                      className={`px-2 py-1 rounded transition-all cursor-pointer ${
                        mapViewMode === 'active' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Active Only
                    </button>
                  </div>

                  {/* Maximize Map Action */}
                  <button
                    type="button"
                    onClick={() => setIsMapMaximized(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[9px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-100"
                    title="Maximize Map (नक्शा बड़ा करें)"
                  >
                    <Maximize2 size={10} /> {tText("Maximize")}
                  </button>
                </div>
              </div>

              {/* Conditional Map rendering */}
              {mapEngine === 'real' ? (
                hasValidKey ? (
                  (() => {
                    // Precompute real-world coordinates for Google Map
                    const realStops = batchStops.map((stop, idx) => {
                      let lat = 18.5204;
                      let lng = 73.8567;
                      
                      if (stop.type === 'kitchen') {
                        const firstOrder = riderOrders[0];
                        if (firstOrder?.geoTags?.routeSteps?.[0]) {
                          lat = firstOrder.geoTags.routeSteps[0].lat;
                          lng = firstOrder.geoTags.routeSteps[0].lng;
                        } else {
                          lat = 18.5983; // Annapurna Kitchen Sector 4
                          lng = 73.7431;
                        }
                      } else if (stop.order?.geoTags) {
                        lat = stop.order.geoTags.latitude;
                        lng = stop.order.geoTags.longitude;
                      }

                      return {
                        id: stop.id,
                        name: stop.name,
                        address: stop.address || '',
                        lat,
                        lng,
                        type: stop.type as 'kitchen' | 'customer',
                        status: stop.status,
                        index: stop.type === 'kitchen' ? undefined : idx
                      };
                    });

                    const getRiderLatLng = () => {
                      if (riderOrders.length === 0) return { lat: 18.5204, lng: 73.8567 };
                      
                      const nextIndex = riderOrders.findIndex(o => o.status !== 'delivered');
                      if (nextIndex === -1) {
                        const lastStop = realStops[realStops.length - 1];
                        return { lat: lastStop?.lat || 18.5204, lng: lastStop?.lng || 73.8567 };
                      }
                      
                      const startStop = realStops[nextIndex];
                      const endStop = realStops[nextIndex + 1];
                      
                      if (!startStop || !endStop) return { lat: 18.5204, lng: 73.8567 };
                      
                      const nextOrder = riderOrders[nextIndex];
                      let stepPct = 0;
                      if (nextOrder?.geoTags) {
                        const steps = nextOrder.geoTags.routeSteps;
                        const completed = steps.filter(s => s.isCompleted).length;
                        stepPct = steps.length > 0 ? completed / steps.length : 0;
                      }
                      
                      const lat = startStop.lat + (endStop.lat - startStop.lat) * stepPct;
                      const lng = startStop.lng + (endStop.lng - startStop.lng) * stepPct;
                      
                      return { lat, lng };
                    };

                    return (
                      <RealGoogleMap
                        stops={realStops}
                        riderLatLng={getRiderLatLng()}
                        activeStopId={mapViewMode === 'active' ? activeOrder?.id : null}
                        mapViewMode={mapViewMode}
                        height="320px"
                      />
                    );
                  })()
                ) : (
                  <GoogleMapsSetupSplash onBackToMock={() => setMapEngine('mock')} />
                )
              ) : (
                /* Vector SVG Mock Map representation */
                <div className="bg-slate-950 aspect-video rounded-2xl border-2 border-slate-700/80 relative overflow-hidden flex items-center justify-center p-4 shadow-inner shadow-black/40">
                  {/* Simulated Street grid background */}
                  <div className="absolute inset-0 opacity-40 pointer-events-none">
                    {/* Grid Lines */}
                    <svg className="w-full h-full" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="0" y1="180" x2="500" y2="180" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="0" y1="250" x2="500" y2="250" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="80" y1="0" x2="80" y2="300" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="190" y1="0" x2="190" y2="300" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="300" y1="0" x2="300" y2="300" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="400" y1="0" x2="400" y2="300" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />

                      {/* Parks & Green zones */}
                      <rect x="25" y="25" width="110" height="55" fill="#10b981" opacity="0.25" rx="10" />
                      <rect x="330" y="100" width="60" height="60" fill="#10b981" opacity="0.20" rx="10" />

                      {/* City River */}
                      <path d="M -20,140 C 110,110 210,250 310,230 T 520,180" fill="none" stroke="#0ea5e9" strokeWidth="14" opacity="0.35" strokeLinecap="round" />
                      <path d="M -20,140 C 110,110 210,250 310,230 T 520,180" fill="none" stroke="#38bdf8" strokeWidth="4" opacity="0.25" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* SVG Route Path Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
                    {/* Underlay Road line */}
                    {mapViewMode === 'batch' ? (
                      <path
                        d={batchStops.map((s, idx) => (idx === 0 ? 'M' : 'L') + ` ${s.x} ${s.y}`).join(' ')}
                        fill="none"
                        stroke="#334155"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.95"
                      />
                    ) : (
                      <path
                        d={`M ${kitchenX} ${kitchenY} L ${batchStops.find(s => s.id === activeOrder.id)?.x || kitchenX} ${batchStops.find(s => s.id === activeOrder.id)?.y || kitchenY}`}
                        fill="none"
                        stroke="#334155"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.95"
                      />
                    )}

                    {/* Active/Remaining Route Path */}
                    {mapViewMode === 'batch' ? (
                      <>
                        {/* Completed Legs (Green) */}
                        {(() => {
                          const nextIndex = riderOrders.findIndex(o => o.status !== 'delivered');
                          const completedStops = nextIndex === -1 ? batchStops : batchStops.slice(0, nextIndex + 1);
                          if (completedStops.length > 1) {
                            const compPath = completedStops.map((s, idx) => (idx === 0 ? 'M' : 'L') + ` ${s.x} ${s.y}`).join(' ');
                            return <path d={compPath} fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />;
                          }
                          return null;
                        })()}

                        {/* Pending Legs (Glowing Blue Dash) */}
                        {(() => {
                          const nextIndex = riderOrders.findIndex(o => o.status !== 'delivered');
                          const remainingStops = nextIndex === -1 ? [] : batchStops.slice(nextIndex);
                          if (remainingStops.length > 1) {
                            const remPath = remainingStops.map((s, idx) => (idx === 0 ? 'M' : 'L') + ` ${s.x} ${s.y}`).join(' ');
                            return (
                              <path
                                d={remPath}
                                fill="none"
                                stroke="#60a5fa"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="animate-map-dash"
                              />
                            );
                          }
                          return null;
                        })()}
                      </>
                    ) : (
                      /* Active mode route line */
                      <path
                        d={`M ${kitchenX} ${kitchenY} L ${batchStops.find(s => s.id === activeOrder.id)?.x || kitchenX} ${batchStops.find(s => s.id === activeOrder.id)?.y || kitchenY}`}
                        fill="none"
                        stroke={activeOrder.status === 'delivered' ? '#22c55e' : '#60a5fa'}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={activeOrder.status === 'delivered' ? '' : 'animate-map-dash'}
                      />
                    )}
                  </svg>

                  {/* Pin Markers */}
                  {batchStops
                    .filter(stop => mapViewMode === 'batch' || stop.type === 'kitchen' || stop.id === activeOrder.id)
                    .map((stop, idx) => {
                      const isKitchen = stop.type === 'kitchen';
                      const isActive = stop.id === activeOrder.id;
                      const isDelivered = stop.status === 'delivered';
                      const isHovered = hoveredStopId === stop.id;

                      // Choose colors based on stop status with high contrast borders
                      const markerColor = isKitchen
                        ? 'bg-emerald-500 border-white text-white'
                        : isDelivered
                        ? 'bg-emerald-500 border-white text-white'
                        : isActive
                        ? 'bg-blue-500 border-white text-white ring-4 ring-blue-500/30'
                        : 'bg-slate-500 border-slate-300 text-slate-100';

                      return (
                        <div
                          key={stop.id}
                          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10"
                          style={{ left: `${(stop.x / 500) * 100}%`, top: `${(stop.y / 300) * 100}%` }}
                          onMouseEnter={() => setHoveredStopId(stop.id)}
                          onMouseLeave={() => setHoveredStopId(null)}
                        >
                          {/* Selected Target Pulse Ring */}
                          {isActive && !isKitchen && !isDelivered && (
                            <div className="absolute inset-0 -m-3 rounded-full border-2 border-blue-400 opacity-90 animate-map-pulse pointer-events-none ring-4 ring-blue-500/25" />
                          )}

                          {/* Node button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!isKitchen) {
                                setSelectedOrderId(stop.id);
                              }
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 shadow-lg transition-all duration-200 hover:scale-125 cursor-pointer bg-slate-800 border-slate-700"
                            style={{ backgroundColor: isKitchen ? '#f97316' : isDelivered ? '#10b981' : isActive ? '#3b82f6' : '#64748b', borderColor: '#ffffff' }}
                          >
                            {isKitchen ? 'K' : idx}
                          </button>

                          {/* Interactive Tooltip Card */}
                          {(isHovered || (isActive && !isKitchen && mapViewMode === 'active')) && (
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 bg-slate-950/95 border border-slate-800 text-[10px] rounded-xl p-2.5 shadow-xl z-30 pointer-events-none space-y-1 text-left animate-in fade-in slide-in-from-bottom-1 duration-100">
                              <div className="flex justify-between items-center gap-1.5 pb-1 border-b border-slate-800">
                                <span className="font-extrabold text-slate-100 truncate max-w-[110px]">
                                  {stop.name}
                                </span>
                                <span className={`px-1 rounded text-[7px] font-black uppercase ${
                                  isKitchen ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                                  isDelivered ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                                  'bg-blue-950 text-blue-400 border border-blue-900'
                                }`}>
                                  {isKitchen ? 'Central' : tText(stop.status || '')}
                                </span>
                              </div>
                              <p className="text-slate-400 truncate">📍 {tText(stop.address || '')}</p>
                              {!isKitchen && (
                                <p className="text-[9px] font-bold text-slate-300">
                                  Stop #{idx} in active batch
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* Simulated Moving Rider Icon */}
                  {riderOrders.length > 0 && (
                    <div
                      className="absolute bg-blue-600 border-2 border-white text-white p-1.5 rounded-full shadow-lg transition-all duration-1000 z-20 flex items-center justify-center"
                      style={{
                        left: `${(riderPos.x / 500) * 100}%`,
                        top: `${(riderPos.y / 300) * 100}%`,
                        transform: `translate(-50%, -50%) rotate(${riderPos.angle}deg)`,
                        transition: 'left 1s cubic-bezier(0.4, 0, 0.2, 1), top 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      title="Active Rider"
                    >
                      <Truck size={12} className="transform -rotate-180" style={{ transform: 'rotate(270deg)' }} />
                    </div>
                  )}
                </div>
              )}

              {/* Geo-tag feedback log */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
                <div className="flex justify-between items-center text-slate-400 text-[10px]">
                  <span>📡 Telemetry Link: Active AGPS Alignment</span>
                  <span className="text-blue-400 font-bold uppercase text-[9px] tracking-wider">
                    {mapViewMode === 'batch' ? 'Batch Overview Mode' : 'Single Delivery Focus'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-0.5">
                  <p>Latitude: <span className="text-blue-400">{riderPos.x ? (18.5204 + (riderPos.x / 50000)).toFixed(5) : '18.5204'}</span></p>
                  <p>Longitude: <span className="text-blue-400">{riderPos.y ? (73.8567 + (riderPos.y / 50000)).toFixed(5) : '73.8567'}</span></p>
                </div>
              </div>
            </div>

            {/* Turn-by-Turn Waypoint List */}
            <div className="space-y-4">
              <div className="border-b border-emerald-100 pb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Rider Walkthrough Checklist</span>
                <p className="text-xs font-extrabold text-slate-800 mt-1">Deliver to: {activeOrder.customerName}</p>
              </div>

              {/* Box Cargo Contents Section for Delivery Man/Rider Clarity */}
              <div className="bg-gradient-to-r from-emerald-50 to-amber-50 p-4 rounded-2xl border border-emerald-100 space-y-3 shadow-xs">
                <p className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>📦</span>
                  <span>Tiffin Cargo to Deliver (देने का सामान)</span>
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-white px-3 py-2.5 rounded-xl border border-emerald-100/40 shadow-xs">
                    <span className="font-bold text-slate-800">🍲 Meal Plan:</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {tText(activeOrder.details.packageName)}
                    </span>
                  </div>

                  {activeOrder.details.guestPlatesCount > 0 && (
                    <div className="flex justify-between items-center bg-white px-3 py-2.5 rounded-xl border border-emerald-100/40 shadow-xs">
                      <span className="font-bold text-slate-800">👥 Extra Guest Plates:</span>
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        +{activeOrder.details.guestPlatesCount} Plates
                      </span>
                    </div>
                  )}

                  {/* Addons items list */}
                  <div className="border-t border-emerald-200/40 pt-2.5">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">
                      ✨ Extra Add-on Orders (अतिरिक्त सामान):
                    </span>
                    {activeOrder.details.addOns && activeOrder.details.addOns.length > 0 ? (
                      <div className="space-y-1.5">
                        {activeOrder.details.addOns.map((add: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-amber-500/10 border border-amber-200/50 px-3 py-2 rounded-xl text-amber-950 font-bold shadow-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="text-amber-600">★</span>
                              <span>{tText(add.name)}</span>
                            </span>
                            <span className="bg-amber-600 text-white font-black px-2 py-0.5 rounded-md text-[10px]">
                              Qty: {add.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic bg-white/50 px-3 py-2 rounded-xl border border-emerald-100/20">
                        No extra accompaniments added for this customer.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {activeOrder.geoTags ? (
                <div className="space-y-3">
                  {activeOrder.geoTags.routeSteps.map((step, idx) => {
                    const isCompleted = step.isCompleted;
                    const canComplete = idx === 0 || activeOrder.geoTags!.routeSteps[idx - 1].isCompleted;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all flex items-start gap-3 text-xs ${
                          isCompleted
                            ? 'bg-green-50 border-green-200 text-slate-400 line-through'
                            : canComplete
                            ? 'bg-emerald-50/10 border-emerald-100 text-slate-800 hover:border-blue-300'
                            : 'bg-emerald-50/5 border-emerald-100/30 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <button
                              onClick={() => handleStepIncomplete(activeOrder.id, idx)}
                              className="p-1 rounded bg-green-500 text-white font-bold hover:bg-rose-600 transition-colors cursor-pointer"
                              title="Undo Step"
                            >
                              ✓
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStepComplete(activeOrder.id, idx)}
                              disabled={!canComplete}
                              className={`h-5 w-5 rounded-md border flex items-center justify-center font-bold font-mono cursor-pointer ${
                                canComplete 
                                  ? 'border-blue-500 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white' 
                                  : 'border-emerald-100 text-slate-300 cursor-not-allowed'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold leading-relaxed">{tText(step.instruction)}</p>
                          <span className="text-[9px] font-mono text-slate-400">
                            Geopoint: {step.lat.toFixed(4)}, {step.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  This tiffin does not have geo-tag routing configured.
                </div>
              )}

              {/* Dynamic Customer Verification QR panel */}
              {activeOrder.status !== 'delivered' && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-sm my-4 text-center space-y-4 relative overflow-hidden">
                  <div className="relative z-10 space-y-3">
                    <h4 className="font-extrabold text-white text-xs flex items-center justify-center gap-1.5 uppercase tracking-wide">
                      <QrCode size={14} className="text-emerald-400" />
                      Dynamic Security PIN & QR
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed px-4">
                      Customer must scan this QR or read back the PIN to verify drop-off. Refreshes automatically.
                    </p>

                    <div className="bg-white p-3 rounded-xl inline-block shadow-lg mx-auto">
                      <QrCode size={96} className="text-slate-900 mx-auto" />
                    </div>

                    <div className="flex flex-col items-center justify-center pt-2">
                      <span className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-widest">Auth PIN</span>
                      <div className="text-3xl font-extrabold font-mono tracking-widest text-white tracking-[0.2em] bg-slate-800 px-6 py-2 rounded-xl shadow-inner border border-slate-700">
                        {currentOtpData.otp}
                      </div>
                    </div>
                    
                    <div className="flex justify-center items-center gap-2 pt-2">
                      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                          style={{ width: `${(currentOtpData.secondsLeft / 30) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        {currentOtpData.secondsLeft}s
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (activeOrder.status === 'placed' || activeOrder.status === 'cooking') {
                          alert(`Bypass blocked!\n\nThis order has not been prepared by the kitchen cook yet. Current status is '${activeOrder.status}'. You must wait until the cook prepares the order.`);
                          return;
                        }
                        updateOrderStatus(activeOrder.id, 'delivered');
                        alert('Manual override successful. Delivery marked complete.');
                      }}
                      className="mt-4 text-[10px] text-slate-500 underline hover:text-white cursor-pointer transition-colors"
                    >
                      Bypass & mark delivered manually (Not Recommended)
                    </button>
                  </div>
                </div>
              )}

              {/* Complete delivery quick checkout banner */}
              {activeOrder.status === 'delivered' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700 text-xs">
                  <CheckCircle size={18} className="text-green-600" />
                  <div>
                    <p className="font-bold">Shipment Delivered!</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Customer was notified of successful hotbox drops.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="lg:col-span-2 bg-white border border-emerald-100 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
            <Compass size={48} className="text-emerald-200 mb-2 animate-bounce" />
            <p className="text-sm font-semibold text-slate-700">No active assignment chosen</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Please click on a scheduled shipment on the left panel to open the real-time turn-by-turn navigation map walkthrough.
            </p>
          </div>
        )}
      </div>

      {/* Route Preview & Optimization Panel */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-100/60 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shadow-xs">
                  <Route size={18} />
                </div>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Route Preview & Optimizer</h2>
              </div>
              <p className="text-xs text-slate-500">
                Calculates the shortest, most fuel-efficient sequence of customer drops starting from Pune Base.
              </p>
            </div>

            {/* Sequence Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOptimizedView(false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isOptimizedView ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Default Sequence
              </button>
              <button
                type="button"
                onClick={() => setIsOptimizedView(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isOptimizedView ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                <Zap size={12} className={isOptimizedView ? 'animate-bounce text-yellow-200' : 'text-blue-500'} />
                Smart Optimized
              </button>
            </div>
          </div>

          {riderOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <ShieldAlert size={32} className="mx-auto text-slate-200 mb-2" />
              No active orders to optimize. Once orders are assigned to you, they will appear here.
            </div>
          ) : (
            <div>
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Total Deliveries</span>
                  <p className="text-xl font-extrabold text-slate-800">{riderOrders.length} Stops</p>
                  <span className="text-[9px] text-slate-400">Excluding starting kitchen base</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Total Route Distance</span>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-xl font-extrabold text-slate-800">
                      {((isOptimizedView ? optimizedDistance : defaultDistance) * scale).toFixed(2)} km
                    </p>
                    {isOptimizedView && (
                      <span className="text-[10px] font-extrabold text-emerald-600">
                        -{((defaultDistance - optimizedDistance) * scale).toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400">Total sequential leg lengths</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Est. Travel Time</span>
                  <p className="text-xl font-extrabold text-slate-800">
                    {Math.round((isOptimizedView ? optimizedDistance : defaultDistance) * scale * 2.5 + riderOrders.length * 6)} mins
                  </p>
                  <span className="text-[9px] text-slate-400">Riding + 6m delivery buffer/stop</span>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-emerald-700 block mb-1">Eco-Savings Impact</span>
                    <p className="text-xl font-extrabold text-emerald-800">
                      {isOptimizedView ? (Math.max(0, (defaultDistance - optimizedDistance) * scale * 0.12).toFixed(2)) : '0.00'} L
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 block pt-1">
                    {isOptimizedView ? 'Saved on fuel & carbon footprint! 🍃' : 'Switch to Optimized to save'}
                  </span>
                </div>
              </div>

              {/* Itinerary Timeline */}
              <div className="relative border-l border-slate-100 ml-3.5 pl-6 space-y-5">
                {/* Kitchen Starting Point */}
                <div className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-10 top-1 w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 z-10 shadow-sm">
                    <span className="text-[10px] font-black">Base</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">TiffinGo Pune Central Kitchen</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Plot 42, Sector 3, Pune • Departure Station</p>
                  </div>
                </div>

                {/* Stop Sequences */}
                {(isOptimizedView ? optimizedRoute : riderOrders.map((order, idx) => {
                  const coord = stopCoords[idx % stopCoords.length];
                  const prevCoord = idx === 0 ? { x: kitchenX, y: kitchenY } : stopCoords[(idx - 1) % stopCoords.length];
                  const dist = Math.sqrt(Math.pow(coord.x - prevCoord.x, 2) + Math.pow(coord.y - prevCoord.y, 2));
                  return {
                    order,
                    x: coord.x,
                    y: coord.y,
                    originalIndex: idx,
                    distanceFromPrev: dist
                  };
                })).map((stop, index) => {
                  const o = stop.order;
                  const isActive = activeOrder?.id === o.id;
                  const isDelivered = o.status === 'delivered';
                  
                  // Calculate cumulative ETA minutes from start
                  const fullSequenceList = isOptimizedView ? optimizedRoute : riderOrders.map((or, idx) => {
                    const coord = stopCoords[idx % stopCoords.length];
                    const prevCoord = idx === 0 ? { x: kitchenX, y: kitchenY } : stopCoords[(idx - 1) % stopCoords.length];
                    return {
                      distanceFromPrev: Math.sqrt(Math.pow(coord.x - prevCoord.x, 2) + Math.pow(coord.y - prevCoord.y, 2))
                    };
                  });
                  const cumulativeDistance = fullSequenceList.slice(0, index + 1).reduce((sum, item) => sum + (item.distanceFromPrev || 0), 0);
                  const etaMins = Math.round(cumulativeDistance * scale * 2.5 + (index + 1) * 6);

                  return (
                    <div 
                      key={o.id} 
                      className={`relative p-4 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        isActive
                          ? 'bg-blue-50/40 border-blue-200 text-slate-800 shadow-sm'
                          : isDelivered
                          ? 'bg-emerald-50/10 border-slate-100 text-slate-400'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {/* Left Side: Number, Metadata */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(o.id)}
                        className={`absolute -left-10 top-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border z-10 shadow-xs transition-colors cursor-pointer ${
                          isActive 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : isDelivered 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {index + 1}
                      </button>

                      <div className="space-y-1 pr-4 max-w-xl text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-xs font-bold leading-none ${isDelivered ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {tText(o.customerName)}
                          </h4>
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-extrabold uppercase">
                            #{o.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            o.status === 'delivered' ? 'bg-green-100 text-green-700 border border-green-200' :
                            o.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse' :
                            'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {tText(o.status)}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate ${isDelivered ? 'text-slate-300' : 'text-slate-500'}`}>
                          📍 {tText(o.customerAddress)}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>Leg Distance: <strong className="font-bold text-slate-600">{(stop.distanceFromPrev * scale).toFixed(2)} km</strong></span>
                          <span>•</span>
                          <span>Cum. ETA: <strong className="font-bold text-blue-600">+{etaMins} mins</strong></span>
                          <span>•</span>
                          <span className="font-semibold text-slate-600 uppercase text-[9px]">{o.mealType === 'lunch' ? 'Lunch' : 'Dinner'}</span>
                        </div>
                      </div>

                      {/* Right Side: Interactive Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100/80">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderId(o.id);
                            setMapViewMode('active');
                            // Scroll to active order map
                            document.getElementById('delivery-dashboard')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`flex-1 md:flex-none flex items-center justify-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <Navigation size={10} className={isActive ? 'animate-pulse' : ''} />
                          Locate Stop
                        </button>
                        
                        {!isDelivered && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderId(o.id);
                              if (o.status === 'placed' || o.status === 'cooking') {
                                alert(`Cannot Complete Drop!\n\nThis order has not been prepared by the cook yet. The current status is: '${o.status}'. Please wait until the kitchen updates it to 'Ready' (Pack & Ready) before delivering.`);
                                return;
                              }
                              updateOrderStatus(o.id, 'delivered');
                            }}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs ${
                              o.status === 'placed' || o.status === 'cooking'
                                ? 'bg-slate-300 text-slate-500 border border-slate-200 cursor-not-allowed hover:bg-slate-300 hover:text-slate-500'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            <Check size={10} />
                            Complete Drop
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Return back to Pune base */}
                <div className="relative">
                  <div className="absolute -left-10 top-1 w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 z-10">
                    <span className="text-[11px] font-bold">End</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-400 text-left">Return to Pune Base</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 text-left">Delivery run completed • Return hotboxes and check-out</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Maximized Map Overlay Modal */}
      {isMapMaximized && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
              <div className="flex items-center gap-2">
                <Compass className="text-blue-500 animate-spin" size={20} />
                <div className="text-left">
                  <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
                    GPS Batch Route Walkthrough (पूर्ण नक्शा)
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-semibold">Maximized Navigation Mode • Live Tracking Active</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Map Engine Toggles inside Maximized View */}
                <div className="bg-slate-800 p-0.5 rounded-lg flex items-center gap-0.5 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMapEngine('mock')}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      mapEngine === 'mock' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mock Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapEngine('real')}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                      mapEngine === 'real' ? 'bg-slate-700 text-blue-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${hasValidKey ? 'bg-emerald-500' : 'bg-slate-500 animate-pulse'}`}></span>
                    Google Map
                  </button>
                </div>

                {/* View Mode Toggles inside Maximized View */}
                <div className="bg-slate-800 p-0.5 rounded-lg flex items-center gap-0.5 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMapViewMode('batch')}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      mapViewMode === 'batch' ? 'bg-slate-700 text-blue-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Stops ({riderOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapViewMode('active')}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      mapViewMode === 'active' ? 'bg-slate-700 text-blue-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Active Only
                  </button>
                </div>

                {/* Close/Minimize Button */}
                <button
                  type="button"
                  onClick={() => setIsMapMaximized(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center border border-slate-700"
                  title="Minimize Map"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            </div>

            {/* Main Maximized Map Container */}
            <div className="flex-1 min-h-0 relative p-4 flex flex-col md:flex-row gap-4 bg-slate-950">
              
              {/* The Map itself */}
              <div className="flex-1 h-full rounded-2xl overflow-hidden border border-slate-800 relative flex flex-col">
                {mapEngine === 'real' ? (
                  hasValidKey ? (
                    (() => {
                      const realStops = batchStops.map((stop, idx) => {
                        let lat = 18.5204;
                        let lng = 73.8567;
                        
                        if (stop.type === 'kitchen') {
                          const firstOrder = riderOrders[0];
                          if (firstOrder?.geoTags?.routeSteps?.[0]) {
                            lat = firstOrder.geoTags.routeSteps[0].lat;
                            lng = firstOrder.geoTags.routeSteps[0].lng;
                          } else {
                            lat = 18.5983;
                            lng = 73.7431;
                          }
                        } else if (stop.order?.geoTags) {
                          lat = stop.order.geoTags.latitude;
                          lng = stop.order.geoTags.longitude;
                        }

                        return {
                          id: stop.id,
                          name: stop.name,
                          address: stop.address || '',
                          lat,
                          lng,
                          type: stop.type as 'kitchen' | 'customer',
                          status: stop.status,
                          index: stop.type === 'kitchen' ? undefined : idx
                        };
                      });

                      const getRiderLatLng = () => {
                        if (riderOrders.length === 0) return { lat: 18.5204, lng: 73.8567 };
                        
                        const nextIndex = riderOrders.findIndex(o => o.status !== 'delivered');
                        if (nextIndex === -1) {
                          const lastStop = realStops[realStops.length - 1];
                          return { lat: lastStop?.lat || 18.5204, lng: lastStop?.lng || 73.8567 };
                        }
                        
                        const startStop = realStops[nextIndex];
                        const endStop = realStops[nextIndex + 1];
                        
                        if (!startStop || !endStop) return { lat: 18.5204, lng: 73.8567 };
                        
                        const nextOrder = riderOrders[nextIndex];
                        let stepPct = 0;
                        if (nextOrder?.geoTags) {
                          const steps = nextOrder.geoTags.routeSteps;
                          const completed = steps.filter(s => s.isCompleted).length;
                          stepPct = steps.length > 0 ? completed / steps.length : 0;
                        }
                        
                        const lat = startStop.lat + (endStop.lat - startStop.lat) * stepPct;
                        const lng = startStop.lng + (endStop.lng - startStop.lng) * stepPct;
                        
                        return { lat, lng };
                      };

                      return (
                        <RealGoogleMap
                          stops={realStops}
                          riderLatLng={getRiderLatLng()}
                          activeStopId={mapViewMode === 'active' ? activeOrder?.id : null}
                          mapViewMode={mapViewMode}
                          height="100%"
                        />
                      );
                    })()
                  ) : (
                    <GoogleMapsSetupSplash onBackToMock={() => setMapEngine('mock')} />
                  )
                ) : (
                  /* Vector SVG Mock Map representation (Maximized Version) */
                  <div className="bg-slate-950 w-full h-full relative overflow-hidden flex items-center justify-center p-4 shadow-inner">
                    {/* Simulated Street grid background */}
                    <div className="absolute inset-0 opacity-40 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 500 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="0" y1="120" x2="500" y2="120" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="0" y1="180" x2="500" y2="180" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="0" y1="250" x2="500" y2="250" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="80" y1="0" x2="80" y2="300" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="190" y1="0" x2="190" y2="300" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="300" y1="0" x2="300" y2="300" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="400" y1="0" x2="400" y2="300" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />

                        {/* Parks & Green zones */}
                        <rect x="25" y="25" width="110" height="55" fill="#10b981" opacity="0.25" rx="10" />
                        <rect x="330" y="100" width="60" height="60" fill="#10b981" opacity="0.20" rx="10" />

                        {/* City River */}
                        <path d="M -20,140 C 110,110 210,250 310,230 T 520,180" fill="none" stroke="#0ea5e9" strokeWidth="14" opacity="0.35" strokeLinecap="round" />
                        <path d="M -20,140 C 110,110 210,250 310,230 T 520,180" fill="none" stroke="#38bdf8" strokeWidth="4" opacity="0.25" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* SVG Route Path Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
                      {/* Underlay Road line */}
                      {mapViewMode === 'batch' ? (
                        <path
                          d={batchStops.map((s, idx) => (idx === 0 ? 'M' : 'L') + ` ${s.x} ${s.y}`).join(' ')}
                          fill="none"
                          stroke="#334155"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />
                      ) : (
                        <path
                          d={`M ${kitchenX} ${kitchenY} L ${batchStops.find(s => s.id === activeOrder.id)?.x || kitchenX} ${batchStops.find(s => s.id === activeOrder.id)?.y || kitchenY}`}
                          fill="none"
                          stroke="#334155"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />
                      )}

                      {/* Active/Remaining Route Path */}
                      {mapViewMode === 'batch' ? (
                        <>
                          {/* Completed Legs (Green) */}
                          {(() => {
                            const nextIndex = riderOrders.findIndex(o => o.status !== 'delivered');
                            const completedStops = nextIndex === -1 ? batchStops : batchStops.slice(0, nextIndex + 1);
                            if (completedStops.length > 1) {
                              const compPath = completedStops.map((s, idx) => (idx === 0 ? 'M' : 'L') + ` ${s.x} ${s.y}`).join(' ');
                              return <path d={compPath} fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />;
                            }
                            return null;
                          })()}

                          {/* Pending Legs (Glowing Blue Dash) */}
                          {(() => {
                            const nextIndex = riderOrders.findIndex(o => o.status !== 'delivered');
                            const remainingStops = nextIndex === -1 ? [] : batchStops.slice(nextIndex);
                            if (remainingStops.length > 1) {
                              const remPath = remainingStops.map((s, idx) => (idx === 0 ? 'M' : 'L') + ` ${s.x} ${s.y}`).join(' ');
                              return (
                                <path
                                  d={remPath}
                                  fill="none"
                                  stroke="#60a5fa"
                                  strokeWidth="5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="animate-map-dash"
                                />
                              );
                            }
                            return null;
                          })()}
                        </>
                      ) : (
                        /* Active mode route line */
                        <path
                          d={`M ${kitchenX} ${kitchenY} L ${batchStops.find(s => s.id === activeOrder.id)?.x || kitchenX} ${batchStops.find(s => s.id === activeOrder.id)?.y || kitchenY}`}
                          fill="none"
                          stroke={activeOrder.status === 'delivered' ? '#22c55e' : '#60a5fa'}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={activeOrder.status === 'delivered' ? '' : 'animate-map-dash'}
                        />
                      )}
                    </svg>

                    {/* Pin Markers */}
                    {batchStops
                      .filter(stop => mapViewMode === 'batch' || stop.type === 'kitchen' || stop.id === activeOrder.id)
                      .map((stop, idx) => {
                        const isKitchen = stop.type === 'kitchen';
                        const isActive = stop.id === activeOrder.id;
                        const isDelivered = stop.status === 'delivered';
                        const isHovered = hoveredStopId === stop.id;

                        return (
                          <div
                            key={stop.id}
                            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10"
                            style={{ left: `${(stop.x / 500) * 100}%`, top: `${(stop.y / 300) * 100}%` }}
                            onMouseEnter={() => setHoveredStopId(stop.id)}
                            onMouseLeave={() => setHoveredStopId(null)}
                          >
                            {isActive && !isKitchen && !isDelivered && (
                              <div className="absolute inset-0 -m-3 rounded-full border-2 border-blue-400 opacity-90 animate-map-pulse pointer-events-none ring-4 ring-blue-500/25" />
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (!isKitchen) {
                                  setSelectedOrderId(stop.id);
                                }
                              }}
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 shadow-lg transition-all duration-200 hover:scale-125 cursor-pointer bg-slate-800 border-slate-700 text-white"
                              style={{ backgroundColor: isKitchen ? '#f97316' : isDelivered ? '#10b981' : isActive ? '#3b82f6' : '#64748b', borderColor: '#ffffff' }}
                            >
                              {isKitchen ? 'K' : idx}
                            </button>

                            {(isHovered || (isActive && !isKitchen && mapViewMode === 'active')) && (
                              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-52 bg-slate-900 border border-slate-700 text-[11px] rounded-xl p-3 shadow-2xl z-30 pointer-events-none space-y-1 text-left animate-in fade-in duration-100">
                                <div className="flex justify-between items-center gap-1.5 pb-1 border-b border-slate-800">
                                  <span className="font-extrabold text-slate-100 truncate max-w-[120px]">
                                    {stop.name}
                                  </span>
                                  <span className={`px-1 rounded text-[8px] font-black uppercase ${
                                    isKitchen ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                                    isDelivered ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                                    'bg-blue-950 text-blue-400 border border-blue-900'
                                  }`}>
                                    {isKitchen ? 'Central' : tText(stop.status || '')}
                                  </span>
                                </div>
                                <p className="text-slate-300 truncate">📍 {tText(stop.address || '')}</p>
                                {!isKitchen && (
                                  <p className="text-[10px] font-bold text-slate-400">
                                    Stop #{idx} in active batch
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                    {/* Moving Rider */}
                    {riderOrders.length > 0 && (
                      <div
                        className="absolute bg-blue-600 border-2 border-white text-white p-2.5 rounded-full shadow-lg transition-all duration-1000 z-20 flex items-center justify-center"
                        style={{
                          left: `${(riderPos.x / 500) * 100}%`,
                          top: `${(riderPos.y / 300) * 100}%`,
                          transform: `translate(-50%, -50%) rotate(${riderPos.angle}deg)`,
                          transition: 'left 1s cubic-bezier(0.4, 0, 0.2, 1), top 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <Truck size={16} className="transform -rotate-180" style={{ transform: 'rotate(270deg)' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Maximized Side Panel: Active Order & Telemetry */}
              <div className="w-full md:w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-4 overflow-y-auto max-h-[40vh] md:max-h-[60vh] pr-1">
                  {activeOrder && (
                    <div className="border-b border-slate-800 pb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Active Delivery Point</span>
                      <h4 className="text-sm font-black text-slate-100 mt-1">{activeOrder.customerName}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed text-left">📍 {tText(activeOrder.customerAddress)}</p>
                      <p className="text-xs text-slate-400 mt-1 text-left">📞 {activeOrder.customerPhone}</p>
                    </div>
                  )}

                  {activeOrder && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <span className="font-bold text-slate-400">🍲 Package:</span>
                        <span className="font-extrabold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30 truncate max-w-[150px]">
                          {tText(activeOrder.details.packageName)}
                        </span>
                      </div>

                      {activeOrder.details.guestPlatesCount > 0 && (
                        <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                          <span className="font-bold text-slate-400">👥 Guests:</span>
                          <span className="font-extrabold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                            +{activeOrder.details.guestPlatesCount} Plates
                          </span>
                        </div>
                      )}

                      {activeOrder.details.addOns && activeOrder.details.addOns.length > 0 && (
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block text-left">✨ Extra Items:</span>
                          {activeOrder.details.addOns.map((add: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-slate-300 truncate max-w-[140px]">{tText(add.name)}</span>
                              <span className="text-amber-400 font-bold bg-amber-950/30 px-1.5 py-0.5 rounded text-[10px]">Qty: {add.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Steps checklist in Maximized view */}
                  {activeOrder && activeOrder.geoTags && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1 text-left">Navigation Tasks:</span>
                      {activeOrder.geoTags.routeSteps.map((step, idx) => {
                        const isCompleted = step.isCompleted;
                        const canComplete = idx === 0 || activeOrder.geoTags!.routeSteps[idx - 1].isCompleted;
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
                              isCompleted
                                ? 'bg-emerald-950/20 border-emerald-900/30 text-slate-500 line-through text-left'
                                : canComplete
                                ? 'bg-slate-800 border-slate-700 text-slate-200 text-left'
                                : 'bg-slate-900/40 border-slate-800/40 text-slate-600 text-left'
                            }`}
                          >
                            <div className="mt-0.5">
                              {isCompleted ? (
                                <button
                                  type="button"
                                  onClick={() => handleStepIncomplete(activeOrder.id, idx)}
                                  className="w-4 h-4 rounded bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px] hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                                >
                                  ✓
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStepComplete(activeOrder.id, idx)}
                                  disabled={!canComplete}
                                  className={`w-4 h-4 rounded border flex items-center justify-center font-bold text-[9px] cursor-pointer ${
                                    canComplete 
                                      ? 'border-blue-500 bg-blue-950 text-blue-400 hover:bg-blue-500 hover:text-white' 
                                      : 'border-slate-800 text-slate-600 cursor-not-allowed'
                                  }`}
                                >
                                  {idx + 1}
                                </button>
                              )}
                            </div>
                            <p className="font-medium leading-relaxed truncate max-w-[190px] text-left" title={tText(step.instruction)}>{tText(step.instruction)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Telemetry at Bottom of side panel */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono space-y-1 text-left">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>📡 ACTIVE TELEMETRY</span>
                    <span className="text-blue-500 font-bold">LIVE AGPS</span>
                  </div>
                  <div className="space-y-0.5 text-slate-300">
                    <p>Rider Lat: <span className="text-blue-400 font-bold">{riderPos.x ? (18.5204 + (riderPos.x / 50000)).toFixed(5) : '18.5204'}</span></p>
                    <p>Rider Lng: <span className="text-blue-400 font-bold">{riderPos.y ? (73.8567 + (riderPos.y / 50000)).toFixed(5) : '73.8567'}</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapMaximized(false)}
                    className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-center font-bold text-[10px] transition-colors border border-slate-700 cursor-pointer"
                  >
                    Minimize View (नक्शा छोटा करें)
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
