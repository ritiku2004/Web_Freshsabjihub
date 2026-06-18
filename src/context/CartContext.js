"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

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
});

export const CartProvider = ({ children }) => {
  const { activeAddress } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);

  // Load from localStorage if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('cartItems');
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (e) {}
      }
    }
  }, []);

  const saveCart = (items) => {
    setCartItems(items);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cartItems', JSON.stringify(items));
    }
  };

  const addToCart = (product) => {
    const existing = cartItems.find((item) => String(item.productId) === String(product.id));
    let updated;
    if (existing) {
      updated = cartItems.map((item) =>
        String(item.productId) === String(product.id)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updated = [
        ...cartItems,
        {
          id: 'item_' + Date.now(),
          productId: product.id,
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice || product.price,
          discountPercentage: product.discountPercentage || 0,
          unit: product.unit,
          image: product.image,
          quantity: 1,
          stock: product.stock || 50,
          isAvailable: true,
        },
      ];
    }
    saveCart(updated);
  };

  const removeFromCart = (cartItemId) => {
    const updated = cartItems.filter((item) => item.id !== cartItemId);
    saveCart(updated);
  };

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }
    const updated = cartItems.map((item) =>
      item.id === cartItemId ? { ...item, quantity } : item
    );
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Derive cart totals and fees (formulas matching backend_and_app_flow blueprint)
  const cartTotalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
    0
  );

  const cartSavings = cartItems.reduce(
    (acc, item) => acc + (item.price - (item.discountPrice || item.price)) * item.quantity,
    0
  );

  const freeDeliveryThreshold = 300;
  const freeHandlingThreshold = 500;

  const deliveryFee = cartTotalQuantity === 0 ? 0 : cartSubtotal >= freeDeliveryThreshold ? 0 : 30;
  const handlingFee = cartTotalQuantity === 0 ? 0 : cartSubtotal >= freeHandlingThreshold ? 0 : 15;

  // 5% standard GST on subtotal
  const gstTax = Math.round(cartSubtotal * 0.05 * 100) / 100;

  const cartGrandTotal = Math.round((cartSubtotal + gstTax + deliveryFee + handlingFee) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotalQuantity,
        cartSubtotal,
        cartSavings,
        deliveryFee,
        handlingFee,
        cartGrandTotal,
        freeDeliveryThreshold,
        freeHandlingThreshold,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
