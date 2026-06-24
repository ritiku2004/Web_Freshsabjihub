"use client";

import React, { useState, useEffect } from 'react';
import styles from './AppDownloadModal.module.css';

export default function AppDownloadModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the modal
    const isDismissed = localStorage.getItem('hideAppDownloadModal');
    if (isDismissed === 'true') {
      return;
    }

    // Helper to check mobile user agents or small screens
    const checkDevice = () => {
      if (localStorage.getItem('hideAppDownloadModal') === 'true') {
        setIsOpen(false);
        return;
      }
      const isSmallScreen = window.innerWidth <= 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      if (isSmallScreen || isMobileUA) {
        setIsOpen(true);
      }
    };

    // Run check on mount
    checkDevice();

    // Listen to resize events in case developer is testing on responsive views
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('hideAppDownloadModal', 'true');
  };

  const handleDownload = () => {
    // Open Play Store link (using standard package store link found in project codebase)
    window.open('https://play.google.com/store/apps/freshcart', '_blank');
    handleDismiss(); // Also hide the modal after clicking download
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modalWrapper}>
        {/* Floating Close Button */}
        <button className={styles.closeButton} onClick={handleDismiss} aria-label="Close modal">
          ✕
        </button>

        <div className={styles.modalContainer}>
          {/* Top Yellow Banner Mockups */}
          <div className={styles.bannerSection}>
            <img 
              src="/app_mockup_banner.png" 
              alt="App Preview" 
              className={styles.bannerImage}
            />
            {/* Custom SVG Wave Separator */}
            <svg className={styles.waveSeparator} viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path 
                fill="#ffffff" 
                d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,213.3C840,213,960,171,1080,144C1200,117,1320,107,1380,101.3L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
              ></path>
            </svg>
            
            {/* Logo Badge Overlap */}
            <div className={styles.logoContainer}>
              <img 
                src="/logo.png" 
                alt="Fresh Sabji Hub Logo" 
                className={styles.logo}
              />
            </div>
          </div>

          {/* Text and Actions Content */}
          <div className={styles.contentSection}>
            <p className={styles.subHeading}>Get the fresh sabji hub app for</p>
            <h2 className={styles.heading}>App exclusive features</h2>
            <p className={styles.highlightText}>Including fresh organic delivery</p>

            <button className={styles.downloadButton} onClick={handleDownload}>
              Download the app now
            </button>

            <button className={styles.continueButton} onClick={handleDismiss}>
              Continue on web
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
