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
  updateUser: () => {},
  saveAddress: () => {},
  deleteAddress: () => {},
  setActiveAddressById: () => {},
  refreshProfile: () => {},
  refreshAddresses: () => {},
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

  const mapBackendAddress = (addr) => {
    const parts = (addr.address_line1 || '').split('||');
    return {
      id: String(addr.id),
      type: addr.title || 'Home',
      flatNo: parts[0] || '',
      addressLine: parts[1] || '',
      landmark: addr.address_line2 || '',
      receiverName: addr.receiver_name || '',
      receiverMobile: addr.receiver_mobile || '',
      zipcode: addr.zipcode || '',
      latitude: Number(addr.latitude) || 28.6139,
      longitude: Number(addr.longitude) || 77.2090,
    };
  };

  const mapFrontendAddressToBackend = (addr) => {
    return {
      id: (addr.id && !addr.id.startsWith('addr_')) ? Number(addr.id) : undefined,
      title: addr.type || 'Home',
      address_line1: `${addr.flatNo || ''}||${addr.addressLine || ''}`,
      address_line2: addr.landmark || '',
      city: 'City',
      state: 'State',
      zipcode: addr.zipcode,
      latitude: addr.latitude || 28.6139,
      longitude: addr.longitude || 77.2090,
      is_default: false,
      receiver_name: addr.receiverName || 'User',
      receiver_mobile: addr.receiverMobile || '',
    };
  };

  // Load custom values from localStorage or backend if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      // Guest session handling
      let currentGuestId = localStorage.getItem('guestId');
      if (!currentGuestId) {
        currentGuestId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('guestId', currentGuestId);
      }
      setGuestId(currentGuestId);

      const storedAddress = localStorage.getItem('activeAddress');
      const storedAddresses = localStorage.getItem('addresses');

      let loadedAddresses = DEFAULT_ADDRESSES;
      if (storedAddresses) {
        try {
          loadedAddresses = JSON.parse(storedAddresses);
          setAddresses(loadedAddresses);
        } catch (e) {}
      }

      if (storedToken && storedUser) {
        api.setToken(storedToken);
        setToken(storedToken);
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);

          // Fetch fresh addresses from backend if logged in
          api.fetchAddresses().then((res) => {
            if (res) {
              const mapped = res.map(mapBackendAddress);
              setAddresses(mapped);
              localStorage.setItem('addresses', JSON.stringify(mapped));
              
              // Set active address
              if (storedAddress) {
                try {
                  const parsedActive = JSON.parse(storedAddress);
                  const stillExists = mapped.find(m => m.id === parsedActive.id);
                  updateLocationAndShop(stillExists || mapped[0]);
                } catch (e) {
                  updateLocationAndShop(mapped[0]);
                }
              } else if (mapped.length > 0) {
                updateLocationAndShop(mapped[0]);
              } else {
                updateLocationAndShop(null);
              }
            }
          });
        } catch (e) {}
      } else {
        if (storedAddress) {
          try {
            const parsed = JSON.parse(storedAddress);
            updateLocationAndShop(parsed);
          } catch (e) {}
        } else if (loadedAddresses.length > 0) {
          updateLocationAndShop(loadedAddresses[0]);
        }
      }
    }
  }, []);

  const login = async (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    api.setToken(jwtToken);
    setIsAuthenticated(true);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', jwtToken);

      // Merge temporary guest cart
      const currentGuestId = localStorage.getItem('guestId');
      if (currentGuestId) {
        try {
          await api.mergeCarts(currentGuestId, userData.id);
          localStorage.removeItem('guestId');
          setGuestId(null);
        } catch (mergeErr) {
          console.error('Failed to merge cart:', mergeErr);
        }
      }

      // Merge temporary guest addresses from localStorage
      const storedAddresses = localStorage.getItem('addresses');
      if (storedAddresses) {
        try {
          const localAddrs = JSON.parse(storedAddresses);
          const guestAddrs = localAddrs.filter(addr => String(addr.id).startsWith('addr_'));
          
          if (guestAddrs.length > 0) {
            for (const guestAddr of guestAddrs) {
              try {
                const payload = mapFrontendAddressToBackend(guestAddr);
                await api.saveAddress(payload);
              } catch (addrErr) {
                console.error('Failed to merge guest address:', addrErr);
              }
            }
          }
        } catch (e) {}
      }

      // Fetch all backend addresses after merge
      try {
        const freshAddrs = await api.fetchAddresses();
        const mapped = freshAddrs.map(mapBackendAddress);
        setAddresses(mapped);
        localStorage.setItem('addresses', JSON.stringify(mapped));
        if (mapped.length > 0) {
          updateLocationAndShop(mapped[0]);
        }
      } catch (e) {
        console.error('Failed to fetch merged addresses:', e);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    api.setToken(null);
    setIsAuthenticated(false);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('activeAddress');
      localStorage.removeItem('addresses');

      // Generate a new guestId
      const newGuestId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('guestId', newGuestId);
      setGuestId(newGuestId);
      
      setAddresses(DEFAULT_ADDRESSES);
      updateLocationAndShop(DEFAULT_ADDRESSES[0]);
    }
  };

  const setActiveAddressById = (id) => {
    const target = addresses.find((addr) => addr.id === id);
    if (target) {
      updateLocationAndShop(target);
    }
  };

  const saveAddress = async (newAddress) => {
    if (isAuthenticated) {
      try {
        const payload = mapFrontendAddressToBackend(newAddress);
        const saved = await api.saveAddress(payload);
        const mappedSaved = mapBackendAddress(saved);
        
        // Enforce at most one of each type in local state to match mobile app behavior
        const otherAddresses = addresses.filter(addr => addr.type !== mappedSaved.type && addr.id !== mappedSaved.id);
        const updated = [...otherAddresses, mappedSaved];
        
        setAddresses(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('addresses', JSON.stringify(updated));
        }
        if (!activeAddress || activeAddress.id === newAddress.id || activeAddress.type === mappedSaved.type) {
          updateLocationAndShop(mappedSaved);
        }
      } catch (e) {
        alert(e.message || 'Failed to save address to backend.');
      }
    } else {
      // Offline / guest mode address saving
      let savedAddr;
      if (newAddress.id) {
        savedAddr = newAddress;
      } else {
        savedAddr = {
          ...newAddress,
          id: 'addr_' + Date.now(),
        };
      }
      
      // Enforce at most one of each type in local state to match mobile app behavior
      const otherAddresses = addresses.filter(addr => addr.type !== savedAddr.type && addr.id !== savedAddr.id);
      const updated = [...otherAddresses, savedAddr];

      setAddresses(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('addresses', JSON.stringify(updated));
      }
      if (!activeAddress || activeAddress.id === newAddress.id || activeAddress.type === savedAddr.type) {
        updateLocationAndShop(savedAddr);
      }
    }
  };

  const deleteAddress = async (id) => {
    const stringId = String(id);
    if (isAuthenticated && !stringId.startsWith('addr_')) {
      try {
        await api.deleteAddress(id);
        const updated = addresses.filter((addr) => String(addr.id) !== stringId);
        setAddresses(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('addresses', JSON.stringify(updated));
        }
        if (activeAddress && String(activeAddress.id) === stringId) {
          const nextActive = updated.length > 0 ? updated[0] : null;
          updateLocationAndShop(nextActive);
        }
      } catch (e) {
        alert(e.message || 'Failed to delete address.');
      }
    } else {
      const updated = addresses.filter((addr) => String(addr.id) !== stringId);
      setAddresses(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('addresses', JSON.stringify(updated));
      }
      if (activeAddress && String(activeAddress.id) === stringId) {
        const nextActive = updated.length > 0 ? updated[0] : null;
        updateLocationAndShop(nextActive);
      }
    }
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(newUserData));
    }
  };

  const refreshProfile = async () => {
    if (!isAuthenticated) return;
    try {
      const freshUserObj = await api.getProfile();
      if (freshUserObj) {
        setUser(freshUserObj);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(freshUserObj));
        }
      }
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  };

  const refreshAddresses = async () => {
    if (!isAuthenticated) return;
    try {
      const backendAddresses = await api.fetchAddresses();
      if (backendAddresses) {
        const mappedAddresses = backendAddresses.map(mapBackendAddress);
        setAddresses(mappedAddresses);
        if (typeof window !== 'undefined') {
          localStorage.setItem('addresses', JSON.stringify(mappedAddresses));
        }
        if (activeAddress) {
          const stillExists = mappedAddresses.find(a => String(a.id) === String(activeAddress.id));
          if (stillExists) {
            updateLocationAndShop(stillExists);
          } else if (mappedAddresses.length > 0) {
            updateLocationAndShop(mappedAddresses[0]);
          } else {
            updateLocationAndShop(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh addresses:', err);
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
        updateUser,
        saveAddress,
        deleteAddress,
        setActiveAddressById,
        refreshProfile,
        refreshAddresses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
