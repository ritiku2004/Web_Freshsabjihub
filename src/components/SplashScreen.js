"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './SplashScreen.module.css';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if splash screen has been shown in the current session
    const hasShown = sessionStorage.getItem('hasShownSplash');
    if (!hasShown) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('hasShownSplash', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className={styles.splashOverlay}>
      <div className={styles.splashContent}>
        {/* Logo Container */}
        <div className={styles.logoContainer}>
          <img 
            src="/logo.png" 
            alt="Fresh Sabji Hub Logo" 
            className={styles.logoImage} 
          />
        </div>

        {/* Branding Container */}
        <div className={styles.brandingContainer}>
          <h1 className={styles.brandTitle}>Fresh Sabji Hub</h1>
          <div className={styles.divider} />
          <p className={styles.tagline}>
            Fresh vegetables & fruits delivered to your doorstep
          </p>
        </div>
      </div>
    </div>
  );
}
