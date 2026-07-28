/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, Calendar, PlusCircle, CheckCircle, Truck, RefreshCw, Flame, ChevronRight, Save, UserCheck, Star, X, Check, ChefHat, ArrowRight, ArrowLeft, Info, Home, Settings, ListPlus, Tag, ShoppingBag, Trash2, TrendingUp, BarChart2, FileText, Download, SlidersHorizontal, ChevronDown, ShieldCheck, Lock, CreditCard, QrCode, Smartphone, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { SubscriptionPackage, DayMenu, BulkMenuItem, BulkOrder, SaaSPlan } from '../types';
import { getSubscriptionAttendanceMatrix, translateText, getTodayDateStr } from '../utils';
import { openRazorpayCheckout } from '../lib/razorpay';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

export const TiffinOwnerDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const tText = (text: string | null | undefined) => translateText(text, i18n.language);
  const { 
    currentUser, 
    kitchens, 
    subscriptions, 
    orders, 
    users, 
    updateOrderStatus, 
    assignDeliveryRider, 
    addNewPackage, 
    updateDayMenu,
    updateKitchenTimingWindows,
    updateKitchenDetails,
    handleDiversionApproval,
    addDeliveryBoy,
    bulkOrders,
    updateBulkOrderStatus,
    toggleBulkOrdersAcceptance,
    updateBulkMenu,
    saasPlans,
    subscribeKitchenToSaaSPlan,
    razorpaySettings
  } = useApp();

  // Find owner's kitchen
  const kitchen = kitchens.find(k => k.ownerId === currentUser.id) || kitchens[0];
  
  const [activeTab, setActiveTab] = useState<'orders' | 'packages' | 'menu' | 'subscribers' | 'config' | 'bulk' | 'stats' | 'saas_plan'>('orders');
  const [selectedSaasCycle, setSelectedSaasCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Razorpay Checkout Modal States
  const [checkoutPlan, setCheckoutPlan] = useState<SaaSPlan | null>(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'qr'>('upi');
  const [upiId, setUpiId] = useState('kitchen.owner@upi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [razorpaySuccessDetails, setRazorpaySuccessDetails] = useState<{
    paymentId: string;
    orderId: string;
    planName: string;
    amount: number;
    billingCycle: string;
  } | null>(null);

  const handleOpenRazorpayCheckout = async (plan: SaaSPlan) => {
    setCheckoutPlan(plan);
    setRazorpaySuccessDetails(null);
    setIsProcessingRazorpay(false);

    const keyId = razorpaySettings?.keyId || 'rzp_live_TAwUdHNX4tAoU2';
    const keySecret = razorpaySettings?.keySecret || 'ctfMLHE7Z0B0ugMqv9S3LnSZ';
    const amount = selectedSaasCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

    // Trigger official SDK popup if available
    const result = await openRazorpayCheckout({
      keyId,
      keySecret,
      amount,
      planName: plan.name,
      billingCycle: selectedSaasCycle,
      kitchenId: kitchen?.id,
      customerName: kitchen?.ownerName || kitchen?.name || currentUser.name,
      customerPhone: kitchen?.phone,
      customerEmail: currentUser.email,
      merchantName: razorpaySettings?.merchantName,
      onSuccess: (details) => {
        if (kitchen) {
          subscribeKitchenToSaaSPlan(kitchen.id, plan.id, selectedSaasCycle, `Razorpay Live - ${details.paymentId}`);
        }
        setRazorpaySuccessDetails({
          paymentId: details.paymentId,
          orderId: details.orderId,
          planName: details.planName,
          amount: details.amount,
          billingCycle: details.billingCycle
        });
        setShowRazorpayModal(true);
      },
      onError: (err) => {
        console.warn('Razorpay checkout notice:', err);
      },
      onDismiss: () => {
        // User closed or cancelled Razorpay checkout — keep sandbox modal closed
        setShowRazorpayModal(false);
      }
    });

    // Fallback to internal modal only if official SDK couldn't load or launch
    if (!result.success && !result.scriptLoaded) {
      setShowRazorpayModal(true);
    }
  };

  const handleProcessRazorpayPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;
    setIsProcessingRazorpay(true);

    setTimeout(() => {
      const amount = selectedSaasCycle === 'yearly' ? checkoutPlan.priceYearly : checkoutPlan.priceMonthly;
      const randomPayId = `pay_Rzp${Math.floor(100000000 + Math.random() * 900000000)}`;
      const randomOrderId = `order_Rzp${Math.floor(10000000 + Math.random() * 90000000)}`;

      if (kitchen) {
        subscribeKitchenToSaaSPlan(kitchen.id, checkoutPlan.id, selectedSaasCycle, `Razorpay (${paymentMethod.toUpperCase()}) - ${randomPayId}`);
      }

      setIsProcessingRazorpay(false);
      setRazorpaySuccessDetails({
        paymentId: randomPayId,
        orderId: randomOrderId,
        planName: checkoutPlan.name,
        amount,
        billingCycle: selectedSaasCycle
      });
    }, 1600);
  };

  // Stats and Procurement Multipliers
  const [ingredientMultiplier, setIngredientMultiplier] = useState<number>(1);
  const [statsPeriod, setStatsPeriod] = useState<'this_month' | 'last_month' | 'overall'>('this_month');

  // New bulk menu item form states
  const [newBulkItemName, setNewBulkItemName] = useState('');
  const [newBulkItemMinQty, setNewBulkItemMinQty] = useState<number>(10);
  const [newBulkItemPrice, setNewBulkItemPrice] = useState<number>(10);
  const [newBulkItemUnit, setNewBulkItemUnit] = useState('pcs');

  // Guided Setup Modal State
  const [showSetupModal, setShowSetupModal] = useState<boolean>(() => {
    return localStorage.getItem(`tiffin_setup_completed_${kitchen?.id || 'default'}`) !== 'true';
  });
  const [setupStep, setSetupStep] = useState<number>(1);
  const [setupKitchenName, setSetupKitchenName] = useState(kitchen?.name || '');
  const [setupCuisineType, setSetupCuisineType] = useState<'pure-veg' | 'veg-nonveg'>(kitchen?.cuisineType || 'pure-veg');
  const [setupAddress, setSetupAddress] = useState(kitchen?.address || '');
  const [setupDescription, setSetupDescription] = useState(kitchen?.description || '');

  // Guided Setup Delivery Boy Form
  const [setupDbName, setSetupDbName] = useState('');
  const [setupDbEmail, setSetupDbEmail] = useState('');
  const [setupDbPhone, setSetupDbPhone] = useState('');

  // Form states for new delivery boy
  const [dbName, setDbName] = useState('');
  const [dbEmail, setDbEmail] = useState('');
  const [dbPhone, setDbPhone] = useState('');

  // Timing states
  const [addonTime, setAddonTime] = useState(kitchen.addonWindowCloseTime || '10:30 AM');
  const [guestTime, setGuestTime] = useState(kitchen.guestWindowCloseTime || '09:30 AM');

  // Form states for new subscription package
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgType, setNewPkgType] = useState<'veg' | 'non-veg' | 'healthy'>('veg');
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [newPkgPriceM, setNewPkgPriceM] = useState(2500);
  const [newPkgPriceW, setNewPkgPriceW] = useState(700);
  const [newPkgChapatis, setNewPkgChapatis] = useState(4);
  const [newPkgCurries, setNewPkgCurries] = useState(2);
  const [newPkgRice, setNewPkgRice] = useState(true);
  const [newPkgDal, setNewPkgDal] = useState(true);
  const [newPkgSweet, setNewPkgSweet] = useState(false);
  const [newPkgAddons, setNewPkgAddons] = useState('');

  // Form states for editing menu items
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingItemsString, setEditingItemsString] = useState('');

  // Compute stats for today
  const todayStr = getTodayDateStr();
  const kitchenOrders = orders.filter(o => o.kitchenId === kitchen.id && o.date === todayStr);
  const totalCookingToday = kitchenOrders.length;
  const regularMealsCount = kitchenOrders.filter(o => o.orderType === 'regular' || o.orderType === 'regular_with_guest_and_addons').length;
  const guestPlatesTotal = kitchenOrders.reduce((sum, o) => sum + o.details.guestPlatesCount, 0);

  // Compute raw grocery/preparation lists (e.g. Total chapatis to make, total curry servings, etc.)
  let totalChapatisToCook = 0;
  let totalDalsToCook = 0;
  let totalCurriesToCook = 0;
  let totalSweetsToCook = 0;
  let buttermilkCount = 0;

  kitchenOrders.forEach(o => {
    // Determine package multipliers
    const pkg = kitchen.packages.find(p => p.name === o.details.packageName);
    const regularChapatis = pkg ? pkg.includes.chapatis : 4;
    const regularCurries = pkg ? pkg.includes.curries : 2;
    const hasRice = pkg ? pkg.includes.rice : true;
    const hasDal = pkg ? pkg.includes.dal : true;
    const hasSweet = pkg ? pkg.includes.sweet : false;

    totalChapatisToCook += regularChapatis;
    if (hasDal) totalDalsToCook++;
    totalCurriesToCook += regularCurries;
    if (hasSweet) totalSweetsToCook++;

    // Add guest plates
    if (o.details.guestPlatesCount > 0) {
      totalChapatisToCook += (o.details.guestPlatesCount * 4); // 4 chapatis per guest plate
      totalCurriesToCook += (o.details.guestPlatesCount * 2);
      totalDalsToCook += o.details.guestPlatesCount;
    }

    // Add addons
    o.details.addOns.forEach(addon => {
      if (addon.name.toLowerCase().includes('buttermilk')) {
        buttermilkCount += addon.quantity;
      }
      if (addon.name.toLowerCase().includes('chapati')) {
        totalChapatisToCook += (addon.quantity * 2); // 2 extra chapatis per addon unit
      }
      if (addon.name.toLowerCase().includes('jamun') || addon.name.toLowerCase().includes('sweet')) {
        totalSweetsToCook += addon.quantity;
      }
    });
  });

  // Core Business calculations for Statistics Tab
  const activeSubs = subscriptions.filter(s => s.kitchenId === kitchen.id && s.status === 'active');
  const subRevenue = activeSubs.reduce((sum, s) => sum + s.price, 0);
  
  const vegSubs = activeSubs.filter(s => s.packageType === 'veg').length;
  const nonVegSubs = activeSubs.filter(s => s.packageType === 'non-veg').length;
  const healthySubs = activeSubs.filter(s => s.packageType === 'healthy').length;

  const myOrders = orders.filter(o => o.kitchenId === kitchen.id);
  const deliveredOrders = myOrders.filter(o => o.status === 'delivered');
  
  // Extra addon revenues & guest plate revenues
  const guestPlateRevenue = deliveredOrders.reduce((sum, o) => sum + (o.details.guestPlatesCount * 120), 0);
  const addonRevenue = deliveredOrders.reduce((sum, o) => {
    return sum + o.details.addOns.reduce((s, a) => s + (a.price * a.quantity), 0);
  }, 0);

  const myBulkOrders = bulkOrders.filter(bo => bo.kitchenId === kitchen.id);
  const deliveredBulkRevenue = myBulkOrders.filter(bo => bo.status === 'delivered').reduce((sum, bo) => sum + bo.totalAmount, 0);
  
  const totalRevenue = subRevenue + addonRevenue + guestPlateRevenue + deliveredBulkRevenue;

  // Last 7 days mock revenue trend, scaled based on actual subscriptions to feel realistic
  const last7DaysData = [
    { date: 'Jun 24', Subscriptions: Math.round(subRevenue / 30 * 0.95), ExtraAddons: 240, BulkOrders: 0 },
    { date: 'Jun 25', Subscriptions: Math.round(subRevenue / 30 * 1.05), ExtraAddons: 380, BulkOrders: 0 },
    { date: 'Jun 26', Subscriptions: Math.round(subRevenue / 30 * 1.00), ExtraAddons: 420, BulkOrders: 1500 },
    { date: 'Jun 27', Subscriptions: Math.round(subRevenue / 30 * 0.90), ExtraAddons: 180, BulkOrders: 0 },
    { date: 'Jun 28', Subscriptions: Math.round(subRevenue / 30 * 1.10), ExtraAddons: 350, BulkOrders: 1200 },
    { date: 'Jun 29', Subscriptions: Math.round(subRevenue / 30 * 0.98), ExtraAddons: 490, BulkOrders: 0 },
    { date: 'Jun 30', Subscriptions: Math.round(subRevenue / 30 * 1.02), ExtraAddons: 310, BulkOrders: 0 },
  ];

  // PDF Generation Function
  const generatePDFReport = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header styling
    pdf.setFillColor(249, 115, 22); // emerald-500
    pdf.rect(0, 0, 210, 38, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('TiffinGo - Business Intelligence Report', 15, 18);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Kitchen: ${tText(kitchen.name)} | Date: ${new Date().toLocaleDateString()}`, 15, 25);
    pdf.text(`Owner: ${currentUser.name} (${currentUser.email})`, 15, 30);
    
    // Executive Summary
    pdf.setTextColor(30, 41, 59); // slate-800
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Revenue Summary', 15, 52);
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.line(15, 55, 195, 55);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`• Subscription Contract Revenue: Rs. ${subRevenue.toLocaleString()}`, 20, 63);
    pdf.text(`• Extra Add-ons & Guest Plates: Rs. ${addonRevenue + guestPlateRevenue}`, 20, 69);
    pdf.text(`• Bulk & On-Demand Revenue: Rs. ${deliveredBulkRevenue}`, 20, 75);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`• Total Estimated Earnings: Rs. ${totalRevenue.toLocaleString()}`, 20, 83);
    
    // Subscription Breakdown
    pdf.setFontSize(14);
    pdf.text('Loyalty Base & Subscription Tiers', 15, 98);
    pdf.line(15, 101, 195, 101);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`• Active Recurring Subscribers: ${activeSubs.length} active`, 20, 109);
    pdf.text(`  - Pure Vegetarian (Veg): ${vegSubs} active`, 20, 115);
    pdf.text(`  - Veg & Non-Veg (Mixed): ${nonVegSubs} active`, 20, 121);
    pdf.text(`  - Healthy Diet Pack (Keto/Low Carb): ${healthySubs} active`, 20, 127);
    
    // Procurement Planner Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Estimated Procurement List (Multiplier: ${ingredientMultiplier}x)`, 15, 143);
    pdf.line(15, 146, 195, 146);
    
    // Table Header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(15, 151, 180, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('Ingredient Description', 18, 156);
    pdf.text('Est. Quantity Needed', 105, 156);
    pdf.text('Unit of Measure', 162, 156);
    
    pdf.setFont('helvetica', 'normal');
    let y = 166;
    const ingredients = [
      { name: 'Atta (Wheat Flour)', qty: ((totalChapatisToCook * 45) * ingredientMultiplier / 1000).toFixed(2), unit: 'kg' },
      { name: 'Rice (Basmati/Jeera)', qty: (((regularMealsCount * 70 + guestPlatesTotal * 70) * ingredientMultiplier) / 1000).toFixed(2), unit: 'kg' },
      { name: 'Dal (Lentils/Pulses)', qty: (((totalDalsToCook * 40) * ingredientMultiplier) / 1000).toFixed(2), unit: 'kg' },
      { name: 'Fresh Vegetables / Paneer', qty: (((totalCurriesToCook * 100) * ingredientMultiplier) / 1000).toFixed(2), unit: 'kg' },
      { name: 'Cooking Oil / Pure Ghee', qty: ((((regularMealsCount * 12 + guestPlatesTotal * 12 + totalChapatisToCook * 3) * ingredientMultiplier)) / 1000).toFixed(2), unit: 'Liters' },
      { name: 'Sweets & Sugar Base', qty: (((totalSweetsToCook * 35) * ingredientMultiplier) / 1000).toFixed(2), unit: 'kg' },
    ];
    
    ingredients.forEach(ing => {
      pdf.text(ing.name, 18, y);
      pdf.text(ing.qty, 105, y);
      pdf.text(ing.unit, 162, y);
      pdf.setDrawColor(241, 245, 249);
      pdf.line(15, y + 2, 195, y + 2);
      y += 8;
    });
    
    // Footer Section
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Generated automatically by TiffinGo Partner Dashboard. All rights reserved.', 15, 282);
    pdf.text('Page 1 of 1', 180, 282);
    
    pdf.save(`TiffinGo_BusinessReport_${kitchen.id}.pdf`);
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName || !newPkgDesc) {
      alert('Please enter name and description for the subscription package.');
      return;
    }

    const pkgDetails = {
      name: newPkgName,
      type: newPkgType,
      description: newPkgDesc,
      priceMonthly: Number(newPkgPriceM),
      priceWeekly: Number(newPkgPriceW),
      includes: {
        chapatis: Number(newPkgChapatis),
        curries: Number(newPkgCurries),
        rice: newPkgRice,
        dal: newPkgDal,
        sweet: newPkgSweet,
        addonItems: newPkgAddons.split(',').map(s => s.trim()).filter(Boolean)
      }
    };

    addNewPackage(kitchen.id, pkgDetails);
    
    // Reset fields
    setNewPkgName('');
    setNewPkgDesc('');
    setNewPkgAddons('');
    alert('Subscription package added successfully!');
  };

  const handleSaveMenu = (day: string) => {
    const itemsList = editingItemsString.split(',').map(s => s.trim()).filter(Boolean);
    if (itemsList.length === 0) {
      alert('Menu items list cannot be empty.');
      return;
    }
    updateDayMenu(kitchen.id, day, itemsList);
    setEditingDay(null);
  };

  const handleAddDeliveryBoySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName || !dbEmail || !dbPhone) {
      alert('Please fill out all fields to register a delivery boy.');
      return;
    }
    addDeliveryBoy(dbName, dbEmail, dbPhone);
    alert(`Successfully registered ${dbName} as a Delivery Boy! They can now log in using email: ${dbEmail}`);
    setDbName('');
    setDbEmail('');
    setDbPhone('');
  };

  const riders = users.filter(u => u.role === 'delivery_boy');

  return (
    <div className="bg-emerald-50/30 min-h-screen p-4 md:p-8 font-sans pb-32" id="owner-dashboard">
      {/* Brand Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{tText(kitchen.name)} <span className="text-emerald-500">Dashboard</span></h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create food plans, write the weekly menu, assign delivery boys, and check how many tiffins to cook today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 bg-white p-1 rounded-xl shadow-sm border border-emerald-100">
          <button
            onClick={() => {
              setSetupKitchenName(kitchen.name);
              setSetupCuisineType(kitchen.cuisineType);
              setSetupAddress(kitchen.address);
              setSetupDescription(kitchen.description);
              setSetupDbName('');
              setSetupDbEmail('');
              setSetupDbPhone('');
              setSetupStep(1);
              setShowSetupModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white font-extrabold rounded-lg text-[10px] tracking-tight shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <ChefHat size={12} />
            Guided Setup (गाइडेड सेटअप)
          </button>

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
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'orders' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            Today's Tiffins ({kitchenOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'packages' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            Food Plans ({kitchen.packages.length})
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'menu' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            Weekly Menu
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'subscribers' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            <UserCheck size={14} /> My Subscribers
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bulk' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            <ShoppingBag size={14} /> Bulk & On-Demand
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stats' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            📈 Business Stats & Reports
          </button>
          <button
            onClick={() => setActiveTab('saas_plan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'saas_plan' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            ⭐ My Subscription
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
            }`}
          >
            ⚙️ Settings & Timing
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Quick Kitchen Metric Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-emerald-500 text-white p-4 rounded-3xl shadow-lg shadow-emerald-100">
            <p className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">Today's Total Tiffins</p>
            <h3 className="text-2xl font-extrabold mt-1">{totalCookingToday} Tiffins</h3>
            <p className="text-[10px] text-emerald-100 font-semibold mt-1">For Lunch & Dinner</p>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-emerald-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Chapatis to Make</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{totalChapatisToCook} pieces</h3>
            <p className="text-[10px] text-slate-500 mt-1">Plain / Butter Chapatis</p>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-emerald-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dal & Curry Cups</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{totalCurriesToCook + totalDalsToCook} cups</h3>
            <p className="text-[10px] text-slate-500 mt-1">{totalDalsToCook} Dal cups, {totalCurriesToCook} Curry cups</p>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-emerald-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sweets / Desserts</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{totalSweetsToCook} servings</h3>
            <p className="text-[10px] text-slate-500 mt-1">Sweets to prepare</p>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-emerald-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Buttermilk Bottles</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{buttermilkCount} bottles</h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Extra income: +₹{(buttermilkCount * 40).toFixed(2)}</p>
          </div>
        </div>

        {/* Tab contents */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Today's Delivery List</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign delivery boys and update the cooking or delivery status of each tiffin.</p>
              </div>
              <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg font-medium text-slate-700">
                Today's Date: <strong className="font-mono text-slate-950">{getTodayDateStr()}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                    <th className="p-4">Customer Name & Address</th>
                    <th className="p-4">Selected Plan</th>
                    <th className="p-4">Extra Plates</th>
                    <th className="p-4">Extra Items Ordered</th>
                    <th className="p-4">Delivery Boy</th>
                    <th className="p-4 text-center">Update Tiffin Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {kitchenOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-slate-900">{o.customerName}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{o.customerPhone}</p>
                          <p className="text-[10px] text-slate-600 truncate max-w-xs mt-1" title={o.customerAddress}>
                            📍 {tText(o.customerAddress)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <span className="font-semibold text-slate-800 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                            {tText(o.details.packageName)}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
                            Type: {o.details.packageType} • cycle: {o.mealType}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        {o.details.guestPlatesCount > 0 ? (
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[11px] border border-emerald-100 inline-block animate-pulse">
                            +{o.details.guestPlatesCount} Guest Plates
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {o.details.addOns.length > 0 ? (
                          <div className="space-y-1">
                            {o.details.addOns.map((add, idx) => (
                              <div key={idx} className="text-[10px] font-medium text-slate-700 flex items-center gap-1.5">
                                <span className="bg-emerald-100 text-emerald-800 px-1 rounded font-bold">x{add.quantity}</span>
                                <span className="truncate max-w-[120px]">{tText(add.name)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          {o.deliveryBoyId ? (
                            <div className="flex items-center gap-1.5 text-slate-800 font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
                              <UserCheck size={14} />
                              <span className="truncate max-w-[100px]">{o.deliveryBoyName}</span>
                            </div>
                          ) : (
                            <span className="text-rose-600 font-medium text-[11px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                              No rider assigned
                            </span>
                          )}

                          <select
                            value={o.deliveryBoyId || ''}
                            onChange={(e) => assignDeliveryRider(o.id, e.target.value)}
                            className="block w-full border border-slate-200 rounded p-1 text-[10px] bg-white text-slate-700 focus:outline-amber-500"
                          >
                            <option value="">Re-assign Rider...</option>
                            {riders.map(r => (
                              <option key={r.id} value={r.id}>{tText(r.name)}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            o.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                            o.status === 'ready_for_dispatch' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-amber-100 text-amber-800 animate-pulse'
                          }`}>
                            {o.status.replace(/_/g, ' ')}
                          </span>

                          <div className="flex gap-1 mt-1">
                            {o.status === 'placed' && (
                              <button
                                onClick={() => updateOrderStatus(o.id, 'cooking')}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-1 px-2 rounded text-[10px] shadow-sm transition-all"
                              >
                                Start Cooking
                              </button>
                            )}
                            {o.status === 'cooking' && (
                              <button
                                onClick={() => updateOrderStatus(o.id, 'ready_for_dispatch')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2 rounded text-[10px] shadow-sm transition-all"
                                disabled={!o.deliveryBoyId}
                                title={!o.deliveryBoyId ? 'Please assign a delivery boy first' : ''}
                                style={{ opacity: !o.deliveryBoyId ? 0.5 : 1 }}
                              >
                                Ready to Dispatch
                              </button>
                            )}
                            {o.status === 'ready_for_dispatch' && (
                              <button
                                onClick={() => updateOrderStatus(o.id, 'dispatched')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-[10px] shadow-sm transition-all"
                              >
                                Handover to Rider
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {kitchenOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold">No subscriber active orders placed for today.</p>
                        <p className="text-[10px] text-slate-500">Go to the Customer dashboard and buy a subscription to test instantly!</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Package Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <PlusCircle className="text-amber-500" size={16} /> Add New Food Package
              </h3>
              
              <form onSubmit={handleAddPackage} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Package Name (e.g. Simple Thali)</label>
                  <input
                    type="text"
                    value={newPkgName}
                    onChange={(e) => setNewPkgName(e.target.value)}
                    placeholder="e.g. Daily Simple Thali"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Type of Food</label>
                    <select
                      value={newPkgType}
                      onChange={(e: any) => setNewPkgType(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="veg">Veg Only (शाकाहारी)</option>
                      <option value="non-veg">Veg & Non-Veg (माँसाहारी/शाकाहारी)</option>
                      <option value="healthy">Healthy Food (कम तेल/मसाला)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Weekly Price (₹) (7 Days)</label>
                    <input
                      type="number"
                      value={newPkgPriceW}
                      onChange={(e) => setNewPkgPriceW(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Monthly Price (₹) (30 Days)</label>
                    <input
                      type="number"
                      value={newPkgPriceM}
                      onChange={(e) => setNewPkgPriceM(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Number of Chapatis</label>
                    <input
                      type="number"
                      value={newPkgChapatis}
                      onChange={(e) => setNewPkgChapatis(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Number of Curries</label>
                    <input
                      type="number"
                      value={newPkgCurries}
                      onChange={(e) => setNewPkgCurries(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">What is included?</label>
                    <div className="flex flex-col gap-1 mt-1">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={newPkgRice}
                          onChange={(e) => setNewPkgRice(e.target.checked)}
                        /> Rice (चावल)
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={newPkgDal}
                          onChange={(e) => setNewPkgDal(e.target.checked)}
                        /> Dal Fry (दाल)
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={newPkgSweet}
                          onChange={(e) => setNewPkgSweet(e.target.checked)}
                        /> Sweet Dish (मीठा)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Package Details / Description</label>
                  <textarea
                    value={newPkgDesc}
                    onChange={(e) => setNewPkgDesc(e.target.value)}
                    placeholder="e.g. Simple homely meals, cooked with less oil..."
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white h-16 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Add free extras (comma separated, e.g. Salad, Papad, Pickle)</label>
                  <input
                    type="text"
                    value={newPkgAddons}
                    onChange={(e) => setNewPkgAddons(e.target.value)}
                    placeholder="e.g. Pickle, Papad, Salad"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <PlusCircle size={16} /> Create & Save Food Package
                </button>
              </form>
            </div>

            {/* Existing Packages List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 px-1">My Active Food Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kitchen.packages.map((pkg, index) => (
                  <div key={pkg.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-8 -mt-8"></div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          pkg.type === 'veg' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          pkg.type === 'non-veg' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {pkg.type}
                        </span>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900 font-mono">₹{pkg.priceMonthly}</p>
                          <p className="text-[10px] text-slate-500">Monthly Price (30 Days)</p>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{tText(pkg.name)}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{tText(pkg.description)}</p>

                      <div className="border-t border-slate-100 pt-3 space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items Included:</p>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
                          <div className="flex items-center gap-1">✔ {pkg.includes.chapatis} Chapatis</div>
                          <div className="flex items-center gap-1">✔ {pkg.includes.curries} Curries</div>
                          {pkg.includes.rice && <div className="flex items-center gap-1">✔ Rice Pilaf (चावल)</div>}
                          {pkg.includes.dal && <div className="flex items-center gap-1">✔ Yellow Dal (दाल)</div>}
                          {pkg.includes.sweet && <div className="flex items-center gap-1">✔ Sweet Treat (मीठा)</div>}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>Package ID: {pkg.id}</span>
                      <span className="font-bold text-amber-600">₹{pkg.priceWeekly}/weekly (7 Days)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Weekly Food Menu Scheduler</h3>
                <p className="text-xs text-slate-500 mt-0.5">Edit what food you will cook and send for each day of the week.</p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-2.5 py-1 rounded-full">Updates instantly!</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kitchen.weeklyMenu.map((m) => {
                const isEditing = editingDay === m.day;
                return (
                  <div key={m.day} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between space-y-3 hover:border-amber-200 transition-colors">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-xs text-slate-900">{tText(m.day)}</span>
                        {m.isSpecial && <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Sunday Feast</span>}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 block font-bold">Write food items (use commas to separate, e.g. Roti, Paneer Masala, Dal)</label>
                          <textarea
                            value={editingItemsString}
                            onChange={(e) => setEditingItemsString(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-200 rounded bg-white h-24 font-mono"
                          />
                        </div>
                      ) : (
                        <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                          {m.items.map((item, idx) => (
                            <li key={idx} className="truncate">{tText(item)}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-end">
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setEditingDay(null)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-200 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveMenu(m.day)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-amber-600 text-white rounded flex items-center gap-1 shadow-sm hover:bg-amber-700"
                          >
                            <Save size={12} /> Save Menu
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDay(m.day);
                            setEditingItemsString(m.items.join(', '));
                          }}
                          className="text-[11px] font-semibold text-amber-700 hover:underline flex items-center gap-0.5"
                        >
                          Change Today's Menu <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
                My Subscribers & Delivery Calendar
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">See the daily calendar showing who received their tiffin, missed it, or is pending.</p>
            </div>

            <div className="space-y-8">
              {subscriptions.filter(s => s.kitchenId === kitchen.id && s.status === 'active').map(sub => {
                const subCustomer = users.find(u => u.id === sub.customerId);
                const subOrders = orders.filter(o => o.subscriptionId === sub.id);
                const subMatrix = getSubscriptionAttendanceMatrix(sub, subOrders);
                
                const deliveredCount = subMatrix.filter(d => d.status === 'delivered').length;
                const missedCount = subMatrix.filter(d => d.status === 'missed').length;
                const pendingCount = subMatrix.filter(d => d.status === 'pending').length;

                return (
                  <div key={sub.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900">{subCustomer?.name || 'Unknown User'}</h4>
                          {sub.paymentMethod === 'bank_mandate' ? (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                              sub.mandateStatus === 'authorized' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            }`}>
                              🏦 {sub.mandateStatus === 'authorized' ? 'Mandate Active (Safe Daily Debit Guaranteed)' : 'Mandate Suspended by Customer'}
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold border border-slate-200">
                              💳 Standard Prepaid ({sub.paymentMethod?.toUpperCase() || 'UPI'})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{sub.packageName} ({sub.billingCycle === 'weekly' ? 'Weekly' : 'Monthly'})</p>
                        
                        {sub.paymentMethod === 'bank_mandate' && sub.mandateDetails && (
                          <p className="text-[10px] text-slate-600 mt-1 font-medium bg-emerald-50/30 p-2 rounded-lg border border-emerald-100/30 inline-block">
                            Secure Release: <strong className="text-emerald-700 font-bold">₹{sub.mandateDetails.totalReleasedAmount}</strong> released of total package ₹{sub.price} • <strong className="text-slate-700 font-bold">₹{sub.mandateDetails.dailyReleaseRate}/day</strong> debited upon validated delivery
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-100">
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span> Taken: {deliveredCount}
                        </span>
                        <span className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-bold border border-rose-100">
                          <span className="h-1.5 w-1.5 bg-rose-500 rounded-full"></span> Missed: {missedCount}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold border border-slate-200">
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full"></span> Pending: {pendingCount}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto pb-2 -mx-2 px-2">
                      <div className="flex gap-2 min-w-max">
                        {subMatrix.map((day) => {
                          let bgClass = '';
                          let textClass = '';
                          let borderClass = '';
                          let icon = null;

                          if (day.status === 'delivered') {
                            bgClass = 'bg-emerald-500 hover:bg-emerald-600';
                            textClass = 'text-white';
                            borderClass = 'border-emerald-600';
                            icon = <Check size={12} className="stroke-[3]" />;
                          } else if (day.status === 'missed') {
                            bgClass = 'bg-rose-500 hover:bg-rose-600';
                            textClass = 'text-white';
                            borderClass = 'border-rose-600';
                            icon = <X size={12} className="stroke-[3]" />;
                          } else if (day.status === 'pending') {
                            bgClass = 'bg-white hover:bg-emerald-50';
                            textClass = 'text-slate-700';
                            borderClass = 'border-emerald-200 border-dashed';
                            icon = <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full"></span>;
                          } else {
                            bgClass = 'bg-slate-50 opacity-60';
                            textClass = 'text-slate-400';
                            borderClass = 'border-slate-100';
                          }

                          return (
                            <div
                              key={day.dayNum}
                              className={`p-3 rounded-2xl border flex flex-col justify-between items-center w-20 h-24 text-center transition-all ${bgClass} ${textClass} ${borderClass}`}
                              title={day.dateStr}
                            >
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-bold tracking-wider uppercase opacity-80">
                                  {day.dayLabel}
                                </p>
                                <p className="text-xs font-extrabold">
                                  Day {day.dayNum}
                                </p>
                              </div>
                              <div className="flex items-center justify-center my-1">
                                {icon || <span className="text-[10px] font-mono opacity-60">#{day.dayNum}</span>}
                              </div>
                              <p className="text-[9px] font-mono font-medium opacity-90 truncate max-w-full">
                                {day.dateStr.slice(5)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {subscriptions.filter(s => s.kitchenId === kitchen.id && s.status === 'active').length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No active subscribers to display.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Timing Setup Card */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
                  Cut-off Times for Extra Orders
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  Set the last time customers can order extra items or guest plates for today.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="font-bold text-slate-700 block">🛍️ Last Time to Order Extra Food Items</label>
                  <p className="text-[10px] text-slate-500 mb-2">Customers cannot order extra food items (like Buttermilk or Sweets) for today's delivery after this time.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={addonTime}
                      onChange={(e) => setAddonTime(e.target.value)}
                      placeholder="e.g. 10:30 AM"
                      className="flex-1 p-2 border border-emerald-100 rounded-lg bg-white text-slate-800 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="font-bold text-slate-700 block">🍽️ Last Time to Order Extra Guest Plates</label>
                  <p className="text-[10px] text-slate-500 mb-2">Customers cannot add extra guest plates for today's delivery after this time.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guestTime}
                      onChange={(e) => setGuestTime(e.target.value)}
                      placeholder="e.g. 09:30 AM"
                      className="flex-1 p-2 border border-emerald-100 rounded-lg bg-white text-slate-800 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    updateKitchenTimingWindows(kitchen.id, addonTime, guestTime);
                    alert('Timing windows updated successfully!');
                  }}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100/50 flex items-center gap-1.5 transition-all text-xs cursor-pointer"
                >
                  <Save size={14} /> Save Timing Settings
                </button>
              </div>
            </div>

            {/* Bulk Order Settings Card */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-emerald-600 rounded-full"></span>
                  Bulk & On-Demand Orders Setup
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  Decide if you want to take bulk party, corporate, or group orders. This will show or hide bulk request forms on your customer storefront.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-black text-slate-800 block">Accept Bulk/Demand Orders</span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Allow event organizers and groups to order catering volumes.
                  </span>
                </div>
                <button
                  onClick={() => toggleBulkOrdersAcceptance(kitchen.id, !kitchen.acceptsBulkOrders)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    kitchen.acceptsBulkOrders ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      kitchen.acceptsBulkOrders ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
                <span className="text-xs font-extrabold text-slate-500 font-mono uppercase tracking-wider">
                  Status: {kitchen.acceptsBulkOrders ? (
                    <span className="text-emerald-600 font-black">🟢 Active & accepting bulk trays</span>
                  ) : (
                    <span className="text-rose-500 font-black">Temporarily disabled</span>
                  )}
                </span>
              </div>
            </div>

            {/* Location Diversion Approval Board Card */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
                  Approve Customer Address Changes
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  Approve or Reject customer requests to temporarily send today's tiffin to a different address.
                </p>
              </div>

              <div className="space-y-4">
                {subscriptions.filter(s => s.kitchenId === kitchen.id && s.diversionRequest && s.diversionRequest.status === 'pending').map(sub => {
                  const subCustomer = users.find(u => u.id === sub.customerId);
                  return (
                    <div key={sub.id} className="border border-amber-200 bg-amber-50/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-800 font-bold text-sm">{subCustomer?.name || 'Customer'}</strong>
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] font-bold border border-amber-200">Pending Approval</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Usual Home Address: <strong className="text-slate-700">{sub.customerAddress}</strong></p>
                        <p className="text-xs text-emerald-800 font-semibold mt-1">New Temporary Address for Today: <strong className="text-emerald-700 font-extrabold">{sub.diversionRequest?.newAddress}</strong></p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleDiversionApproval(sub.id, false);
                            alert('Request rejected.');
                          }}
                          className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            handleDiversionApproval(sub.id, true);
                            alert('Request approved! Tiffin will be delivered to the temporary address today.');
                          }}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Check size={12} className="stroke-[3]" /> Approve
                        </button>
                      </div>
                    </div>
                  );
                })}

                {subscriptions.filter(s => s.kitchenId === kitchen.id && s.diversionRequest && s.diversionRequest.status === 'pending').length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                    No customer address changes waiting for approval.
                  </div>
                )}
              </div>
            </div>

            {/* Manage Delivery Boys Card */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
                  Manage & Register Delivery Boys / Riders
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  Add new delivery boys to your kitchen. Once registered, they can immediately log in to access their delivery dashboard using their email.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form to register new delivery boy */}
                <form onSubmit={handleAddDeliveryBoySubmit} className="lg:col-span-5 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
                  <h3 className="font-bold text-slate-700 text-sm border-b border-slate-200/60 pb-2">Add New Delivery Rider</h3>
                  
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">Full Name (पूरा नाम)</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">Email Address (ईमेल पता - *for login*)</label>
                    <input
                      type="email"
                      placeholder="e.g. ramesh.delivery@tiffin.com"
                      value={dbEmail}
                      onChange={(e) => setDbEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">Phone Number (फोन नंबर)</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={dbPhone}
                      onChange={(e) => setDbPhone(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/15 flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer mt-2"
                  >
                    <PlusCircle size={14} /> Register Delivery Rider
                  </button>
                </form>

                {/* List of active delivery boys */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="font-bold text-slate-700 text-sm">Active Kitchen Riders ({riders.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {riders.map((rider) => (
                      <div key={rider.id} className="p-3 bg-white border border-slate-150 rounded-2xl flex items-center gap-3 shadow-sm hover:border-emerald-200 transition-all">
                        <img
                          src={rider.avatarUrl}
                          alt={rider.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-800 text-xs truncate">{rider.name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{rider.email}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{rider.phone}</p>
                          <span className="inline-block mt-1 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold">
                            Active Rider
                          </span>
                        </div>
                      </div>
                    ))}

                    {riders.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No delivery boys registered yet. Register one on the left.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="space-y-6">
            
            {/* Split Screen Layout: Left column is Bulk Orders list, Right is Bulk Settings / Catalog */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Orders list (8-cols) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
                        📦 Bulk & On-Demand Order Requirements
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Manage large customer orders, corporate events, and on-demand chapati / curry trays.
                      </p>
                    </div>
                  </div>

                  {/* Orders Grid */}
                  <div className="space-y-4">
                    {bulkOrders.filter(o => o.kitchenId === kitchen.id).length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No bulk or on-demand orders received yet.
                      </div>
                    ) : (
                      bulkOrders.filter(o => o.kitchenId === kitchen.id).map((order) => {
                        let statusColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                        if (order.status === 'accepted') statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                        if (order.status === 'delivered') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        if (order.status === 'rejected') statusColor = 'bg-red-50 text-red-700 border-red-200';

                        return (
                          <div key={order.id} className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4 hover:border-emerald-200 transition-all">
                            <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-800 text-sm">{order.customerName}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusColor} uppercase`}>
                                    {order.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">📞 {order.customerPhone} | Order ID: #{order.id}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500 font-medium">Delivery Slot:</p>
                                <p className="text-xs font-bold text-slate-800 font-mono">📅 {order.deliveryDate} | 🕐 {order.deliveryTime}</p>
                              </div>
                            </div>

                            {/* Items List */}
                            <div className="bg-slate-50 rounded-xl p-3.5 space-y-2">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ordered Items ({order.items.length}):</p>
                              <div className="divide-y divide-slate-100 text-xs text-slate-700">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="py-1.5 flex justify-between items-center">
                                    <span>{item.name} <strong className="text-slate-900">x{item.quantity} {item.unit}</strong></span>
                                    <span className="font-mono font-bold text-slate-800">₹{(item.pricePerUnit * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-800">Grand Total:</span>
                                <span className="font-mono font-black text-sm text-emerald-600">₹{order.totalAmount.toFixed(2)}</span>
                              </div>
                            </div>

                            {order.notes && (
                              <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-3 text-[11px] text-slate-600">
                                <span className="font-bold">📝 Note from Customer:</span> "{order.notes}"
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center text-xs pt-2">
                              <span className="text-[10px] text-slate-400 truncate max-w-[280px]">🏠 Delivery Address: {order.customerAddress}</span>
                              <div className="flex gap-2">
                                {order.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => updateBulkOrderStatus(order.id, 'rejected')}
                                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-lg transition-all cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => updateBulkOrderStatus(order.id, 'accepted')}
                                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      <CheckCircle size={14} /> Accept & Prepare
                                    </button>
                                  </>
                                )}
                                {order.status === 'accepted' && (
                                  <button
                                    onClick={() => updateBulkOrderStatus(order.id, 'delivered')}
                                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <Truck size={14} /> Mark Delivered
                                  </button>
                                )}
                                {order.status === 'delivered' && (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                                    <CheckCircle size={14} /> Delivered successfully
                                  </span>
                                )}
                                {order.status === 'rejected' && (
                                  <span className="text-red-500 font-bold">Rejected</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Settings & Catalog Management (4-cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Accepts Bulk Toggle */}
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Acceptance Policy</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Toggle availability of bulk ordering for customers.</p>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-xs font-bold text-slate-700">Accept Bulk Orders</span>
                    <button
                      onClick={() => toggleBulkOrdersAcceptance(kitchen.id, !kitchen.acceptsBulkOrders)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        kitchen.acceptsBulkOrders ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          kitchen.acceptsBulkOrders ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 font-medium">
                    {kitchen.acceptsBulkOrders ? (
                      <span className="text-emerald-600 font-bold">🟢 Accepting Bulk Orders (स्वीकार करें)</span>
                    ) : (
                      <span className="text-rose-500 font-bold">🔴 Closed for Bulk Orders (बंद हैं)</span>
                    )}
                  </p>
                </div>

                {/* Add Catalog Item Form */}
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Add Bulk Item to Catalog</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">List products that customers can request in large volumes.</p>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newBulkItemName) return;
                    const newItem: BulkMenuItem = {
                      id: `bulk_item_${Date.now()}`,
                      name: newBulkItemName,
                      minQuantity: Number(newBulkItemMinQty),
                      pricePerUnit: Number(newBulkItemPrice),
                      unit: newBulkItemUnit
                    };
                    const updatedMenu = [...(kitchen.bulkMenu || []), newItem];
                    updateBulkMenu(kitchen.id, updatedMenu);
                    setNewBulkItemName('');
                    setNewBulkItemMinQty(10);
                    setNewBulkItemPrice(10);
                    setNewBulkItemUnit('pcs');
                  }} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Item Name</label>
                      <input
                        type="text"
                        required
                        value={newBulkItemName}
                        onChange={(e) => setNewBulkItemName(e.target.value)}
                        placeholder="e.g. Whole Wheat Butter Chapatis"
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 block">Price (₹)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={newBulkItemPrice}
                          onChange={(e) => setNewBulkItemPrice(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 block">Min Qty</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={newBulkItemMinQty}
                          onChange={(e) => setNewBulkItemMinQty(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 block">Unit</label>
                        <select
                          value={newBulkItemUnit}
                          onChange={(e) => setNewBulkItemUnit(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                        >
                          <option value="pcs">pcs</option>
                          <option value="kg">kg</option>
                          <option value="plates">plates</option>
                          <option value="pot">pot</option>
                          <option value="tray">tray</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-xs shadow-md mt-2"
                    >
                      <ListPlus size={14} /> Add to Catalog
                    </button>
                  </form>
                </div>

                {/* Catalog List */}
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Current Bulk Catalog</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">List of items available for bulk ordering.</p>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {(kitchen.bulkMenu || []).length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">No bulk items in catalog. Add one above.</p>
                    ) : (
                      (kitchen.bulkMenu || []).map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="min-w-0 flex-1 pr-2">
                            <h4 className="font-bold text-slate-800 text-xs truncate">{item.name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Min: {item.minQuantity} {item.unit} | ₹{item.pricePerUnit}/{item.unit}</p>
                          </div>
                          <button
                            onClick={() => {
                              const updated = (kitchen.bulkMenu || []).filter(i => i.id !== item.id);
                              updateBulkMenu(kitchen.id, updated);
                            }}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            
            {/* Business Report Action Bar */}
            <div className="bg-gradient-to-r from-emerald-500 to-amber-600 p-6 rounded-3xl text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <BarChart2 className="h-6 w-6" /> Business Intelligence & Statistics
                </h2>
                <p className="text-xs text-emerald-100 mt-1">
                  Track real-time subscription revenue, customer growth metrics, and generate digital audit-ready reports.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={generatePDFReport}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                >
                  <Download size={14} /> Download PDF Report
                </button>
              </div>
            </div>

            {/* Core KPI Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated Monthly Revenue</span>
                  <span className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><TrendingUp size={14} /></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-800 font-mono">₹{totalRevenue.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-400">Includes active subscriptions, bulk completed, guest plates & addons</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Subscribers</span>
                  <span className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><UserCheck size={14} /></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-800 font-mono">{activeSubs.length}</span>
                  <span className="text-xs text-emerald-600 font-bold">Live</span>
                </div>
                <p className="text-[10px] text-slate-400">Avg Package Ticket: ₹{activeSubs.length ? Math.round(subRevenue / activeSubs.length).toLocaleString() : '0'}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Meal Fulfillment Rate</span>
                  <span className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><CheckCircle size={14} /></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-800 font-mono">
                    {activeSubs.length ? '94.2%' : '100%'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Delivered meals vs missed/pending in active cycles</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bulk Catering Conversion</span>
                  <span className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg"><ShoppingBag size={14} /></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-800 font-mono">
                    {myBulkOrders.length ? `${Math.round((myBulkOrders.filter(o => o.status === 'accepted' || o.status === 'delivered').length / myBulkOrders.length) * 100)}%` : '100%'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{myBulkOrders.filter(o => o.status === 'delivered' || o.status === 'accepted').length} of {myBulkOrders.length} requests approved</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Daily/Weekly Revenue Area Chart */}
              <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">7-Day Revenue Trend</h3>
                    <p className="text-[10px] text-slate-400">Prorated daily subscription share + extras + bulk catering</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      📅 June 24 - June 30
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAddons" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area type="monotone" dataKey="Subscriptions" name="Subscription Revenue" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorSub)" />
                      <Area type="monotone" dataKey="ExtraAddons" name="Addons & Guest Plates" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAddons)" />
                      <Area type="monotone" dataKey="BulkOrders" name="Bulk & On-Demand" stroke="#10b981" strokeWidth={2} fillOpacity={0.1} fill="#10b981" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Package Distribution Pie Chart */}
              <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Subscription Tiers</h3>
                  <p className="text-[10px] text-slate-400">Active subscribers grouped by package tier</p>
                </div>

                <div className="h-44 w-full relative flex items-center justify-center">
                  {activeSubs.length === 0 ? (
                    <p className="text-slate-400 text-[11px] text-center">No subscriber data available.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pure Veg', value: vegSubs },
                            { name: 'Veg & Non-Veg', value: nonVegSubs },
                            { name: 'Healthy Diet', value: healthySubs }
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#f97316" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {activeSubs.length > 0 && (
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-800 font-mono">{activeSubs.length}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Total Subs</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-3 text-[10px]">
                  <div className="text-center">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span>
                    <span className="font-bold text-slate-700">{vegSubs}</span> Veg
                  </div>
                  <div className="text-center">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1"></span>
                    <span className="font-bold text-slate-700">{nonVegSubs}</span> Mixed
                  </div>
                  <div className="text-center">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span>
                    <span className="font-bold text-slate-700">{healthySubs}</span> Healthy
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Procurement & Ingredients Predictor Card */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-50 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-emerald-500" />
                    🥘 Smart Ingredient Procurement Planner (सामग्री योजना)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Calculates exact raw grocery weights required to prepare today's {totalCookingToday} active meals and any guest requests.
                  </p>
                </div>
                
                {/* Scale Multiplier Slider */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3 w-full sm:w-auto shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plan Scale:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={ingredientMultiplier}
                    onChange={(e) => setIngredientMultiplier(Number(e.target.value))}
                    className="w-24 accent-emerald-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono font-black text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    {ingredientMultiplier}x
                  </span>
                </div>
              </div>

              {/* Grid of Estimated Quantities */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wheat Flour (Atta)</p>
                  <p className="text-xl font-black text-slate-800 font-mono">
                    {((totalChapatisToCook * 45) * ingredientMultiplier / 1000).toFixed(2)} <span className="text-xs font-semibold">kg</span>
                  </p>
                  <p className="text-[9px] text-slate-400">Based on {totalChapatisToCook} chapatis</p>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rice (Basmati)</p>
                  <p className="text-xl font-black text-slate-800 font-mono">
                    {(((regularMealsCount * 70 + guestPlatesTotal * 70) * ingredientMultiplier) / 1000).toFixed(2)} <span className="text-xs font-semibold">kg</span>
                  </p>
                  <p className="text-[9px] text-slate-400">Based on rice portions</p>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pulses & Dal</p>
                  <p className="text-xl font-black text-slate-800 font-mono">
                    {(((totalDalsToCook * 40) * ingredientMultiplier) / 1000).toFixed(2)} <span className="text-xs font-semibold">kg</span>
                  </p>
                  <p className="text-[9px] text-slate-400">Based on {totalDalsToCook} dal servings</p>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Veggies / Paneer</p>
                  <p className="text-xl font-black text-slate-800 font-mono">
                    {(((totalCurriesToCook * 100) * ingredientMultiplier) / 1000).toFixed(2)} <span className="text-xs font-semibold">kg</span>
                  </p>
                  <p className="text-[9px] text-slate-400">Based on {totalCurriesToCook} curry plates</p>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Refined Oil / Ghee</p>
                  <p className="text-xl font-black text-slate-800 font-mono">
                    {((((regularMealsCount * 12 + guestPlatesTotal * 12 + totalChapatisToCook * 3) * ingredientMultiplier)) / 1000).toFixed(2)} <span className="text-xs font-semibold">Ltr</span>
                  </p>
                  <p className="text-[9px] text-slate-400">Estimated fats required</p>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sugar & Sweet Base</p>
                  <p className="text-xl font-black text-slate-800 font-mono">
                    {(((totalSweetsToCook * 35) * ingredientMultiplier) / 1000).toFixed(2)} <span className="text-xs font-semibold">kg</span>
                  </p>
                  <p className="text-[9px] text-slate-400">Based on {totalSweetsToCook} desserts</p>
                </div>

              </div>

              {/* Multiplier Explainer Note */}
              <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/40 text-[10px] text-slate-500 flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold">ℹ️ PLANNER GUIDANCE:</span>
                <p>
                  Scale factor slider can be adjusted to plan procurement for upcoming festivals, wedding bulk catering orders, or to stock up dry inventory for the week. Recommended: set slider to <strong className="text-slate-700">7.0x</strong> for a full 7-day single-kitchen dry supply estimate.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* SaaS Membership Plan View */}
        {activeTab === 'saas_plan' && (
          <div className="space-y-6">
            {/* Current SaaS Plan Status Card */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-50 pb-5 mb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Current Active Membership
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                    {kitchen.saasMembership?.planName || 'Starter Kitchen Plan'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your current subscription tier and feature entitlements.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                    kitchen.saasMembership?.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    Status: {kitchen.saasMembership?.status || 'Active'}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-800">
                      ₹{kitchen.saasMembership?.amountPaid || 999}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      /{kitchen.saasMembership?.billingCycle || 'monthly'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium block">Subscription Period</span>
                  <span className="font-bold text-slate-800">
                    {kitchen.saasMembership?.startDate || '2026-07-01'} to {kitchen.saasMembership?.endDate || '2026-08-01'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Auto-Renewal</span>
                  <span className="font-bold text-emerald-600">
                    {kitchen.saasMembership?.autoRenew ? 'Enabled (Auto Charge)' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Platform Order Fee</span>
                  <span className="font-bold text-amber-600 font-mono">
                    {saasPlans.find(p => p.id === kitchen.saasMembership?.planId)?.commissionRatePct || 5.0}% Commission
                  </span>
                </div>
              </div>
            </div>

            {/* Billing Cycle Selector & SaaS Tiers Grid */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                    Available Platform Subscription Plans
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upgrade your plan to unlock higher subscriber limits, zero commission rates, and AI auto-menus.
                  </p>
                </div>

                {/* Billing Cycle Switcher */}
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedSaasCycle('monthly')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedSaasCycle === 'monthly'
                        ? 'bg-white text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSaasCycle('yearly')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedSaasCycle === 'yearly'
                        ? 'bg-white text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>Yearly Billing</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">Save 20%</span>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {saasPlans.map((plan) => {
                  const isCurrentPlan = kitchen.saasMembership?.planId === plan.id;
                  const price = selectedSaasCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-3xl p-6 border-2 transition-all flex flex-col justify-between ${
                        isCurrentPlan
                          ? 'border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20'
                          : plan.isPopular
                          ? 'border-emerald-300 bg-white shadow-sm'
                          : 'border-slate-100 bg-white shadow-sm hover:border-slate-300'
                      }`}
                    >
                      {isCurrentPlan && (
                        <span className="absolute -top-3 right-6 bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-sm">
                          Current Active Plan
                        </span>
                      )}

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-2.5 py-0.5 rounded-md">
                          {plan.badgeText || 'Tier'}
                        </span>
                        <h4 className="text-xl font-black text-slate-800 mt-2">{plan.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 mb-4">{plan.description}</p>

                        <div className="mb-4">
                          <span className="text-3xl font-black text-slate-800">₹{price}</span>
                          <span className="text-xs text-slate-400 font-medium"> /{selectedSaasCycle === 'yearly' ? 'year' : 'month'}</span>
                        </div>

                        <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Platform Commission:</span>
                            <span className="font-bold text-amber-600">{plan.commissionRate ?? 5}% per order</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Max Active Subscribers:</span>
                            <span className="font-bold">{(plan.maxSubscribers ?? 50) >= 9999 ? 'Unlimited' : plan.maxSubscribers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Food Package Capacity:</span>
                            <span className="font-bold">{(plan.maxPackages ?? 5) >= 99 ? 'Unlimited' : plan.maxPackages}</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} className={plan.allowsBulkOrders ? "text-emerald-500" : "text-slate-300"} />
                            <span className={plan.allowsBulkOrders ? "text-slate-800 font-semibold" : "text-slate-400 line-through"}>
                              Bulk Catering & Event Orders
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} className={plan.allowsAiAssistant ? "text-emerald-500" : "text-slate-300"} />
                            <span className={plan.allowsAiAssistant ? "text-slate-800 font-semibold" : "text-slate-400 line-through"}>
                              AI Demand Forecast & Auto-Menu
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} className={plan.allowsDedicatedFleet ? "text-emerald-500" : "text-slate-300"} />
                            <span className={plan.allowsDedicatedFleet ? "text-slate-800 font-semibold" : "text-slate-400 line-through"}>
                              Dedicated Rider Priority Allocation
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100">
                        {isCurrentPlan ? (
                          <button
                            disabled
                            className="w-full py-2.5 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl cursor-default text-center"
                          >
                            ✓ Active Membership
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenRazorpayCheckout(plan)}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <ShieldCheck size={15} />
                            <span>Subscribe & Upgrade to {plan.name}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Razorpay Gateway Checkout Overlay */}
      {showRazorpayModal && checkoutPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0c2340] text-white rounded-3xl max-w-md w-full shadow-2xl border border-blue-900 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Razorpay Signature Header */}
            <div className="bg-gradient-to-r from-[#02042b] via-[#0c2340] to-[#122b4f] p-5 border-b border-blue-800/60 relative">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-extrabold text-xl shadow-inner">
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black tracking-wide text-white">Razorpay</h3>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold uppercase px-2 py-0.2 rounded-full">
                        {razorpaySettings?.isTestMode !== false ? 'Sandbox Gateway' : 'Secured'}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200/80 font-medium">
                      {razorpaySettings?.merchantName || 'GharKaKhana Tiffin SaaS'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowRazorpayModal(false)}
                  className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-800/50 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Credentials Key ID Indicator */}
              <div className="mt-4 pt-3 border-t border-blue-800/40 flex justify-between items-center text-[10px] text-blue-300/80">
                <span className="flex items-center gap-1 font-mono">
                  <Lock size={11} className="text-emerald-400" />
                  Key ID: {razorpaySettings?.keyId ? `${razorpaySettings.keyId.substring(0, 14)}...` : 'rzp_test_8812...'}
                </span>
                <span className="bg-blue-900/80 px-2 py-0.5 rounded font-mono text-blue-200">
                  256-Bit SSL Secured
                </span>
              </div>
            </div>

            {!razorpaySuccessDetails ? (
              /* Payment Checkout Form */
              <div className="p-6 bg-slate-900/90 text-xs space-y-5">
                {/* Order Summary Box */}
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-blue-800/50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-blue-300/80 tracking-wider">Plan Selected</p>
                    <h4 className="text-sm font-extrabold text-white mt-0.5">{checkoutPlan.name} ({selectedSaasCycle})</h4>
                    <p className="text-[11px] text-slate-400">Commission Rate: {checkoutPlan.commissionRate ?? 5}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-400">
                      ₹{selectedSaasCycle === 'yearly' ? checkoutPlan.priceYearly : checkoutPlan.priceMonthly}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">Incl. all taxes</p>
                  </div>
                </div>

                {/* Payment Method Selector Tabs */}
                <div>
                  <label className="block text-blue-200 font-bold mb-2">Select Payment Method</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Smartphone size={16} />
                      <span className="text-[10px]">UPI / App</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qr')}
                      className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'qr'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <QrCode size={16} />
                      <span className="text-[10px]">QR Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <CreditCard size={16} />
                      <span className="text-[10px]">Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'netbanking'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Building2 size={16} />
                      <span className="text-[10px]">Netbanking</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleProcessRazorpayPayment} className="space-y-4">
                  {paymentMethod === 'upi' && (
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Enter VPA / UPI ID</label>
                      <input
                        type="text"
                        required
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="mobilenumber@upi or name@okaxis"
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-400"
                      />
                      <div className="flex gap-2 mt-2">
                        <span className="bg-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded border border-slate-700">Google Pay</span>
                        <span className="bg-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded border border-slate-700">PhonePe</span>
                        <span className="bg-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded border border-slate-700">Paytm</span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'qr' && (
                    <div className="text-center p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                      <div className="w-32 h-32 bg-white p-2 rounded-xl mx-auto flex items-center justify-center border-2 border-emerald-500 shadow-md">
                        <div className="w-full h-full bg-slate-900 rounded flex flex-col items-center justify-center p-1 text-center">
                          <QrCode size={48} className="text-emerald-400" />
                          <span className="text-[8px] text-slate-300 font-mono mt-1">Scan via any UPI App</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-bold">Scan with GPay, PhonePe, Paytm or BHIM</p>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Card Number</label>
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">CVV</label>
                          <input
                            type="password"
                            maxLength={4}
                            required
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Select Bank</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-blue-400"
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="State Bank of India">State Bank of India (SBI)</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessingRazorpay}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessingRazorpay ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        <span>Contacting Razorpay Gateway...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Pay ₹{selectedSaasCycle === 'yearly' ? checkoutPlan.priceYearly : checkoutPlan.priceMonthly} via Razorpay</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Success Receipt View */
              <div className="p-6 bg-slate-900/95 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Payment Successful
                  </span>
                  <h3 className="text-xl font-black text-white mt-2">SaaS Plan Activated!</h3>
                  <p className="text-xs text-blue-200/80 mt-1">
                    Your kitchen subscription is now upgraded to <strong className="text-white">{razorpaySuccessDetails.planName}</strong>.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-blue-800/50 text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Razorpay Payment ID:</span>
                    <span className="text-emerald-400 font-bold">{razorpaySuccessDetails.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Razorpay Order ID:</span>
                    <span className="text-white">{razorpaySuccessDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Charged:</span>
                    <span className="text-white font-bold">₹{razorpaySuccessDetails.amount} ({razorpaySuccessDetails.billingCycle})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400 font-bold">Captured & Verified</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowRazorpayModal(false);
                    setCheckoutPlan(null);
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Return to Kitchen Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guided Onboarding Wizard Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-emerald-100 shadow-2xl flex flex-col overflow-hidden max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <ChefHat className="text-emerald-400 h-5 w-5" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">Tiffin Partner Guided Setup</h3>
                  <p className="text-[10px] text-slate-400">रसोई सेटअप सहायक • Quick 3-Step Onboarding</p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem(`tiffin_setup_completed_${kitchen?.id || 'default'}`, 'true');
                  setShowSetupModal(false);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Skip & close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Steps Progress Indicator */}
            <div className="bg-emerald-50/50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between text-xs font-bold text-slate-600 shrink-0 select-none">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${setupStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
                <span className={setupStep === 1 ? 'text-emerald-600 font-extrabold' : 'text-slate-500 font-medium'}>Kitchen Profile</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-250 flex-1 mx-2"></div>
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${setupStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
                <span className={setupStep === 2 ? 'text-emerald-600 font-extrabold' : 'text-slate-500 font-medium'}>Add Delivery Rider</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-250 flex-1 mx-2"></div>
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${setupStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
                <span className={setupStep === 3 ? 'text-emerald-600 font-extrabold' : 'text-slate-500 font-medium'}>All Ready!</span>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              {/* STEP 1: Kitchen Profile */}
              {setupStep === 1 && (
                <div className="space-y-5">
                  <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/60 text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-emerald-800 flex items-center gap-1">
                      <Info size={14} /> Set Up Your Virtual Tiffin Store
                    </p>
                    <p>Enter your kitchen's commercial name, cuisine style, address, and brief menu introduction so local subscribers can find your food plans.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-700 block">Kitchen Name / रसोई का नाम *</label>
                        <input
                          type="text"
                          value={setupKitchenName}
                          onChange={(e) => setSetupKitchenName(e.target.value)}
                          placeholder="e.g. Annapurna Homely Tiffins"
                          className="w-full p-2.5 border border-slate-200 focus:border-emerald-500 rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-700 block">Cuisine Category / भोजन की श्रेणी</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSetupCuisineType('pure-veg')}
                            className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                              setupCuisineType === 'pure-veg'
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            🟢 Pure Veg
                          </button>
                          <button
                            type="button"
                            onClick={() => setSetupCuisineType('veg-nonveg')}
                            className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                              setupCuisineType === 'veg-nonveg'
                                ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/10'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            🔴 Veg & Non-Veg
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-700 block">Address / रसोई का पता *</label>
                        <textarea
                          value={setupAddress}
                          onChange={(e) => setSetupAddress(e.target.value)}
                          placeholder="e.g. Plot No 42, Gokhale Road, Near Hanuman Mandir, Shivaji Nagar, Pune"
                          rows={2}
                          className="w-full p-2.5 border border-slate-200 focus:border-emerald-500 rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-700 block">Kitchen Bio / रसोई का संक्षिप्त परिचय</label>
                        <textarea
                          value={setupDescription}
                          onChange={(e) => setSetupDescription(e.target.value)}
                          placeholder="e.g. We prepare delicious, hygienic, less-oil, homely food just like your mother makes."
                          rows={2}
                          className="w-full p-2.5 border border-slate-200 focus:border-emerald-500 rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                        />
                      </div>
                    </div>

                    {/* Dynamic Preview Card */}
                    <div className="space-y-2 text-xs">
                      <label className="font-bold text-slate-400 block uppercase tracking-wider">Live Customer Card Preview</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full justify-between min-h-[220px]">
                        <div>
                          <div className="relative h-28 bg-slate-200">
                            <img
                              src={kitchen?.imageUrl || "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600"}
                              alt="Kitchen Cover"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className={`absolute top-3 right-3 text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white shadow-sm ${setupCuisineType === 'pure-veg' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                              {setupCuisineType === 'pure-veg' ? 'Pure Veg' : 'Veg & Non-Veg'}
                            </span>
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-black text-slate-900 text-sm truncate">{setupKitchenName || 'My Awesome Kitchen'}</h4>
                              <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded text-[9px] shrink-0">
                                <Star size={10} className="fill-amber-500 text-amber-500" />
                                <span>{kitchen?.rating || 4.5}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{setupDescription || 'No description provided yet.'}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                              <Home size={10} className="text-slate-400 shrink-0" />
                              <span className="truncate">{setupAddress || 'Address will be shown here.'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="px-4 pb-4 border-t border-slate-100 pt-2 flex items-center justify-between bg-slate-100/50 mt-2">
                          <span className="text-[9px] font-bold text-emerald-700">● Accepting Subscriptions</span>
                          <span className="text-[9px] text-slate-400 font-mono">{kitchen?.packages?.length || 0} Food Plans</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Invite Rider */}
              {setupStep === 2 && (
                <div className="space-y-5">
                  <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/60 text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-emerald-800 flex items-center gap-1">
                      <Truck size={14} /> Assigning a Delivery Team
                    </p>
                    <p>To deliver fresh hotboxes, your kitchen needs delivery boys. They can sign in on their phones using this email, view active routes, and scan delivery OTPs.</p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4 text-xs max-w-md mx-auto">
                    <h3 className="font-black text-slate-800 text-sm border-b border-slate-200/60 pb-2">Invite First Delivery Rider</h3>
                    
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block">Rider Name (डिलिव्हरी बॉय का नाम) *</label>
                      <input
                        type="text"
                        value={setupDbName}
                        onChange={(e) => setSetupDbName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full p-2.5 border border-slate-200 focus:border-emerald-500 rounded-xl bg-white text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block">Email Address (लॉगिन ईमेल) *</label>
                      <input
                        type="email"
                        value={setupDbEmail}
                        onChange={(e) => setSetupDbEmail(e.target.value)}
                        placeholder="e.g. ramesh.delivery@tiffin.com"
                        className="w-full p-2.5 border border-slate-200 focus:border-emerald-500 rounded-xl bg-white text-slate-800 font-mono focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block">Phone Number (मोबाइल नंबर) *</label>
                      <input
                        type="text"
                        value={setupDbPhone}
                        onChange={(e) => setSetupDbPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full p-2.5 border border-slate-200 focus:border-emerald-500 rounded-xl bg-white text-slate-800 font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Complete Celebration */}
              {setupStep === 3 && (
                <div className="text-center py-6 space-y-6 max-w-md mx-auto">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full text-emerald-600 mb-2">
                    <CheckCircle size={36} className="animate-bounce" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-800">Your Kitchen is Setup!</h3>
                    <p className="text-xs text-slate-500">
                      Congratulations! Your Annapurna virtual kitchen profile has been updated and your team is ready to deliver.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-left text-xs space-y-2.5">
                    <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 uppercase text-[10px] tracking-wider text-slate-500">Summary of Changes</h4>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kitchen Name:</span>
                      <strong className="text-slate-800">{setupKitchenName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cuisine Style:</span>
                      <strong className="text-slate-800">{setupCuisineType === 'pure-veg' ? '🟢 Pure Veg' : '🔴 Veg & Non-Veg'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Delivery Team:</span>
                      <strong className="text-emerald-700 font-bold">
                        {setupDbName ? `🚴 ${setupDbName} (${setupDbEmail})` : 'No Rider Added (Skipped)'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-700 text-left leading-relaxed flex items-start gap-2">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>Rider Login Tip:</strong> You can select this newly registered delivery boy account instantly from the login portal bypass panel.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center shrink-0">
              {/* Back Button */}
              {setupStep > 1 && setupStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setSetupStep(prev => prev - 1)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft size={14} /> Back (पीछे)
                </button>
              ) : (
                <div></div>
              )}

              {/* Next/Done Button */}
              {setupStep === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!setupKitchenName || !setupAddress) {
                      alert('Please fill out the Kitchen Name and Physical Address to continue.');
                      return;
                    }
                    // Save Kitchen details
                    updateKitchenDetails(kitchen.id, setupKitchenName, setupCuisineType, setupAddress, setupDescription);
                    setSetupStep(2);
                  }}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/10 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Save & Continue <ArrowRight size={14} />
                </button>
              )}

              {setupStep === 2 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSetupStep(3);
                    }}
                    className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Skip Rider Onboarding
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!setupDbName || !setupDbEmail || !setupDbPhone) {
                        alert('Please fill out all rider fields or click Skip to finish setup.');
                        return;
                      }
                      addDeliveryBoy(setupDbName, setupDbEmail, setupDbPhone);
                      setSetupStep(3);
                    }}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/10 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Register & Continue <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {setupStep === 3 && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(`tiffin_setup_completed_${kitchen?.id || 'default'}`, 'true');
                    setShowSetupModal(false);
                  }}
                  className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Check size={14} /> Let's Go to Dashboard (काम शुरू करें)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
