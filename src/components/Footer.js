"use client";

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import styles from './Footer.module.css';

export default function Footer() {
  const router = useRouter();
  const { activeShop } = useContext(AuthContext);

  // Fetch real categories dynamically matching homepage/categories page logic
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', activeShop?.id],
    queryFn: () => api.getCategories(activeShop?.id),
    enabled: !!activeShop?.id,
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Split categories evenly across 3 columns
  const colSize = Math.ceil(categories.length / 3);
  const col1 = categories.slice(0, colSize);
  const col2 = categories.slice(colSize, colSize * 2);
  const col3 = categories.slice(colSize * 2);

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* India's Fresh Grocery App - App Home Style Header */}
        <div className={styles.appBrandedHeader}>
          <h2 className={styles.appBrandedTitle}>India's fresh grocery app ❤️</h2>
          <div className={styles.appBrandedSub}>fresh sabji hub</div>
          <div className={styles.brandDivider} />
        </div>

        {/* 1. Main Links & Categories Grid */}
        <div className={styles.grid}>
          
          {/* Left Side: Useful Links */}
          <div className={styles.usefulLinksSection}>
            <h3 className={styles.sectionHeading}>Useful Links</h3>
            <div className={styles.linksSubGrid} style={{ gridTemplateColumns: '1fr' }}>
              <div className={styles.linkColumn}>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="#contact">Contact Support</a>
              </div>
            </div>
          </div>

          {/* Right Side: Dynamic Categories */}
          <div className={styles.categoriesSection}>
            <h3 className={styles.sectionHeading}>
              Categories 
              <button onClick={() => router.push('/categories')} className={styles.seeAllGreen}>
                see all
              </button>
            </h3>
            <div className={styles.linksSubGrid}>
              <div className={styles.linkColumn}>
                {col1.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => router.push(`/categories?cat=${cat.id}`)}
                    className={styles.dynamicCategoryBtn}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className={styles.linkColumn}>
                {col2.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => router.push(`/categories?cat=${cat.id}`)}
                    className={styles.dynamicCategoryBtn}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className={styles.linkColumn}>
                {col3.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => router.push(`/categories?cat=${cat.id}`)}
                    className={styles.dynamicCategoryBtn}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bottom App and Social Row */}
        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            © Fresh Sabji Hub Private Limited, 2026
          </div>
          
          <div className={styles.downloadAppsSection}>
            <span className={styles.downloadLabel}>Download App</span>
            <div className={styles.appBadgeRow}>
              <a 
                href="https://play.google.com/store/apps/freshcart" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.appBadge} 
                aria-label="Get it on Google Play"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  shapeRendering="geometricPrecision" 
                  textRendering="geometricPrecision" 
                  imageRendering="optimizeQuality" 
                  fillRule="evenodd" 
                  clipRule="evenodd"
                  viewBox="0 0 466 511.98" 
                  width="18" 
                  height="18"
                >
                  <g id="Layer_x0020_1">
                    <path fill="#EA4335" fillRule="nonzero" d="M199.9 237.8l-198.5 232.37c7.22,24.57 30.16,41.81 55.8,41.81 11.16,0 20.93,-2.79 29.3,-8.37l0 0 244.16 -139.46 -130.76 -126.35z"/>
                    <path fill="#FBBC04" fillRule="nonzero" d="M433.91 205.1l0 0 -104.65 -60 -111.61 110.22 113.01 108.83 104.64 -58.6c18.14,-9.77 30.7,-29.3 30.7,-50.23 -1.4,-20.93 -13.95,-40.46 -32.09,-50.22z"/>
                    <path fill="#34A853" fillRule="nonzero" d="M199.42 273.45l129.85 -128.35 -241.37 -136.73c-8.37,-5.58 -19.54,-8.37 -30.7,-8.37 -26.5,0 -50.22,18.14 -55.8,41.86 0,0 0,0 0,0l198.02 231.59z"/>
                    <path fill="#4285F4" fillRule="nonzero" d="M1.39 41.86c-1.39,4.18 -1.39,9.77 -1.39,15.34l0 397.64c0,5.57 0,9.76 1.4,15.34l216.27 -214.86 -216.28 -213.46z"/>
                  </g>
                </svg>
                <div className={styles.appBadgeText}>
                  <span className={styles.appBadgeSub}>GET IT ON</span>
                  <span className={styles.appBadgeTitle}>Google Play</span>
                </div>
              </a>
            </div>
          </div>

          <div className={styles.socialBadgesRow}>
            <a href="#facebook" className={styles.blackSocialBtn} aria-label="Facebook" title="Facebook">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
            </a>
            <a href="#twitter" className={styles.blackSocialBtn} aria-label="Twitter" title="Twitter">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#instagram" className={styles.blackSocialBtn} aria-label="Instagram" title="Instagram">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#linkedin" className={styles.blackSocialBtn} aria-label="LinkedIn" title="LinkedIn">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
