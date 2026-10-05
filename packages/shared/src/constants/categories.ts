export interface ProductCategoryConstant {
  id: string;
  name: string;
  nameHindi: string;
}

export const PRODUCT_CATEGORIES: ProductCategoryConstant[] = [
  { id: 'atta_flour', name: 'Atta & Flour', nameHindi: 'आटा एवं मैदा' },
  { id: 'dal_pulses', name: 'Dal & Pulses', nameHindi: 'दालें एवं दलहन' },
  { id: 'rice_grains', name: 'Rice & Grains', nameHindi: 'चावल एवं अनाज' },
  { id: 'oil_ghee', name: 'Edible Oil & Ghee', nameHindi: 'तेल एवं घी' },
  { id: 'spices_masala', name: 'Spices & Salt', nameHindi: 'मसाले एवं नमक' },
  { id: 'sugar_jaggery', name: 'Sugar & Jaggery', nameHindi: 'चीनी एवं गुड़' },
  { id: 'tea_coffee', name: 'Tea & Coffee', nameHindi: 'चाय एवं कॉफ़ी' },
  { id: 'snacks_namkeen', name: 'Biscuits & Snacks', nameHindi: 'बिस्कुट एवं नमकीन' },
  { id: 'beverages', name: 'Beverages & Cold Drinks', nameHindi: 'कोल्ड ड्रिंक्स एवं शरबत' },
  { id: 'dairy', name: 'Dairy & Milk Products', nameHindi: 'दूध एवं डेयरी उत्पाद' },
  { id: 'soap_detergent', name: 'Soaps & Detergents', nameHindi: 'साबुन एवं सर्फ' },
  { id: 'personal_care', name: 'Personal Care', nameHindi: 'पर्सनल केयर' },
  { id: 'cleaning', name: 'Home Cleaning', nameHindi: 'सफाई का सामान' },
  { id: 'stationery', name: 'Pooja & Household', nameHindi: 'पूजा एवं घरेलू सामान' },
  { id: 'other', name: 'Other Items', nameHindi: 'अन्य सामान' },
];
