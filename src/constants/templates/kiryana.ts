/**
 * Kiryana Store Template - 60 common items
 * Includes staples, oils, dairy, spices, snacks, cleaning
 */
import type { TemplateItem } from '@models/Product';

export const kiryanaTemplate: TemplateItem[] = [
  // Atta & Rice (8 items)
  { id: 'atta_1kg', name: 'Atta 1kg', nameUrdu: 'آٹا 1 کلو', category: 'atta_rice', unit: 'piece', suggestedPrice: 80 },
  { id: 'atta_5kg', name: 'Atta 5kg', nameUrdu: 'آٹا 5 کلو', category: 'atta_rice', unit: 'piece', suggestedPrice: 380 },
  { id: 'atta_10kg', name: 'Atta 10kg', nameUrdu: 'آٹا 10 کلو', category: 'atta_rice', unit: 'piece', suggestedPrice: 720 },
  { id: 'atta_20kg', name: 'Atta 20kg', nameUrdu: 'آٹا 20 کلو', category: 'atta_rice', unit: 'piece', suggestedPrice: 1400 },
  { id: 'basmati_1kg', name: 'Basmati Rice 1kg', nameUrdu: 'بہت سلمندی چاول 1 کلو', category: 'atta_rice', unit: 'piece', suggestedPrice: 350 },
  { id: 'basmati_5kg', name: 'Basmati Rice 5kg', nameUrdu: 'بہت سلمندی چاول 5 کلو', category: 'atta_rice', unit: 'piece', suggestedPrice: 1650 },
  { id: 'irri_5kg', name: 'Irri Rice 5kg', nameUrdu: 'اڑی چاول 5 کلو', category: 'atta_rice', unit: 'piece', suggestedPrice: 950 },
  { id: 'sella_5kg', name: 'Sella Rice 5kg', nameUrdu: 'سیلہ چاول 5 کلو', category: 'atta_rice', unit: 'piece', suggestedPrice: 1100 },

  // Oil & Ghee (5 items)
  { id: 'oil_1l', name: 'Cooking Oil 1L', nameUrdu: 'کھانے کا تیل 1 لیٹر', category: 'oil_ghee', unit: 'bottle', suggestedPrice: 320 },
  { id: 'oil_5l', name: 'Cooking Oil 5L', nameUrdu: 'کھانے کا تیل 5 لیٹر', category: 'oil_ghee', unit: 'can', suggestedPrice: 1500 },
  { id: 'dalda_1kg', name: 'Dalda Ghee 1kg', nameUrdu: 'ڈالڈا تیل 1 کلو', category: 'oil_ghee', unit: 'tin', suggestedPrice: 720 },
  { id: 'desi_ghee_1kg', name: 'Desi Ghee 1kg', nameUrdu: 'دیسی گھی 1 کلو', category: 'oil_ghee', unit: 'tin', suggestedPrice: 1200 },
  { id: 'canola_5l', name: 'Canola Oil 5L', nameUrdu: 'کینولا تیل 5 لیٹر', category: 'oil_ghee', unit: 'can', suggestedPrice: 1600 },

  // Dairy (6 items)
  { id: 'milk_olpers_1l', name: 'Milk (Olpers) 1L', nameUrdu: 'دودھ (آلپرز) 1 لیٹر', category: 'dairy', unit: 'pouch', suggestedPrice: 280 },
  { id: 'milk_nestle_1l', name: 'Milk (Nestle) 1L', nameUrdu: 'دودھ (نیسلے) 1 لیٹر', category: 'dairy', unit: 'pouch', suggestedPrice: 290 },
  { id: 'eggs_dozen', name: 'Eggs (dozen)', nameUrdu: 'انڈے (ایک درجن)', category: 'dairy', unit: 'dozen', suggestedPrice: 350 },
  { id: 'yogurt_1kg', name: 'Yogurt 1kg', nameUrdu: 'دہی 1 کلو', category: 'dairy', unit: 'container', suggestedPrice: 180 },
  { id: 'butter_200g', name: 'Butter 200g', nameUrdu: 'مکھن 200 گرام', category: 'dairy', unit: 'pack', suggestedPrice: 450 },
  { id: 'cream_200ml', name: 'Cream 200ml', nameUrdu: 'کریم 200 ملی لیٹر', category: 'dairy', unit: 'bottle', suggestedPrice: 180 },

  // Sugar & Salt (4 items)
  { id: 'sugar_1kg', name: 'Sugar 1kg', nameUrdu: 'شکر 1 کلو', category: 'sugar_salt', unit: 'bag', suggestedPrice: 150 },
  { id: 'sugar_5kg', name: 'Sugar 5kg', nameUrdu: 'شکر 5 کلو', category: 'sugar_salt', unit: 'bag', suggestedPrice: 700 },
  { id: 'salt_1kg', name: 'Salt 1kg', nameUrdu: 'نمک 1 کلو', category: 'sugar_salt', unit: 'bag', suggestedPrice: 40 },
  { id: 'pink_salt_1kg', name: 'Pink Salt 1kg', nameUrdu: 'گلابی نمک 1 کلو', category: 'sugar_salt', unit: 'bag', suggestedPrice: 120 },

  // Tea & Drinks (7 items)
  { id: 'tapal_danedar_200g', name: 'Tapal Danedar 200g', nameUrdu: 'تاپل دانیدار 200 گرام', category: 'tea_drinks', unit: 'pack', suggestedPrice: 180 },
  { id: 'lipton_200g', name: 'Lipton Tea 200g', nameUrdu: 'لپٹن چائے 200 گرام', category: 'tea_drinks', unit: 'pack', suggestedPrice: 220 },
  { id: 'milo_400g', name: 'Nestle Milo 400g', nameUrdu: 'نیسلے میلو 400 گرام', category: 'tea_drinks', unit: 'tin', suggestedPrice: 420 },
  { id: 'tang_orange_500g', name: 'Tang Orange 500g', nameUrdu: 'ٹینگ اورنج 500 گرام', category: 'tea_drinks', unit: 'jar', suggestedPrice: 220 },
  { id: 'rooh_afza_800ml', name: 'Rooh Afza 800ml', nameUrdu: 'روح افزا 800 ملی لیٹر', category: 'tea_drinks', unit: 'bottle', suggestedPrice: 250 },
  { id: 'pepsi_1_5l', name: 'Pepsi 1.5L', nameUrdu: 'پیپسی 1.5 لیٹر', category: 'tea_drinks', unit: 'bottle', suggestedPrice: 180 },
  { id: '7up_1_5l', name: '7UP 1.5L', nameUrdu: '7 اپ 1.5 لیٹر', category: 'tea_drinks', unit: 'bottle', suggestedPrice: 180 },

  // Soap & Hygiene (9 items)
  { id: 'lux_135g', name: 'Lux Soap 135g', nameUrdu: 'لکس صابن 135 گرام', category: 'soap_hygiene', unit: 'piece', suggestedPrice: 50 },
  { id: 'lux_170g', name: 'Lux Soap 170g', nameUrdu: 'لکس صابن 170 گرام', category: 'soap_hygiene', unit: 'piece', suggestedPrice: 65 },
  { id: 'lifebuoy_135g', name: 'Lifebuoy Soap 135g', nameUrdu: 'لائف بوئے صابن 135 گرام', category: 'soap_hygiene', unit: 'piece', suggestedPrice: 40 },
  { id: 'safeguard_135g', name: 'Safeguard Soap 135g', nameUrdu: 'سیف گارڈ صابن 135 گرام', category: 'soap_hygiene', unit: 'piece', suggestedPrice: 45 },
  { id: 'dettol_100g', name: 'Dettol Soap 100g', nameUrdu: 'ڈیٹول صابن 100 گرام', category: 'soap_hygiene', unit: 'piece', suggestedPrice: 60 },
  { id: 'dove_135g', name: 'Dove Soap 135g', nameUrdu: 'ڈوو صابن 135 گرام', category: 'soap_hygiene', unit: 'piece', suggestedPrice: 80 },
  { id: 'dettol_handwash_200ml', name: 'Dettol Handwash 200ml', nameUrdu: 'ڈیٹول ہینڈ واش 200 ملی لیٹر', category: 'soap_hygiene', unit: 'bottle', suggestedPrice: 120 },
  { id: 'sunsilk_180ml', name: 'Sunsilk Shampoo 180ml', nameUrdu: 'سن سلک شیمپو 180 ملی لیٹر', category: 'soap_hygiene', unit: 'bottle', suggestedPrice: 140 },
  { id: 'head_shoulders_180ml', name: 'Head & Shoulders 180ml', nameUrdu: 'ہیڈ اینڈ شولڈرز 180 ملی لیٹر', category: 'soap_hygiene', unit: 'bottle', suggestedPrice: 200 },

  // Pulses (5 items)
  { id: 'daal_mash_1kg', name: 'Daal Mash 1kg', nameUrdu: 'ماش کی دال 1 کلو', category: 'pulses', unit: 'bag', suggestedPrice: 280 },
  { id: 'daal_chana_1kg', name: 'Daal Chana 1kg', nameUrdu: 'چنے کی دال 1 کلو', category: 'pulses', unit: 'bag', suggestedPrice: 240 },
  { id: 'daal_moong_1kg', name: 'Daal Moong 1kg', nameUrdu: 'مونگ کی دال 1 کلو', category: 'pulses', unit: 'bag', suggestedPrice: 260 },
  { id: 'masoor_daal_1kg', name: 'Masoor Daal 1kg', nameUrdu: 'مسور کی دال 1 کلو', category: 'pulses', unit: 'bag', suggestedPrice: 220 },
  { id: 'chana_whole_1kg', name: 'Chana whole 1kg', nameUrdu: 'کالے چنے 1 کلو', category: 'pulses', unit: 'bag', suggestedPrice: 250 },

  // Spices (6 items)
  { id: 'red_chili_100g', name: 'Red Chili Powder 100g', nameUrdu: 'لال مرچ کا پاؤڈر 100 گرام', category: 'spices', unit: 'pack', suggestedPrice: 80 },
  { id: 'turmeric_100g', name: 'Turmeric 100g', nameUrdu: 'ہلدی 100 گرام', category: 'spices', unit: 'pack', suggestedPrice: 120 },
  { id: 'coriander_100g', name: 'Coriander Powder 100g', nameUrdu: 'دھنیا کا پاؤڈر 100 گرام', category: 'spices', unit: 'pack', suggestedPrice: 100 },
  { id: 'garam_masala_50g', name: 'Garam Masala 50g', nameUrdu: 'گرم مصالہ 50 گرام', category: 'spices', unit: 'pack', suggestedPrice: 80 },
  { id: 'cumin_100g', name: 'Cumin 100g', nameUrdu: 'زیرہ 100 گرام', category: 'spices', unit: 'pack', suggestedPrice: 100 },
  { id: 'black_pepper_50g', name: 'Black Pepper 50g', nameUrdu: 'کالی مرچ 50 گرام', category: 'spices', unit: 'pack', suggestedPrice: 150 },

  // Snacks (4 items)
  { id: 'peek_freans', name: 'Peek Freans Biscuits', nameUrdu: 'پیک فریانز بسکٹ', category: 'snacks', unit: 'pack', suggestedPrice: 70 },
  { id: 'sooper_biscuits', name: 'Sooper Biscuits', nameUrdu: 'سوپر بسکٹ', category: 'snacks', unit: 'pack', suggestedPrice: 60 },
  { id: 'kolson_chips', name: 'Kolson Slanty Chips', nameUrdu: 'کولسن اسلنٹی چپس', category: 'snacks', unit: 'pack', suggestedPrice: 80 },
  { id: 'pringles_original', name: 'Pringles Original', nameUrdu: 'پرنگلز اصل', category: 'snacks', unit: 'can', suggestedPrice: 200 },

  // Cleaning (5 items)
  { id: 'surf_excel_500g', name: 'Surf Excel 500g', nameUrdu: 'سرف ایکسیل 500 گرام', category: 'cleaning', unit: 'pack', suggestedPrice: 150 },
  { id: 'surf_excel_1kg', name: 'Surf Excel 1kg', nameUrdu: 'سرف ایکسیل 1 کلو', category: 'cleaning', unit: 'pack', suggestedPrice: 280 },
  { id: 'vim_bar_200g', name: 'Vim Bar 200g', nameUrdu: 'وم بار 200 گرام', category: 'cleaning', unit: 'piece', suggestedPrice: 50 },
  { id: 'harpic_500ml', name: 'Harpic 500ml', nameUrdu: 'ہارپک 500 ملی لیٹر', category: 'cleaning', unit: 'bottle', suggestedPrice: 180 },
  { id: 'rin_500g', name: 'Rin Detergent 500g', nameUrdu: 'رن ڈیٹرجنٹ 500 گرام', category: 'cleaning', unit: 'pack', suggestedPrice: 120 },

  // Misc/Additional common items
  { id: 'vaseline_100ml', name: 'Vaseline 100ml', nameUrdu: 'ویزلین 100 ملی لیٹر', category: 'soap_hygiene', unit: 'jar', suggestedPrice: 150 },
];
