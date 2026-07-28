/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppLogo } from './AppLogo';
import { 
  Store, Star, Calendar, ArrowRight, ShieldCheck, HeartPulse, 
  Clock, Sparkles, MapPin, ChevronRight, Menu, X, Users, Utensils, Compass, CheckCircle2,
  ChevronDown, Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils';

interface LandingPageProps {
  onLoginClick: (preferredRole?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const { kitchens } = useApp();
  const { t, i18n } = useTranslation();
  const tText = (text: string | null | undefined) => translateText(text, i18n.language);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Monday');

  // Representative weekly menu items for the teaser
  const sampleMenu = {
    Monday: ['Paneer Bhurji', 'Yellow Dal Tadka', 'Jeera Rice', '4 Butter Rotis', 'Kachumber Salad'],
    Tuesday: ['Aloo Gobhi Masala', 'Moong Dal Chilka', 'Basmati Rice', '4 Wheat Rotis', 'Sweet Lassi'],
    Wednesday: ['Mix Veg Handi', 'Chana Dal Fry', 'Peas Pulao', '4 Butter Rotis', 'Gulab Jamun'],
    Thursday: ['Bhindi Do Pyaza', 'Dal Makhani', 'Basmati Rice', '4 Wheat Rotis', 'Roasted Papad'],
    Friday: ['Shahi Paneer', 'Panchmel Dal', 'Veg Pulao', '4 Butter Rotis', 'Moong Dal Halwa'],
    Saturday: ['Baingan Bharta', 'Dal Tadka', 'Basmati Rice', '4 Wheat Rotis', 'Salad & Pickle'],
    Sunday: ['Special Dum Aloo', 'Chole Bhature / Rice', 'Veg Biryani', 'Kheer (Sunday Special)']
  };

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  return (
    <div id="landing_page_root" className="bg-slate-50 text-slate-800 min-h-screen font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <AppLogo size={40} glow={true} />
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">TiffinGo <span className="text-emerald-500">Pro</span></span>
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Authentic & Pure</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">{tText("Features")}</a>
            <a href="#menu-teaser" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">{tText("Daily Menu")}</a>
            <a href="#kitchens" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">{tText("Partner Kitchens")}</a>
            <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">{tText("Our Standard")}</a>
          </nav>

          {/* Desktop Auth CTA Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 transition-all shadow-xs focus:outline-none font-bold text-slate-800 cursor-pointer"
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
                  <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white border border-slate-150 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
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
            <button 
              onClick={() => onLoginClick()}
              className="text-sm font-bold text-slate-700 hover:text-emerald-500 px-3 py-2 transition-colors cursor-pointer"
            >
              {tText("Sign In")}
            </button>
            <button 
              onClick={() => onLoginClick('customer')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              {tText("Subscribe Now")}
            </button>
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-emerald-500 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-4 py-6 space-y-4 shadow-inner">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-emerald-500 py-1"
            >
              {tText("Features")}
            </a>
            <a 
              href="#menu-teaser" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-emerald-500 py-1"
            >
              {tText("Daily Menu")}
            </a>
            <a 
              href="#kitchens" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-emerald-500 py-1"
            >
              {tText("Partner Kitchens")}
            </a>
            <div className="h-px bg-slate-100 my-2"></div>
            
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-semibold text-slate-500">Language:</span>
              <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-0.5 text-xs font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => i18n.changeLanguage('en')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    i18n.language === 'en' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => i18n.changeLanguage('hi')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    i18n.language === 'hi' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  HI
                </button>
                <button
                  type="button"
                  onClick={() => i18n.changeLanguage('mr')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    i18n.language === 'mr' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  MR
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => { setMobileMenuOpen(false); onLoginClick(); }}
                className="w-full text-center font-bold text-slate-700 border border-slate-200 py-2.5 rounded-xl text-sm"
              >
                {tText("Sign In")}
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); onLoginClick('customer'); }}
                className="w-full text-center bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-sm shadow-sm"
              >
                {tText("Subscribe")}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-600 text-xs font-bold uppercase tracking-wider mx-auto lg:mx-0">
                <Sparkles size={12} className="animate-spin" />
                {tText("Pure Home Cooked Meal Subscription")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                {i18n.language === 'en' ? (
                  <>Healthy, Hot <span className="text-emerald-500">Home Meals</span> Delivered Daily.</>
                ) : (
                  tText("Healthy, Hot Home Meals Delivered Daily.")
                )}
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-medium">
                {tText("Ditch the greasy restaurant delivery. TiffinGo Pro connects busy professionals, students, and families with certified home kitchens preparing fresh, custom-crafted lunch and dinner plans with active live GPS route tracking.")}
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
                <button 
                  onClick={() => onLoginClick('customer')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base px-8 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {tText("Find Tiffin Subscriptions")} <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => onLoginClick('tiffin_owner')}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-base px-6 py-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Store size={18} className="text-emerald-500" /> {tText("Kitchen Partner Portal")}
                </button>
              </div>

              {/* Trust badges */}
              <div className="pt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 border-t border-slate-200/60">
                <div className="text-center lg:text-left">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">15+</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{tText("Local Home Kitchens")}</p>
                </div>
                <div className="text-center lg:text-left border-x border-slate-200 px-4">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">98%</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{tText("On-Time Hot Delivery")}</p>
                </div>
                <div className="text-center lg:text-left pl-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">4.9★</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{tText("Average Customer Rating")}</p>
                </div>
              </div>
            </div>

            {/* Right Column Interactive Preview (Gorgeously rendered illustration + card) */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-300 to-amber-200 rounded-[40px] filter blur-3xl opacity-25"></div>
              
              <div className="relative bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-300">
                
                {/* Visual Subscription Banner */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{tText("Premium Meal Services")}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{tText("100% Home Cooked")}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{tText("Pure Taste, High Nutrition")}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{tText("Vetted local kitchens delivering authentic recipes in clean thermal hotboxes.")}</p>
                    </div>
                  </div>

                  {/* Highlighted Package features list */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/80 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>{tText("Zero Artificial Preservatives")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>{tText("Free Triple-Insulated Hotbox")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>{tText("Skip or Pause Subscription with 1-Click")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>{tText("Secure Bank-Mandate Releases On-Delivery")}</span>
                    </div>
                  </div>

                  {/* Interactive Button to sign in */}
                  <button 
                    onClick={() => onLoginClick('customer')}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer shadow-md shadow-emerald-500/15"
                  >
                    <span>{tText("Browse Weekly Menus & Start Plan")}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Subscribed Plan Badge */}
                <div className="mt-6 bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black">{tText("POPULAR STARTING FROM")}</span>
                    <h5 className="text-xs font-extrabold text-slate-800">{tText("Classic Indian Veg Thali")}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">{tText("Roti, Dal, Sabji, Rice & Dessert")}</p>
                  </div>
                  <span className="text-xs font-black text-emerald-600">₹120/Meal</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-extrabold text-emerald-500 uppercase tracking-widest">{tText("Why TiffinGo Pro")}</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {tText("Elegance Meets Everyday Nourishment")}
            </h3>
            <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
              {tText("We did not build another food delivery app. We engineered a complete daily subscription pipeline that guarantees hot, certified, hygienic meals exactly when your break starts.")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">{tText("Certified Kitchens")}</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {tText("Every chef is vetted, licensed, and checked for sanitization and nutritional consistency. No artificial food dyes or trans-fats.")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <HeartPulse size={24} />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">{tText("Tracked Diets")}</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {tText("Whether you prefer pure vegetarian, non-vegetarian feasts, or high-protein macro-tracked keto meals, we have a customized package for you.")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Clock size={24} />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">{tText("Flexible Schedule")}</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {tText("Going out of town? Instantly pause your subscription or skip specific days. Manage lunch vs dinner slots seamlessly with one click.")}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Calendar size={24} />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">{tText("Premium Add-ons")}</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {tText("Configure guest plates for visiting friends, schedule fresh buttermilk/papad, and receive automatic monthly receipt invoice PDFs.")}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Interactive Daily Menu Teaser */}
      <section id="menu-teaser" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side text */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest">
                {tText("Fresh Cooked Teaser")}
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {tText("No Boredom. Just Diverse Home Menus.")}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {tText("Our kitchen partners alternate their menu daily so you never eat the same meal twice in a week. Click on any weekday to inspect the actual meals prepared on that day!")}
              </p>

              <div className="space-y-3.5">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  {tText("Lighter on spice, richer in nutrition")}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  {tText("Made with premium long grain Basmati rice")}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  {tText("Whole wheat rotis prepared fresh with hand-churned ghee")}
                </div>
              </div>

              <button 
                onClick={() => onLoginClick('customer')}
                className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer group"
              >
                {tText("Explore customized healthy packages")} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right side interactive day menu selector */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{tText("Standard Vegetarian Menu")}</span>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg">{tText("Alternating Daily")}</span>
              </div>

              {/* Day selector buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      selectedDay === day
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {i18n.language === 'en' ? day.slice(0, 3) : tText(day)}
                  </button>
                ))}
              </div>

              {/* Menu items display card */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Utensils size={15} className="text-emerald-500" />
                    {tText(selectedDay)} - {i18n.language === 'en' ? 'Specialties' : i18n.language === 'hi' ? 'विशेष व्यंजन' : 'विशेष मेजवानी'}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">LUNCH & DINNER READY</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {sampleMenu[selectedDay].map((item, index) => (
                    <div 
                      key={index} 
                      className="bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 text-xs text-slate-700 font-semibold"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {tText(item)}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Verified Kitchens Showcase */}
      <section id="kitchens" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-3">
              <h2 className="text-xs font-extrabold text-emerald-500 uppercase tracking-widest">{tText("Our Partners")}</h2>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{tText("Vetted Home Kitchens")}</h3>
              <p className="text-slate-500 text-sm max-w-xl font-medium">
                {tText("We partner only with elite home kitchens following standard hygiene regulations. Order with absolute peace of mind.")}
              </p>
            </div>
            <button 
              onClick={() => onLoginClick('customer')}
              className="text-xs font-black text-emerald-500 hover:text-emerald-600 flex items-center gap-1.5 py-2.5 shrink-0 transition-colors"
            >
              {tText("View all 15 active kitchens")} <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {kitchens.map((kit) => (
              <div 
                key={kit.id} 
                className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow group"
              >
                <div className="h-48 relative overflow-hidden bg-slate-200">
                  <img 
                    src={kit.imageUrl} 
                    alt={tText(kit.name)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-800">
                    {tText(kit.cuisineType === 'pure-veg' ? '🟢 Pure Veg' : '🔴 Veg & Non-Veg')}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-extrabold text-slate-900 tracking-tight">{tText(kit.name)}</h4>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg shrink-0">
                        <Star size={12} className="fill-amber-500" />
                        {kit.rating}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">
                      {tText(kit.description)}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold pt-1">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{tText(kit.address)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-black">{tText("Sub starts at")}</span>
                      <p className="text-sm font-extrabold text-slate-800">₹75 <span className="text-xs text-slate-400 font-bold">/{tText("Week")}</span></p>
                    </div>
                    <button 
                      onClick={() => onLoginClick('customer')}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      {tText("Browse Plan")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Double Portal Section */}
      <section id="about" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">{tText("Our Ecosystem")}</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {tText("One Unified Kitchen-to-Diner Solution")}
            </h3>
            <p className="text-sm text-slate-400 font-medium">
              {tText("We connect home cooks, logistics captains, and hungry diners under a highly synced real-time data engine. Experience true operational clarity.")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* For Diners */}
            <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 space-y-5">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold">
                <Users size={24} />
              </div>
              <h4 className="text-xl font-black text-white">{tText("For Diners & Customers")}</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {tText("Subscribe to trusted kitchens, alternate times daily, scheduled guest plates, order buttermilk add-ons, and track riders on precise maps.")}
              </p>
              <button 
                onClick={() => onLoginClick('customer')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer w-full text-center"
              >
                {tText("Sign In as Customer")}
              </button>
            </div>

            {/* For Partners */}
            <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 space-y-5">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold">
                <Compass size={24} />
              </div>
              <h4 className="text-xl font-black text-white">{tText("For Kitchens & Riders")}</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {tText("Manage automated prep lists, configure weekly menus, guide riders with turn-by-turn simulation walkthroughs, and audit overall revenue.")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onLoginClick('tiffin_owner')}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold text-[11px] py-2.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  {tText("Kitchen Partner")}
                </button>
                <button 
                  onClick={() => onLoginClick('delivery_boy')}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold text-[11px] py-2.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  {tText("Rider Portal")}
                </button>
              </div>
            </div>

          </div>

          <div className="text-center pt-12">
            <button 
              onClick={() => onLoginClick('super_admin')}
              className="text-xs text-slate-400 hover:text-emerald-400 font-bold tracking-wider uppercase underline decoration-dashed decoration-slate-600 cursor-pointer"
            >
              {tText("Admin Dashboard Login")}
            </button>
          </div>

        </div>
      </section>

      {/* Simple elegant footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 mt-auto text-xs font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <AppLogo size={32} />
            <div>
              <span className="text-sm font-extrabold text-white">TiffinGo Pro</span>
              <p className="text-[9px] text-slate-500 mt-0.5">© 2026 TiffinGo Pro • Trusted Home Cooked Meal Subscription Network| Powered By Saara Softtech</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 justify-center text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">{tText("Privacy Policy")}</a>
            <a href="#features" className="hover:text-white transition-colors">{tText("Terms of Service")}</a>
            <a href="#features" className="hover:text-white transition-colors">{tText("Refund Policy")}</a>
            <a href="#features" className="hover:text-white transition-colors">{tText("Razorpay Security")}</a>
          </div>

          <p className="text-[10px] text-slate-500 text-center md:text-right">
            {tText("Designed for healthy lifestyles & home cooking ecosystems.")}
          </p>
        </div>
      </footer>

    </div>
  );
};
