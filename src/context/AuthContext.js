"use client";

import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const DEFAULT_ADDRESSES = [
  {
    id: 'addr1',
    type: 'Home',
    flatNo: 'A-404, Green Heights',
    addressLine: 'Sector 62, Noida, Uttar Pradesh',
    landmark: 'Near Galaxy Business Park',
    receiverName: 'John Doe',
    receiverMobile: '9876543210',
    zipcode: '10001',
    latitude: 28.6289,
    longitude: 77.3801,
  },
  {
    id: 'addr2',
    type: 'Office',
    flatNo: 'Cabin 12, Level 5',
    addressLine: 'Vasant Kunj Phase 2, New Delhi',
    landmark: 'Opposite Vasant Square Mall',
    receiverName: 'John Doe Office',
    receiverMobile: '9876543210',
    zipcode: '110070',
    latitude: 28.5244,
    longitude: 77.1557,
  },
];

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  token: null,
  guestId: null,
  addresses: [],
  activeAddress: null,
  activeShop: null,
  serviceAvailable: true,
  loading: false,
  deliveryETA: 14,
  login: () => {},
  logout: () => {},
  saveAddress: () => {},
  deleteAddress: () => {},
  setActiveAddressById: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [addresses, setAddresses] = useState(DEFAULT_ADDRESSES);
  const [activeAddress, setActiveAddress] = useState(DEFAULT_ADDRESSES[0]);
  const [activeShop, setActiveShop] = useState({
    id: 1,
    name: "Main Warehouse Noida",
    address: "Sector 62, Block C",
    city: "Noida",
    zipcode: "10001",
    latitude: 28.6289,
    longitude: 77.3801,
  });
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [deliveryETA, setDeliveryETA] = useState(14);
  const [loading, setLoading] = useState(false);

  const updateLocationAndShop = async (address) => {
    if (!address || !address.zipcode) {
      setActiveAddress(address);
      setActiveShop(null);
      setServiceAvailable(false);
      setDeliveryETA(null);
      if (typeof window !== 'undefined') {
        if (address) {
          localStorage.setItem('activeAddress', JSON.stringify(address));
        } else {
          localStorage.removeItem('activeAddress');
        }
      }
      return;
    }

    setActiveAddress(address);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeAddress', JSON.stringify(address));
    }

    try {
      const shop = await api.getShopByZipcode(address.zipcode);
      if (shop) {
        setActiveShop(shop);
        setServiceAvailable(true);
        setDeliveryETA(address.type === 'Office' ? 25 : 14);
      } else {
        setActiveShop(null);
        setServiceAvailable(false);
        setDeliveryETA(null);
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      setActiveShop(null);
      setServiceAvailable(false);
      setDeliveryETA(null);
    }
  };

  // Load custom values from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } catch (e) {}
      }

      const storedAddress = localStorage.getItem('activeAddress');
      const storedAddresses = localStorage.getItem('addresses');
      
      let loadedAddresses = DEFAULT_ADDRESSES;
      if (storedAddresses) {
        try {
          loadedAddresses = JSON.parse(storedAddresses);
          setAddresses(loadedAddresses);
        } catch (e) {}
      }

      if (storedAddress) {
        try {
          const parsed = JSON.parse(storedAddress);
          updateLocationAndShop(parsed);
        } catch (e) {}
      } else if (loadedAddresses.length > 0) {
        updateLocationAndShop(loadedAddresses[0]);
      }
    }
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', jwtToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('activeAddress');
    }
  };

  const setActiveAddressById = (id) => {
    const target = addresses.find((addr) => addr.id === id);
    if (target) {
      updateLocationAndShop(target);
    }
  };

  const saveAddress = (newAddress) => {
    let updated;
    let savedAddr;
    if (newAddress.id) {
      updated = addresses.map((addr) => (addr.id === newAddress.id ? newAddress : addr));
      savedAddr = newAddress;
    } else {
      savedAddr = {
        ...newAddress,
        id: 'addr_' + Date.now(),
      };
      updated = [...addresses, savedAddr];
    }
    setAddresses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('addresses', JSON.stringify(updated));
    }
    // Set active if it was new or if currently active address is overwritten
    if (!activeAddress || activeAddress.id === newAddress.id) {
      updateLocationAndShop(savedAddr);
    }
  };

  const deleteAddress = (id) => {
    const updated = addresses.filter((addr) => addr.id !== id);
    setAddresses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('addresses', JSON.stringify(updated));
    }
    if (activeAddress && activeAddress.id === id) {
      const nextActive = updated.length > 0 ? updated[0] : null;
      updateLocationAndShop(nextActive);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        guestId,
        addresses,
        activeAddress,
        activeShop,
        serviceAvailable,
        loading,
        deliveryETA,
        login,
        logout,
        saveAddress,
        deleteAddress,
        setActiveAddressById,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
