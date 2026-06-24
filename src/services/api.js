export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'https://api.freshsabjihub.com/api/v1';
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return 'http://localhost:5000/api/v1';
  }
  return 'https://api.freshsabjihub.com/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();  

let authToken = null;

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

export const api = {
  setToken: (token) => {
    authToken = token;
  },
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

  // Fetch nearest shop by latitude and longitude (15km radius check handled by backend)
  getNearestShop: async (latitude, longitude) => {
    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng)) {
        console.warn('Invalid coordinates passed to getNearestShop:', latitude, longitude);
        return null;
      }
      const response = await fetch(`${API_BASE_URL}/user/catalog/nearest-shop?latitude=${lat}&longitude=${lng}`);
      if (!response.ok) {
        if (response.status === 404) return null; // No shop found
        throw new Error('Failed to fetch nearest shop');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching nearest shop:', error);
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
      const url = shopId 
        ? `${API_BASE_URL}/user/shop-inventory/${shopId}`
        : `${API_BASE_URL}/user/catalog/products`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      const responseData = await response.json();
      let filtered = responseData.data || [];

      // Map backend shop_products or products schema to the frontend expectations
      filtered = filtered.map(p => {
        const basePrice = Number(p.price !== undefined ? p.price : p.mrp_price) || 0;
        return {
          ...p,
          id: String(p.product_id || p.id),
          name: p.product_name || p.name,
          categoryId: String(p.category_id),
          image: p.image_url,
          price: basePrice,
          discountPrice: p.discount_percentage ? basePrice - (basePrice * (Number(p.discount_percentage) / 100)) : basePrice,
          unit: `${p.quantity} ${p.quantity_type}`,
          stock: p.is_available !== false ? 50 : 0,
          rating: 4.5,
        };
      });

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

  // Request OTP from backend
  sendOtp: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to send OTP');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  },

  // Verify custom OTP
  verifyOtp: async (email, otp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Login failed');
      }
      const data = await response.json();
      return data.data; // Should contain { user, token }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/auth/profile`, {
        headers: getHeaders(),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch profile');
      }
      const data = await response.json();
      return data.data; // The user object
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (name, email, phoneNumber, profilePictureUrl) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, phone_number: phoneNumber, profile_picture_url: profilePictureUrl }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update profile');
      }
      const data = await response.json();
      return data.data; // The updated user
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Fetch User Addresses
  fetchAddresses: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/auth/addresses`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch addresses');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return [];
    }
  },

  // Save User Address
  saveAddress: async (addressData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/auth/addresses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(addressData),
      });
      if (!response.ok) throw new Error('Failed to save address');
      const data = await response.json();
      return data.data; // contains id
    } catch (error) {
      console.error('Error saving address:', error);
      throw error;
    }
  },

  // Delete User Address
  deleteAddress: async (addressId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/auth/addresses/${addressId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete address');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  },

  // Merge carts
  mergeCarts: async (guestId, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/cart/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, userId }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to merge carts');
      }
      return await response.json();
    } catch (error) {
      console.error('Merge carts API error:', error);
      throw error;
    }
  },

  // Upload user avatar image
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/user/auth/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Upload failed');
      }

      const data = await response.json();
      return data.data.url;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  },

  submitSupportQuery: async (subject, description, email, name, phone) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/support/query`, {
        method: 'POST',
        headers: getHeaders(),
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

  // Fetch all shops from backend
  getShops: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/catalog/shops`);
      if (!response.ok) {
        console.error('Failed to fetch shops: server returned non-OK status');
        return [];
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching shops:', error);
      return [];
    }
  },

  // Fetch user notifications from backend
  fetchNotifications: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/notifications`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // Mark notification as read on backend
  markNotificationRead: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/notifications/mark-read/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all user notifications as read on backend
  markAllNotificationsRead: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/notifications/mark-all-read`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Clear all user notifications on backend
  clearNotifications: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/notifications`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to clear notifications');
      return await response.json();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  },
};

