"use client";

import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';

import { API_BASE_URL } from '../services/api';

export const CartContext = createContext({
  cartItems: [],
  cartTotalQuantity: 0,
  cartSubtotal: 0,
  cartSavings: 0,
  deliveryFee: 0,
  handlingFee: 0,
  cartGrandTotal: 0,
  freeDeliveryThreshold: 300,
  freeHandlingThreshold: 500,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  fetchCart: () => {},
});

export const CartProvider = ({ children }) => {
  const { user, guestId, activeShop, activeAddress } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [cartData, setCartData] = useState({ total_price: 0 });

  // Helper to fetch the latest cart state from the backend
  const fetchCart = useCallback(async () => {
    const userIdParam = user?.id ? `userId=${user.id}` : '';
    const guestIdParam = (!user?.id && guestId) ? `guestId=${guestId}` : '';

    if (!userIdParam && !guestIdParam) {
      setCartItems([]);
      setCartData({ total_price: 0 });
      return;
    }
    try {
      const shopIdParam = activeShop?.id ? `&shopId=${activeShop.id}` : '';
      const addressIdParam = activeAddress?.id ? `&addressId=${activeAddress.id}` : '';
      const queryStr = [userIdParam, guestIdParam].filter(Boolean).join('') + shopIdParam + addressIdParam;

      const url = `${API_BASE_URL}/user/cart?${queryStr}`;
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      if (response.ok) {
        const data = await response.json();
        const cart = data.data || {};
        
        // Map backend cart structure to frontend expectations
        const mappedItems = (cart.items || []).map(item => ({
          ...item,
          id: item.id, // This is cart_items.id
          productId: item.product_id,
          name: item.name,
          price: Number(item.price),
          discountPrice: Number(item.price) - (Number(item.price) * (Number(item.discount_percentage || 0) / 100)),
          unit: `${item.size} ${item.quantity_type}`,
          image: item.image_url,
          quantity: item.quantity,
          stock: 100,
          isAvailable: Number(item.is_available) !== 0,
        }));

        setCartItems(mappedItems);
        setCartData(cart);
      }
    } catch (e) {
      console.error('Failed to load cart from Backend', e);
    }
  }, [user?.id, guestId, activeShop?.id, activeAddress?.id]);

  // Load cart when user, guestId, activeShop or activeAddress changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const syncTimeoutRef = useRef(null);

  const queueFetchCart = () => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      fetchCart();
    }, 500); // 500ms debounce
  };

  const addToCart = async (product, shopId) => {
    const effectiveShopId = shopId || activeShop?.id;
    if (!effectiveShopId) {
      console.warn('[CartContext] No active shop ID to add product to cart');
      return;
    }

    // Optimistic UI update
    setCartItems(prev => {
      const existing = prev.find(item => String(item.productId) === String(product.id));
      if (existing) {
        return prev.map(item => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: 'temp-' + Date.now(),
        productId: product.id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice || product.price,
        unit: product.unit,
        image: product.image,
        quantity: 1,
        stock: 100,
        isAvailable: true,
      }];
    });

    if (!user?.id && !guestId) return;

    try {
      const payload = {
        shopId: effectiveShopId,
        productId: product.id,
        quantity: 1
      };
      if (user?.id) {
        payload.userId = user.id;
      } else {
        payload.guestId = guestId;
      }

      const response = await fetch(`${API_BASE_URL}/user/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        queueFetchCart();
      } else {
        queueFetchCart();
      }
    } catch (e) {
      console.error('Failed to add item to cart', e);
      queueFetchCart();
    }
  };

  const removeFromCart = async (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
    try {
      const response = await fetch(`${API_BASE_URL}/user/cart/items/${cartItemId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        queueFetchCart();
      } else {
        queueFetchCart();
      }
    } catch (e) {
      console.error('Failed to remove item from cart', e);
      queueFetchCart();
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (String(cartItemId).startsWith('temp-')) {
      setCartItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));
      queueFetchCart();
      return;
    }

    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }
    
    setCartItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));
    try {
      const response = await fetch(`${API_BASE_URL}/user/cart/items/${cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      if (response.ok) {
        queueFetchCart();
      } else {
        queueFetchCart();
      }
    } catch (e) {
      console.error('Failed to update cart item quantity', e);
      queueFetchCart();
    }
  };

  const clearCart = async () => {
    const userIdParam = user?.id ? `userId=${user.id}` : '';
    const guestIdParam = (!user?.id && guestId) ? `guestId=${guestId}` : '';
    if (!userIdParam && !guestIdParam) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/cart?${[userIdParam, guestIdParam].filter(Boolean).join('')}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCartItems([]);
        setCartData({ total_price: 0 });
      }
    } catch (e) {
      console.error('Failed to clear cart', e);
    }
  };

  // Derive cart totals and fees from backend cart data or compute locally if empty
  const cartTotalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const pricing = cartData.pricing || { subtotal: 0, savings: 0, deliveryFee: 0, handlingFee: 0, grandTotal: 0 };

  const cartSubtotal = pricing.subtotal || 0;
  const cartSavings = pricing.savings || 0;
  const deliveryFee = pricing.deliveryFee || 0;
  const handlingFee = pricing.handlingFee || 0;
  const globalDiscountAmount = pricing.globalDiscountAmount || 0;
  const globalDiscountPercentage = pricing.globalDiscountPercentage || 0;
  const globalDiscountThreshold = pricing.globalDiscountThreshold || 0;
  const cartGrandTotal = pricing.grandTotal || 0;
  const freeDeliveryThreshold = pricing.freeDeliveryThreshold || 300;
  const freeHandlingThreshold = pricing.freeHandlingThreshold || 500;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotalQuantity,
        cartSubtotal,
        cartSavings,
        deliveryFee,
        handlingFee,
        globalDiscountAmount,
        globalDiscountPercentage,
        globalDiscountThreshold,
        cartGrandTotal,
        freeDeliveryThreshold,
        freeHandlingThreshold,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
