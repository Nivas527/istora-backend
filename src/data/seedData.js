export const storeTemplates = [
  {
    id: 'blank',
    name: 'Blank Store (Clean Slate)',
    description: 'Start fresh with an empty catalog. Add your own products from scratch.',
    category: 'General Merchandise',
    accentColor: '#008060',
    products: []
  },
  {
    id: 'apparel',
    name: 'Streetwear & Performance',
    description: 'Pre-seeded with technical apparel, runners, and waterproof packs.',
    category: 'Apparel & Fashion',
    accentColor: '#008060',
    products: [
      {
        id: 'tmpl_app_1',
        title: 'Cyberpunk Articulated Shell Jacket',
        handle: 'cyberpunk-articulated-shell-jacket',
        vendor: 'Kuro Studio',
        productType: 'Jackets',
        collectionId: 'apparel',
        status: 'active',
        description: 'DWR-coated 3-layer breathable membrane with Fidlock magnetic cargo flaps and waterproof YKK Aquaguard zips.',
        price: 180,
        compareAtPrice: 220,
        images: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80'
        ],
        tags: ['jacket', 'waterproof', 'streetwear'],
        options: [
          { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
          { name: 'Color', values: ['Stealth Black', 'Concrete Grey'] }
        ],
        variants: [
          { id: 'v_app_1', title: 'S / Stealth Black', sku: 'KUR-JKT-BLK-S', price: 180, compareAtPrice: 220, inventoryQuantity: 10, option1: 'S', option2: 'Stealth Black' },
          { id: 'v_app_2', title: 'M / Stealth Black', sku: 'KUR-JKT-BLK-M', price: 180, compareAtPrice: 220, inventoryQuantity: 15, option1: 'M', option2: 'Stealth Black' },
          { id: 'v_app_3', title: 'L / Stealth Black', sku: 'KUR-JKT-BLK-L', price: 180, compareAtPrice: 220, inventoryQuantity: 8, option1: 'L', option2: 'Stealth Black' },
          { id: 'v_app_4', title: 'M / Concrete Grey', sku: 'KUR-JKT-GRY-M', price: 180, compareAtPrice: 220, inventoryQuantity: 12, option1: 'M', option2: 'Concrete Grey' }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'tmpl_app_2',
        title: 'Minimalist Heavyweight Boxy Tee',
        handle: 'minimalist-heavyweight-boxy-tee',
        vendor: 'Kuro Studio',
        productType: 'T-Shirts',
        collectionId: 'apparel',
        status: 'active',
        description: '300 GSM combed organic cotton with relaxed drop-shoulder silhouette and ribbed collar.',
        price: 45,
        compareAtPrice: 55,
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80'
        ],
        tags: ['t-shirt', 'basics', 'cotton'],
        options: [
          { name: 'Size', values: ['S', 'M', 'L'] },
          { name: 'Color', values: ['Vintage White', 'Washed Charcoal'] }
        ],
        variants: [
          { id: 'v_app_5', title: 'S / Vintage White', sku: 'KUR-TEE-WHT-S', price: 45, compareAtPrice: 55, inventoryQuantity: 25, option1: 'S', option2: 'Vintage White' },
          { id: 'v_app_6', title: 'M / Vintage White', sku: 'KUR-TEE-WHT-M', price: 45, compareAtPrice: 55, inventoryQuantity: 30, option1: 'M', option2: 'Vintage White' },
          { id: 'v_app_7', title: 'L / Washed Charcoal', sku: 'KUR-TEE-CHR-L', price: 45, compareAtPrice: 55, inventoryQuantity: 20, option1: 'L', option2: 'Washed Charcoal' }
        ],
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'coffee',
    name: 'Artisanal Coffee & Roasters',
    description: 'Pre-seeded with specialty single-origin beans and pour-over equipment.',
    category: 'Food & Beverage',
    accentColor: '#b45309',
    products: [
      {
        id: 'tmpl_cff_1',
        title: 'Ethiopia Yirgacheffe Natural Process (250g)',
        handle: 'ethiopia-yirgacheffe-natural',
        vendor: 'Forge Roasters',
        productType: 'Coffee Beans',
        collectionId: 'gear',
        status: 'active',
        description: 'Tasting notes of wild blueberry, jasmine bloom, and candied lemon peel. Sourced directly from Gedeo zone smallholders at 2,100 meters elevation.',
        price: 22,
        compareAtPrice: 26,
        images: [
          'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1000&q=80'
        ],
        tags: ['coffee', 'single-origin', 'ethiopia'],
        options: [
          { name: 'Grind', values: ['Whole Bean', 'Filter Pour-Over', 'Espresso'] }
        ],
        variants: [
          { id: 'v_cff_1', title: 'Whole Bean', sku: 'FRG-ETH-WHL', price: 22, compareAtPrice: 26, inventoryQuantity: 40, option1: 'Whole Bean' },
          { id: 'v_cff_2', title: 'Filter Pour-Over', sku: 'FRG-ETH-FLT', price: 22, compareAtPrice: 26, inventoryQuantity: 25, option1: 'Filter Pour-Over' },
          { id: 'v_cff_3', title: 'Espresso', sku: 'FRG-ETH-ESP', price: 22, compareAtPrice: 26, inventoryQuantity: 18, option1: 'Espresso' }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'tmpl_cff_2',
        title: 'Precision Matte Ceramic Pour-Over Dripper',
        handle: 'precision-matte-ceramic-dripper',
        vendor: 'Forge Gear',
        productType: 'Equipment',
        collectionId: 'gear',
        status: 'active',
        description: 'Conical ceramic dripper engineered with 48 spiral ribs to optimize extraction velocity and thermal consistency.',
        price: 36,
        compareAtPrice: 42,
        images: [
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80'
        ],
        tags: ['equipment', 'ceramic', 'brewing'],
        options: [
          { name: 'Color', values: ['Matte Terracotta', 'Obsidian Slate'] }
        ],
        variants: [
          { id: 'v_cff_4', title: 'Matte Terracotta', sku: 'FRG-DRP-TER', price: 36, compareAtPrice: 42, inventoryQuantity: 15, option1: 'Matte Terracotta' },
          { id: 'v_cff_5', title: 'Obsidian Slate', sku: 'FRG-DRP-OBS', price: 36, compareAtPrice: 42, inventoryQuantity: 22, option1: 'Obsidian Slate' }
        ],
        createdAt: new Date().toISOString()
      }
    ]
  }
];

export const initialCollections = [
  { id: 'all', title: 'All Products', handle: 'all', description: 'Explore our full engineered collection.' },
  { id: 'apparel', title: 'Apparel', handle: 'apparel', description: 'Technical fabrics designed for modern movement.' },
  { id: 'footwear', title: 'Footwear', handle: 'footwear', description: 'Ultralight performance footwear engineered for agility.' },
  { id: 'gear', title: 'Gear & Accessories', handle: 'gear', description: 'Everyday carry essentials and modular packs.' },
];

export const initialApexProducts = [
  {
    id: 'prod_1',
    title: 'Apex Stealth Techwear Hoodie',
    handle: 'apex-stealth-techwear-hoodie',
    vendor: 'Apex Athletics',
    productType: 'Hoodies',
    collectionId: 'apparel',
    status: 'active',
    description: 'Constructed from a triple-layered hydro-repellent French terry cotton blend. Features hidden magnetic stash pockets, articulated sleeve darts for ergonomic movement, and a scuba collar hood that keeps elements out.',
    price: 88,
    compareAtPrice: 110,
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['hoodie', 'techwear', 'water-resistant', 'featured', 'bestseller'],
    options: [
      { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
      { name: 'Color', values: ['Midnight Onyx', 'Slate Grey'] }
    ],
    variants: [
      { id: 'var_1_1', title: 'S / Midnight Onyx', sku: 'APX-HD-BLK-S', price: 88, compareAtPrice: 110, inventoryQuantity: 12, option1: 'S', option2: 'Midnight Onyx' },
      { id: 'var_1_2', title: 'M / Midnight Onyx', sku: 'APX-HD-BLK-M', price: 88, compareAtPrice: 110, inventoryQuantity: 24, option1: 'M', option2: 'Midnight Onyx' },
      { id: 'var_1_3', title: 'L / Midnight Onyx', sku: 'APX-HD-BLK-L', price: 88, compareAtPrice: 110, inventoryQuantity: 18, option1: 'L', option2: 'Midnight Onyx' },
      { id: 'var_1_4', title: 'XL / Midnight Onyx', sku: 'APX-HD-BLK-XL', price: 88, compareAtPrice: 110, inventoryQuantity: 6, option1: 'XL', option2: 'Midnight Onyx' },
      { id: 'var_1_5', title: 'S / Slate Grey', sku: 'APX-HD-GRY-S', price: 88, compareAtPrice: 110, inventoryQuantity: 14, option1: 'S', option2: 'Slate Grey' },
      { id: 'var_1_6', title: 'M / Slate Grey', sku: 'APX-HD-GRY-M', price: 88, compareAtPrice: 110, inventoryQuantity: 19, option1: 'M', option2: 'Slate Grey' },
      { id: 'var_1_7', title: 'L / Slate Grey', sku: 'APX-HD-GRY-L', price: 88, compareAtPrice: 110, inventoryQuantity: 3, option1: 'L', option2: 'Slate Grey' },
      { id: 'var_1_8', title: 'XL / Slate Grey', sku: 'APX-HD-GRY-XL', price: 88, compareAtPrice: 110, inventoryQuantity: 0, option1: 'XL', option2: 'Slate Grey' }
    ],
    createdAt: '2026-03-01T10:00:00Z'
  },
  {
    id: 'prod_2',
    title: 'CloudFlow Ultralight Runner',
    handle: 'cloudflow-ultralight-runner',
    vendor: 'Apex Footwear',
    productType: 'Sneakers',
    collectionId: 'footwear',
    status: 'active',
    description: 'Engineered for high-mileage responsiveness. Weighing just 210g, the CloudFlow combines an adaptive TPU carbon rebound plate with a breathable monolithic mesh upper that contours seamlessly to your stride.',
    price: 145,
    compareAtPrice: 175,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['footwear', 'running', 'carbon-plate', 'featured'],
    options: [
      { name: 'Size', values: ['US 8', 'US 9', 'US 10', 'US 11'] },
      { name: 'Color', values: ['Triple White', 'Laser Crimson'] }
    ],
    variants: [
      { id: 'var_2_1', title: 'US 8 / Triple White', sku: 'CF-RUN-WHT-8', price: 145, compareAtPrice: 175, inventoryQuantity: 15, option1: 'US 8', option2: 'Triple White' },
      { id: 'var_2_2', title: 'US 9 / Triple White', sku: 'CF-RUN-WHT-9', price: 145, compareAtPrice: 175, inventoryQuantity: 32, option1: 'US 9', option2: 'Triple White' },
      { id: 'var_2_3', title: 'US 10 / Triple White', sku: 'CF-RUN-WHT-10', price: 145, compareAtPrice: 175, inventoryQuantity: 28, option1: 'US 10', option2: 'Triple White' },
      { id: 'var_2_4', title: 'US 11 / Triple White', sku: 'CF-RUN-WHT-11', price: 145, compareAtPrice: 175, inventoryQuantity: 11, option1: 'US 11', option2: 'Triple White' },
      { id: 'var_2_5', title: 'US 8 / Laser Crimson', sku: 'CF-RUN-RED-8', price: 145, compareAtPrice: 175, inventoryQuantity: 8, option1: 'US 8', option2: 'Laser Crimson' },
      { id: 'var_2_6', title: 'US 9 / Laser Crimson', sku: 'CF-RUN-RED-9', price: 145, compareAtPrice: 175, inventoryQuantity: 19, option1: 'US 9', option2: 'Laser Crimson' }
    ],
    createdAt: '2026-03-02T11:00:00Z'
  },
  {
    id: 'prod_3',
    title: 'Nomad All-Weather Roll-Top Pack 28L',
    handle: 'nomad-all-weather-roll-top-pack',
    vendor: 'Apex Gear',
    productType: 'Backpacks',
    collectionId: 'gear',
    status: 'active',
    description: 'Submersible-grade weatherproof backpack crafted from 840D ballistic recycled nylon. Features an external Fidlock magnetic buckle, padded 16-inch laptop chamber, and modular MOLLE attachments.',
    price: 129,
    compareAtPrice: 150,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['backpack', 'waterproof', 'travel', 'bestseller'],
    options: [
      { name: 'Color', values: ['Obsidian Black', 'Desert Sand'] }
    ],
    variants: [
      { id: 'var_3_1', title: 'Obsidian Black', sku: 'NMD-28L-BLK', price: 129, compareAtPrice: 150, inventoryQuantity: 45, option1: 'Obsidian Black' },
      { id: 'var_3_2', title: 'Desert Sand', sku: 'NMD-28L-SND', price: 129, compareAtPrice: 150, inventoryQuantity: 18, option1: 'Desert Sand' }
    ],
    createdAt: '2026-03-03T09:30:00Z'
  },
  {
    id: 'prod_4',
    title: 'Apex Precision Chrono Watch',
    handle: 'apex-precision-chrono-watch',
    vendor: 'Apex Horology',
    productType: 'Watches',
    collectionId: 'gear',
    status: 'active',
    description: 'Precision aerospace-grade Grade 5 titanium timepiece with sapphire crystal anti-reflective glass. Water resistant up to 100 meters with Swiss meca-quartz movement.',
    price: 220,
    compareAtPrice: 280,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['watch', 'titanium', 'luxury', 'featured'],
    options: [
      { name: 'Finish', values: ['Space Titanium', 'Matte Carbon'] }
    ],
    variants: [
      { id: 'var_4_1', title: 'Space Titanium', sku: 'WCH-TI-01', price: 220, compareAtPrice: 280, inventoryQuantity: 9, option1: 'Space Titanium' },
      { id: 'var_4_2', title: 'Matte Carbon', sku: 'WCH-CBN-02', price: 220, compareAtPrice: 280, inventoryQuantity: 14, option1: 'Matte Carbon' }
    ],
    createdAt: '2026-03-04T14:15:00Z'
  }
];

export const initialApexOrders = [
  {
    id: 'ord_1001',
    orderNumber: '#1001',
    customer: {
      firstName: 'Sophia',
      lastName: 'Chen',
      email: 'sophia.chen@example.com',
      address: '742 Evergreen Terrace',
      city: 'San Francisco',
      state: 'CA',
      zip: '94107'
    },
    items: [
      {
        productId: 'prod_1',
        variantId: 'var_1_2',
        title: 'Apex Stealth Techwear Hoodie',
        variantTitle: 'M / Midnight Onyx',
        price: 88,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80'
      }
    ],
    financialStatus: 'paid',
    fulfillmentStatus: 'fulfilled',
    trackingNumber: '1Z9999999999999999',
    subtotal: 88.00,
    shippingCost: 0.00,
    tax: 7.04,
    total: 95.04,
    createdAt: '2026-03-10T14:22:00Z'
  },
  {
    id: 'ord_1002',
    orderNumber: '#1002',
    customer: {
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'marcus.vance@example.com',
      address: '1204 Pine Crest Ave',
      city: 'Seattle',
      state: 'WA',
      zip: '98101'
    },
    items: [
      {
        productId: 'prod_2',
        variantId: 'var_2_2',
        title: 'CloudFlow Ultralight Runner',
        variantTitle: 'US 9 / Triple White',
        price: 145,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
      }
    ],
    financialStatus: 'paid',
    fulfillmentStatus: 'unfulfilled',
    trackingNumber: null,
    subtotal: 145.00,
    shippingCost: 0.00,
    tax: 11.60,
    total: 156.60,
    createdAt: '2026-03-11T09:12:00Z'
  }
];

export const initialApexCustomers = [
  {
    id: 'cust_1',
    name: 'Sophia Chen',
    email: 'sophia.chen@example.com',
    ordersCount: 3,
    totalSpent: 412.50,
    city: 'San Francisco, CA',
    tags: ['VIP', 'repeat-buyer']
  },
  {
    id: 'cust_2',
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    ordersCount: 1,
    totalSpent: 156.60,
    city: 'Seattle, WA',
    tags: ['first-time']
  }
];

export const initialApexDiscounts = [
  { code: 'WELCOME20', type: 'percentage', value: 20, description: '20% off all orders', minSubtotal: 0 },
  { code: 'FREESHIP', type: 'shipping', value: 100, description: 'Free Express Shipping', minSubtotal: 0 },
  { code: 'SAVE50', type: 'fixed', value: 50, description: '$50 off orders over $150', minSubtotal: 150 }
];

export const initialStores = [
  {
    id: 'store_apex',
    name: 'Apex Athletics & Co.',
    subdomain: 'apex-athletics.myshopify.local',
    customDomain: 'apexstore.fashion.com',
    category: 'Sportswear & Performance',
    themeId: 'theme_apex_velocity',
    accentColor: '#008060',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 0.08,
    freeShippingThreshold: 75.00,
    standardShippingRate: 6.99,
    expressShippingRate: 14.99,
    contactEmail: 'support@apexathletics.com',
    products: initialApexProducts,
    orders: initialApexOrders,
    customers: initialApexCustomers,
    discounts: initialApexDiscounts,
    cart: { items: [], discountCode: null },
    createdAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 'store_aura',
    name: 'Aura Studio Acoustics',
    subdomain: 'aura-sound.myshopify.local',
    customDomain: 'aurasound.audio.com',
    category: 'Consumer Electronics & Audio',
    themeId: 'theme_nordic_sound',
    accentColor: '#4f46e5',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 0.07,
    freeShippingThreshold: 100.00,
    standardShippingRate: 9.99,
    expressShippingRate: 19.99,
    contactEmail: 'contact@aurasound.io',
    products: [
      {
        id: 'prod_aura_1',
        title: 'Aura Studio ANC Wireless Headphones',
        handle: 'aura-studio-anc-headphones',
        vendor: 'Aura Acoustics',
        productType: 'Headphones',
        collectionId: 'gear',
        status: 'active',
        description: 'Custom 40mm bio-cellulose dynamic drivers with hybrid active noise cancellation up to -38dB. 45 hours battery life with memory foam earcups.',
        price: 199,
        compareAtPrice: 249,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80'
        ],
        tags: ['audio', 'headphones', 'bluetooth'],
        options: [
          { name: 'Color', values: ['Midnight Black', 'Frost Silver'] }
        ],
        variants: [
          { id: 'var_a_1', title: 'Midnight Black', sku: 'AUR-HDP-BLK', price: 199, compareAtPrice: 249, inventoryQuantity: 18, option1: 'Midnight Black' },
          { id: 'var_a_2', title: 'Frost Silver', sku: 'AUR-HDP-SLV', price: 199, compareAtPrice: 249, inventoryQuantity: 21, option1: 'Frost Silver' }
        ],
        createdAt: '2026-03-07T16:00:00Z'
      },
      {
        id: 'prod_aura_2',
        title: 'Aura Precision Hi-Fi Desktop DAC & Amp',
        handle: 'aura-precision-hifi-desktop-dac',
        vendor: 'Aura Acoustics',
        productType: 'DAC & Amps',
        collectionId: 'gear',
        status: 'active',
        description: 'Dual ESS Sabre ES9038Q2M DAC chips delivering ultra-low 0.0001% distortion with high-current headphone amplifier output.',
        price: 169,
        compareAtPrice: 199,
        images: [
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80'
        ],
        tags: ['audio', 'dac', 'audiophile'],
        options: [
          { name: 'Finish', values: ['Anodized Space Grey', 'Silver'] }
        ],
        variants: [
          { id: 'var_a_3', title: 'Anodized Space Grey', sku: 'AUR-DAC-GRY', price: 169, compareAtPrice: 199, inventoryQuantity: 14, option1: 'Anodized Space Grey' }
        ],
        createdAt: '2026-03-08T11:00:00Z'
      }
    ],
    orders: [
      {
        id: 'ord_aura_101',
        orderNumber: '#101',
        customer: {
          firstName: 'Julian',
          lastName: 'Casablancas',
          email: 'julian@example.com',
          address: '42 Bleecker St',
          city: 'New York',
          state: 'NY',
          zip: '10012'
        },
        items: [
          {
            productId: 'prod_aura_1',
            variantId: 'var_a_1',
            title: 'Aura Studio ANC Wireless Headphones',
            variantTitle: 'Midnight Black',
            price: 199,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'
          }
        ],
        financialStatus: 'paid',
        fulfillmentStatus: 'fulfilled',
        trackingNumber: 'FDX9921481920',
        subtotal: 199.00,
        shippingCost: 0.00,
        tax: 13.93,
        total: 212.93,
        createdAt: '2026-03-12T10:15:00Z'
      }
    ],
    customers: [
      {
        id: 'cust_aura_1',
        name: 'Julian Casablancas',
        email: 'julian@example.com',
        ordersCount: 1,
        totalSpent: 212.93,
        city: 'New York, NY',
        tags: ['Audiophile', 'Verified']
      }
    ],
    discounts: [
      { code: 'STUDIO10', type: 'percentage', value: 10, description: '10% off audio gear', minSubtotal: 0 }
    ],
    cart: { items: [], discountCode: null },
    createdAt: '2026-03-05T09:00:00Z'
  }
];
