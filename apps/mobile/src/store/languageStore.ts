import { create } from 'zustand';

export type Language = 'en' | 'hi' | 'hinglish';

export interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Navigation & Common
    app_title: 'Kirana Pro ERP',
    home: 'Home',
    products: 'Products',
    bills: 'Bills',
    wholesalers: 'Wholesalers',
    taraju: 'Taraju',
    analytics: 'Analytics',
    marketing: 'Marketing',
    scan: 'Scan',
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    done: 'Done',
    close: 'Close',
    search_placeholder: 'Search product, barcode, or name...',

    // Home Screen
    welcome_greeting: 'Namaste',
    instant_calculator: 'INSTANT SCALE CALCULATOR',
    taraju_smart_scale: 'Taraju Smart Scale',
    taraju_promo_sub: 'Customer asked ₹5 ka chawal? Tap to get exact grams instantly!',
    quick_actions: 'Quick Actions',
    store_inventory: 'Store Inventory',
    total_items: 'Total Items',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    loose_taraju: 'Loose (Taraju)',
    dukaan_profit_gst: 'Dukaan Profit & GST',
    dukaan_profit_sub: 'Daily sales, net margins & CA tax report',
    smart_ai_reorder: 'Smart AI Reorder',
    smart_reorder_sub: 'Burn velocity & 1-tap WhatsApp order',

    // POS & Billing
    pos_billing: 'POS Billing',
    new_bill: 'New Bill',
    clear_cart: 'Clear Cart',
    proceed_to_pay: 'Proceed to Pay',
    cash_in_galla: 'Cash in Galla',
    upi_payment: 'UPI / QR',
    khata_credit: 'Khata Udhar',
    split_payment: 'Split Payment',
    total_bill: 'Total Bill',

    // Products & Stock
    product_catalog: 'Products Catalog',
    stock_register: 'Stock Register',
    wholesale_cost: 'Wholesale Cost',
    retail_mrp: 'Retail MRP',
    unit_profit: 'Unit Profit',
    quick_restock: 'Quick Restock',
    in_stock: 'In Stock',

    // Marketing & Khata Reminders
    customer_marketing: 'Customer Marketing & UPI Recovery',
    send_upi_reminder: 'Send WhatsApp UPI Reminder',
    festival_offers: 'Festival Grocery Offers',
    digital_catalog: 'Digital Dukaan Catalog',
  },

  hi: {
    // Navigation & Common
    app_title: 'किराना प्रो ईआरपी',
    home: 'होम',
    products: 'सामान (स्टॉक)',
    bills: 'बिलिंग',
    wholesalers: 'थोक व्यापारी',
    taraju: 'तराजू',
    analytics: 'मुनाफा रिपोर्ट',
    marketing: 'प्रचार व वसूली',
    scan: 'स्कैन',
    add: 'जोड़ें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    done: 'संपन्न',
    close: 'बंद करें',
    search_placeholder: 'सामान का नाम या बारकोड खोजें...',

    // Home Screen
    welcome_greeting: 'नमस्ते',
    instant_calculator: 'तुरंत वजन कैलकुलेटर',
    taraju_smart_scale: 'स्मार्ट तराजू स्केल',
    taraju_promo_sub: 'ग्राहक ने माँगा ₹5 का चावल? तुरंत ग्राम निकालें!',
    quick_actions: 'त्वरित कार्य',
    store_inventory: 'दुकान का स्टॉक',
    total_items: 'कुल सामान',
    low_stock: 'कम स्टॉक',
    out_of_stock: 'स्टॉक खत्म',
    loose_taraju: 'खुला सामान (तराजू)',
    dukaan_profit_gst: 'दुकान का शुद्ध मुनाफा व GST',
    dukaan_profit_sub: 'दैनिक कमाई, मार्जिन और टैक्स रिपोर्ट',
    smart_ai_reorder: 'स्मार्ट री-ऑर्डर (थोक खरीद)',
    smart_reorder_sub: 'स्टॉक खत्म होने का अलर्ट व WhatsApp ऑर्डर',

    // POS & Billing
    pos_billing: 'पीओएस बिलिंग',
    new_bill: 'नया बिल बनाएं',
    clear_cart: 'सामान हटाएं',
    proceed_to_pay: 'भुगतान करें',
    cash_in_galla: 'गल्ला नकद',
    upi_payment: 'यूपीआई / क्यूआर',
    khata_credit: 'उधार खाता',
    split_payment: 'मिला-जुला भुगतान',
    total_bill: 'कुल बिल',

    // Products & Stock
    product_catalog: 'सामान सूची',
    stock_register: 'स्टॉक रजिस्टर',
    wholesale_cost: 'थोक खरीद मूल्य',
    retail_mrp: 'बिक्री मूल्य (MRP)',
    unit_profit: 'प्रति इकाई मुनाफा',
    quick_restock: 'स्टॉक बढ़ाएं',
    in_stock: 'स्टॉक में उपलब्ध',

    // Marketing & Khata Reminders
    customer_marketing: 'ग्राहक प्रचार व UPI वसूली',
    send_upi_reminder: 'WhatsApp पर UPI लिंक भेजें',
    festival_offers: 'त्योहार व राशन ऑफर',
    digital_catalog: 'डिजिटल दुकान मेनू',
  },

  hinglish: {
    // Navigation & Common
    app_title: 'Kirana Pro ERP',
    home: 'Home',
    products: 'Items & Stock',
    bills: 'Bills',
    wholesalers: 'Wholesalers',
    taraju: 'Taraju',
    analytics: 'Kamai Reports',
    marketing: 'Prachar & Vasuli',
    scan: 'Scan',
    add: 'Add Karein',
    save: 'Save Karein',
    cancel: 'Cancel',
    done: 'Done',
    close: 'Close',
    search_placeholder: 'Item name, barcode ya Hindi search...',

    // Home Screen
    welcome_greeting: 'Namaste',
    instant_calculator: 'INSTANT SCALE CALCULATOR',
    taraju_smart_scale: 'Taraju Smart Scale',
    taraju_promo_sub: 'Customer ne manga ₹5 ka chawal? Ek tap me grams nikalein!',
    quick_actions: 'Quick Actions',
    store_inventory: 'Dukaan Ka Stock',
    total_items: 'Total Items',
    low_stock: 'Low Stock (Khatam hone wala)',
    out_of_stock: 'Out of Stock',
    loose_taraju: 'Khula Rashan (Taraju)',
    dukaan_profit_gst: 'Dukaan Profit & GST',
    dukaan_profit_sub: 'Daily kamai, margin aur CA tax summary',
    smart_ai_reorder: 'Smart AI Reorder',
    smart_reorder_sub: 'Stock khatam hone se pehle WhatsApp order bhejein',

    // POS & Billing
    pos_billing: 'POS Billing Counter',
    new_bill: 'Naya Bill',
    clear_cart: 'Cart Khali Karein',
    proceed_to_pay: 'Proceed to Pay',
    cash_in_galla: 'Galla Cash',
    upi_payment: 'UPI / QR Code',
    khata_credit: 'Udhar Khata',
    split_payment: 'Split Payment',
    total_bill: 'Total Bill Amount',

    // Products & Stock
    product_catalog: 'Product Catalog',
    stock_register: 'Stock Register',
    wholesale_cost: 'Wholesale Rate',
    retail_mrp: 'Selling MRP',
    unit_profit: 'Munafa per Piece',
    quick_restock: 'Restock Karein',
    in_stock: 'Available Stock',

    // Marketing & Khata Reminders
    customer_marketing: 'Customer Vasuli & Offers',
    send_upi_reminder: 'WhatsApp par UPI Payment Link bhejein',
    festival_offers: 'Festival Grocery Offers',
    digital_catalog: 'WhatsApp Digital Dukaan Menu',
  },
};

export interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en',

  setLanguage: (language: Language) => set({ language }),

  t: (key: string, params?: Record<string, string | number>) => {
    const { language } = get();
    const langDict = translations[language] || translations.en;
    let text = langDict[key] || translations.en[key] || key;

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(params[paramKey]));
      });
    }

    return text;
  },
}));
