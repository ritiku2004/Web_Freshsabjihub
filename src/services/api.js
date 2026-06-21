const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api/v1'
  : 'https://api.freshsabjihub.com/api/v1';

export const api = {
  // Fetch promotional offer banners from Backend
  getBanners: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/catalog/banners`);
      if (!response.ok) throw new Error('Failed to fetch banners');
      const data = await response.json();

      // Map backend fields to what the frontend expects
      return (data.data || []).map(b => ({
        id: b.id.toString(),
        title: b.title,
        subtitle: b.subtitle || '',
        description: b.description || '',
        image: b.image_url,
        backgroundColor: b.background_color,
        textColor: b.text_color,
        location: b.location
      }));
    } catch (error) {
      console.error('Error fetching banners:', error);
      return [];
    }
  },

  // Fetch shop by zipcode
  getShopByZipcode: async (zipcode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/catalog/shop-by-zipcode/${zipcode}`);
      if (!response.ok) {
        if (response.status === 404) return null; // No shop found
        throw new Error('Failed to fetch shop');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching shop by zipcode:', error);
      return null;
    }
  },

  // Fetch all categories from Backend
  getCategories: async (arg) => {
    try {
      // Handle both React Query call ({ queryKey }) and standard call (shopId string)
      let shopId = '';
      if (arg && typeof arg === 'object' && arg.queryKey) {
        shopId = arg.queryKey[1] || '';
      } else if (typeof arg === 'string' || typeof arg === 'number') {
        shopId = arg;
      }
      
      const url = shopId ? `${API_BASE_URL}/user/catalog/categories?shopId=${shopId}` : `${API_BASE_URL}/user/catalog/categories`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return (data.data || []).map(c => ({
        ...c,
        id: String(c.id),
        image: c.image_url
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Fetch products from Backend
  getProducts: async ({
    shopId,
    categoryId,
    subcategory = 'All',
    search = '',
    sortBy = 'default',
    page = 1,
    limit = 100, // Default higher limit to fetch all products for horizontal scrollers
  } = {}) => {
    try {
      if (!shopId) return { products: [], hasMore: false, totalCount: 0 };

      const response = await fetch(`${API_BASE_URL}/user/shop-inventory/${shopId}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const responseData = await response.json();
      let filtered = responseData.data || [];

      // Map backend shop_products schema to the frontend expectations
      filtered = filtered.map(p => ({
        ...p,
        id: String(p.product_id || p.id),
        name: p.product_name || p.name,
        categoryId: String(p.category_id),
        image: p.image_url,
        price: Number(p.price) || 0,
        discountPrice: p.discount_percentage ? Number(p.price) - (Number(p.price) * (Number(p.discount_percentage) / 100)) : Number(p.price),
        unit: `${p.quantity} ${p.quantity_type}`,
        stock: p.is_available ? 50 : 0,
        rating: 4.5,
      }));

      // Filter by Category
      if (categoryId) {
        filtered = filtered.filter((p) => String(p.category_id) === String(categoryId));
      }

      // Filter by Search Query
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        filtered = filtered.filter(
          (p) =>
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const paginatedItems = filtered.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < filtered.length;

      return {
        products: paginatedItems,
        hasMore,
        totalCount: filtered.length,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { products: [], hasMore: false, totalCount: 0 };
    }
  },

  // Fetch product detail by ID from Backend
  getProductDetails: async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/catalog/products/${productId}`);
      if (!response.ok) throw new Error('Product not found');
      const data = await response.json();
      const p = data.data;

      return {
        ...p,
        image: p.image_url || p.image,
        price: Number(p.mrp_price) || 0,
        discountPrice: p.discount_percentage ? Number(p.mrp_price) - (Number(p.mrp_price) * (Number(p.discount_percentage) / 100)) : Number(p.mrp_price),
        unit: `${p.quantity} ${p.quantity_type}`,
        stock: 50,
        rating: 4.5,
      };
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
  },

  // Submit support/contact inquiry
  submitSupportQuery: async (subject, description, token, email, name, phone) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_BASE_URL}/user/support/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ subject, description, email, name, phone }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit support query');
      }
      return await response.json();
    } catch (error) {
      console.error('Error in submitSupportQuery API:', error);
      throw error;
    }
  },

  // Create order on the Backend
  createOrder: async (orderData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create order');
      }
      return await response.json();
    } catch (error) {
      console.error('Error in createOrder API:', error);
      throw error;
    }
  },

  // Verify payment on the Backend
  verifyPayment: async (paymentData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/orders/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to verify payment');
      }
      return await response.json();
    } catch (error) {
      console.error('Error in verifyPayment API:', error);
      throw error;
    }
  },
};
