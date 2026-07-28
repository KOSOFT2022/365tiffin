/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import i18n from './lib/i18n';

/**
 * Translations Map for dynamic content like kitchens, packages, menus, locations, and steps
 */
const TRANSLATIONS_MAP: Record<string, Record<string, string>> = {
  hi: {
    // Kitchen Names
    "Annapurna Pure Veg Kitchen": "अन्नपूर्णा शुद्ध शाकाहारी रसोई",
    "Royal Feast Kitchen": "शाही दावत रसोई (रॉयल फीस्ट)",
    "The Fit Bistro (Keto & Diet)": "द फिट बिस्ट्रो (कीटो और डाइट)",
    "Deccan Gymkhana Spice Box": "डेक्कन जिमखाना स्पाइस बॉक्स",
    "Kothrud Homemade Veg Tiffin": "कोथरुड होममेड वेज टिफिन",
    "Koregaon Park Organic Tiffin": "कोरेगांव पार्क ऑर्गेनिक टिफिन",

    // Kitchen Addresses
    "Sector 4, Greenfield Residency, Pune": "सेक्टर 4, ग्रीनफील्ड रेजिडेंसी, पुणे",
    "Kalyani Nagar Main Road, Pune": "कल्याणी नगर मेन रोड, पुणे",
    "Viman Nagar, Lane 5, Pune": "विमान नगर, गली 5, पुणे",
    "Deccan Gymkhana, near FC Road, Pune": "डेक्कन जिमखाना, एफसी रोड के पास, पुणे",
    "Kothrud Main Depot Area, Pune": "कोथरुड मुख्य डिपो क्षेत्र, पुणे",
    "Lane 7, Koregaon Park, Pune": "गली 7, कोरेगांव पार्क, पुणे",

    // Customer Address
    "Tower B, Flat 502, Horizon Heights, Pune": "टावर बी, फ्लैट 502, होराइजन हाइट्स, पुणे",
    "Apt 403, Golden Woods, Pune": "फ्लैट 403, गोल्डन वुड्स, पुणे",
    "Penthouse A, Skyline Towers, Kalyani Nagar, Pune": "पेंटहाउस ए, स्काईलाइन टावर्स, कल्याणी नगर, पुणे",

    // Kitchen Descriptions
    "100% vegetarian, authentic home-cooked meals prepared with cold-pressed oils, fresh organic produce, and minimal spice for healthy, daily consumption.": "100% शाकाहारी, वास्तविक घर का बना भोजन जो कोल्ड-प्रेस्ड तेलों, ताजी जैविक उपज और स्वास्थ्यवर्धक दैनिक उपभोग के लिए न्यूनतम मसालों के साथ तैयार किया गया है।",
    "Specializing in traditional slow-cooked chicken, eggs, and authentic mutton curries, alongside fresh local vegetarian selections.": "पारंपरिक धीमी आंच पर पके हुए चिकन, अंडे और प्रामाणिक मटन करी में विशेषज्ञता के साथ-साथ ताजे स्थानीय शाकाहारी विकल्प।",
    "Precision calories, high fiber, and macro-tracked meals specifically engineered for athletes, keto-practitioners, and muscle building diets.": "सटीक कैलोरी, उच्च फाइबर और मैक्रो-ट्रैक्ड भोजन जो विशेष रूप से एथलीटों, कीटो-अभ्यासियों और मांसपेशियों के निर्माण वाले आहार के लिए तैयार किया गया है।",
    "Traditional Maharashtrian dishes, spicy Varadi chicken, and rich Kolhapuri veg tiffins prepared with freshly hand-pounded masalas.": "पारंपरिक महाराष्ट्रीयन व्यंजन, तीखा वराडी चिकन और समृद्ध कोल्हापुरी वेज टिफिन जो ताजे हाथ से कूटे गए मसालों से तैयार किए गए हैं।",
    "Homely Gujarati and Rajasthani style satvik meals, cooked with less oil and high hygiene standards. Recommended for senior citizens and students.": "सॉफ्ट गुजराती और राजस्थानी शैली का सात्विक भोजन, कम तेल और उच्च स्वच्छता मानकों के साथ पकाया गया। वरिष्ठ नागरिकों और छात्रों के लिए अनुशंसित।",
    "Aesthetic, healthy organic bowls, cold-pressed seed oils, farm-to-table vegetables, brown rice, millets, and superfood additions.": "सौंदर्यपूर्ण, स्वस्थ जैविक कटोरे, कोल्ड-प्रेस्ड बीज तेल, फार्म-टू-टेबल सब्जियां, भूरा चावल, बाजरा और सुपरफूड शामिल हैं।",

    // Package Names
    "Classic Veg Subscription": "क्लासिक वेज सब्सक्रिप्शन",
    "Royal Veg Premium Feast": "रॉयल वेज प्रीमियम फीस्ट",
    "Delight Non-Veg Plan": "डिलाइट नॉन-वेज प्लान",
    "Royal Non-Veg Premium": "रॉयल नॉन-वेज प्रीमियम",
    "High Protein Athlete Fuel": "हाई प्रोटीन एथलीट फ्यूल",
    "Classic Maharashtrian Meal": "क्लासिक महाराष्ट्रीयन भोजन",
    "Satvik Homely Veg Plan": "सात्विक घरेलू वेज प्लान",
    "Premium Organic Tiffin Box": "प्रीमियम ऑर्गेनिक टिफिन बॉक्स",

    // Package Descriptions
    "Perfect for daily office or home lunch. Balanced, lightweight, and healthy.": "दैनिक कार्यालय या घरेलू दोपहर के भोजन के लिए बिल्कुल सही। संतुलित, हल्का और स्वस्थ।",
    "Treat yourself to premium dishes including paneer, special sweets, and direct farm buttermilk.": "पनीर, विशेष मिठाइयों और सीधे फार्म की छाछ सहित प्रीमियम व्यंजनों का आनंद लें।",
    "Alternating Veg & Non-Veg (3 days Chicken/Egg curries, 3 days premium vegetarian).": "वैकल्पिक वेज और नॉन-वेज (3 दिन चिकन/अंडा करी, 3 दिन प्रीमियम शाकाहारी)।",
    "Daily succulent non-veg (Chicken/Egg/Fish) with aromatic long-grain rice and traditional sweets.": "सुगंधित लंबे दाने वाले चावल और पारंपरिक मिठाइयों के साथ दैनिक रसीला नॉन-वेज (चिकन/अंडा/मछली)।",
    "Tracked macros (~600 kcal, 45g Protein, low-carb) featuring high fiber and complex carbs.": "ट्रैक्ड मैक्रोज़ (~600 किलोकैलोरी, 45 ग्राम प्रोटीन, कम कार्ब) जिसमें उच्च फाइबर और जटिल कार्ब्स शामिल हैं।",
    "Authentic taste including Bhakri, spicy chicken/shev bhaji, dal and special basmati rice.": "भाकरी, तीखा चिकन/शेव भाजी, दाल और विशेष बासमती चावल सहित प्रामाणिक स्वाद।",
    "Mild spices, high nutritional value, featuring daily dal, seasonal veggies, phulkas, and buttermilk.": "हल्के मसाले, उच्च पोषण मूल्य, दैनिक दाल, मौसमी सब्जियां, फुल्का और छाछ शामिल हैं।",
    "Prepared using certified organic grains and cold-pressed oils. Comes with a complimentary detox juice.": "प्रमाणित जैविक अनाज और कोल्ड-प्रेस्ड तेलों का उपयोग करके तैयार किया गया। एक मानार्थ डिटॉक्स जूस के साथ आता है।",

    // Days of the week
    "Monday": "सोमवार",
    "Tuesday": "मंगलवार",
    "Wednesday": "बुधवार",
    "Thursday": "गुरुवार",
    "Friday": "शुक्रवार",
    "Saturday": "शनिवार",
    "Sunday": "रविवार",

    // Menu Items
    "Paneer Bhurji": "पनीर भुर्जी",
    "Yellow Dal Tadka": "पीली दाल तड़का",
    "Jeera Rice": "जीरा चावल",
    "4 Butter Rotis": "4 बटर रोटी",
    "Kachumber Salad": "कचूमर सलाद",
    "Aloo Gobhi Masala": "आलू गोभी मसाला",
    "Moong Dal Chilka": "मूंग दाल छिलका",
    "Steamed Basmati Rice": "उबला बासमती चावल",
    "4 Wheat Rotis": "4 गेहूं की रोटी",
    "Sweet Lassi": "मीठी लस्सी",
    "Mix Veg Handi": "मिक्स वेज हांडी",
    "Chana Dal Fry": "चना दाल फ्राई",
    "Peas Pulao": "मटर पुलाव",
    "Gulab Jamun": "गुलाब जामुन",
    "Bhindi Do Pyaza": "भिंडी दो प्याजा",
    "Dal Makhani": "दाल मखनी",
    "Roasted Papad": "भुना हुआ पापड़",
    "Shahi Paneer": "शाही पनीर",
    "Panchmel Dal": "पंचमेल दाल",
    "Veg Pulao": "वेज पुलाव",
    "Moong Dal Halwa": "मूंग दाल हलवा",
    "Baingan Bharta": "बैंगन भर्ता",
    "Dal Tadka": "दाल तड़का",
    "Salad & Pickle": "सलाद और अचार",
    "Special Dum Aloo": "विशेष दम आलू",
    "Chole Bhature / Rice": "छोले भटूरे / चावल",
    "Veg Biryani": "वेज बिरयानी",
    "Kheer (Special Sunday Sweet)": "खीर (विशेष रविवार मिठाई)",
    "Dhaba Chicken Curry": "ढाबा चिकन करी",
    "Dry Aloo Methi": "सूखी आलू मेथी",
    "4 Chapatis": "4 चपाती",
    "Mint Chutney": "पुदीना चटनी",
    "Egg Masala Curry": "अंडा मसाला करी",
    "Steamed Rice": "उबले हुए चावल",
    "Boiled Egg (Add-on)": "उबला हुआ अंडा (अतिरिक्त)",
    "Butter Chicken": "बटर चिकन",
    "5 Butter Chapatis": "5 बटर चपाती",
    "Rasgulla": "रसगुल्ला",
    "Tandoori Chicken Tikka Gravy": "तंदूरी चिकन टिक्का ग्रेवी",
    "Yellow Dal": "पीली दाल",
    "Aromatic Rice": "सुगंधित चावल",
    "Onion Rings": "प्याज के छल्ले",
    "Mutton Rogan Josh (Special)": "मटन रोगन जोश (विशेष)",
    "Mix Veg Dry": "मिक्स वेज सूखी",
    "Shahi Tukda": "शाही टुकड़ा",
    "Fish Curry (Malvani style)": "मछली करी (मालवणी शैली)",
    "Moong Dal": "मूंग दाल",
    "Steamed Basmati": "उबला बासमती",
    "Kachumber": "कचूमर",
    "Aromatic Chicken Dum Biryani": "सुगंधित चिकन दम बिरयानी",
    "Mirchi Ka Salan": "मिर्ची का सालन",
    "Raita": "रायता",
    "Double Ka Meetha (Dessert)": "डबल का मीठा (मिठाई)",
    "Herb Grilled Chicken Breast": "हर्ब ग्रिल्ड चिकन ब्रेस्ट",
    "Sautéed Broccoli & Zucchini": "सौते ब्रोकली और जुकिनी",
    "Quinoa Rice Pilaf": "क्विनोआ राइस पुलाव",
    "2 Ragi Chapatis": "2 रागी चपाती",
    "Grilled Paneer Steak": "ग्रिल्ड पनीर स्टेक",
    "Boiled Chana Salad": "उबला चना सलाद",
    "Brown Rice": "भूरा चावल",
    "2 Multi-Grain Chapatis": "2 मल्टी-ग्रेन चपाती",
    "Lemon Garlic Fish": "लेमन गार्लिक फिश",
    "Stir-Fry Beans and Carrots": "स्टिर-फ्राई बीन्स और गाजर",
    "Quinoa": "क्विनोआ",
    "High-Protein Soya Keema": "हाई-प्रोटीन सोया कीमा",
    "Moong Sprouts": "मूंग स्प्राउट्स",
    "Chicken Tikka Salad": "चिकन टिक्का सलाद",
    "Sautéed Mushrooms & Spinach": "सौते मशरूम और पालक",
    "Brown Rice Pulao": "भूरा चावल पुलाव",
    "Baked Tofu with Herbs": "हर्ब बेक्ड टोफू",
    "Boiled Lentils & Beetroot Salad": "उबली दाल और चुकंदर सलाद",
    "Diet-friendly Herb Chicken": "डाइट-फ्रेंडली हर्ब चिकन",
    "Steamed Veggies": "भाप से पकी सब्जियां",
    "Cauliflower Mock-Rice": "गोभी मॉक-राइस",
    "Sprouts Cup": "स्प्राउट्स कप",
    "Varadi Chicken Gravy": "वराडी चिकन ग्रेवी",
    "Pithla": "पिठला",
    "Bhakri (2 pcs)": "भाकरी (2 नग)",
    "Thecha": "ठेचा",
    "Shev Bhaji Masala": "शेव भाजी मसाला",
    "3 Chapatis": "3 चपाती",
    "Egg Curry": "अंडा करी",
    "Baingan Masala": "बैंगन मसाला",
    "3 Butter Rotis": "3 बटर रोटी",
    "Solkadhi": "सोलकढ़ी",
    "Paneer Kolhapuri": "पनीर कोल्हापुरी",
    "Papad": "पापड़",
    "Kolhapuri Chicken Masala": "कोल्हापुरी चिकन मसाला",
    "Mix Veg": "मिक्स वेज",
    "3 Bhakri": "3 भाकरी",
    "Kheer": "खीर",
    "Methi Chaman": "मेथी चमन",
    "Pickle": "अचार",
    "Mutton Masala Gravy": "मटन मसाला ग्रेवी",
    "Alu Wadi": "आलू वड़ी",
    "Pulao Rice": "पुलाव चावल",
    "Aloo Gobhi satvik": "आलू गोभी सात्विक",
    "Lauki Tamatar": "लौकी टमाटर",
    "Toor Dal Fry": "तूर दाल फ्राई",
    "4 Phulkas": "4 फुल्का",
    "Buttermilk": "छाछ",
    "Bhindi Masala (Mild)": "भिंडी मसाला (सॉफ्ट)",
    "Kadhi Khichdi": "कढ़ी खिचड़ी",
    "Methi Matar Malai": "मेथी मटर मलाई",
    "Sev Tamatar Sabji": "सेव टमाटर सब्जी",
    "Chana Dal": "चना दाल",
    "Salad": "सलाद",
    "Baingan Fry (Satvik)": "बैंगन फ्राई (सात्विक)",
    "Curd": "दही",
    "Gujarati Dal Special": "गुजराती दाल स्पेशल",
    "Undhiyu / Mix Veg": "उंधियू / मिक्स वेज",
    "Organic Paneer Saag": "ऑर्गेनिक पनीर साग",
    "Yellow Lentils": "पीली दाल",
    "Jowar Roti (3 pcs)": "ज्वार रोटी (3 नग)",
    "Detox Juice": "डिटॉक्स जूस",
    "Farm-to-Table Mix Veg": "फार्म-टू-टेबल मिक्स वेज",
    "Moong Sprouts Curry": "मूंग स्प्राउट्स करी",
    "3 Multigrain Rotis": "3 मल्टीग्रेन रोटी",
    "Flaxseeds": "अलसी के बीज",
    "Tofu Bell Peppers": "टोफू शिमला मिर्च",
    "3 Bajra Rotis": "3 बाजरा रोटी",
    "Sautéed Mushrooms & Broccoli": "सौते मशरूम और ब्रोकली",
    "Toor Dal Tadka": "तूर दाल तड़का",
    "3 Jowar Rotis": "3 ज्वार रोटी",
    "Millet Rice": "बाजरा चावल",
    "Organic Methi Paneer": "ऑर्गेनिक मेथी पनीर",
    "Baingan Bharta Organic": "बैंगन भर्ता ऑर्गेनिक",
    "Quinoa Rice": "क्विनोआ चावल",
    "Fruit bowl": "फलों का कटोरा",
    "Special Vegan Dum Aloo": "विशेष वीगन दम आलू",
    "Kadhi satvik": "कढ़ी सात्विक",
    "Organic Sweet Cup": "ऑर्गेनिक स्वीट कप",

    // Ride steps / Landmarks
    "Pick up hot tiffins from Annapurna Kitchen (Sector 4)": "अन्नपूर्णा किचन (सेक्टर 4) से गरमागरम टिफिन लें",
    "Take Greenfield Residency Exit towards Ring Road": "रेंग रोड की ओर ग्रीनफील्ड रेजिडेंसी एग्जिट लें",
    "Turn left after the Phoenix Mall Crossing": "फीनिक्स मॉल क्रॉसिंग के बाद बाएं मुड़ें",
    "Arrive at Tower B, Flat 502, Horizon Heights": "टावर बी, फ्लैट 502, होराइजन हाइट्स पर पहुंचें",
    "Drive towards Golden Woods Apt 403": "गोल्डन वुड्स अपार्टमेंट 403 की ओर बढ़ें",
    "Pick up packed non-veg premium box from Royal Feast Kitchen": "शाही दावत (रॉयल फीस्ट) रसोई से पैक्ड नॉन-वेज प्रीमियम बॉक्स लें",
    "Head north on Kalyani Nagar Main Road": "कल्याणी नगर मुख्य मार्ग पर उत्तर की ओर चलें",
    "Deliver at Skyline Towers Penthouse A": "स्काईलाइन टावर्स पेंटहाउस ए पर डिलीवर करें",

    // General Words
    "Pure Veg": "शुद्ध शाकाहारी",
    "Veg / Non-Veg": "शाकाहारी / मांसाहारी",
    "🟢 Pure Veg": "🟢 शुद्ध शाकाहारी",
    "🔴 Veg & Non-Veg": "🔴 शाकाहारी और मांसाहारी",
    "Fresh Spiced Buttermilk (Chaach)": "ताजा मसालेदार छाछ",
    "Roasted Papad (2 pcs)": "भुना हुआ पापड़ (2 नग)",
    "Extra Butter Chapati (2 pcs)": "अतिरिक्त बटर चपाती (2 नग)",
    "Premium Alphonso Mango Pickle (50g)": "प्रीमियम हापुस आम का अचार (50 ग्राम)",
    "Sweet Gulab Jamun (2 pcs)": "मीठा गुलाब जामुन (2 नग)",
    "Spicy Garlic Chutney (Special)": "तीखी लहसुन की चटनी (विशेष)",
    "beverage": "पेय पदार्थ",
    "crunch": "कुरकुरा",
    "bread": "रोटी",
    "condiment": "अचार/चटनी",
    "dessert": "मिठाई",

    // Statuses
    "placed": "ऑर्डर प्राप्त",
    "preparing": "तैयार किया जा रहा है",
    "ready_for_dispatch": "भेजने के लिए तैयार",
    "dispatched": "भेजा गया",
    "out_for_delivery": "वितरण के लिए बाहर",
    "delivered": "डिलिवर किया गया",
    "regular": "नियमित",
    "regular_with_guest_and_addons": "अतिथि और अतिरिक्त आइटम के साथ",
    "Bank Auto-Debit Mandate (Daily Release)": "बैंक ऑटो-डेबिट मैंडेट (दैनिक रिलीज)",
    "State Bank of India": "भारतीय स्टेट बैंक",
    "authorized": "अधिकृत (सक्रिय)",
    "paused": "रुका हुआ (पॉज़्ड)",
    "Bank Mandate Authorized": "बैंक मैंडेट अधिकृत",
    "Daily Debit Cap": "दैनिक डेबिट सीमा",
    "Daily Release Rate": "दैनिक रिलीज दर",
    "Total Safe Released": "कुल सुरक्षित रिलीज",

    // Landing Page Navigation
    "Features": "विशेषताएं",
    "Daily Menu": "दैनिक मेनू",
    "Partner Kitchens": "भागीदार रसोई",
    "Our Standard": "हमारा मानक",
    "Sign In": "लॉग इन करें",
    "Subscribe Now": "अभी सब्सक्राइब करें",
    "Subscribe": "सब्सक्राइब करें",

    // Landing Page Hero
    "Pure Home Cooked Meal Subscription": "शुद्ध घर पर बने भोजन की सदस्यता",
    "Healthy, Hot Home Meals Delivered Daily.": "स्वस्थ, गरमागरम घरेलू भोजन रोजाना वितरित।",
    "Ditch the greasy restaurant delivery. TiffinGo Pro connects busy professionals, students, and families with certified home kitchens preparing fresh, custom-crafted lunch and dinner plans with active live GPS route tracking.": "चिकने रेस्टोरेंट डिलीवरी को छोड़ें। टिफिनगो प्रो व्यस्त पेशेवरों, छात्रों और परिवारों को प्रमाणित घरेलू रसोई से जोड़ता है जो सक्रिय लाइव जीपीएस रूट ट्रैकिंग के साथ ताजा, कस्टम-तैयार दोपहर और रात के भोजन की योजना बनाते हैं।",
    "Find Tiffin Subscriptions": "टिफिन सदस्यता खोजें",
    "Kitchen Partner Portal": "रसोई भागीदार पोर्टल",
    "Local Home Kitchens": "स्थानीय घरेलू रसोई",
    "On-Time Hot Delivery": "समय पर गर्म डिलीवरी",
    "Average Customer Rating": "औसत ग्राहक रेटिंग",

    // Landing Page Hero Card
    "Premium Meal Services": "प्रीमियम भोजन सेवाएं",
    "100% Home Cooked": "100% घर का बना",
    "Pure Taste, High Nutrition": "शुद्ध स्वाद, उच्च पोषण",
    "Vetted local kitchens delivering authentic recipes in clean thermal hotboxes.": "साफ-सुथरे थर्मल हॉटबॉक्स में प्रामाणिक व्यंजन वितरित करने वाले जांचे-परखे स्थानीय रसोई।",
    "Zero Artificial Preservatives": "शून्य कृत्रिम संरक्षक",
    "Free Triple-Insulated Hotbox": "निःशुल्क ट्रिपल-इंसुलेटेड हॉटबॉक्स",
    "Skip or Pause Subscription with 1-Click": "1-क्लिक के साथ सदस्यता छोड़ें या रोकें",
    "Secure Bank-Mandate Releases On-Delivery": "वितरण पर सुरक्षित बैंक-मैंडेट जारी",
    "Browse Weekly Menus & Start Plan": "साप्ताहिक मेनू देखें और योजना शुरू करें",
    "POPULAR STARTING FROM": "लोकप्रिय शुरुआती कीमत",
    "Classic Indian Veg Thali": "क्लासिक भारतीय वेज थाली",
    "Roti, Dal, Sabji, Rice & Dessert": "रोटी, दाल, सब्जी, चावल और मिठाई",

    // Landing Page Core Features
    "Why TiffinGo Pro": "टिफिनगो प्रो क्यों",
    "Elegance Meets Everyday Nourishment": "सुंदरता और दैनिक पोषण का मिलन",
    "We did not build another food delivery app. We engineered a complete daily subscription pipeline that guarantees hot, certified, hygienic meals exactly when your break starts.": "हमने कोई साधारण फूड डिलीवरी ऐप नहीं बनाया है। हमने एक संपूर्ण दैनिक सदस्यता पाइपलाइन तैयार की है जो ठीक आपके ब्रेक शुरू होने पर गर्म, प्रमाणित, स्वच्छ भोजन की गारंटी देती है।",
    "Certified Kitchens": "प्रमाणित रसोई",
    "Every chef is vetted, licensed, and checked for sanitization and nutritional consistency. No artificial food dyes or trans-fats.": "प्रत्येक शेफ की जांच, लाइसेंस और स्वच्छता एवं पोषण संबंधी निरंतरता की पुष्टि की जाती है। कोई कृत्रिम रंग या ट्रांस-फैट नहीं।",
    "Tracked Diets": "ट्रैक्ड डाइट",
    "Whether you prefer pure vegetarian, non-vegetarian feasts, or high-protein macro-tracked keto meals, we have a customized package for you.": "चाहे आप शुद्ध शाकाहारी, मांसाहारी दावत, या उच्च-प्रोटीन मैक्रो-ट्रैक्ड कीटो भोजन पसंद करते हैं, हमारे पास आपके लिए एक अनुकूलित पैकेज है।",
    "Flexible Schedule": "लचीला कार्यक्रम",
    "Going out of town? Instantly pause your subscription or skip specific days. Manage lunch vs dinner slots seamlessly with one click.": "शहर से बाहर जा रहे हैं? अपनी सदस्यता को तुरंत रोकें या विशिष्ट दिनों को छोड़ें। एक क्लिक से दोपहर बनाम रात के भोजन के स्लॉट को आसानी से प्रबंधित करें।",
    "Premium Add-ons": "प्रीमियम एड-ऑन्स",
    "Configure guest plates for visiting friends, schedule fresh buttermilk/papad, and receive automatic monthly receipt invoice PDFs.": "आने वाले दोस्तों के लिए अतिथि थाली कॉन्फ़िगर करें, ताजा छाछ/पापड़ शेड्यूल करें, और स्वचालित मासिक रसीद चालान पीडीएफ प्राप्त करें।",

    // Landing Page Teaser
    "Fresh Cooked Teaser": "ताजा तैयार मेनू झलक",
    "No Boredom. Just Diverse Home Menus.": "कोई बोरियत नहीं। बस विविध घरेलू मेनू।",
    "Our kitchen partners alternate their menu daily so you never eat the same meal twice in a week. Click on any weekday to inspect the actual meals prepared on that day!": "हमारे रसोई भागीदार रोजाना अपना मेनू बदलते हैं ताकि आप सप्ताह में दो बार एक ही भोजन न करें। उस दिन तैयार किए गए वास्तविक भोजन को देखने के लिए किसी भी कार्यदिवस पर क्लिक करें!",
    "Lighter on spice, richer in nutrition": "मसालों में हल्का, पोषण में समृद्ध",
    "Made with premium long grain Basmati rice": "प्रीमियम लंबे दाने वाले बासमती चावल से निर्मित",
    "Whole wheat rotis prepared fresh with hand-churned ghee": "हाथ से मथे हुए घी के साथ ताजी तैयार गेहूं की रोटियां",
    "Explore customized healthy packages": "अनुकूलित स्वस्थ पैकेज तलाशें",
    "Standard Vegetarian Menu": "मानक शाकाहारी मेनू",
    "Alternating Daily": "रोज बदलने वाला",

    // Landing Page Partners
    "Our Partners": "हमारे भागीदार",
    "Vetted Home Kitchens": "जांचे-परखे घरेलू रसोई",
    "We partner only with elite home kitchens following standard hygiene regulations. Order with absolute peace of mind.": "हम केवल मानक स्वच्छता नियमों का पालन करने वाले विशिष्ट घरेलू रसोइयों के साथ साझेदारी करते हैं। पूरे विश्वास के साथ ऑर्डर करें।",
    "View all 15 active kitchens": "सभी 15 सक्रिय रसोई देखें",
    "Sub starts at": "सब्सक्रिप्शन शुरू",
    "Week": "सप्ताह",
    "Browse Plan": "योजना देखें",

    // Landing Page Ecosystem / Portal
    "Our Ecosystem": "हमारा इकोसिस्टम",
    "One Unified Kitchen-to-Diner Solution": "एक एकीकृत रसोई-से-भोजन समाधान",
    "We connect home cooks, logistics captains, and hungry diners under a highly synced real-time data engine. Experience true operational clarity.": "हम घरेलू रसोइयों, रसद कप्तानों और भूखे ग्राहकों को एक अत्यधिक सिंक किए गए वास्तविक समय डेटा इंजन के तहत जोड़ते हैं। वास्तविक परिचालन स्पष्टता का अनुभव करें।",
    "For Diners & Customers": "ग्राहकों के लिए",
    "Subscribe to trusted kitchens, alternate times daily, scheduled guest plates, order buttermilk add-ons, and track riders on precise maps.": "विश्वसनीय रसोई की सदस्यता लें, दैनिक समय बदलें, अतिथि थाली निर्धारित करें, छाछ ऐड-ऑन ऑर्डर करें, और सटीक मानचित्रों पर सवारों को ट्रैक करें।",
    "Sign In as Customer": "ग्राहक के रूप में लॉग इन करें",
    "For Kitchens & Riders": "रसोई और सवारों के लिए",
    "Manage automated prep lists, configure weekly menus, guide riders with turn-by-turn simulation walkthroughs, and audit overall revenue.": "स्वचालित तैयारी सूचियों का प्रबंधन करें, साप्ताहिक मेनू कॉन्फ़िगर करें, टर्न-बाय-टर्न सिमुलेशन वॉकथ्रू के साथ सवारों का मार्गदर्शन करें, और समग्र राजस्व का ऑडिट करें।",
    "Kitchen Partner": "रसोई भागीदार",
    "Rider Portal": "राइडर पोर्टल",
    "Admin Dashboard Login": "व्यवस्थापक डैशबोर्ड लॉगिन",
    "Privacy Policy": "गोपनीयता नीति",
    "Terms of Service": "सेवा की शर्तें",
    "Refund Policy": "धनवापसी नीति",
    "Razorpay Security": "रेज़रपे सुरक्षा",
    "Designed for healthy lifestyles & home cooking ecosystems.": "स्वस्थ जीवन शैली और घरेलू खाना पकाने के पारिस्थितिकी तंत्र के लिए डिज़ाइन किया गया।"
  },
  mr: {
    // Kitchen Names
    "Annapurna Pure Veg Kitchen": "अन्नपूर्णा शुध्द शाकाहारी किचन",
    "Royal Feast Kitchen": "रॉयल फीस्ट किचन (शाही मेजवानी)",
    "The Fit Bistro (Keto & Diet)": "द फिट बिस्ट्रो (कीटो आणि डाएट)",
    "Deccan Gymkhana Spice Box": "डेक्कन जिमखाना स्पाइस बॉक्स",
    "Kothrud Homemade Veg Tiffin": "कोथरूड होममेड व्हेज टिफिन",
    "Koregaon Park Organic Tiffin": "कोरेगाव पार्क ऑरगॅनिक टिफिन",

    // Kitchen Addresses
    "Sector 4, Greenfield Residency, Pune": "सेक्टर ४, ग्रीनफिल्ड रेसिडेन्सी, पुणे",
    "Kalyani Nagar Main Road, Pune": "कल्याणी नगर मुख्य रस्ता, पुणे",
    "Viman Nagar, Lane 5, Pune": "विमान नगर, गल्ली ५, पुणे",
    "Deccan Gymkhana, near FC Road, Pune": "डेक्कन जिमखाना, एफसी रोड जवळ, पुणे",
    "Kothrud Main Depot Area, Pune": "कोथरूड मुख्य डेपो परिसर, पुणे",
    "Lane 7, Koregaon Park, Pune": "गल्ली ७, कोरेगाव पार्क, पुणे",

    // Customer Address
    "Tower B, Flat 502, Horizon Heights, Pune": "टॉवर बी, फ्लॅट ५०२, होरायझन हाईट्स, पुणे",
    "Apt 403, Golden Woods, Pune": "फ्लॅट ४०३, गोल्डन वूड्स, पुणे",
    "Penthouse A, Skyline Towers, Kalyani Nagar, Pune": "पेंटहाऊस ए, स्कायलाईन टॉवर्स, कल्याणी नगर, पुणे",

    // Kitchen Descriptions
    "100% vegetarian, authentic home-cooked meals prepared with cold-pressed oils, fresh organic produce, and minimal spice for healthy, daily consumption.": "१००% शाकाहारी, घाण्याचे तेल, सेंद्रिय भाजीपाला आणि कमीत कमी मसाल्यांचा वापर करून तयार केलेले घरगुती सकस आणि चविष्ट जेवण.",
    "Specializing in traditional slow-cooked chicken, eggs, and authentic mutton curries, alongside fresh local vegetarian selections.": "पारंपरिक पद्धतीने शिजवलेले चिकन, अंडी आणि अस्सल मटण रस्सा यासोबतच ताज्या शाकाहारी जेवणाची उत्तम सोय.",
    "Precision calories, high fiber, and macro-tracked meals specifically engineered for athletes, keto-practitioners, and muscle building diets.": "अॅथलीट्स आणि डाएट करणाऱ्यांसाठी योग्य प्रमाणात कॅलरीज, भरपूर फायबर आणि प्रथिने असलेले संतुलित जेवण.",
    "Traditional Maharashtrian dishes, spicy Varadi chicken, and rich Kolhapuri veg tiffins prepared with freshly hand-pounded masalas.": "पारंपरिक महाराष्ट्रीयन चव, झणझणीत वऱ्हाडी चिकन आणि कोल्हापुरी व्हेज थाळी, घरगुती खड्या मसाल्यांमध्ये बनवलेले जेवण.",
    "Homely Gujarati and Rajasthani style satvik meals, cooked with less oil and high hygiene standards. Recommended for senior citizens and students.": "कमी तेलात आणि अत्यंत स्वच्छतेने बनवलेले गुजराती आणि राजस्थानी पद्धतीचे सात्विक जेवण. ज्येष्ठ नागरिक आणि विद्यार्थ्यांसाठी उत्तम.",
    "Aesthetic, healthy organic bowls, cold-pressed seed oils, farm-to-table vegetables, brown rice, millets, and superfood additions.": "सेंद्रिय धान्य, सेंद्रिय भाज्या, सेंद्रिय तांदूळ आणि सुपरफूड्सचा वापर करून बनवलेले अत्यंत पौष्टिक जेवण.",

    // Package Names
    "Classic Veg Subscription": "क्लासिक व्हेज सबस्क्रिप्शन",
    "Royal Veg Premium Feast": "रॉयल व्हेज प्रीमियम मेजवानी",
    "Delight Non-Veg Plan": "डिलाइट नॉन-व्हेज प्लॅन",
    "Royal Non-Veg Premium": "रॉयल नॉन-व्हेज प्रीमियम",
    "High Protein Athlete Fuel": "हाय प्रोटीन अॅथलीट फ्यूल",
    "Classic Maharashtrian Meal": "क्लासिक महाराष्ट्रीयन जेवण",
    "Satvik Homely Veg Plan": "सात्विक घरगुती व्हेज प्लॅन",
    "Premium Organic Tiffin Box": "प्रीमियम ऑरगॅनिक टिफिन बॉक्स",

    // Package Descriptions
    "Perfect for daily office or home lunch. Balanced, lightweight, and healthy.": "ऑफिस किंवा घरासाठी रोजच्या दुपारच्या जेवणासाठी उत्तम. संतुलित, हलके आणि सकस.",
    "Treat yourself to premium dishes including paneer, special sweets, and direct farm buttermilk.": "पनीर, खास मिठाई आणि थेट शेतातून आलेले ताक यांसह उत्कृष्ट मेजवानीचा आनंद घ्या.",
    "Alternating Veg & Non-Veg (3 days Chicken/Egg curries, 3 days premium vegetarian).": "व्हेज आणि नॉन-व्हेज दोन्हीचा आस्वाद (३ दिवस चिकन/अंडे रस्सा, ३ दिवस प्रीमियम शाकाहारी जेवण).",
    "Daily succulent non-veg (Chicken/Egg/Fish) with aromatic long-grain rice and traditional sweets.": "रोज गरमागरम मांसाहारी जेवण (चिकन/अंडे/मासे) सोबत सुवासिक बासमती तांदूळ आणि पारंपरिक मिठाई.",
    "Tracked macros (~600 kcal, 45g Protein, low-carb) featuring high fiber and complex carbs.": "योग्य प्रमाणात प्रथिने (४५ ग्रॅम प्रोटीन, ६०० कॅलरीज) आणि कमी कार्बोहायड्रेट्स असलेले डाएट जेवण.",
    "Authentic taste including Bhakri, spicy chicken/shev bhaji, dal and special basmati rice.": "मऊ भाकरी, झणझणीत चिकन/शेवभाजी, डाळ आणि सुवासिक भातासह घरगुती महाराष्ट्रीयन चव.",
    "Mild spices, high nutritional value, featuring daily dal, seasonal veggies, phulkas, and buttermilk.": "कमी तिखट, पौष्टिक घटक, रोज वरण-भात, मोसमी भाज्या, मऊ फुलके आणि गारगार ताक.",
    "Prepared using certified organic grains and cold-pressed oils. Comes with a complimentary detox juice.": "सेंद्रिय तृणधान्ये आणि घाण्याच्या तेलात बनवलेले जेवण. सोबत मोफत डिटॉक्स ज्यूस.",

    // Days of the week
    "Monday": "सोमवार",
    "Tuesday": "मंगळवार",
    "Wednesday": "बुधवार",
    "Thursday": "गुरुवार",
    "Friday": "शुक्रवार",
    "Saturday": "शनिवार",
    "Sunday": "रविवार",

    // Menu Items
    "Paneer Bhurji": "पनीर भुर्जी",
    "Yellow Dal Tadka": "वरण तडका (पीळी डाळ)",
    "Jeera Rice": "जीरा राईस (जिरे भात)",
    "4 Butter Rotis": "४ बटर चपात्या",
    "Kachumber Salad": "कोशिंबीर",
    "Aloo Gobhi Masala": "आलू गोबी मसाला",
    "Moong Dal Chilka": "मूग डाळ रस्सा",
    "Steamed Basmati Rice": "बासमती भात",
    "4 Wheat Rotis": "४ गव्हाच्या चपात्या",
    "Sweet Lassi": "गोड लस्सी",
    "Mix Veg Handi": "मिक्स व्हेज हांडी",
    "Chana Dal Fry": "चणा डाळ फ्राय",
    "Peas Pulao": "मटार पुलाव",
    "Gulab Jamun": "गुलाबजाम",
    "Bhindi Do Pyaza": "भेंडी मसाला",
    "Dal Makhani": "डाळ मखनी",
    "Roasted Papad": "भाजलेला पापड",
    "Shahi Paneer": "शाही पनीर",
    "Panchmel Dal": "पंचमेळ डाळ",
    "Veg Pulao": "व्हेज पुलाव",
    "Moong Dal Halwa": "मूग डाळ हलवा",
    "Baingan Bharta": "वांग्याचे भरीत",
    "Dal Tadka": "डाळ तडका",
    "Salad & Pickle": "कोशिंबीर आणि लोणचे",
    "Special Dum Aloo": "स्पेशल दम आलू",
    "Chole Bhature / Rice": "छोले भटुरे / भात",
    "Veg Biryani": "व्हेज बिर्याणी",
    "Kheer (Special Sunday Sweet)": "खीर (रविवार विशेष गोड)",
    "Dhaba Chicken Curry": "धाबा चिकन रस्सा",
    "Dry Aloo Methi": "सुकी बटाटा मेथी",
    "4 Chapatis": "४ चपात्या",
    "Mint Chutney": "पुदिना चटणी",
    "Egg Masala Curry": "अंडे मसाला रस्सा",
    "Steamed Rice": "साधा भात",
    "Boiled Egg (Add-on)": "उकडलेले अंडे (अतिरिक्त)",
    "Butter Chicken": "बटर चिकन",
    "5 Butter Chapatis": "५ बटर चपात्या",
    "Rasgulla": "रसगुल्ला",
    "Tandoori Chicken Tikka Gravy": "तंदूरी चिकन टिक्का ग्रेव्ही",
    "Yellow Dal": "पिवळी डाळ",
    "Aromatic Rice": "सुवासिक भात",
    "Onion Rings": "कांद्याचे काप",
    "Mutton Rogan Josh (Special)": "मटण रोगन जोश (विशेष)",
    "Mix Veg Dry": "सुकी मिक्स भाजी",
    "Shahi Tukda": "शाही तुकडा",
    "Fish Curry (Malvani style)": "मालवणी पद्धतीचे मासे रस्सा",
    "Moong Dal": "मूग डाळ",
    "Steamed Basmati": "बासमती भात",
    "Kachumber": "कोशिंबीर",
    "Aromatic Chicken Dum Biryani": "सुवासिक चिकन दम बिर्याणी",
    "Mirchi Ka Salan": "मिरचीचा सालाण",
    "Raita": "रायता",
    "Double Ka Meetha (Dessert)": "डबल का मिठा (मिठाई)",
    "Herb Grilled Chicken Breast": "हर्ब ग्रिल्ड चिकन",
    "Sautéed Broccoli & Zucchini": "परतलेली ब्रोकोली आणि झुकिनी",
    "Quinoa Rice Pilaf": "क्विनोआ राईस पुलाव",
    "2 Ragi Chapatis": "२ नाचणीच्या चपात्या",
    "Grilled Paneer Steak": "ग्रिल्ड पनीर स्टेक",
    "Boiled Chana Salad": "उकडलेले चणे सॅलड",
    "Brown Rice": "ब्राऊन राईस (तांबडा भात)",
    "2 Multi-Grain Chapatis": "२ बहुधान्य चपात्या (मल्टीग्रेन)",
    "Lemon Garlic Fish": "लेमन गार्लिक फिश",
    "Stir-Fry Beans and Carrots": "परतलेली फरसबी आणि गाजर",
    "Quinoa": "क्विनोआ",
    "High-Protein Soya Keema": "हाय-प्रोटिन सोया खिमा",
    "Moong Sprouts": "मटकी मोड",
    "Chicken Tikka Salad": "चिकन टिक्का सॅलड",
    "Sautéed Mushrooms & Spinach": "परतलेले मशरूम आणि पालक",
    "Brown Rice Pulao": "ब्राऊन राईस पुलाव",
    "Baked Tofu with Herbs": "हर्ब बेक्ड टोफू",
    "Boiled Lentils & Beetroot Salad": "उकडलेली डाळ आणि बीट सॅलड",
    "Diet-friendly Herb Chicken": "डाएट-फ्रेंडली चिकन",
    "Steamed Veggies": "वाफवलेल्या भाज्या",
    "Cauliflower Mock-Rice": "फ्लॉवर मॉक-राईस",
    "Sprouts Cup": "मोड आलेली कडधान्ये",
    "Varadi Chicken Gravy": "वऱ्हाडी चिकन रस्सा",
    "Pithla": "पिठलं",
    "Bhakri (2 pcs)": "२ ज्वारीच्या भाकरी",
    "Thecha": "खरडा / ठेचा",
    "Shev Bhaji Masala": "शेवभाजी मसाला",
    "3 Chapatis": "३ चपात्या",
    "Egg Curry": "अंडी रस्सा",
    "Baingan Masala": "वांगे मसाला",
    "3 Butter Rotis": "३ बटर चपात्या",
    "Solkadhi": "सोलकढी",
    "Paneer Kolhapuri": "पनीर कोल्हापुरी",
    "Papad": "पापड",
    "Kolhapuri Chicken Masala": "कोल्हापुरी चिकन मसाला",
    "Mix Veg": "मिक्स व्हेज",
    "3 Bhakri": "३ ज्वारीच्या भाकरी",
    "Kheer": "खीर",
    "Methi Chaman": "मेथी चमन",
    "Pickle": "लोणचे",
    "Mutton Masala Gravy": "झणझणीत मटण रस्सा",
    "Alu Wadi": "अळू वडी",
    "Pulao Rice": "पुलाव भात",
    "Aloo Gobhi satvik": "बटाटा फ्लॉवर सात्विक",
    "Lauki Tamatar": "दुधी भोपळा टोमॅटो भाजी",
    "Toor Dal Fry": "तूर डाळ फ्राय",
    "4 Phulkas": "४ मऊ फुलके",
    "Buttermilk": "ताक",
    "Bhindi Masala (Mild)": "भेंडी मसाला (कमी तिखट)",
    "Kadhi Khichdi": "कढी खिचडी",
    "Methi Matar Malai": "मेथी मटार मलाई",
    "Sev Tamatar Sabji": "शेव टोमॅटो भाजी",
    "Chana Dal": "चणा डाळ",
    "Salad": "सॅलड",
    "Baingan Fry (Satvik)": "वांगे फ्राय सात्विक",
    "Curd": "दही",
    "Gujarati Dal Special": "गुजराती डाळ स्पेशल",
    "Undhiyu / Mix Veg": "उंधियू / मिक्स व्हेज",
    "Organic Paneer Saag": "सेंद्रिय पनीर पालक भाजी",
    "Yellow Lentils": "पिवळी डाळ",
    "Jowar Roti (3 pcs)": "३ ज्वारीच्या भाकरी",
    "Detox Juice": "डिटॉक्स ज्यूस",
    "Farm-to-Table Mix Veg": "ताजी मिक्स भाजी (शेतातून थेट)",
    "Moong Sprouts Curry": "मूग उसळ",
    "3 Multigrain Rotis": "३ बहुधान्य चपात्या",
    "Flaxseeds": "जवस / अळशी",
    "Tofu Bell Peppers": "टोफू शिमला मिरची भाजी",
    "3 Bajra Rotis": "३ बाजरीच्या भाकरी",
    "Sautéed Mushrooms & Broccoli": "परतलेले मशरूम आणि ब्रोकोली",
    "Toor Dal Tadka": "तूर डाळ तडका",
    "3 Jowar Rotis": "३ ज्वारीच्या भाकरी",
    "Millet Rice": "बाजरीचा भात / बाजरी खिचडी",
    "Organic Methi Paneer": "सेंद्रिय मेथी पनीर",
    "Baingan Bharta Organic": "सेंद्रिय वांग्याचे भरीत",
    "Quinoa Rice": "क्विनोआ भात",
    "Fruit bowl": "फळांचे तुकडे",
    "Special Vegan Dum Aloo": "स्पेशल व्हेगन दम आलू",
    "Kadhi satvik": "सात्विक कढी",
    "Organic Sweet Cup": "सेंद्रिय गोड पदार्थ",

    // Ride steps / Landmarks
    "Pick up hot tiffins from Annapurna Kitchen (Sector 4)": "अन्नपूर्णा किचनमधून (सेक्टर ४) गरमागरम टिफिन गोळा करा",
    "Take Greenfield Residency Exit towards Ring Road": "रिंग रोडकडे जाणाऱ्या ग्रीनफिल्ड रेसिडेन्सी एक्झिटने पुढे जा",
    "Turn left after the Phoenix Mall Crossing": "फिनिक्स मॉल क्रॉसिंगनंतर डावीकडे वळा",
    "Arrive at Tower B, Flat 502, Horizon Heights": "टॉवर बी, फ्लॅट ५०२, होरायझन हाईट्स येथे पोहोचा",
    "Drive towards Golden Woods Apt 403": "गोल्डन वूड्स फ्लॅट ४०३ कडे मार्गक्रमण करा",
    "Pick up packed non-veg premium box from Royal Feast Kitchen": "रॉयल फीस्ट किचनमधून पॅक केलेला नॉन-व्हेज प्रीमियम बॉक्स गोळा करा",
    "Head north on Kalyani Nagar Main Road": "कल्याणी नगर मुख्य रस्त्यावरून उत्तरेकडे जा",
    "Deliver at Skyline Towers Penthouse A": "स्कायलाईन टॉवर्स पेंटहाऊस ए येथे डिलिव्हर करा",

    // General Words
    "Pure Veg": "शुद्ध शाकाहारी",
    "Veg / Non-Veg": "शाकाहारी आणि मांसाहारी",
    "🟢 Pure Veg": "🟢 शुद्ध शाकाहारी",
    "🔴 Veg & Non-Veg": "🔴 शाकाहारी आणि मांसाहारी",
    "Fresh Spiced Buttermilk (Chaach)": "ताजे मसालेदार ताक",
    "Roasted Papad (2 pcs)": "भाजलेला पापड (२ नग)",
    "Extra Butter Chapati (2 pcs)": "अतिरिक्त बटर चपाती (२ नग)",
    "Premium Alphonso Mango Pickle (50g)": "प्रीमियम हापूस आंब्याचे लोणचे (५० ग्रॅम)",
    "Sweet Gulab Jamun (2 pcs)": "गोड गुलाबजाम (२ नग)",
    "Spicy Garlic Chutney (Special)": "झणझणीत लसूण चटणी (विशेष)",
    "beverage": "पेय पदार्थ",
    "crunch": "कुरकुरीत",
    "bread": "पोळी / भाकरी",
    "condiment": "चटणी / लोणचे",
    "dessert": "गोड पदार्थ",

    // Statuses
    "placed": "ऑर्डर प्राप्त",
    "preparing": "तयार होत आहे",
    "ready_for_dispatch": "पाठवण्यासाठी तयार",
    "dispatched": "पाठवले गेले",
    "out_for_delivery": "डिलिव्हरीसाठी बाहेर",
    "delivered": "डिलिव्हर केले",
    "regular": "नियमित",
    "regular_with_guest_and_addons": "अतिथी आणि अतिरिक्त पदार्थांसह",
    "Bank Auto-Debit Mandate (Daily Release)": "बँक ऑटो-डेबिट मँडेट (दैनिक रिलीज)",
    "State Bank of India": "स्टेट बँक ऑफ इंडिया",
    "authorized": "अधिकृत (सक्रिय)",
    "paused": "थांबवले (पॉझ्ड)",
    "Bank Mandate Authorized": "बँक मँडेट अधिकृत",
    "Daily Debit Cap": "दैनिक डेबिट मर्यादा",
    "Daily Release Rate": "दैनिक रिलीज दर",
    "Total Safe Released": "एकूण सुरक्षित रिलीज",

    // Landing Page Navigation
    "Features": "वैशिष्ट्ये",
    "Daily Menu": "दैनिक मेनू",
    "Partner Kitchens": "भागीदार स्वयंपाकघर",
    "Our Standard": "आमचे मानक",
    "Sign In": "लॉग इन करा",
    "Subscribe Now": "आता सबस्क्राईब करा",
    "Subscribe": "सबस्क्राईब करा",

    // Landing Page Hero
    "Pure Home Cooked Meal Subscription": "शुद्ध घरगुती जेवणाची सदस्यता",
    "Healthy, Hot Home Meals Delivered Daily.": "आरोग्यदायी, गरमागरम घरगुती जेवण रोज पोहोचवले जाते.",
    "Ditch the greasy restaurant delivery. TiffinGo Pro connects busy professionals, students, and families with certified home kitchens preparing fresh, custom-crafted lunch and dinner plans with active live GPS route tracking.": "हॉटेलचे तेलकट जेवण टाळा. टिफिनगो प्रो व्यस्त व्यावसायिक, विद्यार्थी आणि कुटुंबांना प्रमाणित घरगुती स्वयंपाकघरांशी जोडते जे थेट जीपीएस मार्ग ट्रॅकिंगसह ताजे, सानुकूलित दुपारचे आणि रात्रीचे जेवण तयार करतात.",
    "Find Tiffin Subscriptions": "टिफिन सदस्यता शोधा",
    "Kitchen Partner Portal": "स्वयंपाकघर भागीदार पोर्टल",
    "Local Home Kitchens": "स्थानिक घरगुती स्वयंपाकघर",
    "On-Time Hot Delivery": "वेळेवर गरम जेवण वितरण",
    "Average Customer Rating": "सरासरी ग्राहक रेटिंग",

    // Landing Page Hero Card
    "Premium Meal Services": "प्रीमियम जेवण सेवा",
    "100% Home Cooked": "100% घरगुती जेवण",
    "Pure Taste, High Nutrition": "शुद्ध चव, उच्च पोषण",
    "Vetted local kitchens delivering authentic recipes in clean thermal hotboxes.": "स्वच्छ थर्मल हॉटबॉक्समध्ये अस्सल चव पोहोचवणारी स्थानिक स्वयंपाकघर.",
    "Zero Artificial Preservatives": "कृत्रिम रसायने विरहित",
    "Free Triple-Insulated Hotbox": "मोफत पानाचे गरम डब्बे",
    "Skip or Pause Subscription with 1-Click": "१-क्लिकमध्ये सबस्क्रिप्शन रद्द किंवा थांबवा",
    "Secure Bank-Mandate Releases On-Delivery": "डिव्हरी झाल्यावरच बँक खात्यातून पैसे जमा",
    "Browse Weekly Menus & Start Plan": "साप्ताहिक मेनू पहा आणि प्लॅन सुरू करा",
    "POPULAR STARTING FROM": "लोकप्रिय प्लॅन",
    "Classic Indian Veg Thali": "क्लासिक भारतीय व्हेज थाळी",
    "Roti, Dal, Sabji, Rice & Dessert": "चपाती, डाळ, भाजी, भात आणि गोड पदार्थ",

    // Landing Page Core Features
    "Why TiffinGo Pro": "टिफिनगो प्रो का?",
    "Elegance Meets Everyday Nourishment": "उत्कृष्ट चव आणि रोजचे पोषण",
    "We did not build another food delivery app. We engineered a complete daily subscription pipeline that guarantees hot, certified, hygienic meals exactly when your break starts.": "आम्ही फक्त दुसरा फूड डिलिव्हरी अॅप नाही बनवला. आम्ही एक संपूर्ण दैनिक सबस्क्रिप्शन सिस्टीम विकसित केली आहे जी तुमचा ब्रेक सुरू होताच गरमागरम, स्वच्छ आणि सकस जेवणाची हमी देते.",
    "Certified Kitchens": "प्रमाणित स्वयंपाकघर",
    "Every chef is vetted, licensed, and checked for sanitization and nutritional consistency. No artificial food dyes or trans-fats.": "प्रत्येक स्वयंपाकी प्रमाणित आणि परवानाधारक आहे, तसेच स्वच्छता व पोषणमूल्यांची तपासणी केली जाते. कृत्रिम रंग किंवा ट्रान्स-फॅट्स नाहीत.",
    "Tracked Diets": "डाएट जेवण",
    "Whether you prefer pure vegetarian, non-vegetarian feasts, or high-protein macro-tracked keto meals, we have a customized package for you.": "तुम्हाला शुद्ध शाकाहारी, मांसाहारी मेजवानी किंवा जास्त प्रथिने असलेले कीटो जेवण हवे असल्यास आमच्याकडे खास प्लॅन्स उपलब्ध आहेत.",
    "Flexible Schedule": "लव्हचिक वेळापत्रक",
    "Going out of town? Instantly pause your subscription or skip specific days. Manage lunch vs dinner slots seamlessly with one click.": "गावाला जात आहात? तुमचे सबस्क्रिप्शन त्वरित थांबवा किंवा विशिष्ट दिवस वगळा. एका क्लिकवर दुपारचे आणि रात्रीचे जेवण सहज मॅनेज करा.",
    "Premium Add-ons": "प्रीमियम अतिरिक्त पदार्थ",
    "Configure guest plates for visiting friends, schedule fresh buttermilk/papad, and receive automatic monthly receipt invoice PDFs.": "मित्रांसाठी अतिथी थाळी बुक करा, ताजी ताक/पापड शेड्यूल करा आणि स्वयंचलित मासिक पावती इनव्हॉइस मिळवा.",

    // Landing Page Teaser
    "Fresh Cooked Teaser": "ताजे शिजवलेले जेवण झलक",
    "No Boredom. Just Diverse Home Menus.": "रोज तेच जेवण नको. रोज नवीन चव.",
    "Our kitchen partners alternate their menu daily so you never eat the same meal twice in a week. Click on any weekday to inspect the actual meals prepared on that day!": "आमचे स्वयंपाकघर भागीदार दररोज त्यांचे मेनू बदलतात जेणेकरून तुम्ही आठवड्यातून दोनदा तेच जेवण खाणार नाही. त्या दिवशी तयार केलेले जेवण तपासण्यासाठी कोणत्याही वारावर क्लिक करा!",
    "Lighter on spice, richer in nutrition": "कमी तिखट, सकस आणि पौष्टिक",
    "Made with premium long grain Basmati rice": "उत्कृष्ट दर्जाच्या सुवासिक बासमती तांदळापासून बनवलेले",
    "Whole wheat rotis prepared fresh with hand-churned ghee": "शुद्ध तुपाचा वापर करून बनवलेल्या गव्हाच्या मऊ चपात्या",
    "Explore customized healthy packages": "आरोग्यदायी सानुकूलित प्लॅन्स एक्सप्लोर करा",
    "Standard Vegetarian Menu": "मानक शाकाहारी मेनू",
    "Alternating Daily": "रोज बदलणारे",

    // Landing Page Partners
    "Our Partners": "आमचे भागीदार",
    "Vetted Home Kitchens": "प्रमाणित घरगुती स्वयंपाकघर",
    "We partner only with elite home kitchens following standard hygiene regulations. Order with absolute peace of mind.": "आम्ही केवळ मानकीकृत स्वच्छतेच्या नियमांचे पालन करणाऱ्या घरगुती स्वयंपाकघरांशी भागीदारी करतो. विश्वासाने ऑर्डर करा.",
    "View all 15 active kitchens": "सर्व १५ सक्रिय स्वयंपाकघर पहा",
    "Sub starts at": "सबस्क्रिप्शन सुरु",
    "Week": "आठवडा",
    "Browse Plan": "प्लॅन पहा",

    // Landing Page Ecosystem / Portal
    "Our Ecosystem": "आमची इकोसिस्टम",
    "One Unified Kitchen-to-Diner Solution": "स्वयंपाकघर ते ग्राहक एकच सोपा उपाय",
    "We connect home cooks, logistics captains, and hungry diners under a highly synced real-time data engine. Experience true operational clarity.": "आम्ही घरगुती आचारी, डिलिव्हरी बॉईज आणि ग्राहकांना एकाच सुरक्षित सिस्टीमद्वारे जोडतो. उत्तम सुविधेचा अनुभव घ्या.",
    "For Diners & Customers": "ग्राहकांसाठी",
    "Subscribe to trusted kitchens, alternate times daily, scheduled guest plates, order buttermilk add-ons, and track riders on precise maps.": "विश्वासू स्वयंपाकघरांची सदस्यता घ्या, रोज वेळ बदलू शकता, अतिथी थाळी बुक करा, ताक मागवा आणि नकाशावर डिलिव्हरी ट्रॅक करा.",
    "Sign In as Customer": "ग्राहक म्हणून लॉग इन करा",
    "For Kitchens & Riders": "स्वयंपाकघर आणि डिलिव्हरी बॉईजसाठी",
    "Manage automated prep lists, configure weekly menus, guide riders with turn-by-turn simulation walkthroughs, and audit overall revenue.": "स्वयंचलित जेवण यादी व्यवस्थापित करा, साप्ताहिक मेनू सेट करा, नकाशावर डिलिव्हरी बॉईजचे मार्गदर्शन करा आणि एकूण उत्पन्नाचे ऑडिट करा.",
    "Kitchen Partner": "स्वयंपाकघर भागीदार",
    "Rider Portal": "डिव्हरी बॉय पोर्टल",
    "Admin Dashboard Login": "ॲडमिन डॅशबोर्ड लॉगिन",
    "Privacy Policy": "गोपनीयता धोरण",
    "Terms of Service": "सेवा अटी",
    "Refund Policy": "रिफंड धोरण",
    "Razorpay Security": "रेझरपे सुरक्षा",
    "Designed for healthy lifestyles & home cooking ecosystems.": "आरोग्यदायी जीवनशैली आणि घरगुती स्वयंपाकासाठी डिझाइन केलेले."
  }
};

