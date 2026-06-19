"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import styles from '../app/page.module.css';

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const hideLayout = pathname === '/login' || pathname === '/otp' || pathname === '/addresses';
  const isStaticAppPage = pathname === '/about' || pathname === '/contact' || pathname === '/privacy';

  if (hideLayout) {
    return (
      <main style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
        {children}
      </main>
    );
  }

  return (
    <div className={`${styles.mainContainer} ${isStaticAppPage ? 'about-page-layout' : ''}`}>
      <div className="web-navbar-wrapper">
        <Navbar />
      </div>
      <main className={styles.contentContainer}>
        {children}
      </main>
      <div className="web-footer-wrapper">
        <Footer />
      </div>
    </div>
  );
}
