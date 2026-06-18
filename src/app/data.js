export const MOCK_BANNERS = [
  {
    id: 'b1',
    title: 'Fresh Vegetables Big Discounts',
    subtitle: 'DISCOVER 100% ORGANIC',
    description: 'Save up to 30% on your order',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
    backgroundColor: '#fff3e0',
    textColor: '#15803d',
    location: 'home_top'
  },
  {
    id: 'b2',
    title: 'Fresh Fruits Special Deals',
    subtitle: '100% ORGANIC & RIPE',
    description: 'Direct from the finest farms',
    image: 'https://images.unsplash.com/photo-1610832958506-ee56336191d8?w=400',
    backgroundColor: '#e8f5e9',
    textColor: '#1b5e20',
    location: 'home_top'
  },
  {
    id: 'b3',
    title: 'Dairy & Breakfast Essentials',
    subtitle: 'FRESH EVERY DAY',
    description: 'Pure milk, butter, and farm eggs',
    image: 'https://images.unsplash.com/photo-1528750955906-798874db12fe?w=400',
    backgroundColor: '#e3f2fd',
    textColor: '#0d47a1',
    location: 'home_middle'
  }
];

export const MOCK_CATEGORIES_BANNER = [
  {
    id: 'cb1',
    title: 'Organic Produce Fresh Daily',
    subtitle: '100% ORGANIC PROMISE',
    description: 'Straight from partner farms to your home',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    backgroundColor: '#fffbeb', // soft warm cream background matching app
    textColor: '#27272a',
    location: 'categories_top'
  }
];

export const MOCK_CATEGORIES = [
  { id: 'cat1', name: 'Pet Care & Supplies', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=150' },
  { id: 'cat2', name: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1566385962061-2d449007a35e?w=150' },
  { id: 'cat3', name: 'Dairy, Bread & Eggs', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150' },
  { id: 'cat4', name: 'Snacks & Munchies', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bc087?w=150' },
  { id: 'cat5', name: 'Cold Drinks & Juices', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150' },
];

export const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Pedigree Adult Dry Dog Food', price: 120, discountPrice: 110, unit: '1 kg', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300', stock: 20, categoryId: 'cat1' },
  { id: 'p2', name: 'Super Dog Play Ball Toy', price: 80, discountPrice: 70, unit: '1 pc', image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=300', stock: 15, categoryId: 'cat1' },
  { id: 'p3', name: 'Organic Hybrid Tomato', price: 50, discountPrice: 40, unit: '500 g', image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=300', stock: 45, categoryId: 'cat2' },
  { id: 'p4', name: 'Shimla Royal Apple', price: 180, discountPrice: 150, unit: '4 pcs', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300', stock: 25, categoryId: 'cat2' },
  { id: 'p5', name: 'Robusta Banana', price: 60, discountPrice: 48, unit: '6 pcs', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300', stock: 30, categoryId: 'cat2' },
  { id: 'p6', name: 'Amul Milk Toned', price: 28, discountPrice: 28, unit: '500 ml', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300', stock: 100, categoryId: 'cat3' },
  { id: 'p7', name: 'Amul Salted Butter', price: 56, discountPrice: 54, unit: '100 g', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300', stock: 40, categoryId: 'cat3' },
  { id: 'p8', name: 'Fresh Cottage Cheese (Paneer)', price: 90, discountPrice: 80, unit: '200 g', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300', stock: 18, categoryId: 'cat3' },
  { id: 'p9', name: 'Lays Potato Chips (Classic)', price: 20, discountPrice: 20, unit: '50 g', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bc087?w=300', stock: 50, categoryId: 'cat4' },
  { id: 'p10', name: 'Kurkure Masala Munch', price: 20, discountPrice: 20, unit: '90 g', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bc087?w=300', stock: 40, categoryId: 'cat4' },
  { id: 'p11', name: 'Coca-Cola Classic Can', price: 40, discountPrice: 38, unit: '300 ml', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300', stock: 60, categoryId: 'cat5' },
  { id: 'p12', name: 'Minute Maid Orange Juice', price: 90, discountPrice: 85, unit: '1 L', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300', stock: 25, categoryId: 'cat5' }
];

export const INITIAL_ORDERS = [
  {
    id: 'ord1',
    orderNumber: 'ORD849201',
    date: 'June 18, 2026',
    status: 'Delivered',
    items: [
      { productId: 'p3', name: 'Organic Hybrid Tomato', quantity: 2, price: 40 },
      { productId: 'p7', name: 'Amul Salted Butter', quantity: 1, price: 54 },
    ],
    totalAmount: 149.00
  },
  {
    id: 'ord2',
    orderNumber: 'ORD849195',
    date: 'June 12, 2026',
    status: 'Delivered',
    items: [
      { productId: 'p4', name: 'Shimla Royal Apple', quantity: 1, price: 150 },
      { productId: 'p5', name: 'Robusta Banana', quantity: 1, price: 48 },
    ],
    totalAmount: 228.00
  }
];
