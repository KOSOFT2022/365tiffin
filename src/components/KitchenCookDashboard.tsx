/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Flame, Check, CheckSquare, PlusCircle, ShoppingBag, Award, Eye, Clock, ChevronDown, Calendar } from 'lucide-react';
import { Order } from '../types';
import { translateText, getTodayDateStr } from '../utils';
import { useTranslation } from 'react-i18next';

export const KitchenCookDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const tText = (text: string | null | undefined) => translateText(text, i18n.language);
  const { currentUser, kitchens, orders, updateOrderStatus, bulkOrders, updateBulkOrderStatus } = useApp();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Find the kitchen managed by the owner this cook belongs to (or default to first)
  // Ramswaroop is a cook at Annapurna. So find that kitchen.
  const kitchen = kitchens.find(k => {
    if (currentUser?.role === 'kitchen_cook') {
      return k.id === currentUser?.kitchenId || k.ownerId === currentUser?.id;
    }
    if (currentUser?.role === 'tiffin_owner') {
      return k.ownerId === currentUser.id;
    }
    return false;
  }) || kitchens[0];

  // Filters for kitchen orders today
  const todayStr = getTodayDateStr();
  const activeOrders = kitchen ? orders.filter(o => o.kitchenId === kitchen.id && o.date === todayStr && o.status !== 'delivered') : [];

  // Scheduled future orders (e.g. tomorrow onwards)
  const scheduledOrders = kitchen ? orders.filter(o => o.kitchenId === kitchen.id && o.date > todayStr) : [];

  // Filters for kitchen bulk orders today (excluding delivered/rejected)
  const activeBulkOrders = kitchen ? (bulkOrders || []).filter(bo => bo.kitchenId === kitchen.id && bo.deliveryDate === todayStr && bo.status !== 'delivered' && bo.status !== 'rejected') : [];

  // Scheduled future bulk orders
  const scheduledBulkOrders = kitchen ? (bulkOrders || []).filter(bo => bo.kitchenId === kitchen.id && bo.deliveryDate > todayStr) : [];

  // Compute stats for cook
  const cookingCount = activeOrders.filter(o => o.status === 'cooking').length;
  const placedCount = activeOrders.filter(o => o.status === 'placed').length;
  const readyCount = activeOrders.filter(o => o.status === 'ready_for_dispatch' || o.status === 'dispatched').length;

  // Raw preparation calculations
  let rotisNeeded = 0;
  let riceNeeded = 0;
  let dalNeeded = 0;
  let curriesNeeded = 0;
  let sweetsNeeded = 0;
  let specialGuestMealBoxes = 0;
  
  // Custom add-on logs
  const extraAddonsLog: { [name: string]: number } = {};

  // 1. Process standard orders
  activeOrders.forEach(o => {
    const pkg = kitchen?.packages?.find(p => p.name === o.details.packageName);
    const regularChapatis = pkg ? pkg.includes.chapatis : 4;
    const regularCurries = pkg ? pkg.includes.curries : 2;

    if (o.status === 'placed' || o.status === 'cooking') {
      rotisNeeded += regularChapatis;
      if (pkg?.includes.rice) riceNeeded++;
      if (pkg?.includes.dal) dalNeeded++;
      curriesNeeded += regularCurries;
      if (pkg?.includes.sweet) sweetsNeeded++;

      if (o.details.guestPlatesCount > 0) {
        specialGuestMealBoxes += o.details.guestPlatesCount;
        rotisNeeded += (o.details.guestPlatesCount * 4);
        curriesNeeded += (o.details.guestPlatesCount * 2);
        dalNeeded += o.details.guestPlatesCount;
        riceNeeded += o.details.guestPlatesCount;
      }

      o.details.addOns.forEach(add => {
        extraAddonsLog[add.name] = (extraAddonsLog[add.name] || 0) + add.quantity;
        if (add.name.toLowerCase().includes('chapati')) {
          rotisNeeded += (add.quantity * 2);
        }
        if (add.name.toLowerCase().includes('jamun')) {
          sweetsNeeded += add.quantity;
        }
      });
    }
  });

  // 2. Process bulk orders (include items in raw preparation counts)
  activeBulkOrders.forEach(bo => {
    bo.items.forEach(item => {
      const lowerName = item.name.toLowerCase();
      if (lowerName.includes('chapati') || lowerName.includes('roti')) {
        rotisNeeded += item.quantity;
      } else if (lowerName.includes('dal') || lowerName.includes('lentil')) {
        dalNeeded += item.quantity;
      } else if (lowerName.includes('sweet') || lowerName.includes('jamun')) {
        sweetsNeeded += item.quantity;
      } else if (lowerName.includes('rice') || lowerName.includes('biryani') || lowerName.includes('pulao')) {
        riceNeeded += item.quantity;
      } else {
        extraAddonsLog[item.name] = (extraAddonsLog[item.name] || 0) + item.quantity;
      }
    });
  });

  // Touch checklist state
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Knead fresh wheat dough & fire tandoor/griddle', done: true },
    { id: 2, label: 'Simmer Annapurna Special Yellow Dal Tadka', done: false },
    { id: 3, label: 'Steam long-grain Basmati Rice', done: false },
    { id: 4, label: 'Prepare daily veg masala gravy (Paneer / Mix Veg)', done: false },
    { id: 5, label: 'Fill copper container tiffins with heat retention gaskets', done: false },
    { id: 6, label: 'Chop fresh cucumbers & carrots for salad garnish', done: false },
    { id: 7, label: 'Pull buttermilk bottles from the cold storage fridge', done: false }
  ]);

  const toggleChecklist = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  return (
    <div className="bg-emerald-50/30 min-h-screen p-4 md:p-8 font-sans pb-32 text-slate-800" id="cook-dashboard">
      {/* Upper Brand Nav */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
              <Flame className="h-6 w-6 text-white animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{tText(kitchen?.name || 'Kitchen')} — <span className="text-green-600">Cook Board</span></h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Head Chef terminal for checking item prep counts, packaging checklists, and dispatch approvals.
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
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 px-4 py-2 rounded-xl text-xs text-green-700 font-bold">
            <Clock size={14} className="text-green-600" />
            Shift Status: <span className="text-green-700 font-extrabold">LUNCH SHIFT ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Chef Counter Dashboard Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-emerald-100 p-5 rounded-3xl shadow-sm">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Uncooked Orders</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-500">{placedCount}</span>
              <span className="text-xs text-slate-500 font-medium">awaiting fire</span>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 p-5 rounded-3xl shadow-sm">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Currently On Stove</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-green-600 animate-pulse">{cookingCount}</span>
              <span className="text-xs text-slate-500 font-medium">simmering</span>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 p-5 rounded-3xl shadow-sm">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Guest Boxes to Assemble</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-blue-500">{specialGuestMealBoxes}</span>
              <span className="text-xs text-slate-500 font-medium">plates</span>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 p-5 rounded-3xl shadow-sm">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Ready for Rider</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-green-500">{readyCount}</span>
              <span className="text-xs text-slate-500 font-medium">dispatched</span>
            </div>
          </div>
        </div>

        {/* Cooking Quantities & Packing Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Item Quantities */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-emerald-100 pb-3">
              <span className="w-2 h-6 bg-green-500 rounded-full"></span>
              <ShoppingBag className="text-green-500" size={16} /> Raw Quantities to Prepare Now
            </h3>

            {placedCount + cookingCount > 0 ? (
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/60">
                  <span className="font-semibold text-slate-600">Total Butter Rotis to Bake</span>
                  <span className="bg-emerald-500 text-white px-2.5 py-1 rounded font-mono font-extrabold text-xs">
                    {rotisNeeded} Rotis
                  </span>
                </div>

                <div className="flex justify-between items-center bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/60">
                  <span className="font-semibold text-slate-600">Dal Portions (Cups)</span>
                  <span className="bg-amber-500 text-white px-2.5 py-1 rounded font-mono font-extrabold text-xs">
                    {dalNeeded} cups
                  </span>
                </div>

                <div className="flex justify-between items-center bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/60">
                  <span className="font-semibold text-slate-600">Curries & Subzi portions</span>
                  <span className="bg-blue-500 text-white px-2.5 py-1 rounded font-mono font-extrabold text-xs">
                    {curriesNeeded} cups
                  </span>
                </div>

                <div className="flex justify-between items-center bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/60">
                  <span className="font-semibold text-slate-600">Sweets / Jamun Servings</span>
                  <span className="bg-pink-500 text-white px-2.5 py-1 rounded font-mono font-extrabold text-xs">
                    {sweetsNeeded} cups
                  </span>
                </div>

                {Object.keys(extraAddonsLog).length > 0 && (
                  <div className="border-t border-emerald-100 pt-3 space-y-2">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Extra Packaging Items:</p>
                    {Object.entries(extraAddonsLog).map(([name, qty]) => (
                      <div key={name} className="flex justify-between items-center text-[11px] text-slate-600 pl-1">
                        <span>• {name}</span>
                        <strong className="text-green-600">Pack x{qty}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                <CheckSquare size={32} className="mx-auto text-slate-200 mb-2" />
                No active cooking quantities needed right now.
              </div>
            )}
          </div>

          {/* Interactive touch checklist */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-emerald-100 pb-3">
              <span className="w-2 h-6 bg-green-500 rounded-full"></span>
              <CheckSquare className="text-green-500" size={16} /> Packaging Standards Checklist
            </h3>

            <div className="space-y-3">
              {checklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center gap-3 cursor-pointer ${
                    item.done 
                      ? 'bg-emerald-50/10 border-emerald-100/50 text-slate-400 line-through' 
                      : 'bg-white border-emerald-100 hover:border-emerald-300 text-slate-700 font-medium'
                  }`}
                >
                  <div className={`p-1 rounded-md ${item.done ? 'bg-green-500 text-white' : 'bg-emerald-50 text-emerald-500'}`}>
                    <Check size={12} />
                  </div>
                  <span className="flex-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Touch prep order control pipeline */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-emerald-100 pb-3">
              <span className="w-2 h-6 bg-green-500 rounded-full"></span>
              <Award className="text-green-500" size={16} /> Pack & Seal Tiffin Containers
            </h3>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {activeOrders
                .filter(o => o.status === 'placed' || o.status === 'cooking')
                .map(o => (
                  <div key={o.id} className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-600 font-extrabold px-1.5 py-0.5 rounded">
                          Order #{o.id}
                        </span>
                        <h4 className="font-extrabold text-xs mt-1 text-slate-800">{tText(o.customerName)}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        o.status === 'cooking' ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tText(o.status)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1.5 bg-emerald-50/20 p-3 rounded-xl border border-emerald-100/40">
                      <p className="flex justify-between items-center">
                        <span>📋 <strong className="text-slate-800">{tText(o.details.packageName)}</strong></span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Base Plan</span>
                      </p>
                      {o.details.guestPlatesCount > 0 && (
                        <div className="flex justify-between items-center bg-emerald-100 text-emerald-900 px-2 py-1 rounded-md text-[10px] font-extrabold border border-emerald-200">
                          <span>👥 EXTRA GUEST PLATES</span>
                          <span>+{o.details.guestPlatesCount} Plates</span>
                        </div>
                      )}
                      {o.details.addOns.map((add, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-md text-[10px] font-extrabold shadow-xs">
                          <span className="flex items-center gap-1">
                            <span className="text-amber-500">★</span>
                            <span>{tText(add.name)}</span>
                          </span>
                          <span className="bg-amber-500 text-white font-black px-1.5 py-0.5 rounded-full text-[9px]">
                            x{add.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 justify-end">
                      {o.status === 'placed' && (
                        <button
                          onClick={() => updateOrderStatus(o.id, 'cooking')}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-md shadow-emerald-100"
                        >
                          Start Prep
                        </button>
                      )}
                      {o.status === 'cooking' && (
                        <button
                          onClick={() => updateOrderStatus(o.id, 'ready_for_dispatch')}
                          className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-md shadow-green-100"
                        >
                          Pack & Ready
                        </button>
                      )}
                    </div>
                  </div>
                ))}

              {activeOrders.filter(o => o.status === 'placed' || o.status === 'cooking').length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Flame size={32} className="mx-auto text-slate-200 mb-2" />
                  No orders needing cooking at the moment!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk & Party Requests Today */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-6 space-y-4 shadow-sm mt-6">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-emerald-100 pb-3">
            <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
            <ShoppingBag className="text-amber-500" size={16} /> Bulk & Party Requests (Scheduled Today)
          </h3>
          
          {activeBulkOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBulkOrders.map(bo => (
                <div key={bo.id} className="bg-amber-50/25 border border-amber-200 rounded-2xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 bg-amber-500 text-white font-black text-[8px] uppercase px-2.5 py-1 rounded-bl-lg font-mono tracking-wider">
                    Bulk Party Order
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded">
                        ID: #{bo.id}
                      </span>
                      <h4 className="font-extrabold text-xs mt-1 text-slate-800">{tText(bo.customerName)}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">📞 {bo.customerPhone}</p>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1 bg-white p-3 rounded-xl border border-amber-100/40">
                      <p className="flex justify-between items-center pb-1 border-b border-slate-50 text-[10px] font-bold text-slate-400">
                        <span>ITEMS ORDERED</span>
                        <span>QTY</span>
                      </p>
                      {bo.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-0.5">
                          <span className="text-slate-800 font-semibold">{tText(item.name)}</span>
                          <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                            x{item.quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                      {bo.notes && (
                        <div className="mt-2 pt-1.5 border-t border-dashed border-slate-100 text-[10px] text-amber-700 font-medium">
                          <strong>Notes:</strong> {tText(bo.notes)}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>⏱️ Deliver: <strong>{bo.deliveryTime}</strong></span>
                      <span className="capitalize text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {bo.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-amber-100/40 mt-1">
                    {bo.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateBulkOrderStatus(bo.id, 'rejected')}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateBulkOrderStatus(bo.id, 'accepted')}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-sm"
                        >
                          Accept Order
                        </button>
                      </>
                    )}
                    {bo.status === 'accepted' && (
                      <button
                        onClick={() => updateBulkOrderStatus(bo.id, 'delivered')}
                        className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-sm"
                      >
                        Mark Prepared & Dispatched
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <ShoppingBag size={24} className="mx-auto text-slate-300 mb-1" />
              No bulk party requests scheduled for today.
            </div>
          )}
        </div>

        {/* Upcoming & Future Scheduled Orders */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-6 space-y-4 shadow-sm mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-emerald-100 pb-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
              <Calendar className="text-indigo-500" size={16} /> Upcoming Scheduled Orders (भविष्य के अनुसूचित आदेश)
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              Forecast: {scheduledOrders.length + scheduledBulkOrders.length} Scheduled
            </span>
          </div>

          {scheduledOrders.length > 0 || scheduledBulkOrders.length > 0 ? (
            <div className="space-y-4">
              {/* Future Regular/Guest/Addon Orders */}
              {scheduledOrders.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider pl-1">Scheduled Subscriptions & Guest Plates</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scheduledOrders.map(o => (
                      <div key={o.id} className="bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-100 rounded-2xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white font-black text-[8px] uppercase px-2 py-0.5 rounded-bl-lg font-mono">
                          {o.orderType.replace('_', ' ')}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-[9px] bg-slate-200 text-slate-600 font-extrabold px-1.5 py-0.5 rounded font-mono">
                              #{o.id}
                            </span>
                            <h4 className="font-extrabold text-xs mt-1 text-slate-800">{tText(o.customerName)}</h4>
                            <p className="text-[10px] text-indigo-600 font-bold mt-0.5">📅 Date: {o.date} ({o.mealType})</p>
                          </div>

                          <div className="text-[11px] text-slate-500 space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                            <p className="flex justify-between items-center text-[10px] text-slate-800 font-bold">
                              <span>📋 {tText(o.details.packageName)}</span>
                            </p>
                            {o.details.guestPlatesCount > 0 && (
                              <div className="flex justify-between items-center bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded text-[10px] font-bold mt-1">
                                <span>👥 Extra Guest Plates:</span>
                                <span>{o.details.guestPlatesCount} Plates</span>
                              </div>
                            )}
                            {o.details.addOns && o.details.addOns.length > 0 && o.details.addOns.map((add, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px] text-amber-800 pl-1 mt-1">
                                <span>★ {tText(add.name)}</span>
                                <span className="font-bold">x{add.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Future Bulk Orders */}
              {scheduledBulkOrders.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider pl-1">Upcoming Party / Bulk Catering</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scheduledBulkOrders.map(bo => (
                      <div key={bo.id} className="bg-amber-50/10 border border-amber-100 rounded-2xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 bg-amber-500 text-white font-black text-[8px] uppercase px-2 py-0.5 rounded-bl-lg font-mono">
                          Bulk Order
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded font-mono">
                              #{bo.id}
                            </span>
                            <h4 className="font-extrabold text-xs mt-1 text-slate-800">{tText(bo.customerName)}</h4>
                            <p className="text-[10px] text-amber-600 font-bold mt-0.5">📅 Date: {bo.deliveryDate} ({bo.deliveryTime})</p>
                          </div>

                          <div className="text-[11px] text-slate-500 space-y-1 bg-white p-3 rounded-xl border border-amber-100">
                            {bo.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="text-slate-800 font-semibold">{tText(item.name)}</span>
                                <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                  x{item.quantity} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Calendar size={24} className="mx-auto text-slate-300 mb-1" />
              No future scheduled regular orders or guest plates for this kitchen yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
