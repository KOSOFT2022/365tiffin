/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { AppLogo } from './AppLogo';
import { 
  Store, Key, Mail, ChevronLeft, ShieldCheck, Truck, 
  ChefHat, User, Shield, AlertCircle, ArrowRight, Eye, EyeOff, Phone
} from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

interface LoginPageProps {
  initialRole?: string;
  onBackToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialRole, onBackToLanding }) => {
  const { login, registerCustomer, registerKitchenOwner, users } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>((initialRole as UserRole) || 'customer');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Registration form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Kitchen Owner Registration form states
  const [regKitchenName, setRegKitchenName] = useState('');
  const [regKitchenAddress, setRegKitchenAddress] = useState('');
  const [regAcceptsBulk, setRegAcceptsBulk] = useState(true);

  // Loading animation states
  const [loadingState, setLoadingState] = useState<'none' | 'login' | 'register'>('none');
  const [loadingMsg, setLoadingMsg] = useState('');

  if (loadingState === 'login') {
    return (
      <LoadingScreen 
        message={loadingMsg || `Securing access to your ${selectedRole.replace('_', ' ')} portal...`} 
        duration={1500} 
        onComplete={() => {
          login(email, selectedRole, password);
          setLoadingState('none');
        }} 
      />
    );
  }

  if (loadingState === 'register') {
    return (
      <LoadingScreen 
        message={loadingMsg} 
        duration={1800} 
        onComplete={() => {
          if (selectedRole === 'tiffin_owner') {
            registerKitchenOwner(regName, regEmail, regPhone, regPassword, regKitchenName, regKitchenAddress, regAcceptsBulk);
          } else {
            registerCustomer(regName, regEmail, regPhone, regAddress, regPassword);
          }
          setLoadingState('none');
        }} 
      />
    );
  }

  // Predefined or dynamically loaded accounts from users state
  const adminAccount = {
    id: 'usr_admin',
    role: 'super_admin' as UserRole,
    label: 'Admin / Super Governance (प्रशासक)',
    email: 'admin@tiffinplatform.com',
    description: 'Check system stats, registered kitchens, and SaaS configuration.',
    icon: ShieldCheck,
    color: 'bg-slate-900'
  };

  // Show at most one representative account per role to keep the quick account list clean
  const rolesOrder: UserRole[] = ['customer', 'tiffin_owner', 'kitchen_cook', 'delivery_boy'];
  
  const roleAccounts = rolesOrder.map(role => {
    const userForRole = users.slice().reverse().find(u => u.role === role);
    if (!userForRole) return null;

    let icon = User;
    let color = 'bg-emerald-500';
    let labelRole = 'Customer';
    if (role === 'tiffin_owner') {
      icon = ChefHat;
      color = 'bg-indigo-600';
      labelRole = 'Kitchen Owner';
    } else if (role === 'kitchen_cook') {
      icon = ChefHat;
      color = 'bg-emerald-600';
      labelRole = 'Cook';
    } else if (role === 'delivery_boy') {
      icon = Truck;
      color = 'bg-sky-600';
      labelRole = 'Rider';
    }

    return {
      id: userForRole.id,
      role: userForRole.role,
      label: `${userForRole.name} (${labelRole})`,
      email: userForRole.email,
      description: userForRole.phone ? `Phone: ${userForRole.phone}` : `Email: ${userForRole.email}`,
      icon,
      color
    };
  }).filter((acc): acc is NonNullable<typeof acc> => acc !== null);

  const demoAccounts = [adminAccount, ...roleAccounts];

  const handleDemoSelect = (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setSelectedRole(account.role);
    setPassword('password');
    setErrorMessage('');
    setIsRegisterMode(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const cleanInput = email.trim().toLowerCase();
    if (!cleanInput) {
      setErrorMessage('Please enter your email address or mobile number.');
      return;
    }

    // Check if it is a mobile number (only digits)
    const isMobile = /^\d+$/.test(cleanInput);
    if (isMobile) {
      if (cleanInput.length !== 10) {
        setErrorMessage('Mobile number must be exactly 10 digits.');
        return;
      }
    } else {
      // Basic email validation
      if (!cleanInput.includes('@') || !cleanInput.includes('.')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
    }

    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }

    const matched = users.find(u => {
      const emailMatch = u.email.toLowerCase() === cleanInput;
      const cleanUserPhone = u.phone.replace(/[^\d]/g, '');
      const cleanInputPhone = cleanInput.replace(/[^\d]/g, '');
      const last10User = cleanUserPhone.slice(-10);
      const last10Input = cleanInputPhone.slice(-10);
      const phoneMatch = last10User.length === 10 && last10Input.length === 10 && last10User === last10Input;
      return emailMatch || phoneMatch;
    });

    if (!matched) {
      if (isMobile) {
        setErrorMessage('This mobile number is not registered. Please register first.');
      } else {
        setErrorMessage('This email address is not registered. Please register first.');
      }
      return;
    }

    let expectedPassword = matched.password || 'password';
    if (matched.email.toLowerCase() === 'sagareshmisalcr7@gmail.com') {
      if (password === 'Sagaresh@1' || password === '123456') {
        expectedPassword = password;
      }
    }
    if (password !== expectedPassword) {
      setErrorMessage('Incorrect password. Please try again.');
      return;
    }

    setLoadingMsg(`Verifying credentials and opening your portal...`);
    setLoadingState('login');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!regName || !regEmail || !regPhone || !regPassword) {
      setErrorMessage('All registration fields are required, including password.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Validate 10-digit mobile number
    const cleanPhone = regPhone.replace(/[^\d]/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Mobile number must be exactly 10 digits.');
      return;
    }

    if (selectedRole === 'customer' && !regAddress) {
      setErrorMessage('Please provide a default delivery address.');
      return;
    }

    if (selectedRole === 'tiffin_owner' && (!regKitchenName || !regKitchenAddress)) {
      setErrorMessage('Please provide a kitchen name and physical address.');
      return;
    }

    const matched = users.find(u => u.email.toLowerCase() === regEmail.toLowerCase());
    const isSeedOrDynamic = matched && (matched.id === 'usr_cust_sagares' || matched.id.startsWith('usr_dyn_'));
    if (matched && !isSeedOrDynamic) {
      setErrorMessage('An account with this email address already exists. Please login instead.');
      return;
    }

    setLoadingMsg(selectedRole === 'tiffin_owner'
      ? `Setting up kitchen profile and preparing owner portal for ${regKitchenName}...`
      : `Setting up account and fresh meal plan for ${regName}...`
    );
    setLoadingState('register');
  };

  return (
    <div id="login_page_root" className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* Header Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 flex items-center justify-between">
        <button 
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </button>
        <div className="flex items-center gap-2">
          <AppLogo size={32} />
          <span className="text-sm font-black text-slate-800">TiffinGo Pro</span>
        </div>
      </div>

      {/* Main Form Center Panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Form title */}
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900">
                {isRegisterMode 
                  ? (selectedRole === 'customer' ? 'Create Customer Account' : 'Register Tiffin Kitchen') 
                  : 'Log In (लॉग इन)'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {isRegisterMode 
                  ? (selectedRole === 'customer' 
                    ? 'Create a new customer account to browse and buy food plans.' 
                    : 'Register your kitchen and configure bulk/demand order settings.')
                  : `Sign in to access your dashboard.`
                }
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                {errorMessage}
              </div>
            )}

            {/* Toggle Tab Login vs Register (For customers and tiffin owners) */}
            {!isRegisterMode && (selectedRole === 'customer' || selectedRole === 'tiffin_owner') && (
              <div className="mb-6 bg-slate-100 p-1.5 rounded-xl flex items-center">
                <button 
                  onClick={() => setIsRegisterMode(false)}
                  className="flex-1 text-center py-2 text-xs font-extrabold text-slate-800 bg-white rounded-lg shadow-sm"
                >
                  {selectedRole === 'customer' ? 'Customer Login' : 'Kitchen Owner Login'}
                </button>
                <button 
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMessage('');
                  }}
                  className="flex-1 text-center py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}

            {isRegisterMode && (
              <div className="mb-6">
                <button 
                  onClick={() => {
                    setIsRegisterMode(false);
                    setErrorMessage('');
                  }}
                  className="text-xs font-extrabold text-emerald-500 hover:text-emerald-600"
                >
                  ← Back to Login
                </button>
              </div>
            )}

            {/* Login Form */}
            {!isRegisterMode ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Role picker dropdown */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Selected Access Role / आपका रोल</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as UserRole);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="customer">Customer / Diner (ग्राहक)</option>
                    <option value="tiffin_owner">Tiffin Kitchen Owner (रसोई का मालिक)</option>
                    <option value="kitchen_cook">Kitchen Cook / Chef (रसोई का रसोइया)</option>
                    <option value="delivery_boy">Delivery Boy (डिलिव्हरी बॉय)</option>
                    <option value="super_admin">Admin (प्रशासक)</option>
                  </select>
                </div>

                {/* Email or Phone input */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Email Address or Mobile / ईमेल या मोबाइल नंबर</label>
                  <div className="relative">
                    {email && /^\d+$/.test(email) ? (
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    ) : (
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    )}
                    <input
                      type="text"
                      placeholder="e.g. email / mobile no"
                      value={email}
                      onChange={(e) => {
                        let val = e.target.value;
                        // If input consists purely of digits, restrict to exactly 10 digits max
                        if (/^\d*$/.test(val)) {
                          val = val.slice(0, 10);
                        }
                        setEmail(val);
                        setErrorMessage('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Password / पासवर्ड</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-11 pr-12 py-3.5 text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-4 rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  Login Now <ArrowRight size={16} />
                </button>

              </form>
            ) : (
              /* Customer or Kitchen Owner Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Full Name / मालिक का नाम</label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Sharma"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Phone Number / मोबाइल नंबर</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={regPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        setRegPhone(val.slice(0, 10));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. vikram@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Create a password for your account"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl pl-4 pr-12 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {selectedRole === 'tiffin_owner' ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Kitchen Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Annapurna Pure Veg Tiffin"
                          value={regKitchenName}
                          onChange={(e) => setRegKitchenName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Kitchen Address</label>
                        <input
                          type="text"
                          placeholder="e.g. Lane 2, Karve Road, Pune"
                          value={regKitchenAddress}
                          onChange={(e) => setRegKitchenAddress(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <label className="text-xs font-black text-slate-800 block">Accept Bulk / Demand Orders?</label>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Allow event organizers, corporates, and groups to order bulk meal trays.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRegAcceptsBulk(!regAcceptsBulk)}
                        className={`w-12 h-6 flex items-center rounded-full p-0.5 duration-300 cursor-pointer ${
                          regAcceptsBulk ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="bg-white w-5 h-5 rounded-full shadow-md transform duration-300 inline-block" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Default Delivery Address</label>
                    <textarea
                      placeholder="e.g. Tower B, Flat 502, Horizon Heights, Kalyani Nagar, Pune"
                      rows={3}
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none resize-none"
                    ></textarea>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-4 rounded-2xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  Register and Login <ArrowRight size={16} />
                </button>

              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer minimal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 text-center text-[10px] text-slate-400 font-semibold border-t border-slate-100">
        © 2026 TiffinGo Pro • Trusted Home Cooked Meal Subscription Network | Powered By Saara Softtech
      </div>

    </div>
  );
};
