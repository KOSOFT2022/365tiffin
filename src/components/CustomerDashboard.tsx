/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppLogo } from './AppLogo';
import { getApiUrl } from '../lib/apiConfig';
import { Store, Star, Calendar, ShoppingBag, Plus, Minus, UserPlus, CreditCard, ChevronRight, ChevronDown, CheckCircle, Flame, Truck, Smile, MessageSquare, Download, Search, Navigation, MapPin, Sliders, Check, X, QrCode, Camera, Award, RefreshCw, User, Mail, Phone, History, FileText, CheckCircle2, Clock, Trash2, Lock, Bell } from 'lucide-react';
import { Kitchen, SubscriptionPackage } from '../types';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { getDynamicOtp, getSubscriptionAttendanceMatrix, translateText, getTodayDateStr } from '../utils';
import { RealGoogleMap } from './RealGoogleMap';
import { GoogleMapsSetupSplash } from './GoogleMapsSetupSplash';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export const CustomerDashboard: React.FC = () => {
  const { 
    currentUser, 
    registerCustomer, 
    kitchens, 
    subscriptions, 
    orders, 
    addOns, 
    addSubscription, 
    addGuestPlate, 
    purchaseAddOns, 
    submitRatingAndFeedback,
    updateOrderStatus,
    toggleMandateStatus,
    addCredits,
    addSavedCard,
    removeSavedCard,
    updateSubscriptionStatus,
    requestDiversion,
    bulkOrders,
    placeBulkOrder,
    updateBulkOrderStatus
  } = useApp();

  // Registration Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [isRegistered, setIsRegistered] = useState(!!currentUser?.name);

  // User Profile & Billing States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'details' | 'billing' | 'transactions'>('details');
  const [profileName, setProfileName] = useState(currentUser.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileAddress, setProfileAddress] = useState(currentUser.customerAddress || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [txnSearchQuery, setTxnSearchQuery] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState<'all' | 'subscription' | 'topup' | 'guest_plate' | 'addon' | 'bulk_order'>('all');

  // New Saved Card States
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCVV, setNewCardCVV] = useState('');
  const [newCardType, setNewCardType] = useState('VISA');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const [dashboardTab, setDashboardTab] = useState<'plan' | 'extra' | 'track' | 'explore'>(() => {
    const mySubs = subscriptions.filter(s => s.customerId === currentUser.id && s.status === 'active');
    return mySubs.length > 0 ? 'plan' : 'explore';
  });

  const [mapEngine, setMapEngine] = useState<'real' | 'mock'>(hasValidKey ? 'real' : 'mock');

  const [transactions, setTransactions] = useState<any[]>(() => {
    const saved = localStorage.getItem('tiffingo_user_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    
    // Default seed transactions
    return [
      {
        id: 'TXN-9021',
        type: 'subscription',
        description: 'Monthly Tiffin Package - Standard Veg',
        amount: 1200,
        date: '2026-06-01',
        paymentMethod: 'Card',
        status: 'SUCCESS'
      },
      {
        id: 'TXN-8114',
        type: 'topup',
        description: 'Wallet Credits Top-Up',
        amount: 500,
        date: '2026-06-08',
        paymentMethod: 'UPI',
        status: 'SUCCESS'
      },
      {
        id: 'TXN-7402',
        type: 'guest_plate',
        description: 'Scheduled Guest Meals (2 Plates)',
        amount: 300,
        date: '2026-06-12',
        paymentMethod: 'Credits',
        status: 'SUCCESS'
      },
      {
        id: 'TXN-6391',
        type: 'addon',
        description: 'Premium Daily Accompaniments (Gulab Jamun x2)',
        amount: 120,
        date: '2026-06-20',
        paymentMethod: 'Credits',
        status: 'SUCCESS'
      },
      {
        id: 'TXN-5221',
        type: 'topup',
        description: 'Wallet Credits Top-Up',
        amount: 1000,
        date: '2026-06-24',
        paymentMethod: 'UPI',
        status: 'SUCCESS'
      }
    ];
  });

  const logTransaction = (type: string, description: string, amount: number, paymentMethod: string) => {
    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: currentUser?.id || 'guest_cust',
      type,
      description,
      amount,
      date: getTodayDateStr(),
      paymentMethod,
      status: 'SUCCESS'
    };
    setTransactions(prev => {
      const updated = [newTxn, ...prev];
      localStorage.setItem('tiffingo_user_transactions', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
      setProfilePhone(currentUser.phone || '');
      setProfileAddress(currentUser.customerAddress || '');
      setDeliveryAddress(currentUser.customerAddress || currentUser.phone || 'Apt 402, Greenfield');
    }
  }, [currentUser]);

  // Bulk Ordering States
  const [selectedBulkKitchenId, setSelectedBulkKitchenId] = useState<string | null>(null);
  const [bulkCart, setBulkCart] = useState<{ [itemId: string]: number }>({});
  const [bulkDeliveryDate, setBulkDeliveryDate] = useState(getTodayDateStr());
  const [bulkDeliveryTime, setBulkDeliveryTime] = useState('12:30 PM');
  const [bulkNotes, setBulkNotes] = useState('');
  const [isPlacingBulkOrder, setIsPlacingBulkOrder] = useState(false);
  const [bulkOrderSuccess, setBulkOrderSuccess] = useState(false);

  // Selected Kitchen & Subscribe State
  const [selectedKitchenId, setSelectedKitchenId] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<SubscriptionPackage | null>(null);
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly'>('monthly');
  const [deliveryTime, setDeliveryTime] = useState<'lunch' | 'dinner'>('lunch');
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser.customerAddress || currentUser.phone || 'Apt 402, Greenfield');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'bank_mandate' | 'credits'>('upi');
  const [divAddress, setDivAddress] = useState('');
  const [topupAmount, setTopupAmount] = useState<number>(500);
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const paymentTimeoutRef = React.useRef<any>(null);
  const rzpInstanceRef = React.useRef<any>(null);

  // QR code scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [manualOtp, setManualOtp] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Guest Plates State
  const [guestPlatesCount, setGuestPlatesCount] = useState(1);
  const [guestPlatesDate, setGuestPlatesDate] = useState(getTodayDateStr());
  const [guestVegOnly, setGuestVegOnly] = useState(true);

  // Add-on Cart State
  const [addonCart, setAddonCart] = useState<{ [id: string]: number }>({});

  // Custom confirmation popup/modal state for guest plates and addons
  const [confirmationPopup, setConfirmationPopup] = useState<{
    type: 'guest_plate' | 'addon';
    title: string;
    message: string;
    details: string[];
    pricePaid: number;
  } | null>(null);

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmittedId, setFeedbackSubmittedId] = useState<string | null>(null);

  // Notifications State & Sync
  interface AppNotification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: 'delivery' | 'billing' | 'account' | 'system';
    read: boolean;
    orderId?: string;
  }

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(`tiffingo_notifications_${currentUser?.id || 'guest'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'seed-welcome',
        title: 'Welcome to TiffinGo! 👋',
        message: 'Subscribe to any kitchen package to unlock live delivery tracking and smart meal controls.',
        timestamp: '10 mins ago',
        type: 'system',
        read: false
      },
      {
        id: 'seed-safety',
        title: 'Auto-Debit Protection Active 🛡️',
        message: 'Our smart contract holds your subscription payment. Funds are released daily only after successful delivery!',
        timestamp: '2 hours ago',
        type: 'billing',
        read: false
      }
    ];
  });

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'delivery'>('all');

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent marking as read if we are removing it
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem(`tiffingo_notifications_${currentUser?.id || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Sync effect to dynamically update notifications from live state (orders, subscriptions)
  useEffect(() => {
    if (!currentUser) return;

    setNotifications(prev => {
      let updated = [...prev];
      let changed = false;

      // 1. Sync orders of current user
      const userOrders = orders.filter(o => o.customerId === currentUser.id);
      userOrders.forEach(order => {
        const statusMap: { [key: string]: { title: string; msg: string; type: 'delivery' | 'billing' | 'account' | 'system' } } = {
          placed: {
            title: "Order Placed! 🍲",
            msg: `Your meal box from ${order.kitchenName} is scheduled and placed.`,
            type: 'delivery'
          },
          cooking: {
            title: "Meal is Cooking! 🧑‍🍳",
            msg: `Chef at ${order.kitchenName} has started preparing your fresh hot meal.`,
            type: 'delivery'
          },
          ready_for_dispatch: {
            title: "Packed & Ready! 🍱",
            msg: `Your meal box is sealed and ready for dispatch at ${order.kitchenName}.`,
            type: 'delivery'
          },
          dispatched: {
            title: "Rider Dispatched! 🚴",
            msg: `Rider ${order.deliveryBoyName || 'Rahul'} has departed with your hot meal.`,
            type: 'delivery'
          },
          out_for_delivery: {
            title: "Out for Delivery! 🚴",
            msg: `Rider ${order.deliveryBoyName || 'Rahul'} is bringing your meal box to your address.`,
            type: 'delivery'
          },
          delivered: {
            title: "Delivered! 🎉",
            msg: `Enjoy your hot meal. Don't forget to rate and review today's plate!`,
            type: 'delivery'
          }
        };

        const currentStatus = order.status;
        if (statusMap[currentStatus]) {
          const notifId = `notif_order_${order.id}_${currentStatus}`;
          const alreadyExists = updated.some(n => n.id === notifId);
          if (!alreadyExists) {
            const info = statusMap[currentStatus];
            updated = [
              {
                id: notifId,
                title: info.title,
                message: info.msg,
                timestamp: 'Just now',
                type: info.type,
                read: false,
                orderId: order.id
              },
              ...updated
            ];
            changed = true;
          }
        }
      });

      // 2. Sync subscriptions of current user
      const userSubs = subscriptions.filter(s => s.customerId === currentUser.id);
      userSubs.forEach(sub => {
        const subStatusMap: { [key: string]: { title: string; msg: string; type: 'delivery' | 'billing' | 'account' | 'system' } } = {
          active: {
            title: "Subscription Activated! 🌟",
            msg: `Your ${sub.billingCycle} package for ${sub.packageName} at ${sub.kitchenName} is now active.`,
            type: 'account'
          },
          paused: {
            title: "Subscription Paused ⏸️",
            msg: `Your subscription to ${sub.packageName} at ${sub.kitchenName} has been paused.`,
            type: 'account'
          }
        };

        const currentStatus = sub.status;
        if (subStatusMap[currentStatus]) {
          const notifId = `notif_sub_${sub.id}_${currentStatus}`;
          const alreadyExists = updated.some(n => n.id === notifId);
          if (!alreadyExists) {
            const info = subStatusMap[currentStatus];
            updated = [
              {
                id: notifId,
                title: info.title,
                message: info.msg,
                timestamp: 'Just now',
                type: info.type,
                read: false
              },
              ...updated
            ];
            changed = true;
          }
        }
      });

      // 3. Sync transactions of current user
      const userTxns = transactions || [];
      userTxns.forEach(txn => {
        const txnMap: { [key: string]: { title: string; msg: string; type: 'delivery' | 'billing' | 'account' | 'system' } } = {
          topup: {
            title: "Wallet Top-Up Successful 💳",
            msg: `Successfully loaded ₹${txn.amount} credits to your digital wallet.`,
            type: 'billing'
          },
          guest_plate: {
            title: "Guest Plates Scheduled 👥",
            msg: `Successfully scheduled additional guest meals for ₹${txn.amount}.`,
            type: 'delivery'
          },
          addon: {
            title: "Add-Ons Purchased 🍰",
            msg: `Added premium treats and accompaniments to your schedule.`,
            type: 'delivery'
          }
        };

        if (txnMap[txn.type]) {
          const notifId = `notif_txn_${txn.id}`;
          const alreadyExists = updated.some(n => n.id === notifId);
          if (!alreadyExists) {
            const info = txnMap[txn.type];
            updated = [
              {
                id: notifId,
                title: info.title,
                message: info.msg,
                timestamp: txn.date || 'Just now',
                type: info.type,
                read: false
              },
              ...updated
            ];
            changed = true;
          }
        }
      });

      if (changed) {
        localStorage.setItem(`tiffingo_notifications_${currentUser?.id || 'guest'}`, JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [orders, subscriptions, transactions, currentUser]);

  const markAllNotifsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem(`tiffingo_notifications_${currentUser?.id || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
  };

  const markNotifAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem(`tiffingo_notifications_${currentUser?.id || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem(`tiffingo_notifications_${currentUser?.id || 'guest'}`);
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const selectedKitchen = kitchens.find(k => k.id === selectedKitchenId);

  const { t, i18n } = useTranslation();
  const tText = (text: string | null | undefined) => translateText(text, i18n.language);

  // Location & Browsing State
  const [userArea, setUserArea] = useState<string>('Kalyani Nagar');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(15);
  const [cuisineFilter, setCuisineFilter] = useState<'all' | 'pure-veg' | 'veg-nonveg'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance');

  const AREA_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
    'Kalyani Nagar': { lat: 18.5524, lng: 73.9012 },
    'Viman Nagar': { lat: 18.5679, lng: 73.9143 },
    'Kothrud': { lat: 18.5074, lng: 73.8077 },
    'Deccan Gymkhana': { lat: 18.5186, lng: 73.8422 },
    'Koregaon Park': { lat: 18.5362, lng: 73.8940 },
    'Greenfield (Sector 4)': { lat: 18.5983, lng: 73.7431 }
  };

  const KITCHEN_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
    'kit_1': { lat: 18.5983, lng: 73.7431 }, // Annapurna Pure Veg Kitchen
    'kit_2': { lat: 18.5524, lng: 73.9012 }, // Royal Feast Kitchen
    'kit_3': { lat: 18.5679, lng: 73.9143 }, // The Fit Bistro (Keto & Diet)
    'kit_4': { lat: 18.5186, lng: 73.8422 }, // Deccan Gymkhana Spice Box
    'kit_5': { lat: 18.5074, lng: 73.8077 }, // Kothrud Homemade Veg Tiffin
    'kit_6': { lat: 18.5362, lng: 73.8940 }  // Koregaon Park Organic Tiffin
  };

  const calculateDistance = (kitchenId: string) => {
    const userCoords = AREA_COORDINATES[userArea] || AREA_COORDINATES['Kalyani Nagar'];
    const kitCoords = KITCHEN_COORDINATES[kitchenId] || { lat: 18.5524, lng: 73.9012 };
    
    // Haversine formula
    const R = 6371; // earth radius in km
    const dLat = (kitCoords.lat - userCoords.lat) * Math.PI / 180;
    const dLon = (kitCoords.lng - userCoords.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userCoords.lat * Math.PI / 180) * Math.cos(kitCoords.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return parseFloat((R * c).toFixed(1)); // round to 1 decimal place
  };

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setLocationSuccessMsg(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          let nearestArea = 'Kalyani Nagar';
          let minD = Infinity;
          
          Object.entries(AREA_COORDINATES).forEach(([name, coords]) => {
            const dLat = coords.lat - latitude;
            const dLon = coords.lng - longitude;
            const dist = dLat * dLat + dLon * dLon;
            if (dist < minD) {
              minD = dist;
              nearestArea = name;
            }
          });
          
          setTimeout(() => {
            setUserArea(nearestArea);
            setIsDetectingLocation(false);
            setLocationSuccessMsg(`GPS Detected: ${nearestArea}, Pune (Accuracy: 12m)`);
            setTimeout(() => setLocationSuccessMsg(null), 4500);
          }, 1000);
        },
        (error) => {
          setTimeout(() => {
            setUserArea('Kalyani Nagar');
            setIsDetectingLocation(false);
            setLocationSuccessMsg('GPS Simulated: Kalyani Nagar, Pune (Accuracy: 15m)');
            setTimeout(() => setLocationSuccessMsg(null), 4500);
          }, 1200);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setTimeout(() => {
        setIsDetectingLocation(false);
        alert('Geolocation is not supported by your browser.');
      }, 500);
    }
  };

  const filteredKitchens = kitchens
    .map(kit => ({
      ...kit,
      distance: calculateDistance(kit.id)
    }))
    .filter(kit => {
      // 1. Distance filter
      if (kit.distance > maxDistance) return false;
      
      // 2. Cuisine type filter
      if (cuisineFilter !== 'all' && kit.cuisineType !== cuisineFilter) return false;
      
      // 3. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = kit.name.toLowerCase().includes(query);
        const matchesDesc = kit.description.toLowerCase().includes(query);
        const matchesAddress = kit.address.toLowerCase().includes(query);
        const matchesPackage = kit.packages.some(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
        return matchesName || matchesDesc || matchesAddress || matchesPackage;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distance - b.distance;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'price') {
        const priceA = a.packages[0]?.priceWeekly || 0;
        const priceB = b.packages[0]?.priceWeekly || 0;
        return priceA - priceB;
      }
      return 0;
    });

  // Customer's Subscriptions and Orders
  const mySubscriptions = subscriptions.filter(s => s.customerId === currentUser.id && s.status === 'active');
  const activeKitchen = mySubscriptions[0] ? kitchens.find(k => k.id === mySubscriptions[0].kitchenId) : null;
  const myOrders = orders.filter(o => o.customerId === currentUser.id);
  const activeTrackingOrder = myOrders.find(o => o.status !== 'delivered') || myOrders[0];

  // Dynamic OTP timer tick
  const [currentOtpData, setCurrentOtpData] = useState<{ otp: string; secondsLeft: number }>({ otp: '', secondsLeft: 30 });
  useEffect(() => {
    if (!activeTrackingOrder) return;
    const updateOtp = () => {
      setCurrentOtpData(getDynamicOtp(activeTrackingOrder.id));
    };
    updateOtp();
    const interval = setInterval(updateOtp, 1000);
    return () => clearInterval(interval);
  }, [activeTrackingOrder]);

  const calculateTotal = (order: any) => {
    let base = 300; // default base price in INR
    if (order.details.guestPlatesCount) {
      base += order.details.guestPlatesCount * 150;
    }
    if (order.details.addOns) {
      order.details.addOns.forEach((add: any) => {
        base += (add.price || 40) * add.quantity;
      });
    }
    return base;
  };

  const downloadInvoicePDF = async (order: any) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Header Section
      pdf.setFillColor(249, 115, 22); // Emerald theme
      pdf.rect(0, 0, 210, 15, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('TiffinGo Pro', 14, 10);
      
      pdf.setTextColor(30, 41, 59); // Slate-800
      pdf.setFontSize(22);
      pdf.text('INVOICE', 14, 32);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Invoice ID: #INV-${order.id}`, 14, 38);
      pdf.text(`Date: ${order.date}`, 14, 43);
      pdf.text(`Status: PAID (SECUERED)`, 14, 48);
      
      // Divider
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, 53, 196, 53);
      
      // Billed To & From Kitchen
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // Slate-500
      pdf.text('BILLED TO:', 14, 62);
      pdf.text('FROM KITCHEN:', 110, 62);
      
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text(order.customerName || 'Customer', 14, 68);
      pdf.text(order.kitchenName || 'Kitchen', 110, 68);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(order.customerPhone || '', 14, 73);
      
      // Split address lines for nice printing
      const addrLines = pdf.splitTextToSize(order.customerAddress || '', 80);
      pdf.text(addrLines, 14, 78);
      
      // Divider
      pdf.line(14, 98, 196, 98);
      
      // Table Header
      pdf.setFillColor(248, 250, 252); // Slate-50
      pdf.rect(14, 104, 182, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Item Description', 18, 109);
      pdf.text('Qty', 110, 109);
      pdf.text('Rate', 140, 109);
      pdf.text('Total', 175, 109);
      
      let currentY = 118;
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'normal');
      
      // Base subscription item
      pdf.text(order.details.packageName || 'Regular Plan', 18, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Tiffin Meal Package Subscription (${order.mealType})`, 18, currentY + 4);
      
      pdf.setFontSize(9);
      pdf.setTextColor(30, 41, 59);
      pdf.text('1', 110, currentY);
      pdf.text('₹300.00', 140, currentY);
      pdf.text('₹300.00', 175, currentY);
      
      currentY += 12;
      
      // Guest plates item
      if (order.details.guestPlatesCount > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.text('Guest Plates', 18, currentY);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Scheduled additional guest meals', 18, currentY + 4);
        
        pdf.setFontSize(9);
        pdf.setTextColor(30, 41, 59);
        pdf.text(String(order.details.guestPlatesCount), 110, currentY);
        pdf.text('₹150.00', 140, currentY);
        pdf.text(`₹${(order.details.guestPlatesCount * 150).toFixed(2)}`, 175, currentY);
        
        currentY += 12;
      }
      
      // Addons items
      if (order.details.addOns && order.details.addOns.length > 0) {
        order.details.addOns.forEach((add: any) => {
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Add-on: ${add.name}`, 18, currentY);
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          pdf.text('Special premium meal accompaniment', 18, currentY + 4);
          
          pdf.setFontSize(9);
          pdf.setTextColor(30, 41, 59);
          pdf.text(String(add.quantity), 110, currentY);
          pdf.text(`₹${(add.price || 40).toFixed(2)}`, 140, currentY);
          pdf.text(`₹${((add.price || 40) * add.quantity).toFixed(2)}`, 175, currentY);
          
          currentY += 12;
        });
      }
      
      // Summary divider
      pdf.line(14, currentY, 196, currentY);
      currentY += 8;
      
      const subtotal = calculateTotal(order);
      const gst = subtotal * 0.18;
      const grandTotal = subtotal * 1.18;
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Subtotal:', 140, currentY);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`₹${subtotal.toFixed(2)}`, 175, currentY);
      
      currentY += 6;
      pdf.setTextColor(100, 116, 139);
      pdf.text('GST (18%):', 140, currentY);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`₹${gst.toFixed(2)}`, 175, currentY);
      
      currentY += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(249, 115, 22); // Emerald theme
      pdf.text('Grand Total:', 140, currentY);
      pdf.text(`₹${grandTotal.toFixed(2)}`, 175, currentY);
      
      // Footer
      pdf.setDrawColor(241, 245, 249);
      pdf.line(14, 250, 196, 250);
      
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184); // Slate-400
      pdf.text('Thank you for dining with TiffinGo Pro!', 105, 258, { align: 'center' });
      pdf.text('This is an electronically generated receipt secured by Bank Auto-Debit Mandate validation.', 105, 263, { align: 'center' });
      
      pdf.save(`TiffinGo_Invoice_${order.id}.pdf`);
    } catch (e) {
      console.error('Direct PDF error:', e);
    }
  };

  const downloadReceiptPDF = (txn: any) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Header Section with high contrast emerald accent
      pdf.setFillColor(249, 115, 22); // Emerald theme
      pdf.rect(0, 0, 210, 15, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('TiffinGo - Payment Receipt', 14, 10);
      
      pdf.setTextColor(30, 41, 59); // Slate-800
      pdf.setFontSize(22);
      pdf.text('TRANSACTION RECEIPT', 14, 32);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Receipt ID: #REC-${txn.id}`, 14, 38);
      pdf.text(`Date of Transaction: ${txn.date}`, 14, 43);
      pdf.text(`Payment Status: ${txn.status}`, 14, 48);
      pdf.text(`Payment Gateway Ref: PG_REF_${txn.id.substring(4)}`, 14, 53);
      
      // Divider
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, 58, 196, 58);
      
      // Billed To & From
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // Slate-500
      pdf.text('CUSTOMER / DINER PROFILE:', 14, 67);
      pdf.text('SERVICE PROVIDER:', 110, 67);
      
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text(currentUser.name || 'Diner', 14, 73);
      pdf.text('TiffinGo Catering Platform Pvt Ltd', 110, 73);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`Phone: ${currentUser.phone || ''}`, 14, 78);
      pdf.text(`Email: ${currentUser.email || ''}`, 14, 83);
      pdf.text('G-12, Tech Square, Sector 4, Pune', 110, 78);
      
      // Split address lines for nice printing
      const addrLines = pdf.splitTextToSize(currentUser.customerAddress || 'Pune, India', 80);
      pdf.text(addrLines, 14, 88);
      
      // Divider
      pdf.line(14, 105, 196, 105);
      
      // Table Header
      pdf.setFillColor(248, 250, 252); // Slate-50
      pdf.rect(14, 111, 182, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Item / Description', 18, 116);
      pdf.text('Qty', 110, 116);
      pdf.text('Rate', 140, 116);
      pdf.text('Total', 175, 116);
      
      let currentY = 125;
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'normal');
      
      // Item Details
      pdf.text(txn.description, 18, currentY);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Type: ${txn.type.toUpperCase()} | Method: ${txn.paymentMethod}`, 18, currentY + 4);
      
      pdf.setFontSize(9);
      pdf.setTextColor(30, 41, 59);
      pdf.text('1', 110, currentY);
      pdf.text(`₹${txn.amount.toFixed(2)}`, 140, currentY);
      pdf.text(`₹${txn.amount.toFixed(2)}`, 175, currentY);
      
      currentY += 12;
      
      // Divider
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, currentY, 196, currentY);
      
      currentY += 8;
      
      // Summary Details
      pdf.setFont('helvetica', 'bold');
      pdf.text('Subtotal:', 130, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`₹${txn.amount.toFixed(2)}`, 175, currentY);
      
      currentY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text('CGST (2.5%):', 130, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`₹${(txn.amount * 0.025).toFixed(2)}`, 175, currentY);
      
      currentY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text('SGST (2.5%):', 130, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`₹${(txn.amount * 0.025).toFixed(2)}`, 175, currentY);
      
      currentY += 8;
      pdf.setFillColor(249, 115, 22); // Emerald background for Total
      pdf.rect(125, currentY - 5, 71, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL PAID:', 130, currentY);
      pdf.text(`₹${(txn.amount * 1.05).toFixed(2)}`, 175, currentY);
      
      // Watermark Stamp
      pdf.setTextColor(34, 197, 94); // emerald-500
      pdf.setFontSize(26);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PAID SECURED', 40, currentY + 15);
      
      // Terms footer
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Thank you for dining with TiffinGo. This receipt is generated electronically and requires no physical signature.', 14, 280);
      pdf.text('For billing inquiries, email billing@tiffingo.com or call our partner helpline.', 14, 285);
      
      pdf.save(`TiffinGo_Receipt_${txn.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Could not download transaction receipt. Please try again.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regAddress) {
      alert('Please fill out all registration fields.');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    // Validate phone length
    const cleanPhone = regPhone.replace(/[^\d]/g, '');
    if (cleanPhone.length !== 10) {
      alert('Mobile number must be exactly 10 digits.');
      return;
    }

    registerCustomer(regName, regEmail, regPhone, regAddress);
    setDeliveryAddress(regAddress);
    setIsRegistered(true);
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg || !selectedKitchenId) return;

    setIsPaying(true);

    if (paymentMethod === 'credits') {
      const balance = currentUser?.creditsBalance !== undefined ? currentUser.creditsBalance : 0;
      const price = billingCycle === 'weekly' ? selectedPkg.priceWeekly : selectedPkg.priceMonthly;
      const discountedPrice = Math.round(price * 0.9);
      if (balance < discountedPrice) {
        alert('Insufficient credits balance. Please top-up first.');
        setIsPaying(false);
        return;
      }
      paymentTimeoutRef.current = setTimeout(() => {
        completeSubscriptionFlow();
      }, 1000);
      return;
    }

    const price = billingCycle === 'weekly' ? selectedPkg.priceWeekly : selectedPkg.priceMonthly;
    
    // 1. Try to load Razorpay script and call backend
    try {
      const amountInPaise = Math.round(price * 100 * 80); // Convert to INR Paise (approx 1 USD = 80 INR)
      const res = await fetch(getApiUrl('/api/payment/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInPaise, currency: 'INR' })
      });

      if (!res.ok) throw new Error('Backend payment order creation failed');
      const orderData = await res.json();

      // Dynamically load Razorpay checkout script
      const loadScript = () => {
        return new Promise((resolve) => {
          if ((window as any).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const scriptLoaded = await loadScript();
      if (!scriptLoaded) throw new Error('Razorpay script failed to load');

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TiffinGo Pro',
        description: `${selectedPkg.name} subscription`,
        order_id: orderData.id,
        handler: async (response: any) => {
          setIsPaying(true);
          try {
            const verifyRes = await fetch(getApiUrl('/api/payment/verify'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.status === 'success') {
              completeSubscriptionFlow();
            } else {
              alert('Payment verification failed.');
              setIsPaying(false);
            }
          } catch (err) {
            console.error('Verification error:', err);
            // Fallback complete in sandbox if network/verification issues
            completeSubscriptionFlow();
          }
        },
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
          contact: currentUser.phone
        },
        theme: {
          color: '#F97316'
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            rzpInstanceRef.current = null;
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzpInstanceRef.current = rzp;
      rzp.on('payment.failed', (resp: any) => {
        console.error('Payment failed:', resp.error);
        alert('Payment failed. Please try again.');
        setIsPaying(false);
      });
      rzp.open();
    } catch (err) {
      console.log('Using sandbox high-fidelity payment fallback due to empty API keys:', err);
      // Beautiful local simulation fallback
      paymentTimeoutRef.current = setTimeout(() => {
        completeSubscriptionFlow();
      }, 2000);
    }
  };

  const completeSubscriptionFlow = () => {
    setIsPaying(false);
    setPaySuccess(true);
    const amount = billingCycle === 'weekly' ? selectedPkg!.priceWeekly : selectedPkg!.priceMonthly;
    logTransaction('subscription', `Monthly Tiffin Package - ${selectedPkg!.name}`, amount, paymentMethod.toUpperCase());
    paymentTimeoutRef.current = setTimeout(() => {
      addSubscription(
        selectedKitchenId!,
        selectedPkg!.id,
        billingCycle,
        deliveryTime,
        deliveryAddress,
        paymentMethod
      );
      setPaySuccess(false);
      setSelectedPkg(null);
      setSelectedKitchenId(null);
    }, 1500);
  };

  const handleAddGuestPlates = (subId: string) => {
    if (guestPlatesCount < 1) return;
    const price = guestPlatesCount * 150.00; // standard ₹150 plate
    addGuestPlate(subId, guestPlatesDate, guestPlatesCount, guestVegOnly, price);
    logTransaction('guest_plate', `Scheduled Guest Meals (${guestPlatesCount} Plates)`, price, 'Credits');
    
    const sub = subscriptions.find(s => s.id === subId);
    setConfirmationPopup({
      type: 'guest_plate',
      title: 'Guest Plates Scheduled! 🍱',
      message: 'Your hot tiffin boxes have been successfully scheduled with additional guest plates. Enjoy your meal together!',
      details: [
        `Kitchen: ${sub ? sub.kitchenName : 'Annapurna Pure Veg Kitchen'}`,
        `Scheduled Date: ${guestPlatesDate}`,
        `Guest Plates: ${guestPlatesCount} ${guestVegOnly ? '(Pure Vegetarian)' : '(Regular Plan)'}`,
        `Wallet Deducted: ₹${price.toFixed(2)}`
      ],
      pricePaid: price
    });
    setGuestPlatesCount(1);
  };

  const handleCartChange = (id: string, delta: number) => {
    setAddonCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handlePurchaseAddons = (subId: string) => {
    const items = (Object.entries(addonCart) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId, quantity: qty }));

    if (items.length === 0) {
      alert('Your cart is empty. Please select quantities before purchasing.');
      return;
    }

    const totalPrice = items.reduce((sum, item) => {
      const addon = addOns.find(a => a.id === item.itemId)!;
      return sum + (addon.price * item.quantity);
    }, 0);

    purchaseAddOns(subId, getTodayDateStr(), items); // Default purchased for today's active box!
    const names = items.map(it => addOns.find(a => a.id === it.itemId)?.name || '').join(', ');
    logTransaction('addon', `Premium Daily Accompaniments (${names})`, totalPrice, 'Credits');
    
    setConfirmationPopup({
      type: 'addon',
      title: 'Accompaniments Added! ✨',
      message: 'Your premium accompaniments have been added to your tiffin box for today. Delivered piping hot!',
      details: items.map(it => {
        const itemObj = addOns.find(a => a.id === it.itemId);
        return `• ${itemObj?.name || 'Item'} (x${it.quantity})`;
      }),
      pricePaid: totalPrice
    });
    setAddonCart({});
  };

  const handleFeedbackSubmit = (orderId: string) => {
    submitRatingAndFeedback(orderId, feedbackRating, feedbackText);
    setFeedbackSubmittedId(orderId);
    setFeedbackText('');
    setTimeout(() => setFeedbackSubmittedId(null), 3000);
  };

  const renderUnlockPrompt = () => (
    <div className="bg-white rounded-3xl border border-emerald-100 p-8 max-w-2xl mx-auto text-center space-y-6 shadow-sm my-8">
      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-500 shadow-sm">
        <Lock size={28} className="stroke-[2.5]" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-extrabold text-slate-800">Unlock Premium Diner Tools</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Choose any delicious home-cooked meal plan package from our certified kitchens to unlock live delivery tracking, guest plate scheduling, custom daily add-ons, and auto-debit safety releases!
        </p>
      </div>
      <button
        onClick={() => setDashboardTab('explore')}
        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-100 transition-all text-xs active:scale-95 cursor-pointer inline-flex items-center gap-2"
      >
        <Store size={14} />
        Explore Partner Kitchens Now
      </button>
    </div>
  );

  return (
    <div className="bg-emerald-50/30 min-h-screen p-4 md:p-8 font-sans pb-32" id="customer-dashboard">
      
      {/* Upper Brand Nav */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <AppLogo size={40} glow={true} />
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{t('app_title')}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <strong className="text-slate-800">{currentUser.name || 'Valued Diner'}</strong>. Order guest plates, configure daily addon treats, and track delivery walkthroughs.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className="relative flex items-center justify-center bg-white hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 rounded-xl p-3 text-slate-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400 cursor-pointer group"
              title="Recent Alerts & Deliveries"
              id="notif-bell-btn"
            >
              <Bell 
                size={20} 
                className={`transition-transform duration-300 group-hover:scale-110 ${unreadNotifsCount > 0 ? 'text-emerald-500 animate-[pulse_1.5s_infinite]' : 'text-slate-400'}`} 
              />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-extrabold text-white items-center justify-center">
                    {unreadNotifsCount}
                  </span>
                </span>
              )}
            </button>

            {isNotifDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsNotifDropdownOpen(false)}
                />
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl bg-white border border-slate-100 shadow-2xl py-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[520px] flex flex-col">
                  {/* Header */}
                  <div className="px-4 pb-3 border-b border-slate-50">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm tracking-tight">Recent Alerts</span>
                        {unreadNotifsCount > 0 && (
                          <span className="bg-emerald-100 text-emerald-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {unreadNotifsCount} New
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {notifications.length > 0 && (
                          <button
                            onClick={markAllNotifsAsRead}
                            className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-500 transition-colors cursor-pointer"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    {notifications.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-1">
                        <button
                          onClick={() => setNotifFilter('all')}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${notifFilter === 'all' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          All ({notifications.length})
                        </button>
                        <button
                          onClick={() => setNotifFilter('unread')}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${notifFilter === 'unread' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          Unread ({notifications.filter(n => !n.read).length})
                        </button>
                        <button
                          onClick={() => setNotifFilter('delivery')}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${notifFilter === 'delivery' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          Deliveries ({notifications.filter(n => n.type === 'delivery').length})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="overflow-y-auto divide-y divide-slate-50 max-h-[340px] flex-1 scrollbar-thin">
                    {(() => {
                      const list = notifications.filter(n => {
                        if (notifFilter === 'unread') return !n.read;
                        if (notifFilter === 'delivery') return n.type === 'delivery';
                        return true;
                      });

                      if (list.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-400 mb-3 animate-[pulse_2s_infinite]">
                              <Bell size={24} className="stroke-[1.5]" />
                            </div>
                            <p className="text-xs font-extrabold text-slate-800">No alerts found</p>
                            <p className="text-[10px] text-slate-400 max-w-[220px] mt-1 leading-relaxed">
                              {notifFilter === 'all' 
                                ? "You're all caught up! Subscription actions and delivery tracking updates will appear here."
                                : notifFilter === 'unread' 
                                ? "You have no unread notifications right now."
                                : "No meal delivery alerts are currently available."}
                            </p>
                          </div>
                        );
                      }

                      return list.map(notif => {
                        // Icon mapping
                        let notifIcon = <Bell size={14} className="text-slate-500" />;
                        let iconBg = "bg-slate-50";
                        if (notif.type === 'delivery') {
                          notifIcon = <Truck size={14} className="text-emerald-500" />;
                          iconBg = "bg-emerald-50 border border-emerald-100/50";
                        } else if (notif.type === 'billing') {
                          notifIcon = <CreditCard size={14} className="text-emerald-500" />;
                          iconBg = "bg-emerald-50 border border-emerald-100/50";
                        } else if (notif.type === 'account') {
                          notifIcon = <User size={14} className="text-blue-500" />;
                          iconBg = "bg-blue-50 border border-blue-100/50";
                        } else if (notif.type === 'system') {
                          notifIcon = <Award size={14} className="text-purple-500" />;
                          iconBg = "bg-purple-50 border border-purple-100/50";
                        }

                        return (
                          <div
                            key={notif.id}
                            onClick={() => markNotifAsRead(notif.id)}
                            className={`group/item flex gap-3 p-3.5 transition-all cursor-pointer text-left relative ${notif.read ? 'bg-white hover:bg-slate-50/40' : 'bg-emerald-50/10 hover:bg-emerald-50/20 border-l-2 border-emerald-500/70'}`}
                          >
                            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${iconBg}`}>
                              {notifIcon}
                            </div>
                            <div className="flex-1 space-y-0.5 pr-4">
                              <div className="flex justify-between items-start gap-1">
                                <h4 className={`text-xs text-slate-800 leading-tight ${!notif.read ? 'font-extrabold text-slate-900' : 'font-semibold'}`}>
                                  {notif.title}
                                </h4>
                                {!notif.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <Clock size={10} className="text-slate-400" />
                                <span className="text-[9px] text-slate-400 font-bold">
                                  {notif.timestamp}
                                </span>
                              </div>
                            </div>

                            {/* Dismiss button on hover */}
                            <button
                              onClick={(e) => dismissNotification(notif.id, e)}
                              className="absolute top-3.5 right-3 opacity-0 group-hover/item:opacity-100 transition-opacity bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg p-1 text-slate-400 cursor-pointer"
                              title="Dismiss Alert"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-2 bg-emerald-50/80 hover:bg-emerald-50 border border-emerald-100/80 hover:border-emerald-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200/60 focus:border-emerald-300 font-bold text-slate-800 cursor-pointer"
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
                <div className="absolute right-0 mt-2.5 w-40 rounded-xl bg-white border border-slate-100 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
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
          <div className="flex items-center gap-2 text-xs bg-emerald-100 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl font-semibold">
            🔑 Account Identity: {currentUser.role.replace('_', ' ')}
          </div>
          <button
            onClick={() => {
              setProfileActiveTab('details');
              setShowProfileModal(true);
            }}
            className="flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
          >
            👤 My Profile & Billing
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Registration block if needed */}
        {!isRegistered && (
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-md max-w-xl mx-auto space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <UserPlus className="text-emerald-600" size={16} /> Online Customer Registration Portal
            </h3>
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Aniruddha Nakwa"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="aniruddha@gmail.com"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d]/g, '');
                    setRegPhone(val.slice(0, 10));
                  }}
                  maxLength={10}
                  placeholder="e.g. mobile number"
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Delivery Address (Flat, Tower, Society)</label>
                <textarea
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Tower B, Flat 502, Horizon Heights, Pune"
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs"
              >
                Register & Initialize Account
              </button>
            </form>
          </div>
        )}

        {/* Main Tab Controller Bar if Registered */}
        {isRegistered && (
          <div className="flex flex-wrap items-center justify-center gap-2 bg-white p-2 rounded-2xl border border-emerald-100 shadow-sm max-w-3xl mx-auto mb-6">
            <button
              onClick={() => setDashboardTab('plan')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dashboardTab === 'plan'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar size={15} />
              <div className="text-left">
                <p className="leading-none text-xs font-bold">My Subscription</p>
                <p className="text-[9px] opacity-80 font-normal mt-0.5">सब्स्क्रिप्शन विवरण</p>
              </div>
            </button>

            <button
              onClick={() => setDashboardTab('extra')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dashboardTab === 'extra'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag size={15} />
              <div className="text-left">
                <p className="leading-none text-xs font-bold">Order Extras</p>
                <p className="text-[9px] opacity-80 font-normal mt-0.5">अतिरिक्त आइटम</p>
              </div>
            </button>

            <button
              onClick={() => setDashboardTab('track')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                dashboardTab === 'track'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Truck size={15} />
              {activeTrackingOrder && activeTrackingOrder.status !== 'delivered' && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
              <div className="text-left">
                <p className="leading-none text-xs font-bold">Track Delivery</p>
                <p className="text-[9px] opacity-80 font-normal mt-0.5">लाइव ट्रैकिंग</p>
              </div>
            </button>

            <button
              onClick={() => setDashboardTab('explore')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dashboardTab === 'explore'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Store size={15} />
              <div className="text-left">
                <p className="leading-none text-xs font-bold">Explore Kitchens</p>
                <p className="text-[9px] opacity-80 font-normal mt-0.5">रसोई खोजें</p>
              </div>
            </button>
          </div>
        )}

        {/* Dynamic Tab Content Modules */}
        {isRegistered && dashboardTab === 'plan' && (
          <div className="space-y-6">
            {mySubscriptions.length === 0 && renderUnlockPrompt()}
            {mySubscriptions.length > 0 && (
              <>
            
            {/* Tiffin Delivery Matrix - Attendance Tracker Board */}
            {(() => {
              const sub = mySubscriptions[0];
              const subMatrix = getSubscriptionAttendanceMatrix(sub, myOrders);
              
              const deliveredCount = subMatrix.filter(d => d.status === 'delivered').length;
              const missedCount = subMatrix.filter(d => d.status === 'missed').length;
              const pendingCount = subMatrix.filter(d => d.status === 'pending').length;

              return (
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-100 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
                        <Calendar className="text-emerald-500" size={16} /> 
                        My Subscription Tiffin Attendance Row
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Tracking daily hotbox deliveries for <strong className="text-slate-700">{tText(sub.packageName)}</strong> ({sub.billingCycle === 'weekly' ? 'Weekly' : 'Monthly'} Plan)
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-100">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span> Taken (Delivered): {deliveredCount}
                      </span>
                      <span className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-bold border border-rose-100">
                        <span className="h-1.5 w-1.5 bg-rose-500 rounded-full"></span> Missed / Blank: {missedCount}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full font-bold border border-slate-100">
                        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full"></span> Pending: {pendingCount}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Row Matrix */}
                  <div className="overflow-x-auto pb-2 -mx-1 px-1">
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
                          bgClass = 'bg-emerald-50/50 hover:bg-emerald-50';
                          textClass = 'text-slate-700';
                          borderClass = 'border-emerald-200 border-dashed animate-pulse';
                          icon = <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>;
                        } else {
                          bgClass = 'bg-slate-50 opacity-60';
                          textClass = 'text-slate-400';
                          borderClass = 'border-slate-100';
                        }

                        const isToday = day.dateStr === getTodayDateStr();

                        return (
                          <div
                            key={day.dayNum}
                            className={`p-3 rounded-2xl border flex flex-col justify-between items-center w-20 h-24 text-center transition-all ${bgClass} ${textClass} ${borderClass} ${
                              isToday ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                            }`}
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
            })()}

            {/* Safe Smart-Debit Bank Mandate Control Center */}
            {mySubscriptions[0]?.paymentMethod === 'bank_mandate' && (
              <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
                      <span>🏦 {tText("Bank Auto-Debit Mandate (Daily Release)")}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {tText("Your funds are safely locked in your bank account, releasing only daily portions upon delivery validation.")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      mySubscriptions[0].mandateStatus === 'authorized'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${mySubscriptions[0].mandateStatus === 'authorized' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {tText(mySubscriptions[0].mandateStatus === 'authorized' ? "authorized" : "paused")}
                    </span>
                    <button
                      onClick={() => toggleMandateStatus(mySubscriptions[0].id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        mySubscriptions[0].mandateStatus === 'authorized'
                          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100/55'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/55'
                      }`}
                    >
                      {mySubscriptions[0].mandateStatus === 'authorized' ? "⏸ " + tText("Pause Mandate") : "▶ " + tText("Resume Mandate")}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tText("Bank Mandate Authorized")}</p>
                    <p className="font-extrabold text-slate-800 mt-1.5">{tText(mySubscriptions[0].mandateDetails?.bankName)}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">A/C: **** **** {mySubscriptions[0].mandateDetails?.accountNumLast4}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tText("Daily Debit Cap")}</p>
                    <p className="font-extrabold text-slate-800 mt-1.5 font-mono text-sm">₹{mySubscriptions[0].mandateDetails?.maxDailyDebitLimit}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{tText("Safety limit threshold")}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tText("Daily Release Rate")}</p>
                    <p className="font-extrabold text-slate-800 mt-1.5 font-mono text-sm">₹{mySubscriptions[0].mandateDetails?.dailyReleaseRate}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{tText("Transfers on delivery")}</p>
                  </div>
                  <div className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{tText("Total Safe Released")}</p>
                    <p className="font-extrabold text-emerald-700 mt-1.5 font-mono text-sm">₹{mySubscriptions[0].mandateDetails?.totalReleasedAmount}</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">{tText("Paid from Mandate pool")}</p>
                  </div>
                </div>

                {/* Ledger Log */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">{tText("Daily Payment Records")}</p>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                    {(() => {
                      const sub = mySubscriptions[0];
                      const subMatrix = getSubscriptionAttendanceMatrix(sub, myOrders);
                      return subMatrix.map((day) => {
                        if (day.status === 'delivered') {
                          return (
                            <div key={day.dayNum} className="flex justify-between items-center text-[10px] py-1 px-3 bg-emerald-50/20 text-emerald-800 rounded-lg border border-emerald-100/50">
                              <span className="font-medium">Day {day.dayNum} ({day.dateStr}) — {tText("Delivered")}</span>
                              <span className="font-bold font-mono text-emerald-700 font-extrabold">₹{sub.mandateDetails?.dailyReleaseRate} Auto-Debit Success ✓</span>
                            </div>
                          );
                        } else if (day.status === 'missed') {
                          return (
                            <div key={day.dayNum} className="flex justify-between items-center text-[10px] py-1 px-3 bg-rose-50/20 text-rose-800 rounded-lg border border-rose-100/50">
                              <span className="font-medium">Day {day.dayNum} ({day.dateStr}) — {tText("Missed / Blank")}</span>
                              <span className="font-bold font-mono text-rose-600 font-extrabold">₹0 No-Debit Hold ⏸</span>
                            </div>
                          );
                        } else {
                          return (
                            <div key={day.dayNum} className="flex justify-between items-center text-[10px] py-1 px-3 bg-slate-50 text-slate-500 rounded-lg border border-slate-100">
                              <span className="font-medium">Day {day.dayNum} ({day.dateStr}) — {tText("Pending")}</span>
                              <span className="font-semibold font-mono text-slate-400 font-extrabold">₹0 Pending Delivery ⌛</span>
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Wallet & Subscription Control Center */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wallet Credits Balance Card */}
              <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
                    <Award className="text-emerald-500" size={16} /> 
                    Simulated Wallet Credits
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                    Active Balance
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Available Balance</p>
                    <p className="text-2xl font-black font-mono text-emerald-800 mt-1">
                      ₹{currentUser?.creditsBalance !== undefined ? currentUser.creditsBalance : 0}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        addCredits(500);
                        logTransaction('topup', 'Wallet Credits Top-Up', 500, 'UPI');
                        alert('Added ₹500 credits to your wallet!');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                    >
                      ＋ Top-Up ₹500
                    </button>
                    <button
                      onClick={() => {
                        addCredits(1000);
                        logTransaction('topup', 'Wallet Credits Top-Up', 1000, 'UPI');
                        alert('Added ₹1000 credits to your wallet!');
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                    >
                      ＋ Top-Up ₹1,000
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Wallet credits can be used for subscriptions, scheduling guest plates, or buying premium add-on items with a 10% instant checkout discount.
                </p>
              </div>

              {/* Subscription State & Location Diversion Card */}
              <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
                    <MapPin className="text-emerald-500" size={16} /> 
                    Subscription Status & Diversion
                  </h3>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                    mySubscriptions[0]?.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : mySubscriptions[0]?.status === 'paused'
                      ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {mySubscriptions[0]?.status || 'no plan'}
                  </span>
                </div>

                {mySubscriptions[0] ? (
                  <div className="space-y-4">
                    {/* Subscription Pause / Cancel Buttons */}
                    <div className="flex items-center gap-2">
                      {mySubscriptions[0].status === 'active' ? (
                        <button
                          onClick={() => {
                            updateSubscriptionStatus(mySubscriptions[0].id, 'paused');
                            alert('Subscription paused successfully. Active orders for today are suspended.');
                          }}
                          className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                        >
                          ⏸ Pause Subscription
                        </button>
                      ) : mySubscriptions[0].status === 'paused' ? (
                        <button
                          onClick={() => {
                            updateSubscriptionStatus(mySubscriptions[0].id, 'active');
                            alert('Subscription resumed successfully. Hot fresh tiffins are back on track!');
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                        >
                          ▶ Resume Subscription
                        </button>
                      ) : null}

                      {mySubscriptions[0].status !== 'cancelled' ? (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel your tiffin plan subscription?')) {
                              updateSubscriptionStatus(mySubscriptions[0].id, 'cancelled');
                              alert('Subscription cancelled successfully.');
                            }
                          }}
                          className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                        >
                          Cancel Plan
                        </button>
                      ) : (
                        <p className="text-xs text-rose-500 font-bold py-1">Plan has been cancelled.</p>
                      )}
                    </div>

                    {/* Diversion address request form */}
                    {mySubscriptions[0].status === 'active' && (
                      <div className="border-t border-slate-100 pt-3 space-y-2.5">
                        <div>
                          <p className="text-[11px] font-bold text-slate-700">🔄 Divert Tiffin to Other Location</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Need today's hotbox sent to your office or a friend's place? Divert it! Requires kitchen owner approval first.</p>
                        </div>
                        
                        {mySubscriptions[0].diversionRequest ? (
                          <div className={`p-2.5 rounded-xl border text-[11px] ${
                            mySubscriptions[0].diversionRequest.status === 'pending'
                              ? 'bg-amber-50 border-amber-100 text-amber-800'
                              : mySubscriptions[0].diversionRequest.status === 'approved'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-medium'
                              : 'bg-rose-50 border-rose-100 text-rose-800'
                          }`}>
                            <div className="flex justify-between items-center font-bold text-[10px] uppercase">
                              <span>DIVERSION REQUESTED:</span>
                              <span className="underline">{mySubscriptions[0].diversionRequest.status}</span>
                            </div>
                            <p className="mt-1 font-mono break-all text-xs">New: {mySubscriptions[0].diversionRequest.newAddress}</p>
                            {mySubscriptions[0].diversionRequest.status === 'approved' && (
                              <p className="text-[9px] text-emerald-600 font-bold mt-1">✓ Approved! Delivery route updated automatically.</p>
                            )}
                          </div>
                        ) : null}

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Type temporary address..."
                            value={divAddress}
                            onChange={(e) => setDivAddress(e.target.value)}
                            className="flex-1 text-xs border border-emerald-100 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-emerald-500 text-slate-800"
                          />
                          <button
                            onClick={() => {
                              if (!divAddress.trim()) return;
                              requestDiversion(mySubscriptions[0].id, divAddress);
                              alert('Diversion request submitted to Kitchen owner. Please await approval!');
                              setDivAddress('');
                            }}
                            className="px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Please choose a kitchen package below to subscribe and unlock this control center!</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )}

        {isRegistered && dashboardTab === 'extra' && (
          <div className="space-y-6">
            {mySubscriptions.length === 0 && renderUnlockPrompt()}
            {mySubscriptions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            
            {/* Guest Plate Adder Calendar Box */}
            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-emerald-100 pb-3">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                <Calendar className="text-emerald-500" size={16} /> Guest Plate Scheduler Calendar
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Hosting family or friends? Instantly schedule additional guest tiffin plates for specific calendar dates. Standard rate: <strong>₹150.00/plate</strong>.
              </p>
              {activeKitchen && (
                <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-[10px] text-amber-800 flex justify-between items-center">
                  <span>⏱️ <strong>Daily Guest Cut-off:</strong></span>
                  <span className="font-bold font-mono bg-white px-2 py-0.5 rounded shadow-sm text-xs text-amber-700">{activeKitchen.guestWindowCloseTime || '09:30 AM'}</span>
                </div>
              )}

              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Select Scheduled Date</label>
                  <input
                    type="date"
                    value={guestPlatesDate}
                    onChange={(e) => setGuestPlatesDate(e.target.value)}
                    className="w-full border border-emerald-100 rounded-lg p-2 bg-emerald-50/20 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Number of Guests</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={guestPlatesCount}
                      onChange={(e) => setGuestPlatesCount(Number(e.target.value))}
                      className="w-full border border-emerald-100 rounded-lg p-2 bg-emerald-50/20 text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Preference</label>
                    <div className="flex gap-2 mt-2">
                      <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={guestVegOnly}
                          onChange={(e) => setGuestVegOnly(e.target.checked)}
                          className="accent-emerald-500"
                        /> Pure Veg
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Total Billing:</span>
                  <strong className="text-sm text-slate-900">₹{(guestPlatesCount * 150.0).toFixed(2)}</strong>
                </div>

                <button
                  onClick={() => handleAddGuestPlates(mySubscriptions[0].id)}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Confirm & Pay Extra Plates
                </button>
              </div>
            </div>

            {/* Premium Add-on treats boutique store */}
            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-emerald-100 pb-3">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                <ShoppingBag className="text-emerald-500" size={16} /> Daily Add-On Boutique Store
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Add cold items, double rotis, crunch papads, or extra sweet jamuns directly to your lunch box dispatch today!
              </p>
              {activeKitchen && (
                <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl text-[10px] text-emerald-800 flex justify-between items-center">
                  <span>⏱️ <strong>Daily Add-on Cut-off:</strong></span>
                  <span className="font-bold font-mono bg-white px-2 py-0.5 rounded shadow-sm text-xs text-emerald-700">{activeKitchen.addonWindowCloseTime || '10:30 AM'}</span>
                </div>
              )}

              <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                {addOns.map(add => {
                  const qty = addonCart[add.id] || 0;
                  return (
                    <div key={add.id} className="flex justify-between items-center p-2 rounded-lg border border-emerald-50 hover:bg-emerald-50/40 transition-colors text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{tText(add.name)}</p>
                        <p className="text-[10px] text-slate-500 font-mono">₹{add.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCartChange(add.id, -1)}
                          className="p-1.5 rounded-full bg-emerald-100/60 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="font-bold text-slate-950 font-mono text-[13px] w-4 text-center">{qty}</span>
                        <button
                          onClick={() => handleCartChange(add.id, 1)}
                          className="p-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-emerald-100 pt-3 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Cart total</p>
                  <strong className="text-sm text-slate-950 font-mono">
                    ₹{(Object.entries(addonCart) as [string, number][]).reduce((sum, [id, qty]) => {
                      const addon = addOns.find(a => a.id === id)!;
                      return sum + (addon.price * qty);
                    }, 0).toFixed(2)}
                  </strong>
                </div>
                <button
                  onClick={() => handlePurchaseAddons(mySubscriptions[0].id)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 text-xs transition-all cursor-pointer"
                >
                  Purchase and Append
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

      {isRegistered && dashboardTab === 'track' && (
          <div className="space-y-6">
            {mySubscriptions.length === 0 && renderUnlockPrompt()}
            {mySubscriptions.length > 0 && (
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Real-time Order Tracking Map or Ratings feedback */}
                <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-emerald-100 pb-3">
                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                <Truck className="text-blue-500" size={16} /> Real-Time Tiffin Box Progress
              </h3>

              {activeTrackingOrder ? (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center bg-emerald-50/20 p-3 rounded-xl border border-emerald-100/60">
                    <div>
                      <p className="font-bold text-slate-800">{tText(activeTrackingOrder.kitchenName)}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Order #{activeTrackingOrder.id}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100 uppercase font-extrabold tracking-wider animate-pulse">
                      {tText(activeTrackingOrder.status)}
                    </span>
                  </div>

                  {/* Today's Tiffin Box Contents & Extras */}
                  <div className="bg-gradient-to-r from-emerald-50/50 to-amber-50/30 p-4 rounded-2xl border border-emerald-100/70 space-y-3 shadow-xs">
                    <div className="flex justify-between items-center">
                      <p className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        🍱 Tiffin Box Contents & Extras (डब्बे की सामग्री)
                      </p>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Today's Meal Pack
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Base Meal */}
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100/40 shadow-xs flex items-start gap-2">
                        <span className="text-base shrink-0">🍲</span>
                        <div>
                          <p className="font-extrabold text-slate-900 leading-tight">
                            {tText(activeTrackingOrder.details.packageName)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-mono">
                            Base Plan • {activeTrackingOrder.mealType}
                          </p>
                        </div>
                      </div>

                      {/* Guest Plates */}
                      {activeTrackingOrder.details.guestPlatesCount > 0 && (
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-100/40 shadow-xs flex items-start gap-2">
                          <span className="text-base shrink-0">👥</span>
                          <div>
                            <p className="font-extrabold text-slate-900 leading-tight">
                              +{activeTrackingOrder.details.guestPlatesCount} Guest Plates
                            </p>
                            <p className="text-[10px] text-emerald-600 mt-0.5 font-bold uppercase font-mono">
                              Scheduled Guest Addon
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Extra Purchased Add-Ons list */}
                    <div className="border-t border-emerald-100/60 pt-2.5">
                      <p className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                        ✨ Extra Daily Add-On Orders (अतिरिक्त ऑर्डर्स):
                      </p>
                      {activeTrackingOrder.details.addOns && activeTrackingOrder.details.addOns.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {activeTrackingOrder.details.addOns.map((add: any, idx: number) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 font-extrabold px-3 py-1.5 rounded-xl border border-amber-200 text-[10px] shadow-sm animate-pulse"
                            >
                              <span className="bg-amber-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-black">
                                {add.quantity}
                              </span>
                              <span>{tText(add.name)}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white/60 p-2.5 rounded-xl border border-emerald-100/30 text-center text-[10px] text-slate-400 font-medium">
                          No extra accompaniments added to today's box yet. Choose premium treats from the shop panel below!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live GPS Route Tracking (Moved from Landing Page) */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                        <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">Live Delivery Track</span>
                      </div>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {activeTrackingOrder.status === 'delivered' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                        <Clock size={14} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">
                          {activeTrackingOrder.status === 'delivered' 
                            ? 'Delivered' 
                            : ['dispatched', 'out_for_delivery'].includes(activeTrackingOrder.status)
                            ? 'Arriving in 14 Mins'
                            : 'Arriving in 45 Mins'
                          }
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                          {activeTrackingOrder.status === 'delivered'
                            ? 'Your hotbox has been delivered safely outside your doorstep.'
                            : ['dispatched', 'out_for_delivery'].includes(activeTrackingOrder.status)
                            ? `Rider ${activeTrackingOrder.deliveryBoyName || 'Rahul Sharma'} is navigating to your address.`
                            : `Meal is being freshly simmered & sealed. Handover to rider shortly.`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Map Engine Toggle */}
                    <div className="flex justify-end">
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
                    </div>

                    {mapEngine === 'real' ? (
                      hasValidKey ? (
                        (() => {
                          const firstStep = activeTrackingOrder?.geoTags?.routeSteps?.[0];
                          const kitchenLoc = firstStep ? { lat: firstStep.lat, lng: firstStep.lng } : { lat: 18.5983, lng: 73.7431 };
                          const homeLoc = activeTrackingOrder?.geoTags 
                            ? { lat: activeTrackingOrder.geoTags.latitude, lng: activeTrackingOrder.geoTags.longitude } 
                            : { lat: 18.5204, lng: 73.8567 };

                          const stops = [
                            {
                              id: 'kitchen_stop',
                              name: activeTrackingOrder.kitchenName || 'Kitchen Hub',
                              address: 'Annapurna Main Kitchen',
                              lat: kitchenLoc.lat,
                              lng: kitchenLoc.lng,
                              type: 'kitchen' as const,
                            },
                            {
                              id: 'home_stop',
                              name: 'Your Home Address',
                              address: currentUser.customerAddress || 'Customer Residence',
                              lat: homeLoc.lat,
                              lng: homeLoc.lng,
                              type: 'customer' as const,
                              status: activeTrackingOrder.status,
                            }
                          ];

                          const getRiderLoc = () => {
                            if (activeTrackingOrder.status === 'delivered') {
                              return homeLoc;
                            }
                            if (!['dispatched', 'out_for_delivery'].includes(activeTrackingOrder.status)) {
                              return kitchenLoc;
                            }
                            if (activeTrackingOrder.geoTags?.routeSteps) {
                              const steps = activeTrackingOrder.geoTags.routeSteps;
                              const completed = steps.filter(s => s.isCompleted).length;
                              const stepPct = steps.length > 0 ? completed / steps.length : 0.5;
                              return {
                                lat: kitchenLoc.lat + (homeLoc.lat - kitchenLoc.lat) * stepPct,
                                lng: kitchenLoc.lng + (homeLoc.lng - kitchenLoc.lng) * stepPct,
                              };
                            }
                            return {
                              lat: (kitchenLoc.lat + homeLoc.lat) / 2,
                              lng: (kitchenLoc.lng + homeLoc.lng) / 2,
                            };
                          };

                          return (
                            <RealGoogleMap
                              stops={stops}
                              riderLatLng={getRiderLoc()}
                              mapViewMode="batch"
                              height="260px"
                            />
                          );
                        })()
                      ) : (
                        <GoogleMapsSetupSplash onBackToMock={() => setMapEngine('mock')} />
                      )
                    ) : (
                      /* Tiny simulated map */
                      <>
                        <style>{`
                          @keyframes map-dash {
                            to {
                              stroke-dashoffset: -20;
                            }
                          }
                          .animate-map-dash {
                            stroke-dasharray: 6 4;
                            animation: map-dash 1s linear infinite;
                          }
                        `}</style>
                        <div className="h-36 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center shadow-inner shadow-black/60">
                          {/* Grid background */}
                          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-70"></div>
                          
                          <svg className="absolute inset-0 w-full h-full text-slate-800" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
                            {/* Street lines */}
                            <line x1="0" y1="30" x2="300" y2="30" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" />
                            <line x1="0" y1="70" x2="300" y2="70" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" />
                            <line x1="0" y1="100" x2="300" y2="100" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" />
                            <line x1="60" y1="0" x2="60" y2="120" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" />
                            <line x1="180" y1="0" x2="180" y2="120" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" />
                            <line x1="240" y1="0" x2="240" y2="120" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" />
                            
                            {/* Rivers/Parks */}
                            <rect x="10" y="45" width="40" height="20" fill="#10b981" fillOpacity="0.12" rx="4" />
                            <rect x="200" y="10" width="35" height="40" fill="#10b981" fillOpacity="0.12" rx="4" />
                            
                            {/* Main Road Route Path underlay */}
                            <path d="M 40 40 Q 110 20 170 70 T 260 80" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M 40 40 Q 110 20 170 70 T 260 80" fill="none" stroke="#334155" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            
                            {/* Active Route path */}
                            {activeTrackingOrder.status !== 'delivered' ? (
                              <path
                                d="M 40 40 Q 110 20 170 70 T 260 80"
                                fill="none"
                                stroke="#f97316"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="animate-map-dash"
                              />
                            ) : (
                              <path
                                d="M 40 40 Q 110 20 170 70 T 260 80"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}

                            {/* Animated Rider Marker along the path */}
                            {activeTrackingOrder.status !== 'delivered' && (
                              <g>
                                {/* Blue pulsing circle aura around rider */}
                                <circle r="8" fill="#3b82f6" fillOpacity="0.3" className="animate-ping" style={{ animationDuration: '2s' }} />
                                {/* Inner Rider Dot/Marker */}
                                <circle r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                                <animateMotion
                                  dur="8s"
                                  repeatCount="indefinite"
                                  path="M 40 40 Q 110 20 170 70 T 260 80"
                                />
                              </g>
                            )}
                          </svg>
                          
                          {/* Kitchen Marker */}
                          <div className="absolute left-[13%] top-[33%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 border border-white shadow-lg flex items-center justify-center text-[9px] font-black text-white">
                              K
                            </div>
                            <span className="text-[7px] text-emerald-400 font-bold mt-0.5 bg-slate-900/85 px-1 rounded">Kitchen</span>
                          </div>
                          
                          {/* Customer / Home Marker */}
                          <div className="absolute left-[87%] top-[67%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full border border-white shadow-lg flex items-center justify-center text-[9px] font-black text-white ${
                              activeTrackingOrder.status === 'delivered' ? 'bg-emerald-500 ring-4 ring-emerald-500/30' : 'bg-slate-600'
                            }`}>
                              H
                            </div>
                            <span className="text-[7px] text-emerald-400 font-bold mt-0.5 bg-slate-900/85 px-1 rounded">Home</span>
                          </div>

                          {/* Top status indicator overlays */}
                          <div className="absolute top-2 left-2 flex gap-1.5 pointer-events-none">
                            <span className="text-[8px] bg-slate-900/90 border border-slate-800 text-white font-mono font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${activeTrackingOrder.status === 'delivered' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></span>
                              {activeTrackingOrder.status === 'delivered' ? 'Delivered' : 'Live GPS'}
                            </span>
                          </div>
                          
                          <span className="absolute bottom-2 right-2 text-[8px] bg-slate-900/90 border border-slate-800 text-white font-mono font-bold px-1.5 py-0.5 rounded shadow">
                            GPS Active Walkthrough
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Visual Stepper bar */}
                  <div className="space-y-3.5 pl-2 relative">
                    <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-slate-200"></div>

                    {/* Step 1 */}
                    <div className="flex items-start gap-3 relative z-10">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        ['placed', 'cooking', 'ready_for_dispatch', 'dispatched', 'out_for_delivery', 'delivered'].includes(activeTrackingOrder.status)
                          ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        1
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Order Dispatched</p>
                        <p className="text-[10px] text-slate-500">Tiffin request accepted by kitchen cooks.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3 relative z-10">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        ['cooking', 'ready_for_dispatch', 'dispatched', 'out_for_delivery', 'delivered'].includes(activeTrackingOrder.status)
                          ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                      }`}>
                        2
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Simmering on stove</p>
                        <p className="text-[10px] text-slate-500">Cooks preparing, sealing, and thermal-packing containers.</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3 relative z-10">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        ['dispatched', 'out_for_delivery', 'delivered'].includes(activeTrackingOrder.status)
                          ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        3
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Out with delivery rider</p>
                        <p className="text-[10px] text-slate-500">Rider {activeTrackingOrder.deliveryBoyName || 'assigned'} navigating route with geo-tags.</p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-3 relative z-10">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        activeTrackingOrder.status === 'delivered' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        4
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Arrived at doorstep</p>
                        <p className="text-[10px] text-slate-500">Delivered secure and hot outside your flat gate.</p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Receipt QR Verification Panel */}
                  {['out_for_delivery', 'dispatched'].includes(activeTrackingOrder.status) && (
                    <div className="bg-emerald-50 border border-emerald-200/50 p-4 rounded-2xl space-y-3 shadow-sm my-4">
                      <div className="flex items-start gap-2.5">
                        <div className="bg-emerald-500 text-white p-2 rounded-xl shrink-0">
                          <QrCode size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-950 text-xs">Dynamic Receipt QR Active</h4>
                          <p className="text-[10px] text-emerald-800 mt-0.5 leading-relaxed">
                            Rider {activeTrackingOrder.deliveryBoyName || 'Rahul'} will display a dynamic secure QR code. Scan it or enter the 4-digit PIN to receive your hotbox.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsScanning(true);
                          setScanError(null);
                          setScanSuccess(false);
                          setManualOtp('');
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-[11px] font-bold rounded-xl transition-all shadow-md shadow-emerald-100/60 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Camera size={13} />
                        Scan QR to Receive Tiffin
                      </button>
                    </div>
                  )}

                  {/* If delivered, allow rating directly on spot! */}
                  {activeTrackingOrder.status === 'delivered' && (
                    <div className="border-t border-emerald-100 pt-3.5 space-y-3 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/60">
                      <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Smile size={16} className="text-emerald-600" /> Rate Today's Meal Box!
                      </p>
                      <p className="text-[10px] text-slate-600">Your live ratings directly optimize chef rankings on the dashboard.</p>
                      
                      <div className="flex gap-1.5 items-center justify-center">
                        {[1, 2, 3, 4, 5].map(stars => (
                          <button
                            key={stars}
                            onClick={() => setFeedbackRating(stars)}
                            className="p-1 rounded transition-transform hover:scale-125 cursor-pointer"
                          >
                            <Star
                              size={20}
                              className={stars <= feedbackRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                            />
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="e.g. Delicious paneer bhurji, extra hot!"
                          className="flex-1 border border-emerald-100 rounded-lg p-2 bg-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => handleFeedbackSubmit(activeTrackingOrder.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Submit
                        </button>
                      </div>

                      {feedbackSubmittedId === activeTrackingOrder.id && (
                        <p className="text-center text-[10px] text-emerald-700 font-bold">Feedback submitted successfully! Thank you.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No active tracking shipments dispatched right now.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    {/* Explore Kitchens Tab Module */}
        {isRegistered && dashboardTab === 'explore' && (
          <div className="space-y-6">
            
            {/* Bulk & On-Demand Order Requirements Hub */}
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-50 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-slate-900 rounded-full"></span>
                  📦 Bulk & On-Demand Requirements Hub (थोक ऑर्डर मांग)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Need custom party catering, 50+ chapatis, or special family-sized handis? Direct transmit your requirements to kitchens.
                </p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full font-bold border border-emerald-100 shrink-0">
                Active Kitchens: {kitchens.filter(k => k.acceptsBulkOrders).length}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-slate-800">
              {/* Partner Kitchen Selector list */}
              <div className="lg:col-span-4 space-y-3">
                <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                  1. Select Kitchen to Order Bulk:
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {kitchens.filter(k => k.acceptsBulkOrders).map(kit => (
                    <div key={kit.id} className="bg-emerald-50/25 p-3 rounded-2xl border border-emerald-100/60 flex justify-between items-center shadow-sm">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-800 truncate">{tText(kit.name)}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">📍 {tText(kit.address)}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBulkKitchenId(kit.id);
                          const initialCart: { [id: string]: number } = {};
                          (kit.bulkMenu || []).forEach(item => {
                            initialCart[item.id] = 0;
                          });
                          setBulkCart(initialCart);
                          setBulkOrderSuccess(false);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[10px] cursor-pointer shrink-0 transition-colors shadow-sm"
                      >
                        Order Bulk
                      </button>
                    </div>
                  ))}
                  {kitchens.filter(k => k.acceptsBulkOrders).length === 0 && (
                    <p className="text-center py-4 text-slate-400 text-xs">No kitchens are currently accepting bulk requests.</p>
                  )}
                </div>
              </div>

              {/* Requirement History with Statuses */}
              <div className="lg:col-span-8 space-y-3">
                <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                  2. Transmitted Requirements Status:
                </h3>

                {bulkOrders.filter(o => o.customerId === currentUser.id).length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400">
                    <p className="text-xs font-semibold">No bulk requirements transmitted yet.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Select a kitchen on the left to specify quantities and transmit your request.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-emerald-100/60 rounded-2xl bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-emerald-100 text-slate-400 font-bold">
                          <th className="py-2.5 px-3">Req ID</th>
                          <th className="py-2.5 px-3">Kitchen Name</th>
                          <th className="py-2.5 px-3">Requested Items</th>
                          <th className="py-2.5 px-3">Delivery Slot</th>
                          <th className="py-2.5 px-3">Grand Total</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkOrders.filter(o => o.customerId === currentUser.id).map(order => {
                          let statusColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                          let statusLabel = 'Awaiting Kitchen';
                          if (order.status === 'accepted') {
                            statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                            statusLabel = 'Approved/Preparing';
                          }
                          if (order.status === 'delivered') {
                            statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            statusLabel = 'Delivered ✓';
                          }
                          if (order.status === 'rejected') {
                            statusColor = 'bg-red-50 text-red-700 border-red-200';
                            statusLabel = 'Rejected ✕';
                          }

                          return (
                            <tr key={order.id} className="border-b border-emerald-50/40 hover:bg-emerald-50/10">
                              <td className="py-3 px-3 font-mono font-bold text-slate-500">#{order.id.slice(-6)}</td>
                              <td className="py-3 px-3 font-semibold text-slate-900">{tText(order.kitchenName)}</td>
                              <td className="py-3 px-3">
                                <div className="space-y-0.5">
                                  {order.items.map((it, idx) => (
                                    <div key={idx} className="text-slate-600 text-[11px]">
                                      • {it.name} <strong className="text-slate-800">x{it.quantity} {it.unit}</strong>
                                    </div>
                                  ))}
                                  {order.notes && (
                                    <p className="text-[10px] text-slate-400 italic max-w-[180px] truncate" title={order.notes}>
                                      💬 {order.notes}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-500">
                                <div className="text-slate-700">📅 {order.deliveryDate}</div>
                                <div className="text-[10px] text-slate-400">🕐 {order.deliveryTime}</div>
                              </td>
                              <td className="py-3 px-3 font-black text-slate-800 font-mono">₹{order.totalAmount.toFixed(2)}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscribe Market Center - Kitchen Grid */}
          <div className="space-y-6" id="market-center">
          
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
                  Browse Available Tiffin Service Providers
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">Discover, filter and subscribe to top home-cooked tiffins near you.</p>
              </div>
              
              {/* GPS Selector */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center gap-1.5 bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2 shrink-0">
                  <MapPin className="text-emerald-500 shrink-0" size={15} />
                  <span className="text-slate-500 font-medium text-[11px]">Your Area:</span>
                  <select
                    value={userArea}
                    onChange={(e) => setUserArea(e.target.value)}
                    className="bg-transparent text-slate-800 font-extrabold text-[11px] focus:outline-none cursor-pointer"
                  >
                    {Object.keys(AREA_COORDINATES).map(areaName => (
                      <option key={areaName} value={areaName}>{areaName}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="button"
                  disabled={isDetectingLocation}
                  onClick={handleDetectLocation}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-extrabold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-100 cursor-pointer shrink-0"
                >
                  <Navigation size={12} className={isDetectingLocation ? "animate-spin" : ""} />
                  {isDetectingLocation ? "Detecting GPS..." : "Detect Location"}
                </button>
              </div>
            </div>

            {locationSuccessMsg && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl px-4 py-2.5 text-[11px] font-bold flex items-center gap-2 animate-fade-in">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                {locationSuccessMsg}
              </div>
            )}

            {/* Filter controls row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-emerald-50 text-xs">
              
              {/* Search Bar */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Search Dishes or Kitchens</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search e.g. Paneer, Butter Chicken..."
                    className="w-full border border-emerald-100 rounded-xl py-2 pl-8 pr-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <Search size={14} className="text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Cuisine Filter Tabs */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Dietary Preference</label>
                <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl">
                  {(['all', 'pure-veg', 'veg-nonveg'] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setCuisineFilter(pref)}
                      className={`flex-1 py-1.5 text-center font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer ${
                        cuisineFilter === pref 
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-100' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {pref === 'all' ? 'All' : pref === 'pure-veg' ? 'Pure Veg' : 'Veg/Non-Veg'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Distance Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Delivery Distance Radius</label>
                  <span className="text-[11px] font-bold text-emerald-600 font-mono">{maxDistance} km</span>
                </div>
                <div className="flex items-center gap-2 pt-1.5">
                  <Sliders size={13} className="text-slate-400" />
                  <input
                    type="range"
                    min={2}
                    max={25}
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* Sorting Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Sort Kitchens By</label>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full border border-emerald-100 rounded-xl p-2 bg-white text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="distance">📍 Distance: Nearest First</option>
                  <option value="rating">⭐️ Rating: Highest First</option>
                  <option value="price">💵 Subscription Price: Lowest First</option>
                </select>
              </div>

            </div>

          </div>

          {/* Kitchen Grid list */}
          {filteredKitchens.length === 0 ? (
            <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-12 text-center space-y-3">
              <p className="text-slate-400 text-sm font-semibold">No kitchens matching your filters found near {userArea}.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCuisineFilter('all');
                  setMaxDistance(25);
                }}
                className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Reset All Filter Preferences
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredKitchens.map((kit) => (
                <div key={kit.id} className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-emerald-200/80 transition-all flex flex-col justify-between">
                  <div>
                    <div className="relative">
                      <img
                        src={kit.imageUrl}
                        alt={tText(kit.name)}
                        className="w-full h-44 object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-extrabold flex items-center gap-1">
                        📍 {kit.distance} km away
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          kit.cuisineType === 'pure-veg' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {tText(kit.cuisineType === 'pure-veg' ? 'Pure Veg' : 'Veg / Non-Veg')}
                        </span>
                        <div className="flex items-center gap-1 text-slate-900 font-semibold text-xs">
                          <Star className="text-amber-400 fill-amber-400" size={13} />
                          {kit.rating} <span className="text-slate-400 font-normal">({kit.reviewsCount})</span>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-slate-800 text-base">{tText(kit.name)}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed truncate-3-lines">{tText(kit.description)}</p>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                        <span className="truncate max-w-[200px]" title={kit.address}>🏠 {tText(kit.address)}</span>
                      </div>

                      <div className="border-t border-emerald-50 pt-3.5 space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Weekly Menu Board preview:</p>
                          <span className="text-[10px] text-slate-500 font-bold font-mono">Starts ₹{kit.packages[0]?.priceWeekly}/wk</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                          {kit.weeklyMenu.slice(0, 4).map(m => (
                            <div key={m.day} className="flex items-center gap-1 text-left font-medium">
                              <span className="font-bold text-[10px] text-slate-400">{i18n.language === 'en' ? m.day.slice(0,3) : tText(m.day)}:</span>
                              <span className="truncate max-w-[90px]" title={m.items.join(', ')}>{tText(m.items[0])}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 border-t border-emerald-50 bg-emerald-50/20 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        setSelectedKitchenId(kit.id);
                        setSelectedPkg(kit.packages[0]);
                      }}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-100/60 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Subscribe Meal Plans <ChevronRight size={14} />
                    </button>
                    {kit.acceptsBulkOrders && (
                      <button
                        onClick={() => {
                          setSelectedBulkKitchenId(kit.id);
                          const initialCart: { [id: string]: number } = {};
                          (kit.bulkMenu || []).forEach(item => {
                            initialCart[item.id] = 0;
                          });
                          setBulkCart(initialCart);
                          setBulkOrderSuccess(false);
                        }}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-800"
                      >
                        📦 Bulk/Demand Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

    {/* Invoice & Order History Section */}
    {isRegistered && dashboardTab === 'plan' && (
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-emerald-50 pb-3">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
              My Invoice & Order History
            </h2>
            <span className="text-xs text-slate-400 font-mono">Real-time DB synchronized</span>
          </div>
          
          {myOrders.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">You don't have any placed orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-100 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Kitchen Name</th>
                    <th className="py-2.5 px-3">Package / Meal</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myOrders.map(o => (
                    <tr key={o.id} className="border-b border-emerald-50/50 hover:bg-emerald-50/10 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">#{o.id}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{tText(o.kitchenName)}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold">{tText(o.details.packageName)}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{o.mealType}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{o.date}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          o.status === 'cooking' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {tText(o.status)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => downloadInvoicePDF(o)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-1.5 text-[11px] ml-auto transition-all cursor-pointer shadow-sm"
                        >
                          <Download size={12} /> Invoice PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* Bulk Order placement modal */}
        {selectedBulkKitchenId && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-100 my-8">
              
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                    <ShoppingBag className="text-emerald-400" size={16} /> Place Bulk & On-Demand Order
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Order from: {tText(kitchens.find(k => k.id === selectedBulkKitchenId)?.name || '')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBulkKitchenId(null)}
                  className="text-slate-400 hover:text-white font-bold text-xl h-8 w-8 flex items-center justify-center hover:bg-white/10 rounded-full"
                >
                  ×
                </button>
              </div>

              {bulkOrderSuccess ? (
                <div className="p-10 text-center space-y-4 flex flex-col items-center text-slate-800">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-black animate-pulse">
                    ✓
                  </div>
                  <h3 className="text-lg font-extrabold">Bulk Order Requested!</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                    Your on-demand order request has been submitted to the kitchen owner for approval. You can track status updates in your dashboard.
                  </p>
                  <button
                    onClick={() => setSelectedBulkKitchenId(null)}
                    className="mt-4 px-6 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-800"
                  >
                    Done & View Status
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const targetKitchen = kitchens.find(k => k.id === selectedBulkKitchenId);
                  if (!targetKitchen) return;
                  
                  const orderedItems: { itemId: string; name: string; quantity: number; pricePerUnit: number; unit: string }[] = [];
                  let totalAmount = 0;
                  let hasMinQtyError = false;
                  let minQtyErrorText = '';

                  (targetKitchen.bulkMenu || []).forEach(item => {
                    const qty = bulkCart[item.id] || 0;
                    if (qty > 0) {
                      if (qty < item.minQuantity) {
                        hasMinQtyError = true;
                        minQtyErrorText = `Minimum order quantity for ${item.name} is ${item.minQuantity} ${item.unit}. You requested ${qty}.`;
                      }
                      orderedItems.push({
                        itemId: item.id,
                        name: item.name,
                        quantity: qty,
                        pricePerUnit: item.pricePerUnit,
                        unit: item.unit
                      });
                      totalAmount += item.pricePerUnit * qty;
                    }
                  });

                  if (orderedItems.length === 0) {
                    alert('Please select at least one item and specify quantity.');
                    return;
                  }

                  if (hasMinQtyError) {
                    alert(minQtyErrorText);
                    return;
                  }

                  setIsPlacingBulkOrder(true);
                  const ktName = kitchens.find(k => k.id === selectedBulkKitchenId)?.name || 'Kitchen';
                  setTimeout(() => {
                    placeBulkOrder(
                      selectedBulkKitchenId,
                      orderedItems,
                      totalAmount,
                      bulkDeliveryDate,
                      bulkDeliveryTime,
                      bulkNotes
                    );
                    logTransaction('bulk_order', `Bulk Order Requirements - ${ktName}`, totalAmount, 'UPI');
                    setIsPlacingBulkOrder(false);
                    setBulkOrderSuccess(true);
                  }, 1200);

                }} className="p-6 space-y-4 text-xs text-slate-800">
                  
                  <div className="space-y-2 max-h-[220px] overflow-y-auto bg-slate-50 border border-slate-100 rounded-2xl p-4 divide-y divide-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-1">On-Demand Menu Catalog:</p>
                    {(kitchens.find(k => k.id === selectedBulkKitchenId)?.bulkMenu || []).map((item) => (
                      <div key={item.id} className="py-2.5 flex justify-between items-center">
                        <div className="min-w-0 flex-1 pr-3">
                          <h5 className="font-bold text-slate-800 text-xs truncate">{item.name}</h5>
                          <p className="text-[10px] text-slate-500 font-medium">₹{item.pricePerUnit}/{item.unit} <span className="text-emerald-500 font-semibold">(Min: {item.minQuantity} {item.unit})</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = bulkCart[item.id] || 0;
                              const step = item.unit === 'pcs' ? 10 : 1;
                              const next = Math.max(0, curr - step);
                              setBulkCart(prev => ({ ...prev, [item.id]: next }));
                            }}
                            className="h-7 w-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:border-slate-300 shadow-sm active:scale-95"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-black text-slate-800 text-xs font-mono">
                            {bulkCart[item.id] || 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = bulkCart[item.id] || 0;
                              const step = item.unit === 'pcs' ? 10 : 1;
                              const next = curr === 0 ? item.minQuantity : curr + step;
                              setBulkCart(prev => ({ ...prev, [item.id]: next }));
                            }}
                            className="h-7 w-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:border-slate-300 shadow-sm active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    {(kitchens.find(k => k.id === selectedBulkKitchenId)?.bulkMenu || []).length === 0 && (
                      <p className="text-center py-4 text-slate-400 text-xs">No bulk menu items initialized by the kitchen owner.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Requested Delivery Date</label>
                      <input
                        type="date"
                        required
                        value={bulkDeliveryDate}
                        onChange={(e) => setBulkDeliveryDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Requested Delivery Time</label>
                      <select
                        value={bulkDeliveryTime}
                        onChange={(e) => setBulkDeliveryTime(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="12:00 PM">12:00 PM (Lunch)</option>
                        <option value="01:00 PM">01:00 PM (Lunch)</option>
                        <option value="02:00 PM">02:00 PM (Lunch)</option>
                        <option value="07:30 PM">07:30 PM (Dinner)</option>
                        <option value="08:30 PM">08:30 PM (Dinner)</option>
                        <option value="09:00 PM">09:00 PM (Dinner)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Special Instructions / Cooking Notes (Optional)</label>
                    <textarea
                      value={bulkNotes}
                      onChange={(e) => setBulkNotes(e.target.value)}
                      placeholder="e.g. Please make chapatis extra soft. Deliver in hot-insulated containers if possible."
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 h-16 resize-none focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-600">Calculated Grand Total:</span>
                      <p className="text-[10px] text-slate-400 font-medium">Includes standard kitchen handi premium</p>
                    </div>
                    <span className="text-xl font-black text-emerald-600 font-mono">
                      ₹{(() => {
                        let tot = 0;
                        const targetKitchen = kitchens.find(k => k.id === selectedBulkKitchenId);
                        if (targetKitchen) {
                          (targetKitchen.bulkMenu || []).forEach(item => {
                            const qty = bulkCart[item.id] || 0;
                            tot += qty * item.pricePerUnit;
                          });
                        }
                        return tot.toFixed(2);
                      })()}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isPlacingBulkOrder}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-extrabold rounded-2xl shadow-lg transition-all text-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isPlacingBulkOrder ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} /> Transmitting Request...
                      </>
                    ) : (
                      <>
                        Transmit On-Demand Requirement Request (भेजें)
                      </>
                    )}
                  </button>

                </form>
              )}
            </div>
          </div>
        )}

        {/* Subscribe Checkout Gateway Modal Overlay */}
        {selectedKitchenId && selectedPkg && selectedKitchen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-100">
              
              <div className="bg-gray-950 text-white p-5 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-sm">Secure Tiffin Checkout Gateway</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Subscribe to {tText(selectedKitchen.name)}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedKitchenId(null);
                    setSelectedPkg(null);
                  }}
                  className="text-slate-400 hover:text-white font-bold text-lg"
                >
                  ×
                </button>
              </div>

              {paySuccess ? (
                <div className="p-12 text-center space-y-4 flex flex-col items-center">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl animate-bounce font-bold">
                    ✓
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-800">Subscription Registered!</h3>
                  <p className="text-xs text-slate-500">Tiffin prepared on schedule. Packing dispatch sequence initiated.</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribeSubmit} className="p-6 space-y-4 text-xs">
                  
                  {/* Package switch selection tabs */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Select Meal Plan Package</label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedKitchen.packages.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPkg(p)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedPkg.id === p.id 
                              ? 'border-emerald-500 bg-emerald-50/40 text-slate-900 font-bold' 
                              : 'border-emerald-100 hover:border-emerald-200 text-slate-500'
                          }`}
                        >
                          <p className="font-bold">{tText(p.name)}</p>
                          <p className="text-[10px] font-mono mt-0.5 text-emerald-600">₹{p.priceMonthly}/monthly</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Billing Term & Meal Time cycle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Billing Cycle</label>
                      <select
                        value={billingCycle}
                        onChange={(e: any) => setBillingCycle(e.target.value)}
                        className="w-full border border-emerald-100 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="weekly">Weekly Term (₹{selectedPkg.priceWeekly})</option>
                        <option value="monthly">Monthly Term (₹{selectedPkg.priceMonthly})</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Preferred Meal Service</label>
                      <select
                        value={deliveryTime}
                        onChange={(e: any) => setDeliveryTime(e.target.value)}
                        className="w-full border border-emerald-100 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="lunch">Lunch Service (12:00 PM - 2:00 PM)</option>
                        <option value="dinner">Dinner Service (7:30 PM - 9:30 PM)</option>
                      </select>
                    </div>
                  </div>

                  {/* Delivery Location */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Doorstep Delivery Address</label>
                    <textarea
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Tower B, Flat 502, Horizon Heights, Pune"
                      className="w-full border border-emerald-100 rounded-lg p-2 bg-white text-slate-800 h-14 resize-none focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Payment Gateway Toggle */}
                  <div className="space-y-1 border-t border-emerald-100 pt-3">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-slate-700 block text-xs">Simulated Payment Channel</label>
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        🎁 10% Prepaid Advance Discount
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 mt-1.5">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('upi')}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            paymentMethod === 'upi' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-emerald-100 text-slate-600 text-[11px]'
                          }`}
                        >
                          <span className="text-sm">⚡</span>
                          <span className="text-[10px]">UPI (-10%)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            paymentMethod === 'card' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-emerald-100 text-slate-600 text-[11px]'
                          }`}
                        >
                          <CreditCard size={14} />
                          <span className="text-[10px]">Card (-10%)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('credits')}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            paymentMethod === 'credits' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' : 'border-emerald-100 text-slate-600 text-[11px]'
                          }`}
                        >
                          <Award size={14} />
                          <span className="text-[10px]">Credits (-10%)</span>
                        </button>
                      </div>

                      {paymentMethod === 'credits' && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Your Credits Balance:</span>
                            <span className="font-bold font-mono text-slate-800">₹{currentUser?.creditsBalance !== undefined ? currentUser.creditsBalance : 0}</span>
                          </div>
                          {(currentUser?.creditsBalance !== undefined ? currentUser.creditsBalance : 0) < Math.round((billingCycle === 'weekly' ? selectedPkg.priceWeekly : selectedPkg.priceMonthly) * 0.9) ? (
                            <div className="flex flex-col gap-2 pt-1">
                              <p className="text-[10px] text-red-500 font-medium">⚠️ Insufficient credits for this purchase.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  addCredits(1000);
                                  logTransaction('topup', 'Wallet Credits Top-Up', 1000, 'UPI');
                                }}
                                className="w-full py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition-colors"
                              >
                                ＋ Quick Top-Up ₹1,000 Credits
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10px] text-emerald-600 font-semibold">✓ Funds will be auto-debited instantly from your wallet balance.</p>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank_mandate')}
                        className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all cursor-pointer ${
                          paymentMethod === 'bank_mandate' ? 'border-emerald-500 bg-emerald-50 text-slate-900' : 'border-emerald-100 text-slate-600 hover:border-emerald-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                          🏦 {tText("Bank Auto-Debit Mandate (Daily Release)")}
                          <span className="bg-emerald-500 text-white text-[8px] font-extrabold uppercase px-1 rounded">Safest & Recommended</span>
                        </span>
                        <p className="text-[10px] text-slate-500 text-left font-normal mt-1">
                          No prepaid pressure. Funds stay booked in your bank, releasing only daily portion (₹{billingCycle === 'weekly' ? Math.round((selectedPkg?.priceWeekly || 0) / 7) : Math.round((selectedPkg?.priceMonthly || 0) / 30)}/day) upon successful delivery. Pause anytime!
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-emerald-100 pt-4 flex justify-between items-center bg-emerald-50/10 -mx-6 -mb-6 p-6">
                    <div>
                      <p className="text-[10px] text-slate-500">Order total due:</p>
                      <strong className="text-base text-slate-900 font-mono font-bold text-emerald-600">
                        ₹{paymentMethod === 'bank_mandate' 
                          ? (billingCycle === 'weekly' ? selectedPkg.priceWeekly : selectedPkg.priceMonthly) 
                          : Math.round((billingCycle === 'weekly' ? selectedPkg.priceWeekly : selectedPkg.priceMonthly) * 0.9)
                        }
                        {paymentMethod !== 'bank_mandate' && <span className="text-[9px] text-slate-400 line-through ml-1.5">₹{billingCycle === 'weekly' ? selectedPkg.priceWeekly : selectedPkg.priceMonthly}</span>}
                      </strong>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (paymentTimeoutRef.current) {
                            clearTimeout(paymentTimeoutRef.current);
                            paymentTimeoutRef.current = null;
                          }
                          if (rzpInstanceRef.current) {
                            try {
                              rzpInstanceRef.current.close();
                            } catch (e) {
                              console.error('Error closing Razorpay modal:', e);
                            }
                            rzpInstanceRef.current = null;
                          }
                          setIsPaying(false);
                          setSelectedKitchenId(null);
                          setSelectedPkg(null);
                        }}
                        className="px-4 py-2 border border-emerald-200 rounded-xl hover:bg-emerald-50/40 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPaying}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100/60 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {isPaying ? (
                          <>
                            <span className="animate-spin text-sm">⌛</span> Processing...
                          </>
                        ) : (
                          <>
                            Confirm & Pay Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </form>
              )}

            </div>
          </div>
        )}

        {/* Dynamic QR Scanner Simulation Modal */}
        {isScanning && activeTrackingOrder && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-emerald-500 text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Camera size={20} className="animate-pulse" />
                  <div>
                    <h3 className="font-bold text-sm">Dynamic Tiffin Scanner</h3>
                    <p className="text-[10px] text-emerald-100 font-medium">Auto-align QR Code within boundaries</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsScanning(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Viewfinder Area */}
              <div className="p-6 space-y-6 text-center">
                <div className="relative aspect-square w-64 h-64 mx-auto rounded-3xl border-4 border-slate-900 bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
                  
                  {/* Neon camera corners */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>

                  {/* Ticking Sweep laser line */}
                  {!scanSuccess && (
                    <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-lg shadow-emerald-500/80 animate-[bounce_2s_infinite]"></div>
                  )}

                  {scanSuccess ? (
                    <div className="space-y-2">
                      <div className="h-16 w-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                        <Check size={36} className="stroke-[3]" />
                      </div>
                      <p className="font-extrabold text-sm text-emerald-400">Scan Match Confirmed!</p>
                      <p className="text-[10px] text-slate-400">Order delivered & logged on satellite.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 px-6">
                      <QrCode size={48} className="mx-auto text-slate-700 animate-pulse" />
                      <p className="text-[10px] text-slate-400">Simulating live camera feed...</p>
                      <span className="text-[9px] font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">
                        Active Order: #{activeTrackingOrder.id}
                      </span>
                    </div>
                  )}
                </div>

                {/* Simulated Laser Alert or Error feedback */}
                {scanError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5">
                    <X size={14} /> {scanError}
                  </div>
                )}

                {/* Scanning CTAs */}
                {!scanSuccess && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Fast Simulate Option</p>
                      <button
                        onClick={() => {
                          setScanSuccess(true);
                          setScanError(null);
                          setTimeout(() => {
                            updateOrderStatus(activeTrackingOrder.id, 'delivered');
                            setIsScanning(false);
                            alert('Tiffin Received! Your delivery attendance is now marked GREEN.');
                          }, 1500);
                        }}
                        className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle size={14} />
                        Auto-Detect Rider QR (Mock Scan)
                      </button>
                    </div>

                    <div className="relative flex py-1.5 items-center">
                      <div className="flex-grow border-t border-slate-100"></div>
                      <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase">OR Enter Manual PIN</span>
                      <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    <div className="flex gap-2 justify-center items-center">
                      <input
                        type="text"
                        maxLength={4}
                        value={manualOtp}
                        onChange={(e) => {
                          setManualOtp(e.target.value.replace(/\D/g, ''));
                          setScanError(null);
                        }}
                        placeholder="e.g. 1245"
                        className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-900 text-center text-sm font-extrabold font-mono tracking-widest w-28 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                      <button
                        onClick={() => {
                          if (manualOtp === currentOtpData.otp) {
                            setScanSuccess(true);
                            setScanError(null);
                            setTimeout(() => {
                              updateOrderStatus(activeTrackingOrder.id, 'delivered');
                              setIsScanning(false);
                              alert('Tiffin Received! Your delivery attendance is now marked GREEN.');
                            }, 1500);
                          } else {
                            setScanError(`Incorrect security PIN. Code has rotated or typo, try again. (Hint: check rider screen or try Auto-Detect)`);
                          }
                        }}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
                      >
                        Verify & Confirm
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Security OTP rotates in <span className="font-extrabold text-emerald-600">{currentOtpData.secondsLeft}s</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Profile & Billing System Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" id="profile-billing-modal">
            <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row h-auto md:h-[650px]">
              
              {/* Left Sidebar Accent Pane */}
              <div className="w-full md:w-80 bg-slate-900 text-white p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
                <div className="space-y-6">
                  <div className="flex justify-between items-center md:block">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base tracking-tight">Diner Profile</h4>
                        <p className="text-[10px] text-slate-400 font-mono">ID: #{currentUser.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Profile Summary Card */}
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-black flex items-center justify-center text-sm border-2 border-emerald-500">
                        {currentUser.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'VD'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-200 truncate">{currentUser.name || 'Valued Diner'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email || 'no-email@tiffingo.com'}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-700/50 pt-2.5 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Wallet Balance:</span>
                      <span className="font-extrabold text-emerald-400 font-mono text-xs">₹{currentUser?.creditsBalance !== undefined ? currentUser.creditsBalance : 0}</span>
                    </div>
                  </div>

                  {/* Navigation Tab List */}
                  <div className="space-y-1">
                    <button
                      onClick={() => setProfileActiveTab('details')}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                        profileActiveTab === 'details'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <User size={15} /> Personal Information
                    </button>
                    <button
                      onClick={() => setProfileActiveTab('billing')}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                        profileActiveTab === 'billing'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <CreditCard size={15} /> Billing & Wallet
                    </button>
                    <button
                      onClick={() => setProfileActiveTab('transactions')}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                        profileActiveTab === 'transactions'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <History size={15} /> Transaction History
                    </button>
                  </div>
                </div>

                <div className="hidden md:block space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 p-2.5 rounded-lg">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Secure PCI-DSS Cryptography Enabled</span>
                  </div>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Close Profile Panel
                  </button>
                </div>
              </div>

              {/* Right Content Pane */}
              <div className="flex-1 bg-slate-50 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                        {profileActiveTab === 'details' && 'Diner Contact Information'}
                        {profileActiveTab === 'billing' && 'Billing Methods & Wallet Top-up'}
                        {profileActiveTab === 'transactions' && 'Billing Ledger & Invoices'}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {profileActiveTab === 'details' && 'Manage your registration particulars, email confirmations and hotbox delivery coordinates.'}
                        {profileActiveTab === 'billing' && 'Top up your account balance, toggle instant card checkouts, and verify authorized bank mandates.'}
                        {profileActiveTab === 'transactions' && 'Review past transaction receipts, download encrypted PDF invoices, and audit account ledgers.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className="hidden md:block p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {profileSuccessMsg && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-3 rounded-xl flex items-center gap-2 text-xs">
                      <CheckCircle2 size={14} /> {profileSuccessMsg}
                    </div>
                  )}

                  {/* TAB 1: PERSONAL INFORMATION */}
                  {profileActiveTab === 'details' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!profileName || !profileEmail || !profilePhone || !profileAddress) {
                          alert('All profile particulars are required.');
                          return;
                        }

                        // Validate email format
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(profileEmail.trim())) {
                          alert('Please enter a valid email address.');
                          return;
                        }

                        // Validate 10-digit mobile number
                        const cleanPhone = profilePhone.replace(/[^\d]/g, '');
                        if (cleanPhone.length !== 10) {
                          alert('Mobile helpline contact must be exactly 10 digits.');
                          return;
                        }

                        registerCustomer(profileName, profileEmail, profilePhone, profileAddress);
                        setDeliveryAddress(profileAddress);
                        setProfileSuccessMsg('Profile particulars synchronized successfully!');
                        setTimeout(() => setProfileSuccessMsg(null), 3000);
                      }}
                      className="space-y-4 text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-600 flex items-center gap-1.5">
                            <User size={13} className="text-slate-400" /> Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="Aniruddha Nakwa"
                            className="w-full border border-slate-200 bg-white rounded-xl p-3 text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-600 flex items-center gap-1.5">
                            <Mail size={13} className="text-slate-400" /> Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            placeholder="aniruddha@gmail.com"
                            className="w-full border border-slate-200 bg-white rounded-xl p-3 text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-400" /> Mobile Helpline Contact
                        </label>
                        <input
                          type="tel"
                          required
                          value={profilePhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, '');
                            setProfilePhone(val.slice(0, 10));
                          }}
                          maxLength={10}
                          placeholder="e.g. mobile number"
                          className="w-full border border-slate-200 bg-white rounded-xl p-3 text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-600 flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" /> Principal Delivery Address
                        </label>
                        <textarea
                          required
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          placeholder="Apt 402, Greenfield Heights, Sector 4, Kalyani Nagar, Pune"
                          className="w-full border border-slate-200 bg-white rounded-xl p-3 text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all h-24 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer text-xs"
                      >
                        ✓ Synchronize My Particulars
                      </button>
                    </form>
                  )}

                  {/* TAB 2: BILLING & WALLET */}
                  {profileActiveTab === 'billing' && (
                    <div className="space-y-5 text-xs">
                      {/* Wallet Card */}
                      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-md border border-emerald-700/30 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
                          <CreditCard size={180} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">TiffinGo Digital Cash Wallet</p>
                          <p className="text-3xl font-black font-mono">
                            ₹{currentUser?.creditsBalance !== undefined ? currentUser.creditsBalance : 0}
                          </p>
                          <p className="text-[9px] text-emerald-100/80">Secure pre-authorized dining balance for seamless hotbox distribution.</p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 z-10">
                          <button
                            type="button"
                            onClick={() => {
                              addCredits(500);
                              logTransaction('topup', 'Wallet Credits Top-Up', 500, 'UPI');
                              setProfileSuccessMsg('₹500.00 topped up securely into digital cash wallet.');
                              setTimeout(() => setProfileSuccessMsg(null), 3000);
                            }}
                            className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-extrabold rounded-xl transition-all cursor-pointer text-[10px] border border-white/10"
                          >
                            ＋ Top-Up ₹500
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              addCredits(1000);
                              logTransaction('topup', 'Wallet Credits Top-Up', 1000, 'UPI');
                              setProfileSuccessMsg('₹1,000.00 topped up securely into digital cash wallet.');
                              setTimeout(() => setProfileSuccessMsg(null), 3000);
                            }}
                            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl transition-all cursor-pointer text-[10px] shadow-sm"
                          >
                            ＋ Top-Up ₹1,000
                          </button>
                        </div>
                      </div>

                      {/* Payment Instruments Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h5 className="font-bold text-slate-700 flex items-center gap-1.5">
                                <CreditCard size={14} className="text-slate-400" /> Saved Cards
                              </h5>
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold font-mono">
                                {(currentUser.savedCards || []).length} Active
                              </span>
                            </div>

                            {/* Cards List */}
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {(!currentUser.savedCards || currentUser.savedCards.length === 0) ? (
                                <div className="text-center py-4 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                  <p className="text-[10px] font-medium">No saved cards yet.</p>
                                </div>
                              ) : (
                                currentUser.savedCards.map((card) => (
                                  <div key={card.id} className="border border-slate-100 rounded-xl p-2 bg-slate-50 flex items-center justify-between hover:border-slate-200 transition-colors">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[9px] font-black text-slate-500 px-1.5 py-0.5 bg-slate-200/50 rounded uppercase tracking-wider">{card.cardType}</span>
                                      <div>
                                        <p className="font-bold font-mono text-slate-700 text-[10px]">{card.cardNumber}</p>
                                        <p className="text-[8px] text-slate-400">
                                          Exp: {card.expiryDate} • {card.cardholderName}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        removeSavedCard(card.id);
                                        setProfileSuccessMsg('Saved card removed successfully.');
                                        setTimeout(() => setProfileSuccessMsg(null), 3000);
                                      }}
                                      className="p-1 hover:text-rose-500 text-slate-400 transition-colors cursor-pointer"
                                      title="Delete Card"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Toggle Form Button */}
                          <div className="mt-2">
                            {!showAddCardForm ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddCardForm(true);
                                  setProfileSuccessMsg(null);
                                }}
                                className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl transition-all cursor-pointer text-[9px] flex items-center justify-center gap-1"
                              >
                                <Plus size={10} /> Add New Card
                              </button>
                            ) : (
                              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 space-y-2">
                                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                                  <span className="font-bold text-slate-700 text-[9px]">Enter Card Details</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowAddCardForm(false)}
                                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div>
                                      <label className="block text-[8px] font-bold text-slate-500 mb-0.5">CARD TYPE</label>
                                      <select
                                        value={newCardType}
                                        onChange={(e) => setNewCardType(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg p-1 bg-white text-slate-700 font-semibold text-[9px]"
                                      >
                                        <option value="VISA">Visa</option>
                                        <option value="MasterCard">MasterCard</option>
                                        <option value="RuPay">RuPay</option>
                                        <option value="Maestro">Maestro</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-bold text-slate-500 mb-0.5">CARDHOLDER NAME</label>
                                      <input
                                        type="text"
                                        value={newCardName}
                                        onChange={(e) => setNewCardName(e.target.value)}
                                        placeholder="e.g. Sagar E Misal"
                                        className="w-full border border-slate-200 rounded-lg p-1 bg-white text-slate-700 text-[9px] font-semibold"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[8px] font-bold text-slate-500 mb-0.5">CARD NUMBER</label>
                                    <input
                                      type="text"
                                      value={newCardNumber}
                                      onChange={(e) => {
                                        const rawVal = e.target.value.replace(/[^\d]/g, '');
                                        const limited = rawVal.slice(0, 16);
                                        const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
                                        setNewCardNumber(formatted);
                                      }}
                                      placeholder="e.g. 4111 2222 3333 4444"
                                      className="w-full border border-slate-200 rounded-lg p-1 bg-white text-slate-700 text-[9px] font-mono font-semibold"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div>
                                      <label className="block text-[8px] font-bold text-slate-500 mb-0.5">EXPIRY DATE</label>
                                      <input
                                        type="text"
                                        value={newCardExpiry}
                                        onChange={(e) => {
                                          let val = e.target.value.replace(/[^\d]/g, '');
                                          if (val.length > 2) {
                                            val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                          }
                                          setNewCardExpiry(val.slice(0, 5));
                                        }}
                                        placeholder="MM/YY"
                                        className="w-full border border-slate-200 rounded-lg p-1 bg-white text-slate-700 text-[9px] font-mono font-semibold text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-bold text-slate-500 mb-0.5">CVV / CVC</label>
                                      <input
                                        type="password"
                                        value={newCardCVV}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/[^\d]/g, '');
                                          setNewCardCVV(val.slice(0, 3));
                                        }}
                                        placeholder="•••"
                                        className="w-full border border-slate-200 rounded-lg p-1 bg-white text-slate-700 text-[9px] font-mono font-semibold text-center"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const digits = newCardNumber.replace(/\s/g, '');
                                      if (digits.length < 16) {
                                        alert('Please enter a valid 16-digit card number.');
                                        return;
                                      }
                                      if (!newCardName.trim()) {
                                        alert('Please enter the cardholder name.');
                                        return;
                                      }
                                      if (newCardExpiry.length < 5 || !newCardExpiry.includes('/')) {
                                        alert('Please enter a valid expiry date in MM/YY format.');
                                        return;
                                      }
                                      if (newCardCVV.length < 3) {
                                        alert('Please enter a valid 3-digit CVV.');
                                        return;
                                      }

                                      const maskedNum = `•••• •••• •••• ${digits.slice(-4)}`;

                                      addSavedCard({
                                        cardholderName: newCardName.trim(),
                                        cardNumber: maskedNum,
                                        expiryDate: newCardExpiry,
                                        cardType: newCardType
                                      });

                                      // Reset and close
                                      setNewCardNumber('');
                                      setNewCardName('');
                                      setNewCardExpiry('');
                                      setNewCardCVV('');
                                      setShowAddCardForm(false);
                                      setProfileSuccessMsg('New card saved securely!');
                                      setTimeout(() => setProfileSuccessMsg(null), 3000);
                                    }}
                                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg transition-all cursor-pointer text-[9px]"
                                  >
                                    ✓ Save Card securely
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 space-y-2">
                          <h5 className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Sliders size={14} className="text-slate-400" /> NACH Auto-Debits Mandate
                          </h5>
                          <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500">e-Mandate Status:</span>
                              {mySubscriptions.length > 0 && mySubscriptions[0].bankMandateActive ? (
                                <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded-full border border-emerald-100">✓ AUTHORIZED</span>
                              ) : (
                                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full border border-slate-200">INACTIVE</span>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400">Allows automatic, hassle-free subscription extensions direct from checking bank accounts.</p>
                            {mySubscriptions.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleMandateStatus(mySubscriptions[0].id);
                                  setProfileSuccessMsg(`e-Mandate status modified successfully.`);
                                  setTimeout(() => setProfileSuccessMsg(null), 3000);
                                }}
                                className={`w-full py-1.5 font-bold rounded-lg transition-all text-[9px] cursor-pointer mt-1 ${
                                  mySubscriptions[0].bankMandateActive
                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                              >
                                {mySubscriptions[0].bankMandateActive ? 'Deactivate Auto-Debit e-Mandate' : 'Activate Auto-Debit e-Mandate'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TRANSACTION HISTORY & RECEIPTS */}
                  {profileActiveTab === 'transactions' && (
                    <div className="space-y-4 text-xs">
                      {/* Search and Filters */}
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 text-slate-400" size={14} />
                          <input
                            type="text"
                            value={txnSearchQuery}
                            onChange={(e) => setTxnSearchQuery(e.target.value)}
                            placeholder="Search description, txid..."
                            className="w-full border border-slate-200 bg-white rounded-xl pl-9 pr-4 py-2.5 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-bold shrink-0">Type:</span>
                          <select
                            value={txnTypeFilter}
                            onChange={(e) => setTxnTypeFilter(e.target.value as any)}
                            className="border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-slate-700 font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="all">All Transactions</option>
                            <option value="subscription">Subscriptions</option>
                            <option value="topup">Wallet Top-Ups</option>
                            <option value="guest_plate">Guest Plates</option>
                            <option value="addon">Add-Ons</option>
                            <option value="bulk_order">Bulk Orders</option>
                          </select>
                        </div>
                      </div>

                      {/* Ledger List */}
                      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[300px] overflow-y-auto shadow-sm">
                        {(() => {
                          const filteredTxns = transactions.filter(t => {
                            const matchesUser = t.customerId ? t.customerId === currentUser?.id : true;
                            if (!matchesUser) return false;
                            const matchSearch = t.description.toLowerCase().includes(txnSearchQuery.toLowerCase()) || t.id.toLowerCase().includes(txnSearchQuery.toLowerCase());
                            const matchType = txnTypeFilter === 'all' || t.type === txnTypeFilter;
                            return matchSearch && matchType;
                          });

                          if (filteredTxns.length === 0) {
                            return (
                              <div className="p-10 text-center text-slate-400">
                                <FileText size={24} className="mx-auto mb-2 text-slate-300" />
                                No payment transaction matches found.
                              </div>
                            );
                          }

                          return filteredTxns.map((txn: any) => (
                            <div key={txn.id} className="p-3.5 hover:bg-slate-50/60 transition-colors flex justify-between items-center gap-3">
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-[10px] font-extrabold text-slate-400">#{txn.id}</span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-extrabold tracking-wider ${
                                    txn.type === 'subscription' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    txn.type === 'topup' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    txn.type === 'guest_plate' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                    txn.type === 'addon' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    'bg-purple-50 text-purple-600 border border-purple-100'
                                  }`}>
                                    {txn.type.replace('_', ' ')}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">{txn.date}</span>
                                </div>
                                <p className="font-bold text-xs text-slate-800 truncate">{txn.description}</p>
                                <p className="text-[9px] text-slate-400 font-medium">Payment Channel: <strong className="text-slate-600">{txn.paymentMethod}</strong> | Status: <strong className="text-emerald-600 font-bold">{txn.status}</strong></p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono font-black text-slate-800 text-xs">₹{txn.amount.toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={() => downloadReceiptPDF(txn)}
                                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl transition-all cursor-pointer border border-emerald-100 flex items-center justify-center shadow-sm"
                                  title="Download PDF Receipt"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Section */}
                <div className="border-t border-slate-200/80 pt-4 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-slate-400">
                  <p>In accordance with RBI merchant rules, past transactions are archived up to 7 financial years.</p>
                  <p className="font-mono">Tiffingo Secure Billing API v1.2</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Premium Confirmation Popup Modal */}
        {confirmationPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-200">
              {/* Close Button */}
              <button 
                onClick={() => setConfirmationPopup(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
                <CheckCircle2 size={36} className="stroke-[2.5]" />
              </div>

              {/* Title & Message */}
              <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-800">{confirmationPopup.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{confirmationPopup.message}</p>
              </div>

              {/* Details box */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-1.5 text-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Receipt Details</p>
                {confirmationPopup.details.map((detail: string, idx: number) => (
                  <p key={idx} className="text-slate-600 font-medium">{detail}</p>
                ))}
              </div>

              {/* Footer Info / Done button */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold px-1 text-slate-500">
                  <span>Paid via Wallet Credits</span>
                  <span className="font-mono text-emerald-600 font-bold">₹{confirmationPopup.pricePaid.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmationPopup(null)}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs cursor-pointer shadow-lg shadow-emerald-100 transition-all hover:scale-[1.01]"
                >
                  Awesome, got it!
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
