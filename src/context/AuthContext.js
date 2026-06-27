"use client";

import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const DEFAULT_ADDRESSES = [];

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
  const [addresses, setAddresses] = useState([]);
  const [activeAddress, setActiveAddress] = useState(null);
  const [activeShop, setActiveShop] = useState({
    id: 1,
    name: "Main Warehouse Noida",
    address: "Sector 62, Block C",
    city: "Noida",
    latitude: 28.6289,
    longitude: 77.3801,
  });
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [deliveryETA, setDeliveryETA] = useState(14);
  const [loading, setLoading] = useState(true);

  const updateLocationAndShop = async (address) => {
    if (!address || !address.latitude || !address.longitude) {
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
      const shop = await api.getNearestShop(address.latitude, address.longitude);
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
      city: addr.city || '',
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
      city: addr.city || 'City',
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

      let loadedAddresses = [];
      if (storedAddresses) {
        try {
          loadedAddresses = JSON.parse(storedAddresses);
        } catch (e) {
          loadedAddresses = DEFAULT_ADDRESSES;
        }
      } else {
        loadedAddresses = DEFAULT_ADDRESSES;
        localStorage.setItem('addresses', JSON.stringify(DEFAULT_ADDRESSES));
      }
      setAddresses(loadedAddresses);

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
            setLoading(false);
          }).catch((err) => {
            if (err && err.isAuthError) {
              // Token is expired — wipe session and redirect to logged-out state
              console.warn('[AuthContext] Token expired on startup — logging out.');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              localStorage.removeItem('addresses');
              api.setToken(null);
              setUser(null);
              setToken(null);
              setIsAuthenticated(false);
              setAddresses(DEFAULT_ADDRESSES);
              // Restore address from localStorage if available for guest browsing
              if (storedAddress) {
                try { updateLocationAndShop(JSON.parse(storedAddress)); } catch (e) { updateLocationAndShop(null); }
              } else {
                updateLocationAndShop(null);
              }
            }
            setLoading(false);
          });
        } catch (e) {
          setLoading(false);
        }
      } else {
        if (storedAddress) {
          try {
            const parsed = JSON.parse(storedAddress);
            updateLocationAndShop(parsed);
          } catch (e) {}
        } else if (loadedAddresses.length > 0) {
          updateLocationAndShop(loadedAddresses[0]);
        } else {
          updateLocationAndShop(null);
        }
        setLoading(false);
      }
    } else {
      setLoading(false);
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

      // Merge temporary guest addresses (excluding default ones addr1 and addr2)
      const guestAddresses = addresses.filter(addr => 
        addr.id && 
        String(addr.id).startsWith('addr_') && 
        addr.id !== 'addr1' && 
        addr.id !== 'addr2'
      );

      if (guestAddresses.length > 0) {
        console.log('[AuthContext] Merging guest addresses to backend, count:', guestAddresses.length);
        for (const guestAddr of guestAddresses) {
          try {
            await api.saveAddress({
              title: guestAddr.type || 'Other',
              address_line1: `${guestAddr.flatNo || ''}||${guestAddr.addressLine || ''}`,
              address_line2: guestAddr.landmark || '',
              city: guestAddr.city || 'City',
              state: 'State',
              zipcode: guestAddr.zipcode,
              latitude: guestAddr.latitude,
              longitude: guestAddr.longitude,
              is_default: false,
              receiver_name: guestAddr.receiverName || userData.first_name || 'User',
              receiver_mobile: guestAddr.receiverMobile || userData.phone_number || ''
            });
          } catch (addrErr) {
            console.error('[AuthContext] Failed to merge guest address:', addrErr);
          }
        }
      }

      // Fetch all backend addresses after merge
      try {
        const freshAddrs = await api.fetchAddresses();
        if (freshAddrs && freshAddrs.length > 0) {
          const mapped = freshAddrs.map(b => {
            const parts = b.address_line1 ? b.address_line1.split('||') : [];
            const flatNo = parts[0] || b.address_line1;
            const addressLine = parts.length > 1 ? parts[1] : b.address_line1;
            return {
              id: b.id.toString(),
              type: b.title || 'Home',
              flatNo: flatNo,
              addressLine: addressLine,
              landmark: b.address_line2 || '',
              receiverName: b.receiver_name || userData.first_name || 'User',
              receiverMobile: b.receiver_mobile || userData.phone_number || '',
              zipcode: b.zipcode,
              city: b.city || '',
              latitude: b.latitude,
              longitude: b.longitude,
            };
          });
          setAddresses(mapped);
          localStorage.setItem('addresses', JSON.stringify(mapped));
          if (mapped.length > 0) {
            updateLocationAndShop(mapped[0]);
          }
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
    try {
      let savedAddr = newAddress;
      let isNew = !newAddress.id;
      
      if (isAuthenticated) {
        try {
          const backendIdObj = await api.saveAddress({
            title: newAddress.type || 'Other',
            address_line1: `${newAddress.flatNo || ''}||${newAddress.addressLine || ''}`,
            address_line2: newAddress.landmark || '',
            city: newAddress.city || 'City',
            state: 'State',
            zipcode: newAddress.zipcode,
            latitude: newAddress.latitude,
            longitude: newAddress.longitude,
            is_default: false,
            receiver_name: newAddress.receiverName,
            receiver_mobile: newAddress.receiverMobile
          });
          savedAddr = { ...newAddress, id: backendIdObj.id.toString() };
          
          const existingWithId = addresses.find(addr => addr.id === savedAddr.id);
          const existingWithType = addresses.find(addr => addr.type === savedAddr.type);
          if (existingWithId || existingWithType) {
            isNew = false;
          }
        } catch (backendErr) {
          console.log('Failed to sync address to backend, saving locally only', backendErr);
          if (!savedAddr.id) {
            savedAddr.id = 'addr_' + Math.floor(Math.random() * 1000000);
          }
        }
      } else if (!savedAddr.id) {
        savedAddr.id = 'addr_' + Math.floor(Math.random() * 1000000);
      }

      // Enforce at most one of each type in local addresses
      const otherAddresses = addresses.filter(addr => addr.type !== savedAddr.type && addr.id !== savedAddr.id);
      const updated = [...otherAddresses, savedAddr];
      
      setAddresses(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('addresses', JSON.stringify(updated));
      }

      if (isNew || !activeAddress || activeAddress.id === savedAddr.id || activeAddress.type === savedAddr.type) {
        const addressToActivate = savedAddr;
        await updateLocationAndShop(addressToActivate);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteAddress = async (id) => {
    try {
      if (isAuthenticated) {
        try {
          await api.deleteAddress(id);
        } catch (backendErr) {
          console.log('Failed to delete address from backend', backendErr);
        }
      }
      const updated = addresses.filter((addr) => String(addr.id) !== String(id));
      setAddresses(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('addresses', JSON.stringify(updated));
      }

      if (activeAddress && String(activeAddress.id) === String(id)) {
        const nextActive = updated.length > 0 ? updated[0] : null;
        await updateLocationAndShop(nextActive);
      }
    } catch (e) {
      console.error(e);
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
      // Auto-logout if token is expired, unauthorized, or invalid
      const errText = String(e.message || '').toLowerCase();
      if (errText.includes('unauthorized') || errText.includes('failed to fetch profile') || errText.includes('jwt') || errText.includes('token')) {
        console.warn('Logging out due to invalid or expired token.');
        logout();
      }
    }
  };

  const refreshAddresses = async () => {
    if (!isAuthenticated || !user) return;
    try {
      const backendAddresses = await api.fetchAddresses();
      if (backendAddresses && backendAddresses.length > 0) {
        const mappedAddresses = backendAddresses.map(b => {
          const parts = b.address_line1 ? b.address_line1.split('||') : [];
          const flatNo = parts[0] || b.address_line1;
          const addressLine = parts.length > 1 ? parts[1] : b.address_line1;
          return {
            id: b.id.toString(),
            type: b.title || 'Home',
            flatNo: flatNo,
            addressLine: addressLine,
            landmark: b.address_line2 || '',
            receiverName: b.receiver_name || user.first_name || 'User',
            receiverMobile: b.receiver_mobile || user.phone_number || '',
            zipcode: b.zipcode,
            city: b.city || '',
            latitude: b.latitude,
            longitude: b.longitude,
          };
        });
        setAddresses(mappedAddresses);
        if (typeof window !== 'undefined') {
          localStorage.setItem('addresses', JSON.stringify(mappedAddresses));
        }
        
        // Also update activeAddress in case it was modified or deleted
        if (activeAddress) {
          const stillExists = mappedAddresses.find(a => String(a.id) === String(activeAddress.id));
          if (stillExists) {
            updateLocationAndShop(stillExists);
          } else {
            updateLocationAndShop(mappedAddresses[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh addresses:', err);
      // Auto-logout if token is expired or unauthorized
      const errText = String(err.message || '').toLowerCase();
      if (errText.includes('unauthorized') || errText.includes('failed to fetch addresses') || errText.includes('jwt') || errText.includes('token')) {
        console.warn('Logging out due to invalid or expired token during address refresh.');
        logout();
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
