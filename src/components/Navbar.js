"use client";

import React, { useContext, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Store, LayoutGrid, ShoppingCart, RotateCcw, User, Bell, ChevronDown, Search, Mic, ArrowLeft, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import LocationModal from './LocationModal';
import styles from './Navbar.module.css';
import { API_BASE_URL } from '../services/api';

export default function Navbar({ 
  categoryTitle = 'All Categories', 
  hasBackButton = false, 
  onBack 
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  let activeTab = 'home';
  if (pathname === '/cart') activeTab = 'cart';
  else if (pathname.startsWith('/categories')) activeTab = 'categories';
  else if (pathname.startsWith('/orders')) activeTab = 'orders';

  const { activeAddress, deliveryETA, serviceAvailable, isAuthenticated, user } = useContext(AuthContext);
  const { cartTotalQuantity } = useContext(CartContext);
  const { unreadCount } = useNotifications();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync searchQuery with URL q param
  const q = searchParams.get('q') || '';
  useEffect(() => {
    setSearchQuery(q);
  }, [q]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (pathname === '/search') {
      if (val.trim() === '') {
        router.push('/');
      } else {
        router.replace(`/search?q=${encodeURIComponent(val)}`);
      }
    } else {
      router.push(`/search?q=${encodeURIComponent(val)}`);
    }
  };

  const handleInputClick = () => {
    if (pathname !== '/search') {
      router.push('/search');
    }
  };

  const handleBlur = () => {
    if (pathname !== '/search') return;
    
    // Slight delay to allow click events on suggestions/pills/product cards to register first
    setTimeout(() => {
      // Prevent redirect if user is hovering/interacting with the search page content (pills, cards, etc.)
      if (
        document.querySelector('[class*="searchContainer"]:hover') ||
        document.querySelector('[class*="resultsGrid"]:hover') ||
        document.querySelector('[class*="emptyResults"]:hover')
      ) {
        return;
      }

      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.closest('[class*="searchContainer"]') || 
        activeEl.closest('[class*="ProductCard"]') ||
        activeEl.closest('button') ||
        activeEl.closest('a')
      )) {
        return; // Prevent redirect if user clicked a valid interactive element in search page
      }
      
      router.push('/');
    }, 250);
  };

  const formatAddress = (addr) => {
    if (!addr) return 'Select Location';
    if (addr.flatNo === 'Zipcode Check') return addr.addressLine;
    return `${addr.type} - ${addr.flatNo}, ${addr.addressLine}`;
  };

  const isCategoryDetailsPage = pathname.startsWith('/categories') && searchParams.get('cat');

  return (
    <>
      {/* Top Header for Desktop & Mobile */}
      <header className={`${styles.header} ${isCategoryDetailsPage ? styles.categoryDetailsHeader : ''}`}>
        <div className={styles.headerContainer}>
          
          {/* Left Section: Logo */}
          <div className={styles.leftSection}>
            <div className={styles.logo} onClick={() => router.push('/')}>
              <img src="/logo.png" alt="Fresh Sabji Hub Logo" className={styles.logoImage} />
              <span className={styles.brandName}>Fresh Sabji Hub</span>
            </div>
          </div>

          {/* Center Left Section: Refined Delivery Info */}
          <div className={styles.deliverySection} onClick={() => router.push('/addresses')}>
            <div className={styles.etaBadge}>
              <span className={styles.deliverLabel}>{!activeAddress ? 'SET YOUR' : 'DELIVER IN'}</span>
              <span className={styles.etaText}>
                {!activeAddress ? 'Location' : serviceAvailable ? (deliveryETA ? `${deliveryETA} MINS` : '---') : 'Out of Zone'}
              </span>
            </div>
            <div className={styles.addressBox}>
              <span className={styles.addressText}>{formatAddress(activeAddress)}</span>
              <ChevronDown size={14} className={styles.chevron} />
            </div>
          </div>

          {/* Center Section: Search Bar */}
          <div className={styles.searchSection}>
            <div className={styles.searchBar}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder='Search "coke"'
                value={searchQuery}
                onClick={handleInputClick}
                onChange={handleSearchChange}
                onBlur={handleBlur}
              />
              {searchQuery ? (
                <X 
                  size={18} 
                  style={{ cursor: 'pointer', color: '#64748b' }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                    router.push('/');
                  }}
                />
              ) : (
                <Mic 
                  size={18} 
                  className={styles.micIcon} 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/search?startVoice=true');
                  }}
                />
              )}
            </div>
          </div>

          {/* Right Section: Profile & Notifications */}
          <div className={styles.rightSection}>
            <div className={styles.bellWrapper}>
              <button className={styles.bellBtn} onClick={() => router.push(isAuthenticated ? '/notifications' : '/login')} aria-label="Notifications">
                <Bell size={20} />
                {isAuthenticated && unreadCount > 0 && (
                  <span className={styles.bellBadge}>{unreadCount}</span>
                )}
              </button>
            </div>
            
            {/* Profile Button (Icon/Avatar if logged in, Login button otherwise) */}
            {isAuthenticated ? (
              (() => {
                const displayName = user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') || 'Guest User';
                const userInitials = displayName
                  ? displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'U';
                
                const avatarUri = user?.profile_picture_url && (
                  user.profile_picture_url.startsWith('/') || 
                  user.profile_picture_url.startsWith('uploads/') || 
                  user.profile_picture_url.startsWith('http://') || 
                  user.profile_picture_url.startsWith('https://')
                ) ? (
                  user.profile_picture_url.startsWith('http://') || user.profile_picture_url.startsWith('https://')
                    ? user.profile_picture_url
                    : `${API_BASE_URL.replace('/api/v1', '')}/${user.profile_picture_url.replace(/^\//, '')}`
                ) : null;

                const PRESET_AVATARS = [
                  { emoji: '🍅', color: '#FEE2E2' },
                  { emoji: '🥦', color: '#D1FAE5' },
                  { emoji: '🥕', color: '#FFEDD5' },
                  { emoji: '🥑', color: '#E0F2FE' },
                  { emoji: '🍓', color: '#FFF1F2' },
                  { emoji: '🍋', color: '#FEF9C3' },
                  { emoji: '🍇', color: '#F3E8FF' },
                  { emoji: '🍉', color: '#ECFDF5' },
                  { emoji: '🍎', color: '#FEF2F2' },
                ];

                const hasEmojiAvatar = user?.profile_picture_url && PRESET_AVATARS.some((a) => a.emoji === user.profile_picture_url);
                const activeAvatarColor = user?.profile_picture_url
                  ? PRESET_AVATARS.find((a) => a.emoji === user.profile_picture_url)?.color || '#10b981'
                  : '#10b981';

                return (
                  <button 
                    className={styles.profileCircleBtn}
                    onClick={() => router.push('/profile')}
                    aria-label="Profile"
                    style={{ 
                      backgroundColor: (hasEmojiAvatar || !avatarUri) ? activeAvatarColor : 'white',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {avatarUri ? (
                      <img
                        src={avatarUri}
                        alt={displayName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : hasEmojiAvatar ? (
                      <span style={{ fontSize: '15px', display: 'block', lineHeight: '1' }}>{user.profile_picture_url}</span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'white' }}>{userInitials}</span>
                    )}
                  </button>
                );
              })()
            ) : (
              <button 
                className={styles.loginBtn}
                onClick={() => router.push('/login')}
              >
                Login
              </button>
            )}

            {/* Cart Button (Pill on desktop, hidden on mobile) */}
            <button 
              className={`${styles.actionBtn} ${styles.cartNavBtn} ${styles.desktopOnly}`}
              onClick={() => router.push('/cart')}
              style={{ position: 'relative' }}
            >
              <div className={styles.cartIconWrapper} style={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCart size={18} />
              </div>
              <span className={styles.cartNavText}>Cart</span>
              {cartTotalQuantity > 0 && (
                <span className={styles.cartBadge} style={{ top: '-6px', right: '-6px', zIndex: 10 }}>{cartTotalQuantity}</span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Handle dynamic Categories header toggle on mobile */}
      {!isCategoryDetailsPage && (
        <div className={`${styles.categoriesHeaderMobile}`}>
          <h1 className={styles.headerTitle}>{categoryTitle}</h1>
        </div>
      )}

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
          onClick={() => router.push(isAuthenticated ? '/orders' : '/login')}
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
