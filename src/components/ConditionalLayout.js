"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import AppDownloadModal from './AppDownloadModal';
import styles from '../app/page.module.css';

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const hideLayout = pathname === '/login' || pathname === '/otp' || pathname === '/addresses' || pathname === '/terms' || pathname === '/privacy' || pathname === '/contact' || pathname === '/profile' || pathname.startsWith('/product/') || (pathname.startsWith('/orders/') && pathname !== '/orders');
  const isStaticAppPage = pathname === '/about';
  const isProductPage = pathname.startsWith('/product/');

  if (hideLayout) {
    return (
      <main style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <AppDownloadModal />
        {children}
      </main>
    );
  }

  return (
    <div className={`${styles.mainContainer} ${isStaticAppPage ? 'about-page-layout' : ''} ${isProductPage ? 'product-page-layout' : ''}`}>
      <AppDownloadModal />
      {!isProductPage && (
        <div className="web-navbar-wrapper">
          <Navbar />
        </div>
      )}
      <main className={styles.contentContainer}>
        {children}
      </main>
      <div className="web-footer-wrapper">
        <Footer />
      </div>
    </div>
  );
}
