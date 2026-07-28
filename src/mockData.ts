/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Kitchen, User, Subscription, Order, AddOnItem, BulkOrder, SaaSPlan, RazorpaySettings } from './types';

export const mockSaaSPlans: SaaSPlan[] = [
  {
    id: 'saas_starter',
    name: 'Starter Kitchen',
    description: 'Perfect for local home chefs and emerging tiffin providers starting out.',
    priceMonthly: 999,
    priceYearly: 9990,
    commissionRate: 5.0,
    maxSubscribers: 50,
    maxPackages: 3,
    allowsBulkOrders: false,
    allowsAiAssistant: false,
    allowsDedicatedFleet: false,
    badgeText: 'Entry Tier'
  },
  {
    id: 'saas_pro',
    name: 'Growth Pro',
    description: 'Ideal for growing kitchens requiring bulk orders, AI menu optimizer, and reduced platform fees.',
    priceMonthly: 2499,
    priceYearly: 24990,
    commissionRate: 3.0,
    maxSubscribers: 250,
    maxPackages: 10,
    allowsBulkOrders: true,
    allowsAiAssistant: true,
    allowsDedicatedFleet: true,
    isPopular: true,
    badgeText: 'Most Popular'
  },
  {
    id: 'saas_enterprise',
    name: 'Enterprise Fleet',
    description: 'Full-suite SaaS for large-scale multi-branch kitchens with unlimited subscriber scale.',
    priceMonthly: 4999,
    priceYearly: 49990,
    commissionRate: 1.0,
    maxSubscribers: 999999,
    maxPackages: 50,
    allowsBulkOrders: true,
    allowsAiAssistant: true,
    allowsDedicatedFleet: true,
    badgeText: 'Lowest Commission'
  }
];

export const mockUsers: User[] = [
  {
    id: 'usr_admin',
    name: 'Aniruddha Nakwa (Super Admin)',
    email: 'admin@tiffinplatform.com',
    role: 'super_admin',
    phone: '+1 (555) 019-2831',
    password: 'password',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  }
];

export const mockAddOns: AddOnItem[] = [
  { id: 'add_1', name: 'Fresh Spiced Buttermilk (Chaach)', price: 40, category: 'beverage' },
  { id: 'add_2', name: 'Roasted Papad (2 pcs)', price: 20, category: 'crunch' },
  { id: 'add_3', name: 'Extra Butter Chapati (2 pcs)', price: 25, category: 'bread' },
  { id: 'add_4', name: 'Premium Alphonso Mango Pickle (50g)', price: 30, category: 'condiment' },
  { id: 'add_5', name: 'Sweet Gulab Jamun (2 pcs)', price: 50, category: 'dessert' },
  { id: 'add_6', name: 'Spicy Garlic Chutney (Special)', price: 15, category: 'condiment' }
];

export const mockKitchens: Kitchen[] = [];

export const mockSubscriptions: Subscription[] = [];

export const mockOrders: Order[] = [];

export const mockBulkOrders: BulkOrder[] = [];

export const mockRazorpaySettings: RazorpaySettings = {
  keyId: 'rzp_live_TAwUdHNX4tAoU2',
  keySecret: 'ctfMLHE7Z0B0ugMqv9S3LnSZ',
  isTestMode: false,
  isEnabled: true,
  merchantName: 'GharKaKhana Tiffin SaaS'
};