/**
 * Helper to translate dynamic content based on active language in i18n
 */
export const translateText = (text: string | null | undefined, lang?: string): string => {
  if (!text) return '';
  const currentLang = lang || i18n.language || 'en';
  if (currentLang === 'en') return text;

  const dict = TRANSLATIONS_MAP[currentLang];
  if (!dict) return text;

  // 1. Exact match
  if (dict[text]) return dict[text];

  // 2. Clean trimmed match
  const trimmed = text.trim();
  if (dict[trimmed]) return dict[trimmed];

  return text;
};

// Convenient Shorthand
export const tText = (text: string | null | undefined, lang?: string) => translateText(text, lang);

/**
 * Generates a dynamic Time-based One Time Password (TOTP) for secure QR verification.
 * Automatically rotates every 30 seconds to ensure the QR code is dynamic and not fixed.
 */
export const getDynamicOtp = (orderId: string): { otp: string; secondsLeft: number } => {
  const epoch = Math.floor(Date.now() / 1000);
  const period = 30; // 30 seconds interval
  const windowIdx = Math.floor(epoch / period);
  const secondsLeft = period - (epoch % period);

  const seed = `${orderId}-${windowIdx}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const otpNum = Math.abs(hash % 9000) + 1000; // 4-digit OTP between 1000 and 9999
  return {
    otp: otpNum.toString(),
    secondsLeft
  };
};

/**
 * Computes the daily tiffin attendance matrix (array of dates with delivery status)
 * for a given subscription and set of orders.
 */
export interface DayStatus {
  dayNum: number;
  dateStr: string;
  dayLabel: string; // e.g. "Mon", "Tue"
  status: 'delivered' | 'missed' | 'pending' | 'future';
  orderId?: string;
}

export const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00');
};

export const getSubscriptionAttendanceMatrix = (
  subscription: { startDate: string; endDate: string; billingCycle: string },
  allOrders: { date: string; status: string; id: string }[]
): DayStatus[] => {
  const start = new Date(subscription.startDate);
  const end = new Date(subscription.endDate);
  
  // Cap at today to classify correctly as delivered vs missed, or future
  const todayStr = getTodayDateStr(); // Dynamic live current date
  const today = new Date(todayStr);

  const matrix: DayStatus[] = [];
  let current = new Date(start);
  let dayNum = 1;

  // Let's decide length based on billingCycle
  const totalDays = subscription.billingCycle === 'weekly' ? 7 : 30;

  for (let i = 0; i < totalDays; i++) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Find if there is an order for this date
    const dayOrder = allOrders.find(o => o.date === dateStr);
    
    let status: 'delivered' | 'missed' | 'pending' | 'future' = 'pending';

    const curTime = current.getTime();
    const todayTime = today.getTime();

    if (dayOrder && dayOrder.status === 'delivered') {
      status = 'delivered';
    } else if (curTime < todayTime) {
      // Past day with no delivered order is marked missed (Red)
      status = 'missed';
    } else if (dateStr === todayStr) {
      // Today and not delivered yet is pending (Gray/Blank)
      status = dayOrder ? 'pending' : 'pending';
    } else {
      // Future day is marked future
      status = 'future';
    }

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabel = daysOfWeek[current.getDay()];

    matrix.push({
      dayNum,
      dateStr,
      dayLabel,
      status,
      orderId: dayOrder?.id
    });

    // Increment date
    current.setDate(current.getDate() + 1);
    dayNum++;
  }

  return matrix;
};
