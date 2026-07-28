/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_title": "TiffinGo Pro",
      "simulation_panel": "Simulation Role Center",
      "active_identity": "Active Identity",
      "choose_role": "Select Role View to Inspect Screen",
      "home": "Home",
      "kitchens": "Kitchens",
      "my_subscriptions": "My Subscriptions",
      "my_orders": "My Active Orders",
      "register_profile": "Register Customer Profile",
      "register_desc": "Enter your details to access subscriptions and live order tracking.",
      "subscribe_now": "Subscribe Now",
      "rating": "Rating",
      "delivery_tracking": "Delivery Tracking",
      "active_tracking": "Active GPS Route Tracking",
      "rate_review": "Rate and Review",
      "billing_cycle": "Billing Cycle",
      "weekly": "Weekly",
      "monthly": "Monthly",
      "delivery_time": "Delivery Slot",
      "lunch": "Lunch",
      "dinner": "Dinner",
      "delivery_address": "Delivery Address",
      "payment_method": "Payment Method",
      "pay_subscribe": "Pay & Subscribe via Razorpay",
      "processing_payment": "Securing Razorpay Gateway...",
      "add_ons": "Buttermilk & Add-ons",
      "guest_plates": "Schedule Guest Plates",
      "invoice_print": "Download Invoice PDF",
      "kitchen_cook_dashboard": "Kitchen Displays & Prep Counts",
      "rider_route_dashboard": "Rider GPS Route Walkthrough",
      "owner_dashboard": "Tiffin Owner Panel",
      "super_admin_dashboard": "Super Admin Analytics"
    }
  },
  hi: {
    translation: {
      "app_title": "टिफिनगो प्रो",
      "simulation_panel": "सिमुलेशन रोल सेंटर",
      "active_identity": "सक्रिय पहचान",
      "choose_role": "स्क्रीन देखने के लिए रोल चुनें",
      "home": "मुख्य पृष्ठ",
      "kitchens": "रसोई",
      "my_subscriptions": "मेरी सदस्यताएं",
      "my_orders": "मेरे सक्रिय ऑर्डर",
      "register_profile": "ग्राहक प्रोफ़ाइल पंजीकृत करें",
      "register_desc": "सदस्यता और लाइव ऑर्डर ट्रैकिंग तक पहुंचने के लिए अपना विवरण दर्ज करें।",
      "subscribe_now": "अभी सदस्य बनें",
      "rating": "रेटिंग",
      "delivery_tracking": "वितरण ट्रैकिंग",
      "active_tracking": "सक्रिय जीपीएस रूट ट्रैकिंग",
      "rate_review": "रेटिंग और समीक्षा",
      "billing_cycle": "बिलिंग चक्र",
      "weekly": "साप्ताहिक",
      "monthly": "मासिक",
      "delivery_time": "वितरण समय",
      "lunch": "दोपहर का भोजन",
      "dinner": "रात का खाना",
      "delivery_address": "वितरण का पता",
      "payment_method": "भुगतान विधि",
      "pay_subscribe": "रेज़रपे के माध्यम से भुगतान करें",
      "processing_payment": "सुरक्षित रेज़रपे गेटवे लोड हो रहा है...",
      "add_ons": "छाछ और अतिरिक्त आइटम",
      "guest_plates": "अतिथि थाली शेड्यूल करें",
      "invoice_print": "इनवॉइस पीडीएफ डाउनलोड करें",
      "kitchen_cook_dashboard": "किचन डिस्प्ले और प्रेप काउंट",
      "rider_route_dashboard": "राइडर जीपीएस रूट वॉकथ्रू",
      "owner_dashboard": "टिफिन ओनर पैनल",
      "super_admin_dashboard": "सुपर एडमिन एनालिटिक्स"
    }
  },
  mr: {
    translation: {
      "app_title": "टिफिनगो प्रो",
      "simulation_panel": "सिम्युलेशन रोल सेंटर",
      "active_identity": "सक्रिय ओळख",
      "choose_role": "स्क्रीन तपासण्यासाठी रोल निवडा",
      "home": "मुख्यपृष्ठ",
      "kitchens": "स्वयंपाकघर",
      "my_subscriptions": "माझ्या सदस्यता",
      "my_orders": "माझे सक्रिय ऑर्डर्स",
      "register_profile": "ग्राहक प्रोफाइल नोंदणी करा",
      "register_desc": "सदस्यता आणि थेट ऑर्डर ट्रॅकिंग मिळवण्यासाठी आपले तपशील प्रविष्ट करा.",
      "subscribe_now": "आता सदस्य व्हा",
      "rating": "रेटिंग",
      "delivery_tracking": "डिलिव्हरी ट्रॅकिंग",
      "active_tracking": "थेट GPS मार्ग ट्रॅकिंग",
      "rate_review": "रेटिंग आणि पुनरावलोकन",
      "billing_cycle": "बिलिंग सायकल",
      "weekly": "साप्ताहिक",
      "monthly": "मासिक",
      "delivery_time": "डिलिव्हरी वेळ",
      "lunch": "दुपारचे जेवण",
      "dinner": "रात्रीचे जेवण",
      "delivery_address": "डिलिव्हरी पत्ता",
      "payment_method": "देयक पद्धत",
      "pay_subscribe": "रेझरपेद्वारे पेमेंट करा",
      "processing_payment": "सुरक्षित रेझरपे गेटवे उघडत आहे...",
      "add_ons": "ताक आणि अतिरिक्त पदार्थ",
      "guest_plates": "अतिथी ताट शेड्यूल करा",
      "invoice_print": "इनव्हॉइस पीडीएफ डाउनलोड करा",
      "kitchen_cook_dashboard": "किचन डिस्प्ले आणि प्रेप काउंट",
      "rider_route_dashboard": "राइडर जीपीएस मार्ग वॉकथ्रू",
      "owner_dashboard": "टिफिन ओनर पॅनेल",
      "super_admin_dashboard": "सुपर ॲडमिन विश्लेषण"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
