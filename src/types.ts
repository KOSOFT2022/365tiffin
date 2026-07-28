/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'super_admin' | 'tiffin_owner' | 'kitchen_cook' | 'delivery_boy' | 'customer';

export interface SavedCard {
  id: string;
  cardholderName: string;
  cardNumber: string; // Last 4 or full? Typically last 4 for security, we can save full mask it or save it in mock form.
  expiryDate: string; // MM/YY
  cardType: string; // e.g. VISA, MasterCard
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  creditsBalance?: number;
  customerAddress?: string;
  password?: string;
  savedCards?: SavedCard[];
  createdAfterClear?: boolean;
}

export interface MenuItem {
  name: string;
  category: 'main' | 'bread' | 'rice' | 'side' | 'dessert' | 'addon';
}

export interface DayMenu {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  items: string[]; // e.g. ["Paneer Masala", "3 Butter Rotis", "Jeera Rice", "Dal Fry", "Gulab Jamun"]
  isSpecial?: boolean;
}

export interface SubscriptionPackage {
  id: string;
  kitchenId: string;
  name: string; // e.g., "Standard Veg Tiffin", "Premium Non-Veg Feast", "Healthy Keto Plan"
  type: 'veg' | 'non-veg' | 'healthy';
  description: string;
  priceMonthly: number;
  priceWeekly: number;
  includes: {
    chapatis: number;
    curries: number;
    rice: boolean;
    dal: boolean;
    sweet: boolean;
    addonItems: string[];
  };
}

export interface SaaSPlan {
  id: string;
  name: string; // e.g., 'Starter', 'Growth Pro', 'Enterprise Fleet'
  description: string;
  priceMonthly: number;
  priceYearly: number;
  commissionRate: number; // percentage, e.g. 5 = 5%
  maxSubscribers: number; // e.g. 50, 250, 999999 for unlimited
  maxPackages: number; // max packages allowed
  allowsBulkOrders: boolean;
  allowsAiAssistant: boolean;
  allowsDedicatedFleet: boolean;
  isPopular?: boolean;
  badgeText?: string;
}

export interface KitchenSaaSMembership {
  planId: string;
  planName: string;
  status: 'active' | 'trial' | 'expired' | 'grace_period';
  billingCycle: 'monthly' | 'yearly';
  amountPaid: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  autoRenew: boolean;
  lastPaymentDate?: string;
  transactionId?: string;
}

export interface Kitchen {
  id: string;
  ownerId: string;
  name: string;
  cuisineType: 'pure-veg' | 'veg-nonveg';
  address: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  description: string;
  isActive: boolean;
  packages: SubscriptionPackage[];
  weeklyMenu: DayMenu[];
  addonWindowCloseTime?: string; // e.g. "11:00 AM"
  guestWindowCloseTime?: string; // e.g. "10:00 AM"
  acceptsBulkOrders?: boolean;
  bulkMenu?: BulkMenuItem[];
  saasMembership?: KitchenSaaSMembership;
}

export interface AddOnItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export interface GuestPlateRequest {
  date: string; // YYYY-MM-DD
  count: number;
  vegOnly: boolean;
  pricePaid: number;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  kitchenId: string;
  kitchenName: string;
  packageId: string;
  packageName: string;
  packageType: 'veg' | 'non-veg' | 'healthy';
  price: number;
  billingCycle: 'weekly' | 'monthly';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'paused' | 'expired' | 'cancelled';
  deliveryTime: 'lunch' | 'dinner';
  guestPlates: GuestPlateRequest[];
  addOnsOrdered: {
    date: string; // YYYY-MM-DD
    items: {
      itemId: string;
      name: string;
      quantity: number;
      price: number;
    }[];
  }[];
  paymentMethod?: 'upi' | 'card' | 'bank_mandate' | 'credits';
  mandateStatus?: 'authorized' | 'paused';
  mandateDetails?: {
    bankName: string;
    accountNumLast4: string;
    maxDailyDebitLimit: number;
    totalReleasedAmount: number;
    dailyReleaseRate: number;
  };
  diversionRequest?: {
    newAddress: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export type OrderStatus = 'placed' | 'cooking' | 'ready_for_dispatch' | 'dispatched' | 'out_for_delivery' | 'delivered';

export interface RouteStep {
  instruction: string;
  lat: number;
  lng: number;
  isCompleted: boolean;
}

export interface Order {
  id: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  kitchenId: string;
  kitchenName: string;
  date: string; // YYYY-MM-DD (today's date)
  mealType: 'lunch' | 'dinner';
  status: OrderStatus;
  orderType: 'regular' | 'guest_plate' | 'add_on_only' | 'regular_with_guest_and_addons';
  details: {
    packageName: string;
    packageType: 'veg' | 'non-veg' | 'healthy';
    guestPlatesCount: number;
    addOns: {
      name: string;
      quantity: number;
      price: number;
    }[];
  };
  deliveryBoyId?: string;
  deliveryBoyName?: string;
  geoTags?: {
    latitude: number;
    longitude: number;
    routeSteps: RouteStep[];
  };
  rating?: number;
  feedbackText?: string;
  updatedAt: string;
}

export interface PlatformStat {
  totalRevenue: number;
  totalSubscribers: number;
  totalActiveKitchens: number;
  totalDeliveriesCompleted: number;
}

export interface BulkMenuItem {
  id: string;
  name: string;
  minQuantity: number;
  pricePerUnit: number;
  unit: string; // e.g. "pcs", "kg", "plate", "handi"
}

export interface BulkOrder {
  id: string;
  kitchenId: string;
  kitchenName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    pricePerUnit: number;
    unit: string;
  }[];
  totalAmount: number;
  deliveryDate: string; // YYYY-MM-DD
  deliveryTime: string; // e.g., "1:00 PM"
  status: 'pending' | 'accepted' | 'rejected' | 'delivered';
  notes?: string;
  createdAt: string;
}

export interface RazorpaySettings {
  keyId: string;
  keySecret: string;
  isTestMode: boolean;
  isEnabled: boolean;
  merchantName: string;
}

