"use client";

import React, { useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Home,
  Briefcase,
  MapPin,
  Trash2,
  Check,
  Navigation,
  Plus,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import styles from './addresses.module.css';

const ADDRESS_TYPES = ['Home', 'Office', 'Other'];

export default function AddressesPage() {
  const router = useRouter();
  const {
    addresses,
    activeAddress,
    saveAddress,
    deleteAddress,
    setActiveAddressById,
  } = useContext(AuthContext);

  // Form States
  const [addressType, setAddressType] = useState('Home');
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [availableCities, setAvailableCities] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const isTypingRef = useRef(false);

  // Fetch available cities on mount
  useEffect(() => {
    const loadCities = async () => {
      try {
        const shops = await api.getShops();
        const cities = [...new Set(shops.filter(s => s.is_active).map(s => s.city))];
        setAvailableCities(cities);
      } catch (err) {
        console.error('Error fetching shops/cities:', err);
      }
    };
    loadCities();
  }, []);

  // Populate form when addressType changes
  useEffect(() => {
    const existing = addresses.find(addr => addr.type === addressType);
    if (existing) {
      setReceiverName(existing.receiverName || '');
      setReceiverMobile(existing.receiverMobile || '');
      setFlatNo(existing.flatNo || '');
      setAddressLine(existing.addressLine || '');
      setLandmark(existing.landmark || '');
      setCity(existing.city || '');
      setLatitude(existing.latitude || null);
      setLongitude(existing.longitude || null);
      setEditingAddressId(existing.id);
    } else {
      clearForm();
    }
  }, [addressType, addresses, availableCities]);

  // Sync addressType with activeAddress selection
  useEffect(() => {
    if (activeAddress && activeAddress.type) {
      setAddressType(activeAddress.type);
    } else {
      setAddressType('Home');
    }
  }, [activeAddress]);

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) { resolve(window.L); return; }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve(window.L);
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then((L) => {
      if (!mapRef.current || leafletMapRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([28.6139, 77.2090], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const marker = L.marker([28.6139, 77.2090], { draggable: true }).addTo(map);
      marker.on('dragend', (e) => {
        const coords = e.target.getLatLng();
        setLatitude(coords.lat);
        setLongitude(coords.lng);
        reverseGeocode(coords.lat, coords.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setLatitude(e.latlng.lat);
        setLongitude(e.latlng.lng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      leafletMapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);

      // Set initial position from existing address
      const existing = addresses.find(a => a.type === addressType);
      if (existing?.latitude && existing?.longitude) {
        map.setView([existing.latitude, existing.longitude], 17);
        marker.setLatLng([existing.latitude, existing.longitude]);
      }
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update map when lat/lng changes
  useEffect(() => {
    if (mapReady && leafletMapRef.current && markerRef.current && latitude && longitude) {
      leafletMapRef.current.setView([latitude, longitude], 16);
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude, mapReady]);

  // Search location on typing, matching the mobile app behavior
  // Automatically point map to the city when user changes city
  useEffect(() => {
    if (!city) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city.trim())}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const best = data[0];
            const lat = Number(best.lat);
            const lng = Number(best.lon);
            setLatitude(lat);
            setLongitude(lng);
            
            if (leafletMapRef.current && markerRef.current) {
              leafletMapRef.current.setView([lat, lng], 12);
              markerRef.current.setLatLng([lat, lng]);
            }
          }
        }
      } catch (e) {
        console.error('City geocoding failed:', e);
      }
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, [city]);

  // Refined search when user enters area/colony/sector
  useEffect(() => {
    if (!addressLine.trim() || !city.trim()) return;

    const timeoutId = setTimeout(async () => {
      try {
        const query = `${addressLine.trim()}, ${city.trim()}`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const best = data[0];
            const lat = Number(best.lat);
            const lng = Number(best.lon);
            setLatitude(lat);
            setLongitude(lng);
            
            if (leafletMapRef.current && markerRef.current) {
              leafletMapRef.current.setView([lat, lng], 15);
              markerRef.current.setLatLng([lat, lng]);
            }
          }
        }
      } catch (e) {
        console.error('Area geocoding failed, staying on city:', e);
      }
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, [addressLine]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || '';
          const landmarkVal = addr.suburb || addr.city_district || addr.city || '';
          
          setAddressLine(prev => prev || road);
          setLandmark(prev => prev || landmarkVal);
        }
      }
    } catch (e) {
      console.error('Reverse geocoding failed:', e);
    }
  };

  const clearForm = () => {
    setReceiverName('');
    setReceiverMobile('');
    setFlatNo('');
    setAddressLine('');
    setLandmark('');
    setCity('');
    setLatitude(null);
    setLongitude(null);
    setEditingAddressId(null);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        reverseGeocode(lat, lng);
      },
      (err) => {
        alert('Failed to get current location. Please allow location access.');
      }
    );
  };

  const handleSave = () => {
    if (!receiverName.trim() || !receiverMobile.trim() || !flatNo.trim() || !addressLine.trim() || !landmark.trim() || !city.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    if (receiverMobile.trim().length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSaving(true);

    const payload = {
      id: editingAddressId || undefined,
      type: addressType,
      receiverName: receiverName.trim(),
      receiverMobile: receiverMobile.trim(),
      flatNo: flatNo.trim(),
      addressLine: addressLine.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      latitude: latitude || 28.6139,
      longitude: longitude || 77.2090,
    };

    saveAddress(payload);

    setTimeout(() => {
      setIsSaving(false);
      router.push('/');
    }, 300);
  };

  const handleDeleteAddress = (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      deleteAddress(id);
    }
  };

  const handleSetActive = (id) => {
    setActiveAddressById(id);
    router.push('/');
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case 'Home': return <Home size={18} />;
      case 'Office':
      case 'Work': return <Briefcase size={18} />;
      default: return <MapPin size={18} />;
    }
  };

  const isFormValid = receiverName.trim() && receiverMobile.trim().length >= 10 && flatNo.trim() && addressLine.trim() && landmark.trim() && city.trim();

  return (
    <div className={styles.addressPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Manage Addresses</h1>
      </div>

      <div className={styles.pageContent}>
        {/* Saved Addresses */}
        {addresses.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Saved Addresses</h3>
            <div className={styles.addressList}>
              {addresses.map((item) => {
                const isActive = activeAddress && activeAddress.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`${styles.addressCard} ${isActive ? styles.addressCardActive : ''}`}
                    onClick={() => handleSetActive(item.id)}
                  >
                    <div className={styles.addressLeft}>
                      <div className={styles.addressIconWrap}>
                        {getAddressIcon(item.type)}
                      </div>
                      <div className={styles.addressInfo}>
                        <span className={styles.addressType}>
                          {item.type} {isActive && <span className={styles.activeBadge}>(Active)</span>}
                        </span>
                        {item.receiverName && item.receiverMobile && (
                          <span className={styles.addressReceiver}>
                            {item.receiverName} • {item.receiverMobile}
                          </span>
                        )}
                        <span className={styles.addressDetail}>
                          {item.flatNo}, {item.addressLine}. Landmark: {item.landmark}. City: {item.city || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.addressActions}>
                      {isActive && <Check size={18} className={styles.checkIcon} />}
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => { e.stopPropagation(); handleDeleteAddress(item.id); }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {editingAddressId ? `Edit ${addressType} Address` : `Add New Address`}
          </h3>

          <div className={styles.formCard}>
            <div className={styles.formLayout}>
              <div className={styles.formFieldsCol}>
                {/* Type Pills */}
                <div className={styles.typePillRow}>
                  {ADDRESS_TYPES.map((type) => (
                    <button
                      key={type}
                      className={`${styles.typePill} ${addressType === type ? styles.typePillActive : ''}`}
                      onClick={() => setAddressType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Form Fields */}
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Receiver's Full Name"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <input
                      type="tel"
                      className={styles.formInput}
                      placeholder="Receiver's Mobile Number"
                      value={receiverMobile}
                      onChange={(e) => setReceiverMobile(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={10}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <select
                      className={styles.formSelect}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    >
                      <option value="" disabled>Select Delivery City</option>
                      {(() => {
                        const displayCities = [...availableCities];
                        if (city && !displayCities.includes(city)) {
                          displayCities.push(city);
                        }
                        return displayCities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Area / Sector / Street / Locality"
                      value={addressLine}
                      onChange={(e) => { isTypingRef.current = true; setAddressLine(e.target.value); }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Flat / House No. / Floor / Building"
                      value={flatNo}
                      onChange={(e) => setFlatNo(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Nearby Landmark (e.g. Near Mall)"
                      value={landmark}
                      onChange={(e) => { isTypingRef.current = true; setLandmark(e.target.value); }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.mapCol}>
                {/* Map */}
                <div className={styles.mapContainer}>
                  <div ref={mapRef} className={styles.mapView} />
                  <button className={styles.currentLocationBtn} onClick={handleCurrentLocation}>
                    <Navigation size={14} />
                    <span>Current Location</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
            >
              {isSaving ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
