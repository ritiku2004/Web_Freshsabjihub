"use client";

import React, { createContext, useState, useEffect } from 'react';

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
  isAuthenticated: true,
  user: null,
  token: null,
  guestId: null,
  addresses: [],
  activeAddress: null,
  activeShop: null,
  serviceAvailable: true,
  loading: false,
  deliveryETA: 14,
  saveAddress: () => {},
  deleteAddress: () => {},
  setActiveAddressById: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState({
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone_number: "9876543210",
    profile_picture_url: null,
  });
  const [token, setToken] = useState("mock-jwt-token");
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

  // Load custom values from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAddress = localStorage.getItem('activeAddress');
      const storedAddresses = localStorage.getItem('addresses');
      if (storedAddress) {
        try {
          setActiveAddress(JSON.parse(storedAddress));
        } catch (e) {}
      }
      if (storedAddresses) {
        try {
          setAddresses(JSON.parse(storedAddresses));
        } catch (e) {}
      }
    }
  }, []);

  const setActiveAddressById = (id) => {
    const target = addresses.find((addr) => addr.id === id);
    if (target) {
      setActiveAddress(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeAddress', JSON.stringify(target));
      }
      // Re-evaluate service availability based on zipcode
      if (target.zipcode === '99999' || target.zipcode.startsWith('99')) {
        setServiceAvailable(false);
        setActiveShop(null);
        setDeliveryETA(null);
      } else {
        setServiceAvailable(true);
        setActiveShop({
          id: 1,
          name: "Main Warehouse Noida",
          address: "Sector 62, Block C",
          city: "Noida",
          zipcode: "10001",
          latitude: 28.6289,
          longitude: 77.3801,
        });
        setDeliveryETA(target.type === 'Office' ? 25 : 14);
      }
    }
  };

  const saveAddress = (newAddress) => {
    let updated;
    if (newAddress.id) {
      updated = addresses.map((addr) => (addr.id === newAddress.id ? newAddress : addr));
    } else {
      const created = {
        ...newAddress,
        id: 'addr_' + Date.now(),
      };
      updated = [...addresses, created];
    }
    setAddresses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('addresses', JSON.stringify(updated));
    }
    // Set active if it was new or if currently active address is overwritten
    if (!activeAddress || activeAddress.id === newAddress.id) {
      const current = newAddress.id ? newAddress : updated[updated.length - 1];
      setActiveAddress(current);
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeAddress', JSON.stringify(current));
      }
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
      setActiveAddress(nextActive);
      if (typeof window !== 'undefined') {
        if (nextActive) {
          localStorage.setItem('activeAddress', JSON.stringify(nextActive));
        } else {
          localStorage.removeItem('activeAddress');
        }
      }
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
        saveAddress,
        deleteAddress,
        setActiveAddressById,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
