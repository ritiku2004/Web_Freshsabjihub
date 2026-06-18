"use client";

import React, { useContext, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Store, LayoutGrid, ShoppingCart, RotateCcw, User, Bell, ChevronDown, Search, Mic, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import LocationModal from './LocationModal';
import styles from './Navbar.module.css';

export default function Navbar({ 
  categoryTitle = 'All Categories', 
  hasBackButton = false, 
  onBack 
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  let activeTab = 'home';
  if (pathname === '/cart') activeTab = 'cart';
  else if (pathname.startsWith('/categories')) activeTab = 'categories';
  else if (pathname.startsWith('/orders')) activeTab = 'orders';

  const { activeAddress, deliveryETA, serviceAvailable } = useContext(AuthContext);
  const { cartTotalQuantity } = useContext(CartContext);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const formatAddress = (addr) => {
    if (!addr) return 'Select Location';
    if (addr.flatNo === 'Zipcode Check') return addr.addressLine;
    return `${addr.type} - ${addr.flatNo}, ${addr.addressLine}`;
  };

  return (
    <>
      {/* Top Header for Desktop & Mobile */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          
          {/* Left Section: Logo & Delivery Info */}
          <div className={styles.leftSection}>
            <div className={styles.logo} onClick={() => router.push('/')}>
              <span className={styles.leafIcon}>🌿</span>
              <span className={styles.brandName}>Fresh Sabji Hub</span>
            </div>

            <div className={styles.deliverySelector} onClick={() => setIsLocationOpen(true)}>
              <span className={styles.deliverLabel}>Deliver in</span>
              <span className={styles.etaText}>
                {serviceAvailable ? (deliveryETA ? `${deliveryETA} mins` : '---') : 'Out of Zone'}
              </span>
              <div className={styles.addressRow}>
                <span className={styles.addressText}>{formatAddress(activeAddress)}</span>
                <ChevronDown size={14} className={styles.chevron} />
              </div>
            </div>
          </div>

          {/* Center Section: Search Bar */}
          <div className={styles.searchSection}>
            <div className={styles.searchBar}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder='Search "atta"'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Mic size={18} className={styles.micIcon} />
            </div>
          </div>

          {/* Right Section: Utility Actions */}
          <div className={styles.rightSection}>
            <div className={styles.utilityActions}>
              <button className={styles.actionBtn}>
                <div className={styles.bellWrapper}>
                  <Bell size={18} />
                  <span className={styles.bellBadge}>2</span>
                </div>
              </button>

              <button className={`${styles.actionBtn} ${styles.profileBtn}`}>
                <User size={18} />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Sticky Bottom Tab Bar for Mobile Viewports */}
      <div className={styles.bottomTabBar}>
        <button
          className={`${styles.tabItem} ${activeTab === 'home' ? styles.activeTab : ''}`}
          onClick={() => router.push('/')}
        >
          <div className={styles.indicatorLine} />
          <Store size={22} />
          <span>Home</span>
        </button>

        <button
          className={`${styles.tabItem} ${activeTab === 'categories' ? styles.activeTab : ''}`}
          onClick={() => router.push('/categories')}
        >
          <div className={styles.indicatorLine} />
          <LayoutGrid size={22} />
          <span>Categories</span>
        </button>

        <button
          className={`${styles.tabItem} ${activeTab === 'cart' ? styles.activeTab : ''}`}
          onClick={() => router.push('/cart')}
        >
          <div className={styles.indicatorLine} />
          <div className={styles.cartIconWrapper}>
            <ShoppingCart size={22} className={cartTotalQuantity > 0 ? styles.pulseCart : ''} />
            {cartTotalQuantity > 0 && (
              <span className={styles.cartBadge}>{cartTotalQuantity}</span>
            )}
          </div>
          <span>Cart</span>
        </button>

        <button
          className={`${styles.tabItem} ${activeTab === 'orders' ? styles.activeTab : ''}`}
          onClick={() => router.push('/orders')}
        >
          <div className={styles.indicatorLine} />
          <RotateCcw size={20} />
          <span>Order Again</span>
        </button>
      </div>

      <LocationModal isOpen={isLocationOpen} onClose={() => setIsLocationOpen(false)} />
    </>
  );
}
