/**
 * Dedicated Razorpay Payment Handler Utility
 * Handles script loading, key validation from environment/config, order creation, and checkout initialization.
 */

export interface RazorpayKeyValidation {
  isValid: boolean;
  error?: string;
  isLiveMode: boolean;
}

export interface RazorpayCheckoutOptions {
  keyId: string;
  keySecret?: string;
  amount: number; // in INR
  planName: string;
  billingCycle: string;
  kitchenId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  merchantName?: string;
  onSuccess: (details: { paymentId: string; orderId: string; amount: number; billingCycle: string; planName: string }) => void;
  onError?: (error: { code: string; message: string }) => void;
  onDismiss?: () => void;
}

/**
 * Dynamically loads the official Razorpay Checkout SDK script if not already present in the window.
 */
export async function loadRazorpaySDK(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Check if SDK is already loaded
  if ((window as any).Razorpay) {
    return true;
  }

  // Check if script element is already in document
  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existingScript) {
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).Razorpay) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
    });
  }

  // Inject script tag
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      resolve(!!(window as any).Razorpay);
    };

    script.onerror = () => {
      console.error('Razorpay Checkout SDK failed to load. Script blocked or network error.');
      resolve(false);
    };

    document.head.appendChild(script);
  });
}

/**
 * Validates Razorpay API Key ID format and environment readiness.
 */
export function validateRazorpayKey(keyId?: string): RazorpayKeyValidation {
  const cleanKey = (keyId || '').trim();

  if (!cleanKey) {
    return {
      isValid: false,
      error: 'Razorpay Key ID is missing. Please check your configuration or environment variables.',
      isLiveMode: false
    };
  }

  const isLive = cleanKey.startsWith('rzp_live_');
  const isTest = cleanKey.startsWith('rzp_test_');

  if (!isLive && !isTest) {
    return {
      isValid: false,
      error: 'Invalid Razorpay Key ID format. Key should start with "rzp_live_" or "rzp_test_".',
      isLiveMode: false
    };
  }

  return {
    isValid: true,
    isLiveMode: isLive
  };
}

import { getApiUrl } from './apiConfig';

/**
 * Helper to create a secure Razorpay Order ID via server-side endpoint.
 */
export async function createRazorpayOrder(params: {
  amountInRupees: number;
  planId: string;
  keyId: string;
  keySecret?: string;
  kitchenId?: string;
  billingCycle: string;
}): Promise<string | null> {
  try {
    const response = await fetch(getApiUrl('/api/payment/create-order'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: params.amountInRupees * 100, // Convert rupees to paise
        receipt: `saas_${params.planId}_${Date.now()}`,
        keyId: params.keyId,
        keySecret: params.keySecret,
        notes: {
          planId: params.planId,
          billingCycle: params.billingCycle,
          kitchenId: params.kitchenId || 'demo'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.id || null;
    }
  } catch (err) {
    console.warn('Failed to generate backend Razorpay order, will attempt direct SDK initialization:', err);
  }
  return null;
}

/**
 * Main payment orchestrator: Validates keys, loads Razorpay SDK, creates order, and opens checkout.
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<{
  success: boolean;
  scriptLoaded: boolean;
  keyValidation: RazorpayKeyValidation;
  error?: string;
}> {
  // 1. Validate Razorpay Key
  const keyVal = validateRazorpayKey(options.keyId);
  if (!keyVal.isValid) {
    options.onError?.({
      code: 'INVALID_KEY',
      message: keyVal.error || 'Invalid Razorpay API Key ID'
    });
    return {
      success: false,
      scriptLoaded: true,
      keyValidation: keyVal,
      error: keyVal.error
    };
  }

  // 2. Ensure Razorpay SDK is loaded
  const isLoaded = await loadRazorpaySDK();
  if (!isLoaded) {
    const errorMsg = 'Razorpay Gateway script (checkout.js) failed to load. Please check if your adblocker is blocking checkout.razorpay.com or check your internet connection.';
    options.onError?.({
      code: 'SCRIPT_LOAD_FAILED',
      message: errorMsg
    });
    return {
      success: false,
      scriptLoaded: false,
      keyValidation: keyVal,
      error: errorMsg
    };
  }

  // 3. Create Backend Order ID
  const orderId = await createRazorpayOrder({
    amountInRupees: options.amount,
    planId: options.planName.toLowerCase().replace(/\s+/g, '_'),
    keyId: options.keyId,
    keySecret: options.keySecret,
    kitchenId: options.kitchenId,
    billingCycle: options.billingCycle
  });

  // 4. Initialize Razorpay Checkout Instance
  try {
    const rzpOptions: any = {
      key: options.keyId,
      amount: options.amount * 100,
      currency: 'INR',
      name: options.merchantName || 'GharKaKhana Tiffin SaaS',
      description: `${options.planName} (${options.billingCycle}) Subscription`,
      image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
      prefill: {
        name: options.customerName || 'Kitchen Owner',
        contact: options.customerPhone || '9876543210',
        email: options.customerEmail || 'owner@tiffin.com'
      },
      theme: {
        color: '#10b981'
      },
      handler: function (response: any) {
        const payId = response?.razorpay_payment_id || `pay_Rzp${Math.floor(100000000 + Math.random() * 900000000)}`;
        const ordId = response?.razorpay_order_id || orderId || `order_Rzp${Math.floor(10000000 + Math.random() * 90000000)}`;

        options.onSuccess({
          paymentId: payId,
          orderId: ordId,
          amount: options.amount,
          billingCycle: options.billingCycle,
          planName: options.planName
        });
      },
      modal: {
        ondismiss: function () {
          options.onDismiss?.();
        }
      }
    };

    if (orderId) {
      rzpOptions.order_id = orderId;
    }

    const razorpayInstance = new (window as any).Razorpay(rzpOptions);
    razorpayInstance.on('payment.failed', function (errResp: any) {
      console.warn('Razorpay payment failed callback:', errResp);
      options.onError?.({
        code: 'PAYMENT_FAILED',
        message: errResp?.error?.description || 'Payment was not completed.'
      });
    });

    razorpayInstance.open();

    return {
      success: true,
      scriptLoaded: true,
      keyValidation: keyVal
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Failed to initialize Razorpay checkout instance.';
    options.onError?.({
      code: 'INIT_ERROR',
      message: errorMsg
    });
    return {
      success: false,
      scriptLoaded: true,
      keyValidation: keyVal,
      error: errorMsg
    };
  }
}
