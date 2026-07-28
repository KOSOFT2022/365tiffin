/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, ShieldCheck, Users, IndianRupee, Store, Truck, Check, X, Star, Calendar, RefreshCcw, ChevronDown, Layers, Zap, Plus, Edit3, Trash2, CheckCircle2, AlertCircle, Sparkles, CreditCard, ArrowUpRight, Settings2 } from 'lucide-react';
import { translateText } from '../utils';
import { useTranslation } from 'react-i18next';
import { SaaSPlan, Kitchen } from '../types';

export const SuperAdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const tText = (text: string | null | undefined) => translateText(text, i18n.language);
  const { 
    kitchens, 
    subscriptions, 
    orders, 
    users, 
    resetAllData,
    clearDemoData,
    saasPlans,
    createSaaSPlan,
    updateSaaSPlan,
    deleteSaaSPlan,
    adminUpdateKitchenSaaSMembership,
    razorpaySettings,
    updateRazorpaySettings
  } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'saas' | 'kitchens' | 'fleet' | 'reviews'>('overview');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [showClearDemoConfirm, setShowClearDemoConfirm] = useState(false);

  // Razorpay Gateway Config State
  const [rzpForm, setRzpForm] = useState({
    keyId: razorpaySettings?.keyId || 'rzp_live_TAwUdHNX4tAoU2',
    keySecret: razorpaySettings?.keySecret || 'ctfMLHE7Z0B0ugMqv9S3LnSZ',
    isTestMode: razorpaySettings?.isTestMode ?? false,
    isEnabled: razorpaySettings?.isEnabled ?? true,
    merchantName: razorpaySettings?.merchantName || 'GharKaKhana Tiffin SaaS'
  });

  React.useEffect(() => {
    if (razorpaySettings) {
      setRzpForm({
        keyId: razorpaySettings.keyId || 'rzp_live_TAwUdHNX4tAoU2',
        keySecret: razorpaySettings.keySecret || 'ctfMLHE7Z0B0ugMqv9S3LnSZ',
        isTestMode: razorpaySettings.isTestMode ?? false,
        isEnabled: razorpaySettings.isEnabled ?? true,
        merchantName: razorpaySettings.merchantName || 'GharKaKhana Tiffin SaaS'
      });
    }
  }, [razorpaySettings]);
  const [rzpSavedToast, setRzpSavedToast] = useState(false);

  const handleSaveRazorpay = (e: React.FormEvent) => {
    e.preventDefault();
    updateRazorpaySettings(rzpForm);
    setRzpSavedToast(true);
    setTimeout(() => setRzpSavedToast(false), 3000);
  };

  // SaaS Plan Modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaaSPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    priceMonthly: 999,
    priceYearly: 9990,
    commissionRatePct: 5,
    maxSubscribersLimit: 50,
    maxPackagesLimit: 5,
    supportsBulkOrders: true,
    supportsAiAssistant: false,
    supportsDedicatedFleet: false,
    badgeColor: 'emerald'
  });

  // Kitchen SaaS Override Modal state
  const [editingKitchenSaaS, setEditingKitchenSaaS] = useState<Kitchen | null>(null);
  const [kitchenSaaSForm, setKitchenSaaSForm] = useState({
    planId: 'saas_starter',
    status: 'active' as 'active' | 'trial' | 'expired' | 'grace_period',
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    amountPaid: 999,
    autoRenew: true
  });

  // Compute stats
  const totalRevenue = subscriptions.reduce((acc, s) => acc + s.price, 0) + 
    orders.reduce((acc, o) => {
      const addonsPrice = o.details.addOns.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const guestPrice = o.details.guestPlatesCount * 150; // standard guest price is 150 INR
      return acc + addonsPrice + guestPrice;
    }, 0);

  const activeSubscribers = subscriptions.filter(s => s.status === 'active').length;
  const activeKitchensCount = kitchens.filter(k => k.isActive).length;
  const completedDeliveries = orders.filter(o => o.status === 'delivered').length;

  // Filter out riders
  const riders = users.filter(u => u.role === 'delivery_boy');

  // SVG Chart Calculation for Kitchen Revenue Split
  const totalKitchenShares = kitchens.map(k => {
    const kitchenSubs = subscriptions.filter(s => s.kitchenId === k.id);
    const subsRev = kitchenSubs.reduce((sum, s) => sum + s.price, 0);
    const orderBonus = orders
      .filter(o => o.kitchenId === k.id)
      .reduce((sum, o) => {
        const addons = o.details.addOns.reduce((s, item) => s + (item.price * item.quantity), 0);
        return sum + addons + (o.details.guestPlatesCount * 150);
      }, 0);
    return { name: k.name, revenue: subsRev + orderBonus };
  });

  const maxRevenue = Math.max(...totalKitchenShares.map(k => k.revenue), 100);

  // SaaS Metrics Calculations
  const totalSaaSMRR = kitchens.reduce((sum, k) => {
    if (k.saasMembership && k.saasMembership.status === 'active') {
      return sum + (k.saasMembership.billingCycle === 'yearly' ? Math.round(k.saasMembership.amountPaid / 12) : k.saasMembership.amountPaid);
    }
    return sum;
  }, 0);

  const totalSaaSARR = totalSaaSMRR * 12;
  const subscribedKitchensCount = kitchens.filter(k => k.saasMembership && k.saasMembership.status === 'active').length;
  const avgCommissionRate = saasPlans.length > 0
    ? (saasPlans.reduce((acc, p) => acc + p.commissionRatePct, 0) / saasPlans.length).toFixed(1)
    : '5.0';

  const handleOpenAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      description: '',
      priceMonthly: 999,
      priceYearly: 9990,
      commissionRatePct: 5,
      maxSubscribersLimit: 50,
      maxPackagesLimit: 5,
      supportsBulkOrders: true,
      supportsAiAssistant: false,
      supportsDedicatedFleet: false,
      badgeColor: 'emerald'
    });
    setShowPlanModal(true);
  };

  const handleOpenEditPlan = (plan: SaaSPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      commissionRatePct: plan.commissionRate ?? 5,
      maxSubscribersLimit: plan.maxSubscribers ?? 50,
      maxPackagesLimit: plan.maxPackages ?? 5,
      supportsBulkOrders: plan.allowsBulkOrders ?? true,
      supportsAiAssistant: plan.allowsAiAssistant ?? false,
      supportsDedicatedFleet: plan.allowsDedicatedFleet ?? false,
      badgeColor: plan.badgeText || 'emerald'
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name) return;

    if (editingPlan) {
      updateSaaSPlan(editingPlan.id, planForm);
    } else {
      createSaaSPlan(planForm);
    }
    setShowPlanModal(false);
  };

  const handleOpenKitchenSaaS = (kitchen: Kitchen) => {
    setEditingKitchenSaaS(kitchen);
    setKitchenSaaSForm({
      planId: kitchen.saasMembership?.planId || 'saas_starter',
      status: kitchen.saasMembership?.status || 'active',
      billingCycle: kitchen.saasMembership?.billingCycle || 'monthly',
      amountPaid: kitchen.saasMembership?.amountPaid || 999,
      autoRenew: kitchen.saasMembership?.autoRenew ?? true
    });
  };

  const handleSaveKitchenSaaS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKitchenSaaS) return;

    const selectedPlan = saasPlans.find(p => p.id === kitchenSaaSForm.planId);
    adminUpdateKitchenSaaSMembership(editingKitchenSaaS.id, {
      planId: kitchenSaaSForm.planId,
      planName: selectedPlan ? selectedPlan.name : 'Custom SaaS Plan',
      status: kitchenSaaSForm.status,
      billingCycle: kitchenSaaSForm.billingCycle,
      amountPaid: kitchenSaaSForm.amountPaid,
      autoRenew: kitchenSaaSForm.autoRenew
    });
    setEditingKitchenSaaS(null);
  };

  return (
    <div className="bg-emerald-50/30 min-h-screen p-4 md:p-8 font-sans pb-32 text-slate-800" id="super-admin-dashboard">
      {/* Upper Brand Nav */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">TiffinHQ <span className="text-emerald-500">Administration</span></h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platform governance, financial analytics, provider auditing, and multi-vendor fleet tracking.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-emerald-100">
          <div className="relative mx-1.5">
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/50 border border-emerald-100 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-700 transition-all shadow-xs focus:outline-none font-bold text-slate-800 cursor-pointer"
            >
              <span className="font-bold text-slate-400 uppercase text-[8px] tracking-wider select-none">Lang:</span>
              <span>
                {i18n.language === 'en' && 'EN'}
                {i18n.language === 'hi' && 'HI'}
                {i18n.language === 'mr' && 'MR'}
              </span>
              <ChevronDown size={12} className={`text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white border border-slate-100 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      i18n.changeLanguage('en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      i18n.language === 'en' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>English (EN)</span>
                    {i18n.language === 'en' && <Check size={10} className="text-emerald-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      i18n.changeLanguage('hi');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      i18n.language === 'hi' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>हिंदी (HI)</span>
                    {i18n.language === 'hi' && <Check size={10} className="text-emerald-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      i18n.changeLanguage('mr');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      i18n.language === 'mr' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>मराठी (MR)</span>
                    {i18n.language === 'mr' && <Check size={10} className="text-emerald-500" />}
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('saas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'saas' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            <Layers size={13} />
            <span>SaaS Plans & Vendors</span>
          </button>
          <button
            onClick={() => setActiveTab('kitchens')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'kitchens' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            Kitchens ({kitchens.length})
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'fleet' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            Fleet Riders ({riders.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'reviews' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            Ratings Feed
          </button>
          
          <button
            type="button"
            onClick={() => setShowClearDemoConfirm(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
            title="Wipe sample kitchens, orders, and subscriptions"
          >
            <Trash2 size={13} />
            <span>Clear Demo Data</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
              <IndianRupee size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Platform GMV</p>
              <h3 className="text-xl font-extrabold text-slate-800">₹{totalRevenue.toFixed(2)}</h3>
              <p className="text-[10px] text-green-600 font-semibold mt-0.5">↑ 14.2% platform fees</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Subscribers</p>
              <h3 className="text-xl font-extrabold text-slate-800">{activeSubscribers} Users</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Avg. ₹7,900.00 spend/mo</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
              <Store size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Approved Kitchens</p>
              <h3 className="text-xl font-extrabold text-slate-800">{activeKitchensCount} Active</h3>
              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">0 Pending audit</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fulfillment Rate</p>
              <h3 className="text-xl font-extrabold text-slate-800">
                {orders.length > 0 ? Math.round((completedDeliveries / orders.length) * 100) : 0}%
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{completedDeliveries} delivered today</p>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Rendering */}
        {activeTab === 'saas' && (
          <div className="space-y-6">
            {/* SaaS Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SaaS MRR</p>
                    <h4 className="text-lg font-extrabold text-slate-800">₹{totalSaaSMRR.toLocaleString()}/mo</h4>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-600 font-semibold mt-2">↑ Recurring SaaS revenue from kitchens</p>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Projected ARR</p>
                    <h4 className="text-lg font-extrabold text-slate-800">₹{totalSaaSARR.toLocaleString()}/yr</h4>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">12-month projected subscription ARR</p>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                    <Store size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SaaS Subscribed Vendors</p>
                    <h4 className="text-lg font-extrabold text-slate-800">{subscribedKitchensCount} / {kitchens.length} Active</h4>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-600 font-semibold mt-2">{Math.round((subscribedKitchensCount / (kitchens.length || 1)) * 100)}% vendor penetration rate</p>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                    <Zap size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Commission Rate</p>
                    <h4 className="text-lg font-extrabold text-slate-800">{avgCommissionRate}%</h4>
                  </div>
                </div>
                <p className="text-[10px] text-amber-600 font-semibold mt-2">Platform per-order commission fee</p>
              </div>
            </div>

            {/* Razorpay Gateway Credentials Config Card */}
            <div className="bg-gradient-to-r from-slate-900 via-[#0c2340] to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-blue-900/50 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-blue-800/60 pb-5 mb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-black text-blue-400 text-lg">
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white tracking-wide">Razorpay Gateway Integration</h3>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        {rzpForm.isTestMode ? 'Test Sandbox Mode' : 'Live Production'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-200/80 mt-0.5">
                      Enter your Razorpay API Key ID and Secret. Kitchen owners subscribing to SaaS plans will be redirected to this Razorpay gateway.
                    </p>
                  </div>
                </div>

                {rzpSavedToast && (
                  <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 animate-bounce">
                    <CheckCircle2 size={14} />
                    <span>Credentials Saved!</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveRazorpay} className="space-y-4 relative z-10 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-200 font-bold mb-1">Razorpay Key ID</label>
                    <input
                      type="text"
                      required
                      value={rzpForm.keyId}
                      onChange={(e) => setRzpForm({ ...rzpForm, keyId: e.target.value })}
                      placeholder="e.g. rzp_test_881290349281"
                      className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-blue-700/50 text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-blue-200 font-bold mb-1">Razorpay Key Secret</label>
                    <input
                      type="password"
                      required
                      value={rzpForm.keySecret}
                      onChange={(e) => setRzpForm({ ...rzpForm, keySecret: e.target.value })}
                      placeholder="e.g. sec_razorpay_99210023412"
                      className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-blue-700/50 text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-blue-200 font-bold mb-1">Merchant Display Name</label>
                    <input
                      type="text"
                      required
                      value={rzpForm.merchantName}
                      onChange={(e) => setRzpForm({ ...rzpForm, merchantName: e.target.value })}
                      placeholder="e.g. GharKaKhana Tiffin SaaS"
                      className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-blue-700/50 text-white font-medium focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-slate-800/60 p-2.5 rounded-xl border border-blue-700/40">
                    <input
                      type="checkbox"
                      id="rzpTestMode"
                      checked={rzpForm.isTestMode}
                      onChange={(e) => setRzpForm({ ...rzpForm, isTestMode: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-500 focus:ring-blue-400 bg-slate-700 border-slate-600"
                    />
                    <label htmlFor="rzpTestMode" className="text-xs text-blue-100 font-bold cursor-pointer">
                      Sandbox / Test Keys Mode
                    </label>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-800/60 p-2.5 rounded-xl border border-blue-700/40">
                    <input
                      type="checkbox"
                      id="rzpIsEnabled"
                      checked={rzpForm.isEnabled}
                      onChange={(e) => setRzpForm({ ...rzpForm, isEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-700 border-slate-600"
                    />
                    <label htmlFor="rzpIsEnabled" className="text-xs text-blue-100 font-bold cursor-pointer">
                      Enable Razorpay SaaS Redirect
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-blue-800/50">
                  <div className="text-[11px] text-blue-300/80 font-mono">
                    Active Key ID: <span className="text-emerald-400 font-bold">{rzpForm.keyId ? `${rzpForm.keyId.substring(0, 12)}...` : 'Not Configured'}</span>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck size={16} />
                    <span>Save Razorpay Credentials</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SaaS Plans Management Section */}
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-50 pb-5 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Layers className="text-emerald-500" size={18} />
                    <span>SaaS Subscription Plans for Tiffin Kitchen Owners</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure tier pricing, subscriber capacity, commission fees, and features for tiffin vendors.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddPlan}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Create New SaaS Plan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {saasPlans.map((plan) => {
                  const kitchenCountOnPlan = kitchens.filter(
                    k => k.saasMembership?.planId === plan.id && k.saasMembership?.status === 'active'
                  ).length;

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-3xl p-6 border-2 transition-all flex flex-col justify-between ${
                        plan.isPopular
                          ? 'border-emerald-500 bg-emerald-50/20 shadow-md'
                          : 'border-slate-100 bg-white shadow-sm hover:border-emerald-200'
                      }`}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-3 right-6 bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-sm">
                          Most Popular
                        </span>
                      )}

                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-2.5 py-0.5 rounded-md">
                              {plan.badgeColor || 'Tier'}
                            </span>
                            <h4 className="text-lg font-bold text-slate-800 mt-1">{plan.name}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-slate-800">₹{plan.priceMonthly}</span>
                            <span className="text-[10px] text-slate-400 font-medium block">/month</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">{plan.description}</p>

                        <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                          <div className="flex justify-between text-slate-700">
                            <span className="text-slate-500">Yearly Billing:</span>
                            <span className="font-bold">₹{plan.priceYearly}/yr</span>
                          </div>
                          <div className="flex justify-between text-slate-700">
                            <span className="text-slate-500">Platform Commission:</span>
                            <span className="font-bold text-amber-600">{plan.commissionRatePct}%</span>
                          </div>
                          <div className="flex justify-between text-slate-700">
                            <span className="text-slate-500">Max Subscribers:</span>
                            <span className="font-bold">{plan.maxSubscribersLimit >= 9999 ? 'Unlimited' : plan.maxSubscribersLimit}</span>
                          </div>
                          <div className="flex justify-between text-slate-700">
                            <span className="text-slate-500">Max Subscription Packages:</span>
                            <span className="font-bold">{plan.maxPackagesLimit >= 99 ? 'Unlimited' : plan.maxPackagesLimit}</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1.5 text-[11px] text-slate-600">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={13} className={plan.supportsBulkOrders ? "text-emerald-500" : "text-slate-300"} />
                            <span className={plan.supportsBulkOrders ? "text-slate-800 font-medium" : "text-slate-400 line-through"}>
                              Bulk Party Catering Orders
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={13} className={plan.supportsAiAssistant ? "text-emerald-500" : "text-slate-300"} />
                            <span className={plan.supportsAiAssistant ? "text-slate-800 font-medium" : "text-slate-400 line-through"}>
                              AI Demand Forecasting & Auto-Menu
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={13} className={plan.supportsDedicatedFleet ? "text-emerald-500" : "text-slate-300"} />
                            <span className={plan.supportsDedicatedFleet ? "text-slate-800 font-medium" : "text-slate-400 line-through"}>
                              Dedicated Delivery Fleet Priority
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500">
                          <strong className="text-emerald-600 font-extrabold">{kitchenCountOnPlan}</strong> kitchens subscribed
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditPlan(plan)}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 rounded-lg text-xs transition-colors cursor-pointer"
                            title="Edit Plan"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteSaaSPlan(plan.id)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg text-xs transition-colors cursor-pointer"
                            title="Delete Plan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kitchen SaaS Subscriptions Matrix */}
            <div className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-emerald-50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                    Kitchen SaaS Memberships Audit
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Overview of active subscriptions, billing cycles, renewal dates, and manual override controls.
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-medium bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                  {kitchens.length} Vendors Registered
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-emerald-50">
                      <th className="p-4">Tiffin Kitchen</th>
                      <th className="p-4">Assigned SaaS Plan</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Billing Cycle</th>
                      <th className="p-4">Renewal Date</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50 text-xs">
                    {kitchens.map((k) => {
                      const m = k.saasMembership || {
                        planId: 'saas_starter',
                        planName: 'Starter Kitchen',
                        status: 'active',
                        billingCycle: 'monthly',
                        amountPaid: 999,
                        startDate: '2026-07-01',
                        endDate: '2026-08-01',
                        autoRenew: true
                      };

                      return (
                        <tr key={k.id} className="hover:bg-emerald-50/10 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={k.imageUrl}
                                alt={tText(k.name)}
                                className="w-9 h-9 rounded-xl object-cover border border-emerald-100 shadow-sm"
                              />
                              <div>
                                <p className="font-bold text-slate-800">{tText(k.name)}</p>
                                <p className="text-[10px] text-slate-500">{tText(k.address)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              {m.planName}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              m.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : m.status === 'trial'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-semibold text-slate-700">
                            {m.billingCycle} (₹{m.amountPaid})
                          </td>
                          <td className="p-4 text-slate-600 font-medium">
                            {m.endDate || '2026-08-01'}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleOpenKitchenSaaS(k)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-700 rounded-lg font-bold text-xs transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Settings2 size={13} />
                              <span>Override Plan</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create or Edit SaaS Plan */}
        {showPlanModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center pb-4 border-b border-emerald-50 mb-5">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Layers className="text-emerald-500" size={20} />
                  <span>{editingPlan ? 'Edit SaaS Plan' : 'Create New SaaS Plan'}</span>
                </h3>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g., Growth Pro"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    placeholder="e.g., Ideal for established kitchens scaling daily subscribers."
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Monthly Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={planForm.priceMonthly}
                      onChange={(e) => setPlanForm({ ...planForm, priceMonthly: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Yearly Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={planForm.priceYearly}
                      onChange={(e) => setPlanForm({ ...planForm, priceYearly: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Commission Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={planForm.commissionRatePct}
                      onChange={(e) => setPlanForm({ ...planForm, commissionRatePct: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Max Subscribers</label>
                    <input
                      type="number"
                      required
                      value={planForm.maxSubscribersLimit}
                      onChange={(e) => setPlanForm({ ...planForm, maxSubscribersLimit: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Max Packages</label>
                    <input
                      type="number"
                      required
                      value={planForm.maxPackagesLimit}
                      onChange={(e) => setPlanForm({ ...planForm, maxPackagesLimit: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="block text-slate-700 font-bold mb-1">Feature Entitlements</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.supportsBulkOrders}
                      onChange={(e) => setPlanForm({ ...planForm, supportsBulkOrders: e.target.checked })}
                      className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-slate-700 font-medium">Allow Bulk Party / Catering Orders</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.supportsAiAssistant}
                      onChange={(e) => setPlanForm({ ...planForm, supportsAiAssistant: e.target.checked })}
                      className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-slate-700 font-medium">AI Demand Forecasting & Auto-Menu Suggestions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.supportsDedicatedFleet}
                      onChange={(e) => setPlanForm({ ...planForm, supportsDedicatedFleet: e.target.checked })}
                      className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-slate-700 font-medium">Dedicated Priority Delivery Rider Allocation</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md cursor-pointer"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Override Kitchen SaaS Membership */}
        {editingKitchenSaaS && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center pb-4 border-b border-emerald-50 mb-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Override Vendor Membership</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{editingKitchenSaaS.name}</p>
                </div>
                <button
                  onClick={() => setEditingKitchenSaaS(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveKitchenSaaS} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select SaaS Plan</label>
                  <select
                    value={kitchenSaaSForm.planId}
                    onChange={(e) => {
                      const p = saasPlans.find(plan => plan.id === e.target.value);
                      setKitchenSaaSForm({
                        ...kitchenSaaSForm,
                        planId: e.target.value,
                        amountPaid: p ? (kitchenSaaSForm.billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly) : kitchenSaaSForm.amountPaid
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-bold text-slate-800"
                  >
                    {saasPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.priceMonthly}/mo | {p.commissionRatePct}% comm)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Status</label>
                    <select
                      value={kitchenSaaSForm.status}
                      onChange={(e) => setKitchenSaaSForm({ ...kitchenSaaSForm, status: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="expired">Expired</option>
                      <option value="grace_period">Grace Period</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Billing Cycle</label>
                    <select
                      value={kitchenSaaSForm.billingCycle}
                      onChange={(e) => setKitchenSaaSForm({ ...kitchenSaaSForm, billingCycle: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount Paid / Fee (₹)</label>
                  <input
                    type="number"
                    value={kitchenSaaSForm.amountPaid}
                    onChange={(e) => setKitchenSaaSForm({ ...kitchenSaaSForm, amountPaid: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kitchenSaaSForm.autoRenew}
                      onChange={(e) => setKitchenSaaSForm({ ...kitchenSaaSForm, autoRenew: e.target.checked })}
                      className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-slate-700 font-medium">Auto-renew membership on expiration</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingKitchenSaaS(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md cursor-pointer"
                  >
                    Apply Override
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SVG Interactive Revenue Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-6 flex justify-between items-center border-b border-emerald-50 pb-3">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                  Revenue Share by Kitchen
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Platform Wide</span>
              </h3>
              <div className="space-y-4">
                {totalKitchenShares.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active kitchens registered yet. Zero revenue recorded.
                  </div>
                ) : (
                  totalKitchenShares.map((k, index) => {
                    const pct = Math.max(15, (k.revenue / maxRevenue) * 100);
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">{k.name}</span>
                          <span className="font-mono text-slate-800 font-bold">₹{k.revenue.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-emerald-50/40 h-3 rounded-full overflow-hidden flex border border-emerald-100/30">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-8 border-t border-emerald-50 pt-6 flex justify-between items-center text-xs text-slate-500">
                <div>
                  <span className="font-semibold text-slate-700">Payout Period:</span> Weekly Cycle (Sunday midnight)
                </div>
                <div className="flex items-center gap-4 font-medium">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Veg Premium</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500 inline-block"></span> Non-Veg</span>
                </div>
              </div>
            </div>

            {/* Platform Quick Facts */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-emerald-100 pb-3">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                Platform Health Audit
              </h3>
              
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50/50 rounded-xl flex items-start gap-3 border border-emerald-100/40">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5"></div>
                  <div>
                    <p className="font-bold text-slate-800">100% On-Time Delivery Guarantee</p>
                    <p className="text-slate-500 mt-0.5">Average dispatch lag is currently 7.2 minutes platform-wide.</p>
                  </div>
                </div>

                <div className="p-3 bg-green-50/50 rounded-xl flex items-start gap-3 border border-green-100/40">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5"></div>
                  <div>
                    <p className="font-bold text-slate-800">Food Standards Checked</p>
                    <p className="text-slate-500 mt-0.5">All kitchens hold a valid food safety inspection certificate.</p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-xl flex items-start gap-3 border border-blue-100/40">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5"></div>
                  <div>
                    <p className="font-bold text-slate-800">Rider Attendance Active</p>
                    <p className="text-slate-500 mt-0.5">{riders.length} out of {riders.length} riders currently checked in and active on routes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kitchens' && (
          <div className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-emerald-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                Manage Tiffin Service Providers
              </h3>
              <span className="text-xs text-slate-500 font-medium">Click toggles to temporarily pause kitchen dispatch.</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-emerald-50">
                    <th className="p-4">Kitchen Details</th>
                    <th className="p-4">Owner Name</th>
                    <th className="p-4">Cuisine</th>
                    <th className="p-4">Weekly Menu Size</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Platform Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50 text-xs">
                  {kitchens.map(k => (
                    <tr key={k.id} className="hover:bg-emerald-50/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={k.imageUrl}
                            alt={tText(k.name)}
                            className="w-10 h-10 rounded-xl object-cover border border-emerald-100 shadow-sm"
                          />
                          <div>
                            <p className="font-bold text-slate-800">{tText(k.name)}</p>
                            <p className="text-[10px] text-slate-500">{tText(k.address)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-semibold">
                        {tText(users.find(u => u.id === k.ownerId)?.name || 'Sunita Deshmukh')}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          k.cuisineType === 'pure-veg' 
                            ? 'bg-green-50 text-green-700 border border-green-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {tText(k.cuisineType === 'pure-veg' ? 'Pure Veg' : 'Veg / Non-Veg')}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium font-mono">
                        {k.weeklyMenu.length} Days Menu Scheduled
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Star className="text-emerald-500 fill-emerald-500" size={13} />
                          {k.rating} <span className="text-slate-400 font-normal">({k.reviewsCount} reviews)</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${k.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="font-semibold text-slate-700">{k.isActive ? 'Active' : 'Suspended'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-emerald-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                Registered Delivery Agents
              </h3>
              <span className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">Rider Tracking Active</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-emerald-50">
                    <th className="p-4">Rider</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Currently Assigned Order</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Speed Stats</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50 text-xs">
                  {riders.map(r => {
                    const activeRiderOrder = orders.find(o => o.deliveryBoyId === r.id && o.status !== 'delivered');
                    return (
                      <tr key={r.id} className="hover:bg-emerald-50/10 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={r.avatarUrl}
                              alt={tText(r.name)}
                              className="w-8 h-8 rounded-full object-cover border border-emerald-100"
                            />
                            <p className="font-bold text-slate-800">{tText(r.name)}</p>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 font-mono">{r.phone}</td>
                        <td className="p-4 font-semibold text-slate-700">
                          {activeRiderOrder ? (
                            <span className="text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                              Order #{activeRiderOrder.id} ({tText(activeRiderOrder.kitchenName)})
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">No active assignment</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Star className="text-emerald-500 fill-emerald-500" size={13} />
                            4.9 <span className="text-slate-400 font-normal">({42} rides)</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500">
                          Avg. <strong className="text-slate-700">14.8 mins</strong> delivery speed
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            activeRiderOrder ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {activeRiderOrder ? 'Out on Route' : 'Idle / Available'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-emerald-50 pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                  Active Customer Feedback Feed
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time reviews posted by subscribers after dining.</p>
              </div>
              <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-bold">100% Verified Customers</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders
                .filter(o => o.rating)
                .map(o => (
                  <div key={o.id} className="p-4 rounded-2xl border border-emerald-50 bg-emerald-50/10 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{tText(o.customerName)}</h4>
                        <p className="text-[10px] text-slate-500">{tText(o.kitchenName)} • {tText(o.details.packageName)}</p>
                      </div>
                      <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        <Star className="fill-emerald-500 text-emerald-500" size={10} />
                        {o.rating}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      "{tText(o.feedbackText || 'Tiffin was absolutely fresh and tasty! Delivered hot on time.')}"
                    </p>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Order ID: #{o.id} • Date: {o.date}
                    </div>
                  </div>
                ))}

              {orders.filter(o => o.rating).length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-400 space-y-2">
                  <Star size={32} className="mx-auto text-slate-200" />
                  <p className="text-xs font-semibold text-slate-600">No active feedback submitted yet.</p>
                  <p className="text-[10px] text-slate-500">Go to the Customer UI, find completed orders, and leave a star rating!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showClearDemoConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800">Clear All Demo Data?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This will permanently remove all sample kitchens, customer subscriptions, active orders, and bulk orders from the system. Super Admin governance access and platform SaaS plans will be preserved.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearDemoConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDemoData();
                  setShowClearDemoConfirm(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-200 transition-all cursor-pointer"
              >
                Yes, Clear Demo Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
