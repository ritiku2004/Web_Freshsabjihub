"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import AppDownloadModal from './AppDownloadModal';
import SplashScreen from './SplashScreen';
import styles from '../app/page.module.css';

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const hideLayout = pathname === '/login' || pathname === '/otp' || pathname === '/addresses' || pathname === '/about' || pathname === '/terms' || pathname === '/privacy' || pathname === '/contact' || pathname === '/profile' || pathname.startsWith('/product/') || (pathname.startsWith('/orders/') && pathname !== '/orders');
  const isStaticAppPage = pathname === '/about';
  const isProductPage = pathname.startsWith('/product/');

  return (
    <>
      <SplashScreen />
      {hideLayout ? (
        <main style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
          <AppDownloadModal />
          {children}
        </main>
      ) : (
        <div className={`${styles.mainContainer} ${isStaticAppPage ? 'about-page-layout' : ''} ${isProductPage ? 'product-page-layout' : ''}`}>
          <AppDownloadModal />
          {!isProductPage && (
            <div className="web-navbar-wrapper">
              <React.Suspense fallback={<div style={{ height: '70px', backgroundColor: '#0f7643' }} />}>
                <Navbar />
              </React.Suspense>
            </div>
          )}
          <main className={styles.contentContainer}>
            {children}
          </main>
          <div className="web-footer-wrapper">
            <Footer />
          </div>
        </div>
      )}
    </>
  );
}
